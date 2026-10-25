var e={answerHtml:`<p>如果拖拽同时支持鼠标、手指和触控笔，分别维护 mouse 与 touch 两套事件很容易漏掉取消、多指和兼容鼠标事件。Pointer Events 提供统一的按下、移动、抬起与取消模型，再通过属性表达输入设备差异。</p>
<p>统一模型不等于假设所有设备相同。鼠标通常能悬停，触摸没有同样的悬停过程，触控笔还可能提供压力、倾角等数据，这些都应按能力处理。</p>
<h3>用 pointerId 关联一次操作</h3>
<p>pointerdown 开始一段输入，pointermove 更新位置，pointerup 表示正常结束。pointerId 区分同时活动的指针，不能只维护一个“鼠标是否按下”的全局布尔值来处理多指。</p>
<p>即使只支持单指拖拽，也应记录当前接受的 pointerId，忽略其他指针。pointerType 可区分 mouse、touch、pen 等类型；isPrimary 表达对应输入类型的主指针，不保证整个系统永远只有一个主指针。</p>
<h3>捕获让拖拽越过元素边缘后仍可继续</h3>
<p>下面演示单指水平位移的输入层。onMove 接收相对按下位置的位移；onEnd 的取消标记交给业务决定提交还是回退：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">bindHorizontalDrag</span>(<span class="hljs-params">element, onMove, onEnd</span>) {
  <span class="hljs-keyword">let</span> activeId = <span class="hljs-literal">null</span>;
  <span class="hljs-keyword">let</span> startX = <span class="hljs-number">0</span>;
  <span class="hljs-keyword">const</span> controller = <span class="hljs-keyword">new</span> <span class="hljs-title class_">AbortController</span>();
  <span class="hljs-keyword">const</span> options = { <span class="hljs-attr">signal</span>: controller.<span class="hljs-property">signal</span> };

  element.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;pointerdown&#x27;</span>, <span class="hljs-function">(<span class="hljs-params">event</span>) =&gt;</span> {
    <span class="hljs-keyword">if</span> (activeId !== <span class="hljs-literal">null</span> || event.<span class="hljs-property">button</span> !== <span class="hljs-number">0</span>) <span class="hljs-keyword">return</span>;
    element.<span class="hljs-title function_">setPointerCapture</span>(event.<span class="hljs-property">pointerId</span>);
    activeId = event.<span class="hljs-property">pointerId</span>;
    startX = event.<span class="hljs-property">clientX</span>;
  }, options);

  element.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;pointermove&#x27;</span>, <span class="hljs-function">(<span class="hljs-params">event</span>) =&gt;</span> {
    <span class="hljs-keyword">if</span> (event.<span class="hljs-property">pointerId</span> === activeId) <span class="hljs-title function_">onMove</span>(event.<span class="hljs-property">clientX</span> - startX);
  }, options);

  <span class="hljs-keyword">function</span> <span class="hljs-title function_">finish</span>(<span class="hljs-params">event</span>) {
    <span class="hljs-keyword">if</span> (event.<span class="hljs-property">pointerId</span> !== activeId) <span class="hljs-keyword">return</span>;
    <span class="hljs-keyword">const</span> id = activeId;
    activeId = <span class="hljs-literal">null</span>;
    <span class="hljs-keyword">if</span> (element.<span class="hljs-title function_">hasPointerCapture</span>(id)) element.<span class="hljs-title function_">releasePointerCapture</span>(id);
    <span class="hljs-title function_">onEnd</span>({ <span class="hljs-attr">cancelled</span>: event.<span class="hljs-property">type</span> !== <span class="hljs-string">&#x27;pointerup&#x27;</span> });
  }

  element.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;pointerup&#x27;</span>, finish, options);
  element.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;pointercancel&#x27;</span>, finish, options);
  element.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;lostpointercapture&#x27;</span>, finish, options);

  <span class="hljs-keyword">return</span> <span class="hljs-function">() =&gt;</span> {
    controller.<span class="hljs-title function_">abort</span>();
    <span class="hljs-keyword">if</span> (activeId !== <span class="hljs-literal">null</span>) {
      <span class="hljs-keyword">const</span> id = activeId;
      activeId = <span class="hljs-literal">null</span>;
      <span class="hljs-keyword">if</span> (element.<span class="hljs-title function_">hasPointerCapture</span>(id)) element.<span class="hljs-title function_">releasePointerCapture</span>(id);
      <span class="hljs-title function_">onEnd</span>({ <span class="hljs-attr">cancelled</span>: <span class="hljs-literal">true</span> });
    }
  };
}
</code></pre></div>
<p>setPointerCapture 把后续相关指针事件的目标绑定到该元素，即使指针移出边界也能继续收到事件。先清空 activeId 再释放捕获，可以避免 lostpointercapture 又触发一次结束回调。</p>
<p>这不是完整拖拽组件：拖动阈值、最终位置约束、点击抑制和状态渲染仍需业务实现。onMove 应轻量，复杂更新可按动画帧合并，避免每个移动事件都触发布局测量。</p>
<h3>touch-action 决定浏览器可以接管哪些手势</h3>
<p>如果是横向拖动控件，仍希望页面可以纵向滚动，可考虑在目标区域预先设置：</p>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.drag-handle</span> {
  <span class="hljs-attribute">touch-action</span>: pan-y pinch-zoom;
}
</code></pre></div>
<p>浏览器仍可接管纵向平移与缩放；当它决定接管手势时，页面可能收到 pointercancel。若绘图画布确实需要完全处理触摸，可在有限区域使用 none，但不应为了一个控件禁用整页缩放和滚动。</p>
<p>touch-action 应在手势开始前确定，事件进行中再改通常不会改变已经作出的手势决策。不要只依赖对每个 move 调用 preventDefault 来代替它。</p>
<h3>取消不是不重要的边角情况</h3>
<p>浏览器滚动接管、系统中断、捕获丢失或组件卸载都可能让操作没有正常 pointerup。只在 pointerup 清理，会留下拖拽中的样式或错误状态。</p>
<p>取消与正常完成应区分，例如排序列表取消时恢复原位置，而不是把最后一个中间位置提交。若交互依赖窗口焦点，也要按产品需要处理失焦等退出路径。</p>
<p>Pointer Events 只覆盖指针输入，不自动提供键盘可访问性。拖动滑块、排序或调整数值还应提供适合键盘及辅助技术的操作方式。验证应覆盖真实触摸、触控笔或鼠标的目标设备，合成事件只能检查处理逻辑，不能证明手势仲裁与硬件压力数据一致。</p>`};export{e as default};