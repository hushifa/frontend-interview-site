var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>先说显示。<code>&lt;meta charset=&quot;utf-8&quot;&gt;</code> 要放在 head 最前面，不然中文可能是乱码。<code>&lt;meta name=&quot;viewport&quot; content=&quot;width=device-width, initial-scale=1&quot;&gt;</code> 让手机按设备宽度来布局。不要加 <code>user-scalable=no</code> 或 <code>maximum-scale=1</code>，这会让用户没法放大页面。</p>
<p>再说搜索结果。<code>&lt;title&gt;</code> 是标签页上的名字，也是搜索结果的标题，每个页面都要不一样。<code>description</code> 常被用作搜索结果里的摘要，不过搜索引擎可能会自己改写。</p>
<p>然后是收录。同一份内容可能有好几个网址，比如带了筛选参数、分页参数、追踪参数，<code>&lt;link rel=&quot;canonical&quot;&gt;</code> 指明哪个是首选地址。<code>&lt;meta name=&quot;robots&quot; content=&quot;noindex&quot;&gt;</code> 是不让搜索引擎收录，测试环境的 noindex 千万不能带到正式环境。</p>
<p>最后，分享到社交平台时显示的卡片，由 Open Graph 的 <code>og:</code> 系列标签决定。</p>
</blockquote>
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
<p>从上往下是：编码、视口、标题和摘要、规范地址、分享卡片，最后是图标和浏览器主题色。注意 <code>canonical</code>、<code>og:image</code>、<code>og:url</code> 写的都是完整的绝对地址。</p>
<h2>最容易犯的错误</h2>
<p>单页应用所有路由共用一个 title 和 description，搜索结果里每一条看起来都一样。要在切换路由时更新它们，或者把每个页面预渲染出来。</p>
<p>canonical 写成相对地址，或者所有页面都指向首页。搜索引擎会以为这些页面都是首页的重复，其他页面就不收录了。</p>
<p><code>og:image</code> 用了相对路径。社交平台抓取时不知道相对于哪里，图片显示不出来，必须用绝对 URL。</p>
<p>在 robots.txt 里禁止抓取某个页面，同时又想靠 noindex 把它从搜索结果里移除。这两个是冲突的：爬虫不能抓这个页面，也就读不到上面的 noindex，页面反而可能一直留在结果里。</p>
<h2>还有哪些相关的写法</h2>
<p><code>&lt;html lang=&quot;zh-CN&quot;&gt;</code> 写在 html 标签上，不在 head 里。它影响读屏怎么发音、怎么断词，以及浏览器要不要提示翻译。</p>
<p><code>preconnect</code>、<code>preload</code> 这些资源提示也放在 head 里，但它们影响的是加载速度，跟收录没关系。</p>
<p>结构化数据用 <code>&lt;script type=&quot;application/ld+json&quot;&gt;</code> 写，能帮搜索引擎生成带评分、价格这类信息的富摘要。</p>
<h2>常见追问</h2>
<p><strong><code>keywords</code> 还有用吗？</strong></p>
<blockquote>
<p>主流搜索引擎早就不把 <code>&lt;meta name=&quot;keywords&quot;&gt;</code> 当排名依据了，可以不写。</p>
</blockquote>`};export{e as default};