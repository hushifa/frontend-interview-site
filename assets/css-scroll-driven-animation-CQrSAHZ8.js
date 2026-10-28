var e={answerHtml:`<h2>简答</h2>
<ul>
<li>普通动画按时间推进；滚动驱动动画的进度等于滚动进度，往回滚动画就倒放。</li>
<li><code>animation-timeline: scroll()</code> 跟随滚动容器的滚动位置，<code>view()</code> 跟随元素穿过视口的进度。</li>
<li><code>animation-range</code> 截取时间线的一段，例如 <code>entry 0% cover 40%</code> 表示从元素进入视口到覆盖 40% 时完成。</li>
<li>只动画 <code>transform</code>、<code>opacity</code> 时，浏览器通常可以交给合成线程处理，主线程繁忙时受影响较小，具体取决于浏览器实现。</li>
<li><code>animation-timeline</code> 属于有限可用，不支持的浏览器忽略它；要让元素在那里保持最终状态，而不是停在隐藏状态。</li>
</ul>
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
<p><code>animation-duration</code> 对滚动时间线没有意义，示例简写里不写时长。注意 <code>animation-timeline</code> 要写在 <code>animation</code> 简写之后，否则会被简写重置。</p>
<p>动画只涉及 <code>transform</code>、<code>opacity</code> 时，浏览器通常可以把滚动驱动动画放到合成线程，主线程繁忙时受到的影响较小；其他属性仍要在主线程计算，具体行为由浏览器实现决定。</p>
<h2>进入视口时淡入</h2>
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
<p>放在 <code>@supports</code> 里，不支持的浏览器直接显示卡片，不会出现永远透明的内容。</p>
<h2>和 IntersectionObserver 的区别</h2>
<p>IntersectionObserver 在元素进入视口时触发一次回调，适合“出现后播放一次”的动画和懒加载。滚动驱动动画的进度和滚动位置一一对应，适合进度条、视差这类需要随滚动连续变化的效果。</p>
<h2>注意</h2>
<ul>
<li>用户开启减少动态效果时，用 <code>prefers-reduced-motion</code> 关闭这些动画。</li>
<li>不要用滚动动画隐藏关键内容或改变布局，读屏用户和不支持的浏览器都会受影响。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li>能在 JavaScript 里用吗？可以，<code>new ScrollTimeline({ source })</code> 和 <code>ViewTimeline</code> 可以传给 Web Animations API 的 <code>timeline</code> 选项。</li>
</ul>`};export{e as default};