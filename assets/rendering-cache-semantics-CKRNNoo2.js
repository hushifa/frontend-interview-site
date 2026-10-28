var e={answerHtml:`<h2>简答</h2>
<ul>
<li>HTTP 缓存：浏览器和 CDN 按 <code>Cache-Control</code>、<code>ETag</code>、<code>Vary</code> 复用整个响应，<code>public</code> 可以被 CDN 共享，<code>private</code> 只能存在用户浏览器中。</li>
<li>请求内去重：如 React <code>cache</code>、Next.js 对 <code>fetch</code> 的记忆，只在一次渲染中有效。</li>
<li>框架数据缓存：如 Next.js 的 <code>&#x27;use cache&#x27;</code>、Nuxt 的 payload，跨请求保存，需要按时间或标签失效。</li>
<li>客户端状态缓存：如 TanStack Query、Pinia 中保存的数据，存在浏览器内存里，登出时要清空。</li>
<li>个性化内容（含用户名、权限、订单）不能以 <code>public</code> 缓存；缓存键要包含用户、语言、权限等所有影响结果的因素。</li>
</ul>
<h2>四层对比</h2>
<table><thead><tr><th>层</th><th>存在哪里</th><th>范围</th><th>如何失效</th></tr></thead><tbody><tr><td>HTTP / CDN</td><td>浏览器、CDN 节点</td><td>按 URL 和 <code>Vary</code></td><td><code>max-age</code> 到期、清除 CDN、改 URL</td></tr><tr><td>请求内去重</td><td>服务端内存</td><td>一次请求</td><td>请求结束</td></tr><tr><td>框架数据缓存</td><td>服务端内存或共享存储</td><td>跨请求、跨用户</td><td>时间、标签、路径失效</td></tr><tr><td>客户端状态</td><td>浏览器内存</td><td>当前标签页</td><td>重新获取、手动清除</td></tr></tbody></table>
<h2>公共页面</h2>
<div class="not-prose code-block"><div class="code-language">http</div><pre><code class="hljs language-http">Cache-Control: public, max-age=60, stale-while-revalidate=300
</code></pre></div>
<p>文章、商品详情等对所有人相同的页面，CDN 缓存 60 秒，之后 5 分钟内可以先返回旧内容，同时在后台重新获取。</p>
<h2>个性化页面</h2>
<div class="not-prose code-block"><div class="code-language">http</div><pre><code class="hljs language-http">Cache-Control: private, no-store
</code></pre></div>
<p>如果页面大部分是公共内容，只有头像、购物车数量是个性化的，可以把页面作为公共缓存，个性化部分在客户端单独请求，或使用框架的部分预渲染，让个性化部分在请求时生成。</p>
<p>不要只靠 <code>Vary: Cookie</code> 让 CDN 区分用户：Cookie 中常有各种无关字段，缓存几乎无法命中；一旦 CDN 配置忽略了 <code>Vary</code>，就会把一个人的页面发给其他人。</p>
<h2>静态资源</h2>
<p>带内容哈希的 JS、CSS 文件名（<code>app.3f9a1c.js</code>）内容变化就会换名字，可以长期缓存：</p>
<div class="not-prose code-block"><div class="code-language">http</div><pre><code class="hljs language-http">Cache-Control: public, max-age=31536000, immutable
</code></pre></div>
<p>HTML 文件名不变，应设置较短的缓存或每次重新验证，否则用户拿到的旧 HTML 会引用已经删除的旧资源。</p>
<h2>发布和回滚</h2>
<ul>
<li>发布后清除 CDN 中的 HTML 缓存，保留一段时间的旧版本静态资源，正在使用旧页面的用户按需加载代码块时才不会 404。</li>
<li>回滚代码时，框架的数据缓存和 CDN 缓存可能仍保存着新版本生成的内容，需要一起清除。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li>怎么确认响应命中了哪层缓存？查看响应头中的 <code>Age</code>、<code>Cache-Status</code>，以及 CDN 自定义的命中头。</li>
<li>SSG 页面需要缓存策略吗？需要，构建出的 HTML 仍要设置合适的 <code>Cache-Control</code>，内容更新后也要清除 CDN。</li>
</ul>`};export{e as default};