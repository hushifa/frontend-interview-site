var e={answerHtml:`<h2>相同的 JSX 不代表相同的更新模型</h2>
<p>React 通常在状态变化后重新执行组件函数，得到新的界面描述，再协调实际 DOM。Solid 的组件函数通常在实例建立时执行，之后由编译器和响应式系统更新真正读取了 signal 的表达式。</p>
<p>因此把 React 中“组件函数每次都会重新计算局部变量”的直觉搬到 Solid，容易得到初始化快照而不是持续响应式值。</p>
<h2>signal 的读取方式决定是否建立依赖</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">import</span> { createRoot, createSignal, createMemo } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;solid-js&#x27;</span>;

<span class="hljs-title function_">createRoot</span>(<span class="hljs-function">(<span class="hljs-params">dispose</span>) =&gt;</span> {
  <span class="hljs-keyword">const</span> [count, setCount] = <span class="hljs-title function_">createSignal</span>(<span class="hljs-number">1</span>);
  <span class="hljs-keyword">const</span> doubled = <span class="hljs-title function_">createMemo</span>(<span class="hljs-function">() =&gt;</span> <span class="hljs-title function_">count</span>() * <span class="hljs-number">2</span>);
  <span class="hljs-keyword">const</span> initial = <span class="hljs-title function_">count</span>();

  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">doubled</span>(), initial); <span class="hljs-comment">// 2, 1</span>
  <span class="hljs-title function_">setCount</span>(<span class="hljs-function">(<span class="hljs-params">value</span>) =&gt;</span> value + <span class="hljs-number">1</span>);
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">doubled</span>(), initial); <span class="hljs-comment">// 4, 1</span>
  <span class="hljs-title function_">dispose</span>();
});
</code></pre></div>
<p><code>count()</code> 读取当前值，<code>setCount</code> 更新它；<code>createMemo</code> 在追踪上下文中读取 <code>count()</code>，所以会重新计算；<code>initial</code> 只是执行那一行时保存的数字，不会自己变化。</p>
<p>关键不是“是否放进函数”，而是读取发生时是否处在受追踪的计算中。<code>createMemo</code>、<code>createEffect</code> 和编译后的 JSX 表达式会记录同步读取。<code>setTimeout</code> 或 <code>await</code> 之后的读取，不应默认认为属于原来的依赖收集。</p>
<p>分支还会改变依赖集合：当前分支没有读到的 signal，不会因为它变化就强制重跑。需要排除某个读取时可以使用 <code>untrack</code>，但应明确这样做不会自动更新。</p>
<h2>JSX 表达式和组件主体的边界不同</h2>
<p>模板中直接写 <code>count()</code>，编译器可以把依赖绑定到局部 DOM；组件主体中先写 <code>const text = count()</code>，再渲染 <code>text</code>，通常得到的是初始化值。Props 也要保持响应式读取，随意解构可能切断后续更新关系。</p>
<p><code>createMemo</code> 适合昂贵或需要缓存的派生计算，内部应保持纯计算，不要通过写状态制造循环。Signal 存对象时，直接修改内部字段并用同一引用写回，也不能假设存在深层代理；复杂嵌套状态应评估 Solid Store 或明确替换引用。</p>
<h2>effect 负责同步外部系统</h2>
<p><code>createEffect</code> 适合订阅、DOM API、计时器和网络等副作用，并用 <code>onCleanup</code> 清理：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-title function_">createEffect</span>(<span class="hljs-function">() =&gt;</span> {
  <span class="hljs-keyword">const</span> queryValue = <span class="hljs-title function_">query</span>();
  <span class="hljs-keyword">const</span> controller = <span class="hljs-keyword">new</span> <span class="hljs-title class_">AbortController</span>();

  <span class="hljs-title function_">fetch</span>(<span class="hljs-string">\`/api/search?q=<span class="hljs-subst">\${<span class="hljs-built_in">encodeURIComponent</span>(queryValue)}</span>\`</span>, {
    <span class="hljs-attr">signal</span>: controller.<span class="hljs-property">signal</span>,
  })
    .<span class="hljs-title function_">then</span>(<span class="hljs-function">(<span class="hljs-params">response</span>) =&gt;</span> response.<span class="hljs-title function_">json</span>())
    .<span class="hljs-title function_">then</span>(<span class="hljs-function">(<span class="hljs-params">data</span>) =&gt;</span> {
      <span class="hljs-keyword">if</span> (!controller.<span class="hljs-property">signal</span>.<span class="hljs-property">aborted</span>) <span class="hljs-title function_">setResults</span>(data);
    });

  <span class="hljs-title function_">onCleanup</span>(<span class="hljs-function">() =&gt;</span> controller.<span class="hljs-title function_">abort</span>());
});
</code></pre></div>
<p>组件销毁或依赖变化时取消旧请求，但第三方 Promise 不一定真正停止；旧结果提交前仍要检查任务身份或取消状态。测试中手动创建 <code>createRoot</code> 时，也必须调用 <code>dispose</code>，否则订阅和 effect 可能泄漏。</p>
<p>不要机械复制 React Hook 的依赖数组和闭包补丁。Solid 的依赖追踪、批处理和 owner 生命周期有自己的规则。<code>batch</code> 可以合并下游更新，但不会让计算自动移出主线程，也不能替代请求取消。</p>
<h2>细粒度不等于没有性能成本</h2>
<p>一个 memo 里遍历几十万条数据、一次更新造成大量 DOM 变化或第三方图表重绘，仍然会慢。列表规模、对象身份、数据结构和外部库成本不会因为没有常规虚拟 DOM 就消失。</p>
<p>迁移到 Solid 时，重点重新理解读取发生的位置、派生和副作用的生命周期，以及哪些数据需要共享。纯业务函数通常容易复用，依赖 React 渲染时机、组件重执行或 Hook 语义的代码则要重新设计和验证。</p>`};export{e as default};