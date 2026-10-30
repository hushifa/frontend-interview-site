var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>页面关闭时上报，最大的问题是抓不准时机。<code>unload</code> 和 <code>beforeunload</code> 在移动端经常不触发，<code>unload</code> 还会让页面进不了 bfcache。所以上报时机要选 <code>visibilitychange</code>，在 <code>visibilityState</code> 变成 <code>hidden</code> 时发。</p>
<p>发送方式常用两种。<code>sendBeacon</code> 只能发 POST，只告诉你有没有放进发送队列；<code>fetch</code> 加 <code>keepalive</code> 可以自定义请求，也能读响应。两者共用 64 KiB 的配额，一个超额了换另一个也会失败，所以要平时分批发，控制单次体积。</p>
<p>还有一个新的 <code>fetchLater</code>，是先把请求登记给浏览器，页面离开或者到了 <code>activateAfter</code> 设定的时间，浏览器替你发出去，适合“先登记、最后再发”的数据。但它还是实验性 API，目前只有 Chromium 系浏览器支持，要做特性检测和降级。</p>
</blockquote>
<h2>为什么要在 visibilitychange 里上报</h2>
<p>先看推荐的写法：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-variable language_">document</span>.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;visibilitychange&#x27;</span>, <span class="hljs-function">() =&gt;</span> {
  <span class="hljs-keyword">if</span> (<span class="hljs-variable language_">document</span>.<span class="hljs-property">visibilityState</span> === <span class="hljs-string">&#x27;hidden&#x27;</span>) <span class="hljs-title function_">flush</span>();
});
</code></pre></div>
<p>为什么不用 <code>unload</code>？设想用户先切到别的应用，过了一会儿在任务管理器里把浏览器划掉。这时 <code>unload</code> 根本没有机会执行，而 <code>visibilitychange</code> 在切走的那一刻就已经触发了。</p>
<p>可是 <code>hidden</code> 不一定代表用户离开了，他可能还会切回来。所以 <code>flush</code> 只发当前缓冲区里的数据，之后的数据继续攒着，下次隐藏再发。</p>
<p>那 <code>pagehide</code> 呢？它和 bfcache 兼容，但可靠性问题和 <code>unload</code> 差不多，MDN 推荐优先用 <code>visibilitychange</code>。bfcache 的细节见<a href="/questions/browser-bfcache/">《bfcache 与 HTTP 缓存有什么区别？》</a>。</p>
<h2>sendBeacon、keepalive、fetchLater 怎么选</h2>
<p>三种方式对比如下：</p>
<table><thead><tr><th>方式</th><th>方法</th><th>读响应</th><th>体积限制</th><th>兼容性</th></tr></thead><tbody><tr><td><code>sendBeacon</code></td><td>仅 POST</td><td>否</td><td>与 keepalive 共享 64 KiB</td><td>广泛支持</td></tr><tr><td><code>fetch</code> + <code>keepalive</code></td><td>任意</td><td>可以</td><td>与 sendBeacon 共享 64 KiB</td><td>广泛支持</td></tr><tr><td><code>fetchLater</code></td><td>任意</td><td>否</td><td>有配额，超出抛 <code>QuotaExceededError</code></td><td>仅 Chromium</td></tr></tbody></table>
<p>很多人会想：<code>sendBeacon</code> 返回 <code>false</code>，那就换 keepalive 再试一次。可是 <code>false</code> 多半意味着配额满了，而两者共用同一份配额，换了也一样失败。</p>
<p>所以可靠的做法是平时按数量或时间分批发送，离开时只剩一小块数据要发。keepalive 只用作不支持 <code>sendBeacon</code> 的环境下的回退。返回值的含义、Content-Type 和跨源预检的细节见<a href="/questions/api-send-beacon/">《sendBeacon 返回 true 就代表上报成功了吗？它发出的是什么样的请求？》</a>。</p>
<h2>平时攒批，离开时只发剩下的</h2>
<p>把上面几点合起来，就是一个简单的上报队列：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> queue = [];
<span class="hljs-keyword">const</span> <span class="hljs-variable constant_">MAX_BATCH</span> = <span class="hljs-number">20</span>;

<span class="hljs-keyword">export</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">track</span>(<span class="hljs-params">event</span>) {
  queue.<span class="hljs-title function_">push</span>({ <span class="hljs-attr">id</span>: crypto.<span class="hljs-title function_">randomUUID</span>(), <span class="hljs-attr">time</span>: <span class="hljs-title class_">Date</span>.<span class="hljs-title function_">now</span>(), ...event });
  <span class="hljs-keyword">if</span> (queue.<span class="hljs-property">length</span> &gt;= <span class="hljs-variable constant_">MAX_BATCH</span>) <span class="hljs-title function_">flush</span>();
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">flush</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">if</span> (queue.<span class="hljs-property">length</span> === <span class="hljs-number">0</span>) <span class="hljs-keyword">return</span>;
  <span class="hljs-keyword">const</span> body = <span class="hljs-title class_">JSON</span>.<span class="hljs-title function_">stringify</span>(queue.<span class="hljs-title function_">splice</span>(<span class="hljs-number">0</span>, queue.<span class="hljs-property">length</span>));
  navigator.<span class="hljs-title function_">sendBeacon</span>(<span class="hljs-string">&#x27;/api/collect&#x27;</span>, body); <span class="hljs-comment">// 字符串以 text/plain 发出</span>
}

