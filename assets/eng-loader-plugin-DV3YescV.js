var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>比如项目里 <code>import &#x27;./app.scss&#x27;</code>，webpack 自己只认识 JS，要靠 <code>sass-loader</code>、<code>css-loader</code>、<code>style-loader</code> 把它一步步转成 JS 模块。loader 就是一个函数，拿到一个文件的源码，返回转换后的结果，一次只管一个文件。plugin 是一个带 <code>apply</code> 方法的对象，webpack 启动时调用它，把 <code>compiler</code> 交给它，它在构建过程的各个钩子上挂回调。</p>
<p>两者分工不同。loader 只看得到单个模块的内容，适合做“把这种文件转成 JS”；plugin 能看到整个构建，生成 HTML、提取 CSS、往产物里加文件、统计体积，这些 loader 做不到的事都由 plugin 完成。</p>
<p>手写 loader，就是导出一个普通函数，用 <code>this.getOptions()</code> 读配置，同步时直接返回字符串，异步时调用 <code>this.async()</code> 拿到回调。手写 plugin，就是写一个类，在 <code>apply(compiler)</code> 里用 <code>compiler.hooks.某个钩子.tap()</code> 注册回调。</p>
<p>要注意两点。多个 loader 是从右往左（数组写成多行时是从下往上）执行的，写反了就会出错。loader 应该保持无状态，不要在模块作用域里存跨文件的数据，因为有缓存时这个 loader 不一定会再执行。</p>
</blockquote>
<h2>loader 和 plugin 在构建中处在什么位置</h2>
<p>webpack 从入口文件开始，遇到一个 <code>import</code> 就去读那个文件。读到文件以后，先按 <code>module.rules</code> 找出匹配的 loader，把内容交给它们转换，转换完的结果必须是 JS，webpack 才能继续分析里面的 <code>import</code>。所以 loader 工作在“单个模块被读进来”这一步。</p>
<p>plugin 不挂在某个文件上。webpack 本身就是用同一套插件系统搭起来的，从开始编译、构建模块、生成 chunk 到写出文件，每个阶段都暴露了钩子。plugin 在这些钩子上注册回调，所以能拿到所有模块、所有产物，做全局的事情。</p>
<p>webpack 文档说 plugin 用来做“loader 做不到的其他任何事”。比如 <code>HtmlWebpackPlugin</code> 要在所有 JS 文件名确定以后生成 HTML，并把带 hash 的文件名写进去，这件事只有在产物阶段才能做。</p>
<h2>多个 loader 按什么顺序执行</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-variable language_">module</span>.<span class="hljs-property">exports</span> = {
  <span class="hljs-attr">module</span>: {
    <span class="hljs-attr">rules</span>: [
      {
        <span class="hljs-attr">test</span>: <span class="hljs-regexp">/\\.scss$/</span>,
        <span class="hljs-attr">use</span>: [<span class="hljs-string">&#x27;style-loader&#x27;</span>, <span class="hljs-string">&#x27;css-loader&#x27;</span>, <span class="hljs-string">&#x27;sass-loader&#x27;</span>],
      },
    ],
  },
};
</code></pre></div>
<p>数组里写在最后的 <code>sass-loader</code> 最先执行，它拿到的是 <code>.scss</code> 原文件；<code>css-loader</code> 拿到 <code>sass-loader</code> 的输出；最前面的 <code>style-loader</code> 最后执行，必须返回 JS。可以用普通函数模拟一下这个顺序：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// 用普通函数模拟 use: [&#x27;style-loader&#x27;, &#x27;css-loader&#x27;, &#x27;sass-loader&#x27;] 的执行顺序</span>
<span class="hljs-keyword">const</span> use = [
  <span class="hljs-function">(<span class="hljs-params">source</span>) =&gt;</span> <span class="hljs-string">\`style(<span class="hljs-subst">\${source}</span>)\`</span>,
  <span class="hljs-function">(<span class="hljs-params">source</span>) =&gt;</span> <span class="hljs-string">\`css(<span class="hljs-subst">\${source}</span>)\`</span>,
  <span class="hljs-function">(<span class="hljs-params">source</span>) =&gt;</span> <span class="hljs-string">\`sass(<span class="hljs-subst">\${source}</span>)\`</span>,
];

<span class="hljs-keyword">const</span> result = use.<span class="hljs-title function_">reduceRight</span>(<span class="hljs-function">(<span class="hljs-params">source, loader</span>) =&gt;</span> <span class="hljs-title function_">loader</span>(source), <span class="hljs-string">&#x27;app.scss&#x27;</span>);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(result); <span class="hljs-comment">// style(css(sass(app.scss)))</span>
</code></pre></div>
<p>结果是一层套一层的函数调用，最里面的 <code>sass</code> 最先执行。为什么设计成从右往左？可以把它看成函数组合 <code>style(css(sass(file)))</code>，写法和数学里的复合函数一致。</p>
<p>另外 loader 还可以导出一个 <code>pitch</code> 方法。正式执行之前，webpack 会先从左往右调用每个 loader 的 <code>pitch</code>；如果某个 <code>pitch</code> 返回了结果，后面的 loader 就直接跳过，流程掉头往回走。<code>style-loader</code> 就用到了 <code>pitch</code>。</p>
<h2>手写一个 loader</h2>
<p>下面写一个给文件加注释头的 loader，前缀从配置里读。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// banner-loader.js</span>
<span class="hljs-keyword">const</span> schema = {
  <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;object&#x27;</span>,
  <span class="hljs-attr">properties</span>: {
    <span class="hljs-attr">banner</span>: { <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;string&#x27;</span> },
  },
};

<span class="hljs-variable language_">module</span>.<span class="hljs-property">exports</span> = <span class="hljs-keyword">function</span> <span class="hljs-title function_">bannerLoader</span>(<span class="hljs-params">source</span>) {
  <span class="hljs-comment">// webpack 5 起 getOptions 在 loader 上下文里，可以传 JSON Schema 校验配置</span>
  <span class="hljs-keyword">const</span> { banner = <span class="hljs-string">&#x27;&#x27;</span> } = <span class="hljs-variable language_">this</span>.<span class="hljs-title function_">getOptions</span>(schema);
  <span class="hljs-keyword">return</span> <span class="hljs-string">\`/* <span class="hljs-subst">\${banner}</span> */\\n<span class="hljs-subst">\${source}</span>\`</span>;
};
</code></pre></div>
<p>loader 里的 <code>this</code> 是 webpack 提供的 loader 上下文，不能写成箭头函数，否则拿不到 <code>this</code>。在 webpack 5 之前，读配置要用 <code>loader-utils</code> 的 <code>getOptions</code>，现在直接用 <code>this.getOptions</code>。</p>
<p>配置里用 <code>loader</code> 加 <code>options</code> 引用它，本地文件可以直接写路径：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js">{
  <span class="hljs-attr">test</span>: <span class="hljs-regexp">/\\.js$/</span>,
  <span class="hljs-attr">use</span>: [
    {
      <span class="hljs-attr">loader</span>: path.<span class="hljs-title function_">resolve</span>(__dirname, <span class="hljs-string">&#x27;banner-loader.js&#x27;</span>),
      <span class="hljs-attr">options</span>: { <span class="hljs-attr">banner</span>: <span class="hljs-string">&#x27;built by webpack&#x27;</span> },
    },
  ],
}
</code></pre></div>
<p>如果转换要读文件或请求网络，就用异步写法。<code>this.async()</code> 告诉 webpack 这个 loader 会稍后回调，它返回的就是 <code>this.callback</code>，参数依次是错误、内容、可选的 Source Map 和元数据：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-variable language_">module</span>.<span class="hljs-property">exports</span> = <span class="hljs-keyword">function</span> <span class="hljs-title function_">asyncLoader</span>(<span class="hljs-params">source, map, meta</span>) {
  <span class="hljs-keyword">const</span> callback = <span class="hljs-variable language_">this</span>.<span class="hljs-title function_">async</span>();
  <span class="hljs-title function_">someAsyncTransform</span>(source)
    .<span class="hljs-title function_">then</span>(<span class="hljs-function">(<span class="hljs-params">result</span>) =&gt;</span> <span class="hljs-title function_">callback</span>(<span class="hljs-literal">null</span>, result, map, meta))
    .<span class="hljs-title function_">catch</span>(<span class="hljs-function">(<span class="hljs-params">error</span>) =&gt;</span> <span class="hljs-title function_">callback</span>(error));
};
</code></pre></div>
<p>默认情况下 loader 拿到的是 UTF-8 字符串。处理图片、字体这类二进制文件时，导出 <code>module.exports.raw = true</code>，loader 就会收到 <code>Buffer</code>。</p>
<h2>手写 loader 要守的规矩</h2>
<p>webpack 文档给 loader 定了几条准则：每个 loader 只做一件事，靠串联组合完成复杂处理；输出要是正常的模块；不要保存状态。</p>
<p>为什么不能保存状态？因为 webpack 会缓存模块的构建结果，loader 默认就被标记为可缓存。如果你在模块作用域里用一个变量收集所有文件的信息，有缓存的那次构建里，没改动的文件根本不会再经过 loader，变量里的数据就不全了。确实要给 plugin 传数据，文档建议写到模块的 <code>buildInfo</code> 上，它会和模块一起被序列化进缓存。</p>
<h2>手写一个 plugin</h2>
<p>下面的 plugin 在产物里额外生成一个 <code>assets.md</code>，列出这次构建输出的所有文件。写法照 webpack 文档里的 <code>FileListPlugin</code>。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// file-list-plugin.js</span>
<span class="hljs-keyword">class</span> <span class="hljs-title class_">FileListPlugin</span> {
  <span class="hljs-title function_">constructor</span>(<span class="hljs-params">options = {}</span>) {
    <span class="hljs-variable language_">this</span>.<span class="hljs-property">outputFile</span> = options.<span class="hljs-property">outputFile</span> ?? <span class="hljs-string">&#x27;assets.md&#x27;</span>;
  }

  <span class="hljs-title function_">apply</span>(<span class="hljs-params">compiler</span>) {
    <span class="hljs-keyword">const</span> pluginName = <span class="hljs-title class_">FileListPlugin</span>.<span class="hljs-property">name</span>;
    <span class="hljs-comment">// 从 compiler 上取 webpack，保证和当前构建用的是同一个版本</span>
    <span class="hljs-keyword">const</span> { <span class="hljs-title class_">Compilation</span>, sources } = compiler.<span class="hljs-property">webpack</span>;

    compiler.<span class="hljs-property">hooks</span>.<span class="hljs-property">thisCompilation</span>.<span class="hljs-title function_">tap</span>(pluginName, <span class="hljs-function">(<span class="hljs-params">compilation</span>) =&gt;</span> {
      compilation.<span class="hljs-property">hooks</span>.<span class="hljs-property">processAssets</span>.<span class="hljs-title function_">tap</span>(
        {
          <span class="hljs-attr">name</span>: pluginName,
          <span class="hljs-comment">// 选靠后的阶段，确保其他插件已经把产物加进来了</span>
          <span class="hljs-attr">stage</span>: <span class="hljs-title class_">Compilation</span>.<span class="hljs-property">PROCESS_ASSETS_STAGE_SUMMARIZE</span>,
        },
        <span class="hljs-function">(<span class="hljs-params">assets</span>) =&gt;</span> {
          <span class="hljs-keyword">const</span> list = <span class="hljs-title class_">Object</span>.<span class="hljs-title function_">keys</span>(assets).<span class="hljs-title function_">map</span>(<span class="hljs-function">(<span class="hljs-params">name</span>) =&gt;</span> <span class="hljs-string">\`- <span class="hljs-subst">\${name}</span>\`</span>).<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;\\n&#x27;</span>);
          compilation.<span class="hljs-title function_">emitAsset</span>(<span class="hljs-variable language_">this</span>.<span class="hljs-property">outputFile</span>, <span class="hljs-keyword">new</span> sources.<span class="hljs-title class_">RawSource</span>(<span class="hljs-string">\`# 构建产物\\n\\n<span class="hljs-subst">\${list}</span>\`</span>));
        },
      );
    });
  }
}

<span class="hljs-variable language_">module</span>.<span class="hljs-property">exports</span> = <span class="hljs-title class_">FileListPlugin</span>;
</code></pre></div>
<p>使用时在 <code>plugins</code> 里放一个实例：<code>plugins: [new FileListPlugin()]</code>。plugin 可以接收参数，所以配置里要用 <code>new</code>。</p>
<p>这里出现了两个对象。<code>compiler</code> 代表整个 webpack 实例，从启动到结束只有一个，<code>run</code>、<code>emit</code>、<code>done</code> 这些钩子是它的。<code>compilation</code> 代表一次构建，watch 模式下每次重新构建都会创建一个新的 <code>compilation</code>，模块、chunk、产物相关的钩子在它上面。所以跨多次构建要保留的数据放在 compiler 上，只和这一次构建有关的放在 compilation 上。</p>
<p><code>tap</code> 是同步注册。钩子本身支持异步时，可以用 <code>tapAsync</code>，回调最后一个参数是 <code>callback</code>，做完要调用它；或者用 <code>tapPromise</code>，返回一个 Promise。<code>processAssets</code> 就是异步钩子，上面因为没有异步操作才用了 <code>tap</code>。</p>
<h2>常见追问</h2>
<p><strong>loader 和 plugin 能互相替代吗？</strong></p>
<blockquote>
<p>大多不能。loader 只能拿到单个文件的内容，不知道别的模块和最终产物，所以生成 HTML、合并统计这类事做不了。plugin 虽然也能在钩子里改模块源码，但“按文件类型转换”这件事交给 loader 更简单，也能和别的 loader 串起来复用。有些工具会同时提供两者，比如 <code>mini-css-extract-plugin</code> 既有 loader 也有 plugin，loader 负责收集 CSS，plugin 负责把它写成单独的文件。</p>
</blockquote>
<p><strong>怎样调试自己写的 loader 和 plugin？</strong></p>
<blockquote>
<p>loader 可以在函数里打印 <code>this.resourcePath</code>，看它处理了哪些文件；也可以用 <code>loader-runner</code> 在不启动 webpack 的情况下单独运行 loader 做测试。plugin 可以先在 <code>done</code> 钩子里打印 <code>stats</code>，确认钩子触发了，再逐步换到更具体的钩子上。</p>
</blockquote>
<p><strong>Vite 插件和 webpack 插件有什么不同？</strong></p>
<blockquote>
<p>Vite 没有单独的 loader 概念，转换文件也通过插件的 <code>transform</code> 钩子完成，Vite 8 的插件接口在 Rolldown 插件接口上扩展而来，旧版本基于 Rollup。具体见<a href="/questions/engineering-vite-plugin/">《Vite 插件的 resolveId、load 和 transform 分别做什么？》</a>。</p>
</blockquote>`};export{e as default};