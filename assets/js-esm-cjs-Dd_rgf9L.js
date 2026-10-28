var e={answerHtml:`<h2>简答</h2>
<ul>
<li>ESM 的 <code>import</code> 是静态声明，引擎在执行前构建依赖图并完成链接；CommonJS 的 <code>require</code> 是执行到那一行才调用的普通函数。</li>
<li>ESM 导入的是导出变量的实时只读绑定；<code>require</code> 返回 <code>module.exports</code> 对象，解构出来的是当时的值。</li>
<li>ESM 支持顶层 <code>await</code>，默认严格模式，没有 <code>require</code>、<code>__dirname</code>，用 <code>import.meta.dirname</code> 替代。</li>
<li>Node.js 中 <code>.mjs</code> 是 ESM、<code>.cjs</code> 是 CommonJS，<code>.js</code> 由最近的 <code>package.json</code> 的 <code>type</code> 决定。</li>
<li><code>require(esm)</code> 在 Node.js 22.12+、20.19+ 默认可用，模块图里有顶层 <code>await</code> 时抛 <code>ERR_REQUIRE_ASYNC_MODULE</code>。</li>
</ul>
<h2>实时绑定</h2>
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
<p>导入方不能给 <code>count</code> 赋值，会抛 <code>TypeError</code>。</p>
<h2>CommonJS 返回对象</h2>
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
<p>通过对象读取能看到变化，解构出来的变量不会变。所以&quot;CommonJS 是值拷贝、ESM 是引用&quot;只说对了一半。<code>exports</code> 只是 <code>module.exports</code> 的别名，写 <code>exports = {...}</code> 不会改变导出。</p>
<h2>对比</h2>
<table><thead><tr><th></th><th>ESM</th><th>CommonJS</th></tr></thead><tbody><tr><td>语法</td><td><code>import</code> / <code>export</code></td><td><code>require</code> / <code>module.exports</code></td></tr><tr><td>解析时机</td><td>执行前静态分析</td><td>运行时</td></tr><tr><td>条件加载</td><td><code>import()</code> 返回 Promise</td><td><code>require</code> 可放在 <code>if</code> 中</td></tr><tr><td>顶层 <code>await</code></td><td>支持</td><td>不支持</td></tr><tr><td>严格模式</td><td>默认</td><td>需要 <code>&#x27;use strict&#x27;</code></td></tr><tr><td>顶层 <code>this</code></td><td><code>undefined</code></td><td><code>module.exports</code></td></tr><tr><td>Tree shaking</td><td>便于静态分析</td><td>难以分析</td></tr></tbody></table>
<h2>互操作</h2>
<ul>
<li>ESM 导入 CommonJS：默认导入得到 <code>module.exports</code>，Node 会静态分析出部分命名导出。</li>
<li>CommonJS 加载 ESM：<code>await import(&#x27;./x.mjs&#x27;)</code> 始终可用；<code>require(&#x27;./x.mjs&#x27;)</code> 返回模块命名空间对象，默认导出在 <code>.default</code> 上。可用 <code>process.features.require_module</code> 检测是否支持。</li>
<li>ESM 中需要 <code>require</code> 时用 <code>createRequire(import.meta.url)</code>。</li>
<li>Node 原生 ESM 的相对导入必须写扩展名；浏览器中的裸包名需要 import map 或构建工具。</li>
</ul>
<h2>循环依赖</h2>
<p>两种格式都允许循环依赖，但都不保证对方已经执行完。ESM 中访问尚未初始化的 <code>let</code>/<code>const</code> 导出会抛 <code>ReferenceError</code>；CommonJS 会拿到对方尚未填充完的 <code>module.exports</code>。修复办法是把共享部分抽到第三个模块，或延迟到函数调用时再读取。</p>
<h2>常见追问</h2>
<ul>
<li>包同时支持两种格式怎样配置？用 <code>package.json</code> 的 <code>exports</code> 字段为 <code>import</code> 和 <code>require</code> 条件分别指定入口，见<a href="/questions/node-module-resolution/">《Node.js 的 package exports 会怎样影响模块解析？》</a>。</li>
<li>为什么打包工具偏好 ESM？导入导出在执行前就确定，可以分析出未使用的导出。</li>
</ul>`};export{e as default};