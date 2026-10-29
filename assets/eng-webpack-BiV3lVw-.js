var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>webpack 从 <code>entry</code> 指定的文件出发，顺着 <code>import</code> 和 <code>require</code> 一层层找下去，把用到的模块都找出来，这叫依赖图。<code>output</code> 决定打包结果写到哪里、叫什么名字，以及浏览器从哪个路径加载，也就是 <code>publicPath</code>。</p>
<p>loader 负责把 CSS、图片、TypeScript 这类非 JS 文件转换成 webpack 能处理的模块，一次处理一个文件。plugin 则通过钩子介入整个构建过程，能生成 HTML、提取 CSS、注入变量、分析产物。</p>
<p>所以两者的区别是，loader 面向单个文件，plugin 面向整个构建。</p>
<p>要注意，<code>use</code> 数组里的 loader 是从右往左执行的，写反了就会出错。</p>
</blockquote>
<h2>先看一个完整配置</h2>
<p>下面的配置处理 JS、CSS、文本和图片，并生成 HTML。后面逐个看每部分在做什么。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// webpack.config.js</span>
<span class="hljs-keyword">const</span> path = <span class="hljs-built_in">require</span>(<span class="hljs-string">&#x27;node:path&#x27;</span>);
<span class="hljs-keyword">const</span> <span class="hljs-title class_">HtmlWebpackPlugin</span> = <span class="hljs-built_in">require</span>(<span class="hljs-string">&#x27;html-webpack-plugin&#x27;</span>);
<span class="hljs-keyword">const</span> <span class="hljs-title class_">MiniCssExtractPlugin</span> = <span class="hljs-built_in">require</span>(<span class="hljs-string">&#x27;mini-css-extract-plugin&#x27;</span>);

<span class="hljs-variable language_">module</span>.<span class="hljs-property">exports</span> = <span class="hljs-function">(<span class="hljs-params">env, argv</span>) =&gt;</span> ({
  <span class="hljs-attr">mode</span>: argv.<span class="hljs-property">mode</span> ?? <span class="hljs-string">&#x27;development&#x27;</span>,
  <span class="hljs-attr">entry</span>: <span class="hljs-string">&#x27;./src/index.js&#x27;</span>,
  <span class="hljs-attr">output</span>: {
    <span class="hljs-attr">path</span>: path.<span class="hljs-title function_">resolve</span>(__dirname, <span class="hljs-string">&#x27;dist&#x27;</span>),
    <span class="hljs-attr">filename</span>: <span class="hljs-string">&#x27;[name].[contenthash].js&#x27;</span>,
    <span class="hljs-attr">publicPath</span>: <span class="hljs-string">&#x27;/&#x27;</span>,
    <span class="hljs-attr">clean</span>: <span class="hljs-literal">true</span>,
  },
  <span class="hljs-attr">module</span>: {
    <span class="hljs-attr">rules</span>: [
      { <span class="hljs-attr">test</span>: <span class="hljs-regexp">/\\.css$/</span>, <span class="hljs-attr">use</span>: [<span class="hljs-title class_">MiniCssExtractPlugin</span>.<span class="hljs-property">loader</span>, <span class="hljs-string">&#x27;css-loader&#x27;</span>] },
      { <span class="hljs-attr">test</span>: <span class="hljs-regexp">/\\.txt$/</span>, <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;asset/source&#x27;</span> },
      { <span class="hljs-attr">test</span>: <span class="hljs-regexp">/\\.png$/</span>, <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;asset/resource&#x27;</span> },
    ],
  },
  <span class="hljs-attr">plugins</span>: [
    <span class="hljs-keyword">new</span> <span class="hljs-title class_">HtmlWebpackPlugin</span>({ <span class="hljs-attr">template</span>: <span class="hljs-string">&#x27;./src/index.html&#x27;</span> }),
    <span class="hljs-keyword">new</span> <span class="hljs-title class_">MiniCssExtractPlugin</span>({ <span class="hljs-attr">filename</span>: <span class="hljs-string">&#x27;[name].[contenthash].css&#x27;</span> }),
  ],
});
</code></pre></div>
<h2>entry 和 output 管什么</h2>
<p><code>entry</code> 是起点。可以有多个入口，每个入口会生成独立的 chunk，chunk 就是打包出来的一块代码。</p>
<p><code>output</code> 里的 <code>[contenthash]</code> 会让文件名跟着内容变化。内容不变，文件名就不变，浏览器可以长期缓存。</p>
<p><code>publicPath</code> 决定运行时加载异步块和资源用的 URL 前缀。部署到子目录时，必须把它改成对应的路径，否则浏览器会去错误的地址请求，结果就是 404。</p>
<h2>loader 为什么要注意顺序</h2>
<p>看 CSS 那条规则：<code>use: [MiniCssExtractPlugin.loader, &#x27;css-loader&#x27;]</code>。loader 从右往左执行，所以先跑 <code>css-loader</code>，它把 CSS 里的 <code>@import</code> 和 <code>url()</code> 解析成依赖；然后 <code>MiniCssExtractPlugin.loader</code> 把结果提取成独立的 CSS 文件。</p>
<p>顺序反过来，提取的那一步拿到的就不是它能处理的东西，构建会出错。</p>
<p>另外，webpack 5 内置了资源模块，就是配置里的 <code>asset/resource</code>、<code>asset/source</code>、<code>asset/inline</code>，它们取代了以前的 <code>file-loader</code>、<code>raw-loader</code>、<code>url-loader</code>。</p>
<h2>plugin 能做什么 loader 做不到的事</h2>
<p><code>HtmlWebpackPlugin</code> 在构建结束时生成 HTML，并插入带哈希的脚本标签。这件事 loader 做不了，因为它要等所有文件名都确定以后才能做。</p>
<p>所以 plugin 能做 loader 做不到的事，原因在于它面向整个编译过程，而不是单个文件。</p>
<h2>mode 有什么作用</h2>
<p><code>mode: &#x27;production&#x27;</code> 会开启压缩、tree shaking、作用域提升，并把 <code>process.env.NODE_ENV</code> 设成 <code>&#x27;production&#x27;</code>。<code>&#x27;development&#x27;</code> 保留可读的代码，构建也更快。</p>
<h2>出问题时怎样排查</h2>
<p>用 <code>--stats verbose</code>，或者输出 stats JSON，可以看到每个模块被哪个 loader 处理、进了哪个 chunk。</p>
<p>如果报 “You may need an appropriate loader”，说明某类文件没有匹配到任何规则，去检查 <code>test</code> 和 <code>include</code>。</p>
<p>如果开发服务器正常、部署后资源 404，多半是 <code>publicPath</code> 和实际部署路径不一致。</p>
<h2>常见追问</h2>
<p><strong>loader 和 plugin 的根本区别是什么？</strong></p>
<blockquote>
<p>loader 是一个转换函数，进去一个文件，出来一个模块。plugin 是订阅编译事件的对象，可以访问和修改整个编译结果。</p>
</blockquote>
<p><strong>现在还需要学 webpack 吗？</strong></p>
<blockquote>
<p>需要。很多存量项目和企业内部工具链还在用它。而且理解了它的模型，再看 Vite、Rspack 这些工具也更容易。</p>
</blockquote>`};export{e as default};