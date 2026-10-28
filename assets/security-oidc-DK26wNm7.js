var e={answerHtml:`<h2>简答</h2>
<ul>
<li>OAuth 2.0：用户授权客户端访问资源，客户端拿到 access token 调用 API。规范没有定义&quot;用户是谁&quot;，客户端不应从 access token 推断登录身份。</li>
<li>OIDC：请求中带 <code>scope=openid</code>，授权服务器额外返回 ID Token（JWT），内容是身份声明。</li>
<li>ID Token 给客户端看，access token 给资源服务器用，不要把 ID Token 当作调用 API 的凭证。</li>
<li>校验 ID Token：签名（用发现文档中的 JWKS）、<code>iss</code> 是预期的发行方、<code>aud</code> 包含自己的 <code>client_id</code>、<code>exp</code> 未过期、<code>nonce</code> 与请求时一致。</li>
<li>用 <code>iss</code> 和 <code>sub</code> 的组合关联本地账号，<code>email</code> 可能变化或未验证，不能作为唯一标识。</li>
</ul>
<h2>授权码流程中的 OIDC</h2>
<div class="not-prose code-block"><div class="code-language">text</div><pre><code class="hljs language-text">/authorize?response_type=code
  &amp;client_id=shop
  &amp;redirect_uri=https://shop.example/callback
  &amp;scope=openid profile email
  &amp;state=随机值
  &amp;nonce=随机值
  &amp;code_challenge=...&amp;code_challenge_method=S256
</code></pre></div>
<p>换令牌后得到：</p>
<div class="not-prose code-block"><div class="code-language">json</div><pre><code class="hljs language-json">{
  &quot;access_token&quot;: &quot;...&quot;,
  &quot;id_token&quot;: &quot;eyJhbGciOiJSUzI1NiIs...&quot;,
  &quot;token_type&quot;: &quot;Bearer&quot;,
  &quot;expires_in&quot;: 3600
}
</code></pre></div>
<p>ID Token 的载荷示例：</p>
<div class="not-prose code-block"><div class="code-language">json</div><pre><code class="hljs language-json">{
  &quot;iss&quot;: &quot;https://id.example&quot;,
  &quot;sub&quot;: &quot;248289761001&quot;,
  &quot;aud&quot;: &quot;shop&quot;,
  &quot;exp&quot;: 1793000000,
  &quot;iat&quot;: 1792996400,
  &quot;nonce&quot;: &quot;随机值&quot;,
  &quot;email&quot;: &quot;user@example.com&quot;,
  &quot;email_verified&quot;: true
}
</code></pre></div>
<h2>几个容易混淆的点</h2>
<table><thead><tr><th>概念</th><th>用途</th></tr></thead><tbody><tr><td><code>state</code></td><td>防止回调被伪造（CSRF），客户端自己比较</td></tr><tr><td><code>nonce</code></td><td>绑定 ID Token 和本次登录请求，防重放</td></tr><tr><td>PKCE</td><td>防止授权码被截获后兑换，见<a href="/questions/security-oauth-pkce/">《OAuth 2.0 的 PKCE 解决了什么问题？》</a></td></tr><tr><td>UserInfo 端点</td><td>用 access token 获取更多用户信息</td></tr><tr><td>发现文档</td><td><code>/.well-known/openid-configuration</code>，列出端点和 JWKS 地址</td></tr></tbody></table>
<h2>登录之后</h2>
<p>拿到 ID Token 只说明身份提供方认证了用户。应用还需要创建自己的会话（通常是 <code>HttpOnly</code> Cookie），并处理过期、登出和账号关联。单页应用推荐通过 BFF 在服务端完成兑换和校验，浏览器不直接持有令牌。</p>
<h2>常见追问</h2>
<ul>
<li>能在前端校验 ID Token 吗？可以做展示用途的解码，但决定权限的校验应在服务端。</li>
<li>社交登录都是 OIDC 吗？主流身份提供方大多支持 OIDC，部分只提供 OAuth 加自定义的用户信息接口，需要按各自文档处理。</li>
</ul>`};export{e as default};