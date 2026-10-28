var e={answerHtml:`<h2>简答</h2>
<ul>
<li><code>entry</code> 是依赖图的起点，webpack 从这里递归分析所有 <code>import</code>/<code>require</code>。</li>
<li><code>output</code> 决定产物写到哪里、叫什么名字，以及浏览器从哪个路径加载（<code>publicPath</code>）。</li>
<li>loader 把非 JS 文件（CSS、图片、TypeScript）转换成 webpack 能处理的模块，一次处理一个文件。</li>
<li>plugin 通过钩子介入整个构建生命周期，可以生成 HTML、提取 CSS、注入变量、分析产物。</li>
<li><code>use</code> 数组里的 loader 从右往左（从下往上）执行。</li>
</ul>
<h2>一个完整配置</h2>
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
<h2>各部分的分工</h2>
<p><strong>entry</strong>：可以有多个入口，每个入口生成独立的 chunk。</p>
<p><strong>output</strong>：<code>[contenthash]</code> 让文件名随内容变化，配合长期缓存；<code>publicPath</code> 决定运行时加载异步块和资源的 URL 前缀，部署到子目录时必须改成对应路径，否则会 404。</p>
<p><strong>loader</strong>：<code>css-loader</code> 把 CSS 中的 <code>@import</code> 和 <code>url()</code> 解析成依赖，<code>MiniCssExtractPlugin.loader</code> 再把结果提取成独立的 CSS 文件。顺序反过来就会出错。webpack 5 内置的资源模块（<code>asset/resource</code>、<code>asset/source</code>、<code>asset/inline</code>）取代了以前的 <code>file-loader</code>、<code>raw-loader</code>、<code>url-loader</code>。</p>
<p><strong>plugin</strong>：<code>HtmlWebpackPlugin</code> 在构建结束时生成 HTML 并插入带哈希的脚本标签。plugin 能做 loader 做不到的事，因为它面向整个编译过程，而不是单个文件。</p>
<h2>mode 的作用</h2>
<p><code>mode: &#x27;production&#x27;</code> 会开启压缩、tree shaking、作用域提升，并把 <code>process.env.NODE_ENV</code> 设为 <code>&#x27;production&#x27;</code>；<code>&#x27;development&#x27;</code> 保留可读代码，构建更快。</p>
<h2>排错方法</h2>
<ul>
<li>用 <code>--stats verbose</code> 或输出 stats JSON 查看每个模块被哪个 loader 处理、进入了哪个 chunk。</li>
<li>报 &quot;You may need an appropriate loader&quot; 时，说明某类文件没有匹配到任何规则，检查 <code>test</code> 和 <code>include</code>。</li>
<li>开发服务器能用、部署后资源 404，多半是 <code>publicPath</code> 和实际部署路径不一致。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li>loader 和 plugin 的根本区别？loader 是&quot;文件进、模块出&quot;的转换函数；plugin 是订阅编译事件的对象，可以访问和修改整个编译结果。</li>
<li>现在还需要学 webpack 吗？很多存量项目和企业内部工具链仍在使用，理解它的模型也有助于理解 Vite、Rspack 等工具。</li>
</ul>`};export{e as default};