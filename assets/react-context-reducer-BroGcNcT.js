var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>组件嵌套很深时，一个数据要从顶层一层层传下去，中间的组件根本不用它，也得帮忙传。Context 解决的就是这个：在上面用 Provider 放一个值，下面任意深度的组件用 <code>useContext</code> 直接读最近的那个值。</p>
<p><code>useReducer</code> 解决的是另一个问题：改状态的逻辑散落在各个事件里，不好维护。它把所有变化集中写在一个 <code>reducer(state, action)</code> 函数里，组件只管 <code>dispatch</code> 一个动作，说明“发生了什么”。</p>
<p>两者常一起用：在一个 Provider 组件里调用 <code>useReducer</code>，把 <code>state</code> 和 <code>dispatch</code> 分别放进两个 Context，再导出 <code>useTasks</code>、<code>useTasksDispatch</code> 这样的自定义 Hook。深层组件读状态、发动作都不用经过中间层，状态逻辑和组件树也解耦了。</p>
<p>要注意 reducer 必须是纯函数，请求、定时器这些副作用要放在事件处理器或 Effect 里。这套组合适合一棵子树内部共享、变化不太频繁的状态，Context 的重新渲染问题见<a href="/questions/react-context-performance/">《React Context 有哪些性能问题？怎样避免不必要的重新渲染？》</a>。</p>
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
<p>为什么 <code>tasks</code> 和 <code>dispatch</code> 要放进两个 Context，涉及只发动作的组件会不会跟着重新渲染，见<a href="/questions/react-context-performance/">《React Context 有哪些性能问题？怎样避免不必要的重新渲染？》</a>。这里先看组合本身：<code>TasksProvider</code> 把 reducer 和两个 Context 都包在里面，使用方只需要在上层包一个 <code>&lt;TasksProvider&gt;</code>，下面的组件调用 <code>useTasks()</code> 读列表、调用 <code>useTasksDispatch()</code> 发 <code>{ type: &#x27;added&#x27;, id, text }</code> 这样的动作，不知道也不关心状态存在哪里。</p>
<p>reducer 里只根据旧状态和动作算出新状态，不发请求、不改外部变量。这样同样的输入总是得到同样的结果，好测试，也不会因为 React 多调用一次而出问题。</p>
<h2>什么状态不适合这套组合</h2>
<p>只隔了两三层就能传到的状态，不需要 Context，什么时候该用 Context、什么时候传 props 见<a href="/questions/react-use-context/">《useContext 怎样用？什么时候该用 Context 而不是 props？》</a>。</p>
<p>服务端来的数据，比如列表和详情，最好交给数据请求库，它会处理缓存和失效。手动塞进 reducer 和 Context，就得自己管加载状态、过期和重新请求。</p>
<h2>常见追问</h2>
<p><strong>组件外面没有 Provider，读到的是什么？</strong></p>
<blockquote>
<p>读到 <code>createContext(defaultValue)</code> 时传的默认值。上面例子传的是 <code>null</code>，所以没包 Provider 会拿到 <code>null</code>。</p>
</blockquote>
<p><strong><code>use(Context)</code> 和 <code>useContext</code> 有什么区别？</strong></p>
<blockquote>
<p>读出来的值一样。区别是 <code>use</code> 可以写在 <code>if</code> 里面条件调用，<code>useContext</code> 是 Hook，只能在顶层调用。</p>
</blockquote>`};export{e as default};