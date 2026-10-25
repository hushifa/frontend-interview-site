var e={answerHtml:`<p>“允许一个应用读取我的网盘文件”和“让我用网盘账号登录这个应用”看起来都可能经过同一个登录页面，但它们不是同一个协议目标。OAuth 2.0 主要解决授权访问资源，OIDC 在它之上增加标准化的身份认证层。</p>
<p>OAuth 流程中授权服务器可能先让用户登录，但这并不意味着客户端可以随意从任意 access token 推断“当前登录用户是谁”。OIDC 明确定义了客户端如何得到和验证身份声明。</p>
<h3>三种结果不能混着用</h3>
<table><thead><tr><th>数据</th><th>主要接收方</th><th>用途</th></tr></thead><tbody><tr><td>access token</td><td>API 等资源服务器</td><td>根据令牌对应的权限访问资源</td></tr><tr><td>ID Token</td><td>发起认证的客户端</td><td>描述身份提供方认证用户的结果</td></tr><tr><td>UserInfo 响应</td><td>获得许可的客户端</td><td>获取协议允许提供的用户声明</td></tr></tbody></table>
<p>OIDC 请求包含 <code>openid</code> scope，通常采用授权码流程。客户端完成 code 兑换后会得到 ID Token，并可能用 access token 调用 UserInfo。UserInfo 不是一次新的独立登录，其 sub 必须与对应 ID Token 的 sub 一致，才能把返回资料归到同一个主体。</p>
<p>ID Token 通常是 JWT，但 access token 不一定是 JWT，也可能是客户端不应解析的 opaque 字符串。不要写一个“只要能解码 JWT 就当作登录成功”的通用函数。</p>
<h3>ID Token 中的身份也必须验证</h3>
<p>假设一个令牌解码后包含：</p>
<div class="not-prose code-block"><div class="code-language">json</div><pre><code class="hljs language-json">{
  &quot;iss&quot;: &quot;https://login.example.com&quot;,
  &quot;sub&quot;: &quot;user-42&quot;,
  &quot;aud&quot;: &quot;frontend-client&quot;,
  &quot;exp&quot;: 2000000000,
  &quot;nonce&quot;: &quot;本次认证请求的随机值&quot;
}
</code></pre></div>
<p>这些只是声明，示例并不是一个可用令牌。Base64URL 解码只是读取数据，攻击者也可以构造同样的 JSON。客户端需要按所用流程与提供方要求验证签名或协议规定的可信验证条件、issuer、audience、有效期和事务关联。</p>
<p>iss 必须是预期身份提供方；aud 必须包含当前客户端标识；使用多个 audience 或 azp 时还有相应校验要求。如果请求发送了 nonce，返回的 nonce 必须与本次保存值匹配。不能因为签名数学上有效，就接受签给别的客户端或由陌生提供方签发的令牌。</p>
<p>签名密钥应来自预先信任的提供方配置及其密钥发布机制，并处理轮换；不能盲目信任令牌中任意 URL 指向的密钥。实际项目优先采用维护良好的 OIDC 库，而不是自己拼接一组 JWT 判断。</p>
<h3>用哪个字段关联本地账号</h3>
<p>通常使用经过验证的 <code>(iss, sub)</code> 组合关联身份。sub 是发行者范围内的主体标识，不是跨所有身份提供方全局唯一的用户 ID。某些提供方还会使用按客户端关系区分的 pairwise subject，不能假设多个应用看到的 sub 一定相同。</p>
<p>邮箱和昵称适合展示，但可能变化，也不一定已验证。不要仅因为两个提供方返回相同邮箱，就自动合并两个本地账号；账号绑定应有明确的所有权验证流程。</p>
<h3>登录成功以后，还有应用自己的会话</h3>
<p>浏览器客户端通常使用授权码加 PKCE，并依赖 SDK 处理重定向、state、nonce、错误和令牌生命周期。有后端的应用也可以由后端处理协议，浏览器使用应用会话 Cookie。两种架构的凭证存储和 CSRF 风险不同，不能把后端机密直接搬到前端。</p>
<p>ID Token 不是调用任意 API 的万能通行证。API 应验证发给自己的 access token 或应用会话，再执行资源级权限判断。即使身份认证证明用户是 user-42，也不代表他有权读取 user-43 的订单。</p>
<p>注销同样有多个层次：清除当前应用的登录状态，不一定会结束身份提供方的单点登录会话；结束提供方会话，也不一定立即撤销所有已签发令牌。应根据提供方支持的注销、撤销和会话机制设计，而不是只删除一个 localStorage 字段就宣称完全退出。</p>`};export{e as default};