var e={answerHtml:`<h2>简答</h2>
<ul>
<li>一次更新分三步：触发（初次渲染或 setState）→ 渲染（调用组件函数，计算新元素树并找出差异）→ 提交（修改 DOM，执行 ref 和 Effect）。</li>
<li>&quot;组件重新渲染&quot;指函数被重新调用，不等于 DOM 被重建；React 只修改有差异的节点。</li>
<li>并发渲染中，渲染阶段可以被更高优先级的更新打断、重新开始，结果也可能被丢弃，只有提交阶段一定一次性完成。</li>
<li>所以组件函数必须是纯函数：相同输入返回相同结果，不修改外部变量、不发请求、不操作 DOM。</li>
<li>严格模式在开发环境会调用组件函数两次，用来暴露不纯的渲染逻辑。</li>
</ul>
<h2>一次更新的流程</h2>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">function</span> <span class="hljs-title function_">Counter</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">const</span> [count, setCount] = <span class="hljs-title function_">useState</span>(<span class="hljs-number">0</span>);
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;render&#x27;</span>, count); <span class="hljs-comment">// 渲染阶段</span>
  <span class="hljs-title function_">useEffect</span>(<span class="hljs-function">() =&gt;</span> {
    <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;effect&#x27;</span>, count); <span class="hljs-comment">// 提交之后</span>
  });
  <span class="hljs-keyword">return</span> <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">button</span> <span class="hljs-attr">onClick</span>=<span class="hljs-string">{()</span> =&gt;</span> setCount(count + 1)}&gt;{count}<span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span></span>;
}
</code></pre></div>
<p>点击后：<code>setCount</code> 安排更新 → React 调用 <code>Counter</code> 打印 <code>render 1</code> → 比较发现只有按钮文字变了 → 提交时只更新这个文本节点 → 浏览器绘制，Effect 打印 <code>effect 1</code>。</p>
<h2>不纯渲染的问题</h2>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">let</span> renderCount = <span class="hljs-number">0</span>;

<span class="hljs-keyword">function</span> <span class="hljs-title function_">Item</span>(<span class="hljs-params">{ title }</span>) {
  renderCount++; <span class="hljs-comment">// 错误：渲染时修改外部变量</span>
  <span class="hljs-keyword">return</span> <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">li</span>&gt;</span>{title}（第 {renderCount} 次）<span class="hljs-tag">&lt;/<span class="hljs-name">li</span>&gt;</span></span>;
}
</code></pre></div>
<p>严格模式下每次渲染会执行两次，被中断重来的渲染也会计数，显示的数字和实际提交次数对不上。需要记录次数时用 ref 并在 Effect 里修改，需要显示就放进 state。</p>
<h2>父组件渲染会带动子组件</h2>
<p>父组件重新渲染时，默认会重新调用所有子组件函数，即使子组件的 props 没变。这通常很快，因为最终 DOM 改动很少。确实有性能问题时，用 <code>memo</code> 跳过子组件，或者启用 React Compiler，详见《memo、useMemo、useCallback 各自优化什么？》。</p>
<h2>提交阶段的顺序</h2>
<ol>
<li>应用 DOM 变更。</li>
<li>设置 ref，执行 <code>useLayoutEffect</code>（同步，阻塞绘制）。</li>
<li>浏览器绘制。</li>
<li>执行 <code>useEffect</code>（通常在绘制之后）。</li>
</ol>
<h2>常见追问</h2>
<ul>
<li>什么叫&quot;协调&quot;（reconciliation）？就是渲染阶段比较新旧元素树、决定如何更新的过程：类型不同就替换整棵子树，类型相同就复用并更新属性，列表按 key 匹配。</li>
<li>渲染阶段能调用 setState 吗？只能在&quot;根据 props 调整自身 state&quot;这类特殊场景下有条件地调用，常规情况会造成无限循环。</li>
</ul>`};export{e as default};