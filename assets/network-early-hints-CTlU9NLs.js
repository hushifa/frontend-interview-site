var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>服务端渲染的页面，服务器可能要查几百毫秒数据库才能吐出 HTML。这段时间浏览器什么都做不了。103 Early Hints 就是让服务器先回一个“提前提示”，在最终的 200 之前发出。</p>
<p>103 是信息性响应，主要带 <code>Link</code> 头，写上 preconnect 和 preload。浏览器收到后马上处理，利用服务器“思考”的时间提前建连、下载关键资源。它也可以带 <code>Content-Security-Policy</code>，约束这些预加载。</p>
<p>所以它适合首字节慢的页面。首字节本来就很快的静态页面，收益很小。</p>
<p>要注意，浏览器只处理第一个 103；建议只在 HTTP/2 及以上发，旧客户端可能处理不好信息性响应。另外，它和 Server Push 不一样：Push 是服务器硬塞资源，浏览器没法说“我已经有缓存了”，常常浪费带宽，Chrome 已经移除；103 只发提示，下不下由浏览器决定。</p>
</blockquote>
<h2>响应长什么样</h2>
<div class="not-prose code-block"><div class="code-language">http</div><pre><code class="hljs language-http">HTTP/2 103
Link: &lt;https://cdn.example&gt;; rel=preconnect; crossorigin
Link: &lt;/assets/app.css&gt;; rel=preload; as=style

HTTP/2 200
Content-Type: text/html
Link: &lt;/assets/app.css&gt;; rel=preload; as=style

&lt;!doctype html&gt;...
</code></pre></div>
<p>同一个请求先后收到两个响应。103 让浏览器先去连 CDN、先下 CSS；等 200 和 HTML 到了，CSS 可能已经下好了。</p>
<p>最终的 HTML 里仍然要正常引用这些资源。103 只是让下载提前开始，不能代替引用。</p>
<h2>该提示哪些资源</h2>
<p>适合放进 103 的，是首屏 CSS、关键字体、首屏主图，以及关键第三方域名的 <code>preconnect</code>。</p>
<p>不适合的，是因人而异的资源，以及可能用不上的资源。原因是 103 发出去的时候，服务器还没确定路由和数据，所以提示的内容必须对所有访问这个 URL 的用户都成立。</p>
<h2>部署时要注意什么</h2>
<p>大多数情况下 103 是 CDN 生成的。CDN 记住源站上一次 200 响应里的 <code>Link</code> 头，下次有请求进来，先替源站发出 103。</p>
<p>如果最终响应是一个跨源重定向，浏览器会丢掉这次 103 的提示。</p>
<p>103 里带的 <code>Content-Security-Policy</code>，浏览器处理提示时会遵守。</p>
<h2>怎么验证效果</h2>
<p>在 DevTools Network 面板里，资源的 Initiator 会显示来自 Early Hints。然后对比开启前后的 LCP 和资源开始时间，用真实用户数据确认收益。</p>
<h2>常见追问</h2>
<p><strong>为什么不直接在 HTML 头部写 preload？</strong></p>
<blockquote>
<p>因为 HTML 本身还没生成出来。103 能比 HTML 更早到达浏览器。</p>
</blockquote>
<p><strong>浏览器支持情况怎样？</strong></p>
<blockquote>
<p>各浏览器支持的范围和限制不同，部署前查 MDN 的兼容表。不支持的浏览器会忽略 103，不会出错。</p>
</blockquote>`};export{e as default};