var e={answerHtml:`<p>webpack 从入口开始追踪模块依赖，把需要的代码与资源组织成可以部署的产物。entry、output、loader 和 plugin 分别参与不同阶段，不是四种互相替代的配置。</p>
<p>可以把一次构建理解成：从哪里开始找依赖，遇到某种文件怎样处理，构建过程中有哪些额外工作，最后把什么文件写到哪里。</p>
<h2>四个概念的分工</h2>
<table><thead><tr><th>配置</th><th>主要职责</th></tr></thead><tbody><tr><td>entry</td><td>确定依赖图的起点，可以有一个或多个入口</td></tr><tr><td>output</td><td>决定生成资源的位置、命名及相关运行时路径</td></tr><tr><td>loader</td><td>按规则转换模块内容，让它进入后续处理</td></tr><tr><td>plugin</td><td>通过构建生命周期参与生成、优化、分析等更广泛任务</td></tr></tbody></table>
<p>入口并不等于只有入口文件会被打包。它导入的模块会继续形成依赖图；动态导入又可能形成异步块。输出也不一定只有一个 app.js，可能还包括分块、样式、图片和映射文件。</p>
<h2>一个实际可理解的配置</h2>
<p>下面使用 webpack 5 的配置形式，文件名为 webpack.config.cjs：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> path = <span class="hljs-built_in">require</span>(<span class="hljs-string">&#x27;node:path&#x27;</span>);
<span class="hljs-keyword">const</span> webpack = <span class="hljs-built_in">require</span>(<span class="hljs-string">&#x27;webpack&#x27;</span>);

<span class="hljs-variable language_">module</span>.<span class="hljs-property">exports</span> = {
  <span class="hljs-attr">mode</span>: <span class="hljs-string">&#x27;production&#x27;</span>,
  <span class="hljs-attr">context</span>: __dirname,
  <span class="hljs-attr">entry</span>: <span class="hljs-string">&#x27;./src/index.js&#x27;</span>,
  <span class="hljs-attr">output</span>: {
    <span class="hljs-attr">path</span>: path.<span class="hljs-title function_">resolve</span>(__dirname, <span class="hljs-string">&#x27;dist&#x27;</span>),
    <span class="hljs-attr">filename</span>: <span class="hljs-string">&#x27;app.[contenthash].js&#x27;</span>,
    <span class="hljs-attr">clean</span>: <span class="hljs-literal">true</span>,
  },
  <span class="hljs-attr">module</span>: {
    <span class="hljs-attr">rules</span>: [
      {
        <span class="hljs-attr">test</span>: <span class="hljs-regexp">/\\.txt$/i</span>,
        <span class="hljs-attr">use</span>: path.<span class="hljs-title function_">resolve</span>(__dirname, <span class="hljs-string">&#x27;loaders/text-to-module.cjs&#x27;</span>),
      },
    ],
  },
  <span class="hljs-attr">plugins</span>: [
    <span class="hljs-keyword">new</span> webpack.<span class="hljs-title class_">BannerPlugin</span>({ <span class="hljs-attr">banner</span>: <span class="hljs-string">&#x27;示例构建产物&#x27;</span> }),
  ],
};
</code></pre></div>
<p>entry 相对 context 找到源码入口。output.path 是文件系统中的输出目录，[contenthash] 参与生成与内容相关的文件名。clean 会清理相应输出目录，不能随意把它指向包含手工文件的公共目录。</p>
<p>BannerPlugin 为生成内容添加标记，展示的是构建阶段的扩展，而不是修改某一种源码语法。</p>
<h2>Loader 怎样把文本变成模块</h2>
<p>loaders/text-to-module.cjs 的内容如下：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-variable language_">module</span>.<span class="hljs-property">exports</span> = <span class="hljs-keyword">function</span> <span class="hljs-title function_">textToModule</span>(<span class="hljs-params">source</span>) {
  <span class="hljs-keyword">return</span> <span class="hljs-string">\`export default <span class="hljs-subst">\${<span class="hljs-built_in">JSON</span>.stringify(source)}</span>;\`</span>;
};
</code></pre></div>
<p>src/index.js 可以导入文本文件：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">import</span> message <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;./message.txt&#x27;</span>;

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(message);
</code></pre></div>
<p>webpack 发现 message.txt 后，规则匹配到这个 loader。loader 把文本转换为一段导出字符串的 JavaScript，再交给后续模块处理。JSON.stringify 用于生成正确的字符串字面量，避免引号或换行破坏代码；它不是通用的 HTML 安全转义方法。</p>
<p>webpack 5 本身已有 asset/source 等能力可处理相应文本资源，这个自定义 loader 主要用于理解机制，正式项目不必为了使用 loader 而重复实现已有功能。</p>
<h2>Loader 的顺序与匹配条件很重要</h2>
<p>常见的 loader 正常转换链按从右到左执行，后一个处理结果成为前一个输入。因此一段源格式需要先转换成另一个格式时，应按实际数据流安排，而不是按名字随意排列。</p>
<p>Loader 还有 pitch 等阶段，不能把正常阶段的顺序概括成所有钩子永远都按同一方向运行。复杂链路应查相应 loader 的约定。</p>
<p>test、include、exclude、resourceQuery 等条件也会影响文件是否进入规则。转换不到预期结果时，先确认文件是否匹配、实际经过了哪些步骤，再判断配置是否缺失。</p>
<p>对修改源码位置的转换，还要处理 Source Map 传递。上游映射丢失后，最终文件即使生成了 map，也未必能准确回到真正原始源码。</p>
<h2>Plugin 不只是“更大的 loader”</h2>
<p>Plugin 可以访问相应编译对象和钩子，参与资源生成、优化、统计或其他生命周期工作。它可能处理整个产物集合，而不是为每个匹配文件返回一段新源码。</p>
<p>一个插件也不会因为放在 plugins 数组最后，就保证在所有阶段最后运行；具体顺序还与它使用的钩子和阶段有关。应按插件 API 和版本要求理解，而不只看配置文件的行号。</p>
<p>开发服务器功能与 webpack 编译本身也有边界。开发中自动刷新或内存提供资源，不意味着生产部署已经包含同样的服务能力。</p>
<h2>文件路径与浏览器访问路径要区分</h2>
<p>output.path 是构建文件写到哪里的磁盘路径；publicPath 等配置关注浏览器如何定位运行时加载的资源。部署到子目录、CDN 或不同资源域名时，这些地址可能完全不同。</p>
<p>初始页面能加载，不代表所有异步块路径都正确。应实际打开需要动态导入的功能，并验证深链接和资源缓存，而不是只检查 dist 是否生成了文件。</p>
<p>mode 会启用相应默认优化和环境行为，但 production 不是自动保证兼容性、类型正确或业务安全的开关。语法转换、polyfill、类型检查和部署配置仍有各自职责。</p>
<p>排查时沿“入口与解析 → 规则与转换 → 优化与插件 → 产物与访问路径”寻找证据，通常比不断增加插件更容易定位问题。</p>`};export{e as default};