var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>最根本的区别是加载时机。ESM 的 <code>import</code> 是静态声明，代码还没运行，引擎就先把整个依赖关系理清楚、连接好。CommonJS 的 <code>require</code> 只是一个普通函数，执行到那一行才去加载。</p>
<p>拿到的东西也不同。ESM 导入的是对导出变量的只读引用，导出方改了值，导入方能马上看到，这叫实时绑定。<code>require</code> 返回的是 <code>module.exports</code> 这个对象，从里面解构出来的变量，只是当时的值。</p>
<p>ESM 还有几个特点：支持顶层 <code>await</code>，默认是严格模式，没有 <code>require</code> 和 <code>__dirname</code>，可以用 <code>import.meta.dirname</code> 代替。在 Node.js 里，<code>.mjs</code> 是 ESM，<code>.cjs</code> 是 CommonJS，<code>.js</code> 看最近的 <code>package.json</code> 里 <code>type</code> 字段怎么写。</p>
<p>两者可以互相加载。Node.js 22.12+ 和 20.19+ 默认允许 <code>require</code> 一个 ESM 模块，但如果它的依赖里有顶层 <code>await</code>，会抛 <code>ERR_REQUIRE_ASYNC_MODULE</code>。</p>
</blockquote>
<h2>什么是实时绑定</h2>
<p>下面两个文件，一个导出计数器，一个导入后调用 <code>increment</code>。注意第二次打印的 <code>count</code>。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// counter.mjs</span>
<span class="hljs-keyword">export</span> <span class="hljs-keyword">let</span> count = <span class="hljs-number">0</span>;
<span class="hljs-keyword">export</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">increment</span>(<span class="hljs-params"></span>) {
  count += <span class="hljs-number">1</span>;
}
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// main.mjs</span>
<span class="hljs-keyword">import</span> { count, increment } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;./counter.mjs&#x27;</span>;
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(count); <span class="hljs-comment">// 0</span>
<span class="hljs-title function_">increment</span>();
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(count); <span class="hljs-comment">// 1</span>
</code></pre></div>
<p><code>main.mjs</code> 里的 <code>count</code> 并没有被重新赋值，可它从 0 变成了 1。因为 ESM 导入的不是值的副本，而是指向 <code>counter.mjs</code> 里那个变量的引用，那边改了，这边读到的就是新值。</p>
<p>这个引用是只读的。导入方如果写 <code>count = 5</code>，会抛 <code>TypeError</code>，只有导出它的模块自己能改。</p>
<h2>CommonJS 拿到的是什么</h2>
<p>同样的计数器，用 CommonJS 写：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// counter.cjs</span>
<span class="hljs-built_in">exports</span>.<span class="hljs-property">count</span> = <span class="hljs-number">0</span>;
<span class="hljs-built_in">exports</span>.<span class="hljs-property">increment</span> = <span class="hljs-function">() =&gt;</span> {
  <span class="hljs-built_in">exports</span>.<span class="hljs-property">count</span> += <span class="hljs-number">1</span>;
};
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// main.cjs</span>
<span class="hljs-keyword">const</span> counter = <span class="hljs-built_in">require</span>(<span class="hljs-string">&#x27;./counter.cjs&#x27;</span>);
<span class="hljs-keyword">const</span> { count } = counter;
counter.<span class="hljs-title function_">increment</span>();
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(count); <span class="hljs-comment">// 0</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(counter.<span class="hljs-property">count</span>); <span class="hljs-comment">// 1</span>
</code></pre></div>
<p>调用 <code>increment</code> 以后，解构出来的 <code>count</code> 还是 0，<code>counter.count</code> 却是 1。</p>
<p><code>require</code> 返回的是 <code>module.exports</code> 这个对象。通过对象去读属性，读到的是最新的值；可解构的时候，<code>count</code> 已经被复制成了一个普通变量，之后对象上的属性怎么变，它都不会跟着变。所以常说的“CommonJS 是值拷贝、ESM 是引用”只说对了一半，CommonJS 拿到的对象本身是共享的。</p>
<p>还有一点：<code>exports</code> 只是 <code>module.exports</code> 的一个别名。写 <code>exports = {...}</code> 只是让这个别名指向了新对象，真正导出的 <code>module.exports</code> 没变。</p>
<h2>两者的区别汇总</h2>
<table><thead><tr><th></th><th>ESM</th><th>CommonJS</th></tr></thead><tbody><tr><td>语法</td><td><code>import</code> / <code>export</code></td><td><code>require</code> / <code>module.exports</code></td></tr><tr><td>解析时机</td><td>执行前静态分析</td><td>运行时</td></tr><tr><td>条件加载</td><td><code>import()</code> 返回 Promise</td><td><code>require</code> 可放在 <code>if</code> 中</td></tr><tr><td>顶层 <code>await</code></td><td>支持</td><td>不支持</td></tr><tr><td>严格模式</td><td>默认</td><td>需要 <code>&#x27;use strict&#x27;</code></td></tr><tr><td>顶层 <code>this</code></td><td><code>undefined</code></td><td><code>module.exports</code></td></tr><tr><td>Tree shaking</td><td>便于静态分析</td><td>难以分析</td></tr></tbody></table>
<p>ESM 的 <code>import</code> 不能写在 <code>if</code> 里，需要按条件加载时，用 <code>import()</code> 函数，它返回一个 Promise。</p>
<h2>两种模块怎样互相加载</h2>
<p>ESM 导入 CommonJS 时，默认导入拿到的就是 <code>module.exports</code>，Node.js 还会静态分析出一部分命名导出，让你能写 <code>import { x } from</code>。</p>
<p>CommonJS 加载 ESM 有两种方法。<code>await import(&#x27;./x.mjs&#x27;)</code> 一直都能用。新版本里也可以直接 <code>require(&#x27;./x.mjs&#x27;)</code>，返回的是模块命名空间对象，默认导出在它的 <code>.default</code> 属性上。想知道当前环境支不支持，可以检查 <code>process.features.require_module</code>。</p>
<p>反过来，ESM 里需要用 <code>require</code> 时，可以用 <code>createRequire(import.meta.url)</code> 造一个出来。</p>
<p>路径写法也有区别。Node.js 原生 ESM 的相对导入必须写扩展名，比如 <code>./counter.mjs</code>。浏览器里直接写包名 <code>import &#x27;lodash&#x27;</code> 是不行的，需要 import map 或者构建工具来解析。</p>
<h2>循环依赖会怎样</h2>
<p>两个模块互相导入，叫循环依赖。两种格式都允许，但都不保证你用的时候对方已经执行完了。</p>
<p>在 ESM 里，访问对方还没初始化的 <code>let</code> 或 <code>const</code> 导出，会抛 <code>ReferenceError</code>。在 CommonJS 里，你会拿到对方一个还没填完的 <code>module.exports</code>，某些属性是 <code>undefined</code>。</p>
<p>修复办法是把两边共用的部分抽到第三个模块里，或者不要在模块顶层就读取，延迟到函数被调用时再去读。</p>
<h2>常见追问</h2>
<p><strong>一个包同时支持两种格式，怎样配置？</strong></p>
<blockquote>
<p>用 <code>package.json</code> 的 <code>exports</code> 字段，给 <code>import</code> 和 <code>require</code> 两种条件分别指定入口文件，详见<a href="/questions/node-module-resolution/">《Node.js 的 package exports 会怎样影响模块解析？》</a>。</p>
</blockquote>
<p><strong>为什么打包工具更喜欢 ESM？</strong></p>
<blockquote>
<p>因为 ESM 的导入导出在代码运行前就能确定，打包工具可以分析出哪些导出没人用，直接删掉，这就是 Tree shaking。CommonJS 的 <code>require</code> 可以写在任何地方、用任何变量，很难静态分析。</p>
</blockquote>`};export{e as default};