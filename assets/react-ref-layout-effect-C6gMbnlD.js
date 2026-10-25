var e={answerHtml:`<p>这三个 Hook 不是三个可以互换的生命周期函数。useRef 提供一个存放可变值的容器；useEffect 与 useLayoutEffect 则让 React 在相应阶段运行设置和清理逻辑。</p>
<p>常见组合是：用 ref 找到已提交的 DOM，再用合适的 Effect 测量或同步它。不能因为都有 use 前缀，就认为 ref 修改会自动触发 Effect 或重新渲染。</p>
<h3>ref 保存对象，但不负责刷新界面</h3>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">import</span> { useRef, useState, useLayoutEffect } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;react&#x27;</span>;

<span class="hljs-keyword">export</span> <span class="hljs-keyword">default</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">FocusInput</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">const</span> inputRef = <span class="hljs-title function_">useRef</span>(<span class="hljs-literal">null</span>);

  <span class="hljs-keyword">return</span> (
    <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">section</span>&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">label</span>&gt;</span>
        搜索
        <span class="hljs-tag">&lt;<span class="hljs-name">input</span> <span class="hljs-attr">ref</span>=<span class="hljs-string">{inputRef}</span> /&gt;</span>
      <span class="hljs-tag">&lt;/<span class="hljs-name">label</span>&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">button</span> <span class="hljs-attr">type</span>=<span class="hljs-string">&quot;button&quot;</span> <span class="hljs-attr">onClick</span>=<span class="hljs-string">{()</span> =&gt;</span> inputRef.current?.focus()}&gt;
        聚焦输入框
      <span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span>
    <span class="hljs-tag">&lt;/<span class="hljs-name">section</span>&gt;</span></span>
  );
}
</code></pre></div>
<p>组件存活期间，useRef 返回的 ref 对象可以跨渲染保持。React 把实际输入 DOM 关联到 current，事件处理器就可以执行 focus 这样的命令式操作。</p>
<p>首次渲染期间，DOM 还没有提交，current 可能是 null；卸载时也要考虑引用被清除。不能在组件函数刚开始执行时，就假定 ref.current 已经指向这轮要显示的节点。</p>
<p>修改 ref.current 不会请求重新渲染。计时器 ID、外部实例等不直接决定显示的值可以放这里；如果值变化应该立即改变文字或组件结构，通常应放在 state，而不是等别的更新顺便把 ref 显示出来。</p>
<h3>两种 Effect 的关键差别是绘制时机</h3>
<p>useEffect 适合订阅、网络和其他不需要同步阻塞绘制的外部关系。它在提交之后运行，但不保证所有场景都严格晚于浏览器 paint。</p>
<p>useLayoutEffect 在相关 DOM 已经应用后、浏览器重新绘制前执行。它适合必须先测量再修正位置的情况，例如避免浮层先画错位置再跳动，但其中的代码和同步更新会延迟绘制。</p>
<p>因此 Layout Effect 不是“更高级的 Effect”。如果任务不需要挡住用户看到画面，就不应为了一点模糊的时序安全感把所有 Effect 都改成它。</p>
<h3>测量应包括后续尺寸变化，而不只读一次</h3>
<p>下面的组件沿用前面的导入，先在布局阶段测量标题，再使用 ResizeObserver 观察字体、内容布局等造成的尺寸变化：</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">export</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">MeasuredTitle</span>(<span class="hljs-params">{ text, width = <span class="hljs-number">240</span> }</span>) {
  <span class="hljs-keyword">const</span> titleRef = <span class="hljs-title function_">useRef</span>(<span class="hljs-literal">null</span>);
  <span class="hljs-keyword">const</span> [height, setHeight] = <span class="hljs-title function_">useState</span>(<span class="hljs-number">0</span>);

  <span class="hljs-title function_">useLayoutEffect</span>(<span class="hljs-function">() =&gt;</span> {
    <span class="hljs-keyword">const</span> node = titleRef.<span class="hljs-property">current</span>;
    <span class="hljs-keyword">if</span> (!node) <span class="hljs-keyword">return</span>;

    <span class="hljs-keyword">function</span> <span class="hljs-title function_">measure</span>(<span class="hljs-params"></span>) {
      <span class="hljs-keyword">const</span> nextHeight = <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">round</span>(node.<span class="hljs-title function_">getBoundingClientRect</span>().<span class="hljs-property">height</span>);
      <span class="hljs-title function_">setHeight</span>(<span class="hljs-function"><span class="hljs-params">previous</span> =&gt;</span> previous === nextHeight ? previous : nextHeight);
    }

    <span class="hljs-title function_">measure</span>();
    <span class="hljs-keyword">const</span> observer = <span class="hljs-keyword">new</span> <span class="hljs-title class_">ResizeObserver</span>(measure);
    observer.<span class="hljs-title function_">observe</span>(node);
    <span class="hljs-keyword">return</span> <span class="hljs-function">() =&gt;</span> observer.<span class="hljs-title function_">disconnect</span>();
  }, [text, width]);

  <span class="hljs-keyword">return</span> (
    <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">section</span>&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">div</span> <span class="hljs-attr">ref</span>=<span class="hljs-string">{titleRef}</span> <span class="hljs-attr">style</span>=<span class="hljs-string">{{</span> <span class="hljs-attr">width</span>, <span class="hljs-attr">fontSize:</span> <span class="hljs-attr">20</span>, <span class="hljs-attr">lineHeight:</span> &#x27;<span class="hljs-attr">24px</span>&#x27; }}&gt;</span>
        {text}
      <span class="hljs-tag">&lt;/<span class="hljs-name">div</span>&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">output</span> <span class="hljs-attr">aria-label</span>=<span class="hljs-string">&quot;标题高度&quot;</span>&gt;</span>{height}<span class="hljs-tag">&lt;/<span class="hljs-name">output</span>&gt;</span>
    <span class="hljs-tag">&lt;/<span class="hljs-name">section</span>&gt;</span></span>
  );
}
</code></pre></div>
<p>text 或 width 改变后，新 DOM 提交，再测量这一轮的高度；观察器处理后续尺寸变化。清理会断开上一轮观察，避免重复订阅。</p>
<p>示例把测量结果显示在独立区域，没有反过来用这个高度不断改变被测量元素自身尺寸。真实浮层定位若形成“测量改变尺寸、尺寸又触发测量”的反馈循环，需要调整算法或约束，不能只靠加 Layout Effect 解决。</p>
<p>getBoundingClientRect 会反映相应布局与变换后的几何结果。字体加载、图片尺寸、容器宽度和缩放都可能改变结果，所以一次挂载测量并不总够用。ResizeObserver 也不能替代对滚动位置、视口位置和所有定位条件的观察。</p>
<h3>不要在渲染里用 ref 绕过状态模型</h3>
<p>组件渲染应主要根据 props、state、context 计算 UI。随意读取或写入 ref.current 来影响渲染，会让结果依赖未被 React 调度管理的可变信息，尤其在重试或中断计算时更难推理。</p>
<p>对于可预测、只在初始化时建立的纯粹值，可以按官方规则使用受控的 ref 初始化模式。但不要把网络连接、订阅或需要清理的副作用藏进这种“只初始化一次”的分支。</p>
<p><code>useRef(createValue())</code> 的参数表达式仍可能在每次渲染时求值，React 忽略后续初始值不代表这个函数没被调用。把函数本身传给 useRef，也不会像 useState 的惰性初始化那样自动调用它，而是把函数作为 current 保存。</p>
<h3>DOM ref 与自定义组件边界</h3>
<p>给原生 input 传 ref，React 可以关联到该 DOM。给自定义组件传 ref，则需要组件按所用 React 版本的约定接收并继续暴露合适目标，不能期待 React 自动找到任意深处的输入框。</p>
<p>较新 React 与旧版 forwardRef 用法存在差异，应按版本和组件 API 处理。若组件只希望暴露 focus、reset 等有限能力，可以设计相应命令式接口，而不必把全部内部 DOM 结构都泄漏给调用者。</p>
<h3>服务端没有真实布局可以测量</h3>
<p>useLayoutEffect 不在服务端执行，服务端也没有浏览器 DOM 尺寸。依赖测量才能确定位置的组件，需要合理的初始布局、客户端边界或相应回退，不能把服务端算出的 0 当作真实测量结果。</p>
<p>开发 Strict Mode 还会检查设置与清理的配对，观察器和事件都应能正确断开。最后用浏览器工具确认布局、绘制与交互成本：如果只是延迟问题换成了同步阻塞，画面不闪了但操作更卡，也不能算完成优化。</p>
<p>补充参考：<a href="https://react.dev/reference/react/useRef">React · useRef</a>。</p>`};export{e as default};