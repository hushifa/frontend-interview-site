var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>本地开发好好的，部署到 GitHub Pages 就白屏，最常见的原因是路径前缀。站点放在子路径下，比如 <code>https://user.github.io/repo/</code>，构建工具的基础路径（Vite 里叫 <code>base</code>）就要设成 <code>/repo/</code>，不然浏览器会去域名根目录找资源，全部 404。</p>
<p>第二个坑是深链接。单页应用的地址比如 <code>/repo/users/1</code>，服务器上并没有这个文件，直接打开或刷新就 404。要么让服务器回退到 <code>index.html</code>，要么在构建时给每个路由预渲染一份 HTML。</p>
<p>第三是缓存。入口 HTML 用 <code>Cache-Control: no-cache</code>，每次都去服务器确认；带内容哈希的资源设置长期缓存。发布新版本时，旧的哈希资源要保留一段时间，不然停在旧页面的用户懒加载时会 404。</p>
<p>所以部署完以后，要从外部实际打开首页、深链接，触发一次懒加载，确认路径和缓存都对。</p>
</blockquote>
<h2>资源路径为什么会错</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// vite.config.js</span>
<span class="hljs-keyword">export</span> <span class="hljs-keyword">default</span> { <span class="hljs-attr">base</span>: <span class="hljs-string">&#x27;/frontend-interview/&#x27;</span> };
</code></pre></div>
<p>设好 <code>base</code> 以后，构建出来的 HTML 里引用会变成 <code>/frontend-interview/assets/index-3f9a.js</code>。可是 <code>base</code> 只管构建工具生成的引用，你在代码里自己拼的路径它管不到，这些也要基于 <code>import.meta.env.BASE_URL</code>：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-title function_">fetch</span>(<span class="hljs-string">\`<span class="hljs-subst">\${<span class="hljs-keyword">import</span>.meta.env.BASE_URL}</span>data/questions.json\`</span>);
</code></pre></div>
<p>为什么直接写 <code>/data/questions.json</code> 会出问题？本地开发时站点就在根目录，这个路径刚好对。部署到子路径后，开头的 <code>/</code> 指的还是域名根目录，请求就跑到了 <code>https://user.github.io/data/questions.json</code>，当然找不到。</p>
<h2>深链接为什么会 404</h2>
<p>静态托管平台是按 URL 去找文件的。用户直接打开 <code>/repo/users/1</code> 或者在这个页面刷新，服务器要找 <code>users/1/index.html</code>，找不到就返回 404。单页应用的路由是浏览器里的 JavaScript 处理的，服务器并不知道。可选的办法有这几种：</p>
<ul>
<li><strong>预渲染</strong>：给每个路由生成一份 HTML 文件，搜索引擎和直接访问都能拿到内容。</li>
<li><strong>回退规则</strong>：Netlify、Vercel、Cloudflare Pages 等支持把未知路径重写到 <code>index.html</code>。</li>
<li><strong>GitHub Pages</strong>：不支持重写规则，常见做法是预渲染，或者复制一份 <code>404.html</code> 来加载应用（返回的状态码仍是 404，不利于搜索收录）。</li>
<li><strong>hash 路由</strong>：<code>/#/users/1</code> 中 <code>#</code> 后面的部分不会发给服务器，但 URL 不好看，也不利于 SEO。</li>
</ul>
<h2>缓存应该怎样设</h2>
<table><thead><tr><th>文件</th><th>建议</th></tr></thead><tbody><tr><td><code>index.html</code> 等入口</td><td><code>no-cache</code>，每次向服务器校验</td></tr><tr><td><code>assets/*-[hash].js/css</code></td><td><code>max-age=31536000, immutable</code></td></tr><tr><td>无哈希的数据文件</td><td>较短的 <code>max-age</code> 或 <code>no-cache</code></td></tr></tbody></table>
<p>这样设的道理是：带哈希的文件，内容一变文件名就变，所以同一个文件名的内容永远不变，可以放心长期缓存。入口 HTML 的文件名不变，必须每次确认，用户才能拿到新版本引用的新文件名。</p>
<p>反过来就会出问题。入口被长时间缓存，用户会一直加载旧版本；资源文件名不带哈希却设了长缓存，用户拿不到更新。GitHub Pages 不允许自定义响应头，只能依赖它默认的缓存时间，或者在前面加一层 CDN。</p>
<h2>旧资源为什么不能马上删</h2>
<p>每次构建，资源文件名都会变。用户打开旧页面以后，点开一个懒加载的功能，请求的还是旧的 chunk 文件。如果部署时把旧文件删了，这次加载就会失败。所以部署时保留上一两个版本的资源，或者在前端捕获加载失败后提示用户刷新。</p>
<h2>部署完怎样检查</h2>
<ol>
<li>不带缓存打开首页，Network 面板里没有 404。</li>
<li>直接访问一个深链接，再刷新一次。</li>
<li>触发一个懒加载的功能。</li>
<li>查看入口 HTML 和资源的 <code>Cache-Control</code> 响应头。</li>
</ol>
<h2>常见追问</h2>
<p><strong><code>.nojekyll</code> 是做什么的？</strong></p>
<blockquote>
<p>GitHub Pages 默认会用 Jekyll 处理站点，Jekyll 会忽略下划线开头的文件和目录。放一个 <code>.nojekyll</code> 文件，就能关掉这个处理。</p>
</blockquote>
<p><strong>发布出错了怎么回滚？</strong></p>
<blockquote>
<p>见<a href="/questions/git-rollback/">《静态网站发布失败时怎样安全回滚？》</a>。</p>
</blockquote>`};export{e as default};