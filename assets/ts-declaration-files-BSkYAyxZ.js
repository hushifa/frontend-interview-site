var e={answerHtml:`<h2>简答</h2>
<ul>
<li><code>.d.ts</code> 只包含类型声明（<code>declare function</code>、<code>interface</code>、<code>type</code> 等），不能写实现。</li>
<li>声明写错时，编译器会放过错误调用或拒绝正确调用，运行时才暴露问题；<code>skipLibCheck</code> 只跳过检查声明文件本身，不会修正它。</li>
<li>查找顺序：相对导入找同名 <code>.d.ts</code>；包看 <code>exports</code> 中的 <code>types</code> 条件，再看 <code>types</code> 字段；都没有时查 <code>@types/包名</code>。</li>
<li>没有 <code>import</code>/<code>export</code> 的 <code>.d.ts</code> 是全局声明文件；有的话是模块，需要用 <code>declare global</code> 扩展全局类型。</li>
<li><code>declare module &#x27;*.svg&#x27;</code> 只解释资源导入的类型，真正处理文件的是构建工具。</li>
</ul>
<h2>给 JS 模块写声明</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// format-count.js</span>
<span class="hljs-keyword">export</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">formatCount</span>(<span class="hljs-params">value</span>) {
  <span class="hljs-keyword">if</span> (!<span class="hljs-title class_">Number</span>.<span class="hljs-title function_">isSafeInteger</span>(value) || value &lt; <span class="hljs-number">0</span>) {
    <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">RangeError</span>(<span class="hljs-string">&#x27;数量必须是非负安全整数&#x27;</span>);
  }
  <span class="hljs-keyword">return</span> <span class="hljs-string">\`<span class="hljs-subst">\${value}</span> 项\`</span>;
}
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-comment">// format-count.d.ts</span>
<span class="hljs-comment">/** 将非负安全整数格式化为数量文案。 */</span>
<span class="hljs-keyword">export</span> <span class="hljs-keyword">declare</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">formatCount</span>(<span class="hljs-params"><span class="hljs-attr">value</span>: <span class="hljs-built_in">number</span></span>): <span class="hljs-built_in">string</span>;
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-comment">// consumer.ts</span>
<span class="hljs-keyword">import</span> { formatCount } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;./format-count.js&#x27;</span>;

<span class="hljs-keyword">const</span> label = <span class="hljs-title function_">formatCount</span>(<span class="hljs-number">3</span>); <span class="hljs-comment">// string</span>
<span class="hljs-comment">// @ts-expect-error 声明要求 number</span>
<span class="hljs-title function_">formatCount</span>(<span class="hljs-string">&#x27;3&#x27;</span>);
</code></pre></div>
<p><code>number</code> 类型不排除负数和小数，业务校验仍在 JS 实现中。JSDoc 注释会出现在编辑器提示里。</p>
<h2>全局与资源声明</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-comment">// env.d.ts，没有 import/export，属于全局</span>
<span class="hljs-keyword">declare</span> <span class="hljs-keyword">const</span> <span class="hljs-attr">APP_VERSION</span>: <span class="hljs-built_in">string</span>;

<span class="hljs-keyword">declare</span> <span class="hljs-variable language_">module</span> <span class="hljs-string">&#x27;*.svg&#x27;</span> {
  <span class="hljs-keyword">const</span> <span class="hljs-attr">url</span>: <span class="hljs-built_in">string</span>;
  <span class="hljs-keyword">export</span> <span class="hljs-keyword">default</span> url;
}
</code></pre></div>
<p><code>APP_VERSION</code> 需要构建工具（如 Vite 的 <code>define</code>）真正注入，否则运行时是 <code>ReferenceError</code>。</p>
<h2>生成声明</h2>
<ul>
<li>TS 源码开启 <code>declaration</code> 自动生成；只要声明不要 JS 时加 <code>emitDeclarationOnly</code>。</li>
<li>JS 项目可以用 <code>allowJs</code> + <code>checkJs</code> + <code>declaration</code> 从 JSDoc 生成。</li>
<li><code>isolatedDeclarations</code>（5.5）要求导出都有显式类型，使其他工具不做类型检查也能生成声明。</li>
<li>生成后检查一遍：是否暴露了内部类型，是否引用了只在本仓库存在的 <code>paths</code> 别名。</li>
</ul>
<h2>声明错误的常见原因</h2>
<ul>
<li>类型包版本与运行库版本不一致（<code>@types/x@2</code> 配 <code>x@3</code>）。</li>
<li>ESM/CommonJS 格式不一致，例如 CommonJS 包的声明写成 <code>export default</code>，见《TypeScript 库发布时怎样组织类型声明和入口？》。</li>
<li>声明使用了消费者没有安装的依赖类型。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li>第三方库类型有误怎么办？先确认版本匹配；临时在项目中用模块增补修正，并给类型包提交修复。</li>
<li><code>/// &lt;reference types=&quot;node&quot; /&gt;</code> 做什么？在声明文件中引入某个类型包的全局声明，应用代码中更推荐在 tsconfig 的 <code>types</code> 中配置。</li>
</ul>`};export{e as default};