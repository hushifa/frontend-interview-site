var e={answerHtml:`<p>HttpOnly 限制 JavaScript 通过 Cookie API 读取对应 Cookie；Secure 限制其在符合要求的安全传输场景发送；SameSite 控制部分跨站请求中 Cookie 的携带行为。它们解决不同问题，需要组合使用。</p>
<p>SameSite=None 通常要求同时设置 Secure。Lax、Strict 与浏览器默认策略还涉及请求类型和上下文，不能简单理解为“允许或禁止跨域”。跨站与跨源也不是同一边界。</p>
<p>HttpOnly 无法阻止已执行的恶意脚本以用户身份发请求，SameSite 也不替代所有 CSRF 防护。Cookie 的 Domain、Path 和过期配置同样重要，但 Path 不是可靠的安全隔离边界。</p>
<h3>安全边界</h3>
<p>安全问题先画出数据流和信任边界：哪些值来自用户、第三方页面、接口响应或浏览器存储，哪些代码拥有真正的权限。防护措施应放在能控制风险的边界上，客户端校验主要用于改善体验，不能代替服务端校验和授权。</p>
<p>验证修复时要覆盖正常流程、攻击输入、错误提示和日志脱敏。安全配置还会受到部署代理、响应头、Cookie 属性和跨域策略影响，不能只在组件代码里判断“已经安全”。</p>`};export{e as default};