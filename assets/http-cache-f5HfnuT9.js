var e={answerHtml:`<h2>简答</h2>
<ul>
<li>强缓存：响应仍在新鲜期内时，浏览器直接用本地副本，不发请求。新鲜期由 <code>Cache-Control: max-age</code> 决定，同时存在时 <code>max-age</code> 优先于 <code>Expires</code>。</li>
<li>协商缓存：副本过期或带 <code>no-cache</code> 时，浏览器发条件请求 <code>If-None-Match</code>（ETag）或 <code>If-Modified-Since</code>（Last-Modified）。</li>
<li>服务器判断没变就回 <code>304 Not Modified</code>，不带正文，浏览器继续用本地副本并更新新鲜期；变了就回 <code>200</code> 和新正文。</li>
<li>两个条件头同时存在时，服务器以 <code>If-None-Match</code> 为准，ETag 比秒级的修改时间更精确。</li>
</ul>
<h2>判断流程</h2>
<ol>
<li>响应能否被存储：<code>no-store</code> 不存储；<code>private</code> 只允许浏览器缓存，不允许 CDN 这类共享缓存。</li>
<li>副本是否新鲜：年龄（<code>Age</code> 加上本地停留时间）小于 <code>max-age</code>（共享缓存优先看 <code>s-maxage</code>）即为新鲜。没有显式新鲜期时，浏览器可以按 <code>Last-Modified</code> 启发式估算，这是很多&quot;没配缓存却被缓存&quot;问题的来源。</li>
<li>不新鲜或要求验证（<code>no-cache</code>）：带验证器发条件请求。</li>
<li>根据 304 或 200 更新缓存。</li>
</ol>
<h2>常用配置</h2>
<table><thead><tr><th>资源</th><th>响应头</th></tr></thead><tbody><tr><td>带内容哈希的 JS、CSS</td><td><code>Cache-Control: max-age=31536000, immutable</code></td></tr><tr><td>HTML 入口</td><td><code>Cache-Control: no-cache</code> 加 <code>ETag</code></td></tr><tr><td>含个人数据的接口</td><td><code>Cache-Control: private, no-store</code> 或按需 <code>private, no-cache</code></td></tr></tbody></table>
<p>HTML 每次验证，资源文件长期缓存，发布新版本时 HTML 引用新的哈希文件名，既能及时更新又不浪费带宽。各指令的取舍见<a href="/questions/network-cache-control/">《Cache-Control 的 immutable、stale-while-revalidate 和 no-store 怎样选择？》</a>。</p>
<h2>ETag 的细节</h2>
<ul>
<li>强 ETag <code>&quot;abc&quot;</code> 要求字节一致；弱 ETag <code>W/&quot;abc&quot;</code> 表示语义等价，可用于条件 GET，不能用于 Range 请求。</li>
<li>多台服务器各自生成 ETag（例如基于 inode）会导致同一文件 ETag 不同，验证总是失败。</li>
<li>压缩后的表示应有不同的 ETag，否则缓存可能混用编码。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li><code>no-cache</code> 和 <code>no-store</code> 的区别：<code>no-cache</code> 允许存储但每次使用前必须验证；<code>no-store</code> 不允许存储。</li>
<li>用户点刷新会怎样：普通刷新通常会对主文档重新验证；强制刷新（Ctrl+Shift+R）会绕过缓存。</li>
<li>304 算不算请求：算。它省的是正文传输，仍有一次往返。</li>
</ul>`};export{e as default};