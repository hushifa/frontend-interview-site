var e={answerHtml:`<h2>简答</h2>
<ul>
<li>跨源资源默认只公开 <code>startTime</code>、<code>duration</code>、<code>responseEnd</code> 等粗粒度时间，细分阶段被隐藏，防止跨站探测。</li>
<li>受 <code>Timing-Allow-Origin</code> 控制：<code>domainLookupStart/End</code>、<code>connectStart/End</code>、<code>secureConnectionStart</code>、<code>requestStart</code>、<code>responseStart</code>、<code>transferSize</code>、<code>nextHopProtocol</code>、<code>serverTiming</code> 等。</li>
<li>受 CORS 控制：<code>encodedBodySize</code>、<code>decodedBodySize</code>、<code>responseStatus</code>、<code>contentType</code>，资源要以 CORS 模式请求并通过检查才有值。</li>
<li><code>transferSize</code> 为 0 通常有两种情况：本地缓存命中，或跨源资源没有 TAO 授权。连接复用只会让连接阶段的耗时为 0，不影响 <code>transferSize</code>。</li>
<li><code>transferSize</code> 等于正文大小加上一个代表响应头的固定值，不是精确的线上字节数。</li>
</ul>
<h2>开放跨源细节</h2>
<p>资源服务器返回：</p>
<div class="not-prose code-block"><div class="code-language">http</div><pre><code class="hljs language-http">Timing-Allow-Origin: https://www.example.com
</code></pre></div>
<p>可以写 <code>*</code>，但只适合公开资源。CDN 上的字体、图片想做性能分析时，需要在 CDN 配置这个头。</p>
<h2>区分缓存命中和权限不足</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> entry <span class="hljs-keyword">of</span> performance.<span class="hljs-title function_">getEntriesByType</span>(<span class="hljs-string">&#x27;resource&#x27;</span>)) {
  <span class="hljs-keyword">const</span> crossOrigin = <span class="hljs-keyword">new</span> <span class="hljs-title function_">URL</span>(entry.<span class="hljs-property">name</span>).<span class="hljs-property">origin</span> !== location.<span class="hljs-property">origin</span>;
  <span class="hljs-comment">// 有 TAO 时连接相关字段非 0；只看 nextHopProtocol 会把缓存命中（也可能为空）误判成无 TAO</span>
  <span class="hljs-keyword">const</span> timingAllowed = !crossOrigin || entry.<span class="hljs-property">requestStart</span> &gt; <span class="hljs-number">0</span> || entry.<span class="hljs-property">nextHopProtocol</span> !== <span class="hljs-string">&#x27;&#x27;</span>;

  <span class="hljs-keyword">let</span> source;
  <span class="hljs-keyword">if</span> (!timingAllowed) source = <span class="hljs-string">&#x27;无 TAO，无法判断&#x27;</span>;
  <span class="hljs-keyword">else</span> <span class="hljs-keyword">if</span> (entry.<span class="hljs-property">transferSize</span> === <span class="hljs-number">0</span>) source = <span class="hljs-string">&#x27;本地缓存&#x27;</span>;
  <span class="hljs-keyword">else</span> <span class="hljs-keyword">if</span> (entry.<span class="hljs-property">transferSize</span> &lt; entry.<span class="hljs-property">encodedBodySize</span>) source = <span class="hljs-string">&#x27;验证后复用（304）&#x27;</span>;
  <span class="hljs-keyword">else</span> source = <span class="hljs-string">&#x27;网络&#x27;</span>;

  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(entry.<span class="hljs-property">name</span>, source, {
    <span class="hljs-attr">transferSize</span>: entry.<span class="hljs-property">transferSize</span>,
    <span class="hljs-attr">encodedBodySize</span>: entry.<span class="hljs-property">encodedBodySize</span>,
    <span class="hljs-attr">decodedBodySize</span>: entry.<span class="hljs-property">decodedBodySize</span>,
  });
}
</code></pre></div>
<p>这里用 <code>nextHopProtocol</code> 为空推断没有 TAO，是常用的经验方法；对同源或已授权的资源，<code>nextHopProtocol</code> 会是 <code>h2</code>、<code>h3</code> 等值。<code>decodedBodySize</code> 大于 <code>encodedBodySize</code> 说明资源经过了压缩。</p>
<h2>其他注意</h2>
<ul>
<li>资源条目缓冲区默认有限（通常 250 条），资源多的页面要用 <code>PerformanceObserver</code> 持续收集，或调用 <code>performance.setResourceTimingBufferSize()</code>。</li>
<li>Service Worker 返回的响应可以看 <code>workerStart</code>。</li>
<li><code>deliveryType</code> 可以标识缓存或导航预取，同样受 TAO 控制，支持情况因浏览器而异。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li>图片、脚本标签怎么用 CORS 模式请求？加 <code>crossorigin</code> 属性，服务器同时要返回 <code>Access-Control-Allow-Origin</code>。</li>
<li>为什么 <code>duration</code> 跨源也有值？总耗时被认为风险较低，规范保留了它；细分阶段可能泄露 DNS 缓存、连接复用等信息。</li>
</ul>`};export{e as default};