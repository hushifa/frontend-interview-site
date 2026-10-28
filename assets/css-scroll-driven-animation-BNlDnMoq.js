var e={answerHtml:`<h2>简答</h2>
<ul>
<li>滚动驱动动画让关键帧随滚动进度前进，而不是随时间前进。</li>
<li><code>scroll()</code> 跟踪某个滚动容器的滚动进度，<code>view()</code> 跟踪目标元素穿过可见区域的过程。</li>
<li><code>animation-timeline</code> 把 <code>@keyframes</code> 动画连接到时间轴，适合阅读进度条、进入视区时的轻微渐显。</li>
<li>它不替代业务逻辑判断，要提供不支持时的降级，并尊重减少动态效果的偏好。</li>
</ul>
<p>普通 CSS 动画主要随时间前进：启动后，即使用户不滚动，过一秒也会走到一秒对应的关键帧。滚动驱动动画换了一种进度来源：<strong>滚到哪里，动画就走到哪里</strong>。滚动停止，进度通常停在当前位置；向回滚动，动画也可以向回变化。</p>
<p>这很适合顶部阅读进度条、与滚动位置绑定的图示、元素进入阅读区域时的轻微渐显。它不适合直接替代“进入视口后播放一次，之后不回退”的逻辑，后者通常需要 Intersection Observer 配合状态和普通动画。</p>
<h2>两种时间轴，回答不同问题</h2>
<p><code>scroll()</code> 创建滚动进度时间轴，关注某个滚动容器从起点到终点滚了多少。例如根文档在所选轴上滚到可滚动范围的一半，动画就大致来到一半。页面总高度包含当前视口，可滚动距离不能直接等同于整个文档高度。</p>
<p><code>view()</code> 创建可见进度时间轴，关注目标元素穿过最近相关滚动区域的过程。默认范围从它开始进入到完全离开，并不是“Intersection Observer 的可见面积比例”。一个元素完全位于视口中时，进度也不一定等于 100%。</p>
<p><code>animation-timeline</code> 把关键帧动画与这条时间轴连接起来；关键帧仍然通过 <code>@keyframes</code> 定义。命名的 <code>scroll-timeline</code>、<code>view-timeline</code> 可以用于更复杂的共享关系，但需要同时考虑名字的作用域和元素之间的结构。</p>
<h2>用根文档滚动驱动阅读进度条</h2>
<p>页面先有一个纯装饰的进度条元素，文章需要足够长，确实能够产生根文档滚动：</p>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">div</span> <span class="hljs-attr">class</span>=<span class="hljs-string">&quot;reading-progress&quot;</span> <span class="hljs-attr">aria-hidden</span>=<span class="hljs-string">&quot;true&quot;</span>&gt;</span><span class="hljs-tag">&lt;/<span class="hljs-name">div</span>&gt;</span>
<span class="hljs-tag">&lt;<span class="hljs-name">main</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">h1</span>&gt;</span>浏览器渲染专题<span class="hljs-tag">&lt;/<span class="hljs-name">h1</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">p</span>&gt;</span>这里放置实际的长篇文章内容。<span class="hljs-tag">&lt;/<span class="hljs-name">p</span>&gt;</span>
<span class="hljs-tag">&lt;/<span class="hljs-name">main</span>&gt;</span>
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.reading-progress</span> {
  <span class="hljs-attribute">display</span>: none;
}

<span class="hljs-keyword">@keyframes</span> reading-progress {
  <span class="hljs-selector-tag">from</span> { <span class="hljs-attribute">transform</span>: <span class="hljs-built_in">scaleX</span>(<span class="hljs-number">0</span>); }
  <span class="hljs-selector-tag">to</span> { <span class="hljs-attribute">transform</span>: <span class="hljs-built_in">scaleX</span>(<span class="hljs-number">1</span>); }
}

<span class="hljs-keyword">@supports</span> (<span class="hljs-attribute">animation-timeline</span>: scroll(root block)) {
  <span class="hljs-keyword">@media</span> (<span class="hljs-attribute">prefers-reduced-motion</span>: no-preference) {
    <span class="hljs-selector-class">.reading-progress</span> {
      <span class="hljs-attribute">display</span>: block;
      <span class="hljs-attribute">position</span>: fixed;
      <span class="hljs-attribute">top</span>: <span class="hljs-number">0</span>;
      <span class="hljs-attribute">left</span>: <span class="hljs-number">0</span>;
      <span class="hljs-attribute">width</span>: <span class="hljs-number">100%</span>;
      <span class="hljs-attribute">height</span>: <span class="hljs-number">3px</span>;
      <span class="hljs-attribute">background</span>: <span class="hljs-number">#2563eb</span>;
      <span class="hljs-attribute">transform-origin</span>: left center;
      <span class="hljs-attribute">pointer-events</span>: none;
      <span class="hljs-attribute">z-index</span>: <span class="hljs-number">10</span>;
      <span class="hljs-attribute">animation</span>: reading-progress linear both;
      <span class="hljs-attribute">animation-duration</span>: auto;
      <span class="hljs-attribute">animation-timeline</span>: <span class="hljs-built_in">scroll</span>(root block);
    }
  }
}
</code></pre></div>
<p><code>root</code> 明确选择根滚动容器，<code>block</code> 选择块方向，在常见横排页面中就是垂直滚动方向。<code>linear</code> 让关键帧变化与时间轴进度线性对应；<code>scaleX</code> 改变视觉长度，不需要每次滚动都修改元素布局宽度。</p>
<p>这里的 <code>animation-duration: auto</code> 对进度时间轴采用其相应范围，并不是让动画固定播放若干秒。<code>both</code> 指定填充行为，不能理解为“自动往返播放”。</p>
<p>特别注意声明顺序：<code>animation</code> 简写会把之前的 <code>animation-timeline</code> 重置为 <code>auto</code>。因此时间轴应放在简写后面，否则可能悄悄变回默认时间驱动动画。<code>animation-range</code> 等相关属性也应检查是否被后续简写重置。</p>
<h2>元素进入动画怎样限定范围</h2>
<p>若把下面规则用于文章中的插图，动画会跟随该插图进入滚动区域的过程：</p>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.illustration</span> {
  <span class="hljs-attribute">opacity</span>: <span class="hljs-number">1</span>;
  <span class="hljs-attribute">transform</span>: none;
}

<span class="hljs-keyword">@keyframes</span> reveal-illustration {
  <span class="hljs-selector-tag">from</span> {
    <span class="hljs-attribute">opacity</span>: <span class="hljs-number">0.6</span>;
    <span class="hljs-attribute">transform</span>: <span class="hljs-built_in">translateY</span>(<span class="hljs-number">1rem</span>);
  }
  <span class="hljs-selector-tag">to</span> {
    <span class="hljs-attribute">opacity</span>: <span class="hljs-number">1</span>;
    <span class="hljs-attribute">transform</span>: <span class="hljs-built_in">translateY</span>(<span class="hljs-number">0</span>);
  }
}

<span class="hljs-keyword">@supports</span> (<span class="hljs-attribute">animation-timeline</span>: view()) <span class="hljs-keyword">and</span> (<span class="hljs-attribute">animation-range</span>: entry <span class="hljs-number">0%</span> cover <span class="hljs-number">30%</span>) {
  <span class="hljs-keyword">@media</span> (<span class="hljs-attribute">prefers-reduced-motion</span>: no-preference) {
    <span class="hljs-selector-class">.illustration</span> {
      <span class="hljs-attribute">animation</span>: reveal-illustration linear both;
      <span class="hljs-attribute">animation-duration</span>: auto;
      <span class="hljs-attribute">animation-timeline</span>: <span class="hljs-built_in">view</span>();
      <span class="hljs-attribute">animation-range</span>: entry <span class="hljs-number">0%</span> cover <span class="hljs-number">30%</span>;
    }
  }
}
</code></pre></div>
<p><code>animation-range</code> 把动画限制在命名范围之间的部分进度。这里从进入开始，到 <code>cover</code> 穿越范围的 30% 结束，让渐显较早完成；它不表示“30% 的图片面积已经可见”。元素高度、滚动区域大小都会影响具体对应的滚动距离。</p>
<p>基础样式保持内容可见，而且动画起始透明度也不是 0。浏览器不支持、用户要求减少动画或增强规则不生效时，插图仍然能阅读。不能先在基础样式里隐藏所有内容，再期待所有设备都能成功播放进入动画。</p>
<h2>嵌套滚动与动态内容为什么会影响结果</h2>
<p><code>scroll()</code> 默认查找最近的相应滚动祖先；如果文章外面套了一层 <code>overflow: auto</code>，进度可能绑定到那一层，而不是整页。该区域没有足够的可滚动距离时，时间轴也可能无法产生有效进度。选择根滚动、最近滚动或自身滚动，需要与实际布局一致。</p>
<p>图片迟到、折叠内容展开、列表继续加载，会改变可滚动距离。同一个 scrollTop 对应的百分比因此可能变化，进度条出现跳动不一定是浏览器算错。应预留图片空间，并确认“当前已加载内容进度”是否就是产品想表达的含义。</p>
<p>如果动画本身不断改变决定滚动范围的布局尺寸，也会增加计算和反馈复杂度。优先用 transform、opacity 这类通常不需要重排的属性，但它们也不保证在所有情况下都零成本或始终运行在合成线程。</p>
<p>CSS 声明时间轴可以减少手写滚动事件和频繁 DOM 读写，却不自动保证流畅。仍应测量实际绘制成本，并按目标浏览器核对 <code>animation-timeline</code>、<code>animation-range</code> 等具体能力。业务状态、阅读完成判定和统计数据也不应只靠这个装饰动画推导。</p>`};export{e as default};