var e={answerHtml:`<h2>简答</h2>
<ul>
<li>React Compiler 是构建期的 Babel 插件（<code>babel-plugin-react-compiler</code>），1.0 已稳定发布，自动完成过去手写的 <code>memo</code>、<code>useMemo</code>、<code>useCallback</code>。</li>
<li>它只编译遵守 React 规则的代码：渲染是纯函数、不修改 props 和 state、Hook 在顶层调用。违反规则的组件会被跳过，不会报错。</li>
<li>主要面向 React 19，也支持 React 17、18，后者需要额外安装 <code>react-compiler-runtime</code> 并配置 <code>target</code>。</li>
<li>配套的 lint 规则在 <code>eslint-plugin-react-hooks</code> 的推荐预设中，可以提前发现会被编译器跳过的代码。</li>
<li>它减少的是重复渲染和重复计算；DOM 数量太多、接口慢、包体积大，仍要靠虚拟列表、数据加载策略和代码拆分。</li>
</ul>
<h2>在 Vite 中接入</h2>
<p><code>@vitejs/plugin-react</code> 6.0 起移除了内联的 <code>babel</code> 选项，改为配合 <code>@rolldown/plugin-babel</code> 使用预设：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// vite.config.js</span>
<span class="hljs-keyword">import</span> { defineConfig } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;vite&#x27;</span>;
<span class="hljs-keyword">import</span> react, { reactCompilerPreset } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;@vitejs/plugin-react&#x27;</span>;
<span class="hljs-keyword">import</span> babel <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;@rolldown/plugin-babel&#x27;</span>;

<span class="hljs-keyword">export</span> <span class="hljs-keyword">default</span> <span class="hljs-title function_">defineConfig</span>({
  <span class="hljs-attr">plugins</span>: [<span class="hljs-title function_">react</span>(), <span class="hljs-title function_">babel</span>({ <span class="hljs-attr">presets</span>: [<span class="hljs-title function_">reactCompilerPreset</span>()] })],
});
</code></pre></div>
<p>6.0 之前的版本写成 <code>react({ babel: { plugins: [&#x27;babel-plugin-react-compiler&#x27;] } })</code>。使用自定义 Babel 配置时，编译器插件必须排在第一个，因为它要分析未经其他插件改写的源码。</p>
<h2>编译器做了什么</h2>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">function</span> <span class="hljs-title function_">CartSummary</span>(<span class="hljs-params">{ items, currency }</span>) {
  <span class="hljs-keyword">const</span> total = items.<span class="hljs-title function_">reduce</span>(<span class="hljs-function">(<span class="hljs-params">sum, item</span>) =&gt;</span> sum + item.<span class="hljs-property">price</span> * item.<span class="hljs-property">count</span>, <span class="hljs-number">0</span>);
  <span class="hljs-keyword">const</span> formatted = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">NumberFormat</span>(<span class="hljs-string">&#x27;zh-CN&#x27;</span>, { <span class="hljs-attr">style</span>: <span class="hljs-string">&#x27;currency&#x27;</span>, currency }).<span class="hljs-title function_">format</span>(total);
  <span class="hljs-keyword">return</span> <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">Price</span> <span class="hljs-attr">value</span>=<span class="hljs-string">{formatted}</span> <span class="hljs-attr">onCopy</span>=<span class="hljs-string">{()</span> =&gt;</span> navigator.clipboard.writeText(formatted)} /&gt;</span>;
}
</code></pre></div>
<p>编译后，<code>total</code>、<code>formatted</code>、传给 <code>Price</code> 的回调和 JSX 都按依赖（<code>items</code>、<code>currency</code>）缓存。<code>items</code> 和 <code>currency</code> 不变时，即使父组件重新渲染，<code>Price</code> 也收到相同的 props 并被跳过。手写的话需要两个 <code>useMemo</code>、一个 <code>useCallback</code>，再给 <code>Price</code> 套 <code>memo</code>。</p>
<h2>验证是否生效</h2>
<ul>
<li>React DevTools 中被编译的组件名旁会显示 &quot;Memo ✨&quot; 标记。</li>
<li>构建产物里会出现从 <code>react/compiler-runtime</code> 导入的缓存函数。</li>
<li>某个组件编译后行为异常，可以在函数体第一行写 <code>&quot;use no memo&quot;</code> 临时跳过，修好根本问题后删掉。</li>
</ul>
<h2>迁移已有项目</h2>
<ol>
<li>先启用 lint 规则，修复违反 React 规则的代码。</li>
<li>可以按目录逐步启用编译。</li>
<li>手写的 <code>useMemo</code>、<code>useCallback</code> 不必一次删光，编译器能和它们共存；确认组件已被编译、行为不变后再清理。</li>
</ol>
<h2>常见追问</h2>
<ul>
<li>编译器会改变程序行为吗？对遵守规则的代码不会，它只增加缓存。依赖&quot;每次渲染都重新执行&quot;这类副作用的代码可能表现不同，这类代码本身就违反了规则。</li>
<li>和 <code>memo</code> 的对比见<a href="/questions/react-memo/">《memo、useMemo、useCallback 各自优化什么？》</a>。</li>
</ul>`};export{e as default};