var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p><code>.d.ts</code> 文件就是一份类型说明书。比如一个 JS 库导出了 <code>formatCount</code> 函数，<code>.d.ts</code> 里写一句 <code>export declare function formatCount(value: number): string</code>，编辑器就知道它要什么参数、返回什么。它只能写 <code>declare</code>、<code>interface</code>、<code>type</code> 这类声明，不能写实现，编译后也不生成代码。</p>
<p>它保证不了声明和真实代码一致。声明写错了，编译器会放过错误的调用，或者拒绝正确的调用，问题要到运行时才暴露。<code>skipLibCheck</code> 只是跳过检查声明文件本身，不会把写错的声明改对。</p>
<p>TypeScript 找声明的顺序是：相对路径导入就找同名 <code>.d.ts</code>；导入包时先看 <code>exports</code> 里的 <code>types</code> 条件，再看 <code>types</code> 字段；都没有就去找 <code>@types/包名</code>。</p>
<p>还要分清全局和模块。没有 <code>import</code>、<code>export</code> 的 <code>.d.ts</code> 是全局声明；有的话就是模块，想扩展全局要写 <code>declare global</code>。另外 <code>declare module &#x27;*.svg&#x27;</code> 只是告诉编译器导入 SVG 得到什么类型，真正处理文件的是构建工具。</p>
</blockquote>
<h2>给一个 JS 模块配说明书</h2>
<p>下面是一个普通的 JS 函数，旁边配一份 <code>.d.ts</code>，再看 TS 代码怎么用它。</p>
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
<p><code>consumer.ts</code> 导入的是 JS 文件，可编译器知道 <code>formatCount</code> 只接受 <code>number</code>，因为它读的是旁边那份同名的 <code>.d.ts</code>。传字符串会报错，返回值被当成 <code>string</code>。声明上方的 JSDoc 注释也会显示在编辑器的悬停提示里。</p>
<p>可是 <code>number</code> 这个类型并不排除负数和小数，<code>formatCount(-1)</code> 照样能通过检查。所以真正的业务校验还得留在 JS 实现里，声明只能描述到类型这一层。</p>
<h2>声明写了，运行时就一定有吗</h2>
<p>不一定。声明只是承诺，编译器信它，但不会去验证。看一个全局变量的例子：</p>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-comment">// env.d.ts，没有 import/export，属于全局</span>
<span class="hljs-keyword">declare</span> <span class="hljs-keyword">const</span> <span class="hljs-attr">APP_VERSION</span>: <span class="hljs-built_in">string</span>;

<span class="hljs-keyword">declare</span> <span class="hljs-variable language_">module</span> <span class="hljs-string">&#x27;*.svg&#x27;</span> {
  <span class="hljs-keyword">const</span> <span class="hljs-attr">url</span>: <span class="hljs-built_in">string</span>;
  <span class="hljs-keyword">export</span> <span class="hljs-keyword">default</span> url;
}
</code></pre></div>
<p>写了 <code>declare const APP_VERSION</code> 以后，代码里直接用 <code>APP_VERSION</code> 不会报错。可如果构建工具（比如 Vite 的 <code>define</code>）并没有把这个值注入进去，运行时就是 <code>ReferenceError</code>。<code>*.svg</code> 那段也一样，它只说明“导入 SVG 会得到一个字符串默认导出”，能不能真的导入，要看构建工具有没有配置处理 SVG。</p>
<h2>声明从哪里来</h2>
<p>用 TS 写的源码，打开 <code>declaration</code> 就能自动生成声明；只想要声明、不要 JS 输出时再加 <code>emitDeclarationOnly</code>。纯 JS 项目也可以生成，开启 <code>allowJs</code>、<code>checkJs</code> 和 <code>declaration</code>，TypeScript 会根据 JSDoc 推出类型。</p>
<p>TypeScript 5.5 加了 <code>isolatedDeclarations</code>。它要求导出的东西都写明类型，这样别的工具不用做完整的类型检查，也能逐个文件生成声明。</p>
<p>生成以后最好看一遍产物：有没有把内部类型暴露出去，有没有引用只在库自己的源码里才有的 <code>paths</code> 别名。别名在使用者那边是解析不到的。</p>
<h2>声明为什么会和实际对不上</h2>
<p>最常见的是版本不匹配，比如装了 <code>@types/x@2</code>，运行的却是 <code>x@3</code>，新版改过的 API 在类型里还是老样子。其次是模块格式不一致，比如 CommonJS 包的声明写成了 <code>export default</code>，使用者按默认导入写，运行时拿到的东西和类型说的不同，详见<a href="/questions/ts-library-publishing/">《TypeScript 库发布时怎样组织类型声明和入口？》</a>。还有一种是声明里用了别的包的类型，而使用者没装那个包。</p>
<h2>常见追问</h2>
<p><strong>第三方库的类型写错了怎么办？</strong></p>
<blockquote>
<p>先确认类型包和库的版本是不是对得上。确实是声明写错了，可以先在自己项目里用模块增补临时修正，同时给类型包提一个修复。</p>
</blockquote>
<p><strong><code>/// &lt;reference types=&quot;node&quot; /&gt;</code> 是做什么的？</strong></p>
<blockquote>
<p>它在声明文件里引入某个类型包的全局声明，比如 Node 的 <code>process</code>、<code>Buffer</code>。应用代码里更推荐在 tsconfig 的 <code>types</code> 里配置，集中管理。</p>
</blockquote>`};export{e as default};