var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>说“SSR 有缓存”，其实可能指四个不同的地方。第一层是 HTTP 缓存：浏览器和 CDN 按 <code>Cache-Control</code>、<code>ETag</code>、<code>Vary</code> 复用整个响应。<code>public</code> 表示 CDN 可以共享，<code>private</code> 表示只能存在用户自己的浏览器里。</p>
<p>第二层是请求内去重，比如 React 的 <code>cache</code>、Next.js 对 <code>fetch</code> 的记忆，只在一次渲染里有效。第三层是框架的数据缓存，比如 Next.js 的 <code>&#x27;use cache&#x27;</code>、Nuxt 的 <code>cachedEventHandler</code>，跨请求保存，要按时间或标签失效。第四层是客户端状态缓存，比如 TanStack Query、Pinia 里的数据，存在浏览器内存里，用户登出时要清空。</p>
<p>每层的范围和失效方式都不一样，所以出问题时要先搞清楚是哪一层。</p>
<p>最要紧的一条：带用户名、权限、订单这些个性化内容的响应，不能用 <code>public</code> 缓存。缓存键要包含用户、语言、权限等所有会影响结果的因素，否则一个人的页面可能发给另一个人。</p>
</blockquote>
<h2>四层放在一起比</h2>
<table><thead><tr><th>层</th><th>存在哪里</th><th>范围</th><th>如何失效</th></tr></thead><tbody><tr><td>HTTP / CDN</td><td>浏览器、CDN 节点</td><td>按 URL 和 <code>Vary</code></td><td><code>max-age</code> 到期、清除 CDN、改 URL</td></tr><tr><td>请求内去重</td><td>服务端内存</td><td>一次请求</td><td>请求结束</td></tr><tr><td>框架数据缓存</td><td>服务端内存或共享存储</td><td>跨请求、跨用户</td><td>时间、标签、路径失效</td></tr><tr><td>客户端状态</td><td>浏览器内存</td><td>当前标签页</td><td>重新获取、手动清除</td></tr></tbody></table>
<p>注意框架数据缓存那一行的范围是“跨用户”。这就是为什么个性化数据放进去会出事。</p>
<h2>公共页面怎么设</h2>
<p>文章、商品详情这种对所有人都一样的页面，可以这样设：</p>
<div class="not-prose code-block"><div class="code-language">http</div><pre><code class="hljs language-http">Cache-Control: public, max-age=60, stale-while-revalidate=300
</code></pre></div>
<p>意思是 CDN 可以缓存 60 秒。过了 60 秒以后的 5 分钟内，CDN 可以先把旧内容返回给用户，同时在后台去取新的。这样用户不用等，内容也不会太旧。</p>
<h2>个性化页面怎么设</h2>
<div class="not-prose code-block"><div class="code-language">http</div><pre><code class="hljs language-http">Cache-Control: private, no-store
</code></pre></div>
<p>如果一个页面大部分是公共内容，只有头像、购物车数量是个人的，整页都不缓存就太浪费了。可以把页面当公共内容缓存，个性化的部分在客户端单独请求；或者用框架的部分预渲染，让个性化部分在请求时生成。</p>
<p>有人会想用 <code>Vary: Cookie</code> 让 CDN 按用户区分缓存，这不可靠。Cookie 里通常有各种和页面无关的字段，每个人都不一样，缓存几乎命中不了。更危险的是，一旦 CDN 配置忽略了 <code>Vary</code>，就会把一个人的页面发给其他人。</p>
<h2>静态资源怎么设</h2>
<p>打包出来的 JS、CSS 文件名里带了内容哈希，比如 <code>app.3f9a1c.js</code>，内容一变名字就变。所以同一个名字的文件永远不会变，可以放心长期缓存：</p>
<div class="not-prose code-block"><div class="code-language">http</div><pre><code class="hljs language-http">Cache-Control: public, max-age=31536000, immutable
</code></pre></div>
<p>HTML 就不一样了，它的文件名不变。如果也长期缓存，用户拿到的是旧 HTML，里面引用的是已经删掉的旧资源，页面就坏了。所以 HTML 要设短缓存，或者每次都重新验证。</p>
<h2>发布和回滚时要注意什么</h2>
<p>发布后要清掉 CDN 里的 HTML 缓存，但旧版本的静态资源要保留一段时间。因为有用户还开着旧页面，他们按需加载代码块时请求的是旧文件，删了就会 404。</p>
<p>回滚代码时，框架的数据缓存和 CDN 缓存里可能还存着新版本生成的内容，要一起清掉，否则回滚了也看不出效果。</p>
<h2>常见追问</h2>
<p><strong>怎么确认响应命中了哪一层缓存？</strong></p>
<blockquote>
<p>看响应头里的 <code>Age</code>、<code>Cache-Status</code>，还有 CDN 自己定义的命中头。</p>
</blockquote>
<p><strong>SSG 页面还需要缓存策略吗？</strong></p>
<blockquote>
<p>需要。构建出来的 HTML 照样要设合适的 <code>Cache-Control</code>，内容更新以后也要清 CDN。</p>
</blockquote>`};export{e as default};