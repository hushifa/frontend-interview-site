var e={answerHtml:`<p>HttpOnly 限制 JavaScript 通过 Cookie API 读取对应 Cookie；Secure 限制其在符合要求的安全传输场景发送；SameSite 控制部分跨站请求中 Cookie 的携带行为。它们解决不同问题，需要组合使用。</p>
<p>SameSite=None 通常要求同时设置 Secure。Lax、Strict 与浏览器默认策略还涉及请求类型和上下文，不能简单理解为“允许或禁止跨域”。跨站与跨源也不是同一边界。</p>
<p>HttpOnly 无法阻止已执行的恶意脚本以用户身份发请求，SameSite 也不替代所有 CSRF 防护。Cookie 的 Domain、Path 和过期配置同样重要，但 Path 不是可靠的安全隔离边界。</p>`};export{e as default};