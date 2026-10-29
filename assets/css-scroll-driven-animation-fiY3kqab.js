var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>普通动画按时间往前走。滚动驱动动画把进度换成了滚动进度，滚到一半动画就播到一半，往回滚动画就倒着放。</p>
<p>用 <code>animation-timeline</code> 指定跟着什么走。<code>scroll()</code> 跟着滚动容器的滚动位置，适合阅读进度条；<code>view()</code> 跟着元素穿过视口的进度，适合元素滚进来时淡入。<code>animation-range</code> 可以只截取其中一段，比如 <code>entry 0% cover 40%</code>，表示从元素开始进入视口，到覆盖视口 40% 时动画完成。</p>
<p>如果只动 <code>transform</code> 和 <code>opacity</code>，浏览器通常可以交给合成线程处理，主线程忙的时候受影响也小，具体看浏览器实现。</p>
<p>要注意，<code>animation-timeline</code> 目前支持有限，不支持的浏览器会忽略它。所以要保证元素在那些浏览器里显示的是最终状态，而不是一直停在隐藏状态。</p>
</blockquote>
<h2>阅读进度条</h2>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-keyword">@keyframes</span> grow {
  <span class="hljs-selector-tag">from</span> { <span class="hljs-attribute">transform</span>: <span class="hljs-built_in">scaleX</span>(<span class="hljs-number">0</span>); }
  <span class="hljs-selector-tag">to</span> { <span class="hljs-attribute">transform</span>: <span class="hljs-built_in">scaleX</span>(<span class="hljs-number">1</span>); }
}

<span class="hljs-selector-class">.progress</span> {
  <span class="hljs-attribute">position</span>: fixed;
  <span class="hljs-attribute">inset-block-start</span>: <span class="hljs-number">0</span>;
  <span class="hljs-attribute">inset-inline</span>: <span class="hljs-number">0</span>;
  <span class="hljs-attribute">block-size</span>: <span class="hljs-number">4px</span>;
  <span class="hljs-attribute">transform-origin</span>: <span class="hljs-number">0</span> <span class="hljs-number">50%</span>;
  <span class="hljs-attribute">background</span>: steelblue;
  <span class="hljs-attribute">animation</span>: grow linear both;
  <span class="hljs-attribute">animation-timeline</span>: <span class="hljs-built_in">scroll</span>(root);
}
</code></pre></div>
<p>页面顶部一条 4px 高的条，<code>scroll(root)</code> 让它跟着整个页面的滚动走。滚到顶是 0，条看不见；滚到底是 1，条铺满整行。</p>
<p>为什么 <code>animation</code> 里没写时长？因为进度由滚动决定，时长对滚动时间线没有意义。</p>
<p>还有一个顺序上的坑：<code>animation-timeline</code> 要写在 <code>animation</code> 简写的后面。简写会把没写的子属性都重置一遍，<code>animation-timeline</code> 也在其中，写在前面就被覆盖了。</p>
<h2>卡片滚进视口时淡入</h2>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-keyword">@keyframes</span> reveal {
  <span class="hljs-selector-tag">from</span> { <span class="hljs-attribute">opacity</span>: <span class="hljs-number">0</span>; <span class="hljs-attribute">transform</span>: <span class="hljs-built_in">translateY</span>(<span class="hljs-number">24px</span>); }
}

<span class="hljs-keyword">@supports</span> (<span class="hljs-attribute">animation-timeline</span>: view()) {
  <span class="hljs-selector-class">.card</span> {
    <span class="hljs-attribute">animation</span>: reveal linear both;
    <span class="hljs-attribute">animation-timeline</span>: <span class="hljs-built_in">view</span>();
    <span class="hljs-attribute">animation-range</span>: entry <span class="hljs-number">0%</span> cover <span class="hljs-number">30%</span>;
  }
}
</code></pre></div>
<p>为什么要套 <code>@supports</code>？动画的起点是透明的，要是浏览器不认识滚动时间线，这个起点状态就不该冒出来。整个规则放进 <code>@supports</code> 以后，不支持的浏览器根本不会应用这个动画，卡片直接正常显示，不会出现永远透明看不见的内容。</p>
<h2>和 IntersectionObserver 有什么区别</h2>
<p>IntersectionObserver 是在元素进入视口时触发一次回调，适合“出现以后播放一次”的动画和图片懒加载。</p>
<p>滚动驱动动画的进度和滚动位置一一对应，往回滚就倒回去。所以它适合进度条、视差这类要跟着滚动连续变化的效果。</p>
<h2>要注意什么</h2>
<p>用户开启了减少动态效果时，用 <code>prefers-reduced-motion</code> 把这些动画关掉。</p>
<p>不要用滚动动画来隐藏关键内容或者改变布局。读屏用户和不支持的浏览器都会受影响。</p>
<h2>常见追问</h2>
<p><strong>JavaScript 里能用滚动时间线吗？</strong></p>
<blockquote>
<p>可以。<code>new ScrollTimeline({ source })</code> 和 <code>ViewTimeline</code> 创建出来的时间线，可以传给 Web Animations API 的 <code>timeline</code> 选项。</p>
</blockquote>`};export{e as default};