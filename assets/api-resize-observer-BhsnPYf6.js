var e={answerHtml:`<p>一个图表容器变窄，可能是侧栏展开了，并不是 window 发生 resize。ResizeObserver 让组件直接观察自身或容器的盒尺寸，因此更适合容器驱动的布局与绘制。</p>
<p>循环问题出现在“读取尺寸后又改变导致该尺寸的布局”。如果回调把目标宽度每次加 10 像素，目标会再次变大，下一轮又加 10，形成没有终点的反馈。</p>
<h3>先确定观察哪种盒</h3>
<p>content-box 对应内容盒，border-box 包含内容、padding 和 border；device-pixel-content-box 提供设备像素相关的内容尺寸，但支持情况需要单独核对。</p>
<p>entry.contentBoxSize、borderBoxSize 等使用 inlineSize 与 blockSize，它们是逻辑方向尺寸，不应永久理解为物理 width 与 height。多片段布局也可能涉及多个 size 记录，不能在复杂排版中无条件只取第一个。</p>
<p>contentRect 是常用的兼容读取方式，主要反映内容区域。若观察 border-box 却用 contentRect.width 与边框尺寸比较，会因为两者语义不同产生误判。</p>
<h3>一个只报告尺寸变化的观察器</h3>
<p>下面使用内容盒，并用 contentRect 读取物理宽高，适合这里的普通组件场景：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">watchSize</span>(<span class="hljs-params">element, onSize</span>) {
  <span class="hljs-keyword">if</span> (<span class="hljs-keyword">typeof</span> <span class="hljs-title class_">ResizeObserver</span> === <span class="hljs-string">&#x27;undefined&#x27;</span>) <span class="hljs-keyword">return</span> <span class="hljs-function">() =&gt;</span> {};
  <span class="hljs-keyword">let</span> previousWidth;
  <span class="hljs-keyword">let</span> previousHeight;
  <span class="hljs-keyword">const</span> observer = <span class="hljs-keyword">new</span> <span class="hljs-title class_">ResizeObserver</span>(<span class="hljs-function">(<span class="hljs-params">entries</span>) =&gt;</span> {
    <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> entry <span class="hljs-keyword">of</span> entries) {
      <span class="hljs-keyword">const</span> { width, height } = entry.<span class="hljs-property">contentRect</span>;
      <span class="hljs-keyword">if</span> (width === previousWidth &amp;&amp; height === previousHeight) <span class="hljs-keyword">continue</span>;
      previousWidth = width;
      previousHeight = height;
      <span class="hljs-title function_">onSize</span>({ width, height });
    }
  });
  observer.<span class="hljs-title function_">observe</span>(element);
  <span class="hljs-keyword">return</span> <span class="hljs-function">() =&gt;</span> observer.<span class="hljs-title function_">disconnect</span>();
}
</code></pre></div>
<p>保存上次值减少重复业务更新，但不保证调用方不会制造循环。如果 onSize 每次把该元素宽度设成 width + 10，下一次宽度确实不同，去重仍然挡不住。</p>
<p>回调通常会在初次观察获得尺寸后通知，但隐藏、零尺寸和渲染状态会影响实际交付时机，不要把 observe 当成同步读取函数。</p>
<h3>浏览器避免锁死，不代表替你修复循环</h3>
<p>ResizeObserver 通知与绘制前的布局流程相关。回调触发布局后，浏览器可能继续发现尺寸变化，并按规则把部分通知推迟，报告类似“loop completed with undelivered notifications”的错误。</p>
<p>这表示当前处理没有把所有通知在本轮交付，并不自动证明观察器 API 有 bug。某次有限的调整可能最终稳定；如果每帧重复报错，就应检查反馈链。</p>
<p>一个复杂例子是：宽度小于阈值时添加 class，class 改变 padding 后宽度又跨过阈值，于是移除 class，再次回到原宽度。两个状态来回跳，不一定表现为单调增大，却同样不收敛。</p>
<h3>修复应改变依赖关系或让它收敛</h3>
<p>优先使用 CSS 媒体或容器查询表达纯样式适配，避免用 JavaScript 反复测量再设置。必须测量时，可观察稳定的外层容器，把结果用于不会反过来改变容器尺寸的内部绘制。</p>
<p>例如 Canvas 需要同步内部位图尺寸时，应先用 CSS 明确展示尺寸，避免设置 width/height 属性又改变布局尺寸。还应比较目标位图尺寸，没变化就不重设，因为重设会清空画布与绘制状态。</p>
<p>对于断点切换，可以采用稳定条件或适当滞回，避免临界值抖动。不能只用任意四舍五入掩盖真正的尺寸依赖错误。</p>
<h3>requestAnimationFrame 只改变时机</h3>
<p>把写操作推迟到 requestAnimationFrame 可能打断同一轮反馈，但如果逻辑仍然每次增加宽度，就会变成跨帧无限增长。它可以帮助调度，不会证明算法收敛。</p>
<p>若使用待执行动画帧，组件销毁时除了 disconnect，还要取消尚未执行的帧回调，避免在卸载后继续写 DOM。多个目标可以共享观察器，但尺寸缓存应按目标分别管理。</p>
<p>排查时记录是哪一个元素、读取了哪种盒、回调写了什么属性，以及该写入怎样影响下一次测量。只有把这条反馈链画清楚，才能修复循环，而不是在控制台过滤掉错误消息。</p>`};export{e as default};