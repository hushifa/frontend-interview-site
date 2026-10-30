var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>不代表。<code>navigator.sendBeacon(url, data)</code> 返回 <code>true</code>，只表示浏览器把数据放进了发送队列，之后什么时候发、服务端有没有收到、返回了什么，页面都无从得知。</p>
<p>返回 <code>false</code> 表示没能排队，常见原因是数据太大。规范给排队中的数据设了总量限制，MDN 写的是 64 KiB（65,536 字节），而且这份配额和 <code>fetch</code> 的 <code>keepalive</code> 请求共用。</p>
<p>它发出的请求是固定的：方法只能是 POST，会带上 Cookie，不能加自定义请求头，响应会被丢掉。请求的 Content-Type 由 <code>data</code> 的类型决定。</p>
<p>跨源时要看 Content-Type。没有数据，或者类型是 <code>text/plain</code> 这类 CORS 安全类型，请求用 <code>no-cors</code> 模式直接发出；如果是 <code>application/json</code>，浏览器会先发 CORS 预检，服务端要放行才行。</p>
</blockquote>
<h2>返回值到底说明了什么</h2>
<p>先看最常见的误解：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> ok = navigator.<span class="hljs-title function_">sendBeacon</span>(<span class="hljs-string">&#x27;/api/collect&#x27;</span>, <span class="hljs-string">&#x27;hello&#x27;</span>);
<span class="hljs-keyword">if</span> (ok) {
  <span class="hljs-comment">// 这里只能说明“已经排上队”，不能说明“服务端已收到”</span>
}
</code></pre></div>
<p>sendBeacon 的设计目标就是不拖住页面：它不返回 Promise，也没有回调，浏览器在合适的时候把数据异步发出去，页面关闭后请求还能继续。代价就是页面拿不到任何结果。所以返回值只能用来判断“这次有没有塞进队列”。</p>
<p>那 <code>false</code> 时该怎么办？因为最常见的原因是配额满了，换成 <code>fetch</code> 的 <code>keepalive</code> 再试也会失败，二者共用配额。合理的做法是控制每次发送的体积，分批发送。分批和发送时机的整体方案见<a href="/questions/monitoring-beacon/">《页面关闭时怎样可靠上报？sendBeacon 和 keepalive 怎么选？》</a>。</p>
<h2>data 的类型决定请求长什么样</h2>
<p><code>data</code> 可以是字符串、<code>Blob</code>、<code>FormData</code>、<code>URLSearchParams</code>、<code>ArrayBuffer</code> 等。浏览器按 Fetch 规范从它提取请求体和 Content-Type：</p>
<table><thead><tr><th>data 类型</th><th>Content-Type</th><th>跨源时</th></tr></thead><tbody><tr><td>字符串</td><td><code>text/plain;charset=UTF-8</code></td><td>不预检</td></tr><tr><td><code>URLSearchParams</code></td><td><code>application/x-www-form-urlencoded;charset=UTF-8</code></td><td>不预检</td></tr><tr><td><code>FormData</code></td><td><code>multipart/form-data; boundary=...</code></td><td>不预检</td></tr><tr><td><code>Blob</code></td><td>Blob 自己的 <code>type</code></td><td>看 type 是否是 CORS 安全类型</td></tr></tbody></table>
<p>想发 JSON 时，常见写法是 <code>new Blob([json], { type: &#x27;application/json&#x27; })</code>。这在同源下没问题，跨源时就会触发预检。规范的处理是：Content-Type 是 CORS 安全的值，就用 <code>no-cors</code> 模式；否则用 <code>cors</code> 模式，服务端得返回对应的 CORS 响应头。如果不想处理预检，可以直接传 JSON 字符串，让它以 <code>text/plain</code> 发出，服务端按文本解析。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> body = <span class="hljs-title class_">JSON</span>.<span class="hljs-title function_">stringify</span>({ <span class="hljs-attr">id</span>: crypto.<span class="hljs-title function_">randomUUID</span>(), <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;click&#x27;</span> });
navigator.<span class="hljs-title function_">sendBeacon</span>(<span class="hljs-string">&#x27;https://log.example.com/collect&#x27;</span>, body); <span class="hljs-comment">// 以 text/plain 发出，跨源不预检</span>
</code></pre></div>
<h2>不能改的部分</h2>
<p>规范里 sendBeacon 的请求参数是写死的：方法 POST、凭据模式 <code>include</code>（会带 Cookie）、keepalive 打开。开发者没法加请求头，所以不能用 <code>Authorization</code> 做鉴权，只能靠 Cookie 或者 URL 里的参数。</p>
<p>MDN 也写明了：如果要用 POST 以外的方法、改请求属性或者读响应，应该改用带 <code>keepalive: true</code> 的 <code>fetch()</code>。</p>
<h2>常见追问</h2>
<p><strong>sendBeacon 一定会把数据发出去吗？</strong></p>
<blockquote>
<p>不一定。它只保证页面卸载不会取消已经排队的请求，网络失败、服务端出错时页面都不知道，也不会重试。所以统计数据要允许丢失，每条带唯一 ID 方便服务端去重。</p>
</blockquote>
<p><strong>为什么带了 Cookie 还要担心跨站？</strong></p>
<blockquote>
<p>凭据模式是 <code>include</code>，但 Cookie 能不能带上还受 SameSite 等规则约束。跨站上报时第三方 Cookie 可能被浏览器拦截，用请求体里的匿名 ID 更稳妥。</p>
</blockquote>`};export{e as default};