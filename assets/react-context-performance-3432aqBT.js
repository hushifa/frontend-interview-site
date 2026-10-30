var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>比如把 <code>{ user, theme, cart }</code> 放在一个 <code>AppContext</code> 里，购物车数量每变一次，只读 <code>theme</code> 的导航栏、只读 <code>user</code> 的头像也全都跟着重新渲染。原因是 React 只比较 Provider 的 <code>value</code> 整体变没变，变了就让所有读这个 Context 的组件重新渲染，它不知道组件只用了其中哪个字段。</p>
<p>这个更新连 <code>memo</code> 也挡不住。<code>memo</code> 只在父组件传来的 props 没变时跳过渲染，React 文档写明，组件用到的 Context 变了，被 <code>memo</code> 包住的组件照样重新渲染。</p>
<p>改法按情况选。value 是每次渲染新建的对象时，用 <code>useMemo</code>、<code>useCallback</code> 让它在数据没变时保持同一个引用；变化频率不同的数据拆成几个 Context；<code>useReducer</code> 的 state 和 dispatch 分开放，只发 action 的组件就不受 state 变化影响。数据变化很频繁、组件只关心一小部分时，就把数据放到 React 外面的 store 里，组件用 <code>useSyncExternalStore</code> 只订阅自己用到的值。</p>
<p>要注意，这些都是按需做的优化。React 文档说，小应用里 value 每次都新建并不是问题；Context 适合放主题、语言、登录用户这类不常变的数据，输入框内容、拖拽坐标这种高频数据不适合放进去。</p>
</blockquote>
<h2>一个 Context 装太多东西会怎样</h2>
<p>先回顾 Context 的更新规则，基本用法见<a href="/questions/react-use-context/">《useContext 怎样用？什么时候该用 Context 而不是 props？》</a>。React 文档的说法是：从收到不同 value 的 Provider 开始，React 会重新渲染下面所有使用这个 Context 的组件，新旧 value 用 <code>Object.is</code> 比较。</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">const</span> <span class="hljs-title class_">AppContext</span> = <span class="hljs-title function_">createContext</span>(<span class="hljs-literal">null</span>);

<span class="hljs-keyword">function</span> <span class="hljs-title function_">App</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">const</span> [user] = <span class="hljs-title function_">useState</span>({ <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;小明&#x27;</span> });
  <span class="hljs-keyword">const</span> [theme, setTheme] = <span class="hljs-title function_">useState</span>(<span class="hljs-string">&#x27;light&#x27;</span>);
  <span class="hljs-keyword">const</span> [cartCount, setCartCount] = <span class="hljs-title function_">useState</span>(<span class="hljs-number">0</span>);

  <span class="hljs-keyword">const</span> value = <span class="hljs-title function_">useMemo</span>(
    <span class="hljs-function">() =&gt;</span> ({ user, theme, cartCount, setTheme, setCartCount }),
    [user, theme, cartCount],
  );

  <span class="hljs-keyword">return</span> (
    <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">AppContext</span> <span class="hljs-attr">value</span>=<span class="hljs-string">{value}</span>&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">NavBar</span> /&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">ProductList</span> /&gt;</span>
    <span class="hljs-tag">&lt;/<span class="hljs-name">AppContext</span>&gt;</span></span>
  );
}

<span class="hljs-keyword">const</span> <span class="hljs-title class_">NavBar</span> = <span class="hljs-title function_">memo</span>(<span class="hljs-keyword">function</span> <span class="hljs-title function_">NavBar</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">const</span> { theme } = <span class="hljs-title function_">useContext</span>(<span class="hljs-title class_">AppContext</span>);
  <span class="hljs-keyword">return</span> <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">nav</span> <span class="hljs-attr">className</span>=<span class="hljs-string">{theme}</span>&gt;</span>...<span class="hljs-tag">&lt;/<span class="hljs-name">nav</span>&gt;</span></span>;
});
</code></pre></div>
<p>这里已经用 <code>useMemo</code> 稳定了 value，可是购物车加一件商品，<code>cartCount</code> 变了，<code>value</code> 就得是一个新对象。<code>NavBar</code> 只用了 <code>theme</code>，也会重新渲染。</p>
<p>为什么外面包了 <code>memo</code> 还没用？因为 <code>memo</code> 管的是 props。<code>NavBar</code> 没有从父组件拿任何 props，它的更新来自 <code>useContext</code>。React 文档写得很直接：就算组件被 <code>memo</code> 包住，它使用的 Context 变了，它仍然会重新渲染，记忆化只跟父组件传来的 props 有关。</p>
<h2>第一步：别让 value 无故变化</h2>
<p>最常见的问题其实比上面更简单：value 写成了 <code>value={{ user, login }}</code>，Provider 所在组件每渲染一次，对象和函数都是新的，<code>Object.is</code> 永远判定为不同。这时数据根本没变，所有消费组件却都在跟着渲染。</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">const</span> login = <span class="hljs-title function_">useCallback</span>(<span class="hljs-function">(<span class="hljs-params">response</span>) =&gt;</span> {
  <span class="hljs-title function_">setCurrentUser</span>(response.<span class="hljs-property">user</span>);
}, []);

