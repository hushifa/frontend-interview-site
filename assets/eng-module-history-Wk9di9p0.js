var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>最早的页面里，一个功能写在 <code>a.js</code>，另一个写在 <code>b.js</code>，用几个 <code>&lt;script&gt;</code> 标签按顺序引入。所有顶层变量都挂在全局，两个文件都声明了 <code>utils</code> 就会互相覆盖，依赖顺序也只能靠人记。于是大家先用 IIFE，也就是立即执行的函数，把代码包起来，只往全局暴露一个命名空间对象。</p>
<p>后来出现了真正的模块规范。CommonJS 用 <code>require</code> 和 <code>module.exports</code>，<code>require</code> 是同步的，适合从本地磁盘读文件的 Node.js。浏览器要从网络下载文件，同步加载会卡住页面，所以有了 AMD，用 <code>define(依赖数组, 工厂函数)</code> 声明依赖、异步加载，代表实现是 RequireJS。</p>
<p>一个库想同时给这几种环境用，就套一层 UMD：先看有没有带 <code>amd</code> 标记的 <code>define</code>，有就按 AMD 注册；再看有没有 <code>module.exports</code>，有就按 CommonJS 导出；都没有就挂到全局对象上。</p>
<p>最后 ES2015 在语言层面定义了 ES Modules，用 <code>import</code> 和 <code>export</code> 静态声明依赖，浏览器用 <code>&lt;script type=&quot;module&quot;&gt;</code> 原生支持，Node.js 也支持，现在新代码一般都写 ESM。要注意 UMD 和 AMD 现在多见于老库和用 <code>&lt;script&gt;</code> 直接引入的场景。</p>
</blockquote>
<h2>没有模块时遇到了什么问题</h2>
<p>浏览器最初只有 <code>&lt;script&gt;</code> 标签。几个脚本的顶层变量共享同一个全局作用域，所以后加载的文件可以悄悄覆盖前面的同名变量。依赖关系也没有地方声明，<code>b.js</code> 用到了 <code>a.js</code> 里的函数，就只能保证 <code>a.js</code> 的标签写在前面。</p>
<p>IIFE 是第一步改进。它把整个文件包进一个函数并马上执行，函数里的变量就成了局部变量，只把需要公开的部分挂到一个全局对象上：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">var</span> <span class="hljs-title class_">MyApp</span> = <span class="hljs-title class_">MyApp</span> || {};
<span class="hljs-title class_">MyApp</span>.<span class="hljs-property">utils</span> = (<span class="hljs-keyword">function</span> (<span class="hljs-params"></span>) {
  <span class="hljs-keyword">var</span> cache = {}; <span class="hljs-comment">// 外面访问不到</span>
  <span class="hljs-keyword">return</span> {
    <span class="hljs-attr">get</span>: <span class="hljs-keyword">function</span> (<span class="hljs-params">key</span>) { <span class="hljs-keyword">return</span> cache[key]; },
  };
})();
</code></pre></div>
<p>这样全局只多了一个 <code>MyApp</code>，私有变量靠闭包藏了起来。可是它没有解决依赖管理，加载顺序还是靠人排。</p>
<h2>CommonJS 和 AMD 为什么会分成两套</h2>
<p>CommonJS 社区设计模块格式时，目标是浏览器之外的 JavaScript 环境。RequireJS 的《Why AMD?》里写到，CommonJS 没有完全照顾浏览器“天生异步”的特点，在浏览器里用要么靠服务端转换，要么用 XHR 下载文本再解析。</p>
<p>Node.js 采用了 CommonJS。Node.js 文档说明，每个模块在执行前会被包进一个函数 <code>(function(exports, require, module, __filename, __dirname) { ... })</code>，所以模块里的顶层变量是局部的，<code>require</code> 读到哪一行就同步加载哪个文件。读本地磁盘很快，同步没有问题。</p>
<p>浏览器端走了另一条路。AMD 要求先把依赖写成数组，加载器异步下载这些文件，全部就绪后再调用工厂函数：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-title function_">define</span>([<span class="hljs-string">&#x27;jquery&#x27;</span>, <span class="hljs-string">&#x27;./api&#x27;</span>], <span class="hljs-keyword">function</span> (<span class="hljs-params">$, api</span>) {
  <span class="hljs-keyword">return</span> { <span class="hljs-attr">render</span>: <span class="hljs-keyword">function</span> (<span class="hljs-params"></span>) { <span class="hljs-comment">/* ... */</span> } };
});
</code></pre></div>
<p>依赖提前声明，加载器就能并行下载、按依赖顺序执行，不会阻塞页面。代价是写法比 CommonJS 啰嗦。</p>
<h2>UMD 是怎样判断当前环境的</h2>
<p>UMD 不是新的模块系统，它是一段包装代码，让同一个文件在 AMD、CommonJS 和普通 <code>&lt;script&gt;</code> 里都能用。umdjs 仓库的 <code>returnExports.js</code> 模板按这个顺序判断：<code>typeof define === &#x27;function&#x27; &amp;&amp; define.amd</code> 成立就调用 <code>define</code>；否则 <code>typeof module === &#x27;object&#x27; &amp;&amp; module.exports</code> 成立就赋值给 <code>module.exports</code>；否则挂到 <code>root</code> 上，<code>root</code> 在浏览器里取 <code>self</code>，取不到再用 <code>this</code>。</p>
<p>下面把这段判断写成函数，传入不同的“环境”对象，看三条分支分别走到哪里：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// 把 UMD 的判断写成函数，传入不同的“环境”来模拟三种情况</span>
<span class="hljs-keyword">function</span> <span class="hljs-title function_">umd</span>(<span class="hljs-params">env, factory</span>) {
  <span class="hljs-keyword">if</span> (<span class="hljs-keyword">typeof</span> env.<span class="hljs-property">define</span> === <span class="hljs-string">&#x27;function&#x27;</span> &amp;&amp; env.<span class="hljs-property">define</span>.<span class="hljs-property">amd</span>) {
    env.<span class="hljs-title function_">define</span>([], factory);
    <span class="hljs-keyword">return</span> <span class="hljs-string">&#x27;AMD&#x27;</span>;
  } <span class="hljs-keyword">else</span> <span class="hljs-keyword">if</span> (<span class="hljs-keyword">typeof</span> env.<span class="hljs-property">module</span> === <span class="hljs-string">&#x27;object&#x27;</span> &amp;&amp; env.<span class="hljs-property">module</span>.<span class="hljs-property">exports</span>) {
    env.<span class="hljs-property">module</span>.<span class="hljs-property">exports</span> = <span class="hljs-title function_">factory</span>();
    <span class="hljs-keyword">return</span> <span class="hljs-string">&#x27;CommonJS&#x27;</span>;
  } <span class="hljs-keyword">else</span> {
    env.<span class="hljs-property">root</span>.<span class="hljs-property">myLib</span> = <span class="hljs-title function_">factory</span>();
    <span class="hljs-keyword">return</span> <span class="hljs-string">&#x27;全局变量&#x27;</span>;
  }
}

