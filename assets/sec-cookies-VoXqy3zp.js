var e={answerHtml:`<p>HttpOnly 限制 JavaScript 通过 Cookie API 读取对应 Cookie；Secure 限制其在符合要求的安全传输场景发送；SameSite 控制部分跨站请求中 Cookie 的携带行为。它们解决不同问题，需要组合使用。</p>
<p>SameSite=None 通常要求同时设置 Secure。Lax、Strict 与浏览器默认策略还涉及请求类型和上下文，不能简单理解为“允许或禁止跨域”。跨站与跨源也不是同一边界。</p>
<p>HttpOnly 无法阻止已执行的恶意脚本以用户身份发请求，SameSite 也不替代所有 CSRF 防护。Cookie 的 Domain、Path 和过期配置同样重要，但 Path 不是可靠的安全隔离边界。</p>
<h3>复习提示</h3>
<p>回答时先划分浏览器、服务端和用户输入的信任边界，再说明攻击面和防护位置。客户端校验只能改善体验，权限、令牌和最终数据校验仍要由服务端负责。建议用一个最小示例验证“Cookie、SameSite、HttpOnly”，再比较正常路径、失败路径和目标运行环境的差异。</p>`};export{e as default};