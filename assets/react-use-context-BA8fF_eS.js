var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>应用要支持深色模式，按钮、卡片、弹窗分布在很深的层级里，每一层都传 <code>theme</code> prop 太麻烦。可以 <code>createContext</code> 建一个 <code>ThemeContext</code>，在根部用 <code>&lt;ThemeContext value={theme}&gt;</code> 包住，任何深层组件里调用 <code>useContext(ThemeContext)</code> 就能拿到当前主题。</p>
<p><code>useContext</code> 会往上找离它最近的同一个 Context 的 Provider，读它的 <code>value</code>；一个都找不到，才用 <code>createContext</code> 时给的默认值。React 19 起可以直接把 <code>&lt;SomeContext&gt;</code> 当 Provider 渲染，之前的版本写 <code>&lt;SomeContext.Provider&gt;</code>。</p>
<p>为什么一变就全部重新渲染？因为 React 用 <code>Object.is</code> 比较 Provider 新旧两次的 <code>value</code>，只要不同，就会找出下面所有读了这个 Context 的组件，让它们重新渲染。它不知道组件只用了 <code>value</code> 里的哪个字段，而且这个更新绕过了 <code>memo</code>，<code>memo</code> 只比较父组件传来的 props。</p>
<p>最容易踩的坑是每次渲染都写 <code>value={{ user, login }}</code>，对象每次都是新的，比较结果永远不同，所有消费组件跟着 Provider 所在组件一起重新渲染。改法是用 <code>useMemo</code>、<code>useCallback</code> 让 value 在数据没变时保持同一个引用；变化频率不同的数据拆成几个 Context；数据变化非常频繁时，换成支持按字段订阅的状态库。</p>
</blockquote>
<h2>基本用法</h2>
<p>下面是一个主题切换的完整写法，注意 Provider 放在读取它的组件的上层：</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">import</span> { createContext, useContext, useState } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;react&#x27;</span>;

<span class="hljs-keyword">const</span> <span class="hljs-title class_">ThemeContext</span> = <span class="hljs-title function_">createContext</span>(<span class="hljs-string">&#x27;light&#x27;</span>);

<span class="hljs-keyword">export</span> <span class="hljs-keyword">default</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">App</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">const</span> [theme, setTheme] = <span class="hljs-title function_">useState</span>(<span class="hljs-string">&#x27;light&#x27;</span>);
  <span class="hljs-keyword">return</span> (
    <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">ThemeContext</span> <span class="hljs-attr">value</span>=<span class="hljs-string">{theme}</span>&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">Toolbar</span> /&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">button</span> <span class="hljs-attr">onClick</span>=<span class="hljs-string">{()</span> =&gt;</span> setTheme(theme === &#x27;light&#x27; ? &#x27;dark&#x27; : &#x27;light&#x27;)}&gt;
        切换主题
      <span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span>
    <span class="hljs-tag">&lt;/<span class="hljs-name">ThemeContext</span>&gt;</span></span>
  );
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">Toolbar</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">return</span> <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">Button</span>&gt;</span>保存<span class="hljs-tag">&lt;/<span class="hljs-name">Button</span>&gt;</span></span>;
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">Button</span>(<span class="hljs-params">{ children }</span>) {
  <span class="hljs-keyword">const</span> theme = <span class="hljs-title function_">useContext</span>(<span class="hljs-title class_">ThemeContext</span>);
  <span class="hljs-keyword">return</span> <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">button</span> <span class="hljs-attr">className</span>=<span class="hljs-string">{</span>\`<span class="hljs-attr">btn-</span>\${<span class="hljs-attr">theme</span>}\`}&gt;</span>{children}<span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span></span>;
}
</code></pre></div>
<p><code>Toolbar</code> 没有接收也没有传递 <code>theme</code>，<code>Button</code> 怎么拿到的？<code>useContext</code> 不走 props，它沿着组件树往上找最近的 <code>ThemeContext</code> Provider。中间隔多少层都没关系。点切换按钮后，<code>theme</code> 状态变化，Provider 的 <code>value</code> 变了，<code>Button</code> 自动用新值重新渲染。</p>
<p>有两个容易出错的地方。一是 Provider 必须在调用 <code>useContext</code> 的组件<strong>上面</strong>，同一个组件自己渲染的 Provider 对自己无效。二是默认值只在完全找不到 Provider 时使用：如果上层写了 <code>&lt;ThemeContext value={undefined}&gt;</code>，读到的就是 <code>undefined</code>，不是默认值。默认值也永远不会变，要让 Context 能变化，就要像上面这样配合 state。</p>
<h2>为什么 memo 拦不住 Context 更新</h2>
<p>先看现象，下面的 <code>Panel</code> 用 <code>memo</code> 包住了，父组件也没有给它传任何 props：</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">const</span> <span class="hljs-title class_">ThemeContext</span> = <span class="hljs-title function_">createContext</span>(<span class="hljs-literal">null</span>);

<span class="hljs-keyword">function</span> <span class="hljs-title function_">App</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">const</span> [theme, setTheme] = <span class="hljs-title function_">useState</span>(<span class="hljs-string">&#x27;light&#x27;</span>);
  <span class="hljs-keyword">return</span> (
    <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">ThemeContext</span> <span class="hljs-attr">value</span>=<span class="hljs-string">{theme}</span>&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">Panel</span> /&gt;</span>
    <span class="hljs-tag">&lt;/<span class="hljs-name">ThemeContext</span>&gt;</span></span>
  );
}

