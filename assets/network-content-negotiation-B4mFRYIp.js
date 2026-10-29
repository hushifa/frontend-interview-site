var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>同一个 URL，服务器可以根据请求头返回不同的版本，这叫内容协商。客户端用 <code>Accept</code> 说想要什么格式，<code>Accept-Language</code> 说想要什么语言，<code>Accept-Encoding</code> 说支持哪些压缩。还可以用 <code>q</code> 值排先后，比如 <code>zh-CN,zh;q=0.9,en;q=0.8</code>，意思是最想要简体中文，其次中文，再次英文。</p>
<p>服务器挑一个版本返回，再用 <code>Content-Type</code>、<code>Content-Language</code>、<code>Content-Encoding</code> 说明实际给的是什么。</p>
<p>最关键的一点是 <code>Vary</code>。服务器看了哪些请求头来做选择，就要在 <code>Vary</code> 里列出来，缓存才会按这些头分开存。不写的话，CDN 可能把英文版发给所有人。</p>
<p>还有个常被混淆的地方：<code>Accept</code> 说的是“我想要的响应格式”，<code>Content-Type</code> 说的是“这段正文本身是什么格式”，所以请求和响应都可以带 <code>Content-Type</code>。</p>
</blockquote>
<h2>压缩是怎么协商的</h2>
<div class="not-prose code-block"><div class="code-language">http</div><pre><code class="hljs language-http">GET /app.js
Accept-Encoding: gzip, br, zstd

HTTP/1.1 200 OK
Content-Encoding: br
Vary: Accept-Encoding
</code></pre></div>
<p>浏览器说自己支持 gzip、br、zstd，服务器选了 br，并用 <code>Vary: Accept-Encoding</code> 告诉缓存：这个响应是按压缩方式选出来的，不支持 br 的客户端不要给它这份。</p>
<p>Chrome、Firefox 等浏览器通常只在 HTTPS 连接上才在 <code>Accept-Encoding</code> 里带 <code>br</code>，具体以浏览器实现为准。<code>zstd</code> 也已经有多个浏览器支持，服务器可以按请求头去选。静态资源最好在构建时就预先压缩好，省掉每次请求动态压缩的 CPU。</p>
<h2>为什么语言协商容易出问题</h2>
<div class="not-prose code-block"><div class="code-language">http</div><pre><code class="hljs language-http">GET /pricing
Accept-Language: en

HTTP/1.1 200 OK
Content-Language: en
Cache-Control: public, max-age=600
</code></pre></div>
<p>这个响应少了 <code>Vary: Accept-Language</code>。CDN 只按 URL 存，第一个来的是英文用户，它就把英文页缓存给了所有人，中文用户也看到英文。</p>
<p>那加上 <code>Vary</code> 是不是就好了？也不完全。<code>Accept-Language</code> 的组合很多，每种都单独存一份，命中率会下降。而且用户没法手动切换语言，搜索引擎也很难分别索引各个语言版本。</p>
<p>所以面向用户的页面，更推荐用 URL 区分语言，比如 <code>/en/pricing</code>、<code>/zh/pricing</code>，配合 <code>hreflang</code> 标注。<code>Accept-Language</code> 只用在第一次访问时，建议跳转到哪个语言。</p>
<h2>图片格式也能协商</h2>
<p>浏览器请求图片时，<code>Accept</code> 里会写上支持的格式，比如 <code>image/avif,image/webp,*/*</code>。服务器或 CDN 可以据此返回 AVIF 或 WebP，同时加上 <code>Vary: Accept</code>。</p>
<p>前端也可以不依赖服务端，用 <code>&lt;picture&gt;</code> 在 HTML 里列出几种候选格式，让浏览器自己挑。</p>
<h2>常见追问</h2>
<p><strong>接口返回的是 HTML 而不是 JSON？</strong></p>
<blockquote>
<p>可能是请求没设 <code>Accept</code>，也可能是网关出错返回了一个 HTML 错误页。前端解析前先检查 <code>Content-Type</code>。</p>
</blockquote>
<p><strong>服务器没有客户端能接受的版本时返回什么？</strong></p>
<blockquote>
<p>可以返回 <code>406 Not Acceptable</code>，但多数服务器会直接返回默认版本。</p>
</blockquote>`};export{e as default};