<span class="hljs-built_in">setInterval</span>(flush, <span class="hljs-number">10_000</span>);
<span class="hljs-variable language_">document</span>.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;visibilitychange&#x27;</span>, <span class="hljs-function">() =&gt;</span> {
  <span class="hljs-keyword">if</span> (<span class="hljs-variable language_">document</span>.<span class="hljs-property">visibilityState</span> === <span class="hljs-string">&#x27;hidden&#x27;</span>) <span class="hljs-title function_">flush</span>();
});
</code></pre></div>
<p>攒够 20 条或者每 10 秒发一次，单次体积就不会大到超出配额；页面隐藏时把剩下的发掉。每条事件带 <code>crypto.randomUUID()</code> 生成的 ID，服务端按 ID 去重，因为同一会话里页面可能多次隐藏又恢复。</p>
<h2>fetchLater 怎么用</h2>
<p><code>fetchLater</code> 的思路不一样：不用抓离开的时机，先把请求登记好，由浏览器决定什么时候发。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">let</span> controller;
<span class="hljs-keyword">function</span> <span class="hljs-title function_">schedule</span>(<span class="hljs-params">data</span>) {
  <span class="hljs-keyword">if</span> (!(<span class="hljs-string">&#x27;fetchLater&#x27;</span> <span class="hljs-keyword">in</span> <span class="hljs-variable language_">window</span>)) <span class="hljs-keyword">return</span>; <span class="hljs-comment">// 降级到 visibilitychange + sendBeacon</span>
  controller?.<span class="hljs-title function_">abort</span>(); <span class="hljs-comment">// 数据更新时取消旧请求再重新登记</span>
  controller = <span class="hljs-keyword">new</span> <span class="hljs-title class_">AbortController</span>();
  <span class="hljs-keyword">try</span> {
    <span class="hljs-title function_">fetchLater</span>(<span class="hljs-string">&#x27;/collect&#x27;</span>, {
      <span class="hljs-attr">method</span>: <span class="hljs-string">&#x27;POST&#x27;</span>,
      <span class="hljs-attr">body</span>: <span class="hljs-title class_">JSON</span>.<span class="hljs-title function_">stringify</span>(data),
      <span class="hljs-attr">signal</span>: controller.<span class="hljs-property">signal</span>,
      <span class="hljs-attr">activateAfter</span>: <span class="hljs-number">60_000</span>,
    });
  } <span class="hljs-keyword">catch</span> (error) {
    <span class="hljs-keyword">if</span> (error.<span class="hljs-property">name</span> !== <span class="hljs-string">&#x27;QuotaExceededError&#x27;</span>) <span class="hljs-keyword">throw</span> error;
  }
}
</code></pre></div>
<p>为什么每次登记前都要 <code>abort</code> 旧的？因为数据一直在更新，旧的请求已经过时了，取消它再登记新的，最后发出去的就是最新数据，也不会重复。</p>
<p>它的价值在于：页面被销毁或者进入 bfcache 时，浏览器会发出已登记的请求，不依赖离开事件有没有触发。<code>activateAfter: 60_000</code> 表示就算页面一直没关，60 秒后也会发。</p>
<p>它也有限制：只接受 HTTPS 这类可信 URL，请求体不能是流，响应会被丢弃，还受 CSP 的 <code>connect-src</code> 约束。</p>
<h2>常见追问</h2>
<p><strong>为什么不在 <code>beforeunload</code> 里用同步 XHR？</strong></p>
<blockquote>
<p>同步请求会卡住页面离开，体验很差。而且 Chrome 等浏览器已经禁止在页面卸载期间发送同步 XHR，可靠性也没有保证。</p>
</blockquote>
<p><strong>数据会不会重复上报？</strong></p>
<blockquote>
<p>会。<code>hidden</code> 可能触发很多次，所以每条事件带一个 ID 去重，服务端也要能处理重复数据。</p>
</blockquote>
<p><strong>上报接口要带 Cookie 吗？</strong></p>
<blockquote>
<p>尽量不带，改用 URL 参数或者请求体里的匿名 ID。这样可以避开跨站 Cookie 带来的各种限制。</p>
</blockquote>`};export{e as default};