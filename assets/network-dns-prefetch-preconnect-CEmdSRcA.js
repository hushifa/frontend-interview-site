var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>页面要从 <code>https://fonts.example</code> 加载字体。浏览器第一次向这个源发请求前，要先把域名解析成 IP，再建立 TCP 连接，因为是 HTTPS，还要做 TLS 握手。这几步每一步都要等网络往返，做完了才能真正发出请求。</p>
<p><code>dns-prefetch</code> 只把第一步 DNS 查询提前。<code>preconnect</code> 把握手提前做完，MDN 的说法是：HTTP 源提前做 DNS 加 TCP，HTTPS 源提前做 DNS、TCP 加 TLS。等页面真的请求这个源时，连接已经在那里了。</p>
<p>两者都只对跨域的源有用。自己站点的域名在浏览器看到提示时已经解析过了，连接也已经开着，再写一遍没有收益。</p>
<p><code>preconnect</code> 做得多，代价也大。MDN 提醒，给很多第三方域名都写 <code>preconnect</code> 会适得其反，它只适合最关键的几个连接，其余的用 <code>dns-prefetch</code> 省下 DNS 查询时间就够了。字体这类以匿名模式加载的资源，<code>preconnect</code> 要加 <code>crossorigin</code>，否则浏览器只做 DNS 查询。</p>
</blockquote>
<h2>一次跨域请求前要做哪些事</h2>
<p>以 HTTPS 为例，浏览器访问一个从没连过的源，顺序是：DNS 解析拿到 IP；TCP 三次握手建立连接；TLS 握手协商加密参数；最后才发出 HTTP 请求。前三步和要下载什么文件无关，只和“连到哪个源”有关，所以可以在知道具体文件之前就提前做。</p>
<p>MDN 解释 <code>dns-prefetch</code> 时提到，DNS 缓存能减少延迟，但 DNS 解析仍可能给请求增加明显的延迟，页面连接的第三方越多，这部分影响越大。TCP 和 TLS 握手同样要等往返，各阶段的耗时见<a href="/questions/network-dns-tcp-tls/">《DNS、TCP 和 TLS 握手分别会给页面增加哪些等待？》</a>。</p>
<h2>怎么写</h2>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-comment">&lt;!-- 关键源：把连接建好，字体是匿名 CORS 请求，要加 crossorigin --&gt;</span>
<span class="hljs-tag">&lt;<span class="hljs-name">link</span> <span class="hljs-attr">rel</span>=<span class="hljs-string">&quot;preconnect&quot;</span> <span class="hljs-attr">href</span>=<span class="hljs-string">&quot;https://fonts.example&quot;</span> <span class="hljs-attr">crossorigin</span> /&gt;</span>
<span class="hljs-comment">&lt;!-- 同一个源也写 dns-prefetch，不支持 preconnect 的浏览器可以退回 --&gt;</span>
<span class="hljs-tag">&lt;<span class="hljs-name">link</span> <span class="hljs-attr">rel</span>=<span class="hljs-string">&quot;dns-prefetch&quot;</span> <span class="hljs-attr">href</span>=<span class="hljs-string">&quot;https://fonts.example&quot;</span> /&gt;</span>
<span class="hljs-comment">&lt;!-- 次要的第三方：只提前查 DNS --&gt;</span>
<span class="hljs-tag">&lt;<span class="hljs-name">link</span> <span class="hljs-attr">rel</span>=<span class="hljs-string">&quot;dns-prefetch&quot;</span> <span class="hljs-attr">href</span>=<span class="hljs-string">&quot;https://analytics.example&quot;</span> /&gt;</span>
</code></pre></div>
<p>为什么同一个源两个都写？MDN 的解释是，<code>dns-prefetch</code> 的支持比 <code>preconnect</code> 更好，不支持 <code>preconnect</code> 的浏览器还能退回到 <code>dns-prefetch</code>，拿到一部分收益。</p>
<p>字体那行的 <code>crossorigin</code> 容易漏。MDN 说明，字体等资源以匿名模式加载，这时 <code>preconnect</code> 要设置 <code>crossorigin</code>；不写的话，浏览器只会做 DNS 查询，提前建好的连接用不上。</p>
<h2>怎样决定给哪些源用</h2>
<p>先列出首屏会访问的跨域源，比如字体、图片 CDN、接口域名、统计脚本。马上就要请求、又在关键路径上的一两个源用 <code>preconnect</code>；可能会用到、或者不那么急的，用 <code>dns-prefetch</code>。MDN 对 <code>preconnect</code> 的说法是“只用于最关键的连接”，没有给出具体数量，要用实际页面的瀑布图验证。</p>
<p>这两个提示也可以写在响应头里，浏览器收到响应头就能开始准备，不用等 HTML 解析到 <code>&lt;head&gt;</code>：</p>
<div class="not-prose code-block"><div class="code-language">http</div><pre><code class="hljs language-http">Link: &lt;https://fonts.example&gt;; rel=preconnect
Link: &lt;https://fonts.example&gt;; rel=dns-prefetch
</code></pre></div>
<p>连接准备好以后，具体文件怎样提前下载、以什么优先级下载，是 <code>preload</code>、<code>modulepreload</code> 和 <code>prefetch</code> 的事，见<a href="/questions/perf-preload-prefetch/">《preload、modulepreload 和 prefetch 怎样安排资源的加载优先级？》</a>。</p>
<h2>常见追问</h2>
<p><strong>给自己的域名写 preconnect 有用吗？</strong></p>
<blockquote>
<p>没有用。MDN 说明 <code>preconnect</code> 对同源请求没有收益，因为连接已经开着；<code>dns-prefetch</code> 也一样，浏览器看到提示时自己域名的 IP 已经解析过了。</p>
</blockquote>
<p><strong>怎么验证 preconnect 生效了？</strong></p>
<blockquote>
<p>在 DevTools 网络面板里看这个源的第一个真实请求的耗时分解。提示生效时，DNS、建连和 TLS 这几段已经在请求之前完成，不再出现在这个请求的等待里；如果字体请求仍然重新建连接，先检查 <code>preconnect</code> 是否漏了 <code>crossorigin</code>。</p>
</blockquote>`};export{e as default};