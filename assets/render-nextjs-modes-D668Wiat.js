var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>一个博客站，文章页每个人看到的都一样，评论区和登录状态因人而异。在 Pages Router 时代，你要给整个页面选 <code>getStaticProps</code>（SSG）或 <code>getServerSideProps</code>（SSR）；到了 App Router，页面默认是服务端组件，Next.js 看你在组件里用了什么，自己决定哪部分在构建时生成，哪部分在请求时生成。</p>
<p>规则是这样的：没有用到 <code>cookies()</code>、<code>headers()</code>、<code>searchParams</code>、<code>draftMode()</code> 这些请求时 API 的部分，默认预渲染，结果可以放到 CDN 上，这就是 SSG。用到了，就变成请求时渲染，也就是 SSR。想让预渲染的页面过一段时间更新，就在路由里写 <code>export const revalidate = 60</code>，或者数据变化后调用 <code>revalidatePath</code>、<code>revalidateTag</code>，这就是 ISR。</p>
<p>这样做的好处是不用为整页做二选一。Next.js 官方把它描述为“静态和动态的边界在组件级，而不是路由级”：一个页面可以有立即返回的静态外壳，动态部分放在 <code>Suspense</code> 里流式补上。</p>
<p>要注意版本：以上按 Next.js 16 的 App Router 文档。16 版新建项目默认开启 Cache Components，缓存要用 <code>&#x27;use cache&#x27;</code> 显式声明；没开启时沿用旧模型。另外 ISR、Server Actions 等都需要 Node.js 服务器，用 <code>output: &#x27;export&#x27;</code> 导出成纯静态站时不支持。</p>
</blockquote>
<h2>先分清 App Router 和 Pages Router</h2>
<p>Next.js 有两套路由。官方文档的定义是：App Router 是较新的路由，支持服务端组件等新 React 特性；Pages Router 是最初的路由，仍然受支持。App Router 放在 <code>app/</code> 目录，Pages Router 放在 <code>pages/</code> 目录。</p>
<p><code>getStaticProps</code>、<code>getServerSideProps</code>、<code>getStaticPaths</code> 只属于 Pages Router。面试时如果说“Next.js 用 getServerSideProps 做 SSR”，最好补一句“这是 Pages Router 的写法”。三种渲染方式本身的取舍见<a href="/questions/render-ssr-ssg/">《CSR、SSR、SSG 和混合渲染如何选择？》</a>，这里只讲 Next.js 里怎么落地。</p>
<h2>App Router 里什么时候是静态，什么时候是动态</h2>
<p>官方术语表把“预渲染”定义为在构建时或在重新验证时于后台渲染组件，结果是 HTML 和 RSC Payload，可以缓存并从 CDN 提供；没有使用请求时 API 的组件默认就会预渲染。反过来，组件一旦用了请求时 API，就会转为“动态渲染”，在请求时渲染。</p>
<p>请求时 API 包括 <code>cookies()</code>、<code>headers()</code>、<code>searchParams</code> 和 <code>draftMode()</code>。所以判断一个页面是 SSG 还是 SSR，不看你写了哪个函数名，而是看它读没读请求相关的数据。</p>
<p>没开 Cache Components 时，还可以用路由段配置强制指定：<code>export const dynamic = &#x27;force-dynamic&#x27;</code> 让路由在每次请求时为每个用户渲染；<code>&#x27;force-static&#x27;</code> 强制预渲染，并让 <code>cookies()</code>、<code>headers()</code>、<code>useSearchParams()</code> 返回空值。</p>
<h2>ISR 在 App Router 里怎样写</h2>
<p>下面是官方 ISR 指南里的结构（未开启 Cache Components 的写法）：</p>
<div class="not-prose code-block"><div class="code-language">TSX</div><pre><code class="hljs language-tsx"><span class="hljs-comment">// app/blog/[id]/page.tsx</span>
<span class="hljs-keyword">export</span> <span class="hljs-keyword">const</span> revalidate = <span class="hljs-number">60</span>;

<span class="hljs-keyword">export</span> <span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">generateStaticParams</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">const</span> posts = <span class="hljs-keyword">await</span> <span class="hljs-title function_">fetch</span>(<span class="hljs-string">&#x27;https://api.vercel.app/blog&#x27;</span>).<span class="hljs-title function_">then</span>(<span class="hljs-function">(<span class="hljs-params">res</span>) =&gt;</span> res.<span class="hljs-title function_">json</span>());
  <span class="hljs-keyword">return</span> posts.<span class="hljs-title function_">map</span>(<span class="hljs-function">(<span class="hljs-params">post</span>) =&gt;</span> ({ <span class="hljs-attr">id</span>: <span class="hljs-title class_">String</span>(post.<span class="hljs-property">id</span>) }));
}

