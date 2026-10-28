var e={answerHtml:`<h2>简答</h2>
<ul>
<li>Google 能执行 JavaScript，但会排队渲染，存在延迟；很多社交平台的分享卡片抓取器不执行 JavaScript，只读初始 HTML 中的 <code>og:</code> 标签。</li>
<li>SSR 和 SSG 在初始 HTML 中包含正文、标题和链接，抓取更可靠。</li>
<li>不存在的页面要返回 HTTP 404，而不是返回 200 和一个&quot;未找到&quot;界面（软 404）。</li>
<li>每个页面要有唯一的 <code>&lt;title&gt;</code>、<code>&lt;meta name=&quot;description&quot;&gt;</code> 和指向规范地址的 <code>&lt;link rel=&quot;canonical&quot;&gt;</code>。</li>
<li>预渲染只能保证内容可以被读取，是否收录和排名还取决于内容质量、链接和搜索引擎自身的策略。</li>
</ul>
<h2>初始 HTML 要包含什么</h2>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">head</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">title</span>&gt;</span>HTTP 预检请求怎样工作？｜前端题库<span class="hljs-tag">&lt;/<span class="hljs-name">title</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">meta</span> <span class="hljs-attr">name</span>=<span class="hljs-string">&quot;description&quot;</span> <span class="hljs-attr">content</span>=<span class="hljs-string">&quot;解释浏览器何时发送 OPTIONS 预检请求……&quot;</span> /&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">link</span> <span class="hljs-attr">rel</span>=<span class="hljs-string">&quot;canonical&quot;</span> <span class="hljs-attr">href</span>=<span class="hljs-string">&quot;https://example.com/questions/http-preflight&quot;</span> /&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">meta</span> <span class="hljs-attr">property</span>=<span class="hljs-string">&quot;og:title&quot;</span> <span class="hljs-attr">content</span>=<span class="hljs-string">&quot;HTTP 预检请求怎样工作？&quot;</span> /&gt;</span>
<span class="hljs-tag">&lt;/<span class="hljs-name">head</span>&gt;</span>
<span class="hljs-tag">&lt;<span class="hljs-name">body</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">h1</span>&gt;</span>HTTP 预检请求怎样工作？<span class="hljs-tag">&lt;/<span class="hljs-name">h1</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">p</span>&gt;</span>正文……<span class="hljs-tag">&lt;/<span class="hljs-name">p</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">a</span> <span class="hljs-attr">href</span>=<span class="hljs-string">&quot;/questions/http-cors&quot;</span>&gt;</span>相关：CORS<span class="hljs-tag">&lt;/<span class="hljs-name">a</span>&gt;</span>
<span class="hljs-tag">&lt;/<span class="hljs-name">body</span>&gt;</span>
</code></pre></div>
<ul>
<li>导航使用真正的 <code>&lt;a href&gt;</code>，爬虫才能发现其他页面；只用 <code>onClick</code> 跳转的按钮不会被跟踪。</li>
<li>结构化数据（JSON-LD）可以帮助搜索引擎理解页面类型。</li>
</ul>
<h2>状态码</h2>
<table><thead><tr><th>情况</th><th>状态码</th></tr></thead><tbody><tr><td>页面存在</td><td>200</td></tr><tr><td>页面不存在</td><td>404</td></tr><tr><td>永久迁移</td><td>301 / 308</td></tr><tr><td>临时故障</td><td>503</td></tr></tbody></table>
<p>SSR 中查询到数据不存在时，在渲染前设置 404（Next.js 中调用 <code>notFound()</code>）。纯静态站点要提供 <code>404.html</code>，并确认托管平台对不存在的路径返回 404。</p>
<h2>SPA 的深链接部署</h2>
<p>history 模式的路由（<code>/questions/42</code>）在用户刷新时，服务器会去找这个路径对应的文件。需要把未知路径回退到 <code>index.html</code>：</p>
<div class="not-prose code-block"><div class="code-language">nginx</div><pre><code class="hljs language-nginx">location / {
  try_files $uri $uri/ /index.html;
}
</code></pre></div>
<p>这样做的代价是所有不存在的路径都返回 200。更好的方式是预渲染已知页面，对其余路径返回 404 页面；或者由前端路由显示 404，并加上 <code>&lt;meta name=&quot;robots&quot; content=&quot;noindex&quot;&gt;</code>。hash 模式（<code>/#/questions/42</code>）不需要服务器配置，但 hash 之后的部分不会发送给服务器，不利于 SEO。</p>
<h2>sitemap 和 robots.txt</h2>
<ul>
<li><code>sitemap.xml</code> 列出需要收录的页面，在 <code>robots.txt</code> 中声明它的位置。</li>
<li><code>robots.txt</code> 不能用来隐藏敏感页面，它只是给爬虫的建议，而且本身是公开的。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li>CSR 一定对 SEO 不利吗？不一定会不被收录，但存在渲染延迟和失败的风险，分享卡片通常无法显示。</li>
<li>不同渲染方式怎么选，见《CSR、SSR、SSG 和混合渲染如何选择？》。</li>
</ul>`};export{e as default};