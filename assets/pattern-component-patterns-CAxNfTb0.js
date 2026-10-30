var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>写一个 Tabs 组件时会碰到几个问题：数据从哪里来，状态归谁管，使用者能定制到什么程度。几种常见的组件模式就是在回答这些问题。</p>
<p>容器/展示组件是把取数据、处理状态的部分和纯展示的部分拆成两个组件，展示组件只接收 props 渲染，容易复用和测试。复合组件是把一个复杂组件拆成 <code>Tabs</code>、<code>TabList</code>、<code>TabPanel</code> 这样一组组件，使用者自己组合摆放，它们之间通过 Context 共享当前选中项。</p>
<p>受控和非受控回答的是状态归谁管。react.dev 的说法是，关键状态由 props 驱动的组件叫受控组件，由自己的局部状态决定的叫非受控组件；非受控组件用起来配置少，受控组件更灵活，但需要父组件把 props 配齐。很多组件库两种都支持：传了 <code>value</code> 就受控，没传就用 <code>defaultValue</code> 自己管。</p>
<p>定制渲染内容用 <code>children</code> 或 render props。react.dev 提醒，用 <code>Children</code> API 去遍历和改写 children 容易让代码变脆弱，更推荐暴露多个组件、接收对象数组或者用 render props。复用状态逻辑现在主要用自定义 Hook。</p>
</blockquote>
<h2>容器组件和展示组件怎样拆</h2>
<p>先看展示组件。它只接收 props，不关心数据从哪来：</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">function</span> <span class="hljs-title function_">UserList</span>(<span class="hljs-params">{ users, onSelect }</span>) {
  <span class="hljs-keyword">return</span> (
    <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">ul</span>&gt;</span>
      {users.map((user) =&gt; (
        <span class="hljs-tag">&lt;<span class="hljs-name">li</span> <span class="hljs-attr">key</span>=<span class="hljs-string">{user.id}</span> <span class="hljs-attr">onClick</span>=<span class="hljs-string">{()</span> =&gt;</span> onSelect(user.id)}&gt;
          {user.name}
        <span class="hljs-tag">&lt;/<span class="hljs-name">li</span>&gt;</span>
      ))}
    <span class="hljs-tag">&lt;/<span class="hljs-name">ul</span>&gt;</span></span>
  );
}
</code></pre></div>
<p>容器组件负责取数据、保存状态，再把结果交给展示组件：</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">function</span> <span class="hljs-title function_">UserListContainer</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">const</span> users = <span class="hljs-title function_">useUsers</span>();
  <span class="hljs-keyword">const</span> [selectedId, setSelectedId] = <span class="hljs-title function_">useState</span>(<span class="hljs-literal">null</span>);
  <span class="hljs-keyword">return</span> <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">UserList</span> <span class="hljs-attr">users</span>=<span class="hljs-string">{users}</span> <span class="hljs-attr">onSelect</span>=<span class="hljs-string">{setSelectedId}</span> /&gt;</span></span>;
}
</code></pre></div>
<p>这样拆的好处是，<code>UserList</code> 可以在别的页面换一批数据复用，测试时也只需要传入假数据。可是这种拆法不要做成硬性规定：取数据的逻辑现在通常写成自定义 Hook，比如上面的 <code>useUsers</code>，react.dev 说自定义 Hook 用来在组件之间共享有状态的逻辑。组件很小时，直接在组件里调用 Hook 就够了，没必要为了模式多套一层。</p>
<h2>复合组件解决什么问题</h2>
<p>如果 Tabs 设计成接收一个大配置对象，标题里想加个图标、面板之间想插个广告，都得给组件加新参数。复合组件的做法是把 Tabs 拆成几个小组件，让使用者像写 HTML 一样组合：</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">const</span> <span class="hljs-title class_">TabsContext</span> = <span class="hljs-title function_">createContext</span>(<span class="hljs-literal">null</span>);

