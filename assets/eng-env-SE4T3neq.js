var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>前端代码里读的环境变量，在构建时就被替换成了具体的值，直接写进发给用户的 JS 文件里。用户打开 DevTools 就能搜到，所以它不能放任何秘密。</p>
<p>Vite 只把 <code>VITE_</code> 开头的变量暴露给客户端代码。这个前缀的作用是防止误暴露，它不是加密。</p>
<p>API 密钥、数据库口令、签名私钥这类秘密，只能留在服务端。浏览器请求自己的后端，由后端带着密钥去调第三方服务。</p>
<p>另外要注意，变量的值都是字符串，要自己转换和校验；改了变量要重新构建才会生效。</p>
</blockquote>
<h2>构建时替换意味着公开</h2>
<p>先看源码里的一行请求，和它构建之后的样子。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// 源码</span>
<span class="hljs-title function_">fetch</span>(<span class="hljs-string">\`<span class="hljs-subst">\${<span class="hljs-keyword">import</span>.meta.env.VITE_API_BASE}</span>/users\`</span>);
<span class="hljs-comment">// 构建产物中大致变成</span>
<span class="hljs-title function_">fetch</span>(<span class="hljs-string">\`<span class="hljs-subst">\${<span class="hljs-string">&#x27;https://api.example.com&#x27;</span>}</span>/users\`</span>);
</code></pre></div>
<p>很多人以为环境变量是在浏览器运行时“读取”的。其实浏览器拿到的已经是替换后的结果，变量的值就是代码里的一个字符串。</p>
<p>所以打开 DevTools 的 Sources 面板，或者直接下载 JS 文件，就能搜到所有被引用的变量值。混淆和压缩只会改变量名和格式，字符串的内容还在。</p>
<h2>Vite 是怎样加载变量的</h2>
<p>Vite 会依次加载 <code>.env</code>、<code>.env.local</code>、<code>.env.[mode]</code>、<code>.env.[mode].local</code>，越具体的文件优先级越高。带 <code>.local</code> 的文件放个人配置，应该加进 <code>.gitignore</code>。</p>
<p>这里的 mode 是“模式”，决定加载哪个 <code>.env.[mode]</code> 文件，可以用 <code>--mode</code> 指定。不指定时，开发是 <code>development</code>，构建是 <code>production</code>。另外，启动 Vite 时进程里已经存在的环境变量，优先级比 <code>.env</code> 文件还高。</p>
<p>只有 <code>VITE_</code> 前缀的变量会出现在 <code>import.meta.env</code> 里，前缀可以用 <code>envPrefix</code> 修改。但 <code>envPrefix</code> 不能设成空字符串，因为那样会把所有环境变量都暴露出去，Vite 检测到 <code>&#x27;&#x27;</code> 会直接报错。只需要暴露个别变量时，用 <code>define</code>。内置的 <code>import.meta.env.MODE</code>、<code>DEV</code>、<code>PROD</code>、<code>BASE_URL</code> 可以直接用。</p>
<h2>为什么值要自己转换</h2>
<p>变量的值永远是字符串，这一点很容易踩坑。下面这段代码在 Node.js 里运行一下就能看到现象：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> raw = <span class="hljs-string">&#x27;false&#x27;</span>;
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">Boolean</span>(raw)); <span class="hljs-comment">// true</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(raw === <span class="hljs-string">&#x27;true&#x27;</span>); <span class="hljs-comment">// false</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">Number</span>.<span class="hljs-built_in">isFinite</span>(<span class="hljs-title class_">Number</span>(<span class="hljs-string">&#x27;abc&#x27;</span>))); <span class="hljs-comment">// false</span>
</code></pre></div>
<p><code>&#x27;false&#x27;</code> 是一个非空字符串，所以转成布尔值是 <code>true</code>。如果直接写 <code>if (import.meta.env.VITE_FEATURE_X)</code>，配置成 <code>false</code> 功能也会打开。改法是跟字符串比较，数字则转换后校验：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> timeout = <span class="hljs-title class_">Number</span>(<span class="hljs-keyword">import</span>.<span class="hljs-property">meta</span>.<span class="hljs-property">env</span>.<span class="hljs-property">VITE_TIMEOUT</span> ?? <span class="hljs-number">5000</span>);
<span class="hljs-keyword">if</span> (!<span class="hljs-title class_">Number</span>.<span class="hljs-built_in">isFinite</span>(timeout)) <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">&#x27;VITE_TIMEOUT 必须是数字&#x27;</span>);
<span class="hljs-keyword">const</span> enabled = <span class="hljs-keyword">import</span>.<span class="hljs-property">meta</span>.<span class="hljs-property">env</span>.<span class="hljs-property">VITE_FEATURE_X</span> === <span class="hljs-string">&#x27;true&#x27;</span>; <span class="hljs-comment">// &#x27;false&#x27; 字符串本身是真值</span>
</code></pre></div>
<h2>秘密应该放在哪里</h2>
<p>需要密钥的调用交给服务端或 BFF。BFF 是专门给前端服务的一层后端。浏览器请求自己的后端，后端带上密钥访问第三方服务，同时做鉴权、限流和参数校验。</p>
<p>有些第三方服务会提供“可以公开的客户端密钥”，比如地图 SDK 的浏览器 key。这种 key 的安全性不来自隐藏，而来自服务方后台的限制，所以要在后台限制来源域名和权限范围。</p>
<h2>构建期配置和运行时配置</h2>
<p>同一份构建产物要部署到测试和生产环境时，如果把接口地址写进构建，每个环境都得重新构建一次。</p>
<p>替代做法是让页面启动时读取一个运行时配置文件，比如 <code>/config.json</code>，由部署环境提供。这份文件同样是公开的，只能放非敏感的配置。</p>
<h2>常见追问</h2>
<p><strong>把 <code>.env</code> 加进 <code>.gitignore</code> 就安全了吗？</strong></p>
<blockquote>
<p>不是。这只能防止文件被提交到仓库。只要代码引用了某个变量，构建时它的值照样会写进产物，用户照样能看到。</p>
</blockquote>
<p><strong>SSR 项目呢？</strong></p>
<blockquote>
<p>服务端代码可以读取完整的 <code>process.env</code>，这部分不会直接发给浏览器。但要确保这些值不会被序列化进返回给浏览器的 HTML 或数据里，否则还是泄露了。</p>
</blockquote>`};export{e as default};