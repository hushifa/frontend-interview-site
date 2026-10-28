var e={answerHtml:`<h2>简答</h2>
<ul>
<li>站点部署在子路径（如 <code>https://user.github.io/repo/</code>）时，构建工具的基础路径（Vite 的 <code>base</code>）要设成 <code>/repo/</code>，否则资源会从域名根目录请求导致 404。</li>
<li>单页应用的深链接（如 <code>/repo/users/1</code>）在服务器上没有对应文件，需要回退到 <code>index.html</code> 或在构建时预渲染每个路由。</li>
<li>入口 HTML 用 <code>Cache-Control: no-cache</code> 每次校验，带内容哈希的资源设置长期缓存。</li>
<li>发布新版本时保留旧的哈希资源一段时间，避免停留在旧页面的用户懒加载时 404。</li>
<li>部署后从外部实际访问首页、深链接和懒加载功能，确认路径和缓存都正确。</li>
</ul>
<h2>资源路径</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// vite.config.js</span>
<span class="hljs-keyword">export</span> <span class="hljs-keyword">default</span> { <span class="hljs-attr">base</span>: <span class="hljs-string">&#x27;/frontend-interview/&#x27;</span> };
</code></pre></div>
<p>构建后 HTML 中的引用变为 <code>/frontend-interview/assets/index-3f9a.js</code>。代码中拼接的路径也要基于 <code>import.meta.env.BASE_URL</code>，例如：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-title function_">fetch</span>(<span class="hljs-string">\`<span class="hljs-subst">\${<span class="hljs-keyword">import</span>.meta.env.BASE_URL}</span>data/questions.json\`</span>);
</code></pre></div>
<p>直接写 <code>/data/questions.json</code> 在本地开发时能工作，部署到子路径后就会失败。</p>
<h2>深链接</h2>
<p>静态托管平台按 URL 查找文件。用户直接打开 <code>/repo/users/1</code> 或刷新页面时，服务器找不到 <code>users/1/index.html</code> 就返回 404。可选方案：</p>
<ul>
<li><strong>预渲染</strong>：为每个路由生成 HTML 文件，搜索引擎和直接访问都能拿到内容。</li>
<li><strong>回退规则</strong>：Netlify、Vercel、Cloudflare Pages 等支持把未知路径重写到 <code>index.html</code>。</li>
<li><strong>GitHub Pages</strong>：不支持重写规则，常见做法是预渲染，或复制一份 <code>404.html</code> 加载应用（返回状态码仍是 404，不利于搜索收录）。</li>
<li><strong>hash 路由</strong>：<code>/#/users/1</code> 不会发到服务器，但 URL 不美观，也不利于 SEO。</li>
</ul>
<h2>缓存策略</h2>
<table><thead><tr><th>文件</th><th>建议</th></tr></thead><tbody><tr><td><code>index.html</code> 等入口</td><td><code>no-cache</code>，每次向服务器校验</td></tr><tr><td><code>assets/*-[hash].js/css</code></td><td><code>max-age=31536000, immutable</code></td></tr><tr><td>无哈希的数据文件</td><td>较短的 <code>max-age</code> 或 <code>no-cache</code></td></tr></tbody></table>
<p>入口被长时间缓存时，用户会一直加载旧版本；资源文件名不带哈希又设置长缓存时，用户拿不到更新。GitHub Pages 不允许自定义响应头，需要依赖它的默认缓存时间，或在前面加 CDN。</p>
<h2>旧资源 404</h2>
<p>每次构建资源文件名都会变化。用户打开旧页面后，点击懒加载功能会请求旧的 chunk 文件。如果部署时删除了旧文件，就会加载失败。部署时保留上一两个版本的资源，或在前端捕获加载失败后提示刷新。</p>
<h2>部署后检查</h2>
<ol>
<li>无缓存打开首页，Network 面板没有 404。</li>
<li>直接访问一个深链接并刷新。</li>
<li>触发一个懒加载功能。</li>
<li>查看入口 HTML 和资源的 <code>Cache-Control</code> 响应头。</li>
</ol>
<h2>常见追问</h2>
<ul>
<li><code>.nojekyll</code> 是做什么的？GitHub Pages 默认用 Jekyll 处理站点，会忽略下划线开头的文件和目录，放一个 <code>.nojekyll</code> 文件可以关闭这个处理。</li>
<li>发布出错怎么回滚？见《静态网站发布失败时怎样安全回滚？》。</li>
</ul>`};export{e as default};