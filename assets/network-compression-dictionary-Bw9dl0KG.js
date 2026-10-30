var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>网站发新版时，<code>app.v2.js</code> 和 <code>app.v1.js</code> 往往只差几行，可用户还是要把整个文件重新下一遍。Compression Dictionary Transport 让浏览器把旧版文件当作“字典”，服务端只用发送相对字典的差量。</p>
<p>流程靠几个头完成。服务端返回 v1 时带上 <code>Use-As-Dictionary: match=&quot;/js/app.*.js&quot;</code>，浏览器就记住它。以后请求匹配的 v2，请求头会带 <code>Available-Dictionary</code>，值是字典的 SHA-256 哈希；服务端如果有对应字典，就返回 <code>Content-Encoding: dcb</code>（Brotli）或 <code>dcz</code>（Zstandard）的压缩结果。</p>
<p>它适合频繁发版的 JS、CSS、WASM，也可以用 <code>&lt;link rel=&quot;compression-dictionary&quot;&gt;</code> 在空闲时预取一份公共字典，给多个页面共用。</p>
<p>要注意，MDN 把它标为实验性、有限可用。字典有效期跟着缓存走，<code>no-store</code>、<code>no-cache</code> 的响应不会成为字典；字典必须和使用它的资源同源，还受缓存分区影响。服务端在请求不带这些头时要照常返回普通压缩。</p>
</blockquote>
<h2>浏览器和服务端怎样一步步配合</h2>
<p>假设第一次访问，服务端返回 <code>app.v1.js</code>，并声明它可以当字典用：</p>
<div class="not-prose code-block"><div class="code-language">http</div><pre><code class="hljs language-http">Use-As-Dictionary: match=&quot;/js/app.*.js&quot;, id=&quot;dictionary-12345&quot;
Cache-Control: max-age=31536000
</code></pre></div>
<p><code>match</code> 是一个 URL 模式，写法和 URLPattern 相同，见<a href="/questions/api-url-pattern/">《URLPattern 适合做路由匹配吗？》</a>。它说明以后哪些地址可以用这份字典。<code>id</code> 是可选的，方便服务端查找字典。</p>
<p>新版本上线后，浏览器请求 <code>app.v2.js</code>。地址匹配上了，所以请求里多了两个头：</p>
<div class="not-prose code-block"><div class="code-language">http</div><pre><code class="hljs language-http">Accept-Encoding: gzip, br, zstd, dcb, dcz
Available-Dictionary: :pZGm1Av0IEBKARczz7exkNYsZb8LzaMrV7J32a2fFG4=:
Dictionary-ID: &quot;dictionary-12345&quot;
</code></pre></div>
<p>服务端用哈希确认自己手里有同一份字典，就返回以它为字典压缩的结果：</p>
<div class="not-prose code-block"><div class="code-language">http</div><pre><code class="hljs language-http">Content-Encoding: dcb
Vary: accept-encoding, available-dictionary
</code></pre></div>
<p>为什么要以哈希为准，<code>Dictionary-ID</code> 不够吗？因为 ID 只是帮服务端找文件的提示，MDN 明确说服务端仍须核对 <code>Available-Dictionary</code> 的哈希。哈希对不上就说明浏览器手里的字典不是服务端以为的那份，硬用会解压出错误内容。</p>
<p><code>Vary</code> 也不能省。同一个地址会因为请求带不带字典返回不同编码，缓存必须按这两个请求头区分，否则别的用户可能拿到一份自己没有字典、无法解压的响应。<code>Vary</code> 的作用见<a href="/questions/network-content-negotiation/">《HTTP 内容协商会怎样影响前端资源和接口响应？》</a>。</p>
<h2>为什么有的资源不会被当成字典</h2>
<p>字典能存多久，取决于提供它的那个响应是否还新鲜，也就是 <code>Cache-Control</code>。MDN 列出的规则是：<code>no-store</code> 或 <code>no-cache</code> 的响应永远不会成为字典；<code>max-age=0, stale-while-revalidate=N</code> 时字典保留 N 秒；<code>s-maxage</code> 会被忽略，因为浏览器是私有缓存。</p>
<p>所以这里有个常见的坑。HTML 文档通常用 <code>no-cache</code> 或 <code>max-age=0, must-revalidate</code> 来保证每次拿最新版本，可这样它就没法做下一版的字典，浏览器会静默丢弃。Chrome 会在 DevTools 的 Issues 面板提示 freshness 已过期。缓存头的含义见<a href="/questions/http-cache/">《强缓存与协商缓存如何配合？》</a>。</p>
<h2>没有旧版本时怎么用</h2>
<p>第一次访问的用户没有旧版文件，可以另外准备一份公共字典，让浏览器空闲时下载：</p>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">link</span> <span class="hljs-attr">rel</span>=<span class="hljs-string">&quot;compression-dictionary&quot;</span> <span class="hljs-attr">href</span>=<span class="hljs-string">&quot;/dictionary.dat&quot;</span> /&gt;</span>
</code></pre></div>
<p>也可以写在响应头里：<code>Link: &lt;/dictionary.dat&gt;; rel=&quot;compression-dictionary&quot;</code>。这份字典的响应同样要带 <code>Use-As-Dictionary</code>。字典没有特殊格式，可以是旧版文件、常用字符串集合，或 Brotli 字典生成工具的输出。</p>
<p>如果页面开了 CSP，这个 <code>&lt;link&gt;</code> 的加载受 <code>connect-src</code> 管，没写 <code>connect-src</code> 时看 <code>default-src</code>。</p>
<h2>有哪些限制</h2>
<p>字典必须与使用它的资源同源。用字典压缩的资源要么与文档同源，要么走 CORS，即带 <code>crossorigin</code> 请求、服务端返回 <code>Access-Control-Allow-Origin</code>。字典还受 HTTP 缓存分区约束，不会跨站共享。MDN 还提到，用户屏蔽 Cookie 或开启额外隐私保护时，浏览器可能关闭这个功能，因为字典可能被用于追踪。</p>
<p>对静态资源，MDN 建议构建时就把差量文件生成好，并决定要为前几个历史版本生成差量。每个 <code>.dcb</code> 文件的结构是固定的魔数头、字典的 SHA-256，然后是压缩数据。</p>
<h2>常见追问</h2>
<p><strong>它和普通的 Brotli 压缩有什么区别？</strong></p>
<blockquote>
<p>普通 Brotli 只能利用文件自身的重复内容。字典压缩还能引用字典里已有的内容，新旧版本重合的部分可以直接引用字典，不必再传一遍。</p>
</blockquote>
<p><strong>浏览器不支持会怎样？</strong></p>
<blockquote>
<p>不支持的浏览器不会发 <code>dcb</code>、<code>dcz</code> 和 <code>Available-Dictionary</code>，服务端按普通的 <code>Accept-Encoding</code> 返回 gzip 或 br 就行。所以它是渐进增强，服务端要保证两种情况都能处理。</p>
</blockquote>
<p><strong>之前有类似的技术吗？</strong></p>
<blockquote>
<p>有，叫 SDCH。MDN 提到它在 2017 年被移除，Compression Dictionary Transport 是它的替代方案，标准是 RFC 9842。</p>
</blockquote>`};export{e as default};