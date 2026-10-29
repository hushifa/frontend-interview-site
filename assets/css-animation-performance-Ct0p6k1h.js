var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>按钮悬停时轻轻上移这种“从一个状态变到另一个状态”的效果，用 transition。加载中一闪一闪、要循环播放、或者有好几段关键帧的过程，用 animation。</p>
<p>如果位置要靠 JavaScript 算，比如跟着拖拽走、做物理效果、画 Canvas，就用 requestAnimationFrame。它在每次渲染前调用一次回调，进度要按时间戳算，不能每帧固定加一个数。</p>
<p>卡不卡主要看每一帧改了什么。改宽高会重新布局，改背景会重绘，<code>transform</code> 和 <code>opacity</code> 通常只需要合成，最便宜。想要暂停、反向、等动画结束，又不想手写逐帧循环，可以用 Web Animations API。</p>
<p>不管用哪种，都要照顾开了“减少动态效果”的用户，给 <code>prefers-reduced-motion</code> 提供不动的版本。</p>
</blockquote>
<h2>transition：两个状态之间的过渡</h2>
<p>下面是按钮悬停或键盘聚焦时上移 2px：</p>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.action</span> {
  <span class="hljs-attribute">transition</span>: transform <span class="hljs-number">180ms</span> ease;
}

<span class="hljs-selector-class">.action</span><span class="hljs-selector-pseudo">:hover</span>,
<span class="hljs-selector-class">.action</span><span class="hljs-selector-pseudo">:focus-visible</span> {
  <span class="hljs-attribute">transform</span>: <span class="hljs-built_in">translateY</span>(-<span class="hljs-number">2px</span>);
}

<span class="hljs-keyword">@media</span> (<span class="hljs-attribute">prefers-reduced-motion</span>: reduce) {
  <span class="hljs-selector-class">.action</span> {
    <span class="hljs-attribute">transition</span>: none;
  }
}
</code></pre></div>
<p>transition 自己不会启动。只有样式值发生变化时，比如进入 <code>:hover</code>，它才把旧值到新值的过程补出来。</p>
<p>要过渡哪个属性最好明确写出来。写成 <code>transition: all</code>，以后有人改了宽度、外边距，这些布局属性也会被带进动画里，既不是本意，又费性能。</p>
<h2>animation：按关键帧播放的过程</h2>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-keyword">@keyframes</span> pulse {
  <span class="hljs-number">50%</span> { <span class="hljs-attribute">opacity</span>: <span class="hljs-number">0.5</span>; }
}

