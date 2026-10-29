var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>三者最大的区别是：Cookie 会自动跟着匹配的请求发给服务端，另外两个不会。所以 Cookie 适合放会话标识这种服务端要读的数据，单个大约 4KB。</p>
<p>localStorage 按源持久保存，同源的所有标签页共享，不手动清除就一直在，容量通常约 5MB。sessionStorage 也按源，但还按标签页隔离，关掉标签页就清除了。</p>
<p>选的时候看谁要用、要存多久。登录会话用服务端设置的 HttpOnly Cookie；主题、语言、草稿用 localStorage；只属于当前标签页的流程状态用 sessionStorage；数据量大或者有二进制，就用 IndexedDB。</p>
<p>要注意，两种 Web Storage 都是同步 API，只能存字符串，页面里任何脚本都能读到，所以不要存令牌这类敏感数据。</p>
</blockquote>
<h2>放在一起比一比</h2>
<table><thead><tr><th></th><th>Cookie</th><th>localStorage</th><th>sessionStorage</th></tr></thead><tbody><tr><td>容量</td><td>单个约 4KB</td><td>通常约 5MB</td><td>通常约 5MB</td></tr><tr><td>生命周期</td><td>由 <code>Expires</code>/<code>Max-Age</code> 决定，未设置则为会话 Cookie</td><td>手动清除前一直保存</td><td>标签页关闭后清除</td></tr><tr><td>作用范围</td><td>按 Domain、Path 匹配</td><td>同源共享</td><td>同源且同一标签页</td></tr><tr><td>随请求发送</td><td>是</td><td>否</td><td>否</td></tr><tr><td>脚本可读</td><td>设置 <code>HttpOnly</code> 后不可读</td><td>可读</td><td>可读</td></tr></tbody></table>
<h2>为什么登录态要放 HttpOnly Cookie</h2>
<p>令牌放在 localStorage 里，页面上任何脚本都能读。一旦页面有 XSS，攻击者注入的脚本一行就能把令牌偷走。</p>
<p>服务端下发 <code>HttpOnly; Secure; SameSite=Lax</code> 的 Cookie 就不一样。<code>HttpOnly</code> 让页面脚本读不到它，XSS 没法直接窃取；请求时浏览器自动带上，前端也不用管。</p>
<h2>读写 Web Storage 要处理异常</h2>
<p>下面是读 JSON 的一个安全写法：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">readJSON</span>(<span class="hljs-params">key, fallback</span>) {
  <span class="hljs-keyword">try</span> {
    <span class="hljs-keyword">const</span> raw = <span class="hljs-variable language_">localStorage</span>.<span class="hljs-title function_">getItem</span>(key);
    <span class="hljs-keyword">return</span> raw === <span class="hljs-literal">null</span> ? fallback : <span class="hljs-title class_">JSON</span>.<span class="hljs-title function_">parse</span>(raw);
  } <span class="hljs-keyword">catch</span> {
    <span class="hljs-keyword">return</span> fallback;
  }
}
</code></pre></div>
<p>为什么一个读取也要包 <code>try</code>？因为存进去的内容可能不是合法 JSON，<code>JSON.parse</code> 会抛错；隐私模式或存储被禁用时，访问 <code>localStorage</code> 本身也可能失败。写入时同样可能抛 <code>QuotaExceededError</code>，所以读写都要处理异常。</p>
<h2>两个容易误解的行为</h2>
<p>其他同源标签页修改了 localStorage，本页会收到 <code>storage</code> 事件。可是修改的那一页自己收不到。</p>
<p>sessionStorage 在“复制标签页”时会复制一份过去，之后两边各管各的，互相独立。</p>
<h2>常见追问</h2>
<p><strong>在一个标签页里改了 localStorage，自己能收到 <code>storage</code> 事件吗？</strong></p>
<blockquote>
<p>收不到。<code>storage</code> 事件只发给其他同源标签页，修改的那一页自己不会触发。</p>
</blockquote>
<p><strong>复制标签页后，sessionStorage 会怎样？</strong></p>
<blockquote>
<p>新标签页会拿到一份复制品，内容和原来一样。之后两边独立，改一边不影响另一边。</p>
</blockquote>`};export{e as default};