<span class="hljs-keyword">const</span> <span class="hljs-title class_">Panel</span> = <span class="hljs-title function_">memo</span>(<span class="hljs-keyword">function</span> <span class="hljs-title function_">Panel</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">const</span> theme = <span class="hljs-title function_">useContext</span>(<span class="hljs-title class_">ThemeContext</span>);
  <span class="hljs-keyword">return</span> <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">section</span> <span class="hljs-attr">className</span>=<span class="hljs-string">{theme}</span>&gt;</span>...<span class="hljs-tag">&lt;/<span class="hljs-name">section</span>&gt;</span></span>;
});
</code></pre></div>
<p><code>theme</code> 变化时，<code>Panel</code> 还是会重新渲染。React 文档在 <code>memo</code> 的说明里写得很明确：即使用了 <code>memo</code>，组件自己的 state 变了，或者它用到的 Context 变了，它还是会重新渲染；<code>memo</code> 只管从父组件传来的 props。</p>
<p>原因在于更新的路径不同。props 变化是父组件重新渲染后把新 props 交给子组件，<code>memo</code> 在这一步比较新旧 props 决定要不要跳过。Context 变化时，React 拿 Provider 新旧两个 <code>value</code> 用 <code>Object.is</code> 比较，不同就让下面所有读了这个 Context 的组件重新渲染，这条路径不经过 <code>memo</code> 的 props 比较。</p>
<p>而且 <code>useContext</code> 读的是整个 <code>value</code>。如果 <code>value</code> 是 <code>{ user, theme, cart }</code>，一个只用了 <code>theme</code> 的组件，在 <code>cart</code> 变化时也会重新渲染，因为 React 只知道“这个组件读了这个 Context”，不知道它用了哪个字段。</p>
<h2>每次都是新对象的问题</h2>
<p>最常见的性能问题不是数据真的变了，而是 value 每次都是新的：</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">function</span> <span class="hljs-title function_">MyApp</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">const</span> [currentUser, setCurrentUser] = <span class="hljs-title function_">useState</span>(<span class="hljs-literal">null</span>);

  <span class="hljs-keyword">function</span> <span class="hljs-title function_">login</span>(<span class="hljs-params">response</span>) {
    <span class="hljs-title function_">storeCredentials</span>(response.<span class="hljs-property">credentials</span>);
    <span class="hljs-title function_">setCurrentUser</span>(response.<span class="hljs-property">user</span>);
  }

  <span class="hljs-keyword">return</span> (
    <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">AuthContext</span> <span class="hljs-attr">value</span>=<span class="hljs-string">{{</span> <span class="hljs-attr">currentUser</span>, <span class="hljs-attr">login</span> }}&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">Page</span> /&gt;</span>
    <span class="hljs-tag">&lt;/<span class="hljs-name">AuthContext</span>&gt;</span></span>
  );
}
</code></pre></div>
<p><code>MyApp</code> 因为别的原因重新渲染时，比如路由变化，<code>{ currentUser, login }</code> 是一个新对象，<code>login</code> 也是一个新函数，<code>Object.is</code> 比较结果不同，所有读 <code>AuthContext</code> 的组件都要重新渲染，即使 <code>currentUser</code> 根本没变。</p>
<p>React 文档给的改法是把函数用 <code>useCallback</code> 包起来，把对象用 <code>useMemo</code> 包起来：</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">const</span> login = <span class="hljs-title function_">useCallback</span>(<span class="hljs-function">(<span class="hljs-params">response</span>) =&gt;</span> {
  <span class="hljs-title function_">storeCredentials</span>(response.<span class="hljs-property">credentials</span>);
  <span class="hljs-title function_">setCurrentUser</span>(response.<span class="hljs-property">user</span>);
}, []);

