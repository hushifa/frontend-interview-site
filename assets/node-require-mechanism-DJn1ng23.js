var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>写 <code>require(&#x27;./a&#x27;)</code> 时，Node.js 做三件事：先把 <code>./a</code> 解析成一个绝对文件名，再用这个文件名去 <code>require.cache</code> 里查，查到了就直接返回上次的 <code>module.exports</code>；查不到才去读文件、执行代码。</p>
<p>执行之前，Node.js 会把模块代码包进一个函数，参数是 <code>exports</code>、<code>require</code>、<code>module</code>、<code>__filename</code>、<code>__dirname</code>。所以模块顶层的 <code>const</code>、<code>let</code> 只属于这个模块，不会变成全局变量，那几个看起来像全局的变量其实是函数参数。</p>
<p>缓存的好处是同一个文件只执行一次，多处 <code>require</code> 拿到的是同一个对象。这也是循环引用不会死循环的原因：模块先进缓存再执行，A 加载 B、B 又加载 A 时，B 拿到的是 A 还没执行完的那个 <code>exports</code>。</p>
<p>要注意两点。第一，缓存按解析后的文件名区分，从不同目录 <code>require(&#x27;foo&#x27;)</code> 可能解析到不同的 <code>node_modules</code>，拿到的就不是同一个对象。第二，循环引用里过早读取的属性可能还是 <code>undefined</code>，Node.js 文档说这种依赖要仔细规划。</p>
</blockquote>
<h2>require 怎样找到文件</h2>
<p><code>require</code> 的参数分三种情况。以 <code>/</code>、<code>./</code>、<code>../</code> 开头的是文件路径，相对路径按当前模块所在的目录来算。找不到精确的文件名时，Node.js 会依次补上 <code>.js</code>、<code>.json</code>、<code>.node</code> 再试；<code>.json</code> 当 JSON 解析，<code>.node</code> 当编译好的原生插件加载。其他扩展名（比如 <code>.cjs</code>）要写全。</p>
<p>不带路径前缀的，要么是内置模块，要么去 <code>node_modules</code> 里找。查找从当前模块所在目录开始，拼上 <code>/node_modules</code>，找不到就往上一级目录，一直找到文件系统根目录。比如 <code>/home/ry/projects/foo.js</code> 里写 <code>require(&#x27;bar.js&#x27;)</code>，会依次找 <code>/home/ry/projects/node_modules/bar.js</code>、<code>/home/ry/node_modules/bar.js</code>、<code>/home/node_modules/bar.js</code>、<code>/node_modules/bar.js</code>。</p>
<p>找到包以后，包里 <code>package.json</code> 的 <code>exports</code> 字段会决定实际加载哪个文件，这部分规则见<a href="/questions/node-module-resolution/">《Node.js 怎样解析一个包的导入路径？require(esm) 有什么限制？》</a>。全都找不到，<code>require</code> 会抛出 <code>MODULE_NOT_FOUND</code> 错误。</p>
<h2>模块代码为什么被包进一个函数</h2>
<p>Node.js 文档给出的包装器长这样：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js">(<span class="hljs-keyword">function</span> (<span class="hljs-params"><span class="hljs-built_in">exports</span>, <span class="hljs-built_in">require</span>, <span class="hljs-variable language_">module</span>, __filename, __dirname</span>) {
  <span class="hljs-comment">// 模块代码实际写在这里</span>
});
</code></pre></div>
<p>这样做有两个结果。模块顶层用 <code>var</code>、<code>const</code>、<code>let</code> 声明的变量，作用域是这个函数，而不是全局对象，所以两个模块各写一个 <code>const config</code> 不会冲突。另外，<code>module</code>、<code>exports</code>、<code>__filename</code>、<code>__dirname</code> 看起来像全局变量，其实是每个模块各自的一份函数参数。</p>
<p><code>exports</code> 是 <code>module.exports</code> 的一个引用，给 <code>exports</code> 整体赋新对象不会改变导出结果，这一点见<a href="/questions/js-esm-cjs/">《ES Modules 和 CommonJS 有哪些关键区别？》</a>。</p>
<h2>缓存是怎么工作的</h2>
<p>Node.js 文档说，模块第一次加载后就会被缓存，只要解析到同一个文件，每次 <code>require</code> 都返回同一个对象，模块代码也不会再执行一遍。想让一段代码执行多次，应该导出一个函数，调用它。</p>
<p>缓存的键是解析后的文件名，这带来两个边界。一是同名包不一定是同一个对象：从不同位置 <code>require(&#x27;foo&#x27;)</code>，可能解析到不同的 <code>node_modules/foo</code>，各有一份缓存。二是在大小写不敏感的文件系统上，<code>require(&#x27;./foo&#x27;)</code> 和 <code>require(&#x27;./FOO&#x27;)</code> 即使是同一个文件，也会被当成两个模块，返回两个不同的对象。</p>
<p>缓存对象就是 <code>require.cache</code>。删掉其中一个键，下次 <code>require</code> 会重新加载那个模块，原生插件除外，重新加载会报错。要注意，删掉缓存只影响之后的 <code>require</code>，已经拿到旧对象的地方不会自动更新。</p>
<h2>先进缓存再执行，循环引用就不会死循环</h2>
<p>下面用一个对象模拟文件，手写一个最小的 <code>myRequire</code>，按“查缓存 → 建 module → 先登记缓存 → 执行包装函数”的顺序加载。<code>a</code> 和 <code>b</code> 互相引用，和 Node.js 文档 Cycles 小节的例子结构一样。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> sources = {
  <span class="hljs-string">&#x27;./a&#x27;</span>: <span class="hljs-keyword">function</span> (<span class="hljs-params"><span class="hljs-built_in">exports</span>, <span class="hljs-built_in">require</span>, <span class="hljs-variable language_">module</span></span>) {
    <span class="hljs-built_in">exports</span>.<span class="hljs-property">done</span> = <span class="hljs-literal">false</span>;
    <span class="hljs-keyword">const</span> b = <span class="hljs-built_in">require</span>(<span class="hljs-string">&#x27;./b&#x27;</span>);
    log.<span class="hljs-title function_">push</span>(<span class="hljs-string">&#x27;a 里读到 b.done=&#x27;</span> + b.<span class="hljs-property">done</span>);
    <span class="hljs-built_in">exports</span>.<span class="hljs-property">done</span> = <span class="hljs-literal">true</span>;
  },
  <span class="hljs-string">&#x27;./b&#x27;</span>: <span class="hljs-keyword">function</span> (<span class="hljs-params"><span class="hljs-built_in">exports</span>, <span class="hljs-built_in">require</span>, <span class="hljs-variable language_">module</span></span>) {
    <span class="hljs-built_in">exports</span>.<span class="hljs-property">done</span> = <span class="hljs-literal">false</span>;
    <span class="hljs-keyword">const</span> a = <span class="hljs-built_in">require</span>(<span class="hljs-string">&#x27;./a&#x27;</span>);
    log.<span class="hljs-title function_">push</span>(<span class="hljs-string">&#x27;b 里读到 a.done=&#x27;</span> + a.<span class="hljs-property">done</span>);
    <span class="hljs-built_in">exports</span>.<span class="hljs-property">done</span> = <span class="hljs-literal">true</span>;
  },
};
<span class="hljs-keyword">const</span> cache = {};
<span class="hljs-keyword">const</span> log = [];

<span class="hljs-keyword">function</span> <span class="hljs-title function_">myRequire</span>(<span class="hljs-params">id</span>) {
  <span class="hljs-keyword">if</span> (cache[id]) <span class="hljs-keyword">return</span> cache[id].<span class="hljs-property">exports</span>;
  <span class="hljs-keyword">const</span> <span class="hljs-variable language_">module</span> = { <span class="hljs-attr">exports</span>: {}, <span class="hljs-attr">loaded</span>: <span class="hljs-literal">false</span> };
  cache[id] = <span class="hljs-variable language_">module</span>;
  sources[id](<span class="hljs-variable language_">module</span>.<span class="hljs-property">exports</span>, myRequire, <span class="hljs-variable language_">module</span>);
  <span class="hljs-variable language_">module</span>.<span class="hljs-property">loaded</span> = <span class="hljs-literal">true</span>;
  <span class="hljs-keyword">return</span> <span class="hljs-variable language_">module</span>.<span class="hljs-property">exports</span>;
}

<span class="hljs-keyword">const</span> a = <span class="hljs-title function_">myRequire</span>(<span class="hljs-string">&#x27;./a&#x27;</span>);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(log.<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;；&#x27;</span>)); <span class="hljs-comment">// b 里读到 a.done=false；a 里读到 b.done=true</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(a.<span class="hljs-property">done</span>); <span class="hljs-comment">// true</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">myRequire</span>(<span class="hljs-string">&#x27;./a&#x27;</span>) === a); <span class="hljs-comment">// true</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">Object</span>.<span class="hljs-title function_">keys</span>(cache).<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;,&#x27;</span>)); <span class="hljs-comment">// ./a,./b</span>
</code></pre></div>
<p>为什么 <code>b</code> 读到的 <code>a.done</code> 是 <code>false</code>？加载 <code>a</code> 时，<code>a</code> 的 <code>module</code> 先登记进了缓存，然后才开始执行。<code>a</code> 执行到 <code>require(&#x27;./b&#x27;)</code> 就停下来去加载 <code>b</code>，<code>b</code> 又 <code>require(&#x27;./a&#x27;)</code>，这时缓存里已经有 <code>a</code>，于是直接返回 <code>a</code> 的 <code>exports</code>。可是 <code>a</code> 只执行到一半，<code>done</code> 还是 <code>false</code>。</p>
<p><code>b</code> 执行完以后，控制权回到 <code>a</code>，<code>a</code> 读到的 <code>b.done</code> 已经是 <code>true</code>，最后 <code>a</code> 也把 <code>done</code> 改成 <code>true</code>。Node.js 文档里真实的 <code>a.js</code>、<code>b.js</code>、<code>main.js</code> 运行结果是同样的顺序：先打印 <code>in b, a.done = false</code>，再打印 <code>in a, b.done = true</code>。用 Node.js 22.23.3 实际运行，输出与文档一致。</p>
<p>如果把“登记缓存”放到执行之后，<code>b</code> 再 <code>require(&#x27;./a&#x27;)</code> 时缓存里没有 <code>a</code>，就会再执行一遍 <code>a</code>，<code>a</code> 又去加载 <code>b</code>，无限循环下去。文档说缓存“允许返回部分完成的对象”，指的就是这个顺序。</p>
<h2>循环引用里最容易出的错</h2>
<p>上面的例子里 <code>b</code> 只是打印了 <code>a.done</code>，读到 <code>false</code> 不会出错。真正出问题的是在模块顶层就调用对方的函数，比如 <code>b</code> 顶层写 <code>a.format()</code>，而 <code>a</code> 要到 <code>require(&#x27;./b&#x27;)</code> 之后才给 <code>exports.format</code> 赋值，这时 <code>a.format</code> 是 <code>undefined</code>，调用就会抛 <code>TypeError</code>。</p>
<p>另一个坑是 <code>module.exports = { ... }</code> 整体替换。<code>b</code> 在循环中拿到的是 <code>a</code> 原来那个 <code>exports</code> 对象，<code>a</code> 后来把 <code>module.exports</code> 换成了新对象，<code>b</code> 手里的引用不会跟着变，永远是那个半成品。</p>
<p>修复思路和 ESM 一样：把双方共用的部分抽到第三个模块，或者把读取推迟到函数调用时，详见<a href="/questions/js-esm-cjs/">《ES Modules 和 CommonJS 有哪些关键区别？》</a>。</p>
<h2>常见追问</h2>
<p><strong>怎样判断一个文件是被直接运行还是被 require 的？</strong></p>
<blockquote>
<p>直接用 <code>node foo.js</code> 运行时，<code>require.main</code> 就是这个文件的 <code>module</code>，所以可以判断 <code>require.main === module</code>。被别的模块 <code>require</code> 时，这个判断是 <code>false</code>。</p>
</blockquote>
<p><strong>删除 require.cache 能实现热更新吗？</strong></p>
<blockquote>
<p>能让下一次 <code>require</code> 重新执行文件，但之前已经拿到旧 <code>exports</code> 的模块还在用旧对象，旧模块里开的定时器、注册的监听也还在运行。原生插件不能这样重新加载，会报错。所以它只是让下一次加载重新执行，谈不上完整的热更新。</p>
</blockquote>
<p><strong>require 能加载 ES 模块吗？</strong></p>
<blockquote>
<p>Node.js 22.12、20.19 起去掉了 <code>--experimental-require-module</code> 标志，可以 <code>require()</code> 同步的 ES 模块；25.4 起文档把它标为不再是实验特性。模块里有顶层 <code>await</code> 时不能这样加载。两种模块格式怎样判定，见<a href="/questions/node-module-resolution/">《Node.js 怎样解析一个包的导入路径？require(esm) 有什么限制？》</a>。</p>
</blockquote>`};export{e as default};