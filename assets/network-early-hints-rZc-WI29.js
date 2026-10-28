var e={answerHtml:`<h2>简答</h2>
<ul>
<li>103 是信息性响应，在最终的 200 之前发送，只携带 <code>Link</code> 头。</li>
<li>浏览器收到后立即处理其中的 <code>preconnect</code> 和 <code>preload</code>，利用服务器&quot;思考时间&quot;提前加载。</li>
<li>适合首字节慢的页面，例如服务端渲染要查数据库；首字节本来就快的静态页面收益很小。</li>
<li>浏览器只处理第一个 103 响应；建议只在 HTTP/2 及以上发送，旧客户端可能处理不好信息性响应。</li>
<li>Server Push 是服务器主动推送资源，浏览器无法判断是否已有缓存，常常浪费带宽，Chrome 已移除；103 只发提示，由浏览器决定是否下载。</li>
</ul>
<h2>响应示例</h2>
<div class="not-prose code-block"><div class="code-language">http</div><pre><code class="hljs language-http">HTTP/2 103
Link: &lt;https://cdn.example&gt;; rel=preconnect; crossorigin
Link: &lt;/assets/app.css&gt;; rel=preload; as=style

HTTP/2 200
Content-Type: text/html
Link: &lt;/assets/app.css&gt;; rel=preload; as=style

&lt;!doctype html&gt;...
</code></pre></div>
<p>最终响应仍需要正常引用这些资源，103 只是提前启动。</p>
<h2>提示什么</h2>
<ul>
<li>适合：首屏 CSS、关键字体、首屏主图、关键第三方域名的 <code>preconnect</code>。</li>
<li>不适合：因用户而异的资源、可能不会用到的资源。103 在路由和数据确定前发送，提示内容应该对所有访问这个 URL 的用户都成立。</li>
</ul>
<h2>部署要点</h2>
<ul>
<li>多数情况由 CDN 生成 103：CDN 记住源站上次 200 响应里的 <code>Link</code> 头，下次请求时先发 103。</li>
<li>最终响应如果是跨源重定向，浏览器会丢弃这次 103 的提示。</li>
<li>103 中可以带 <code>Content-Security-Policy</code>，浏览器处理提示时会遵守。</li>
</ul>
<h2>验证效果</h2>
<ul>
<li>DevTools Network 中资源的 Initiator 会显示来自 Early Hints。</li>
<li>对比开启前后的 LCP 和资源开始时间，用真实用户数据确认收益。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li>为什么不直接在 HTML 头部写 preload？HTML 本身还没生成，103 能比 HTML 更早到达浏览器。</li>
<li>浏览器支持怎样？各浏览器的支持范围和限制不同，部署前查看 MDN 的兼容表；不支持的浏览器会忽略 103，不会出错。</li>
</ul>`};export{e as default};