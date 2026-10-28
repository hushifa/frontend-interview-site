var e={answerHtml:`<h2>简答</h2>
<ul>
<li>上报时机选 <code>visibilitychange</code> 且 <code>visibilityState === &#x27;hidden&#x27;</code>；<code>unload</code>、<code>beforeunload</code> 在移动端常常不触发，<code>unload</code> 还会妨碍 bfcache。</li>
<li><code>sendBeacon</code> 与 <code>fetch</code> 的 <code>keepalive</code> 共用 64 KiB 配额，超额时互相回退也会失败；要平时分批 flush、控制单次体积。两者的细节见<a href="/questions/api-send-beacon/">《sendBeacon 返回 true 就代表上报成功了吗？页面离开时怎样发送统计？》</a>。</li>
<li><code>fetchLater</code> 让浏览器在页面离开或 <code>activateAfter</code> 超时后代为发送，适合&quot;先登记、最后再发&quot;，但仍是实验性 API，目前只有 Chromium 系浏览器支持，必须做特性检测和降级。</li>
</ul>
<h2>上报时机</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-variable language_">document</span>.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;visibilitychange&#x27;</span>, <span class="hljs-function">() =&gt;</span> {
  <span class="hljs-keyword">if</span> (<span class="hljs-variable language_">document</span>.<span class="hljs-property">visibilityState</span> === <span class="hljs-string">&#x27;hidden&#x27;</span>) <span class="hljs-title function_">flush</span>();
});
</code></pre></div>
<p>用户切到其他应用后再从任务管理器杀掉浏览器时，<code>unload</code> 根本没有机会执行，而 <code>visibilitychange</code> 在切走时就已触发。<code>hidden</code> 不一定意味着离开，用户可能回来，所以 flush 只发送当前缓冲的数据，后续数据继续累积。</p>
<p><code>pagehide</code> 与 bfcache 兼容，但可靠性问题和 <code>unload</code> 类似，MDN 推荐优先使用 <code>visibilitychange</code>。bfcache 的细节见<a href="/questions/browser-bfcache/">《bfcache 与 HTTP 缓存有什么区别？》</a>。</p>
<h2>三种方式怎么选</h2>
<table><thead><tr><th>方式</th><th>方法</th><th>读响应</th><th>体积限制</th><th>兼容性</th></tr></thead><tbody><tr><td><code>sendBeacon</code></td><td>仅 POST</td><td>否</td><td>与 keepalive 共享 64 KiB</td><td>广泛支持</td></tr><tr><td><code>fetch</code> + <code>keepalive</code></td><td>任意</td><td>可以</td><td>与 sendBeacon 共享 64 KiB</td><td>广泛支持</td></tr><tr><td><code>fetchLater</code></td><td>任意</td><td>否</td><td>有配额，超出抛 <code>QuotaExceededError</code></td><td>仅 Chromium</td></tr></tbody></table>
<p><code>sendBeacon</code> 返回 <code>false</code> 多半是配额已满，这时改用 keepalive 同样会失败。可靠做法是平时按数量或时间分批 flush，离开时只发剩余的小块数据；keepalive 只作为不支持 <code>sendBeacon</code> 环境的回退。返回值、Content-Type 与预检的细节见<a href="/questions/api-send-beacon/">《sendBeacon 返回 true 就代表上报成功了吗？页面离开时怎样发送统计？》</a>。</p>
<h2>fetchLater</h2>
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
<p>它的价值在于无需抓准离开时机：页面被销毁或进入 bfcache 时，浏览器会发出已登记的请求，不依赖离开事件是否触发。限制包括：只接受 HTTPS 等可信 URL，请求体不能是流，响应会被丢弃，受 CSP <code>connect-src</code> 约束。</p>
<h2>常见追问</h2>
<ul>
<li>为什么不在 <code>beforeunload</code> 里用同步 XHR？同步请求阻塞页面离开，Chrome 等浏览器已禁止在页面卸载期间发送同步 XHR，体验和可靠性都差。</li>
<li>数据会不会重复？<code>hidden</code> 可能触发多次，用事件 ID 去重，服务端也要能处理重复。</li>
<li>上报接口要带 Cookie 吗？尽量用 URL 参数或请求体里的匿名 ID，减少跨站 Cookie 带来的限制。</li>
</ul>`};export{e as default};