var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>比如用户没登录就访问 <code>/dashboard</code>，想在页面渲染之前把他重定向到 <code>/login</code>。Next.js 提供了一个放在项目根目录的文件，以前叫 <code>middleware.ts</code>，16 版起改名为 <code>proxy.ts</code>，它在路由渲染之前拿到请求，可以重定向、重写、改请求头和响应头、读写 Cookie，或者直接返回一个响应。</p>
<p>改名的原因是“middleware”容易让人联想到 Express 中间件，以为什么逻辑都能往里塞。官方的定位是：它像应用前面的一层网络代理，能独立于渲染代码运行，优化情况下还能部署到 CDN，所以不要依赖共享模块或全局变量。16 版起它默认使用 Node.js 运行时，而且不能再通过 <code>runtime</code> 配置切换。</p>
<p>适合放进去的是轻量、基于请求本身就能判断的逻辑：按 Cookie 是否存在做乐观的登录跳转、按语言或实验分组重写路径、加安全响应头、处理 CORS。官方明确说建议把它作为最后手段，没有别的办法时才用它。</p>
<p>要注意，Proxy 不能当成唯一的鉴权关口。2025 年的 CVE-2025-29927 允许外部请求带上内部的 <code>x-middleware-subrequest</code> 头直接跳过 Middleware；而且 Server Function 只是对所在路由的 POST 请求，matcher 漏掉某个路径，那里的 Server Function 也就没被保护。所以每个 Server Function 和数据访问层里都要再校验权限。</p>
</blockquote>
<h2>它在请求链路的哪个位置</h2>
<p>官方文档给出的执行顺序是：先应用 <code>next.config.js</code> 的 <code>headers</code> 和 <code>redirects</code>，然后执行 Proxy，接着才是 <code>beforeFiles</code> 重写、文件系统路由、<code>afterFiles</code> 重写、动态路由和 <code>fallback</code> 重写。所以 Proxy 拿到请求时页面还没开始渲染，它的决定会影响后面走哪个路由。</p>
<p>下面是一个乐观登录跳转的例子。它只检查 Cookie 在不在，不去数据库查会话：</p>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">import</span> { <span class="hljs-title class_">NextResponse</span> } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;next/server&#x27;</span>;
<span class="hljs-keyword">import</span> <span class="hljs-keyword">type</span> { <span class="hljs-title class_">NextRequest</span> } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;next/server&#x27;</span>;

