var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>按钮悬停时颜色慢慢变深，用 <code>transition</code>；加载图标一直转圈，用 <code>animation</code>。这两个例子基本就是两者的分工。</p>
<p><code>transition</code> 管的是“变化的过程”。属性值本来会瞬间从 A 变成 B，加了 <code>transition</code> 以后，浏览器在设定的时长里把中间值补出来。所以它必须有一次值的变化来触发，比如进入 <code>:hover</code>、切换类名，而且只有起点和终点两个状态。</p>
<p><code>animation</code> 管的是“一段写好的动画”。用 <code>@keyframes</code> 定义起点、终点和中间任意多个关键帧，元素一应用 <code>animation</code> 就开始播放，不需要状态变化。它还能设置播放次数（包括无限循环）、方向、暂停，以及开始前和结束后要不要保留关键帧的样式。</p>
<p>两者都会触发事件：<code>transition</code> 有 <code>transitionrun</code>、<code>transitionstart</code>、<code>transitionend</code>，<code>animation</code> 有 <code>animationstart</code>、<code>animationiteration</code>、<code>animationend</code>。要注意 <code>transitionend</code> 在过渡被中途打断时不会触发。</p>
</blockquote>
<h2>写法对比</h2>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-comment">/* transition：值变化时补出过程 */</span>
<span class="hljs-selector-class">.button</span> {
  <span class="hljs-attribute">background</span>: <span class="hljs-number">#3b82f6</span>;
  <span class="hljs-attribute">transition</span>: background-color <span class="hljs-number">200ms</span> ease;
}
<span class="hljs-selector-class">.button</span><span class="hljs-selector-pseudo">:hover</span> {
  <span class="hljs-attribute">background</span>: <span class="hljs-number">#1d4ed8</span>;
}

<span class="hljs-comment">/* animation：关键帧定义好过程，应用后自动播放 */</span>
<span class="hljs-keyword">@keyframes</span> spin {
  <span class="hljs-selector-tag">to</span> {
    <span class="hljs-attribute">transform</span>: <span class="hljs-built_in">rotate</span>(<span class="hljs-number">360deg</span>);
  }
}
<span class="hljs-selector-class">.loading</span> {
  <span class="hljs-attribute">animation</span>: spin <span class="hljs-number">1s</span> linear infinite;
}
</code></pre></div>
<p><code>.button</code> 平时不会动，鼠标移上去，背景色的值从一个颜色变成另一个，<code>transition</code> 才把这 200ms 的过程画出来；鼠标移开，值变回去，又会反向过渡一次。</p>
<p><code>.loading</code> 不需要任何触发，元素一有这个类就开始转，<code>infinite</code> 让它一直循环。MDN 的说明是，CSS 动画由两部分组成：描述动画的样式，以及表示起点、终点和可能的中间点的一组关键帧。</p>
<h2>为什么刚插入的元素 transition 不生效</h2>
<p>一个常见的坑：用 JavaScript 创建元素，插入页面后马上改样式，结果没有过渡效果，直接跳到了终点。原因是浏览器还没为这个元素算过一次样式，它没有“旧值”，也就谈不上从旧值过渡。</p>
<p>用 headless Chrome 实测，新建元素插入后立刻改 <code>width</code>，<code>getAnimations()</code> 得到 0 个动画；先读一次 <code>getComputedStyle(el).width</code> 再改，就得到 1 个过渡。更现代的做法是用 <code>@starting-style</code> 声明进入时的起始样式，见<a href="/questions/css-starting-style-discrete-transition/">《@starting-style 和离散属性过渡解决了什么问题？》</a>。<code>animation</code> 没有这个问题，因为关键帧本身就给出了起点。</p>
<h2>两者的能力差在哪里</h2>
<p><code>animation</code> 的子属性比 <code>transition</code> 多。<code>animation-iteration-count</code> 控制播放次数，<code>animation-direction</code> 控制每一轮正着放、倒着放还是交替，<code>animation-play-state</code> 可以暂停和继续，<code>animation-fill-mode</code> 决定动画开始前、结束后要不要应用关键帧里的样式。<code>transition</code> 只有属性、时长、缓动函数、延迟，以及控制离散属性的 <code>transition-behavior</code>。</p>
<p>所以只是两个状态之间的切换，比如悬停、展开收起、显示隐藏，用 <code>transition</code> 更简单，状态由类名控制，逻辑清楚。需要多个阶段、循环或者页面一加载就播放的效果，用 <code>animation</code>。</p>
<p>用 JavaScript 逐帧计算的 <code>requestAnimationFrame</code>，以及改哪些属性动画更流畅，见<a href="/questions/css-animation-performance/">《动画为什么会卡？transform、will-change 和 requestAnimationFrame 怎样让动画流畅？》</a>。</p>
<h2>常见追问</h2>
<p><strong>transitionend 为什么有时不触发？</strong></p>
<blockquote>
<p>MDN 说明，过渡在完成之前被中止时 <code>transitionend</code> 不会触发，比如元素被设成 <code>display: none</code>，或者过渡中的属性值又被改了。另外 CSS Transitions 规范规定，每个发生过渡的属性都会单独派发事件，一次过渡多个属性就会收到多次 <code>transitionend</code>，处理时要看 <code>event.propertyName</code>。</p>
</blockquote>
<p><strong>animation 结束后为什么样式又跳回去了？</strong></p>
<blockquote>
<p>默认情况下，动画结束后关键帧的样式就不再应用，元素回到自己本来的样式。可以用 <code>animation-fill-mode: forwards</code> 让它停在最后一帧，但更稳妥的做法是动画结束后用类名或样式把最终状态写到元素上。</p>
</blockquote>`};export{e as default};