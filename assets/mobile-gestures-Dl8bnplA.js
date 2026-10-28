var e={answerHtml:`<p>移动端的拖动、滑动和缩放不是“监听 touchmove 然后改 left”这么简单。浏览器同时要判断用户是在滚动页面、缩放、点击链接还是操作组件；如果组件无条件阻止默认行为，页面可能无法滚动，如果完全不管默认行为，拖动又会被浏览器滚动打断。</p>
<h2>Pointer Events 统一了输入模型</h2>
<p>Pointer Events 可以用同一套事件处理鼠标、触摸和触控笔，并通过 <code>pointerId</code> 区分同时存在的指针。它不是自动的手势识别器，开发者仍需定义拖动方向、阈值、速度和取消规则。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">bindHorizontalDrag</span>(<span class="hljs-params">element, onMove</span>) {
  <span class="hljs-keyword">let</span> activeId = <span class="hljs-literal">null</span>;
  <span class="hljs-keyword">let</span> originX = <span class="hljs-number">0</span>;
  <span class="hljs-keyword">let</span> lastX = <span class="hljs-number">0</span>;

  <span class="hljs-keyword">function</span> <span class="hljs-title function_">finish</span>(<span class="hljs-params">event</span>) {
    <span class="hljs-keyword">if</span> (event.<span class="hljs-property">pointerId</span> !== activeId) <span class="hljs-keyword">return</span>;
    activeId = <span class="hljs-literal">null</span>;
    element.<span class="hljs-property">releasePointerCapture</span>?.(event.<span class="hljs-property">pointerId</span>);
  }

  element.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;pointerdown&#x27;</span>, <span class="hljs-function">(<span class="hljs-params">event</span>) =&gt;</span> {
    <span class="hljs-keyword">if</span> (activeId !== <span class="hljs-literal">null</span> || event.<span class="hljs-property">button</span> !== <span class="hljs-number">0</span>) <span class="hljs-keyword">return</span>;
    activeId = event.<span class="hljs-property">pointerId</span>;
    originX = lastX = event.<span class="hljs-property">clientX</span>;
    element.<span class="hljs-property">setPointerCapture</span>?.(event.<span class="hljs-property">pointerId</span>);
  });

  element.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;pointermove&#x27;</span>, <span class="hljs-function">(<span class="hljs-params">event</span>) =&gt;</span> {
    <span class="hljs-keyword">if</span> (event.<span class="hljs-property">pointerId</span> !== activeId) <span class="hljs-keyword">return</span>;
    <span class="hljs-keyword">const</span> delta = event.<span class="hljs-property">clientX</span> - originX;
    lastX = event.<span class="hljs-property">clientX</span>;
    <span class="hljs-title function_">onMove</span>({ delta, <span class="hljs-attr">position</span>: lastX, event });
  });

  element.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;pointerup&#x27;</span>, finish);
  element.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;pointercancel&#x27;</span>, finish);
  element.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;lostpointercapture&#x27;</span>, <span class="hljs-function">(<span class="hljs-params">event</span>) =&gt;</span> {
    <span class="hljs-keyword">if</span> (event.<span class="hljs-property">pointerId</span> === activeId) activeId = <span class="hljs-literal">null</span>;
  });

  <span class="hljs-keyword">return</span> <span class="hljs-function">() =&gt;</span> {
    activeId = <span class="hljs-literal">null</span>;
  };
}
</code></pre></div>
<p><code>setPointerCapture</code> 让元素在指针离开自身边界后仍能收到该指针的后续事件，适合拖动；它不保证设备断电、浏览器切后台或系统手势时一定收到 <code>pointerup</code>，所以要处理 <code>pointercancel</code> 和 <code>lostpointercapture</code>。清理时还要停止惯性动画、计时器和未完成的业务操作。</p>
<h2><code>touch-action</code> 先表达允许浏览器做什么</h2>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.horizontal-slider</span> {
  <span class="hljs-attribute">touch-action</span>: pan-y;
  <span class="hljs-attribute">user-select</span>: none;
}
</code></pre></div>
<p>这个声明表示组件处理水平方向手势时，允许浏览器保留垂直滚动。它比在每个 <code>touchmove</code> 中无条件调用 <code>preventDefault()</code> 更早、更清楚地表达交互边界。</p>
<p><code>touch-action: none</code> 会禁用该区域的浏览器平移和缩放能力，只有确实需要完全自定义手势时才使用。禁用默认行为后，应用要自己提供滚动、缩放、取消和无障碍替代路径，不能只追求“拖起来了”。</p>
<p>手势判定应保留一个启动阈值：用户轻触按钮时不要立刻把它当成拖动；超过阈值后再捕获指针、更新位置，并决定是否取消点击。不同平台的点击延迟、滚动锁定和系统手势还需真实设备验证。</p>
<h2>多点触控需要按 pointerId 管理</h2>
<p>单指拖动和双指缩放不能共用一个全局 <code>isDragging</code>。应为每个 pointerId 保存位置，并在第二个指针出现时切换到明确的多点状态；不要把两个手指的事件简单相加。</p>
<p>计算缩放时要考虑视口坐标、CSS transform 和设备像素比。Canvas、地图和图片编辑器还要保持内容坐标与屏幕坐标的变换一致，避免触摸位置和绘制位置错位。手势结束或取消时，所有 pointer 状态都要清理，不能等待一个永远不会到达的 <code>pointerup</code>。</p>
<h2>事件处理性能不能靠阻止默认行为解决</h2>
<p><code>pointermove</code> 可能高频触发，处理器应合并更新，在 <code>requestAnimationFrame</code> 中写入视觉状态，避免每个事件都读取布局再修改样式。不要在移动事件里执行同步布局、复杂 React/Vue 状态树更新或大规模 DOM 查询。</p>
<p>如果只需要绘制轨迹，可以批量保存坐标并在帧中消费；如果需要高频原始输入，可评估 <code>pointerrawupdate</code>，但兼容性、数据量和功耗需要单独验证。<code>passive</code> 监听器不能调用 <code>preventDefault</code>，而 <code>touch-action</code> 往往是声明滚动行为的首选。</p>
<h2>手势必须有非手势入口</h2>
<p>滑动删除应提供按钮或菜单操作，拖拽排序应提供上移/下移、输入框或明确的键盘命令；缩放和旋转控件应能通过键盘或表单调整。只依赖触摸轨迹会排除键盘用户、读屏用户、运动障碍用户和无法完成精细手势的设备。</p>
<p>焦点、点击目标和取消操作要明确。用户开始拖动后按 Escape、移出应用或系统中断时，组件应回到可解释状态；不要因为一次未完成手势让按钮永久锁定或页面无法滚动。</p>
<p>测试应覆盖鼠标、单指、双指、触控笔、快速移动、滚动冲突、pointercancel、设备旋转、页面切后台、键盘替代操作和真实低端设备。手势代码通过桌面模拟器，只能证明部分事件逻辑，不能证明浏览器滚动、系统手势和触摸延迟已经正确。</p>`};export{e as default};