<span class="hljs-keyword">const</span> contextValue = <span class="hljs-title function_">useMemo</span>(<span class="hljs-function">() =&gt;</span> ({ currentUser, login }), [currentUser, login]);

<span class="hljs-keyword">return</span> (
  <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">AuthContext</span> <span class="hljs-attr">value</span>=<span class="hljs-string">{contextValue}</span>&gt;</span>
    <span class="hljs-tag">&lt;<span class="hljs-name">Page</span> /&gt;</span>
  <span class="hljs-tag">&lt;/<span class="hljs-name">AuthContext</span>&gt;</span></span>
);
</code></pre></div>
<p>这样 <code>MyApp</code> 再重新渲染，只要 <code>currentUser</code> 没变，<code>contextValue</code> 还是同一个对象，消费组件就不会因此重新渲染。文档也提醒，小应用里这不是问题，属于按需做的性能优化。</p>
<h2>把 Context 拆开</h2>
<p>另一个办法是按变化频率拆分。比如任务列表，<code>tasks</code> 经常变，<code>dispatch</code> 函数从不变。放进同一个 Context，只用 <code>dispatch</code> 的“添加按钮”也会在每次任务变化时重新渲染。拆成 <code>TasksContext</code> 和 <code>TasksDispatchContext</code> 两个，只读 <code>dispatch</code> 的组件就不受 <code>tasks</code> 变化影响。这种 Context 加 <code>useReducer</code> 的组合，详见<a href="/questions/react-context-reducer/">《Context 与 useReducer 适合管理什么状态？》</a>。</p>
<p>如果数据变化很频繁，又有很多组件只关心其中一小部分，拆分也不够用了。这时更适合 Zustand、Redux 这类支持选择器的状态库，组件只订阅自己用到的字段，见<a href="/questions/state-store-choice/">《Zustand、Jotai 和 Redux Toolkit 应该怎样选择？》</a>。</p>
<h2>用 Context 之前先想想 props</h2>
<p>React 文档建议先别急着用 Context。先试着直接传 props，即使要传好几层，数据流也一目了然。如果中间层只是转手，往往说明少抽了组件，可以让中间组件接收 <code>children</code>，比如把 <code>&lt;Layout posts={posts} /&gt;</code> 改成 <code>&lt;Layout&gt;&lt;Posts posts={posts} /&gt;&lt;/Layout&gt;</code>，层数自然就少了。这两种都不合适时，再用 Context。</p>
<h2>常见追问</h2>
<p><strong>useContext 能写在条件语句里吗？</strong></p>
<blockquote>
<p>不能，它和其他 Hook 一样只能在组件顶层调用。React 19 新增的 <code>use</code> API 也能读取 Context，而且可以写在 <code>if</code> 和循环里，适合只在某个分支里才需要 Context 的情况。</p>
</blockquote>
<p><strong>为什么组件读不到 Provider 提供的值？</strong></p>
<blockquote>
<p>常见原因有三个。Provider 和 <code>useContext</code> 写在了同一个组件里，或者 Provider 在它下面；Provider 根本没包住这个组件；或者构建工具的问题（比如用了符号链接）让 Provider 和 <code>useContext</code> 拿到的是两个不同的 Context 对象。</p>
</blockquote>
<p><strong>Context 适合放什么数据？</strong></p>
<blockquote>
<p>适合放变化不频繁、很多组件都要用的数据，比如主题、语言、当前登录用户、路由信息。高频变化的数据，比如输入框内容、拖拽坐标，放进 Context 会让大量组件跟着重新渲染，更适合放在局部 state 或带选择器的状态库里。</p>
</blockquote>`};export{e as default};