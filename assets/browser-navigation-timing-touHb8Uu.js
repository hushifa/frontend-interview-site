var e={answerHtml:`<h2>简答</h2>
<ul>
<li>用 <code>performance.getEntriesByType(&#x27;navigation&#x27;)[0]</code> 拿到当前文档导航的记录，时间以导航开始（<code>startTime</code> 为 0）为基准，单位是毫秒。</li>
<li>各阶段耗时由相邻时间点相减：DNS 是 <code>domainLookupEnd - domainLookupStart</code>，TCP 是 <code>secureConnectionStart - connectStart</code>（HTTPS 时），TLS 是 <code>connectEnd - secureConnectionStart</code>。</li>
<li>TTFB（首字节时间）是 <code>responseStart</code>，包含重定向、DNS、连接和服务端处理时间。</li>
<li><code>loadEventEnd</code> 在 <code>load</code> 回调执行完才有值，在 <code>load</code> 事件里读取会得到 0，应延后读取或用 PerformanceObserver。</li>
<li><code>type</code> 字段区分 <code>navigate</code>、<code>reload</code>、<code>back_forward</code>，从 bfcache 恢复不会产生新记录。</li>
</ul>
<h2>时间线</h2>
<div class="not-prose code-block"><div class="code-language">代码</div><pre><code>startTime → redirectStart/End → fetchStart → domainLookupStart/End
→ connectStart → secureConnectionStart → connectEnd
→ requestStart → responseStart → responseEnd
→ domInteractive → domContentLoadedEventStart/End → domComplete → loadEventStart/End
</code></pre></div>
<h2>采集示例</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">new</span> <span class="hljs-title class_">PerformanceObserver</span>(<span class="hljs-function">(<span class="hljs-params">list</span>) =&gt;</span> {
  <span class="hljs-keyword">const</span> [nav] = list.<span class="hljs-title function_">getEntries</span>();
  <span class="hljs-keyword">const</span> https = nav.<span class="hljs-property">secureConnectionStart</span> &gt; <span class="hljs-number">0</span>;
  <span class="hljs-title function_">report</span>({
    <span class="hljs-attr">type</span>: nav.<span class="hljs-property">type</span>,
    <span class="hljs-attr">redirect</span>: nav.<span class="hljs-property">redirectEnd</span> - nav.<span class="hljs-property">redirectStart</span>,
    <span class="hljs-attr">dns</span>: nav.<span class="hljs-property">domainLookupEnd</span> - nav.<span class="hljs-property">domainLookupStart</span>,
    <span class="hljs-attr">tcp</span>: (https ? nav.<span class="hljs-property">secureConnectionStart</span> : nav.<span class="hljs-property">connectEnd</span>) - nav.<span class="hljs-property">connectStart</span>,
    <span class="hljs-attr">tls</span>: https ? nav.<span class="hljs-property">connectEnd</span> - nav.<span class="hljs-property">secureConnectionStart</span> : <span class="hljs-number">0</span>,
    <span class="hljs-attr">ttfb</span>: nav.<span class="hljs-property">responseStart</span>,
    <span class="hljs-attr">download</span>: nav.<span class="hljs-property">responseEnd</span> - nav.<span class="hljs-property">responseStart</span>,
    <span class="hljs-attr">domContentLoaded</span>: nav.<span class="hljs-property">domContentLoadedEventEnd</span>,
    <span class="hljs-attr">load</span>: nav.<span class="hljs-property">loadEventEnd</span>,
  });
}).<span class="hljs-title function_">observe</span>({ <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;navigation&#x27;</span>, <span class="hljs-attr">buffered</span>: <span class="hljs-literal">true</span> });
</code></pre></div>
<ul>
<li><code>buffered: true</code> 让晚于导航注册的观察者也能拿到记录。</li>
<li>PerformanceObserver 在记录完成后才回调，此时 <code>loadEventEnd</code> 已有值。</li>
</ul>
<h2>读数时的注意事项</h2>
<ul>
<li>连接复用或命中缓存时，DNS 和 TCP 的耗时为 0，这是正常的。</li>
<li>跨源重定向时，<code>redirectStart</code> 和 <code>redirectEnd</code> 为 0，看不到重定向耗时。</li>
<li>单次数值波动很大，线上要汇总后看 75 分位，并按设备、网络类型分组。</li>
<li>SPA 的路由切换不是文档导航，不会产生新的 Navigation Timing 记录，需要自己用 <code>performance.mark()</code> 和 <code>measure()</code> 记录。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li>和 Resource Timing 的关系：<code>PerformanceNavigationTiming</code> 继承自 <code>PerformanceResourceTiming</code>，所以也有 <code>transferSize</code>、<code>nextHopProtocol</code> 等字段。</li>
<li><code>serverTiming</code> 字段：服务端通过 <code>Server-Timing</code> 响应头传递的各阶段耗时，可以和前端数据对齐分析。</li>
</ul>`};export{e as default};