<span class="hljs-keyword">export</span> <span class="hljs-keyword">default</span> <span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">Page</span>(<span class="hljs-params">{ params }</span>) {
  <span class="hljs-keyword">const</span> { id } = <span class="hljs-keyword">await</span> params;
  <span class="hljs-keyword">const</span> post = <span class="hljs-keyword">await</span> <span class="hljs-title function_">fetch</span>(<span class="hljs-string">\`https://api.vercel.app/blog/<span class="hljs-subst">\${id}</span>\`</span>).<span class="hljs-title function_">then</span>(<span class="hljs-function">(<span class="hljs-params">res</span>) =&gt;</span> res.<span class="hljs-title function_">json</span>());
  <span class="hljs-keyword">return</span> <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">h1</span>&gt;</span>{post.title}<span class="hljs-tag">&lt;/<span class="hljs-name">h1</span>&gt;</span></span>;
}
</code></pre></div>
<p>官方对这个例子的说明可以归纳成几步。<code>next build</code> 时，按 <code>generateStaticParams</code> 返回的列表给每篇文章预渲染一个页面。60 秒内的请求都直接拿缓存。60 秒过后，下一个请求仍然先拿到旧页面，同时后台开始重新生成。生成成功后，再下一个请求才拿到新页面。如果请求了构建时没生成的 <code>/blog/26</code> 且文章存在，会按需生成；文章不存在则返回 404。</p>
<p>所以 ISR 的“过期”不是定时器到点就重建，而是“过期后的第一个请求触发后台重建”。官方建议把时间设长一些，比如一小时，需要更精确就用按需失效。还要注意，<code>revalidatePath</code> 只是让缓存失效，重新生成发生在下一次请求时。</p>
<h2>Cache Components 改变了什么</h2>
<p>Next.js 16 文档写明，用推荐的 <code>create-next-app</code> 默认配置新建的 App Router 项目，已经开启了 Cache Components；已有项目需要在 <code>next.config.ts</code> 里设置 <code>cacheComponents: true</code>。</p>
<p>开启后，缓存靠 <code>&#x27;use cache&#x27;</code> 指令显式声明，可以放在异步函数或组件顶部。需要每次请求都拿新数据的组件不要加 <code>&#x27;use cache&#x27;</code>，而是包在 <code>&lt;Suspense&gt;</code> 里：fallback 随预渲染的静态外壳一起发出，异步部分在请求时运行并流式补上。这就是官方说的“部分预渲染”。缓存时长、标签和失效的细节见<a href="/questions/render-next-cache/">《Next.js App Router 中的几层缓存怎样区分？》</a>。</p>
<p>这种组件级边界也有代价。官方“渲染理念”一文指出，它把复杂度从应用代码转移到了托管平台：需要支持流式响应；多实例部署时要协调缓存失效；HTML 和 RSC Payload 要保持一致。</p>
<h2>能不能部署到纯静态托管</h2>
<p>可以，但只能用一部分功能。在 <code>next.config</code> 里设置 <code>output: &#x27;export&#x27;</code>，构建结果是一组静态文件。官方列出的不支持项包括：没有 <code>generateStaticParams</code> 或开着 <code>dynamicParams: true</code> 的动态路由、依赖请求的 Route Handler、<code>cookies</code>、rewrites、redirects、headers、Proxy、ISR、默认 loader 的图片优化、Draft Mode 和 Server Actions。</p>
<h2>常见追问</h2>
<p><strong>App Router 里所有组件都在服务端渲染吗？</strong></p>
<blockquote>
<p>页面和布局默认是服务端组件。需要交互或浏览器 API 时，用 <code>&#x27;use client&#x27;</code> 声明客户端组件。客户端组件在首次加载时同样会被服务端渲染成 HTML，再在浏览器 hydration，区别是它的代码会发到浏览器。两者关系见<a href="/questions/render-server-components/">《React Server Components 和 SSR 是同一件事吗？》</a>。</p>
</blockquote>
<p><strong>ISR 和 SSR 加 CDN 缓存有什么区别？</strong></p>
<blockquote>
<p>效果相近，都是先返回缓存、过期后更新。区别是 ISR 由 Next.js 管理：它知道哪些页面要预生成，能按路径或标签精确失效，并自动加上合适的 <code>Cache-Control</code> 响应头。自己在 CDN 上缓存 SSR 结果，失效规则就得自己维护。</p>
</blockquote>
<p><strong><code>generateStaticParams</code> 没列出的路径会怎样？</strong></p>
<blockquote>
<p>默认 <code>dynamicParams</code> 为 true，首次请求时按需生成并缓存。设成 false 时，未列出的路径直接返回 404。</p>
</blockquote>`};export{e as default};