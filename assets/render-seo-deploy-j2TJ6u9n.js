var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>搜索引擎和分享卡片最先看到的，是服务器返回的那份 HTML。CSR 页面的初始 HTML 通常只有一个空壳，正文要等脚本跑完才出来。Google 能执行 JavaScript，但渲染要排队，有延迟；很多社交平台的卡片抓取器根本不执行 JavaScript，只读初始 HTML 里的 <code>og:</code> 标签。</p>
<p>SSR 在每次请求时生成完整 HTML，SSG 和预渲染在构建时就把每个页面生成好，三者都让正文、标题和链接出现在初始 HTML 里，抓取更可靠。区别在部署：SSR 需要一直运行的服务端，SSG 和预渲染的产物可以放在静态托管上。</p>
<p>部署 SPA 时，要让服务器把未知路径回退到 <code>index.html</code>，否则刷新深层页面会 404；但这样一来所有路径都返回 200，又要想办法让真正不存在的路径返回 404。</p>
<p>要注意，预渲染只能保证内容读得到。能不能收录、排第几，还取决于内容质量、链接和搜索引擎自己的策略。初始 HTML 里具体要放哪些标签，见<a href="/questions/render-seo-checklist/">《前端 SEO 有哪些具体手段？》</a>。</p>
</blockquote>
<h2>不同渲染方式下，初始 HTML 里有什么</h2>
<table><thead><tr><th>渲染方式</th><th>HTML 何时生成</th><th>初始 HTML 里有没有正文</th><th>部署形态</th></tr></thead><tbody><tr><td>CSR</td><td>浏览器执行脚本后</td><td>通常只有空壳</td><td>静态托管</td></tr><tr><td>SSR</td><td>每次请求时</td><td>有</td><td>需要服务端运行</td></tr><tr><td>SSG / 预渲染</td><td>构建时</td><td>有</td><td>静态托管</td></tr></tbody></table>
<p>CSR 的问题不在于“搜索引擎完全看不到”，而是正文依赖一次额外的渲染：Google 要排队执行脚本，脚本失败或超时，抓到的就是空壳；不执行脚本的分享抓取器则一定看不到。SSR 和 SSG 把这一步提前到了服务端或构建时。</p>
<p>不管哪种方式，每个页面的 <code>&lt;title&gt;</code>、description、<code>canonical</code> 都要和正文一起出现在 HTML 里，页面之间用 <code>&lt;a href&gt;</code> 连接。逐项的写法和检查表见<a href="/questions/render-seo-checklist/">《前端 SEO 有哪些具体手段？》</a>。</p>
<h2>不存在的页面怎样返回 404</h2>
<p>不存在的页面要返回 HTTP 404，而不是返回 200 再显示“未找到”，后者叫软 404。做法取决于渲染方式。SSR 时，如果查出来数据不存在，要在开始渲染前就把状态设成 404，Next.js 里是调用 <code>notFound()</code>。纯静态站点要提供一个 <code>404.html</code>，并确认托管平台对不存在的路径确实返回了 404。</p>
<h2>SPA 刷新深层页面为什么会 404</h2>
<p>用 history 模式的路由时，地址栏里是 <code>/questions/42</code> 这样的路径。在站内点击跳转没问题，因为是前端路由处理的。可是用户一刷新，浏览器会真的去服务器请求 <code>/questions/42</code> 这个文件，服务器上没有，就 404 了。</p>
<p>所以要让服务器把找不到的路径都回退到 <code>index.html</code>，交给前端路由：</p>
<div class="not-prose code-block"><div class="code-language">nginx</div><pre><code class="hljs language-nginx">location / {
  try_files $uri $uri/ /index.html;
}
</code></pre></div>
<p>可这样又带来一个问题：所有不存在的路径也都返回 200 了。更好的做法是预渲染已知的页面，其余路径返回 404 页面；或者由前端路由显示 404，同时加上 <code>&lt;meta name=&quot;robots&quot; content=&quot;noindex&quot;&gt;</code>。</p>
<p>hash 模式，也就是 <code>/#/questions/42</code>，不需要配服务器，因为 <code>#</code> 后面的部分根本不会发给服务器。也正因为这样，它对 SEO 不利。</p>
<h2>常见追问</h2>
<p><strong>CSR 一定对 SEO 不利吗？</strong></p>
<blockquote>
<p>不一定就收录不了，但有渲染延迟和渲染失败的风险，而且分享卡片通常显示不出来。</p>
</blockquote>
<p><strong>不同渲染方式怎么选？</strong></p>
<blockquote>
<p>要按页面类型分别看，详见<a href="/questions/render-ssr-ssg/">《CSR、SSR、SSG 和混合渲染如何选择？》</a>。</p>
</blockquote>`};export{e as default};