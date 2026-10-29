var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>我会分两步升。第一步先升到 React 18.3，它的行为和 18.2 一样，只是对 19 里要删掉的 API 多给了警告。把这些警告修完，再升 19 就不会一下子冒出一堆问题。</p>
<p>第二步把 <code>react</code>、<code>react-dom</code> 和对应的 <code>@types</code> 包升到 19，跑官方 codemod，机械性的改动交给工具。19 里删掉的主要有：<code>ReactDOM.render</code> 和 <code>hydrate</code>、所有组件的 <code>propTypes</code> 检查、函数组件的 <code>defaultProps</code>、string ref、legacy context，还有 <code>react-dom/test-utils</code>。</p>
<p>也有新东西可以用：ref 能直接当普通 prop 传给函数组件，<code>forwardRef</code> 不再必需；<code>&lt;Context value&gt;</code> 可以直接当 Provider；ref 回调可以返回清理函数。</p>
<p>还有一件不能漏的事：如果项目用了 Server Components，<code>react-server-dom-*</code> 要升到修复了 CVE-2025-55182 的最新补丁版本。纯客户端应用不受这个漏洞影响。</p>
</blockquote>
<h2>分几步走</h2>
<p>升级的顺序是这样的：</p>
<ol>
<li>
<p>升级到 <code>react@18.3</code>，在开发环境运行，修掉所有弃用警告。</p>
</li>
<li>
<p>检查依赖：组件库、表单库、路由库、测试库有没有声明支持 React 19。</p>
</li>
<li>
<p>升级到 19，运行 codemod：</p>
<div class="not-prose code-block"><div class="code-language">bash</div><pre><code class="hljs language-bash">npx codemod@latest react/19/migration-recipe
npx types-react-codemod@latest preset-19 ./src
</code></pre></div>
</li>
<li>
<p>跑单元测试和端到端测试，检查 SSR 页面有没有 hydration 警告。</p>
</li>
<li>
<p>手动过一遍关键交互：表单提交、弹窗、焦点管理。</p>
</li>
</ol>
<p>之所以先查依赖，是因为自己的代码可以改，第三方库不支持 19 的话只能等它升级，这一步决定了能不能升。</p>
<h2>代码里常见的几处改动</h2>
<p>最先碰到的通常是入口。<code>ReactDOM.render</code> 已经删掉了，要换成 <code>createRoot</code>：</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-comment">// 旧</span>
<span class="hljs-title class_">ReactDOM</span>.<span class="hljs-title function_">render</span>(<span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">App</span> /&gt;</span></span>, container);
<span class="hljs-comment">// 新</span>
<span class="hljs-keyword">import</span> { createRoot } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;react-dom/client&#x27;</span>;
<span class="hljs-title function_">createRoot</span>(container).<span class="hljs-title function_">render</span>(<span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">App</span> /&gt;</span></span>);
</code></pre></div>
<p>函数组件的 <code>defaultProps</code> 在 19 里不再生效，代码不会报错，只是默认值没了，所以容易漏。改成参数默认值：</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-comment">// 旧：函数组件 defaultProps 在 19 中失效</span>
<span class="hljs-keyword">function</span> <span class="hljs-title function_">Button</span>(<span class="hljs-params">{ size }</span>) {}
<span class="hljs-title class_">Button</span>.<span class="hljs-property">defaultProps</span> = { <span class="hljs-attr">size</span>: <span class="hljs-string">&#x27;md&#x27;</span> };
<span class="hljs-comment">// 新：使用参数默认值</span>
<span class="hljs-keyword">function</span> <span class="hljs-title function_">Button</span>(<span class="hljs-params">{ size = <span class="hljs-string">&#x27;md&#x27;</span> }</span>) {}
</code></pre></div>
<p>ref 现在可以直接作为 prop 收到，<code>forwardRef</code> 可以去掉：</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-comment">// 旧</span>
<span class="hljs-keyword">const</span> <span class="hljs-title class_">Input</span> = <span class="hljs-title function_">forwardRef</span>(<span class="hljs-function">(<span class="hljs-params">props, ref</span>) =&gt;</span> <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">input</span> <span class="hljs-attr">ref</span>=<span class="hljs-string">{ref}</span> {<span class="hljs-attr">...props</span>} /&gt;</span></span>);
<span class="hljs-comment">// 新</span>
<span class="hljs-keyword">function</span> <span class="hljs-title function_">Input</span>(<span class="hljs-params">{ ref, ...props }</span>) {
  <span class="hljs-keyword">return</span> <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">input</span> <span class="hljs-attr">ref</span>=<span class="hljs-string">{ref}</span> {<span class="hljs-attr">...props</span>} /&gt;</span></span>;
}
</code></pre></div>
<p>测试里的 <code>act</code> 改从 <code>react</code> 导入：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// 旧</span>
<span class="hljs-keyword">import</span> { act } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;react-dom/test-utils&#x27;</span>;
<span class="hljs-comment">// 新</span>
<span class="hljs-keyword">import</span> { act } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;react&#x27;</span>;
</code></pre></div>
<h2>哪些变化容易被忽略</h2>
<p>有一个坑跟 ref 回调有关。19 允许 ref 回调返回一个清理函数，所以箭头函数隐式返回的值会被当成清理函数。像 <code>ref={(el) =&gt; (this.el = el)}</code> 这种写法，返回的是赋值结果，TypeScript 会报错，要改成带花括号的函数体。</p>
<p>TypeScript 里 <code>useRef</code> 现在必须传初始值，<code>useRef&lt;T&gt;()</code> 要改成 <code>useRef&lt;T&gt;(null)</code>。</p>
<p>错误处理也变了。渲染时出的错不再重复抛出，而是通过 <code>createRoot</code> 的 <code>onUncaughtError</code>、<code>onCaughtError</code> 上报。如果错误监控是靠捕获重复抛出的错误来工作的，就要跟着调整。</p>
<p>另外还有两处改名或弃用：canary 时期的 <code>useFormState</code> 改名为 <code>useActionState</code>；在 JSX 元素上访问 <code>element.ref</code> 已经弃用，改成 <code>element.props.ref</code>。</p>
<h2>安全补丁为什么要单独查</h2>
<p>2025 年 12 月披露的 CVE-2025-55182 影响 <code>react-server-dom-webpack</code>、<code>react-server-dom-parcel</code>、<code>react-server-dom-turbopack</code> 的 19.0.0、19.1.0、19.1.1、19.2.0，可以导致未授权远程代码执行。首批修复版本是 19.0.1、19.1.2、19.2.1，之后还有相关的后续公告，官方建议升到这些包的最新版本。</p>
<p>这些包负责 Server Components 的传输，所以只有用了 Server Components 才受影响。用 Next.js 等框架时，按框架自己的安全公告升级。</p>
<h2>常见追问</h2>
<p><strong>不用 Server Components，能升 19 吗？</strong></p>
<blockquote>
<p>可以。纯客户端应用只升级 <code>react</code> 和 <code>react-dom</code> 就行，<code>react-server-dom-*</code> 那些包跟它没关系。</p>
</blockquote>
<p><strong>升级后可以马上用 React Compiler 吗？</strong></p>
<blockquote>
<p>可以单独评估，它不绑定 19，也支持 React 17 和 18，详见<a href="/questions/react-compiler/">《React Compiler 解决了哪些优化问题？》</a>。</p>
</blockquote>`};export{e as default};