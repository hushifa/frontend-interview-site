var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>用户说页面打开慢，先要知道慢在哪一段：是 DNS 慢、建连慢、服务端慢，还是下载和解析慢。浏览器把这次页面加载的每个关键时间点都记了下来，用 <code>performance.getEntriesByType(&#x27;navigation&#x27;)[0]</code> 就能拿到，这条记录的类型叫 <code>PerformanceNavigationTiming</code>。</p>
<p>这些时间点不是 Unix 时间戳，而是从 <code>performance.timeOrigin</code> 开始算的毫秒数，<code>startTime</code> 是 0。相邻两个时间点一减就是这一段的耗时，比如 DNS 是 <code>domainLookupEnd - domainLookupStart</code>。首字节时间 TTFB 就是 <code>responseStart</code>，它包含了重定向、DNS、连接和服务端处理。</p>
<p>还能用 <code>type</code> 字段区分是普通导航、刷新还是前进后退，分别是 <code>navigate</code>、<code>reload</code>、<code>back_forward</code>。</p>
<p>要注意，<code>loadEventEnd</code> 要等 <code>load</code> 回调执行完才有值，在 <code>load</code> 事件里读会得到 0，所以一般用 PerformanceObserver 来读。另外从 bfcache 恢复、SPA 切换路由，都不会产生新记录。</p>
</blockquote>
<h2>时间点按什么顺序排</h2>
<div class="not-prose code-block"><div class="code-language">代码</div><pre><code>startTime → redirectStart/End → fetchStart → domainLookupStart/End
→ connectStart → secureConnectionStart → connectEnd
→ requestStart → responseStart → responseEnd
→ domInteractive → domContentLoadedEventStart/End → domComplete → loadEventStart/End
</code></pre></div>
<p>顺着读就是一次导航的经过：先处理重定向，再查 DNS，然后建 TCP 连接，HTTPS 还要做 TLS 握手，接着发请求、收响应，最后解析文档、触发 <code>DOMContentLoaded</code> 和 <code>load</code>。</p>
<p>建连这一段要分开算。HTTPS 时，<code>connectStart</code> 到 <code>secureConnectionStart</code> 是 TCP，<code>secureConnectionStart</code> 到 <code>connectEnd</code> 是 TLS。</p>
<h2>怎样采集这些数据</h2>
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
<p>为什么不直接在 <code>load</code> 里读？因为 <code>loadEventEnd</code> 要等 <code>load</code> 回调全部执行完才写入，在 <code>load</code> 里读到的是 0。PerformanceObserver 在记录完成后才回调，那时 <code>loadEventEnd</code> 已经有值了。</p>
<p><code>buffered: true</code> 也很重要。观察者往往是在页面加载后才注册的，加了它，之前已经产生的记录也能拿到。</p>
<h2>读数时容易看错的地方</h2>
<p>时间值是相对值，不能直接传给 <code>new Date()</code>。要和日志时间对齐，用 <code>performance.timeOrigin + 相对值</code>。</p>
<p>DNS 和 TCP 耗时为 0 很正常，说明连接复用了或者命中了缓存。跨源重定向时，<code>redirectStart</code> 和 <code>redirectEnd</code> 都是 0，看不到重定向花了多久。</p>
<p><code>DOMContentLoaded</code> 和 <code>load</code> 都不等于业务就绪。首屏数据有没有渲染出来，要用 <code>performance.mark()</code> 自己打点。</p>
<p>预渲染的页面被激活时，<code>activationStart</code> 大于 0，在它之前的阶段用户根本看不到。算用户感知的耗时要减掉 <code>activationStart</code>，而且要和普通导航分开统计。</p>
<p>单次数据波动很大。线上要汇总后看 75 分位，再按设备、网络类型分组。</p>
<h2>常见追问</h2>
<p><strong>SPA 切换路由能用 Navigation Timing 统计吗？</strong></p>
<blockquote>
<p>不能。路由切换不是文档导航，不会产生新的记录。要自己用 <code>performance.mark()</code> 和 <code>measure()</code> 记录。</p>
</blockquote>
<p><strong>它和 Resource Timing 是什么关系？</strong></p>
<blockquote>
<p><code>PerformanceNavigationTiming</code> 继承自 <code>PerformanceResourceTiming</code>，所以也有 <code>transferSize</code>、<code>nextHopProtocol</code> 这些字段。另外它的 <code>serverTiming</code> 字段能读到服务端通过 <code>Server-Timing</code> 响应头传来的各阶段耗时，可以和前端数据对着分析。</p>
</blockquote>`};export{e as default};