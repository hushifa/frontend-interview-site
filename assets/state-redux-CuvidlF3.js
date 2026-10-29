var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>Redux 的数据只往一个方向流：组件 <code>dispatch</code> 一个 action，reducer 根据旧 state 和这个 action 算出新 state，store 通知订阅者，组件用选择器读出自己需要的部分，重新渲染。</p>
<p>reducer 必须是纯函数。意思是同样的输入一定得到同样的输出，里面不发请求、不读时间和随机数，也不修改传进来的参数。</p>
<p>为什么这么强调？一是因为 <code>react-redux</code> 靠引用比较判断数据变没变，你原地改了旧 state，引用没变，界面就不更新。二是因为纯函数的结果只取决于输入，每次变化都能被记录、重放和测试。</p>
<p>现在一般用 Redux Toolkit，它的 <code>createSlice</code> 内置了 Immer，可以直接写 <code>state.items.push(x)</code>，Immer 会替你生成新的不可变对象。要注意副作用不能放在 reducer 里，要放进 thunk（<code>createAsyncThunk</code>）或 listener middleware；服务端数据的请求和缓存，推荐用 RTK Query。</p>
</blockquote>
<h2>原地修改为什么会让界面不更新</h2>
<p>先用两个手写的 reducer 对比一下，一个原地改，一个返回新对象：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">badReducer</span>(<span class="hljs-params">state, action</span>) {
  <span class="hljs-keyword">if</span> (action.<span class="hljs-property">type</span> === <span class="hljs-string">&#x27;added&#x27;</span>) state.<span class="hljs-property">items</span>.<span class="hljs-title function_">push</span>(action.<span class="hljs-property">payload</span>);
  <span class="hljs-keyword">return</span> state;
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">goodReducer</span>(<span class="hljs-params">state, action</span>) {
  <span class="hljs-keyword">if</span> (action.<span class="hljs-property">type</span> === <span class="hljs-string">&#x27;added&#x27;</span>) <span class="hljs-keyword">return</span> { ...state, <span class="hljs-attr">items</span>: [...state.<span class="hljs-property">items</span>, action.<span class="hljs-property">payload</span>] };
  <span class="hljs-keyword">return</span> state;
}

<span class="hljs-keyword">const</span> before = { <span class="hljs-attr">items</span>: [] };
<span class="hljs-keyword">const</span> bad = <span class="hljs-title function_">badReducer</span>(before, { <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;added&#x27;</span>, <span class="hljs-attr">payload</span>: <span class="hljs-string">&#x27;a&#x27;</span> });
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(bad === before); <span class="hljs-comment">// true</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(before.<span class="hljs-property">items</span>.<span class="hljs-property">length</span>); <span class="hljs-comment">// 1</span>

<span class="hljs-keyword">const</span> before2 = { <span class="hljs-attr">items</span>: [] };
<span class="hljs-keyword">const</span> good = <span class="hljs-title function_">goodReducer</span>(before2, { <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;added&#x27;</span>, <span class="hljs-attr">payload</span>: <span class="hljs-string">&#x27;a&#x27;</span> });
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(good === before2); <span class="hljs-comment">// false</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(before2.<span class="hljs-property">items</span>.<span class="hljs-property">length</span>); <span class="hljs-comment">// 0</span>
</code></pre></div>
<p><code>badReducer</code> 确实把数据加进去了，可返回的还是原来那个对象，<code>bad === before</code> 是 <code>true</code>。<code>react-redux</code> 拿新旧引用一比，一样，就认为什么都没变，组件不会重新渲染。而且旧 state 也被改掉了，想回看上一步的状态都找不回来。</p>
<p><code>goodReducer</code> 返回的是新对象，引用变了，订阅者就知道要更新，旧的 <code>before2</code> 也原封不动。</p>
<h2>Redux Toolkit 怎么写</h2>
<p>手写展开运算符很繁琐，Redux Toolkit 用 Immer 解决了这个问题：</p>
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
<p>这里的 <code>push</code>、<code>splice</code> 看着是在原地改，其实 <code>state</code> 是 Immer 给的一个草稿。Immer 记下你对草稿做了什么，最后生成一个新的不可变对象，所以结果和 <code>goodReducer</code> 一样。</p>
<p>组件里这样用：</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">import</span> { useDispatch, useSelector } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;react-redux&#x27;</span>;

<span class="hljs-keyword">function</span> <span class="hljs-title function_">BookmarkButton</span>(<span class="hljs-params">{ id }</span>) {
  <span class="hljs-keyword">const</span> saved = <span class="hljs-title function_">useSelector</span>(<span class="hljs-function">(<span class="hljs-params">s</span>) =&gt;</span> s.<span class="hljs-property">bookmarks</span>.<span class="hljs-property">ids</span>.<span class="hljs-title function_">includes</span>(id));
  <span class="hljs-keyword">const</span> dispatch = <span class="hljs-title function_">useDispatch</span>();
  <span class="hljs-keyword">return</span> <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">button</span> <span class="hljs-attr">onClick</span>=<span class="hljs-string">{()</span> =&gt;</span> dispatch(toggled(id))}&gt;{saved ? &#x27;取消收藏&#x27; : &#x27;收藏&#x27;}<span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span></span>;
}
</code></pre></div>
<p>为什么用 <code>makeStore()</code> 工厂函数，而不是直接导出一个 store？因为做 SSR 时，每个请求都要创建一个新的 store，否则不同用户会共享同一份状态。</p>
<h2>ID 和时间这类不确定的值放在哪</h2>
<p>reducer 里不能调用 <code>crypto.randomUUID()</code> 或 <code>Date.now()</code>，可新增待办时确实需要 ID 和创建时间。办法是在创建 action 的时候生成：</p>
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
<p><code>prepare</code> 在创建 action 时运行，把 ID 和时间放进 payload。reducer 只是把 payload 存进去，本身仍然是确定的。重放同一个 action，得到的 state 完全一样。</p>
<h2>派生数据为什么要用选择器</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">import</span> { createSelector } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;@reduxjs/toolkit&#x27;</span>;

<span class="hljs-keyword">const</span> <span class="hljs-title function_">selectTodos</span> = (<span class="hljs-params">s</span>) =&gt; s.<span class="hljs-property">todos</span>;
<span class="hljs-keyword">const</span> selectDone = <span class="hljs-title function_">createSelector</span>([selectTodos], <span class="hljs-function">(<span class="hljs-params">todos</span>) =&gt;</span> todos.<span class="hljs-title function_">filter</span>(<span class="hljs-function">(<span class="hljs-params">t</span>) =&gt;</span> t.<span class="hljs-property">done</span>));
</code></pre></div>
<p>state 里只存原始数据，“已完成的待办”这种派生数据用选择器算。</p>
<p>为什么不在 <code>useSelector</code> 里直接写 <code>s.todos.filter(...)</code>？因为 <code>filter</code> 每次都返回一个新数组，引用每次都不同，组件就会在任何一个 action 之后都重新渲染。<code>createSelector</code> 会记住结果，输入的 <code>todos</code> 没变，就返回上一次的同一个数组。</p>
<h2>异步逻辑放在哪</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">export</span> <span class="hljs-keyword">const</span> fetchTodos = <span class="hljs-title function_">createAsyncThunk</span>(<span class="hljs-string">&#x27;todos/fetch&#x27;</span>, <span class="hljs-title function_">async</span> (_, { signal }) =&gt; {
  <span class="hljs-keyword">const</span> res = <span class="hljs-keyword">await</span> <span class="hljs-title function_">fetch</span>(<span class="hljs-string">&#x27;/api/todos&#x27;</span>, { signal });
  <span class="hljs-keyword">return</span> res.<span class="hljs-title function_">json</span>();
});
</code></pre></div>
<p><code>createAsyncThunk</code> 会自动派发 pending、fulfilled、rejected 三个 action，reducer 在 <code>extraReducers</code> 里处理它们。这样请求留在 thunk 里，reducer 依然是纯的。</p>
<h2>什么时候该用 Redux</h2>
<p>很多组件共享、更新又频繁的客户端状态，并且需要调试工具追踪每一次变化，这时适合 Redux。</p>
<p>如果只是缓存接口数据，用 RTK Query 或 TanStack Query。如果只是少量全局状态，Context、Zustand 更轻。</p>
<h2>常见追问</h2>
<p><strong>为什么不能在 reducer 里 <code>fetch</code>？</strong></p>
<blockquote>
<p>请求是副作用，结果也不确定。记录下 action 再重放的时候，就得不到相同的 state 了。</p>
</blockquote>
<p><strong>Immer 有什么限制？</strong></p>
<blockquote>
<p>要么修改草稿，要么返回一个新值，两者不能同时做。</p>
</blockquote>`};export{e as default};