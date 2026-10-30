var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>比如 <code>index.js</code> 引用了 <code>math.js</code> 和 <code>greet.js</code>，<code>greet.js</code> 又引用了 <code>math.js</code>。打包器要做的就是从 <code>index.js</code> 出发，把这些文件找全，合成一个浏览器能直接运行的文件。</p>
<p>第一步是建依赖图。读入口文件的源码，找出里面 <code>require</code> 了哪些路径，再对每个依赖做同样的事，直到没有新文件。webpack 文档把这个过程描述为：一个文件依赖另一个文件，就是一个依赖，从入口开始递归构建出依赖图。</p>
<p>第二步是生成运行时。每个模块的代码包进一个函数，参数是 <code>module</code>、<code>exports</code> 和 <code>require</code>，所有模块放进一个以模块 ID 为键的对象。再写一个 <code>__webpack_require__</code>：按 ID 找到函数、执行、缓存并返回 <code>module.exports</code>。webpack 文档也说，打包后源码里的 <code>import</code> 和 <code>require</code> 都变成了指向模块标识的 <code>__webpack_require__</code> 调用。</p>
<p>手写版只是演示原理。真实打包器用 AST 而不是正则找依赖，还要做路径解析、loader 转换、ES 模块、代码分割这些事。</p>
</blockquote>
<h2>先看一个能跑的打包器</h2>
<p>示例不读磁盘，用一个对象模拟三个文件的源码，依赖用正则从 <code>require(&#x27;...&#x27;)</code> 里提取。要看的是三件事：依赖图长什么样、生成的代码长什么样、执行结果对不对。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> files = {
  <span class="hljs-string">&#x27;./index.js&#x27;</span>: <span class="hljs-string">&quot;const { add } = require(&#x27;./math.js&#x27;);\\nconst { greet } = require(&#x27;./greet.js&#x27;);\\nmodule.exports = greet(&#x27;打包器&#x27;) + &#x27; &#x27; + add(1, 2);&quot;</span>,
  <span class="hljs-string">&#x27;./math.js&#x27;</span>: <span class="hljs-string">&#x27;exports.add = (a, b) =&gt; a + b;&#x27;</span>,
  <span class="hljs-string">&#x27;./greet.js&#x27;</span>: <span class="hljs-string">&quot;const { add } = require(&#x27;./math.js&#x27;);\\nexports.greet = (name) =&gt; name + add(0, 1);&quot;</span>,
};

