var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>OAuth 2.0 解决的是授权。比如用户允许一个打印网站读取自己网盘里的照片，打印网站拿到 access token，用它调用网盘的 API。可是 OAuth 规范没有定义“用户是谁”，所以客户端不应该从 access token 推断谁登录了。</p>
<p>OIDC 在 OAuth 之上加了认证，也就是“谁登录了”。请求里带上 <code>scope=openid</code>，授权服务器除了 access token，还会额外返回一个 ID Token。它是一个 JWT，里面写的是用户的身份信息。</p>
<p>两个令牌给不同的人看。ID Token 给客户端看，access token 给资源服务器用，不要把 ID Token 当成调用 API 的凭证。</p>
<p>客户端拿到 ID Token 要校验：签名用发现文档里的 JWKS 验证，<code>iss</code> 是预期的发行方，<code>aud</code> 包含自己的 <code>client_id</code>，<code>exp</code> 没过期，<code>nonce</code> 和请求时一致。关联本地账号用 <code>iss</code> 加 <code>sub</code>，<code>email</code> 可能会变，也可能没验证过，不能当唯一标识。</p>
</blockquote>
<h2>在授权码流程里怎么用</h2>
<p>和普通 OAuth 授权码流程比，请求里多了 <code>openid</code> 这个 scope 和一个 <code>nonce</code>：</p>
<div class="not-prose code-block"><div class="code-language">text</div><pre><code class="hljs language-text">/authorize?response_type=code
  &amp;client_id=shop
  &amp;redirect_uri=https://shop.example/callback
  &amp;scope=openid profile email
  &amp;state=随机值
  &amp;nonce=随机值
  &amp;code_challenge=...&amp;code_challenge_method=S256
</code></pre></div>
<p>用授权码换令牌后，响应里多了一个 <code>id_token</code>：</p>
<div class="not-prose code-block"><div class="code-language">json</div><pre><code class="hljs language-json">{
  &quot;access_token&quot;: &quot;...&quot;,
  &quot;id_token&quot;: &quot;eyJhbGciOiJSUzI1NiIs...&quot;,
  &quot;token_type&quot;: &quot;Bearer&quot;,
  &quot;expires_in&quot;: 3600
}
</code></pre></div>
<p>把 ID Token 解码，载荷大概是这样：</p>
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
<p>每个字段都对应一项校验。<code>iss</code> 说明是谁签发的，<code>aud</code> 说明是发给谁的，<code>exp</code> 是过期时间，<code>nonce</code> 用来确认它属于这一次登录。为什么用 <code>iss</code> 加 <code>sub</code> 认人？因为 <code>sub</code> 只保证在同一个发行方内唯一，换了发行方可能重复，所以两个要一起用。</p>
<h2>几个容易混淆的东西</h2>
<table><thead><tr><th>概念</th><th>用途</th></tr></thead><tbody><tr><td><code>state</code></td><td>防止回调被伪造（CSRF），客户端自己比较</td></tr><tr><td><code>nonce</code></td><td>绑定 ID Token 和本次登录请求，防重放</td></tr><tr><td>PKCE</td><td>防止授权码被截获后兑换，见<a href="/questions/security-oauth-pkce/">《OAuth 2.0 的 PKCE 解决了什么问题？》</a></td></tr><tr><td>UserInfo 端点</td><td>用 access token 获取更多用户信息</td></tr><tr><td>发现文档</td><td><code>/.well-known/openid-configuration</code>，列出端点和 JWKS 地址</td></tr></tbody></table>
<p><code>state</code> 和 <code>nonce</code> 最容易搞混。<code>state</code> 是在回调时比对的，确认这次回调是自己发起的；<code>nonce</code> 是写进 ID Token 里的，确认这个令牌是这次登录拿到的，不是别人重放的旧令牌。</p>
<h2>拿到 ID Token 之后</h2>
<p>拿到 ID Token，只说明身份提供方认证了这个用户。应用还要创建自己的会话，通常是一个 <code>HttpOnly</code> Cookie，并处理过期、登出和账号关联。单页应用推荐通过 BFF 在服务端完成兑换和校验，浏览器不直接持有令牌。</p>
<h2>常见追问</h2>
<p><strong>能在前端校验 ID Token 吗？</strong></p>
<blockquote>
<p>可以在前端解码，拿来显示用户名之类。可是决定权限的校验要放在服务端，前端的判断用户可以改。</p>
</blockquote>
<p><strong>社交登录都是 OIDC 吗？</strong></p>
<blockquote>
<p>主流的身份提供方大多支持 OIDC。也有一些只提供 OAuth 加自定义的用户信息接口，需要按各自的文档处理。</p>
</blockquote>`};export{e as default};