<span class="hljs-selector-class">.pending</span> {
  <span class="hljs-attribute">animation</span>: pulse <span class="hljs-number">1.2s</span> ease-in-out infinite;
}
</code></pre></div>
<p>animation 不需要状态变化，元素一有这个类就开始播放，可以循环。</p>
<p>有人会用 <code>animation-fill-mode: forwards</code> 让元素停在最后一帧，就当作最终状态了。可是 <code>animation-fill-mode</code> 只决定动画开始前、结束后要不要保留关键帧的样式，它不会改写元素本来的样式。动画结束后需要稳定保持的状态，应该另外用类名或样式来维护。</p>
<h2>requestAnimationFrame：用 JavaScript 逐帧计算</h2>
<p>rAF 只会在下一次渲染前调用一次回调。想要继续动，就在回调里再申请下一帧。下面这个函数把元素横向移动 <code>distance</code> 像素，并返回一个取消函数：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">animateTranslate</span>(<span class="hljs-params">element, distance, duration = <span class="hljs-number">300</span></span>) {
  <span class="hljs-keyword">if</span> (!<span class="hljs-title class_">Number</span>.<span class="hljs-built_in">isFinite</span>(distance) ||
      !<span class="hljs-title class_">Number</span>.<span class="hljs-built_in">isFinite</span>(duration) || duration &lt; <span class="hljs-number">0</span>) {
    <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">RangeError</span>(<span class="hljs-string">&#x27;位移必须是有限数值，时长必须是非负有限数值&#x27;</span>);
  }

  <span class="hljs-keyword">const</span> reduceMotion = <span class="hljs-title function_">matchMedia</span>(<span class="hljs-string">&#x27;(prefers-reduced-motion: reduce)&#x27;</span>).<span class="hljs-property">matches</span>;
  <span class="hljs-keyword">if</span> (duration === <span class="hljs-number">0</span> || reduceMotion) {
    element.<span class="hljs-property">style</span>.<span class="hljs-property">transform</span> = <span class="hljs-string">\`translateX(<span class="hljs-subst">\${distance}</span>px)\`</span>;
    <span class="hljs-keyword">return</span> <span class="hljs-function">() =&gt;</span> {};
  }

  <span class="hljs-keyword">let</span> frameId = <span class="hljs-literal">null</span>;
  <span class="hljs-keyword">let</span> startedAt;
  <span class="hljs-keyword">let</span> cancelled = <span class="hljs-literal">false</span>;

  <span class="hljs-keyword">function</span> <span class="hljs-title function_">frame</span>(<span class="hljs-params">now</span>) {
    <span class="hljs-keyword">if</span> (cancelled) <span class="hljs-keyword">return</span>;
    startedAt ??= now;
    <span class="hljs-keyword">const</span> progress = <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">min</span>((now - startedAt) / duration, <span class="hljs-number">1</span>);
    element.<span class="hljs-property">style</span>.<span class="hljs-property">transform</span> = <span class="hljs-string">\`translateX(<span class="hljs-subst">\${distance * progress}</span>px)\`</span>;

    <span class="hljs-keyword">if</span> (progress &lt; <span class="hljs-number">1</span>) frameId = <span class="hljs-title function_">requestAnimationFrame</span>(frame);
    <span class="hljs-keyword">else</span> frameId = <span class="hljs-literal">null</span>;
  }

  frameId = <span class="hljs-title function_">requestAnimationFrame</span>(frame);
  <span class="hljs-keyword">return</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">cancel</span>(<span class="hljs-params"></span>) {
    cancelled = <span class="hljs-literal">true</span>;
    <span class="hljs-keyword">if</span> (frameId !== <span class="hljs-literal">null</span>) <span class="hljs-title function_">cancelAnimationFrame</span>(frameId);
    frameId = <span class="hljs-literal">null</span>;
  };
}
</code></pre></div>
<p>重点看 <code>progress</code> 是怎么来的：已经过去的时间除以总时长。为什么不直接写“每帧加 2px”？因为不同屏幕的刷新率不一样，60Hz 的屏幕一秒 60 帧，120Hz 的一秒 120 帧。每帧加固定值，120Hz 上就会快一倍。按时间算，两种屏幕在同一时刻走到的位置是一样的。</p>
<p>开了减少动态效果或者时长为 0 时，函数直接把元素放到终点，不做动画。</p>
<p>还有一个细节。标签页切到后台时，rAF 通常会暂停。切回来以后，这段代码按已经过去的时间计算，元素会直接跳到对应的位置。如果业务想要“后台时暂停计时”，就要自己记下暂停了多久。</p>
<h2>为什么改 transform 比改 width 流畅</h2>
<p>浏览器画一帧大致分三步：先算每个元素的位置和大小，这叫布局；再把颜色、文字画出来，这叫绘制；最后把画好的几层叠到一起，这叫合成。</p>
<p>改 <code>width</code>、<code>top</code>、<code>margin</code> 这类属性，每一帧都可能要重新布局，后面的绘制和合成也得跟着做。<code>transform</code> 和 <code>opacity</code> 在合适的条件下只需要合成，而且由合成器处理，主线程忙的时候动画也可能保持流畅。</p>
<p><code>will-change</code> 能让浏览器提前创建合成层，但它会占显存，只在测量后确实需要时短期使用。</p>
<p>rAF 回调里还要注意读写顺序。读一下 <code>offsetWidth</code>、写一下样式、再读、再写，浏览器每次读都得先把布局算出来，这叫强制同步布局。应该先集中读，再集中写。</p>
<p>到底慢在哪里，用浏览器 Performance 面板看每一帧花在布局、绘制、合成上的时间，再决定要不要改。</p>
<h2>常见追问</h2>
<p><strong>CSS 动画一定比 JS 动画快吗？</strong></p>
<blockquote>
<p>不一定。两者改的是同样的属性时，成本差不多。差别在于，CSS 动画和 Web Animations API 做 <code>transform</code>、<code>opacity</code> 动画时通常可以交给合成器处理，主线程忙的时候受的影响小得多；而 rAF 的回调本身就跑在主线程上。</p>
</blockquote>`};export{e as default};