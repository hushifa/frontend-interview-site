var e={answerHtml:`<h2>简答</h2>
<ul>
<li>Context 解决&quot;跨多层传值&quot;：Provider 下的任意后代用 <code>useContext</code> 读取最近的值，不必逐层传 props。</li>
<li>useReducer 解决&quot;更新逻辑分散&quot;：所有状态变化写在 <code>reducer(state, action)</code> 里，组件只负责 <code>dispatch</code> 动作。</li>
<li>常见组合是把 <code>state</code> 和 <code>dispatch</code> 放进两个 Context，<code>dispatch</code> 的引用永远不变，只用它的组件不会因状态变化重新渲染。</li>
<li>Context 值变化时，所有读取它的组件都会重新渲染，<code>memo</code> 拦不住；适合主题、语言、当前用户这类低频变化的数据。</li>
<li>reducer 必须是纯函数，请求、计时器等副作用放在事件处理器或 Effect 里。</li>
</ul>
<h2>组合示例</h2>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">import</span> { createContext, use, useReducer } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;react&#x27;</span>;

<span class="hljs-keyword">const</span> <span class="hljs-title class_">TasksContext</span> = <span class="hljs-title function_">createContext</span>(<span class="hljs-literal">null</span>);
<span class="hljs-keyword">const</span> <span class="hljs-title class_">TasksDispatchContext</span> = <span class="hljs-title function_">createContext</span>(<span class="hljs-literal">null</span>);

<span class="hljs-keyword">function</span> <span class="hljs-title function_">tasksReducer</span>(<span class="hljs-params">tasks, action</span>) {
  <span class="hljs-keyword">switch</span> (action.<span class="hljs-property">type</span>) {
    <span class="hljs-keyword">case</span> <span class="hljs-string">&#x27;added&#x27;</span>:
      <span class="hljs-keyword">return</span> [...tasks, { <span class="hljs-attr">id</span>: action.<span class="hljs-property">id</span>, <span class="hljs-attr">text</span>: action.<span class="hljs-property">text</span>, <span class="hljs-attr">done</span>: <span class="hljs-literal">false</span> }];
    <span class="hljs-keyword">case</span> <span class="hljs-string">&#x27;toggled&#x27;</span>:
      <span class="hljs-keyword">return</span> tasks.<span class="hljs-title function_">map</span>(<span class="hljs-function">(<span class="hljs-params">t</span>) =&gt;</span> (t.<span class="hljs-property">id</span> === action.<span class="hljs-property">id</span> ? { ...t, <span class="hljs-attr">done</span>: !t.<span class="hljs-property">done</span> } : t));
    <span class="hljs-keyword">case</span> <span class="hljs-string">&#x27;deleted&#x27;</span>:
      <span class="hljs-keyword">return</span> tasks.<span class="hljs-title function_">filter</span>(<span class="hljs-function">(<span class="hljs-params">t</span>) =&gt;</span> t.<span class="hljs-property">id</span> !== action.<span class="hljs-property">id</span>);
    <span class="hljs-attr">default</span>:
      <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">\`未知动作：<span class="hljs-subst">\${action.type}</span>\`</span>);
  }
}

<span class="hljs-keyword">export</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">TasksProvider</span>(<span class="hljs-params">{ children }</span>) {
  <span class="hljs-keyword">const</span> [tasks, dispatch] = <span class="hljs-title function_">useReducer</span>(tasksReducer, []);
  <span class="hljs-comment">// React 19 起可以直接用 &lt;Context value&gt;，旧写法 &lt;Context.Provider value&gt; 仍可用</span>
  <span class="hljs-keyword">return</span> (
    <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">TasksContext</span> <span class="hljs-attr">value</span>=<span class="hljs-string">{tasks}</span>&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">TasksDispatchContext</span> <span class="hljs-attr">value</span>=<span class="hljs-string">{dispatch}</span>&gt;</span>{children}<span class="hljs-tag">&lt;/<span class="hljs-name">TasksDispatchContext</span>&gt;</span>
    <span class="hljs-tag">&lt;/<span class="hljs-name">TasksContext</span>&gt;</span></span>
  );
}

<span class="hljs-keyword">export</span> <span class="hljs-keyword">const</span> <span class="hljs-title function_">useTasks</span> = (<span class="hljs-params"></span>) =&gt; <span class="hljs-title function_">use</span>(<span class="hljs-title class_">TasksContext</span>);
<span class="hljs-keyword">export</span> <span class="hljs-keyword">const</span> <span class="hljs-title function_">useTasksDispatch</span> = (<span class="hljs-params"></span>) =&gt; <span class="hljs-title function_">use</span>(<span class="hljs-title class_">TasksDispatchContext</span>);
</code></pre></div>
<p>只负责添加任务的输入框调用 <code>useTasksDispatch()</code>，任务列表变化时它不会重新渲染。</p>
<h2>性能注意点</h2>
<ul>
<li>Provider 的 <code>value</code> 如果每次渲染都新建对象（如 <code>value={{ user, setUser }}</code>），所有消费者每次都会重新渲染。用 <code>useMemo</code> 包裹，或像上面一样拆成多个 Context。</li>
<li>一个大 Context 装下所有全局状态时，任何字段变化都会波及全部消费者。按更新频率和使用范围拆分。</li>
<li>需要&quot;只订阅状态的一部分&quot;时，Context 做不到，这是 Zustand、Redux 等库的用武之地，它们基于 <code>useSyncExternalStore</code> 实现选择器订阅。</li>
</ul>
<h2>什么时候不用 Context</h2>
<ul>
<li>只隔了两三层的组件，直接传 props 更清楚。</li>
<li>可以通过组合避免传递：把需要数据的组件作为 <code>children</code> 传进中间层。</li>
<li>服务端数据（列表、详情）应交给数据请求库管理缓存和失效，而不是手动放进 Context。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li>没有 Provider 时读到什么？读到 <code>createContext(defaultValue)</code> 的默认值。</li>
<li><code>use(Context)</code> 和 <code>useContext</code> 有什么区别？功能相同，<code>use</code> 可以在条件语句里调用。</li>
</ul>`};export{e as default};