<span class="hljs-keyword">function</span> <span class="hljs-title function_">Tabs</span>(<span class="hljs-params">{ children, defaultValue }</span>) {
  <span class="hljs-keyword">const</span> [value, setValue] = <span class="hljs-title function_">useState</span>(defaultValue);
  <span class="hljs-keyword">return</span> (
    <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">TabsContext</span> <span class="hljs-attr">value</span>=<span class="hljs-string">{{</span> <span class="hljs-attr">value</span>, <span class="hljs-attr">setValue</span> }}&gt;</span>{children}<span class="hljs-tag">&lt;/<span class="hljs-name">TabsContext</span>&gt;</span></span>
  );
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">Tab</span>(<span class="hljs-params">{ value, children }</span>) {
  <span class="hljs-keyword">const</span> ctx = <span class="hljs-title function_">useContext</span>(<span class="hljs-title class_">TabsContext</span>);
  <span class="hljs-keyword">return</span> (
    <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">button</span>
      <span class="hljs-attr">role</span>=<span class="hljs-string">&quot;tab&quot;</span>
      <span class="hljs-attr">aria-selected</span>=<span class="hljs-string">{ctx.value</span> === <span class="hljs-string">value}</span>
      <span class="hljs-attr">onClick</span>=<span class="hljs-string">{()</span> =&gt;</span> ctx.setValue(value)}
    &gt;
      {children}
    <span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span></span>
  );
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">TabPanel</span>(<span class="hljs-params">{ value, children }</span>) {
  <span class="hljs-keyword">const</span> ctx = <span class="hljs-title function_">useContext</span>(<span class="hljs-title class_">TabsContext</span>);
  <span class="hljs-keyword">return</span> ctx.<span class="hljs-property">value</span> === value ? <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">div</span> <span class="hljs-attr">role</span>=<span class="hljs-string">&quot;tabpanel&quot;</span>&gt;</span>{children}<span class="hljs-tag">&lt;/<span class="hljs-name">div</span>&gt;</span></span> : <span class="hljs-literal">null</span>;
}
</code></pre></div>
<p>使用时写成 <code>&lt;Tabs defaultValue=&quot;a&quot;&gt;&lt;Tab value=&quot;a&quot;&gt;基本信息&lt;/Tab&gt;&lt;TabPanel value=&quot;a&quot;&gt;...&lt;/TabPanel&gt;&lt;/Tabs&gt;</code>。</p>
<p>为什么用 Context，而不是在 <code>Tabs</code> 里遍历 <code>children</code>、给每个子元素塞 props？react.dev 的 <code>Children</code> 文档明确说，用 <code>Children</code> 方法操作 children 常常导致代码脆弱，推荐的替代做法之一就是暴露多个组件让使用者自己组合。用 Context 时，<code>Tab</code> 包在别的元素里也能拿到状态，而遍历 <code>children</code> 只能看到直接子元素。Context 的用法见<a href="/questions/react-use-context/">《useContext 怎样用？什么时候该用 Context 而不是 props？》</a>。上面的写法 <code>&lt;TabsContext value={...}&gt;</code> 是 React 19 的语法，更早的版本要写 <code>&lt;TabsContext.Provider value={...}&gt;</code>。</p>
<h2>受控和非受控怎样同时支持</h2>
<p>react.dev 在“组件间共享状态”一节里讲：一个 <code>Panel</code> 用自己的 <code>isActive</code> 状态时是非受控的，父组件没法影响它；改成接收 <code>isActive</code> prop 后就由父组件控制了。非受控组件在父组件里用起来配置少，受控组件最灵活，但要求父组件用 props 完整配置它。</p>
<p>组件库常见的做法是两种都支持：传了 <code>value</code> 就听父组件的，没传就用 <code>defaultValue</code> 初始化内部状态。</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">function</span> <span class="hljs-title function_">useControllableState</span>(<span class="hljs-params">value, defaultValue, onChange</span>) {
  <span class="hljs-keyword">const</span> [inner, setInner] = <span class="hljs-title function_">useState</span>(defaultValue);
  <span class="hljs-keyword">const</span> isControlled = value !== <span class="hljs-literal">undefined</span>;
  <span class="hljs-keyword">const</span> current = isControlled ? value : inner;
  <span class="hljs-keyword">function</span> <span class="hljs-title function_">setValue</span>(<span class="hljs-params">next</span>) {
    <span class="hljs-keyword">if</span> (!isControlled) <span class="hljs-title function_">setInner</span>(next);
    onChange?.(next);
  }
  <span class="hljs-keyword">return</span> [current, setValue];
}
</code></pre></div>
<p>受控时不改内部状态，只通知父组件，由父组件决定要不要更新 <code>value</code>。要注意同一个组件实例不要在受控和非受控之间切换，否则内部状态和外部值会对不上。表单输入框里的受控与非受控见<a href="/questions/react-controlled-uncontrolled/">《React 中的受控组件和非受控组件是什么？》</a>。</p>
<h2>children 和 render props 用来定制什么</h2>
<p><code>children</code> 是最简单的定制方式。react.dev 举的例子是 <code>Card</code> 组件接收 <code>children</code>，不管里面放的是头像还是文字，<code>Card</code> 只负责外框。使用者写在标签中间的 JSX 会作为 <code>children</code> prop 传进去。</p>
<p>当组件需要把内部数据交给使用者、让使用者决定怎么渲染时，用 render prop。react.dev 的解释是，像 <code>renderContent</code> 这样指定如何渲染一部分界面的 prop 就叫 render prop，因为它是函数，组件可以把信息作为参数传给它。比如列表组件传出每一项和它是否高亮，<code>renderItem={(item, isHighlighted) =&gt; ...}</code>。</p>
<p>render props、高阶组件和自定义 Hook 三种复用方式怎样选，见<a href="/questions/react-hoc-render-props/">《高阶组件、Render Props 和自定义 Hook 怎样选择？》</a>。</p>
<h2>常见追问</h2>
<p><strong>复合组件和传一个配置数组，哪个更好？</strong></p>
<blockquote>
<p>看定制需求。配置数组写起来短，适合结构固定的场景，react.dev 也把“接收对象数组作为 prop”列为替代 <code>Children</code> API 的做法之一。需要在中间插入任意内容、改变结构时，复合组件更灵活，代价是使用者要写更多 JSX。</p>
</blockquote>
<p><strong>组件库的 Select 为什么同时有 value 和 defaultValue？</strong></p>
<blockquote>
<p>为了同时支持受控和非受控。只关心最终结果的场景，传 <code>defaultValue</code> 让组件自己管状态，配置最少；需要联动、校验或者外部重置时，传 <code>value</code> 和 <code>onChange</code>，状态完全由父组件掌握。</p>
</blockquote>`};export{e as default};