<span class="hljs-keyword">const</span> contextValue = <span class="hljs-title function_">useMemo</span>(<span class="hljs-function">() =&gt;</span> ({ currentUser, login }), [currentUser, login]);
</code></pre></div>
<p>用 <code>useCallback</code> 固定函数，用 <code>useMemo</code> 固定对象，只有 <code>currentUser</code> 真的变了，value 才会变。这一步只能消除“数据没变却重新渲染”，数据真的变了，所有消费组件还是会更新，所以还要看下面的拆分。<code>useMemo</code> 和 <code>memo</code> 的区别见<a href="/questions/react-memo/">《React.memo 怎样跳过组件渲染？什么情况下会失效？》</a>。</p>
<h2>第二步：按变化频率拆分 Context</h2>
<p>既然 React 按“整个 Context”通知，那就让每个 Context 只装一类数据。上面的例子可以拆成 <code>ThemeContext</code>、<code>UserContext</code>、<code>CartContext</code>，<code>NavBar</code> 只读 <code>ThemeContext</code>，购物车变化就不会再影响它。</p>
<p>如果只是一个组件想读 Context 里的一部分，React 的 <code>memo</code> 文档给了另一种办法：把组件拆成两层，外层读 Context，把用到的那个字段作为 prop 传给一个被 <code>memo</code> 包住的内层组件。外层每次还会渲染，但它很轻；内层只在这个字段变了时才渲染。</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">function</span> <span class="hljs-title function_">NavBarOuter</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">const</span> { theme } = <span class="hljs-title function_">useContext</span>(<span class="hljs-title class_">AppContext</span>);
  <span class="hljs-keyword">return</span> <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">NavBarInner</span> <span class="hljs-attr">theme</span>=<span class="hljs-string">{theme}</span> /&gt;</span></span>;
}

<span class="hljs-keyword">const</span> <span class="hljs-title class_">NavBarInner</span> = <span class="hljs-title function_">memo</span>(<span class="hljs-keyword">function</span> <span class="hljs-title function_">NavBarInner</span>(<span class="hljs-params">{ theme }</span>) {
  <span class="hljs-keyword">return</span> <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">nav</span> <span class="hljs-attr">className</span>=<span class="hljs-string">{theme}</span>&gt;</span>...<span class="hljs-tag">&lt;/<span class="hljs-name">nav</span>&gt;</span></span>;
});
</code></pre></div>
<h2>第三步：state 和 dispatch 分开放</h2>
<p><code>useReducer</code> 配合 Context 时，React 文档的做法是建两个 Context：</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">const</span> <span class="hljs-title class_">TasksContext</span> = <span class="hljs-title function_">createContext</span>(<span class="hljs-literal">null</span>);
<span class="hljs-keyword">const</span> <span class="hljs-title class_">TasksDispatchContext</span> = <span class="hljs-title function_">createContext</span>(<span class="hljs-literal">null</span>);

