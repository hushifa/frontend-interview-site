var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>区分这三种方式，就看页面主要内容的 HTML 是什么时候、在哪里生成的。CSR 是客户端渲染，服务器只返回一个空壳和脚本，浏览器执行完脚本才出内容。SSR 是服务端渲染，每次请求由服务器现做一份 HTML。SSG 是静态生成，构建时就把 HTML 做好。</p>
<p>各有代价。CSR 只要静态托管，但首屏要等脚本下载执行，搜索收录也多一层不确定。SSR 内容实时、可以个性化，但要运行服务器，首字节时间受数据请求速度影响。SSG 能放 CDN，又快又便宜，但内容更新要重新构建，或者用 ISR 这类增量更新。</p>
<p>有一点容易误解：SSR 和 SSG 让服务器或构建过程承担了渲染，有机会少发 JavaScript。可如果整页还要 hydration，客户端照样得下载执行同一套应用代码，TBT 和 INP 不一定变好。</p>
<p>实际项目一般按页面选。公开的文档和商品页用 SSG 或带缓存的 SSR，个性化页面用 SSR，登录后的后台可以用 CSR。</p>
</blockquote>
<h2>三种方式放在一起比</h2>
<table><thead><tr><th></th><th>CSR</th><th>SSR</th><th>SSG</th></tr></thead><tbody><tr><td>HTML 生成时机</td><td>浏览器</td><td>每次请求</td><td>构建时</td></tr><tr><td>首屏内容</td><td>等脚本执行</td><td>响应中直接包含</td><td>响应中直接包含</td></tr><tr><td>个性化</td><td>支持</td><td>支持</td><td>需要客户端补充</td></tr><tr><td>部署</td><td>静态托管</td><td>需要服务器 / 边缘函数</td><td>静态托管</td></tr><tr><td>数据新鲜度</td><td>实时</td><td>实时</td><td>构建时</td></tr></tbody></table>
<p>SSG 的个性化为什么要客户端补充？因为 HTML 在构建时就定了，那时还不知道是谁来访问，只能等页面到了浏览器，再请求用户相关的数据填进去。</p>
<h2>不同页面怎么选</h2>
<p>文档站和博客用 SSG。内容在构建时就确定了，CDN 直接返回，最快。</p>
<p>电商商品详情页可以用 SSG 或 ISR 生成公共部分。价格、库存变化快，在客户端或请求时再补上。</p>
<p>新闻首页、搜索结果每次都不一样，用 SSR，再配合短时间的 CDN 缓存，减轻服务器压力。</p>
<p>登录后的管理后台不需要搜索收录，交互又多，用 CSR 就够了。</p>
<h2>还有哪些更细的组合</h2>
<p>这三种之间还有中间形态：</p>
<ul>
<li>ISR，增量静态再生：页面先按 SSG 提供，过期后在后台重新生成，下一位访问者拿到新版本。</li>
<li>流式 SSR：先把页面外壳发出去，慢的部分好了再流式补上，详见<a href="/questions/rendering-streaming-ssr/">《React 流式 SSR 解决什么问题？》</a>。</li>
<li>部分预渲染：静态外壳在构建时生成，动态部分在请求时填充，Next.js 的 Cache Components 就是这样做的。</li>
<li>Islands：页面大部分是静态 HTML，只有交互区域加载 JavaScript，详见<a href="/questions/frameworks-astro-islands/">《Astro Islands 架构怎样减少客户端 JavaScript？》</a>。</li>
</ul>
<h2>容易忽略的成本</h2>
<p>SSR 和 SSG 都有 hydration。页面看得见但还点不了的那段时间，长短取决于客户端脚本有多大。</p>
<p>SSR 的服务器要承担渲染开销，流量大了就得加缓存、扩容。</p>
<p>SSG 页面一多，构建时间会变长。可以只预生成热门页面，其余的按需生成。</p>
<p>缓存层的区分详见<a href="/questions/rendering-cache-semantics/">《SSR 和 SSG 中的缓存层应该怎样区分？》</a>，SEO 相关的要求详见<a href="/questions/render-seo-deploy/">《前端渲染方式怎样影响 SEO 和部署？》</a>。</p>
<h2>常见追问</h2>
<p><strong>SSR 一定比 CSR 快吗？</strong></p>
<blockquote>
<p>不一定。首屏内容通常出来得更早，但服务器响应慢的话，首字节反而更晚；能交互的时间也不一定更早，因为还要等 hydration。</p>
</blockquote>
<p><strong>静态托管能做 SSR 吗？</strong></p>
<blockquote>
<p>不能。静态托管只能返回事先生成好的文件，没有地方在请求时运行渲染代码。</p>
</blockquote>`};export{e as default};