<span class="hljs-keyword">const</span> <span class="hljs-title function_">factory</span> = (<span class="hljs-params"></span>) =&gt; ({ <span class="hljs-attr">version</span>: <span class="hljs-string">&#x27;1.0.0&#x27;</span> });

<span class="hljs-comment">// 1. AMD 环境：存在带 amd 标记的 define</span>
<span class="hljs-keyword">const</span> registered = [];
<span class="hljs-keyword">const</span> <span class="hljs-title function_">define</span> = (<span class="hljs-params">deps, f</span>) =&gt; registered.<span class="hljs-title function_">push</span>(<span class="hljs-title function_">f</span>());
define.<span class="hljs-property">amd</span> = {};
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">umd</span>({ define }, factory), registered[<span class="hljs-number">0</span>].<span class="hljs-property">version</span>); <span class="hljs-comment">// AMD 1.0.0</span>

<span class="hljs-comment">// 2. CommonJS 环境：存在 module.exports</span>
<span class="hljs-keyword">const</span> fakeModule = { <span class="hljs-attr">exports</span>: {} };
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">umd</span>({ <span class="hljs-attr">module</span>: fakeModule }, factory), fakeModule.<span class="hljs-property">exports</span>.<span class="hljs-property">version</span>); <span class="hljs-comment">// CommonJS 1.0.0</span>

<span class="hljs-comment">// 3. 浏览器 script 标签：两者都没有，挂到全局对象上</span>
<span class="hljs-keyword">const</span> fakeWindow = {};
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">umd</span>({ <span class="hljs-attr">root</span>: fakeWindow }, factory), fakeWindow.<span class="hljs-property">myLib</span>.<span class="hljs-property">version</span>); <span class="hljs-comment">// 全局变量 1.0.0</span>
</code></pre></div>
<p>为什么不只判断 <code>define</code> 是不是函数？因为页面上别的脚本也可能定义一个叫 <code>define</code> 的全局函数，多检查一个 <code>define.amd</code> 标记，才能确认它真的是 AMD 加载器。还要注意，模板注释说明 CommonJS 分支依赖 <code>module.exports</code>，只适用于像 Node.js 这样支持它的环境，不适用于严格只有 <code>exports</code> 的 CommonJS 实现。</p>
<h2>ES Modules 解决了什么</h2>
<p>前面几种方案都是社区约定，靠函数调用在运行时拼出模块关系。ES Modules 是语言本身的语法，<code>import</code> 和 <code>export</code> 只能写在模块顶层，引擎在执行前就能分析出完整的依赖图。打包工具因此能做 Tree shaking，删掉没被用到的导出。</p>
<p>浏览器里用 <code>&lt;script type=&quot;module&quot;&gt;</code> 加载 ESM，Node.js 里用 <code>.mjs</code> 或 <code>package.json</code> 的 <code>&quot;type&quot;: &quot;module&quot;</code>。ESM 和 CommonJS 在加载时机、导出绑定上的具体区别，见<a href="/questions/js-esm-cjs/">《ES Modules 和 CommonJS 有哪些关键区别？》</a>。</p>
<h2>常见追问</h2>
<p><strong>现在还需要关心 AMD 和 UMD 吗？</strong></p>
<blockquote>
<p>写新代码一般不用。可是有些老库只发布了 UMD 包，或者需要通过 CDN 用 <code>&lt;script&gt;</code> 直接引入，这时会遇到。</p>
</blockquote>
<p><strong>IIFE 现在还有用吗？</strong></p>
<blockquote>
<p>有。不经过模块系统、直接用 <code>&lt;script&gt;</code> 引入的脚本，仍然可以用 IIFE 包住整段代码，避免变量泄漏到全局。</p>
</blockquote>`};export{e as default};