<span class="hljs-keyword">function</span> <span class="hljs-title function_">TasksProvider</span>(<span class="hljs-params">{ children }</span>) {
  <span class="hljs-keyword">const</span> [tasks, dispatch] = <span class="hljs-title function_">useReducer</span>(tasksReducer, initialTasks);
  <span class="hljs-keyword">return</span> (
    <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">TasksContext</span> <span class="hljs-attr">value</span>=<span class="hljs-string">{tasks}</span>&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">TasksDispatchContext</span> <span class="hljs-attr">value</span>=<span class="hljs-string">{dispatch}</span>&gt;</span>{children}<span class="hljs-tag">&lt;/<span class="hljs-name">TasksDispatchContext</span>&gt;</span>
    <span class="hljs-tag">&lt;/<span class="hljs-name">TasksContext</span>&gt;</span></span>
  );
}
</code></pre></div>
<p>为什么要分开？因为 <code>useReducer</code> 返回的 <code>dispatch</code> 的引用是稳定的（React 文档称它有 stable identity），<code>TasksDispatchContext</code> 的 value 永远不变。“添加任务”按钮只读 <code>dispatch</code>，任务列表怎么变，它都不会因为 Context 重新渲染。要是把 <code>{ tasks, dispatch }</code> 放在一个对象里，任务一变，按钮也得跟着渲染。这种组合的适用范围见<a href="/questions/react-context-reducer/">《Context 与 useReducer 适合管理什么状态？》</a>。</p>
<h2>数据变化很频繁时：外部 store 加 useSyncExternalStore</h2>
<p>拆分也有尽头。比如一个协作编辑器，文档状态有几十个字段，每秒变好几次，每个组件只关心其中一两个。拆成几十个 Context 不现实，放在一个 Context 里又会每次全部重新渲染。</p>
<p>这时的思路是把数据放到 React 外面，自己管理订阅，让每个组件只在“自己关心的那部分”变了时才更新。下面用纯 JavaScript 模拟这个机制：<code>watch</code> 相当于一个组件，它记住自己选出来的值，store 通知变化时，用 <code>Object.is</code> 比较新旧两次选出的值，不同才算一次重新渲染。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">createStore</span>(<span class="hljs-params">initialState</span>) {
  <span class="hljs-keyword">let</span> state = initialState;
  <span class="hljs-keyword">const</span> listeners = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Set</span>();
  <span class="hljs-keyword">return</span> {
    <span class="hljs-attr">getState</span>: <span class="hljs-function">() =&gt;</span> state,
    <span class="hljs-title function_">setState</span>(<span class="hljs-params">patch</span>) {
      state = { ...state, ...patch };
      listeners.<span class="hljs-title function_">forEach</span>(<span class="hljs-function">(<span class="hljs-params">listener</span>) =&gt;</span> <span class="hljs-title function_">listener</span>());
    },
    <span class="hljs-title function_">subscribe</span>(<span class="hljs-params">listener</span>) {
      listeners.<span class="hljs-title function_">add</span>(listener);
      <span class="hljs-keyword">return</span> <span class="hljs-function">() =&gt;</span> listeners.<span class="hljs-title function_">delete</span>(listener);
    },
  };
}