<span class="hljs-keyword">export</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">proxy</span>(<span class="hljs-params"><span class="hljs-attr">request</span>: <span class="hljs-title class_">NextRequest</span></span>) {
  <span class="hljs-keyword">if</span> (!request.<span class="hljs-property">cookies</span>.<span class="hljs-title function_">has</span>(<span class="hljs-string">&#x27;session&#x27;</span>)) {
    <span class="hljs-keyword">return</span> <span class="hljs-title class_">NextResponse</span>.<span class="hljs-title function_">redirect</span>(<span class="hljs-keyword">new</span> <span class="hljs-title function_">URL</span>(<span class="hljs-string">&#x27;/login&#x27;</span>, request.<span class="hljs-property">url</span>));
  }
  <span class="hljs-keyword">return</span> <span class="hljs-title class_">NextResponse</span>.<span class="hljs-title function_">next</span>();
}

<span class="hljs-keyword">export</span> <span class="hljs-keyword">const</span> config = {
  <span class="hljs-attr">matcher</span>: <span class="hljs-string">&#x27;/dashboard/:path*&#x27;</span>,
};
</code></pre></div>
<p>读者可能会问，为什么不在这里把会话查清楚？因为 Proxy 会对每个匹配的请求都执行；在这里做慢查询，所有页面都会被拖慢。它只负责“明显没登录就别往里走”，真正的权限判断留给页面和数据层。</p>
<p><code>matcher</code> 也很关键。不写 <code>matcher</code> 时，Proxy 会对<strong>所有请求</strong>运行，包括 <code>_next/static</code>、<code>_next/image</code> 和 <code>public/</code> 下的资源，鉴权逻辑写得不小心就会把 CSS、JS、图片都拦掉。<code>matcher</code> 的值必须是常量，构建时静态分析，写成变量会被忽略。</p>
<h2>它能做哪些事</h2>
<p><code>NextResponse</code> 提供的能力是：<code>redirect</code> 跳转到另一个地址；<code>rewrite</code> 让地址栏不变但显示另一个路由的内容；通过 <code>NextResponse.next({ request: { headers } })</code> 给下游路由加请求头；设置响应头和响应 Cookie；也可以直接返回 <code>Response.json(...)</code> 之类的响应。</p>
<p>改请求头时容易写错。<code>NextResponse.next({ request: { headers } })</code> 是把头传给下游的页面和路由处理器；写成 <code>NextResponse.next({ headers })</code> 则是把这些头加到返回给浏览器的响应上，内部信息就泄露给客户端了。</p>
<p>还有一个和部署有关的限制：Proxy 需要服务器运行时，静态导出（<code>output: &#x27;export&#x27;</code>）不支持它。</p>
<h2>为什么不能只靠它做鉴权</h2>
<p>CVE-2025-29927 的起因是，Next.js 内部用 <code>x-middleware-subrequest</code> 请求头来识别和防止 Middleware 递归调用。外部请求伪造这个头，就能让 Middleware 被跳过。受影响的是用 <code>next start</code> 或 <code>output: &#x27;standalone&#x27;</code> 自托管的应用；Vercel、Netlify 和 Cloudflare Workers 的架构不受影响，静态导出本来就没有 Middleware。修复版本是 15.2.3、14.2.25、13.5.9 和 12.3.5，暂时不能升级的可以在网关上把这个头过滤掉。</p>
<p>Vercel 的事后复盘里明确写了：不建议把 Middleware 作为保护路由的唯一手段。官方 Proxy 文档也提醒，Server Function 不是单独的路由，matcher 改动或者把 Server Function 挪到别的路由，都可能悄悄失去 Proxy 的保护。所以权限要在离数据最近的地方再查一遍。</p>
<h2>从 middleware 迁移</h2>
<p>迁移只是改文件名和导出的函数名，官方提供了 codemod：</p>
<div class="not-prose code-block"><div class="code-language">bash</div><pre><code class="hljs language-bash">npx @next/codemod@canary middleware-to-proxy .
</code></pre></div>
<p>它会把 <code>middleware.ts</code> 改名为 <code>proxy.ts</code>，并把 <code>export function middleware</code> 改成 <code>export function proxy</code>。相关的配置项也跟着改了名，比如 <code>skipMiddlewareUrlNormalize</code> 变成了 <code>skipProxyUrlNormalize</code>。</p>
<p>Proxy 和页面渲染、缓存的关系，见<a href="/questions/render-nextjs-modes/">《Next.js 的 SSR、SSG、ISR 和 App Router 怎样理解？》</a>和<a href="/questions/render-next-cache/">《Next.js App Router 中的几层缓存怎样区分？》</a>。</p>
<h2>常见追问</h2>
<p><strong>Proxy 里能直接查数据库吗？</strong></p>
<blockquote>
<p>16 版默认是 Node.js 运行时，技术上能查。但它对每个匹配请求都会执行，所以官方定位它是轻量的请求拦截层。重的会话校验放到页面、Server Function 或数据访问层里做。</p>
</blockquote>
<p><strong>Proxy 怎样把信息传给页面？</strong></p>
<blockquote>
<p>官方文档列出的方式是请求头、Cookie、重写、重定向或者 URL。不要依赖模块级的全局变量，因为 Proxy 可能和渲染代码不在同一个运行环境里。</p>
</blockquote>
<p><strong>CVE-2025-29927 对哪些部署有影响？</strong></p>
<blockquote>
<p>影响用 <code>next start</code> 或 <code>output: &#x27;standalone&#x27;</code> 自托管的应用。Vercel 的路由在独立系统里执行，Netlify 和 Cloudflare Workers 也确认不受影响，静态导出没有 Middleware。修复办法是升级到对应版本线的补丁，或者在网关过滤 <code>x-middleware-subrequest</code> 头。</p>
</blockquote>`};export{e as default};