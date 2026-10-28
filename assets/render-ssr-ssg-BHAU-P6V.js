var e={answerHtml:`<h2>简答</h2>
<ul>
<li>CSR：服务器返回空壳 HTML 和脚本，浏览器执行后渲染内容；只需静态托管，首屏内容依赖脚本下载和执行，搜索收录存在额外的不确定性。</li>
<li>SSR：每次请求在服务器渲染 HTML；内容实时、可以个性化，需要运行服务器，首字节时间受数据请求速度影响。</li>
<li>SSG：构建时生成 HTML，可以放在 CDN 上，速度快、成本低；内容更新需要重新构建，或使用 ISR 等增量更新。</li>
<li>SSR 和 SSG 让服务器或构建过程承担渲染，有机会少发客户端 JavaScript；但如果再对整页做 hydration，客户端仍要下载并执行同一套应用代码，TBT 和 INP 未必改善。</li>
<li>按页面选择：公开的文档和商品页用 SSG 或带缓存的 SSR，个性化页面用 SSR，登录后的后台可以用 CSR。</li>
</ul>
<h2>对比</h2>
<table><thead><tr><th></th><th>CSR</th><th>SSR</th><th>SSG</th></tr></thead><tbody><tr><td>HTML 生成时机</td><td>浏览器</td><td>每次请求</td><td>构建时</td></tr><tr><td>首屏内容</td><td>等脚本执行</td><td>响应中直接包含</td><td>响应中直接包含</td></tr><tr><td>个性化</td><td>支持</td><td>支持</td><td>需要客户端补充</td></tr><tr><td>部署</td><td>静态托管</td><td>需要服务器 / 边缘函数</td><td>静态托管</td></tr><tr><td>数据新鲜度</td><td>实时</td><td>实时</td><td>构建时</td></tr></tbody></table>
<h2>典型场景</h2>
<ul>
<li>文档站、博客：SSG。内容在构建时确定，CDN 直接返回。</li>
<li>电商商品详情：SSG 或 ISR 生成公共部分，价格、库存在客户端或请求时补充。</li>
<li>新闻首页、搜索结果：SSR，配合短时间的 CDN 缓存。</li>
<li>登录后的管理后台：CSR。不需要搜索收录，交互密集。</li>
</ul>
<h2>更细的组合</h2>
<ul>
<li>ISR（增量静态再生）：页面先按 SSG 提供，过期后在后台重新生成，下一位访问者拿到新版本。</li>
<li>流式 SSR：先发送页面外壳，慢的部分就绪后再流式补上，见<a href="/questions/rendering-streaming-ssr/">《React 流式 SSR 解决什么问题？》</a>。</li>
<li>部分预渲染：静态外壳在构建时生成，动态部分在请求时填充，Next.js 的 Cache Components 采用这种方式。</li>
<li>Islands：大部分页面是静态 HTML，只有交互区域加载 JavaScript，见<a href="/questions/frameworks-astro-islands/">《Astro Islands 架构怎样减少客户端 JavaScript？》</a>。</li>
</ul>
<h2>不要忽略的成本</h2>
<ul>
<li>SSR 和 SSG 都有 hydration：首屏可见但还不能点击的时间，取决于客户端脚本的大小。</li>
<li>SSR 的服务器要承担渲染开销，流量大时需要缓存和扩容。</li>
<li>SSG 页面数量很多时构建时间会变长，可以只预生成热门页面，其余按需生成。</li>
</ul>
<p>缓存层的区分见<a href="/questions/rendering-cache-semantics/">《SSR 和 SSG 中的缓存层应该怎样区分？》</a>，SEO 相关要求见<a href="/questions/render-seo-deploy/">《前端渲染方式怎样影响 SEO 和部署？》</a>。</p>
<h2>常见追问</h2>
<ul>
<li>SSR 一定比 CSR 快吗？首屏内容通常更早出现，但服务器响应慢时首字节会更晚，能交互的时间也不一定更早。</li>
<li>静态托管能做 SSR 吗？不能，静态托管只能提供预先生成的文件。</li>
</ul>`};export{e as default};