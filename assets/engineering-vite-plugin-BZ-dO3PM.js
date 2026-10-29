var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>代码里写了一个 <code>import</code>，Vite 要做三件事：先弄清楚它指的是哪个模块，再拿到这个模块的源码，最后对源码做加工。这三步分别对应 <code>resolveId</code>、<code>load</code> 和 <code>transform</code> 三个钩子。</p>
<p><code>resolveId</code> 把导入路径变成一个模块 ID，不归它管就返回 <code>null</code>，交给下一个插件。<code>load</code> 根据 ID 返回源码，常用来做虚拟模块，也就是磁盘上不存在、由插件生成的模块。<code>transform</code> 拿到源码后改写，比如编译语法、注入代码。</p>
<p>这三个钩子对每个模块按解析、加载、转换的顺序执行，开发服务器和生产构建都会调用。</p>
<p>要注意两点。虚拟模块的内部 ID 一般加 <code>\\0</code> 前缀，免得别的插件把它当成真实文件；<code>transform</code> 改动比较大时，要返回 Source Map，不然报错位置会错乱。</p>
</blockquote>
<h2>用一个虚拟模块看前两个钩子</h2>
<p>下面的插件提供一个虚拟模块 <code>virtual:build-info</code>，业务代码导入它就能拿到构建时间。</p>
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
<p>磁盘上并没有这个文件，那它是怎样被导入的？</p>
<p>遇到 <code>import &#x27;virtual:build-info&#x27;</code> 时，Vite 依次调用各个插件的 <code>resolveId</code>，这个插件认出了它，返回内部 ID。接着 Vite 对这个 ID 调用 <code>load</code>，插件直接返回一段 ES 模块源码。这段源码再经过所有插件的 <code>transform</code>，最后交给浏览器或打包器。</p>
<h2>transform 怎样改写代码</h2>
<p>下面的插件只在构建时生效，把代码里的 <code>__DEBUG__</code> 换成 <code>false</code>。</p>
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
<p>开头先用 <code>id</code> 和内容过滤，只处理需要的文件。因为 <code>transform</code> 会对每个模块调用，不过滤就会拖慢所有模块。</p>
<p>返回 <code>null</code> 表示不处理。返回字符串，或者 <code>{ code, map }</code>，表示用新代码替换源码。</p>
<p>为什么这里 <code>map</code> 可以写 <code>null</code>？因为这次替换不增删行，代码的行列结构基本没变。如果改写会增删行，就要借助 <code>magic-string</code> 这类工具生成 Source Map，否则报错位置会对不上。</p>
<h2>还要注意哪些地方</h2>
<p>插件的执行时机可以调。<code>apply: &#x27;serve&#x27;</code> 或 <code>&#x27;build&#x27;</code> 让插件只在开发或构建时生效；<code>enforce: &#x27;pre&#x27;</code> 或 <code>&#x27;post&#x27;</code> 调整它相对于 Vite 核心插件的顺序。</p>
<p>Vite 还有自己特有的钩子。<code>config</code>、<code>configResolved</code> 用来读取或修改配置，<code>configureServer</code> 给开发服务器加中间件，<code>transformIndexHtml</code> 改写 HTML，<code>handleHotUpdate</code> 自定义热更新。</p>
<p><code>resolveId</code>、<code>load</code>、<code>transform</code> 本身是 Rollup 的通用钩子，Vite 在开发和构建中都按相同的语义调用它们，所以很多 Rollup 插件可以直接用。</p>
<p>可是开发和构建的过程并不一样。开发时模块是一个个按需转换的，构建时是整体打包，同一个插件在两种模式下看到的模块顺序和路径格式可能不同。所以两种模式都要测试。</p>
<h2>常见追问</h2>
<p><strong><code>resolveId</code> 返回的 ID 一定是文件路径吗？</strong></p>
<blockquote>
<p>不一定。它可以是任意字符串，只要后面的 <code>load</code> 能认出来就行，虚拟模块就是这样做的。</p>
</blockquote>
<p><strong>为什么 <code>\\0</code> 前缀很重要？</strong></p>
<blockquote>
<p>这是一个约定。其他插件和 Vite 内部看到以 <code>\\0</code> 开头的 ID，就会跳过，不会尝试从磁盘读取它，也不会再去转换这个路径。</p>
</blockquote>`};export{e as default};