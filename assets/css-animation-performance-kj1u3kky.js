var e={answerHtml:`<h2>简答</h2>
<ul>
<li>两个明确状态之间的反馈用 transition；多关键帧、循环或独立启动的过程用 animation。</li>
<li>物理计算、Canvas 绘制或跟随拖拽时用 requestAnimationFrame，并按时间戳计算进度，不要每帧固定加一个值。</li>
<li>性能看每帧做了什么：改宽高会触发布局，改背景会重绘，<code>transform</code> 和 <code>opacity</code> 通常可以只在合成阶段处理。</li>
<li>需要暂停、反向或等待结束，又不想手写逐帧循环时，用 Web Animations API。</li>
<li>所有方式都要为 <code>prefers-reduced-motion</code> 提供静态替代。</li>
</ul>
<h2>transition</h2>
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
<p>transition 只在样式值发生变化时运行。明确列出要过渡的属性，<code>transition: all</code> 容易把布局属性也带进动画。</p>
<h2>animation</h2>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-keyword">@keyframes</span> pulse {
  <span class="hljs-number">50%</span> { <span class="hljs-attribute">opacity</span>: <span class="hljs-number">0.5</span>; }
}

<span class="hljs-selector-class">.pending</span> {
  <span class="hljs-attribute">animation</span>: pulse <span class="hljs-number">1.2s</span> ease-in-out infinite;
}
</code></pre></div>
<p><code>animation-fill-mode</code> 只决定动画区间外是否保留关键帧样式，不会改写元素的基础样式。动画结束后需要的稳定状态，应由类名或样式单独维护。</p>
<h2>requestAnimationFrame</h2>
<p>rAF 在下一次渲染前调用一次回调，要继续就在回调里再申请。下面的函数把元素横向移动到 <code>distance</code>，返回取消函数：</p>
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
<p>进度由时间差除以总时长得到，60Hz 和 120Hz 屏幕在相同时间内走到相同位置。如果写成“每帧加 2px”，速度会随刷新率变化。</p>
<p>后台标签页的 rAF 通常暂停，回到前台后这段代码会按已流逝时间直接跳到对应位置。业务需要“后台暂停计时”时，要自己记录暂停时段。</p>
<h2>性能</h2>
<ul>
<li>布局属性（<code>width</code>、<code>top</code>、<code>margin</code>）的动画每帧都可能重新布局。</li>
<li><code>transform</code>、<code>opacity</code> 在合适条件下由合成器处理，主线程繁忙时仍可能流畅。</li>
<li><code>will-change</code> 会提前创建合成层，占用显存，只在测量证明需要时短期使用。</li>
<li>在 rAF 回调里交替读取布局和写样式，会造成强制同步布局。先集中读，再集中写。</li>
</ul>
<p>用浏览器 Performance 面板查看每帧的布局、绘制和合成耗时，再决定是否需要改写。</p>
<h2>常见追问</h2>
<ul>
<li>CSS 动画一定比 JS 动画快吗？不一定。两者改同样的属性时成本相近，差别在于 CSS 和 WAAPI 的 <code>transform</code>、<code>opacity</code> 动画可以交给合成器，不受主线程阻塞影响。</li>
</ul>`};export{e as default};