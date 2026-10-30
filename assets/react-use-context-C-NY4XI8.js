var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>应用要支持深色模式，按钮、卡片、弹窗分布在很深的层级里，每一层都传 <code>theme</code> prop 太麻烦。可以 <code>createContext</code> 建一个 <code>ThemeContext</code>，在根部用 <code>&lt;ThemeContext value={theme}&gt;</code> 包住，任何深层组件里调用 <code>useContext(ThemeContext)</code> 就能拿到当前主题。</p>
<p><code>useContext</code> 会往上找离它最近的同一个 Context 的 Provider，读它的 <code>value</code>；一个都找不到，才用 <code>createContext</code> 时给的默认值。React 19 起可以直接把 <code>&lt;SomeContext&gt;</code> 当 Provider 渲染，之前的版本写 <code>&lt;SomeContext.Provider&gt;</code>。</p>
<p>Context 不是 props 的替代品。React 文档建议先直接传 props，哪怕要传几层，数据从哪来一眼就能看出；中间层只是转手时，可以让它接收 <code>children</code>，减少层级。主题、语言、当前登录用户这类很多深层组件都要用、变化又不频繁的数据，才适合放进 Context。</p>
<p>要注意 Provider 必须在调用 <code>useContext</code> 的组件上层，默认值只在完全找不到 Provider 时生效。value 变化带来的重新渲染问题见<a href="/questions/react-context-performance/">《React Context 有哪些性能问题？怎样避免不必要的重新渲染？》</a>。</p>
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
<p>有两个容易出错的地方。一是 Provider 必须在调用 <code>useContext</code> 的组件<strong>上面</strong>，同一个组件自己渲染的 Provider 对自己无效。二是默认值只在完全找不到 Provider 时使用：如果上层写了 <code>&lt;ThemeContext value={undefined}&gt;</code>，读到的就是 <code>undefined</code>，不是默认值。默认值也永远不会变，要让 Context 能变化，就要像上面这样配合 state。value 变化会让哪些组件重新渲染、怎样减少不必要的渲染，见<a href="/questions/react-context-performance/">《React Context 有哪些性能问题？怎样避免不必要的重新渲染？》</a>；Context 配合 <code>useReducer</code> 管理状态，见<a href="/questions/react-context-reducer/">《Context 与 useReducer 适合管理什么状态？》</a>。</p>
<h2>什么时候用 Context，什么时候传 props</h2>
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
<p>适合放变化不频繁、很多组件都要用的数据，比如主题、语言、当前登录用户、路由信息。只有一两层的数据直接传 props 更清楚。输入框内容、拖拽坐标这类高频变化的数据更适合放在局部 state 里，原因见<a href="/questions/react-context-performance/">《React Context 有哪些性能问题？怎样避免不必要的重新渲染？》</a>。</p>
</blockquote>`};export{e as default};