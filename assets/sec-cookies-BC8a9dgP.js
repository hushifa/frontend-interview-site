var e={answerHtml:`<h2>简答</h2>
<ul>
<li><code>HttpOnly</code>：<code>document.cookie</code> 读不到，XSS 无法直接偷走会话。脚本仍能借用户身份发请求。</li>
<li><code>Secure</code>：只在 HTTPS 请求中发送，防止明文传输被窃听。</li>
<li><code>SameSite=Strict</code>：任何跨站请求都不带；<code>Lax</code>：只有跨站的顶层 <code>GET</code> 导航会带；<code>None</code>：都带，必须同时设置 <code>Secure</code>。</li>
<li>没写 SameSite 时，Chromium 按 <code>Lax</code> 处理，并对刚设置不到 2 分钟的 Cookie 放行顶层跨站 <code>POST</code>；其他浏览器默认行为不同，所以要显式设置。</li>
<li>会话 Cookie 推荐：<code>__Host-</code> 前缀加 <code>Secure; HttpOnly; SameSite=Lax; Path=/</code>。</li>
</ul>
<h2>推荐写法</h2>
<div class="not-prose code-block"><div class="code-language">http</div><pre><code class="hljs language-http">Set-Cookie: __Host-session=abc123; Secure; HttpOnly; SameSite=Lax; Path=/; Max-Age=86400
</code></pre></div>
<ul>
<li><code>__Host-</code> 前缀要求 <code>Secure</code>、<code>Path=/</code>、不能设 <code>Domain</code>，因此 Cookie 只属于当前主机，子域名无法覆盖它。</li>
<li><code>__Secure-</code> 前缀只要求 <code>Secure</code>。</li>
<li>同时设置 <code>Expires</code> 和 <code>Max-Age</code> 时以 <code>Max-Age</code> 为准；都不设就是会话 Cookie，关闭浏览器后失效（浏览器恢复会话功能可能保留它）。</li>
</ul>
<h2>SameSite 的&quot;站&quot;是什么</h2>
<p>站点是 scheme 加可注册域名（eTLD+1），例如 <code>https://example.com</code>。<code>a.example.com</code> 和 <code>b.example.com</code> 是同站，SameSite 不会阻止它们之间的请求；<code>example.com</code> 和 <code>example.org</code> 是跨站。</p>
<table><thead><tr><th>请求场景</th><th>Strict</th><th>Lax</th><th>None</th></tr></thead><tbody><tr><td>同站请求</td><td>带</td><td>带</td><td>带</td></tr><tr><td>从其他站点点链接打开</td><td>不带</td><td>带</td><td>带</td></tr><tr><td>其他站点的表单 POST</td><td>不带</td><td>不带</td><td>带</td></tr><tr><td>其他站点 iframe 或 fetch</td><td>不带</td><td>不带</td><td>带</td></tr></tbody></table>
<p><code>Strict</code> 的代价是用户从外部链接进入时看起来像没登录，常见做法是会话用 <code>Lax</code>，高风险操作再校验令牌。</p>
<h2>第三方 Cookie 的现状</h2>
<p>嵌入在别的网站里的 iframe 或请求需要 <code>SameSite=None; Secure</code>，但即使这样，浏览器也可能限制：</p>
<ul>
<li>Chrome 默认允许第三方 Cookie，用户可以在设置中屏蔽，无痕模式默认屏蔽。</li>
<li>Firefox 默认开启全面 Cookie 保护，第三方 Cookie 按顶层站点分区存储。</li>
<li>Safari 的智能防跟踪默认阻止第三方 Cookie。</li>
</ul>
<p>替代方案有分区 Cookie（<code>Partitioned</code>）、Storage Access API 和 FedCM，见《第三方 Cookie、SameSite 和 Partitioned Cookie 有什么区别？》。</p>
<h2>常见追问</h2>
<ul>
<li>单个 Cookie 有多大？RFC 6265 要求浏览器至少支持每个 Cookie 4096 字节，实际也大致是这个上限。</li>
<li>设了 HttpOnly 是否就安全了？只解决令牌被读走的问题，XSS 仍能在页面里发请求，根本上要防住 XSS。</li>
</ul>`};export{e as default};