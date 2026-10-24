var e={answerHtml:`<p>OAuth 2.0 主要解决“客户端能代表资源所有者访问哪些资源”，access token 的受众是资源服务器；它本身不定义统一的登录身份声明。OpenID Connect 在 OAuth 之上增加身份层，使用 ID Token 和 UserInfo 描述已认证用户。</p>
<p>客户端不能把 access token 当成用户身份，也不能只解码 JWT 就信任其中内容。应校验 issuer、audience、签名、过期时间、nonce 和授权流程绑定；验证规则由身份提供方和客户端类型决定。</p>
<p>前端应用仍要使用适合公共客户端的授权码 + PKCE，并把登录会话、刷新、注销、CSRF 和回调错误纳入整体设计。身份认证完成不代表业务权限已经完成。</p>`};export{e as default};