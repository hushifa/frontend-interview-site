var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>以前为了少渲染、少计算，要手写 <code>memo</code>、<code>useMemo</code>、<code>useCallback</code>，写多了容易漏依赖，写少了又没效果。React Compiler 是一个打包时运行的 Babel 插件（<code>babel-plugin-react-compiler</code>），它分析你的组件，自动把这些缓存加上。1.0 已经稳定发布。</p>
<p>它能这么做，是因为 React 要求渲染是纯函数：不改 props 和 state，Hook 在顶层调用。只要代码守这些规则，编译器就能判断哪些值只跟哪些输入有关，输入不变就复用上次的结果。违反规则的组件，它会直接跳过，不报错。</p>
<p>它主要面向 React 19，React 17、18 也能用，要额外装 <code>react-compiler-runtime</code> 并配置 <code>target</code>。配套的 lint 规则在 <code>eslint-plugin-react-hooks</code> 的推荐预设里，能提前找出会被跳过的代码。</p>
<p>要注意，它减少的只是重复渲染和重复计算。DOM 太多、接口慢、包太大，还是要靠虚拟列表、数据加载策略和代码拆分。</p>
</blockquote>
<h2>编译器具体做了什么</h2>
<p>先看一个普通组件，它算出购物车总价，再格式化成货币：</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">function</span> <span class="hljs-title function_">CartSummary</span>(<span class="hljs-params">{ items, currency }</span>) {
  <span class="hljs-keyword">const</span> total = items.<span class="hljs-title function_">reduce</span>(<span class="hljs-function">(<span class="hljs-params">sum, item</span>) =&gt;</span> sum + item.<span class="hljs-property">price</span> * item.<span class="hljs-property">count</span>, <span class="hljs-number">0</span>);
  <span class="hljs-keyword">const</span> formatted = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">NumberFormat</span>(<span class="hljs-string">&#x27;zh-CN&#x27;</span>, { <span class="hljs-attr">style</span>: <span class="hljs-string">&#x27;currency&#x27;</span>, currency }).<span class="hljs-title function_">format</span>(total);
  <span class="hljs-keyword">return</span> <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">Price</span> <span class="hljs-attr">value</span>=<span class="hljs-string">{formatted}</span> <span class="hljs-attr">onCopy</span>=<span class="hljs-string">{()</span> =&gt;</span> navigator.clipboard.writeText(formatted)} /&gt;</span>;
}
</code></pre></div>
<p>没有编译器时，父组件每渲染一次，这里的 <code>total</code>、<code>formatted</code> 都要重算，传给 <code>Price</code> 的箭头函数也是新的。函数是新的，<code>Price</code> 就会跟着重新渲染。</p>
<p>编译以后，<code>total</code>、<code>formatted</code>、回调函数和 JSX 都会按它们依赖的 <code>items</code>、<code>currency</code> 缓存起来。只要这两个值没变，父组件再怎么渲染，<code>Price</code> 收到的 props 都和上次一样，就会被跳过。要手写达到同样效果，你得写两个 <code>useMemo</code>、一个 <code>useCallback</code>，再给 <code>Price</code> 包一层 <code>memo</code>。</p>
<h2>为什么不守规则的代码会被跳过</h2>
<p>编译器加缓存的前提是“输入一样，输出就一样”。如果组件在渲染时改了外部变量，或者直接改 props，那输入一样输出也可能不同，缓存就会让结果出错。</p>
<p>所以编译器遇到这种代码时选择不碰它，组件照旧每次执行。这也意味着它不会报错提醒你，要靠 lint 规则提前发现。</p>
<h2>在 Vite 里怎么接入</h2>
<p><code>@vitejs/plugin-react</code> 6.0 起去掉了内联的 <code>babel</code> 选项，改成配合 <code>@rolldown/plugin-babel</code> 使用预设：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// vite.config.js</span>
<span class="hljs-keyword">import</span> { defineConfig } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;vite&#x27;</span>;
<span class="hljs-keyword">import</span> react, { reactCompilerPreset } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;@vitejs/plugin-react&#x27;</span>;
<span class="hljs-keyword">import</span> babel <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;@rolldown/plugin-babel&#x27;</span>;

<span class="hljs-keyword">export</span> <span class="hljs-keyword">default</span> <span class="hljs-title function_">defineConfig</span>({
  <span class="hljs-attr">plugins</span>: [<span class="hljs-title function_">react</span>(), <span class="hljs-title function_">babel</span>({ <span class="hljs-attr">presets</span>: [<span class="hljs-title function_">reactCompilerPreset</span>()] })],
});
</code></pre></div>
<p>6.0 之前的版本写成 <code>react({ babel: { plugins: [&#x27;babel-plugin-react-compiler&#x27;] } })</code>。如果你用自定义 Babel 配置，编译器插件必须排在第一个，因为它要分析还没被其他插件改写过的源码。</p>
<h2>怎么确认它生效了</h2>
<p>最直观的是看 React DevTools，被编译的组件名旁边会显示 “Memo ✨” 标记。也可以看构建产物，里面会出现从 <code>react/compiler-runtime</code> 导入的缓存函数。</p>
<p>如果某个组件编译后行为不对，可以在函数体第一行写 <code>&quot;use no memo&quot;</code>，让编译器临时跳过它。等找到并修好根本原因，再把这行删掉。</p>
<h2>老项目怎么迁移</h2>
<p>建议一步一步来：先打开 lint 规则，把违反 React 规则的代码修掉；然后可以按目录逐步启用编译。原来手写的 <code>useMemo</code>、<code>useCallback</code> 不用一次删光，编译器能和它们共存，确认组件已经被编译、行为没变以后再清理。</p>
<h2>常见追问</h2>
<p><strong>编译器会改变程序的行为吗？</strong></p>
<blockquote>
<p>对遵守规则的代码不会，它只是多加了缓存。如果代码依赖“每次渲染都要重新执行一遍”来产生副作用，编译后可能表现不同，但这种代码本身就违反了规则。</p>
</blockquote>
<p><strong>有了编译器还要学 <code>memo</code> 吗？</strong></p>
<blockquote>
<p>要。面试和读老代码都会遇到，而且理解 <code>memo</code> 才知道编译器在替你做什么。对比见<a href="/questions/react-memo/">《memo、useMemo、useCallback 各自优化什么？》</a>。</p>
</blockquote>`};export{e as default};