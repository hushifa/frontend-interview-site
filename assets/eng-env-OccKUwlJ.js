var e={answerHtml:`<h2>简答</h2>
<ul>
<li>前端&quot;环境变量&quot;在构建时被替换成字面量，写进发给用户的 JS 文件，任何人都能看到。</li>
<li>Vite 只把 <code>VITE_</code> 前缀的变量暴露给客户端代码，前缀是防误暴露的开关，不是加密。</li>
<li>秘密（API 密钥、数据库口令、签名私钥）只能留在服务端，由服务端代为调用。</li>
<li>变量值都是字符串，需要自己转换和校验；修改后要重新构建才生效。</li>
</ul>
<h2>构建期替换意味着公开</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// 源码</span>
<span class="hljs-title function_">fetch</span>(<span class="hljs-string">\`<span class="hljs-subst">\${<span class="hljs-keyword">import</span>.meta.env.VITE_API_BASE}</span>/users\`</span>);
<span class="hljs-comment">// 构建产物中大致变成</span>
<span class="hljs-title function_">fetch</span>(<span class="hljs-string">\`<span class="hljs-subst">\${<span class="hljs-string">&#x27;https://api.example.com&#x27;</span>}</span>/users\`</span>);
</code></pre></div>
<p>浏览器拿到的是替换后的结果。打开 DevTools 的 Sources 面板或直接下载 JS 文件，就能搜到所有被引用的变量值。混淆和压缩不会改变这一点。</p>
<h2>Vite 的规则</h2>
<ul>
<li><code>.env</code>、<code>.env.local</code>、<code>.env.[mode]</code>、<code>.env.[mode].local</code> 依次加载，越具体的优先级越高；<code>.local</code> 文件应加入 <code>.gitignore</code>。</li>
<li><code>--mode</code> 决定加载哪个 <code>.env.[mode]</code>，默认开发是 <code>development</code>、构建是 <code>production</code>。</li>
<li>启动 Vite 时已经存在的进程环境变量优先于 <code>.env</code> 文件。</li>
<li>只有 <code>VITE_</code> 前缀（可用 <code>envPrefix</code> 修改）的变量出现在 <code>import.meta.env</code> 中。<code>envPrefix</code> 不能设成空字符串，那会暴露全部环境变量，Vite 检测到 <code>&#x27;&#x27;</code> 会直接报错；只需暴露个别变量时用 <code>define</code>。</li>
<li>内置的 <code>import.meta.env.MODE</code>、<code>DEV</code>、<code>PROD</code>、<code>BASE_URL</code> 可直接使用。</li>
</ul>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> timeout = <span class="hljs-title class_">Number</span>(<span class="hljs-keyword">import</span>.<span class="hljs-property">meta</span>.<span class="hljs-property">env</span>.<span class="hljs-property">VITE_TIMEOUT</span> ?? <span class="hljs-number">5000</span>);
<span class="hljs-keyword">if</span> (!<span class="hljs-title class_">Number</span>.<span class="hljs-built_in">isFinite</span>(timeout)) <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">&#x27;VITE_TIMEOUT 必须是数字&#x27;</span>);
<span class="hljs-keyword">const</span> enabled = <span class="hljs-keyword">import</span>.<span class="hljs-property">meta</span>.<span class="hljs-property">env</span>.<span class="hljs-property">VITE_FEATURE_X</span> === <span class="hljs-string">&#x27;true&#x27;</span>; <span class="hljs-comment">// &#x27;false&#x27; 字符串本身是真值</span>
</code></pre></div>
<h2>秘密应该放在哪里</h2>
<p>需要密钥的调用交给服务端或 BFF：浏览器请求自己的后端，后端带上密钥访问第三方服务，并做鉴权、限流和参数校验。第三方服务提供&quot;可公开的客户端密钥&quot;（如地图 SDK 的浏览器 key）时，要在服务方后台限制来源域名和权限范围，它的安全性来自这些限制，而不是来自隐藏。</p>
<h2>构建期配置和运行时配置</h2>
<p>同一个构建产物要部署到测试和生产环境时，把地址写进构建会迫使每个环境重新构建。替代做法是让页面启动时读取一个运行时配置文件（如 <code>/config.json</code>），由部署环境提供。这份文件同样是公开的，只放非敏感配置。</p>
<h2>常见追问</h2>
<ul>
<li><code>.env</code> 加进 <code>.gitignore</code> 就安全了吗？只防止提交到仓库，被构建引用的值照样进入产物。</li>
<li>SSR 项目呢？服务端代码可以读取完整的 <code>process.env</code>，但要确保这些值不会被序列化进返回给浏览器的 HTML 或数据。</li>
</ul>`};export{e as default};