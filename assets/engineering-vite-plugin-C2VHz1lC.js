var e={answerHtml:`<h2>简答</h2>
<ul>
<li><code>resolveId</code> 决定一个导入路径对应哪个模块 ID，返回 <code>null</code> 交给下一个插件处理。</li>
<li><code>load</code> 根据模块 ID 提供源码，常用于虚拟模块或从非文件来源读取内容。</li>
<li><code>transform</code> 拿到已加载的源码并改写，例如编译语法或注入代码，改动较大时应返回 Source Map。</li>
<li>三个钩子按 解析 → 加载 → 转换 的顺序对每个模块执行，开发服务器和生产构建都会调用。</li>
<li>虚拟模块的内部 ID 通常加 <code>\\0</code> 前缀，避免其他插件把它当成真实文件处理。</li>
</ul>
<h2>虚拟模块示例</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// vite.config.js</span>
<span class="hljs-keyword">import</span> { defineConfig } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;vite&#x27;</span>;

<span class="hljs-keyword">function</span> <span class="hljs-title function_">buildInfo</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">const</span> publicId = <span class="hljs-string">&#x27;virtual:build-info&#x27;</span>;
  <span class="hljs-keyword">const</span> internalId = <span class="hljs-string">&#x27;\\0&#x27;</span> + publicId;

  <span class="hljs-keyword">return</span> {
    <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;build-info&#x27;</span>,
    <span class="hljs-title function_">resolveId</span>(<span class="hljs-params">id</span>) {
      <span class="hljs-keyword">if</span> (id === publicId) <span class="hljs-keyword">return</span> internalId;
      <span class="hljs-keyword">return</span> <span class="hljs-literal">null</span>;
    },
    <span class="hljs-title function_">load</span>(<span class="hljs-params">id</span>) {
      <span class="hljs-keyword">if</span> (id !== internalId) <span class="hljs-keyword">return</span> <span class="hljs-literal">null</span>;
      <span class="hljs-keyword">return</span> <span class="hljs-string">\`export const builtAt = <span class="hljs-subst">\${<span class="hljs-built_in">JSON</span>.stringify(<span class="hljs-keyword">new</span> <span class="hljs-built_in">Date</span>().toISOString())}</span>;\`</span>;
    },
  };
}

<span class="hljs-keyword">export</span> <span class="hljs-keyword">default</span> <span class="hljs-title function_">defineConfig</span>({ <span class="hljs-attr">plugins</span>: [<span class="hljs-title function_">buildInfo</span>()] });
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// 业务代码</span>
<span class="hljs-keyword">import</span> { builtAt } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;virtual:build-info&#x27;</span>;
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(builtAt);
</code></pre></div>
<ol>
<li>遇到 <code>import &#x27;virtual:build-info&#x27;</code>，Vite 依次调用各插件的 <code>resolveId</code>，本插件返回内部 ID。</li>
<li>对这个 ID 调用 <code>load</code>，本插件返回一段 ES 模块源码。</li>
<li>源码再经过所有插件的 <code>transform</code>，最后被浏览器或打包器使用。</li>
</ol>
<h2>transform 示例</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">stripDebug</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">return</span> {
    <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;strip-debug&#x27;</span>,
    <span class="hljs-attr">apply</span>: <span class="hljs-string">&#x27;build&#x27;</span>,
    <span class="hljs-title function_">transform</span>(<span class="hljs-params">code, id</span>) {
      <span class="hljs-keyword">if</span> (!id.<span class="hljs-title function_">endsWith</span>(<span class="hljs-string">&#x27;.js&#x27;</span>) || !code.<span class="hljs-title function_">includes</span>(<span class="hljs-string">&#x27;__DEBUG__&#x27;</span>)) <span class="hljs-keyword">return</span> <span class="hljs-literal">null</span>;
      <span class="hljs-keyword">return</span> { <span class="hljs-attr">code</span>: code.<span class="hljs-title function_">replaceAll</span>(<span class="hljs-string">&#x27;__DEBUG__&#x27;</span>, <span class="hljs-string">&#x27;false&#x27;</span>), <span class="hljs-attr">map</span>: <span class="hljs-literal">null</span> };
    },
  };
}
</code></pre></div>
<ul>
<li>先用 <code>id</code> 过滤，只处理需要的文件，避免拖慢所有模块。</li>
<li>返回 <code>null</code> 表示不处理；返回字符串或 <code>{ code, map }</code> 表示替换源码。</li>
<li>这里的替换不改变行列结构，<code>map: null</code> 可以接受；会增删行的改写应借助 <code>magic-string</code> 等工具生成 Source Map，否则报错位置会错乱。</li>
</ul>
<h2>其他要注意的地方</h2>
<ul>
<li><strong>执行时机</strong>：<code>apply: &#x27;serve&#x27;</code> 或 <code>&#x27;build&#x27;</code> 限制插件只在开发或构建时生效；<code>enforce: &#x27;pre&#x27;</code> / <code>&#x27;post&#x27;</code> 调整它相对于 Vite 核心插件的顺序。</li>
<li><strong>Vite 特有钩子</strong>：<code>config</code>、<code>configResolved</code> 读取或修改配置，<code>configureServer</code> 给开发服务器加中间件，<code>transformIndexHtml</code> 改写 HTML，<code>handleHotUpdate</code> 自定义热更新。</li>
<li><strong>兼容 Rollup 插件</strong>：<code>resolveId</code>、<code>load</code>、<code>transform</code> 是 Rollup 的通用钩子，Vite 在开发和构建中都按相同语义调用它们，所以很多 Rollup 插件可以直接使用。</li>
<li><strong>验证</strong>：开发时模块逐个按需转换，构建时整体打包，同一插件在两种模式下看到的模块顺序和路径格式可能不同，两种模式都要测试。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li><code>resolveId</code> 返回的 ID 一定是文件路径吗？不一定，可以是任意字符串，只要后续 <code>load</code> 能识别。</li>
<li>为什么 <code>\\0</code> 前缀很重要？其他插件和 Vite 内部约定跳过以 <code>\\0</code> 开头的 ID，不会尝试从磁盘读取或再次转换路径。</li>
</ul>`};export{e as default};