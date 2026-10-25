var e={answerHtml:`<p>浏览器代码写下一个 import 时，工具首先要弄清它指向什么，然后取得内容，再把内容变成后续可以处理的模块。resolveId、load、transform 对应这条过程中的不同职责。</p>
<table><thead><tr><th>钩子</th><th>输入与职责</th></tr></thead><tbody><tr><td>resolveId</td><td>根据导入字符串和相关上下文，确定模块 ID</td></tr><tr><td>load</td><td>根据模块 ID 提供源码内容</td></tr><tr><td>transform</td><td>对已加载的源码进行转换，并提供相应映射</td></tr></tbody></table>
<p>这是一条理解流程的主线，不表示整张图一定分成三个绝对分离的批次。缓存、不同环境和重复请求都可能影响实际调用次数，插件不能假定每个文件一生只处理一次。</p>
<h2>虚拟模块为什么需要两个 ID</h2>
<p>有时模块并不是磁盘文件，例如构建版本、生成的内容清单或插件提供的运行时入口。使用者需要一个可读的导入名称，插件内部则需要避免它与真实路径、其他插件处理冲突。</p>
<p>常见约定是对外使用 virtual: 前缀，内部使用带 <code>\\0</code> 前缀的 ID。这个前缀是 JavaScript 字符串里的空字符，帮助工具识别特殊模块，并与普通文件解析和 Source Map 处理区分。</p>
<h2>一个完整的虚拟模块插件</h2>
<p>把下面内容放在 build-info-plugin.js：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">export</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">buildInfoPlugin</span>(<span class="hljs-params">version</span>) {
  <span class="hljs-keyword">if</span> (<span class="hljs-keyword">typeof</span> version !== <span class="hljs-string">&#x27;string&#x27;</span>) <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">TypeError</span>(<span class="hljs-string">&#x27;版本信息必须是字符串&#x27;</span>);
  <span class="hljs-keyword">const</span> publicId = <span class="hljs-string">&#x27;virtual:build-info&#x27;</span>;
  <span class="hljs-keyword">const</span> resolvedId = <span class="hljs-string">&#x27;\\0virtual:build-info&#x27;</span>;

  <span class="hljs-keyword">return</span> {
    <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;demo-build-info&#x27;</span>,
    <span class="hljs-title function_">resolveId</span>(<span class="hljs-params">id</span>) {
      <span class="hljs-keyword">if</span> (id === publicId) <span class="hljs-keyword">return</span> resolvedId;
      <span class="hljs-keyword">return</span> <span class="hljs-literal">null</span>;
    },
    <span class="hljs-title function_">load</span>(<span class="hljs-params">id</span>) {
      <span class="hljs-keyword">if</span> (id !== resolvedId) <span class="hljs-keyword">return</span> <span class="hljs-literal">null</span>;
      <span class="hljs-keyword">return</span> <span class="hljs-string">\`export const version = <span class="hljs-subst">\${<span class="hljs-built_in">JSON</span>.stringify(version)}</span>;\`</span>;
    },
  };
}
</code></pre></div>
<p>在 Vite 配置中注册：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">import</span> { defineConfig } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;vite&#x27;</span>;
<span class="hljs-keyword">import</span> { buildInfoPlugin } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;./build-info-plugin.js&#x27;</span>;

<span class="hljs-keyword">export</span> <span class="hljs-keyword">default</span> <span class="hljs-title function_">defineConfig</span>({
  <span class="hljs-attr">plugins</span>: [<span class="hljs-title function_">buildInfoPlugin</span>(<span class="hljs-string">&#x27;1.0.0&#x27;</span>)],
});
</code></pre></div>
<p>应用现在可以导入 <code>virtual:build-info</code> 的 version。resolveId 认出公开名称，load 为内部 ID 生成 JavaScript；其他模块返回 null，让后续处理继续，不抢占不属于自己的文件。</p>
<p>这里使用 JSON.stringify 生成字符串字面量，避免版本文本中的引号和换行破坏生成代码。它只解决这段 JavaScript 字面量的生成，不是适用于任意 HTML 拼接的安全处理。</p>
<p>load 已经输出有效模块，所以这个例子不需要 transform。插件不必为了“完整”同时实现所有钩子。</p>
<h2>什么情况下才需要 transform</h2>
<p>当已有源码需要进一步处理，例如特定语言转换、代码插桩或按规则改写模块内容时，transform 更合适。它通常返回 code 和对应 map，或者返回 null 表示不处理。</p>
<p>应先限定匹配范围，避免把第三方依赖、已经生成的子模块或无关资源重复转换。模块 ID 可能包含查询参数或框架生成的信息，不能一律按普通文件扩展名猜含义，也不能粗暴去掉所有参数后把不同模块混为同一份内容。</p>
<p>如果改变了代码位置，需要保留正确 Source Map。即使代码能运行，映射错误也会让线上错误栈指向不相关的源位置；使用可靠的转换器或映射工具通常比手工猜行列更合适。</p>
<h2>开发服务器钩子与生产产物钩子不同</h2>
<p>configureServer 可以扩展开发服务器中间件和相关行为，但它不会因此变成生产站点的服务器逻辑。构建后部署到静态托管，也不会保留开发代理或自定义中间件。</p>
<p>开发模式按需处理模块，通常不会执行完整的产物生成流程，moduleParsed 等钩子也有具体差异。generateBundle 里产生文件成功，不代表开发服务器自动能提供同样内容；只在 configureServer 中实现功能，也不代表 build 后还存在。</p>
<p>静态虚拟版本模块在 dev 与 build 都可由解析和加载流程提供。更复杂的插件则应分别说明支持开发、构建、SSR 和 watch 的哪些行为。</p>
<h2>顺序、失效和 HMR 都要有明确规则</h2>
<p>apply 可以限定插件用于 serve 或 build，enforce 可以影响相应插件处理顺序，但它们不是让某个插件在整个生命周期绝对最先或最后执行的万能开关。</p>
<p>若虚拟内容依赖外部文件，还要登记和观察依赖变化，并处理模块失效与更新。只生成一次字符串，之后文件变化却不刷新，会造成开发环境一直展示旧内容。</p>
<p>当前 Vite 的构建基础是 Rolldown，并保留相应插件兼容能力；仍不能认为任意 Rollup 插件在所有开发或环境钩子中都具有完全相同的行为。应按插件与项目版本验证，而不是仅看它导出了一个 name 字段。</p>
<h2>插件的执行环境与生成代码的执行环境要分开</h2>
<p>插件可以在工具环境中读取文件和构建配置，但它生成的模块可能会被发送到浏览器。不能因为值由 Node 读取，就把私密环境变量安全地导出给客户端。</p>
<p>验证一个插件时，可以从最小使用者出发：开发请求能否解析、生产包是否包含正确内容、无关文件是否不受影响、修改后是否更新，以及映射和错误是否可理解。再扩大到真实项目，比只检查钩子被调用过一次更有价值。</p>`};export{e as default};