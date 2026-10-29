var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>这三个属性各管一件事。<code>HttpOnly</code> 让 <code>document.cookie</code> 读不到这个 Cookie，XSS 就没办法直接把会话偷走。<code>Secure</code> 让 Cookie 只在 HTTPS 请求里发送，防止明文传输时被窃听。<code>SameSite</code> 决定跨站请求带不带这个 Cookie，主要用来防 CSRF。</p>
<p><code>SameSite</code> 有三个值。<code>Strict</code> 是任何跨站请求都不带；<code>Lax</code> 是只有从别的网站点链接跳过来这种顶层 <code>GET</code> 导航才带；<code>None</code> 是都带，但必须同时设 <code>Secure</code>。</p>
<p>没写 <code>SameSite</code> 时各浏览器的默认行为不一样，Chromium 按 <code>Lax</code> 处理，所以最好显式写出来。会话 Cookie 一般推荐 <code>__Host-</code> 前缀加 <code>Secure; HttpOnly; SameSite=Lax; Path=/</code>。</p>
<p>要注意，<code>HttpOnly</code> 只是让脚本读不到 Cookie，有 XSS 时脚本仍然能借用户的身份发请求，根本上还是要防住 XSS。</p>
</blockquote>
<h2>推荐写法</h2>
<div class="not-prose code-block"><div class="code-language">http</div><pre><code class="hljs language-http">Set-Cookie: __Host-session=abc123; Secure; HttpOnly; SameSite=Lax; Path=/; Max-Age=86400
</code></pre></div>
<p>名字前面的 <code>__Host-</code> 是一个前缀约定，浏览器会检查：带这个前缀的 Cookie 必须设 <code>Secure</code>、<code>Path=/</code>，并且不能设 <code>Domain</code>。不能设 <code>Domain</code> 就意味着这个 Cookie 只属于当前主机，子域名没办法写一个同名的来覆盖它。另一个前缀 <code>__Secure-</code> 宽松一些，只要求 <code>Secure</code>。</p>
<p>过期时间方面，同时设了 <code>Expires</code> 和 <code>Max-Age</code> 时以 <code>Max-Age</code> 为准。两个都不设，就是会话 Cookie，关闭浏览器后失效。不过浏览器的“恢复上次会话”功能可能把它保留下来，所以不能完全指望它会消失。</p>
<h2>SameSite 说的“站”是什么</h2>
<p>站点是协议加上可注册域名，也就是常说的 eTLD+1，比如 <code>https://example.com</code>。所以 <code>a.example.com</code> 和 <code>b.example.com</code> 是同站，SameSite 不会拦它们之间的请求；<code>example.com</code> 和 <code>example.org</code> 是跨站。</p>
<table><thead><tr><th>请求场景</th><th>Strict</th><th>Lax</th><th>None</th></tr></thead><tbody><tr><td>同站请求</td><td>带</td><td>带</td><td>带</td></tr><tr><td>从其他站点点链接打开</td><td>不带</td><td>带</td><td>带</td></tr><tr><td>其他站点的表单 POST</td><td>不带</td><td>不带</td><td>带</td></tr><tr><td>其他站点 iframe 或 fetch</td><td>不带</td><td>不带</td><td>带</td></tr></tbody></table>
<p>看这张表会发现 <code>Strict</code> 最安全，那为什么不都用它？因为用户从搜索结果或者别人发的链接点进来，第一个请求不带 Cookie，看起来就像没登录。所以常见做法是会话用 <code>Lax</code>，转账、改密码这类高风险操作再额外校验令牌。</p>
<h2>不写 SameSite 会怎样</h2>
<p>Chromium 会按 <code>Lax</code> 处理，但有一个例外：刚设置不到 2 分钟的 Cookie，顶层的跨站 <code>POST</code> 也会带上，这是为了兼容一些登录流程。其他浏览器的默认行为又不一样。所以靠默认值不可靠，显式写出来最稳。</p>
<h2>第三方 Cookie 现在还能用吗</h2>
<p>嵌在别的网站里的 iframe 或请求，要带 Cookie 必须设 <code>SameSite=None; Secure</code>。可是即使这样，浏览器的隐私策略也可能拦下来。Chrome 默认允许第三方 Cookie，用户可以在设置里屏蔽，无痕模式默认屏蔽。Firefox 默认开启全面 Cookie 保护，把第三方 Cookie 按顶层站点分开存储。Safari 的智能防跟踪默认阻止第三方 Cookie。</p>
<p>替代方案有分区 Cookie（<code>Partitioned</code>）、Storage Access API 和 FedCM，见<a href="/questions/sec-partitioned-cookies/">《第三方 Cookie、SameSite 和 Partitioned Cookie 有什么区别？》</a>。</p>
<h2>常见追问</h2>
<p><strong>单个 Cookie 能有多大？</strong></p>
<blockquote>
<p>RFC 6265 要求浏览器每个 Cookie 至少支持 4096 字节，实际的上限也大致在这个范围。</p>
</blockquote>
<p><strong>设了 HttpOnly 是不是就安全了？</strong></p>
<blockquote>
<p>不是。它只解决了令牌被脚本读走的问题。有 XSS 时，恶意脚本仍然可以在页面里直接发请求，浏览器照样会带上 Cookie，所以根本上要防住 XSS。</p>
</blockquote>`};export{e as default};