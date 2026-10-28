var e={answerHtml:`<h2>简答</h2>
<ul>
<li>IntersectionObserver 在元素与视口或指定容器的相交比例跨过阈值时异步回调。</li>
<li>常用于图片懒加载、无限滚动的触底检测和广告曝光统计。</li>
<li>它只计算几何相交，元素被其他元素盖住、透明或页面在后台时也可能报告为相交。</li>
<li>相比监听 <code>scroll</code> 再读 <code>getBoundingClientRect()</code>，它不会在主线程上强制同步布局。</li>
</ul>
<h2>关键参数</h2>
<ul>
<li><code>root</code>：参照容器，默认是视口。</li>
<li><code>rootMargin</code>：扩大或缩小参照区域，例如 <code>&#x27;200px 0px&#x27;</code> 让元素进入视口前 200px 就触发，用于提前加载。</li>
<li><code>threshold</code>：触发回调的相交比例，可以是数组，例如 <code>[0, 0.5, 1]</code>。</li>
</ul>
<h2>懒加载示例</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> observer = <span class="hljs-keyword">new</span> <span class="hljs-title class_">IntersectionObserver</span>(
  <span class="hljs-function">(<span class="hljs-params">entries</span>) =&gt;</span> {
    <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> entry <span class="hljs-keyword">of</span> entries) {
      <span class="hljs-keyword">if</span> (!entry.<span class="hljs-property">isIntersecting</span>) <span class="hljs-keyword">continue</span>;
      <span class="hljs-keyword">const</span> img = entry.<span class="hljs-property">target</span>;
      img.<span class="hljs-property">src</span> = img.<span class="hljs-property">dataset</span>.<span class="hljs-property">src</span>;
      observer.<span class="hljs-title function_">unobserve</span>(img);
    }
  },
  { <span class="hljs-attr">rootMargin</span>: <span class="hljs-string">&#x27;200px 0px&#x27;</span> },
);

<span class="hljs-variable language_">document</span>.<span class="hljs-title function_">querySelectorAll</span>(<span class="hljs-string">&#x27;img[data-src]&#x27;</span>).<span class="hljs-title function_">forEach</span>(<span class="hljs-function">(<span class="hljs-params">img</span>) =&gt;</span> observer.<span class="hljs-title function_">observe</span>(img));
</code></pre></div>
<p>普通图片可以直接用原生 <code>loading=&quot;lazy&quot;</code>，只有需要自定义加载时机时才用 IntersectionObserver。</p>
<h2>曝光统计</h2>
<p>常见口径是&quot;至少 50% 面积进入视口并持续 1 秒&quot;：</p>
<ul>
<li><code>threshold: 0.5</code>，进入时记录时间，离开时取消计时。</li>
<li>页面切到后台时（<code>visibilitychange</code>）暂停计时。</li>
<li>同一元素只上报一次。</li>
</ul>
<p>如果需要排除被遮挡的情况，IntersectionObserver v2 提供了 <code>trackVisibility</code> 和 <code>isVisible</code>，目前只有 Chromium 支持，并且计算成本更高。</p>
<h2>常见追问</h2>
<ul>
<li>回调什么时候触发：调用 <code>observe()</code> 后会立即回调一次报告初始状态，之后只在跨过阈值时回调。</li>
<li>元素尺寸为 0 时：<code>isIntersecting</code> 可能为 <code>true</code> 但 <code>intersectionRatio</code> 为 0，判断时以 <code>isIntersecting</code> 为准。</li>
</ul>`};export{e as default};