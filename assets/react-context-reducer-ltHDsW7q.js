var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>组件嵌套很深时，一个数据要从顶层一层层传下去，中间的组件根本不用它，也得帮忙传。Context 解决的就是这个：在上面用 Provider 放一个值，下面任意深度的组件用 <code>useContext</code> 直接读最近的那个值。</p>
<p><code>useReducer</code> 解决的是另一个问题：改状态的逻辑散落在各个事件里，不好维护。它把所有变化集中写在一个 <code>reducer(state, action)</code> 函数里，组件只管 <code>dispatch</code> 一个动作，说明“发生了什么”。</p>
<p>两者常一起用：把 <code>state</code> 和 <code>dispatch</code> 分别放进两个 Context。<code>dispatch</code> 的引用永远不变，只用它的组件不会因为状态变化而重新渲染。</p>
<p>要注意，Context 的值一变，所有读它的组件都会重新渲染，<code>memo</code> 也拦不住。所以它适合主题、语言、当前用户这类不常变的数据。另外 reducer 必须是纯函数，请求、定时器这些副作用要放在事件处理器或 Effect 里。</p>
</blockquote>
<h2>一个任务列表的完整组合</h2>
<p>下面把任务列表的状态和更新逻辑都放进 Provider。注意看 <code>tasks</code> 和 <code>dispatch</code> 是分开放的。</p>
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
<p>为什么要拆成两个 Context？因为有些组件只需要“发动作”，不需要读列表，比如添加任务的输入框。它调用 <code>useTasksDispatch()</code>，而 <code>dispatch</code> 从头到尾是同一个函数，所以任务列表怎么变，这个输入框都不会重新渲染。如果把两者塞进同一个 Context，它就会被列表的每次变化牵连。</p>
<p>reducer 里只根据旧状态和动作算出新状态，不发请求、不改外部变量。这样同样的输入总是得到同样的结果，好测试，也不会因为 React 多调用一次而出问题。</p>
<h2>为什么 Context 一变就会大面积重新渲染</h2>
<p>Context 没有“只订阅一部分”的能力。值换了，React 就通知所有读这个 Context 的组件重新渲染，不管它用到的那个字段有没有变。</p>
<p>最常见的坑是每次渲染都新建 value 对象：</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx">&lt;<span class="hljs-title class_">UserContext</span> value={{ user, setUser }}&gt;
</code></pre></div>
<p><code>{ user, setUser }</code> 每次渲染都是一个新对象，即使 <code>user</code> 没变，所有消费者也会重新渲染。改法是用 <code>useMemo</code> 包起来，或者像上面那样拆成多个 Context。</p>
<p>同样道理，一个大 Context 装下全部全局状态，任何字段一变都波及所有人。应该按更新频率和使用范围拆开。真正需要“只订阅状态的某一部分”时，Context 做不到，这就是 Zustand、Redux 这些库的用处，它们基于 <code>useSyncExternalStore</code> 实现了选择器订阅。</p>
<h2>什么时候不该用 Context</h2>
<p>只隔了两三层的组件，直接传 props 反而更清楚，一眼能看出数据从哪来。</p>
<p>有时还可以用组合绕开传递：中间层不关心数据，就把需要数据的组件作为 <code>children</code> 传进去，数据在外层直接给它。</p>
<p>服务端来的数据，比如列表和详情，最好交给数据请求库，它会处理缓存和失效。手动塞进 Context 就得自己管这些。</p>
<h2>常见追问</h2>
<p><strong>组件外面没有 Provider，读到的是什么？</strong></p>
<blockquote>
<p>读到 <code>createContext(defaultValue)</code> 时传的默认值。上面例子传的是 <code>null</code>，所以没包 Provider 会拿到 <code>null</code>。</p>
</blockquote>
<p><strong><code>use(Context)</code> 和 <code>useContext</code> 有什么区别？</strong></p>
<blockquote>
<p>读出来的值一样。区别是 <code>use</code> 可以写在 <code>if</code> 里面条件调用，<code>useContext</code> 是 Hook，只能在顶层调用。</p>
</blockquote>`};export{e as default};