<span class="hljs-keyword">function</span> <span class="hljs-title function_">parseDeps</span>(<span class="hljs-params">code</span>) {
  <span class="hljs-keyword">const</span> deps = [];
  <span class="hljs-keyword">const</span> pattern = <span class="hljs-regexp">/require\\(\\s*[&#x27;&quot;]([^&#x27;&quot;]+)[&#x27;&quot;]\\s*\\)/g</span>;
  <span class="hljs-keyword">let</span> match;
  <span class="hljs-keyword">while</span> ((match = pattern.<span class="hljs-title function_">exec</span>(code)) !== <span class="hljs-literal">null</span>) deps.<span class="hljs-title function_">push</span>(match[<span class="hljs-number">1</span>]);
  <span class="hljs-keyword">return</span> deps;
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">buildGraph</span>(<span class="hljs-params">entry</span>) {
  <span class="hljs-keyword">const</span> graph = {};
  <span class="hljs-keyword">const</span> queue = [entry];
  <span class="hljs-keyword">while</span> (queue.<span class="hljs-property">length</span> &gt; <span class="hljs-number">0</span>) {
    <span class="hljs-keyword">const</span> id = queue.<span class="hljs-title function_">shift</span>();
    <span class="hljs-keyword">if</span> (graph[id]) <span class="hljs-keyword">continue</span>;
    <span class="hljs-keyword">const</span> code = files[id];
    <span class="hljs-keyword">if</span> (code === <span class="hljs-literal">undefined</span>) <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">&#x27;找不到模块 &#x27;</span> + id);
    <span class="hljs-keyword">const</span> deps = <span class="hljs-title function_">parseDeps</span>(code);
    graph[id] = { code, deps };
    queue.<span class="hljs-title function_">push</span>(...deps);
  }
  <span class="hljs-keyword">return</span> graph;
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">bundle</span>(<span class="hljs-params">entry</span>) {
  <span class="hljs-keyword">const</span> graph = <span class="hljs-title function_">buildGraph</span>(entry);
  <span class="hljs-keyword">const</span> modules = <span class="hljs-title class_">Object</span>.<span class="hljs-title function_">keys</span>(graph)
    .<span class="hljs-title function_">map</span>(<span class="hljs-function">(<span class="hljs-params">id</span>) =&gt;</span> <span class="hljs-title class_">JSON</span>.<span class="hljs-title function_">stringify</span>(id) + <span class="hljs-string">&#x27;: function (module, exports, require) {\\n&#x27;</span> + graph[id].<span class="hljs-property">code</span> + <span class="hljs-string">&#x27;\\n}&#x27;</span>)
    .<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;,\\n&#x27;</span>);
  <span class="hljs-keyword">return</span> <span class="hljs-string">\`(function (modules) {
  const cache = {};
  function __webpack_require__(id) {
    if (cache[id]) return cache[id].exports;
    const module = (cache[id] = { exports: {} });
    modules[id](module, module.exports, __webpack_require__);
    return module.exports;
  }
  return __webpack_require__(<span class="hljs-subst">\${<span class="hljs-built_in">JSON</span>.stringify(entry)}</span>);
})({
<span class="hljs-subst">\${modules}</span>
})\`</span>;
}

<span class="hljs-keyword">const</span> graph = <span class="hljs-title function_">buildGraph</span>(<span class="hljs-string">&#x27;./index.js&#x27;</span>);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">Object</span>.<span class="hljs-title function_">keys</span>(graph).<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27; &#x27;</span>)); <span class="hljs-comment">// ./index.js ./math.js ./greet.js</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(graph[<span class="hljs-string">&#x27;./greet.js&#x27;</span>].<span class="hljs-property">deps</span>.<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27; &#x27;</span>)); <span class="hljs-comment">// ./math.js</span>
<span class="hljs-keyword">const</span> output = <span class="hljs-title function_">bundle</span>(<span class="hljs-string">&#x27;./index.js&#x27;</span>);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-keyword">new</span> <span class="hljs-title class_">Function</span>(<span class="hljs-string">&#x27;return &#x27;</span> + output)()); <span class="hljs-comment">// 打包器1 3</span>
</code></pre></div>
<p>依赖图里有三个模块，顺序是 <code>./index.js ./math.js ./greet.js</code>。<code>./math.js</code> 被引用了两次，可图里只出现一次，因为 <code>buildGraph</code> 遇到已经收集过的模块就跳过。这一步也防止了循环引用让收集过程死循环。</p>
<p>最后一行把生成的字符串当代码执行，得到 <code>打包器1 3</code>。<code>greet(&#x27;打包器&#x27;)</code> 返回 <code>打包器1</code>，<code>add(1, 2)</code> 返回 3，说明三个模块都被正确连起来了。</p>
<h2>生成的代码为什么要把模块包进函数</h2>
<p>如果把三个文件的代码直接拼在一起，<code>index.js</code> 和 <code>greet.js</code> 都声明了 <code>const { add }</code>，会报重复声明。包进函数以后，每个模块有自己的作用域，变量互不干扰，这和 CommonJS 在 Node.js 里给每个文件包一层函数是同一个思路。模块化的演变见<a href="/questions/eng-module-history/">《前端模块化经历了哪些阶段？IIFE、CommonJS、AMD、UMD 和 ES Modules 有什么区别？》</a>。</p>
<p>函数的三个参数 <code>module</code>、<code>exports</code>、<code>require</code> 由运行时传进去，所以模块里写的 <code>require(&#x27;./math.js&#x27;)</code> 实际调用的是 <code>__webpack_require__</code>，<code>exports.add = ...</code> 写进的是运行时准备好的对象。</p>
<h2><strong>webpack_require</strong> 做了什么</h2>
<p>它按模块 ID 去 <code>modules</code> 对象里找函数，先查缓存，有就直接返回 <code>exports</code>；没有就新建一个 <code>{ exports: {} }</code> 放进缓存，再执行模块函数，最后返回 <code>module.exports</code>。</p>
<p>缓存有两个作用。第一，<code>math.js</code> 被两个模块引用，只执行一次，两边拿到的是同一个导出对象。第二，先放缓存再执行，遇到循环引用时，后面的模块能拿到前面模块“执行到一半”的 <code>exports</code>，而不是无限递归。</p>
<p>webpack 的 Manifest 文档说，编译器会记录所有模块的信息，运行时靠这些数据按模块标识找到并加载模块；不管源码用的是哪种模块语法，<code>import</code> 和 <code>require</code> 都会变成指向模块标识的 <code>__webpack_require__</code> 调用。示例里以路径为键的 <code>modules</code> 对象，就相当于一个最简单的 manifest。</p>
<h2>真实打包器比这多做了什么</h2>
<p>正则提取依赖只适合演示。注释里、字符串里的 <code>require(...)</code> 也会被匹配，动态拼接的路径又匹配不到。真实打包器先把源码解析成 AST，再从语法树里找导入语句，做法见<a href="/questions/eng-ast/">《AST 在前端工程里有什么用？Babel、ESLint 和代码转换是怎样用它的？》</a>。</p>
<p>示例里的模块 ID 就是写死的路径，真实场景要把 <code>./math</code> 这样的相对路径按当前文件位置、扩展名、<code>node_modules</code> 规则解析成绝对路径，再作为 ID。非 JS 文件要先经过 loader 转成 JS，webpack 文档提到图片、字体这类资源也能作为依赖进入依赖图。整个流程的插件钩子见<a href="/questions/eng-webpack-tapable/">《webpack 的构建流程是怎样的？Tapable 钩子有哪些类型？》</a>。</p>
<h2>常见追问</h2>
<p><strong>依赖图和拓扑排序有什么关系？</strong></p>
<blockquote>
<p>依赖图是有向图，边从模块指向它依赖的模块。示例的运行时是在执行时按需递归调用，不需要事先排序；如果要提前算出“依赖先于使用者”的执行顺序，或者检测循环依赖，就要做拓扑排序，见<a href="/questions/alg-topological-sort/">《如何用拓扑排序解析前端任务和模块依赖？》</a>。</p>
</blockquote>
<p><strong>为什么示例用广度优先收集，而不是递归？</strong></p>
<blockquote>
<p>两种都可以，只要记录已访问的模块，避免重复和循环。用队列写不会因为依赖链很长而递归过深，收集出的顺序也直观，先是入口，再是入口的直接依赖。</p>
</blockquote>
<p><strong>ES 模块的 import 和 export 怎样处理？</strong></p>
<blockquote>
<p>一种做法是先用 Babel 把 ES 模块转成 CommonJS，再套用示例的运行时。webpack 在 Manifest 文档里说明，不管源码用哪种模块语法，最后都会变成 <code>__webpack_require__</code> 调用。</p>
</blockquote>`};export{e as default};