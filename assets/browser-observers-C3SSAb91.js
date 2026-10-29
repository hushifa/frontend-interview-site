var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>图片滚到快进入屏幕时再加载，列表滚到底部时自动加载下一页，这类需求都要知道“某个元素有没有进入视口”。IntersectionObserver 就是干这个的：元素和视口（或者指定的容器）重叠的比例跨过你设的阈值时，它会异步回调通知你。</p>
<p>以前的做法是监听 <code>scroll</code>，再调用 <code>getBoundingClientRect()</code> 算位置，这会在主线程上强制同步布局。IntersectionObserver 不会。</p>
<p>常见用途是图片懒加载、无限滚动的触底检测、广告曝光统计。</p>
<p>要注意，它只算几何上有没有重叠。元素被别的元素盖住、是透明的、或者页面在后台，它都可能报告为“相交”。所以它不能证明用户真的看到了。</p>
</blockquote>
<h2>三个参数分别管什么</h2>
<p><code>root</code> 是参照的容器，默认是视口。</p>
<p><code>rootMargin</code> 用来扩大或缩小参照区域。比如写 <code>&#x27;200px 0px&#x27;</code>，元素离视口还有 200px 时就算进入了，适合提前加载。</p>
<p><code>threshold</code> 是触发回调的重叠比例，可以写成数组，比如 <code>[0, 0.5, 1]</code>，每跨过一个值回调一次。</p>
<h2>用它做图片懒加载</h2>
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
<p>真实地址先放在 <code>data-src</code> 里。图片进入视口前 200px 时，把它赋给 <code>src</code> 开始加载，然后 <code>unobserve</code> 停止观察，避免重复处理。</p>
<p>不过普通图片直接写原生的 <code>loading=&quot;lazy&quot;</code> 就行。只有需要自己控制加载时机时，才值得用 IntersectionObserver。</p>
<h2>曝光统计为什么不能只看“相交”</h2>
<p>广告曝光常见的口径是“至少 50% 面积进入视口，并且持续 1 秒”。做法是设 <code>threshold: 0.5</code>，进入时开始计时，离开时取消；页面切到后台时（<code>visibilitychange</code>）暂停计时；同一个元素只上报一次。</p>
<p>可是即使这样，IntersectionObserver 也只知道位置重叠了。元素被弹窗盖住、<code>opacity</code> 是 0，它照样报告为相交。</p>
<p>如果要排除被遮挡的情况，IntersectionObserver v2 提供了 <code>trackVisibility</code> 和 <code>isVisible</code>。但它目前只有 Chromium 支持，计算成本也更高。</p>
<h2>常见追问</h2>
<p><strong>IntersectionObserver 的回调什么时候触发？</strong></p>
<blockquote>
<p>调用 <code>observe()</code> 以后会立刻回调一次，报告元素当前的状态。之后只在重叠比例跨过阈值时才回调。</p>
</blockquote>
<p><strong>元素宽高为 0 时，intersectionRatio 是多少？</strong></p>
<blockquote>
<p>只要和参照区域相交，<code>intersectionRatio</code> 是 1，不相交是 0。所以判断有没有进入视口，应该看 <code>isIntersecting</code>，不要只看比例。</p>
</blockquote>`};export{e as default};