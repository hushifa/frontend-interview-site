var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>这五个都写在 <code>&lt;link rel=&quot;...&quot;&gt;</code> 里，告诉浏览器提前做点事。区分它们只要问两个问题：提前做到哪一步，为谁做。</p>
<p><code>dns-prefetch</code> 和 <code>preconnect</code> 只管连接，不下载任何文件。<code>dns-prefetch</code> 只提前查好域名，<code>preconnect</code> 把 DNS、TCP 和 TLS 握手全做完。它们只对跨域的源有用，因为同源的连接已经开着了。</p>
<p>另外三个会真的下载文件。<code>preload</code> 用于当前页面很快就要用、但浏览器发现得晚的资源，比如 CSS 里引用的字体，它以较高优先级下载并缓存，但不执行。<code>modulepreload</code> 是给 ES 模块用的 <code>preload</code>，下载后还会解析、编译，放进文档的模块映射，等着执行。<code>prefetch</code> 是为将来准备的，比如用户很可能点开的下一个页面要用的文件，它以很低的优先级下载，结果放进 HTTP 缓存。</p>
<p>要注意，这些都会占用带宽和连接，MDN 反复提醒不要什么都预加载。<code>preload</code> 字体要加 <code>crossorigin</code>；<code>prefetch</code> 受缓存分区影响，不能给别的顶层站点预取；跨站文档的预取更推荐用 Speculation Rules API。</p>
</blockquote>
<h2>先看写法</h2>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-comment">&lt;!-- 只查 DNS --&gt;</span>
<span class="hljs-tag">&lt;<span class="hljs-name">link</span> <span class="hljs-attr">rel</span>=<span class="hljs-string">&quot;dns-prefetch&quot;</span> <span class="hljs-attr">href</span>=<span class="hljs-string">&quot;https://cdn.example&quot;</span> /&gt;</span>
<span class="hljs-comment">&lt;!-- 建好连接，字体这类匿名 CORS 请求要加 crossorigin --&gt;</span>
<span class="hljs-tag">&lt;<span class="hljs-name">link</span> <span class="hljs-attr">rel</span>=<span class="hljs-string">&quot;preconnect&quot;</span> <span class="hljs-attr">href</span>=<span class="hljs-string">&quot;https://fonts.example&quot;</span> <span class="hljs-attr">crossorigin</span> /&gt;</span>
<span class="hljs-comment">&lt;!-- 当前页面要用的字体 --&gt;</span>
<span class="hljs-tag">&lt;<span class="hljs-name">link</span> <span class="hljs-attr">rel</span>=<span class="hljs-string">&quot;preload&quot;</span> <span class="hljs-attr">href</span>=<span class="hljs-string">&quot;/fonts/main.woff2&quot;</span> <span class="hljs-attr">as</span>=<span class="hljs-string">&quot;font&quot;</span> <span class="hljs-attr">type</span>=<span class="hljs-string">&quot;font/woff2&quot;</span> <span class="hljs-attr">crossorigin</span> /&gt;</span>
<span class="hljs-comment">&lt;!-- 当前页面要用的 ES 模块 --&gt;</span>
<span class="hljs-tag">&lt;<span class="hljs-name">link</span> <span class="hljs-attr">rel</span>=<span class="hljs-string">&quot;modulepreload&quot;</span> <span class="hljs-attr">href</span>=<span class="hljs-string">&quot;/js/app.js&quot;</span> /&gt;</span>
<span class="hljs-comment">&lt;!-- 下一页可能用到的资源 --&gt;</span>
<span class="hljs-tag">&lt;<span class="hljs-name">link</span> <span class="hljs-attr">rel</span>=<span class="hljs-string">&quot;prefetch&quot;</span> <span class="hljs-attr">href</span>=<span class="hljs-string">&quot;/js/checkout.js&quot;</span> /&gt;</span>
</code></pre></div>
<h2>只建连接：dns-prefetch 和 preconnect</h2>
<p>浏览器请求一个新的源，要先查 DNS，再建 TCP 连接，HTTPS 还要做 TLS 握手，这几步都要等往返。<code>preconnect</code> 把这几步提前做完，<code>dns-prefetch</code> 只做第一步。</p>
<p>既然 <code>preconnect</code> 做得更多，为什么还要 <code>dns-prefetch</code>？因为一条打开但没用上的连接也在占资源。MDN 的建议是：<code>preconnect</code> 只留给最关键的几个跨域源，其他的用 <code>dns-prefetch</code> 省下 DNS 查询的时间就够了。两个也可以对同一个源一起写，不支持 <code>preconnect</code> 的浏览器还能退回到 <code>dns-prefetch</code>。</p>
<p><code>crossorigin</code> 为什么会影响 <code>preconnect</code>？字体这类资源是用匿名模式的 CORS 请求加载的。MDN 的说明是，这种情况下 <code>preconnect</code> 要加 <code>crossorigin</code>，不加的话浏览器只会做 DNS 查询。这几个提示怎么选，另见<a href="/questions/network-dns-prefetch-preconnect/">《dns-prefetch、preconnect 和 preload 应该怎样选择？》</a>。</p>
<h2>当前页面要用：preload 和 modulepreload</h2>
<p><code>preload</code> 解决的是“发现得晚”。HTML 里直接写着的 <code>&lt;link rel=&quot;stylesheet&quot;&gt;</code> 和 <code>&lt;script&gt;</code> 浏览器很快就能看到，<code>preload</code> 帮不了多少。真正有用的是藏在后面的资源，比如 CSS 里 <code>@font-face</code> 引用的字体、JS 运行后才请求的文件。</p>
<p><code>as</code> 属性必须写。MDN 列出的理由是，浏览器要靠它把资源存进缓存供后面的请求复用，套用正确的 CSP，并设置正确的 <code>Accept</code> 请求头。字体和 <code>fetch</code> 类的预加载还要加 <code>crossorigin</code>，让预加载的 CORS 模式和真实请求一致，否则可能白下一次。</p>
<p>还有一个容易踩的坑。<code>&lt;picture&gt;</code> 里给 AVIF 和 WebP 都写了 <code>preload</code>，同时支持两种格式的浏览器会把两个都下载，可最终只用一个。MDN 建议只给大多数用户会用到的那种格式写 <code>preload</code>。</p>
<p><code>modulepreload</code> 是专为 ES 模块设计的。普通 <code>preload</code> 只下载并放进缓存；<code>modulepreload</code> 下载后还会解析、编译，把结果放进模块映射，等着执行。它的请求模式总是 <code>cors</code>。为什么值得单独用？因为模块依赖要等父模块下载、解析完才能发现，层层串行。把依赖都写成 <code>modulepreload</code>，它们就能并行下载。不过浏览器是否会顺带预取依赖的依赖，规范没有强制，所以 MDN 提示想要所有浏览器都预加载，就得逐个写出来。</p>
<h2>将来才用：prefetch</h2>
<p><code>prefetch</code> 告诉浏览器，用户之后的导航很可能用到这个资源。它的优先级比 <code>preload</code> 低，请求会带上 <code>Sec-Purpose: prefetch</code> 头，结果放进 HTTP 缓存，所以当前页面用不到的子资源也可以预取。</p>
<p>它有两个限制。第一，结果存在 HTTP 缓存里，响应头比如 <code>Cache-Control: no-cache</code> 会让预取失效。第二，很多浏览器对 HTTP 缓存做了分区，给别的顶层站点预取的资源，到了那个站点上用不了。所以 MDN 建议预取下一个页面本身的 HTML 时，优先用 Speculation Rules API，见<a href="/questions/perf-speculation-rules/">《Speculation Rules API 的预取和预渲染有什么区别？》</a>。</p>
<h2>常见追问</h2>
<p><strong>preload 了一个资源，页面没用上会怎样？</strong></p>
<blockquote>
<p>白白占了带宽，还可能挤占真正关键的请求。MDN 对 <code>preload</code> 的建议是只用在高优先级的资源上，不要什么都预加载，否则就看不到效果。</p>
</blockquote>
<p><strong>这些提示能写在响应头里吗？</strong></p>
<blockquote>
<p>可以，用 <code>Link</code> 响应头，比如 <code>Link: &lt;https://example.com&gt;; rel=&quot;preconnect&quot;</code>。好处是浏览器收到响应头就能开始准备，不用等 HTML 解析到 <code>&lt;head&gt;</code>。</p>
</blockquote>
<p><strong>webpack、Vite 里的 preload 和这个有关系吗？</strong></p>
<blockquote>
<p>有关系。以 Vite 为例，它的 <code>build.modulePreload</code> 选项控制怎样预加载动态导入依赖的 chunk：每个动态导入要预加载哪些 chunk 由 Vite 计算，默认还会注入一段 module preload 的 polyfill。构建工具做的是根据打包结果替你安排这些预加载，最终用的仍是浏览器的资源提示机制。</p>
</blockquote>`};export{e as default};