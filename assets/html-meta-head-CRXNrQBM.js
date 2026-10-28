var e={answerHtml:`<h2>简答</h2>
<ul>
<li><code>&lt;meta charset=&quot;utf-8&quot;&gt;</code> 要放在 head 最前面，否则中文可能显示乱码。</li>
<li><code>&lt;meta name=&quot;viewport&quot; content=&quot;width=device-width, initial-scale=1&quot;&gt;</code> 让移动端按设备宽度布局；不要写 <code>user-scalable=no</code> 或 <code>maximum-scale=1</code>，这会阻止用户放大。</li>
<li><code>&lt;title&gt;</code> 是标签页名称和搜索结果标题，每页要不同；<code>description</code> 常被用作搜索摘要，但搜索引擎可能改写。</li>
<li><code>&lt;link rel=&quot;canonical&quot;&gt;</code> 指明同一内容的首选地址，带筛选参数、分页、追踪参数的地址应指向规范地址。</li>
<li><code>&lt;meta name=&quot;robots&quot; content=&quot;noindex&quot;&gt;</code> 阻止收录，测试环境的 noindex 千万不能带到正式环境。</li>
</ul>
<h2>一个完整的 head</h2>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">head</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">meta</span> <span class="hljs-attr">charset</span>=<span class="hljs-string">&quot;utf-8&quot;</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">meta</span> <span class="hljs-attr">name</span>=<span class="hljs-string">&quot;viewport&quot;</span> <span class="hljs-attr">content</span>=<span class="hljs-string">&quot;width=device-width, initial-scale=1&quot;</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">title</span>&gt;</span>闭包是什么？ - 前端面试题<span class="hljs-tag">&lt;/<span class="hljs-name">title</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">meta</span> <span class="hljs-attr">name</span>=<span class="hljs-string">&quot;description&quot;</span> <span class="hljs-attr">content</span>=<span class="hljs-string">&quot;闭包是函数和其创建时词法环境的组合……&quot;</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">link</span> <span class="hljs-attr">rel</span>=<span class="hljs-string">&quot;canonical&quot;</span> <span class="hljs-attr">href</span>=<span class="hljs-string">&quot;https://example.com/questions/js-closure&quot;</span>&gt;</span>

  <span class="hljs-tag">&lt;<span class="hljs-name">meta</span> <span class="hljs-attr">property</span>=<span class="hljs-string">&quot;og:title&quot;</span> <span class="hljs-attr">content</span>=<span class="hljs-string">&quot;闭包是什么？&quot;</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">meta</span> <span class="hljs-attr">property</span>=<span class="hljs-string">&quot;og:description&quot;</span> <span class="hljs-attr">content</span>=<span class="hljs-string">&quot;闭包是函数和其创建时词法环境的组合……&quot;</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">meta</span> <span class="hljs-attr">property</span>=<span class="hljs-string">&quot;og:image&quot;</span> <span class="hljs-attr">content</span>=<span class="hljs-string">&quot;https://example.com/og/js-closure.png&quot;</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">meta</span> <span class="hljs-attr">property</span>=<span class="hljs-string">&quot;og:url&quot;</span> <span class="hljs-attr">content</span>=<span class="hljs-string">&quot;https://example.com/questions/js-closure&quot;</span>&gt;</span>

  <span class="hljs-tag">&lt;<span class="hljs-name">link</span> <span class="hljs-attr">rel</span>=<span class="hljs-string">&quot;icon&quot;</span> <span class="hljs-attr">href</span>=<span class="hljs-string">&quot;/favicon.svg&quot;</span> <span class="hljs-attr">type</span>=<span class="hljs-string">&quot;image/svg+xml&quot;</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">meta</span> <span class="hljs-attr">name</span>=<span class="hljs-string">&quot;theme-color&quot;</span> <span class="hljs-attr">content</span>=<span class="hljs-string">&quot;#ffffff&quot;</span>&gt;</span>
<span class="hljs-tag">&lt;/<span class="hljs-name">head</span>&gt;</span>
</code></pre></div>
<h2>常见错误</h2>
<ul>
<li>单页应用所有路由共用同一个 title 和 description，搜索结果全部一样。需要在路由切换时更新，或预渲染每个页面。</li>
<li>canonical 写成相对地址或统一指向首页，会让其他页面不被收录。</li>
<li><code>og:image</code> 用相对路径，社交平台抓取不到图片，必须用绝对 URL。</li>
<li>在 robots.txt 里禁止抓取某页，同时又想用 noindex 移除它：爬虫读不到页面，也就看不到 noindex。</li>
</ul>
<h2>其他</h2>
<ul>
<li><code>&lt;html lang=&quot;zh-CN&quot;&gt;</code> 写在 html 标签上，影响读屏发音、断词和翻译提示。</li>
<li>资源提示（<code>preconnect</code>、<code>preload</code>）也放在 head 中，但它们影响的是加载性能，不影响收录。</li>
<li>结构化数据用 <code>&lt;script type=&quot;application/ld+json&quot;&gt;</code>，可以帮助搜索引擎生成富摘要。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li><code>keywords</code> 还有用吗？主流搜索引擎早已不使用 <code>&lt;meta name=&quot;keywords&quot;&gt;</code> 作为排名依据，可以不写。</li>
</ul>`};export{e as default};