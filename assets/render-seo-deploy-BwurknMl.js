var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>搜索引擎和分享卡片最先看到的，是服务器返回的那份 HTML。CSR 页面的初始 HTML 通常只有一个空壳，正文要等脚本跑完才出来。Google 能执行 JavaScript，但渲染要排队，有延迟；很多社交平台的卡片抓取器根本不执行 JavaScript，只读初始 HTML 里的 <code>og:</code> 标签。所以 SSR 和 SSG 在初始 HTML 里就带上正文、标题和链接，抓取更可靠。</p>
<p>光有内容还不够。不存在的页面要返回 HTTP 404，而不是返回 200 再显示一个“未找到”界面，后者叫软 404。每个页面还要有唯一的 <code>&lt;title&gt;</code>、<code>&lt;meta name=&quot;description&quot;&gt;</code>，以及指向规范地址的 <code>&lt;link rel=&quot;canonical&quot;&gt;</code>。</p>
<p>部署 SPA 时，要让服务器把未知路径回退到 <code>index.html</code>，否则刷新深层页面会 404；但这样一来所有路径都返回 200，又要想办法让真正不存在的路径返回 404。</p>
<p>要注意，预渲染只能保证内容读得到。能不能收录、排第几，还取决于内容质量、链接和搜索引擎自己的策略。</p>
</blockquote>
<h2>初始 HTML 里要有什么</h2>
<p>下面是一个题目页的 HTML 应该包含的东西：</p>
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
<p>注意页面之间是用真正的 <code>&lt;a href&gt;</code> 连起来的。爬虫靠这些链接发现别的页面；如果只用一个按钮加 <code>onClick</code> 跳转，爬虫不会跟过去。</p>
<p>另外可以加结构化数据，也就是 JSON-LD，帮搜索引擎理解这个页面是什么类型。</p>
<h2>状态码怎么返回</h2>
<table><thead><tr><th>情况</th><th>状态码</th></tr></thead><tbody><tr><td>页面存在</td><td>200</td></tr><tr><td>页面不存在</td><td>404</td></tr><tr><td>永久迁移</td><td>301 / 308</td></tr><tr><td>临时故障</td><td>503</td></tr></tbody></table>
<p>SSR 时，如果查出来数据不存在，要在开始渲染前就把状态设成 404，Next.js 里是调用 <code>notFound()</code>。纯静态站点要提供一个 <code>404.html</code>，并确认托管平台对不存在的路径确实返回了 404。</p>
<h2>SPA 刷新深层页面为什么会 404</h2>
<p>用 history 模式的路由时，地址栏里是 <code>/questions/42</code> 这样的路径。在站内点击跳转没问题，因为是前端路由处理的。可是用户一刷新，浏览器会真的去服务器请求 <code>/questions/42</code> 这个文件，服务器上没有，就 404 了。</p>
<p>所以要让服务器把找不到的路径都回退到 <code>index.html</code>，交给前端路由：</p>
<div class="not-prose code-block"><div class="code-language">nginx</div><pre><code class="hljs language-nginx">location / {
  try_files $uri $uri/ /index.html;
}
</code></pre></div>
<p>可这样又带来一个问题：所有不存在的路径也都返回 200 了。更好的做法是预渲染已知的页面，其余路径返回 404 页面；或者由前端路由显示 404，同时加上 <code>&lt;meta name=&quot;robots&quot; content=&quot;noindex&quot;&gt;</code>。</p>
<p>hash 模式，也就是 <code>/#/questions/42</code>，不需要配服务器，因为 <code>#</code> 后面的部分根本不会发给服务器。也正因为这样，它对 SEO 不利。</p>
<h2>sitemap 和 robots.txt 各管什么</h2>
<p><code>sitemap.xml</code> 列出希望被收录的页面，在 <code>robots.txt</code> 里声明它的位置。</p>
<p><code>robots.txt</code> 不能用来藏敏感页面。它只是给爬虫的建议，爬虫可以不听，而且这个文件本身谁都能看到，写进去反而暴露了路径。</p>
<h2>常见追问</h2>
<p><strong>CSR 一定对 SEO 不利吗？</strong></p>
<blockquote>
<p>不一定就收录不了，但有渲染延迟和渲染失败的风险，而且分享卡片通常显示不出来。</p>
</blockquote>
<p><strong>不同渲染方式怎么选？</strong></p>
<blockquote>
<p>要按页面类型分别看，详见<a href="/questions/render-ssr-ssg/">《CSR、SSR、SSG 和混合渲染如何选择？》</a>。</p>
</blockquote>`};export{e as default};