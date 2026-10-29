var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>浏览器拿到一个响应后会存一份副本。下次再要这个资源，它先看副本还新不新鲜，新鲜就直接用，连请求都不发，这叫强缓存。新鲜期一般由 <code>Cache-Control: max-age</code> 决定，它和 <code>Expires</code> 同时存在时以 <code>max-age</code> 为准。</p>
<p>副本过期了，或者响应要求每次都验证（<code>no-cache</code>），浏览器就带着副本的“版本号”去问服务器：<code>If-None-Match</code> 带上 ETag，<code>If-Modified-Since</code> 带上修改时间。这叫协商缓存。</p>
<p>服务器看了觉得没变，就回 <code>304 Not Modified</code>，不带正文，浏览器继续用本地副本并刷新新鲜期；变了就回 <code>200</code> 和新内容。两个条件头都在时，服务器以 <code>If-None-Match</code> 为准，因为 ETag 比精确到秒的修改时间更准。</p>
<p>实际项目里两者配合用：HTML 每次验证，带哈希的 JS、CSS 长期强缓存。要注意 304 也是一次往返，省的只是正文。</p>
</blockquote>
<h2>浏览器是怎么判断的</h2>
<p>浏览器拿到响应后，先问能不能存。<code>no-store</code> 表示不许存；<code>private</code> 表示只能存在用户自己的浏览器里，CDN 这种多人共用的缓存不能存，这类缓存叫共享缓存。</p>
<p>存下来以后，再用时要算副本的“年龄”，也就是 <code>Age</code> 头加上它在本地待的时间。年龄小于 <code>max-age</code> 就算新鲜，直接用。共享缓存会优先看 <code>s-maxage</code>。</p>
<p>这里有个容易踩的坑。响应里根本没写新鲜期时，浏览器可以按 <code>Last-Modified</code> 自己估一个，这叫启发式缓存。很多“明明没配缓存，怎么被缓存了”的问题就是这么来的。</p>
<p>副本不新鲜，或者带了 <code>no-cache</code>，浏览器就发条件请求去验证，再根据 304 还是 200 更新缓存。</p>
<h2>常用配置怎么定</h2>
<table><thead><tr><th>资源</th><th>响应头</th></tr></thead><tbody><tr><td>带内容哈希的 JS、CSS</td><td><code>Cache-Control: max-age=31536000, immutable</code></td></tr><tr><td>HTML 入口</td><td><code>Cache-Control: no-cache</code> 加 <code>ETag</code></td></tr><tr><td>含个人数据的接口</td><td><code>Cache-Control: private, no-store</code> 或按需 <code>private, no-cache</code></td></tr></tbody></table>
<p>这样配的道理是：HTML 每次都验证，所以发版后用户总能拿到新 HTML；新 HTML 引用的是新哈希文件名，等于一个新 URL，旧缓存自然用不上。资源文件内容和文件名绑定，可以放心缓存一年。既能及时更新，又不浪费带宽。各指令怎么取舍见<a href="/questions/network-cache-control/">《Cache-Control 的 immutable、no-store 等指令怎样选？》</a>。</p>
<h2>ETag 有哪些细节</h2>
<p>ETag 分强弱两种。强 ETag 写作 <code>&quot;abc&quot;</code>，要求字节完全一致；弱 ETag 写作 <code>W/&quot;abc&quot;</code>，只表示意思一样。弱 ETag 能用在普通的条件 GET 上，但不能用于 Range 请求，因为拼接字节时必须保证完全一样。</p>
<p>多台服务器各自生成 ETag 也会出问题。比如按文件 inode 生成，同一个文件在不同机器上 ETag 不同，验证总是失败，每次都回 200。</p>
<p>另外，压缩后的内容和原始内容应该有不同的 ETag，否则缓存可能把 gzip 和 br 的版本混着用。</p>
<h2>常见追问</h2>
<p><strong><code>no-cache</code> 和 <code>no-store</code> 有什么区别？</strong></p>
<blockquote>
<p><code>no-cache</code> 允许存，但每次用之前必须先找服务器验证。<code>no-store</code> 是根本不许存。</p>
</blockquote>
<p><strong>用户点刷新会怎样？</strong></p>
<blockquote>
<p>普通刷新通常会对主文档重新验证。强制刷新，比如 Ctrl+Shift+R，会绕过缓存重新下载。</p>
</blockquote>
<p><strong>304 算不算一次请求？</strong></p>
<blockquote>
<p>算。它省的是正文的传输，但请求和响应的往返还在。</p>
</blockquote>`};export{e as default};