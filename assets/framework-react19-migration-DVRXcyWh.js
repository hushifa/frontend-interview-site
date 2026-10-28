var e={answerHtml:`<h2>简答</h2>
<ul>
<li>先升级到 React 18.3：它和 18.2 行为相同，但会对 19 中移除的 API 给出警告，便于提前修复。</li>
<li>再升级 <code>react</code>、<code>react-dom</code> 以及 <code>@types/react</code>、<code>@types/react-dom</code> 到 19，运行官方 codemod 处理机械性改动。</li>
<li>主要移除项：<code>ReactDOM.render</code> / <code>hydrate</code>、函数组件的 <code>propTypes</code> 和 <code>defaultProps</code>、string ref、legacy context（<code>contextTypes</code>）、<code>react-dom/test-utils</code>。</li>
<li>新能力：ref 可以作为普通 prop 传给函数组件，<code>forwardRef</code> 不再必需；<code>&lt;Context value&gt;</code> 可以直接作为 Provider；ref 回调可以返回清理函数。</li>
<li>使用 Server Components 的项目，<code>react-server-dom-*</code> 要升级到已修复 CVE-2025-55182 的最新补丁版本；纯客户端应用不受这个漏洞影响。</li>
</ul>
<h2>分步流程</h2>
<ol>
<li>
<p>升级到 <code>react@18.3</code>，在开发环境运行并修复所有弃用警告。</p>
</li>
<li>
<p>检查依赖：组件库、表单库、路由库、测试库是否已声明支持 React 19。</p>
</li>
<li>
<p>升级到 19，运行 codemod：</p>
<div class="not-prose code-block"><div class="code-language">bash</div><pre><code class="hljs language-bash">npx codemod@latest react/19/migration-recipe
npx types-react-codemod@latest preset-19 ./src
</code></pre></div>
</li>
<li>
<p>运行单元测试、端到端测试，检查 SSR 页面的 hydration 警告。</p>
</li>
<li>
<p>手动检查关键交互：表单提交、弹窗、焦点管理。</p>
</li>
</ol>
<h2>常见改动</h2>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-comment">// 旧</span>
<span class="hljs-title class_">ReactDOM</span>.<span class="hljs-title function_">render</span>(<span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">App</span> /&gt;</span></span>, container);
<span class="hljs-comment">// 新</span>
<span class="hljs-keyword">import</span> { createRoot } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;react-dom/client&#x27;</span>;
<span class="hljs-title function_">createRoot</span>(container).<span class="hljs-title function_">render</span>(<span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">App</span> /&gt;</span></span>);
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-comment">// 旧：函数组件 defaultProps 在 19 中失效</span>
<span class="hljs-keyword">function</span> <span class="hljs-title function_">Button</span>(<span class="hljs-params">{ size }</span>) {}
<span class="hljs-title class_">Button</span>.<span class="hljs-property">defaultProps</span> = { <span class="hljs-attr">size</span>: <span class="hljs-string">&#x27;md&#x27;</span> };
<span class="hljs-comment">// 新：使用参数默认值</span>
<span class="hljs-keyword">function</span> <span class="hljs-title function_">Button</span>(<span class="hljs-params">{ size = <span class="hljs-string">&#x27;md&#x27;</span> }</span>) {}
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-comment">// 旧</span>
<span class="hljs-keyword">const</span> <span class="hljs-title class_">Input</span> = <span class="hljs-title function_">forwardRef</span>(<span class="hljs-function">(<span class="hljs-params">props, ref</span>) =&gt;</span> <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">input</span> <span class="hljs-attr">ref</span>=<span class="hljs-string">{ref}</span> {<span class="hljs-attr">...props</span>} /&gt;</span></span>);
<span class="hljs-comment">// 新</span>
<span class="hljs-keyword">function</span> <span class="hljs-title function_">Input</span>(<span class="hljs-params">{ ref, ...props }</span>) {
  <span class="hljs-keyword">return</span> <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">input</span> <span class="hljs-attr">ref</span>=<span class="hljs-string">{ref}</span> {<span class="hljs-attr">...props</span>} /&gt;</span></span>;
}
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// 旧</span>
<span class="hljs-keyword">import</span> { act } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;react-dom/test-utils&#x27;</span>;
<span class="hljs-comment">// 新</span>
<span class="hljs-keyword">import</span> { act } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;react&#x27;</span>;
</code></pre></div>
<h2>容易忽略的变化</h2>
<ul>
<li>ref 回调写成箭头函数隐式返回时，返回值会被当作清理函数。<code>ref={(el) =&gt; (this.el = el)}</code> 在 TypeScript 中会报错，改成带花括号的函数体。</li>
<li><code>useRef</code> 在 TypeScript 中必须传入初始值，<code>useRef&lt;T&gt;()</code> 改为 <code>useRef&lt;T&gt;(null)</code>。</li>
<li>渲染期间的错误不再重复抛出，而是通过 <code>createRoot</code> 的 <code>onUncaughtError</code>、<code>onCaughtError</code> 上报，错误监控代码可能需要调整。</li>
<li>canary 时期的 <code>useFormState</code> 改名为 <code>useActionState</code>。</li>
<li>JSX 中的 <code>element.ref</code> 访问已弃用，改为 <code>element.props.ref</code>。</li>
</ul>
<h2>安全补丁</h2>
<p>2025 年 12 月披露的 CVE-2025-55182 影响 <code>react-server-dom-webpack</code>、<code>react-server-dom-parcel</code>、<code>react-server-dom-turbopack</code> 的 19.0.0、19.1.0、19.1.1、19.2.0，可导致未授权远程代码执行，首批修复版本是 19.0.1、19.1.2、19.2.1。之后还有相关的后续公告，官方建议升级到这些包的最新版本。使用 Next.js 等框架时，按框架的安全公告升级。</p>
<h2>常见追问</h2>
<ul>
<li>不升级 Server Components 能用 19 吗？可以，客户端应用只升级 <code>react</code> 和 <code>react-dom</code> 即可。</li>
<li>升级后可以马上用 React Compiler 吗？可以单独评估，它也支持 React 17、18，见《React Compiler 解决了哪些优化问题？》。</li>
</ul>`};export{e as default};