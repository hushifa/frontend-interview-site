var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>一次更新分三步。先是触发，比如初次渲染或者调用 <code>setState</code>。然后是渲染，React 调用组件函数，算出新的元素树，再跟上一次比较找出差异。最后是提交，React 把差异改到 DOM 上，设置 ref，执行 Effect。</p>
<p>所以“组件重新渲染”只是说函数被重新调用了一次，不等于 DOM 被重建，React 只改有差异的节点。</p>
<p>分成两个阶段，是因为并发渲染下渲染阶段可以被更高优先级的更新打断、重新开始，结果也可能被丢弃。只有提交阶段是一口气做完的。</p>
<p>这带来一个要求：组件函数必须是纯函数，相同的输入返回相同的结果，不改外部变量、不发请求、不操作 DOM。开发环境的严格模式会把组件函数调用两次，专门暴露不纯的渲染逻辑。</p>
</blockquote>
<h2>一次点击经历了什么</h2>
<p>下面的计数器在渲染时和 Effect 里各打一行日志，方便看清先后：</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">function</span> <span class="hljs-title function_">Counter</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">const</span> [count, setCount] = <span class="hljs-title function_">useState</span>(<span class="hljs-number">0</span>);
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;render&#x27;</span>, count); <span class="hljs-comment">// 渲染阶段</span>
  <span class="hljs-title function_">useEffect</span>(<span class="hljs-function">() =&gt;</span> {
    <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;effect&#x27;</span>, count); <span class="hljs-comment">// 提交之后</span>
  });
  <span class="hljs-keyword">return</span> <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">button</span> <span class="hljs-attr">onClick</span>=<span class="hljs-string">{()</span> =&gt;</span> setCount(count + 1)}&gt;{count}<span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span></span>;
}
</code></pre></div>
<p>点一下按钮，<code>setCount</code> 先安排一次更新。React 进入渲染阶段，调用 <code>Counter</code>，打印 <code>render 1</code>，然后拿新结果和上次比较，发现只有按钮上的文字从 0 变成了 1。</p>
<p>接着进入提交阶段，React 只更新这一个文本节点，按钮元素本身没动。提交之后执行 Effect，打印 <code>effect 1</code>。一般情况下 Effect 在浏览器绘制之后才执行；但这次更新是点击触发的，React 可能在绘制之前就把它执行掉。</p>
<h2>为什么渲染必须是纯的</h2>
<p>下面这个组件在渲染时修改了外部变量：</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">let</span> renderCount = <span class="hljs-number">0</span>;

<span class="hljs-keyword">function</span> <span class="hljs-title function_">Item</span>(<span class="hljs-params">{ title }</span>) {
  renderCount++; <span class="hljs-comment">// 错误：渲染时修改外部变量</span>
  <span class="hljs-keyword">return</span> <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">li</span>&gt;</span>{title}（第 {renderCount} 次）<span class="hljs-tag">&lt;/<span class="hljs-name">li</span>&gt;</span></span>;
}
</code></pre></div>
<p>你可能以为它显示的是第几次渲染，实际上数字会对不上。严格模式下组件每次会被调用两次；并发渲染中，被打断重来的渲染也会计数。但这些多出来的调用并没有提交到页面上，所以显示的数字比实际提交的次数多。</p>
<p>只要渲染不纯，React 多调一次、少调一次、扔掉一次，结果就会不一样。纯函数则不怕这些，调多少次结果都相同。</p>
<p>要记录次数，就用 ref，在 Effect 里修改；要显示在页面上，就放进 state。</p>
<h2>父组件渲染会带着子组件一起渲染</h2>
<p>父组件重新渲染时，默认会把所有子组件函数也重新调用一遍，即使子组件的 props 根本没变。</p>
<p>这一般不是问题，因为调用函数很快，最后真正改到 DOM 上的很少。确实有性能问题时，可以用 <code>memo</code> 跳过子组件，或者启用 React Compiler，详见<a href="/questions/react-memo/">《React.memo 怎样跳过组件渲染？什么情况下会失效？》</a>。</p>
<h2>提交阶段内部的顺序</h2>
<p>提交阶段里，React 先把变更应用到 DOM。然后设置 ref，同步执行 <code>useLayoutEffect</code>，这一步会挡住浏览器绘制。接着浏览器绘制画面。最后执行 <code>useEffect</code>，通常在绘制之后。</p>
<p>这个顺序决定了：要在用户看到之前改布局，用 <code>useLayoutEffect</code>；其他副作用用 <code>useEffect</code>。</p>
<h2>常见追问</h2>
<p><strong>什么叫“协调”（reconciliation）？</strong></p>
<blockquote>
<p>就是渲染阶段比较新旧元素树、决定怎么更新的过程。同一个位置上元素类型不同，就替换整棵子树；类型相同，就复用并更新属性；列表则按 key 来匹配。</p>
</blockquote>
<p><strong>渲染阶段能调用 <code>setState</code> 吗？</strong></p>
<blockquote>
<p>一般不能，会造成无限循环。只有“根据 props 的变化调整自身 state”这种特殊场景，可以在渲染时有条件地调用。</p>
</blockquote>`};export{e as default};