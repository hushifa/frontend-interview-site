var e={answerHtml:`<h2>简答</h2>
<ul>
<li>数据流：组件 <code>dispatch(action)</code> → reducer 计算新 state → store 通知订阅者 → 组件用选择器读取需要的部分并重新渲染。</li>
<li>reducer 是纯函数：相同输入得到相同输出，不发请求、不读时间和随机数、不修改参数。</li>
<li>必须返回新对象而不是修改旧 state，<code>react-redux</code> 靠引用比较判断选择器结果是否变化，原地修改会导致界面不更新。</li>
<li>Redux Toolkit 的 <code>createSlice</code> 内置 Immer，可以写 <code>state.items.push(x)</code>，Immer 会生成新的不可变对象。</li>
<li>副作用放在 thunk（<code>createAsyncThunk</code>）或 listener middleware 中；服务端数据的请求和缓存推荐用 RTK Query。</li>
</ul>
<h2>Redux Toolkit 示例</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">import</span> { configureStore, createSlice } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;@reduxjs/toolkit&#x27;</span>;

<span class="hljs-keyword">const</span> bookmarksSlice = <span class="hljs-title function_">createSlice</span>({
  <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;bookmarks&#x27;</span>,
  <span class="hljs-attr">initialState</span>: { <span class="hljs-attr">ids</span>: [] },
  <span class="hljs-attr">reducers</span>: {
    <span class="hljs-title function_">toggled</span>(<span class="hljs-params">state, action</span>) {
      <span class="hljs-keyword">const</span> id = action.<span class="hljs-property">payload</span>;
      <span class="hljs-keyword">const</span> index = state.<span class="hljs-property">ids</span>.<span class="hljs-title function_">indexOf</span>(id);
      <span class="hljs-keyword">if</span> (index === -<span class="hljs-number">1</span>) state.<span class="hljs-property">ids</span>.<span class="hljs-title function_">push</span>(id);
      <span class="hljs-keyword">else</span> state.<span class="hljs-property">ids</span>.<span class="hljs-title function_">splice</span>(index, <span class="hljs-number">1</span>);
    },
  },
});

<span class="hljs-keyword">export</span> <span class="hljs-keyword">const</span> { toggled } = bookmarksSlice.<span class="hljs-property">actions</span>;

<span class="hljs-keyword">export</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">makeStore</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">return</span> <span class="hljs-title function_">configureStore</span>({ <span class="hljs-attr">reducer</span>: { <span class="hljs-attr">bookmarks</span>: bookmarksSlice.<span class="hljs-property">reducer</span> } });
}
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">import</span> { useDispatch, useSelector } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;react-redux&#x27;</span>;

<span class="hljs-keyword">function</span> <span class="hljs-title function_">BookmarkButton</span>(<span class="hljs-params">{ id }</span>) {
  <span class="hljs-keyword">const</span> saved = <span class="hljs-title function_">useSelector</span>(<span class="hljs-function">(<span class="hljs-params">s</span>) =&gt;</span> s.<span class="hljs-property">bookmarks</span>.<span class="hljs-property">ids</span>.<span class="hljs-title function_">includes</span>(id));
  <span class="hljs-keyword">const</span> dispatch = <span class="hljs-title function_">useDispatch</span>();
  <span class="hljs-keyword">return</span> <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">button</span> <span class="hljs-attr">onClick</span>=<span class="hljs-string">{()</span> =&gt;</span> dispatch(toggled(id))}&gt;{saved ? &#x27;取消收藏&#x27; : &#x27;收藏&#x27;}<span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span></span>;
}
</code></pre></div>
<p>用 <code>makeStore()</code> 工厂函数创建 store，SSR 时每个请求创建一个新实例，避免不同用户共享状态。</p>
<h2>不确定的值放在 action 里</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> todosSlice = <span class="hljs-title function_">createSlice</span>({
  <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;todos&#x27;</span>,
  <span class="hljs-attr">initialState</span>: [],
  <span class="hljs-attr">reducers</span>: {
    <span class="hljs-attr">added</span>: {
      <span class="hljs-title function_">reducer</span>(<span class="hljs-params">state, action</span>) {
        state.<span class="hljs-title function_">push</span>(action.<span class="hljs-property">payload</span>);
      },
      <span class="hljs-title function_">prepare</span>(<span class="hljs-params">text</span>) {
        <span class="hljs-keyword">return</span> { <span class="hljs-attr">payload</span>: { <span class="hljs-attr">id</span>: crypto.<span class="hljs-title function_">randomUUID</span>(), text, <span class="hljs-attr">createdAt</span>: <span class="hljs-title class_">Date</span>.<span class="hljs-title function_">now</span>() } };
      },
    },
  },
});
</code></pre></div>
<p>ID 和时间在创建 action 时生成，reducer 本身仍然是确定的，重放同一个 action 会得到相同结果。</p>
<h2>选择器与派生数据</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">import</span> { createSelector } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;@reduxjs/toolkit&#x27;</span>;

<span class="hljs-keyword">const</span> <span class="hljs-title function_">selectTodos</span> = (<span class="hljs-params">s</span>) =&gt; s.<span class="hljs-property">todos</span>;
<span class="hljs-keyword">const</span> selectDone = <span class="hljs-title function_">createSelector</span>([selectTodos], <span class="hljs-function">(<span class="hljs-params">todos</span>) =&gt;</span> todos.<span class="hljs-title function_">filter</span>(<span class="hljs-function">(<span class="hljs-params">t</span>) =&gt;</span> t.<span class="hljs-property">done</span>));
</code></pre></div>
<p>state 中只存原始数据，派生数据用 memoized 选择器计算。如果 <code>useSelector</code> 中直接写 <code>s.todos.filter(...)</code>，每次都返回新数组，组件会在任何 action 后重新渲染。</p>
<h2>异步逻辑</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">export</span> <span class="hljs-keyword">const</span> fetchTodos = <span class="hljs-title function_">createAsyncThunk</span>(<span class="hljs-string">&#x27;todos/fetch&#x27;</span>, <span class="hljs-title function_">async</span> (_, { signal }) =&gt; {
  <span class="hljs-keyword">const</span> res = <span class="hljs-keyword">await</span> <span class="hljs-title function_">fetch</span>(<span class="hljs-string">&#x27;/api/todos&#x27;</span>, { signal });
  <span class="hljs-keyword">return</span> res.<span class="hljs-title function_">json</span>();
});
</code></pre></div>
<p><code>createAsyncThunk</code> 自动派发 pending、fulfilled、rejected 三个 action，reducer 在 <code>extraReducers</code> 中处理它们。</p>
<h2>什么时候用 Redux</h2>
<ul>
<li>很多组件共享、频繁更新的客户端状态，需要调试工具追踪每次变化。</li>
<li>只是缓存接口数据：用 RTK Query 或 TanStack Query。</li>
<li>只是少量全局状态：Context、Zustand 更轻。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li>为什么不能在 reducer 里 <code>fetch</code>？请求是副作用，结果不确定，记录和重放 action 时无法得到相同的 state。</li>
<li>Immer 有什么限制？要么修改草稿，要么返回新值，不能两者同时做。</li>
</ul>`};export{e as default};