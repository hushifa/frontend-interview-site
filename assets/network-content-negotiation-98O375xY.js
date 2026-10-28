var e={answerHtml:`<h2>简答</h2>
<ul>
<li>客户端用 <code>Accept</code>、<code>Accept-Language</code>、<code>Accept-Encoding</code> 说明偏好，可用 <code>q</code> 值排序，例如 <code>zh-CN,zh;q=0.9,en;q=0.8</code>。</li>
<li>服务器选一个表示返回，用 <code>Content-Type</code>、<code>Content-Language</code>、<code>Content-Encoding</code> 说明实际结果。</li>
<li>协商依据了哪些请求头，就要在 <code>Vary</code> 里列出来，缓存才会按这些头分别存储。</li>
<li><code>Accept</code> 描述想要的响应格式，<code>Content-Type</code> 描述正文本身的格式，请求和响应都可以有 <code>Content-Type</code>。</li>
</ul>
<h2>压缩协商</h2>
<div class="not-prose code-block"><div class="code-language">http</div><pre><code class="hljs language-http">GET /app.js
Accept-Encoding: gzip, br, zstd

HTTP/1.1 200 OK
Content-Encoding: br
Vary: Accept-Encoding
</code></pre></div>
<p>浏览器只在 HTTPS 下发送 <code>br</code>。<code>zstd</code> 也已被多个浏览器支持，服务器可以按请求头选择。静态资源最好在构建时预压缩，避免每次动态压缩的 CPU 开销。</p>
<h2>语言协商为什么容易出问题</h2>
<div class="not-prose code-block"><div class="code-language">http</div><pre><code class="hljs language-http">GET /pricing
Accept-Language: en

HTTP/1.1 200 OK
Content-Language: en
Cache-Control: public, max-age=600
</code></pre></div>
<p>缺少 <code>Vary: Accept-Language</code> 时，CDN 会把英文页缓存给所有人。加上 <code>Vary</code> 又会按每种语言组合分别缓存，命中率下降，而且用户无法手动切换语言、搜索引擎也难以索引各语言版本。</p>
<p>所以面向用户的页面更推荐用显式 URL 区分语言，例如 <code>/en/pricing</code>、<code>/zh/pricing</code>，配合 <code>hreflang</code>，只用 <code>Accept-Language</code> 做首次访问时的建议跳转。</p>
<h2>图片格式协商</h2>
<p>浏览器请求图片时，<code>Accept</code> 会包含支持的格式，如 <code>image/avif,image/webp,*/*</code>。服务器或 CDN 可以据此返回 AVIF 或 WebP，同时设置 <code>Vary: Accept</code>。前端也可以用 <code>&lt;picture&gt;</code> 在 HTML 里列出候选格式，由浏览器选择，不依赖服务端协商。</p>
<h2>常见追问</h2>
<ul>
<li>接口返回 HTML 而不是 JSON？可能是 <code>Accept</code> 没设置，或者网关错误页返回了 HTML。前端解析前先检查 <code>Content-Type</code>。</li>
<li>服务器没有可接受的表示时返回什么？可以返回 <code>406 Not Acceptable</code>，但多数服务器会返回默认表示。</li>
</ul>`};export{e as default};