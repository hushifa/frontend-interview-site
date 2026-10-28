var e={answerHtml:`<p>一个页面在本地点击导航能显示题目，不代表搜索引擎、社交分享服务和直接打开深链接时都能得到同样内容。它们可能只先拿到 HTML，也可能稍后执行 JavaScript；部署平台还可能把不存在的路径统一返回首页，导致错误页面看起来像成功页面。</p>
<p>SEO 不是“用了 SSR 就一定排名更高”。渲染方式影响内容被发现和读取的时机，但最终还取决于内容质量、链接、状态码、抓取配置、页面性能和搜索引擎自己的处理策略。</p>
<h2>搜索入口需要有意义的初始 HTML</h2>
<p>公开文章、题目和资源页通常应在初始 HTML 中包含标题、正文摘要、正常链接和必要的结构化信息。CSR 也可能被搜索引擎执行，但脚本下载、执行、数据请求和失败重试会增加处理延迟与不确定性。</p>
<p>预渲染或 SSR 可以让爬虫和用户更早看到内容，但不应输出一个只有 loading 的空壳，再把真正正文全部留到客户端请求。读者还要考虑页面的 hydration 和交互脚本是否在之后正确接管。</p>
<p>同一 URL 的服务端 HTML 与客户端首次渲染必须保持稳定，不能因为当前时间、随机数、用户时区或客户端登录状态不同而产生大量 mismatch。个性化内容也不能被公共 CDN 错误缓存给其他用户。</p>
<h2>状态码和页面身份比 meta 更重要</h2>
<p>不存在的题目应返回真实的 404 或适当的错误状态，而不是返回一份内容为空的 200 首页。权限不足、临时故障和永久移除也应根据业务使用合适状态。统一返回 200 会让用户、爬虫和监控都难以区分页面是否存在。</p>
<p>每个可索引页面应有稳定、唯一且与正文一致的 <code>&lt;title&gt;</code> 和描述；canonical 应指向规范 URL，不能所有页面都指向首页。分页、语言版本、查询参数和重定向要有统一规则，避免同一内容产生大量相互竞争的地址。</p>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">title</span>&gt;</span>HTTP 预检请求怎样工作？｜前端题库<span class="hljs-tag">&lt;/<span class="hljs-name">title</span>&gt;</span>
<span class="hljs-tag">&lt;<span class="hljs-name">meta</span> <span class="hljs-attr">name</span>=<span class="hljs-string">&quot;description&quot;</span> <span class="hljs-attr">content</span>=<span class="hljs-string">&quot;理解 CORS 预检的触发条件、响应头和实际请求边界。&quot;</span>&gt;</span>
<span class="hljs-tag">&lt;<span class="hljs-name">link</span> <span class="hljs-attr">rel</span>=<span class="hljs-string">&quot;canonical&quot;</span> <span class="hljs-attr">href</span>=<span class="hljs-string">&quot;https://fe.example.com/questions/http-cors/&quot;</span>&gt;</span>
</code></pre></div>
<p>这些标签只能描述页面，不能把一个没有正文、没有链接或无法访问的页面变成高质量结果。标题和描述也不应包含误导性关键词或与页面不一致的内容。</p>
<h2>深链接必须在生产部署中成立</h2>
<p>客户端路由使用 <code>/questions/http-cors/</code> 时，用户直接打开或刷新该地址，托管平台必须返回正确的入口 HTML 或已经预生成的页面。开发服务器的 history fallback 不代表静态托管平台也会自动回退。</p>
<p>静态站点可以预生成公开页面，或配置平台支持的回退规则；如果所有未知路径都返回首页，应用还要在客户端判断路径是否存在，并尽可能通过预生成或服务端状态码避免错误页面被当成成功页面。</p>
<p>部署在仓库子路径时，资源 base、canonical、Sitemap、Open Graph 地址和路由前缀必须一致；迁移到自定义域名后要重新检查。<code>/assets/app.js</code> 和 <code>assets/app.js</code> 在不同部署位置可能指向完全不同的资源。</p>
<h2>robots、Sitemap 和 canonical 各自解决不同问题</h2>
<p><code>robots.txt</code> 可以表达抓取规则，但不是访问控制，也不能阻止一个已经公开的 URL 被用户访问。Sitemap 帮助搜索引擎发现一组规范 URL，不保证每个 URL 都被收录。canonical 表达重复或相近页面中希望作为规范的地址，也不是强制命令。</p>
<p>不要在 robots 中禁止搜索引擎抓取页面，又期待它读取页面内的 canonical 和 meta；爬虫可能无法获得这些内容。敏感页面应使用真正的认证和授权，不能依赖 robots 隐藏。</p>
<p>Sitemap 中的地址必须是正式可访问的 HTTPS URL，不应混入开发端口、预览域名、查询参数或已经删除的页面。发布后要检查 Sitemap、404、重定向和页面实际响应是否一致。</p>
<h2>JavaScript 渲染会带来额外的失败路径</h2>
<p>客户端脚本可能因为资源 404、CSP、浏览器兼容、网络超时或数据接口失败而无法生成正文。关键内容应有服务端或构建时回退，或者至少让没有脚本时仍能阅读和导航；交互增强失败不应让所有正文消失。</p>
<p>链接优先使用真实的 <code>a href</code>，让复制地址、新标签页、爬虫和无脚本环境都有合理行为。点击事件里手动调用 <code>history.pushState</code> 不能自动获得所有这些语义，路由库也需要正确处理标题、焦点、滚动和错误状态。</p>
<h2>性能和可访问性也会影响搜索体验</h2>
<p>SSR 或 SSG 让 HTML 更早到达，不会自动减少客户端 JavaScript、图片和字体成本。过大的 hydration、布局移动、长任务和慢交互仍会损害真实用户体验。页面应同时测量内容出现、布局稳定、交互响应和真实用户数据。</p>
<p>预渲染的正文也要保持语义 HTML、可访问名称和键盘路径。搜索优化与无障碍经常共享相同基础：清楚的标题、链接、结构、替代文本和有意义的内容。为爬虫堆砌隐藏关键词，可能同时损害用户和维护者理解。</p>
<p>上线前应从正式域名验证：直接访问和刷新深链接、状态码、正文 HTML、canonical、Open Graph、Sitemap、robots、图标、资源前缀和客户端接管。搜索工具的检查结果只能作为一种证据，不能替代对部署链路和真实用户流程的验证。</p>`};export{e as default};