var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>Resource Timing 是浏览器记录的每个资源的加载时间线，比如 DNS 查询、建立连接、下载各花了多久。可是跨源资源默认只公开 <code>startTime</code>、<code>duration</code>、<code>responseEnd</code> 这种粗粒度的时间，细分阶段都是 0。这是为了防止别的网站通过这些时间去探测用户的信息。</p>
<p>这些字段分两类权限。DNS、连接、<code>requestStart</code>、<code>responseStart</code> 这些细分时间，以及 <code>transferSize</code>、<code>nextHopProtocol</code>、<code>serverTiming</code>，要资源服务器返回 <code>Timing-Allow-Origin</code> 响应头才开放，简称 TAO。<code>encodedBodySize</code>、<code>decodedBodySize</code>、<code>responseStatus</code>、<code>contentType</code> 则受 CORS 控制，资源要以 CORS 模式请求并通过检查才有值。</p>
<p>还要注意，<code>transferSize</code> 为 0 通常有两种情况：命中了本地缓存，或者跨源资源没给 TAO 授权。连接复用只会让连接阶段的耗时为 0，不影响 <code>transferSize</code>。另外 <code>transferSize</code> 是正文大小加上一个代表响应头的固定值，不是精确的线上字节数。</p>
</blockquote>
<h2>为什么要把跨源的细节藏起来</h2>
<p>设想一个恶意网站请求某个银行的图片。如果能拿到 DNS 和连接耗时，它就能推断出用户最近访问过这家银行，因为 DNS 有缓存、连接被复用了，这些阶段就会特别快。所以规范默认把细分阶段隐藏，只留下风险较低的总耗时。</p>
<h2>怎样开放跨源细节</h2>
<p>资源服务器在响应里加上这个头：</p>
<div class="not-prose code-block"><div class="code-language">http</div><pre><code class="hljs language-http">Timing-Allow-Origin: https://www.example.com
</code></pre></div>
<p>值也可以写 <code>*</code>，但只适合公开资源。CDN 上的字体、图片想做性能分析，就要在 CDN 上配置这个头。</p>
<p><code>encodedBodySize</code> 这类大小字段走的是 CORS，所以光有 TAO 还不够，图片、脚本标签要加 <code>crossorigin</code> 属性，服务器还要返回 <code>Access-Control-Allow-Origin</code>。</p>
<h2>怎样区分缓存命中和没有权限</h2>
<p><code>transferSize</code> 是 0 时，到底是缓存命中还是没权限？下面的代码先判断有没有 TAO，再看大小：</p>
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
<p>为什么判断 TAO 要同时看 <code>requestStart</code> 和 <code>nextHopProtocol</code>？因为浏览器没有直接告诉你“有没有授权”，只能从字段反推。没有授权时这些字段都是 0 或空字符串；同源或已授权的资源，<code>nextHopProtocol</code> 会是 <code>h2</code>、<code>h3</code> 这样的值。可是缓存命中时 <code>nextHopProtocol</code> 也可能为空，所以只看它会误判，要再加上 <code>requestStart</code>。这只是常用的经验方法，不是规范给出的判断方式。</p>
<p>另外，<code>decodedBodySize</code> 比 <code>encodedBodySize</code> 大，说明资源传输时经过了压缩。</p>
<h2>还有哪些要注意的</h2>
<p>资源条目的缓冲区默认是有限的，通常是 250 条。资源多的页面要用 <code>PerformanceObserver</code> 持续收集，或者调用 <code>performance.setResourceTimingBufferSize()</code> 调大。</p>
<p>资源如果是 Service Worker 返回的，可以看 <code>workerStart</code>。</p>
<p><code>deliveryType</code> 可以标识资源来自缓存还是导航预取，它同样受 TAO 控制，各浏览器的支持情况也不一样。</p>
<h2>常见追问</h2>
<p><strong>图片、脚本标签怎么用 CORS 模式请求？</strong></p>
<blockquote>
<p>在标签上加 <code>crossorigin</code> 属性，同时服务器要返回 <code>Access-Control-Allow-Origin</code>。</p>
</blockquote>
<p><strong>为什么跨源资源的 <code>duration</code> 也有值？</strong></p>
<blockquote>
<p>规范认为总耗时风险较低，所以保留了它。细分阶段才会泄露 DNS 缓存、连接复用这类信息，所以要授权才开放。</p>
</blockquote>`};export{e as default};