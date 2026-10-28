var e={answerHtml:`<h2>简答</h2>
<ul>
<li><code>navigator.sendBeacon(url, data)</code> 发出 POST 请求，页面卸载后请求仍会继续发送。</li>
<li>返回 <code>true</code> 只表示数据已进入浏览器的发送队列，返回 <code>false</code> 通常是数据过大（排队总量约 64KB 的限制）；服务端是否收到、返回什么状态，页面都无从得知。</li>
<li>发送时机选 <code>visibilitychange</code> 变为 <code>hidden</code>，<code>unload</code> 和 <code>beforeunload</code> 在移动端经常不触发，还会影响 bfcache。</li>
<li>需要自定义请求头或 JSON 类型时，用 <code>fetch(url, { method: &#x27;POST&#x27;, keepalive: true })</code>，同样有 64KB 的限制。</li>
<li>统计数据要设计成可丢失、可去重，例如每条带唯一 ID。</li>
</ul>
<h2>示例</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> queue = [];

<span class="hljs-keyword">function</span> <span class="hljs-title function_">track</span>(<span class="hljs-params">event</span>) {
  queue.<span class="hljs-title function_">push</span>({ <span class="hljs-attr">id</span>: crypto.<span class="hljs-title function_">randomUUID</span>(), <span class="hljs-attr">time</span>: <span class="hljs-title class_">Date</span>.<span class="hljs-title function_">now</span>(), ...event });
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">flush</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">if</span> (queue.<span class="hljs-property">length</span> === <span class="hljs-number">0</span>) <span class="hljs-keyword">return</span>;
  <span class="hljs-keyword">const</span> body = <span class="hljs-title class_">JSON</span>.<span class="hljs-title function_">stringify</span>(queue.<span class="hljs-title function_">splice</span>(<span class="hljs-number">0</span>, queue.<span class="hljs-property">length</span>));
  <span class="hljs-keyword">const</span> blob = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Blob</span>([body], { <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;application/json&#x27;</span> });
  <span class="hljs-keyword">if</span> (!navigator.<span class="hljs-title function_">sendBeacon</span>(<span class="hljs-string">&#x27;/api/collect&#x27;</span>, blob)) {
    <span class="hljs-title function_">fetch</span>(<span class="hljs-string">&#x27;/api/collect&#x27;</span>, { <span class="hljs-attr">method</span>: <span class="hljs-string">&#x27;POST&#x27;</span>, body, <span class="hljs-attr">keepalive</span>: <span class="hljs-literal">true</span>, <span class="hljs-attr">headers</span>: { <span class="hljs-string">&#x27;Content-Type&#x27;</span>: <span class="hljs-string">&#x27;application/json&#x27;</span> } }).<span class="hljs-title function_">catch</span>(<span class="hljs-function">() =&gt;</span> {});
  }
}

<span class="hljs-variable language_">document</span>.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;visibilitychange&#x27;</span>, <span class="hljs-function">() =&gt;</span> {
  <span class="hljs-keyword">if</span> (<span class="hljs-variable language_">document</span>.<span class="hljs-property">visibilityState</span> === <span class="hljs-string">&#x27;hidden&#x27;</span>) <span class="hljs-title function_">flush</span>();
});
</code></pre></div>
<ul>
<li>用 <code>Blob</code> 指定 <code>application/json</code> 时，跨源请求会触发 CORS 预检；服务端要允许，或者改用 <code>text/plain</code> 避免预检。</li>
<li>sendBeacon 不能设置自定义请求头，鉴权依赖 Cookie 或 URL 里的参数。</li>
<li>平时可以定时或攒够一定数量后发送，页面离开时只发剩余部分，单次数据更小。</li>
</ul>
<h2>为什么用 hidden 而不是 unload</h2>
<p>用户在移动端切到后台、再从任务列表划掉应用，页面不会收到 <code>unload</code>。<code>visibilitychange</code> 到 <code>hidden</code> 是最后一个能可靠执行代码的时机。一个会话中页面可能多次隐藏和恢复，所以每次隐藏都发送当前队列，服务端按 ID 去重。</p>
<h2>常见追问</h2>
<ul>
<li>为什么不在离开时用同步 XHR：会阻塞页面关闭，浏览器已限制在卸载事件中使用同步 XHR。</li>
<li><code>fetchLater()</code>：Chromium 中的新 API，让浏览器在页面离开时自动发送延迟请求，其他浏览器尚未支持，使用前要特性检测。</li>
</ul>`};export{e as default};