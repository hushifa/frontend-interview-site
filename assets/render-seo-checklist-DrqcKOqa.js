var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>一个商品详情页想被搜索到，要过三关：搜索引擎能发现这个网址，能读懂页面内容，并且愿意在结果里展示它。前端 SEO 的手段基本都对应这三关，可以按清单逐项检查。Google 处理 JavaScript 页面也分抓取、渲染、编入索引三个阶段，渲染方式本身的影响见<a href="/questions/render-seo-deploy/">《前端渲染方式怎样影响 SEO 和部署？》</a>。</p>
<p>发现阶段，页面之间用带 <code>href</code> 的 <code>&lt;a&gt;</code> 标签链接，单页应用用 History API 路由，不用 <code>#/</code> 这类片段地址；再提供 sitemap，并在 robots.txt 里声明它的位置。理解阶段，每页有唯一的 <code>&lt;title&gt;</code>、<code>meta description</code> 和 <code>canonical</code>，正文要出现在初始 HTML 或渲染后的 DOM 里，不存在的页面返回 404，必要时加 JSON-LD 结构化数据。</p>
<p>展示阶段，图片用 <code>&lt;img&gt;</code> 加描述性的 <code>alt</code>，不要用 CSS 背景图承载内容图；页面体验上，Google 建议 LCP 在 2.5 秒内、INP 在 200 毫秒内、CLS 低于 0.1。</p>
<p>要注意，robots.txt 是管抓取流量的，不是藏页面的。被它屏蔽的网址仍可能出现在搜索结果里，想不被索引要用 <code>noindex</code> 或密码保护。</p>
</blockquote>
<h2>让搜索引擎找得到</h2>
<p><strong>链接要用 <code>&lt;a href&gt;</code>。</strong> Google 文档写明，一般来说只有链接是带 <code>href</code> 属性的 <code>&lt;a&gt;</code> 元素时，Google 才能抓取它；没有 <code>href</code> 的 <code>&lt;a&gt;</code>，或者靠脚本事件充当链接的其他标签，Google 无法可靠地提取网址。所以 <code>&lt;span onClick={() =&gt; navigate(&#x27;/item/1&#x27;)}&gt;</code> 这种写法要改成路由库提供的 <code>&lt;Link&gt;</code>，它最终会渲染成 <code>&lt;a href&gt;</code>。</p>
<p><strong>单页应用用 History API。</strong> JavaScript SEO 基础文档建议，客户端路由要用 History API 切换网址，不要用片段（<code>#</code>）。因为 <code>#</code> 后面的部分不会发送给服务器，也不被当作独立页面。</p>
<p><strong>提供 sitemap。</strong> sitemap 列出希望被收录的网址。Google 文档规定，单个 sitemap 未压缩不能超过 50MB，网址不能超过 50,000 个，超过就要拆成多个。sitemap 的位置可以在 robots.txt 里用 <code>Sitemap:</code> 声明，也可以在 Search Console 提交。</p>
<p><strong>robots.txt 只管抓取。</strong> 文档说它主要用来管理爬虫流量，不是阻止网页出现在 Google 中的机制；被屏蔽的网页仍可能被编入索引，只是结果里不会有描述。想不被索引，要用 <code>noindex</code> 或密码保护。还有一点容易冲突：阻止索引的文档特别提示，<code>noindex</code> 要生效，页面就不能被 robots.txt 屏蔽，否则爬虫永远看不到这条规则。</p>
<h2>让搜索引擎看得懂</h2>
<p><strong>每页唯一的 <code>&lt;title&gt;</code>。</strong> 标题链接文档要求每个页面在 <code>&lt;title&gt;</code> 里写唯一、描述性、简洁的标题，避免堆砌关键词和模板化文字。Google 发现标题过时、不准确时，可能自己改写结果里显示的标题。</p>
<p><strong>写 <code>meta description</code>。</strong> 摘要文档说，Google 会根据正文和 meta description 生成搜索结果中的摘要。描述要针对每页单独写，包含作者、价格这类有用信息，不要写成关键词列表；页面很多时可以按模板用程序生成。</p>
<p><strong>设置 <code>canonical</code>。</strong> 同一个商品可能有 <code>?from=ad</code>、<code>?sort=price</code> 等多个网址。用 <code>&lt;link rel=&quot;canonical&quot; href=&quot;...&quot;&gt;</code> 告诉 Google 哪个是规范网址。规范化文档列出的方法还有 HTTP 头里的 <code>rel=&quot;canonical&quot;</code>、sitemap 和重定向，并建议优先选择 HTTPS 网址。单页应用里 canonical 要随路由切换正确更新。</p>
<p><strong>状态码要真实。</strong> JavaScript SEO 文档要求使用有意义的 HTTP 状态码。单页应用找不到数据时，如果仍然返回 200 加一个“未找到”的页面，就成了 soft 404。文档给的办法是重定向到服务器真正返回 404 的网址，或者在页面上加 <code>&lt;meta name=&quot;robots&quot; content=&quot;noindex&quot;&gt;</code>。</p>
<p><strong>正文要能被看到。</strong> 正文要出现在初始 HTML 或渲染后的 DOM 里，选哪种渲染方式见<a href="/questions/render-seo-deploy/">《前端渲染方式怎样影响 SEO 和部署？》</a>。用 Web Components 时，要确保内容出现在渲染后的 HTML 里。动态渲染（只给爬虫返回服务端渲染版本）被 Google 标为临时解决方法，并说明有比它更好的方案。</p>
<p><strong>加结构化数据。</strong> 结构化数据用 JSON-LD、Microdata 或 RDFa 描述页面是什么，比如商品的名称、价格和评分，有机会获得富媒体搜索结果。Google 文档在大多数情况下推荐 JSON-LD，可以用 Rich Results Test 验证。</p>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">script</span> <span class="hljs-attr">type</span>=<span class="hljs-string">&quot;application/ld+json&quot;</span>&gt;</span><span class="javascript">
{
  <span class="hljs-string">&quot;@context&quot;</span>: <span class="hljs-string">&quot;https://schema.org&quot;</span>,
  <span class="hljs-string">&quot;@type&quot;</span>: <span class="hljs-string">&quot;Product&quot;</span>,
  <span class="hljs-string">&quot;name&quot;</span>: <span class="hljs-string">&quot;无线降噪耳机&quot;</span>,
  <span class="hljs-string">&quot;offers&quot;</span>: { <span class="hljs-string">&quot;@type&quot;</span>: <span class="hljs-string">&quot;Offer&quot;</span>, <span class="hljs-string">&quot;price&quot;</span>: <span class="hljs-string">&quot;899.00&quot;</span>, <span class="hljs-string">&quot;priceCurrency&quot;</span>: <span class="hljs-string">&quot;CNY&quot;</span> }
}
</span><span class="hljs-tag">&lt;/<span class="hljs-name">script</span>&gt;</span>
</code></pre></div>
<p>结构化数据描述的内容必须和页面上用户看到的一致，不能写页面上没有的价格或评分。</p>
<h2>让结果展示得好</h2>
<p><strong>图片用 <code>&lt;img&gt;</code> 和 <code>alt</code>。</strong> 图片 SEO 文档要求用 HTML 图片元素，写 <code>src</code> 和描述性的 <code>alt</code>，不要用 CSS 背景图承载内容图片；还建议用描述性的文件名、响应式图片（<code>&lt;picture&gt;</code> 或 <code>srcset</code>），以及图片 sitemap。图片懒加载时，要确保图片进入视口后会出现在 DOM 里。</p>
<p><strong>页面体验达标。</strong> Core Web Vitals 文档建议 LCP 在页面开始加载后 2.5 秒内完成，INP 控制在 200 毫秒以内，CLS 低于 0.1。三个指标怎样测量和优化，见<a href="/questions/engineering-vitals/">《LCP、INP、CLS 分别衡量什么？》</a>。</p>
<h2>一张上线前的检查表</h2>
<ol>
<li>页面之间的跳转都是 <code>&lt;a href&gt;</code>，路由不带 <code>#</code>。</li>
<li><code>sitemap.xml</code> 可访问，robots.txt 里声明了它，且没有误屏蔽重要页面。</li>
<li>每页 <code>&lt;title&gt;</code>、<code>meta description</code>、<code>canonical</code> 唯一且随路由更新。</li>
<li>不存在的页面返回 404，或者带 <code>noindex</code>。</li>
<li>用 Rich Results Test 或 Search Console 的网址检查工具看渲染后的 HTML，正文确实在里面。</li>
<li>结构化数据通过 Rich Results Test，内容和页面一致。</li>
<li>内容图都是 <code>&lt;img&gt;</code> 且有 <code>alt</code>。</li>
<li>真实用户的 Core Web Vitals 达标。</li>
</ol>
<h2>常见追问</h2>
<p><strong><code>meta keywords</code> 还有用吗？</strong></p>
<blockquote>
<p>对 Google 没用。Google 的“特殊标记”文档把 <code>&lt;meta name=&quot;keywords&quot;&gt;</code> 列在不受支持的标记里，说明它不会用于 Google 搜索，对索引和排名完全没有影响。把精力放在 title、description 和正文质量上更有效。</p>
</blockquote>
<p><strong>链接要加 <code>nofollow</code> 吗？</strong></p>
<blockquote>
<p>Google 的链接文档要求，付费链接用 <code>rel=&quot;sponsored&quot;</code> 或 <code>nofollow</code>；用户生成内容里的链接也可以标注，比如 <code>ugc</code> 或 <code>nofollow</code>。站内正常页面之间的链接不用加，否则不利于爬虫发现。</p>
</blockquote>
<p><strong>SEO 优化做了多久能见效？</strong></p>
<blockquote>
<p>没有固定时间。Google 要重新抓取、渲染和编入索引，大站和小站的频率不同。可以在 Search Console 里请求编入索引，并观察覆盖率报告，但不能保证收录或排名。</p>
</blockquote>`};export{e as default};