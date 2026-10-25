var e={answerHtml:`<p>React 常以组件函数重新执行来计算下一次界面描述，再通过协调更新实际视图；Solid 的组件函数通常在实例建立时执行，之后由细粒度响应式计算更新真正依赖状态的部分。</p>
<p>因此 JSX 看起来相似，不代表状态更新模型相同。把 React 的“每次 render 都会重新算这些局部变量”照搬到 Solid，很容易读到初始化快照。</p>
<h3>signal 返回读取函数与写入函数</h3>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">import</span> { createRoot, createSignal, createMemo } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;solid-js&#x27;</span>;

<span class="hljs-title function_">createRoot</span>(<span class="hljs-function">(<span class="hljs-params">dispose</span>) =&gt;</span> {
  <span class="hljs-keyword">const</span> [count, setCount] = <span class="hljs-title function_">createSignal</span>(<span class="hljs-number">1</span>);
  <span class="hljs-keyword">const</span> doubled = <span class="hljs-title function_">createMemo</span>(<span class="hljs-function">() =&gt;</span> <span class="hljs-title function_">count</span>() * <span class="hljs-number">2</span>);
  <span class="hljs-keyword">const</span> initial = <span class="hljs-title function_">count</span>();

  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">doubled</span>(), initial); <span class="hljs-comment">// 2 1</span>
  <span class="hljs-title function_">setCount</span>(<span class="hljs-function">(<span class="hljs-params">value</span>) =&gt;</span> value + <span class="hljs-number">1</span>);
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">doubled</span>(), initial); <span class="hljs-comment">// 4 1</span>
  <span class="hljs-title function_">dispose</span>();
});
</code></pre></div>
<p>count() 每次读取当前状态，setCount 更新值。doubled 是有缓存与依赖追踪的派生计算；initial 只是执行那一行时取得的数值，不会因为原 signal 更新就自己变成 2。</p>
<p>示例需要使用 Solid 的客户端响应式实现；Node 默认解析的服务端条件可能采用不同运行语义，测试响应式更新时应明确入口条件，不能把 SSR 结果当作浏览器更新表现。</p>
<h3>追踪看读取发生在哪里</h3>
<p>在 createMemo、createEffect 或编译后的响应式表达式中读取 signal，会建立依赖。普通函数本身不会自动变成响应式节点，但如果它在受追踪计算中同步调用并读取 signal，这些读取仍可以被追踪。</p>
<p>因此不能简单说“放进普通函数就没有依赖”。关键是调用时是否处在追踪上下文，以及读取是否发生在该同步过程内。setTimeout 或 await 之后的读取，不能自然算作原来那次同步收集。</p>
<p>依赖也可以随分支变化：当前分支没有读到的 signal，不必一直驱动该派生计算。需要刻意不建立依赖时可使用 untrack 等机制，但应清楚为什么要排除它。</p>
<h3>JSX 表达式与组件主体不是同样的更新边界</h3>
<p>在模板中使用 count()，编译器可以建立局部更新；在组件主体先执行 <code>const text = count()</code> 再渲染 text，则可能只是初始值。对 props 也应保留正确的响应式访问方式，直接解构可能切断后续读取关系。</p>
<p>派生状态可以用函数表达，昂贵或需要缓存的派生计算适合 createMemo。memo 是只读计算，不应在内部随意写状态形成循环。</p>
<p>默认 signal 更新按相应相等规则判断。保存对象时，直接修改内部字段并把同一引用写回，不应期待它像深层代理一样自动检测所有变化；复杂嵌套状态可以评估 Solid store 等专门机制。</p>
<h3>副作用与资源需要所属生命周期</h3>
<p>createEffect 适合与外部系统同步，onCleanup 可清理相关订阅或资源。创建在明确 owner/root 或组件生命周期中，才能合理管理销毁；测试里手动 createRoot 时也应调用 dispose。</p>
<p>组件函数不是 React Hook 的执行循环，不应机械复制 Hook 依赖数组或闭包补丁。Solid 有自己的响应式依赖和调度规则，批处理也要按它的机制理解。</p>
<p>batch 可以合并多次写入引起的下游更新，减少中间状态传播，但不会自动让大量计算异步执行，也不能替代请求取消。异步返回的旧结果仍需要任务身份或资源抽象管理。</p>
<h3>细粒度不代表没有性能成本</h3>
<p>一个 memo 若每次遍历几十万条数据，细粒度更新仍要执行那段计算；列表对象身份、DOM 数量和外部库重绘也可能成为瓶颈。应让依赖与数据结构合理，而不是只因没有常规虚拟 DOM 就认定所有更新都更快。</p>
<p>迁移时重点重建对读取位置、组件初始化、派生计算与清理的理解。共享业务算法通常容易，直接搬运依赖特定框架渲染时机的组件逻辑则需要重新验证。</p>`};export{e as default};