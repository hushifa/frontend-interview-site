var e={answerHtml:`<p>这三个 API 都与复用有关，但复用的对象不同。memo 包装组件，useMemo 记住一次计算的结果，useCallback 记住一个函数引用。使用时应先知道哪一段工作昂贵，或者哪一个身份变化会触发无用更新。</p>
<p>它们属于性能优化，而不是业务正确性的基础。如果去掉缓存后功能就错了，应该先修复数据流、副作用或依赖，而不是继续增加缓存层。</p>
<h3>三种工具分别管哪一层</h3>
<table><thead><tr><th>工具</th><th>主要复用内容</th><th>不会自动阻止的事情</th></tr></thead><tbody><tr><td>memo</td><td>props 相同时的组件计算结果</td><td>自身 state、所读取 Context 等引起的更新</td></tr><tr><td>useMemo</td><td>依赖相同时的计算结果</td><td>依赖改变、缓存被丢弃或计算本身副作用造成的问题</td></tr><tr><td>useCallback</td><td>依赖相同时的函数身份</td><td>函数被调用时执行内部逻辑</td></tr></tbody></table>
<p>memo 默认对各个 prop 使用 Object.is 比较，不是对对象内容做深度比较。useMemo、useCallback 的依赖比较也基于相应值身份与数值规则。</p>
<h3>配合使用时，稳定身份才有意义</h3>
<p>下面的数据很小，只用于观察身份关系，不代表这种规模必须添加缓存：</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">import</span> { memo, useCallback, useMemo, useState } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;react&#x27;</span>;

<span class="hljs-keyword">const</span> items = [
  { <span class="hljs-attr">id</span>: <span class="hljs-string">&#x27;html&#x27;</span>, <span class="hljs-attr">title</span>: <span class="hljs-string">&#x27;HTML&#x27;</span> },
  { <span class="hljs-attr">id</span>: <span class="hljs-string">&#x27;css&#x27;</span>, <span class="hljs-attr">title</span>: <span class="hljs-string">&#x27;CSS&#x27;</span> },
  { <span class="hljs-attr">id</span>: <span class="hljs-string">&#x27;react&#x27;</span>, <span class="hljs-attr">title</span>: <span class="hljs-string">&#x27;React&#x27;</span> },
];

<span class="hljs-keyword">const</span> <span class="hljs-title class_">ResultList</span> = <span class="hljs-title function_">memo</span>(<span class="hljs-keyword">function</span> <span class="hljs-title function_">ResultList</span>(<span class="hljs-params">{ entries, onSelect }</span>) {
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;计算结果列表&#x27;</span>);
  <span class="hljs-keyword">return</span> (
    <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">ul</span>&gt;</span>
      {entries.map(item =&gt; (
        <span class="hljs-tag">&lt;<span class="hljs-name">li</span> <span class="hljs-attr">key</span>=<span class="hljs-string">{item.id}</span>&gt;</span>
          <span class="hljs-tag">&lt;<span class="hljs-name">button</span> <span class="hljs-attr">type</span>=<span class="hljs-string">&quot;button&quot;</span> <span class="hljs-attr">onClick</span>=<span class="hljs-string">{()</span> =&gt;</span> onSelect(item.id)}&gt;{item.title}<span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span>
        <span class="hljs-tag">&lt;/<span class="hljs-name">li</span>&gt;</span>
      ))}
    <span class="hljs-tag">&lt;/<span class="hljs-name">ul</span>&gt;</span></span>
  );
});

<span class="hljs-keyword">export</span> <span class="hljs-keyword">default</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">SearchableList</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">const</span> [query, setQuery] = <span class="hljs-title function_">useState</span>(<span class="hljs-string">&#x27;&#x27;</span>);
  <span class="hljs-keyword">const</span> [dark, setDark] = <span class="hljs-title function_">useState</span>(<span class="hljs-literal">false</span>);
  <span class="hljs-keyword">const</span> [selected, setSelected] = <span class="hljs-title function_">useState</span>(<span class="hljs-string">&#x27;&#x27;</span>);

  <span class="hljs-keyword">const</span> entries = <span class="hljs-title function_">useMemo</span>(<span class="hljs-function">() =&gt;</span> {
    <span class="hljs-keyword">const</span> term = query.<span class="hljs-title function_">toLowerCase</span>();
    <span class="hljs-keyword">return</span> items.<span class="hljs-title function_">filter</span>(<span class="hljs-function"><span class="hljs-params">item</span> =&gt;</span> item.<span class="hljs-property">title</span>.<span class="hljs-title function_">toLowerCase</span>().<span class="hljs-title function_">includes</span>(term));
  }, [query]);

  <span class="hljs-keyword">const</span> onSelect = <span class="hljs-title function_">useCallback</span>(<span class="hljs-function"><span class="hljs-params">id</span> =&gt;</span> {
    <span class="hljs-title function_">setSelected</span>(id);
  }, []);

  <span class="hljs-keyword">return</span> (
    <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">section</span> <span class="hljs-attr">data-theme</span>=<span class="hljs-string">{dark</span> ? &#x27;<span class="hljs-attr">dark</span>&#x27; <span class="hljs-attr">:</span> &#x27;<span class="hljs-attr">light</span>&#x27;}&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">label</span>&gt;</span>搜索<span class="hljs-tag">&lt;<span class="hljs-name">input</span> <span class="hljs-attr">value</span>=<span class="hljs-string">{query}</span> <span class="hljs-attr">onChange</span>=<span class="hljs-string">{event</span> =&gt;</span> setQuery(event.target.value)} /&gt;<span class="hljs-tag">&lt;/<span class="hljs-name">label</span>&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">button</span> <span class="hljs-attr">type</span>=<span class="hljs-string">&quot;button&quot;</span> <span class="hljs-attr">onClick</span>=<span class="hljs-string">{()</span> =&gt;</span> setDark(value =&gt; !value)}&gt;切换主题<span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">ResultList</span> <span class="hljs-attr">entries</span>=<span class="hljs-string">{entries}</span> <span class="hljs-attr">onSelect</span>=<span class="hljs-string">{onSelect}</span> /&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">output</span> <span class="hljs-attr">aria-label</span>=<span class="hljs-string">&quot;已选项目&quot;</span>&gt;</span>{selected}<span class="hljs-tag">&lt;/<span class="hljs-name">output</span>&gt;</span>
    <span class="hljs-tag">&lt;/<span class="hljs-name">section</span>&gt;</span></span>
  );
}
</code></pre></div>
<p>query 不变、只切换父级的 dark 时，useMemo 可以返回同一 entries 数组，useCallback 可以返回同一 onSelect，memo 因而有机会跳过 ResultList 的重复计算。</p>
<p>如果每轮都直接 filter，就会创建一个新数组，即使项目内容相同，entries 的引用也不同。如果每次给 memo 子组件传一个新箭头函数，函数 prop 同样变化。只包 memo 却不看传入值，可能看不到预期收益。</p>
<p>示例中的日志只是观察计算，不是提交次数或性能指标。React 仍保留重新渲染的权利，不能把“日志必须永远只出现一次”当作功能契约。</p>
<h3>useMemo 不会让计算自动变成后台任务</h3>
<p>useMemo 的计算在渲染过程中发生，必须是纯计算。第一次计算、依赖变化或需要重新计算时，昂贵工作仍然会占用相应执行时间。</p>
<p>因此把一个很慢的循环包进 useMemo，只能减少某些重复执行，不能消除首次成本，也不把它变成 Worker。大数据量还需要考虑算法、分页、虚拟化、任务拆分或真正的后台计算。</p>
<p>也不要用 useMemo 创建需要准确释放的连接或订阅。缓存可能被丢弃，副作用生命周期应由对应机制管理，而不是把缓存值当成永久资源所有权。</p>
<h3>useCallback 缓存的是函数，不是调用结果</h3>
<p>onSelect 每次被调用仍然会执行 setSelected。它稳定的是传给子组件的函数身份，不是给所有 id 预先缓存执行结果。</p>
<p>在普通代码中，传给 useCallback 的函数表达式仍可能在渲染时被创建，React 再决定返回已有缓存还是这次的函数。因此它常用于减少依赖身份变化，不应被宣传为“完全不创建函数”的工具。</p>
<p>空依赖也不代表函数体自动看到最新状态。本例只使用稳定 setter 和调用参数，所以不需要 query 等依赖；如果函数读取会变化的 props 或 state，就必须按真实关系维护依赖，或重新设计更新方式。</p>
<h3>自定义比较函数最容易把旧行为留下来</h3>
<p>memo 可以提供比较函数，但返回 true 的含义是新旧 props 会产生相同输出和行为，不只是某个文字字段相同。</p>
<p>如果忽略 onClick 等函数 prop 的变化，子组件可能继续持有捕获旧状态的函数，画面文字看起来正确，点击行为却已过期。深度比较大型对象也可能比重新渲染更慢，尤其结构未来变深时成本更不可控。</p>
<p>通常先减少不必要的大对象 prop、把组件边界和状态放置调整清楚，再决定是否需要自定义比较。不要把所有对象强行 JSON.stringify 后比较，当成通用安全实现。</p>
<h3>Context、状态和 JSX 身份也会影响结果</h3>
<p>memo 子组件自身的 state 更新不会被 memo 拦住，读取的 Context 变化也应传递进来。父级返回新的 JSX children 时，作为 prop 的 children 身份也可能变化，不能只检查自己显式传入的两个字段。</p>
<p>把状态放得更靠近真正使用它的组件，常常能直接减少受影响的范围，比给整棵页面逐个加 memo 更容易理解。列表 key 不稳定造成的重新挂载，也不是 memo 能修复的问题。</p>
<h3>React Compiler 与手工缓存需要看实际配置</h3>
<p>启用并正确运行 React Compiler 的项目，可能由编译器自动完成许多记忆化，减少手工 memo、useMemo、useCallback 的需要。但仅仅安装某个 React 版本，不等于整个构建链已经启用相应编译优化。</p>
<p>无论手工还是自动缓存，都依赖纯渲染和正确数据流。用 Profiler 与真实交互测量计算时间、提交和延迟，确认收益后再保留优化；不要仅凭代码里出现了三个缓存 API，就认定性能一定更好。</p>`};export{e as default};