<span class="hljs-keyword">const</span> store = <span class="hljs-title function_">createStore</span>({ <span class="hljs-attr">count</span>: <span class="hljs-number">0</span>, <span class="hljs-attr">theme</span>: <span class="hljs-string">&#x27;light&#x27;</span> });
<span class="hljs-keyword">const</span> renders = { <span class="hljs-attr">counter</span>: <span class="hljs-number">0</span>, <span class="hljs-attr">themeLabel</span>: <span class="hljs-number">0</span> };

<span class="hljs-keyword">function</span> <span class="hljs-title function_">watch</span>(<span class="hljs-params">name, selector</span>) {
  <span class="hljs-keyword">let</span> last = <span class="hljs-title function_">selector</span>(store.<span class="hljs-title function_">getState</span>());
  store.<span class="hljs-title function_">subscribe</span>(<span class="hljs-function">() =&gt;</span> {
    <span class="hljs-keyword">const</span> next = <span class="hljs-title function_">selector</span>(store.<span class="hljs-title function_">getState</span>());
    <span class="hljs-keyword">if</span> (!<span class="hljs-title class_">Object</span>.<span class="hljs-title function_">is</span>(last, next)) {
      last = next;
      renders[name] += <span class="hljs-number">1</span>;
    }
  });
}

<span class="hljs-title function_">watch</span>(<span class="hljs-string">&#x27;counter&#x27;</span>, <span class="hljs-function">(<span class="hljs-params">state</span>) =&gt;</span> state.<span class="hljs-property">count</span>);
<span class="hljs-title function_">watch</span>(<span class="hljs-string">&#x27;themeLabel&#x27;</span>, <span class="hljs-function">(<span class="hljs-params">state</span>) =&gt;</span> state.<span class="hljs-property">theme</span>);

store.<span class="hljs-title function_">setState</span>({ <span class="hljs-attr">count</span>: <span class="hljs-number">1</span> });
store.<span class="hljs-title function_">setState</span>({ <span class="hljs-attr">count</span>: <span class="hljs-number">2</span> });
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(renders.<span class="hljs-property">counter</span>); <span class="hljs-comment">// 2</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(renders.<span class="hljs-property">themeLabel</span>); <span class="hljs-comment">// 0</span>
store.<span class="hljs-title function_">setState</span>({ <span class="hljs-attr">theme</span>: <span class="hljs-string">&#x27;dark&#x27;</span> });
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(renders.<span class="hljs-property">themeLabel</span>); <span class="hljs-comment">// 1</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">Object</span>.<span class="hljs-title function_">is</span>({ <span class="hljs-attr">count</span>: <span class="hljs-number">2</span> }, { <span class="hljs-attr">count</span>: <span class="hljs-number">2</span> })); <span class="hljs-comment">// false</span>
</code></pre></div>
<p><code>count</code> 改了两次，<code>counter</code> 更新了两次，只读 <code>theme</code> 的 <code>themeLabel</code> 一次都没更新；改 <code>theme</code> 以后它才更新一次。这正是 Context 做不到的：Context 只能按整个 value 通知，这里每个订阅者按自己选出的值判断。</p>
<p>最后一行说明为什么选出来的值要是原始值或者 store 里原有的引用。两个内容相同的新对象，<code>Object.is</code> 也判定为不同，选择函数要是每次都拼一个新对象返回，就等于每次都更新。</p>
<p>在 React 里，把这个 store 接进组件的官方方式是 <code>useSyncExternalStore</code>：</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">function</span> <span class="hljs-title function_">useStore</span>(<span class="hljs-params">selector</span>) {
  <span class="hljs-keyword">return</span> <span class="hljs-title function_">useSyncExternalStore</span>(store.<span class="hljs-property">subscribe</span>, <span class="hljs-function">() =&gt;</span> <span class="hljs-title function_">selector</span>(store.<span class="hljs-title function_">getState</span>()));
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">Counter</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">const</span> count = <span class="hljs-title function_">useStore</span>(<span class="hljs-function">(<span class="hljs-params">state</span>) =&gt;</span> state.<span class="hljs-property">count</span>);
  <span class="hljs-keyword">return</span> <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">p</span>&gt;</span>{count}<span class="hljs-tag">&lt;/<span class="hljs-name">p</span>&gt;</span></span>;
}
</code></pre></div>
<p>React 文档说明，store 变化时调用 <code>subscribe</code> 传进来的回调，React 会重新调用 <code>getSnapshot</code>，返回值用 <code>Object.is</code> 比较，不同才重新渲染这个组件。所以 <code>Counter</code> 只在 <code>count</code> 变了时更新。<code>getSnapshot</code> 在数据没变时必须返回同一个值，原因见<a href="/questions/react-external-store/">《useSyncExternalStore 为什么要求稳定的快照？》</a>。Zustand、Redux 这类支持选择器的状态库，也是让组件只订阅自己用到的字段，选型见<a href="/questions/state-store-choice/">《Zustand、Jotai 和 Redux Toolkit 应该怎样选择？》</a>。</p>
<p>不过 React 文档也建议，能用 <code>useState</code>、<code>useReducer</code> 解决的就优先用内置状态，<code>useSyncExternalStore</code> 主要用于接入已有的非 React 代码。所以先拆 Context、稳定 value，确实不够再换外部 store。</p>
<h2>常见追问</h2>
<p><strong>为什么 memo 挡不住 Context 引起的重新渲染？</strong></p>
<blockquote>
<p><code>memo</code> 只比较父组件传来的 props，props 没变就跳过这次渲染。Context 的更新不经过 props，React 会直接找到读了这个 Context 的组件，让它重新渲染。React 文档写明，被 <code>memo</code> 包住的组件，用到的 Context 变了照样重新渲染。想让它只在某个字段变了时更新，就拆成两层：外层读 Context，把字段当 prop 传给 <code>memo</code> 包住的内层。</p>
</blockquote>
<p><strong>为什么 dispatch 要单独放一个 Context？</strong></p>
<blockquote>
<p>因为 <code>useReducer</code> 返回的 <code>dispatch</code> 引用是稳定的，单独放在一个 Context 里，这个 Context 的 value 就从来不变。只发 action、不读 state 的组件只订阅它，state 怎么变都不受影响。要是 state 和 dispatch 放在同一个对象里，state 一变对象就是新的，这些组件也会跟着渲染。</p>
</blockquote>
<p><strong>Context 的问题是不是说明不该用它？</strong></p>
<blockquote>
<p>不是。主题、语言、当前登录用户这类数据变化不频繁、很多组件都要用，放 Context 很合适，偶尔整体重新渲染一次没有影响。问题出在把高频变化的数据放进一个大 Context。这类数据放局部 state，或者放进能按字段订阅的外部 store。</p>
</blockquote>`};export{e as default};