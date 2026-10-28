var e={answerHtml:`<h2>简答</h2>
<ul>
<li>两个明确状态之间的反馈用 transition，多关键帧、循环或独立启动的过程用 animation。</li>
<li>物理计算、Canvas 或与交互连续同步时用 requestAnimationFrame，并按时间戳计算进度，不要每帧固定加一点。</li>
<li>性能关键是每帧触发了什么：改尺寸可能引发布局，改背景可能重绘，transform 和 opacity 在合适条件下可由合成阶段处理。</li>
<li><code>will-change</code> 和合成层不是免费的，并要为 <code>prefers-reduced-motion</code> 提供静态替代。</li>
</ul>
<p>一个按钮悬停后略微上移，和一个根据拖拽速度继续滑行的物体，虽然都在移动，但需要控制的事情不同。前者只要描述前后状态，后者则需要持续计算位置、速度和停止条件。</p>
<p>因此不必先问“CSS 动画一定比 JavaScript 快吗”，而应先决定哪种表达方式最贴合这个行为，再检查它实际触发了哪些浏览器工作。</p>
<h2>transition：从旧状态过渡到新状态</h2>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.action</span> {
  <span class="hljs-attribute">transform</span>: <span class="hljs-built_in">translateY</span>(<span class="hljs-number">0</span>);
  <span class="hljs-attribute">transition</span>: transform <span class="hljs-number">180ms</span> ease;
}

<span class="hljs-selector-class">.action</span><span class="hljs-selector-pseudo">:hover</span>,
<span class="hljs-selector-class">.action</span><span class="hljs-selector-pseudo">:focus-visible</span> {
  <span class="hljs-attribute">transform</span>: <span class="hljs-built_in">translateY</span>(-<span class="hljs-number">2px</span>);
}

<span class="hljs-keyword">@media</span> (<span class="hljs-attribute">prefers-reduced-motion</span>: reduce) {
  <span class="hljs-selector-class">.action</span>,
  <span class="hljs-selector-class">.action</span><span class="hljs-selector-pseudo">:hover</span>,
  <span class="hljs-selector-class">.action</span><span class="hljs-selector-pseudo">:focus-visible</span> {
    <span class="hljs-attribute">transition</span>: none;
    <span class="hljs-attribute">transform</span>: none;
  }
}
</code></pre></div>
<p>状态改变时，浏览器在可插值的属性值之间生成过渡；状态恢复后，又向原状态过渡。它很适合交互反馈、面板尺寸调整等“有两个明确状态”的情况，不需要维护逐帧回调。</p>
<p>transition 需要发生相应的样式变化，并且属性要有对应的过渡行为。不能给元素写一条 transition，就期待它没有任何状态变化也会自己运动。<code>transition: all</code> 则可能把原本不想动画的布局属性也包含进去，明确列出属性通常更容易维护。</p>
<h2>animation：自己定义阶段和重复方式</h2>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-keyword">@keyframes</span> gentle-pulse {
  <span class="hljs-number">0%</span>, <span class="hljs-number">100%</span> { <span class="hljs-attribute">opacity</span>: <span class="hljs-number">1</span>; }
  <span class="hljs-number">50%</span> { <span class="hljs-attribute">opacity</span>: <span class="hljs-number">0.5</span>; }
}

<span class="hljs-selector-class">.pending-indicator</span> {
  <span class="hljs-attribute">animation</span>: gentle-pulse <span class="hljs-number">1.2s</span> ease-in-out infinite;
}

<span class="hljs-keyword">@media</span> (<span class="hljs-attribute">prefers-reduced-motion</span>: reduce) {
  <span class="hljs-selector-class">.pending-indicator</span> {
    <span class="hljs-attribute">animation</span>: none;
  }
}
</code></pre></div>
<p>animation 适合有多个关键帧、需要循环或独立启动的视觉过程。即使禁用动画，页面也应保留“正在处理”这样的实际文字或状态，不能只让一个动起来的小点承担全部反馈。</p>
<p><code>animation-fill-mode</code> 控制动画活动区间之外怎样应用动画样式，不会永久改写元素的基础 CSS。如果结束后需要某个稳定状态，应明确维护相应 class 或样式，而不是误以为动画已经替业务状态赋值。</p>
<h2>rAF：每帧根据时间计算，而不是固定加一点</h2>
<p>需要物理计算、Canvas 绘制或与交互连续同步时，可以使用 requestAnimationFrame。它请求浏览器在适当的渲染更新阶段调用一次回调；要继续下一帧，需要在回调里再次申请。</p>
<p>下面是从横向位移 0 移到 distance 的有限动画。它专门控制 transform，会覆盖已有 transform，不是一个可以自动组合所有变换的通用动画库。</p>
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
<p>调用时传入实际元素，保存返回的取消函数，在重新启动同一元素的动画或组件卸载时调用它。取消会停在当前位置，不负责恢复起点。多个调用如果同时写一个元素的 transform，会互相覆盖，因此调用方应避免无意的并行动画。</p>
<p>progress 使用时间戳之差除以总时长。60Hz 屏幕回调较少，120Hz 屏幕回调较多，但只要经过相同时间，就能计算相近的位置。如果改成“每帧加 2px”，动画速度就会随着刷新率变化。</p>
<p>回调通常与显示刷新节奏协调，但不是严格固定每秒 60 次。主线程忙时可能丢帧，后台页面通常暂停或显著减少回调。此例恢复后会根据已经流逝的时间赶到对应位置，甚至直接结束；如果业务需要“后台暂停计时”，就要另外记录暂停时段，而不是默认 rAF 帮你冻结进度。</p>
<p>减少动画偏好在本例启动时读取，选择直接落到最终状态。若应用需要在动画过程中响应用户修改偏好，还应监听媒体查询变化并清理相应监听器。</p>
<h2>性能关键是每帧做了什么</h2>
<p>修改 width、height 或影响排版的位置，可能引发布局；修改背景、阴影等可能需要重新绘制；transform、opacity 在合适条件下可以由合成阶段处理，通常更有利于流畅动画。</p>
<p>但这些是渲染路径上的可能性，不是“写 transform 就永远零成本”。大面积透明层、复杂效果、纹理上传和过多合成层仍然可能占用显存与带宽。<code>will-change</code> 也不是永久开启的加速按钮，只应在测量表明确有需要时有限使用。</p>
<p>在 rAF 中交替读布局、改样式、再读布局，仍可能造成同步布局和抖动。把一帧的必要读取与写入合理组织，比简单地把原有慢代码包进 rAF 更重要。</p>
<p>CSS 动画不一定全部避开主线程，JavaScript 动画也不一定必然很慢。对于需要命令式暂停、反向或等待完成、但不必每帧自行计算的动画，还可以评估 Web Animations API；不必为了有播放控制就把所有逻辑都改成手写循环。</p>
<p>最终用 Performance 面板检查长任务、布局、绘制与合成，在目标设备上检查交互延迟。保持可取消、尊重减少动画偏好、不给用户操作增加等待，同样属于动画实现质量的一部分。</p>`};export{e as default};