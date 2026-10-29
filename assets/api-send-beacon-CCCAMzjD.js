var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>不代表。<code>navigator.sendBeacon(url, data)</code> 会发一个 POST 请求，页面关掉以后请求还能继续发。它返回 <code>true</code>，只表示数据进了浏览器的发送队列；返回 <code>false</code> 通常是数据太大，排队总量限制为 64 KiB（65,536 字节）。服务端到底收没收到、返回了什么，页面都没法知道。</p>
<p>发送时机要选 <code>visibilitychange</code> 变成 <code>hidden</code> 的时候。<code>unload</code> 和 <code>beforeunload</code> 在手机上经常不触发，而且注册了 <code>unload</code> 监听，页面还没法进入 bfcache（往返缓存）。</p>
<p>如果要自定义请求头，或者发 JSON 类型，可以用 <code>fetch(url, { method: &#x27;POST&#x27;, keepalive: true })</code>。它和 sendBeacon 共用同一份 64 KiB 的配额。</p>
<p>因为没法确认送达，统计数据要设计成可以丢、可以去重，比如每条带一个唯一 ID。</p>
</blockquote>
<h2>写一个上报队列</h2>
<p>下面平时把事件攒在队列里，页面隐藏时一次性发出去。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> queue = [];

<span class="hljs-keyword">function</span> <span class="hljs-title function_">track</span>(<span class="hljs-params">event</span>) {
  queue.<span class="hljs-title function_">push</span>({ <span class="hljs-attr">id</span>: crypto.<span class="hljs-title function_">randomUUID</span>(), <span class="hljs-attr">time</span>: <span class="hljs-title class_">Date</span>.<span class="hljs-title function_">now</span>(), ...event });
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">flush</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">if</span> (queue.<span class="hljs-property">length</span> === <span class="hljs-number">0</span>) <span class="hljs-keyword">return</span>;
  <span class="hljs-keyword">const</span> body = <span class="hljs-title class_">JSON</span>.<span class="hljs-title function_">stringify</span>(queue.<span class="hljs-title function_">splice</span>(<span class="hljs-number">0</span>, queue.<span class="hljs-property">length</span>));
  <span class="hljs-keyword">const</span> blob = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Blob</span>([body], { <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;application/json&#x27;</span> });
  <span class="hljs-comment">// 失败多半是超出共享配额，keepalive 回退同样会失败，所以平时就要分批 flush，控制单次大小</span>
  <span class="hljs-keyword">if</span> (!navigator.<span class="hljs-title function_">sendBeacon</span>(<span class="hljs-string">&#x27;/api/collect&#x27;</span>, blob)) {
    <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">warn</span>(<span class="hljs-string">&#x27;上报数据过大，未能排队&#x27;</span>);
  }
}

<span class="hljs-variable language_">document</span>.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;visibilitychange&#x27;</span>, <span class="hljs-function">() =&gt;</span> {
  <span class="hljs-keyword">if</span> (<span class="hljs-variable language_">document</span>.<span class="hljs-property">visibilityState</span> === <span class="hljs-string">&#x27;hidden&#x27;</span>) <span class="hljs-title function_">flush</span>();
});
</code></pre></div>
<p><code>sendBeacon</code> 返回 <code>false</code> 时为什么不用 <code>fetch keepalive</code> 再试一次？因为失败多半是超了配额，而两者共用同一份配额，换一个也会失败。所以更好的做法是平时就定时或攒够一定数量发一次，页面离开时只发剩下的，单次数据小。</p>
<p>每条事件带 <code>crypto.randomUUID()</code> 生成的 ID，服务端按 ID 去重。</p>
<h2>跨源上报要注意什么</h2>
<p>例子里 Blob 的类型是 <code>application/json</code>。它不是 <code>text/plain</code> 这类 CORS 安全类型，跨源发送时，不同浏览器的行为不一致。所以跨源上报最稳妥的是用 <code>text/plain</code> 发 JSON 字符串，服务端按文本解析。</p>
<p>sendBeacon 也不能设置自定义请求头，鉴权只能靠 Cookie 或 URL 里的参数。</p>
<h2>为什么用 hidden 而不是 unload</h2>
<p>在手机上，用户切到后台，再从任务列表把应用划掉，页面根本收不到 <code>unload</code>。<code>visibilitychange</code> 变成 <code>hidden</code> 是最后一个能可靠执行代码的时机。</p>
<p>不过一个会话里，页面可能多次隐藏又恢复。所以每次隐藏都把当前队列发出去，服务端按 ID 去重就行。</p>
<h2>常见追问</h2>
<p><strong>为什么不在离开时用同步 XHR 发送？</strong></p>
<blockquote>
<p>同步 XHR 会阻塞页面关闭，用户体验很差。浏览器已经限制在卸载事件里使用同步 XHR 了。</p>
</blockquote>
<p><strong><code>fetchLater()</code> 是什么？</strong></p>
<blockquote>
<p>这是 Chromium 里的新 API，让浏览器在页面离开时自动把延迟请求发出去。其他浏览器还不支持，用之前要做特性检测。</p>
</blockquote>`};export{e as default};