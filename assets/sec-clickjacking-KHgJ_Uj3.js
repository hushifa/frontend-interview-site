var e={answerHtml:`<h2>简答</h2>
<ul>
<li>点击劫持不需要注入脚本：攻击者把你的页面放进透明 iframe，覆盖在诱导按钮上，用户以为点的是&quot;领奖&quot;，实际点的是&quot;确认转账&quot;。</li>
<li>防护由被嵌入的页面声明：<code>Content-Security-Policy: frame-ancestors &#x27;none&#x27;</code>。</li>
<li><code>frame-ancestors</code> 检查整条祖先链，任何一层不被允许都会阻止加载。</li>
<li>只能通过响应头设置，写在 <code>&lt;meta&gt;</code> 里无效，也不会从 <code>default-src</code> 继承。</li>
<li>同时设置时，支持 CSP 的浏览器以 <code>frame-ancestors</code> 为准，忽略旧的 <code>X-Frame-Options</code>。</li>
</ul>
<h2>写法</h2>
<div class="not-prose code-block"><div class="code-language">http</div><pre><code class="hljs language-http"># 禁止任何页面嵌入
Content-Security-Policy: frame-ancestors &#x27;none&#x27;

# 只允许同源和指定的管理后台
Content-Security-Policy: frame-ancestors &#x27;self&#x27; https://admin.example.com
</code></pre></div>
<p>兼容非常旧的浏览器时可以同时发送 <code>X-Frame-Options: DENY</code> 或 <code>SAMEORIGIN</code>。它不支持多个来源白名单，<code>ALLOW-FROM</code> 已被废弃。</p>
<h2>和 frame-src 的区别</h2>
<ul>
<li><code>frame-src</code>：我的页面可以在 iframe 里加载谁。</li>
<li><code>frame-ancestors</code>：谁可以把我的页面放进 iframe。</li>
</ul>
<div class="not-prose code-block"><div class="code-language">http</div><pre><code class="hljs language-http">Content-Security-Policy: frame-src https://reports.example.com; frame-ancestors &#x27;none&#x27;
</code></pre></div>
<p>后台可以嵌入报表，但后台自己不能被嵌入。报表能否显示，还取决于报表页面自己的 <code>frame-ancestors</code>。</p>
<h2>验证</h2>
<ul>
<li>在 Network 面板确认最终 HTML 响应带有该头，包括登录页、错误页等容易漏配的路由。</li>
<li>从一个不被允许的来源实际嵌入页面，控制台会提示违反 <code>frame-ancestors</code>。</li>
<li>无法配置响应头的静态托管不能靠 <code>&lt;meta&gt;</code> 补上，需要在 CDN 或代理层配置。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li>需要被合作方嵌入怎么办？只列出具体合作方来源，不要写 <code>https:</code> 这类宽泛来源。</li>
<li>还有别的防护吗？高风险操作要求二次确认或重新认证；嵌入场景下，浏览器对 iframe 内的 Cookie 也有 SameSite 和第三方 Cookie 限制。</li>
</ul>`};export{e as default};