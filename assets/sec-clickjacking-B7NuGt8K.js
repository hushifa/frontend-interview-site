var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>点击劫持不需要注入任何脚本。攻击者把你的页面放进一个透明的 iframe，盖在一个“领奖”按钮上面。用户以为点的是领奖，其实点的是你页面上的“确认转账”。</p>
<p>防护要由被嵌入的页面自己声明，在响应头里写 <code>Content-Security-Policy: frame-ancestors &#x27;none&#x27;</code>，意思是谁都不能嵌入我。<code>&#x27;self&#x27;</code> 表示只允许同源，也可以列出具体的来源。</p>
<p>它会检查整条祖先链，任何一层不被允许都会阻止加载。和旧的 <code>X-Frame-Options</code> 同时设置时，支持 CSP 的浏览器以 <code>frame-ancestors</code> 为准。</p>
<p>要注意，它只能通过响应头设置，写在 <code>&lt;meta&gt;</code> 里无效，也不会从 <code>default-src</code> 继承。</p>
</blockquote>
<h2>怎么写</h2>
<div class="not-prose code-block"><div class="code-language">http</div><pre><code class="hljs language-http"># 禁止任何页面嵌入
Content-Security-Policy: frame-ancestors &#x27;none&#x27;

# 只允许同源和指定的管理后台
Content-Security-Policy: frame-ancestors &#x27;self&#x27; https://admin.example.com
</code></pre></div>
<p>“整条祖先链”是什么意思？假如管理后台把你的页面嵌进来，而管理后台自己又被一个陌生网站嵌套着，那这条链上的陌生网站不在允许列表里，你的页面照样加载不了。这样攻击者就没办法借一个被允许的中间页来套娃。</p>
<p>如果还要兼容非常旧的浏览器，可以同时发 <code>X-Frame-Options: DENY</code> 或 <code>SAMEORIGIN</code>。可是它不支持多个来源的白名单，以前用来指定来源的 <code>ALLOW-FROM</code> 也已经废弃了，所以新浏览器都以 <code>frame-ancestors</code> 为准。</p>
<h2>它和 frame-src 有什么区别</h2>
<p>这两个名字很像，方向正好相反。<code>frame-src</code> 管的是我的页面可以在 iframe 里加载谁，<code>frame-ancestors</code> 管的是谁可以把我的页面放进 iframe。</p>
<div class="not-prose code-block"><div class="code-language">http</div><pre><code class="hljs language-http">Content-Security-Policy: frame-src https://reports.example.com; frame-ancestors &#x27;none&#x27;
</code></pre></div>
<p>这条策略的效果是：后台可以嵌入报表，但后台自己不能被别人嵌入。报表最后能不能显示出来，还要看报表页面自己的 <code>frame-ancestors</code> 是否允许后台嵌入它。</p>
<h2>怎么确认配置生效了</h2>
<p>先在 Network 面板看最终的 HTML 响应有没有这个头。登录页、错误页这些路由很容易漏配，要一起检查。然后从一个不被允许的来源实际嵌入一下，控制台会提示违反了 <code>frame-ancestors</code>。</p>
<p>用的是没办法配置响应头的静态托管怎么办？不能靠 <code>&lt;meta&gt;</code> 补，因为那里写了也无效，需要在 CDN 或代理层加这个头。</p>
<h2>常见追问</h2>
<p><strong>页面需要被合作方嵌入怎么办？</strong></p>
<blockquote>
<p>只列出具体合作方的来源。不要写 <code>https:</code> 这种宽泛的来源，那等于允许所有 HTTPS 网站嵌入。</p>
</blockquote>
<p><strong>除了 frame-ancestors 还有别的防护吗？</strong></p>
<blockquote>
<p>高风险操作可以要求二次确认或者重新认证，这样即使用户被骗点了一下，也完不成操作。另外在嵌入场景下，浏览器对 iframe 里的 Cookie 还有 SameSite 和第三方 Cookie 的限制，被嵌入的页面不一定拿得到登录态。</p>
</blockquote>`};export{e as default};