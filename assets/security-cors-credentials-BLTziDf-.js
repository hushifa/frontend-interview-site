var e={answerHtml:`<p>跨源请求是否能被 JavaScript 读取，由服务端 CORS 响应头决定。请求携带凭据时，服务端不能把 <code>Access-Control-Allow-Origin</code> 设为 <code>*</code>，必须返回明确的源，并设置 <code>Access-Control-Allow-Credentials: true</code>；客户端也要显式使用 <code>credentials: &#x27;include&#x27;</code> 或对应配置。</p>
<p>预检请求会先询问方法、请求头和凭据策略，服务端必须正确响应允许的源、方法和请求头。CORS 只控制浏览器脚本读取响应，不能替代服务端身份认证、CSRF 防护或资源权限检查。</p>
<p>Cookie 还受 <code>SameSite</code>、<code>Secure</code>、第三方 Cookie 策略和域名范围影响。调试时要分别查看预检、实际请求、响应头和浏览器 Cookie 决策，不能只看到服务端返回 200 就认为跨域成功。</p>
<h3>复习提示</h3>
<p>回答时先划分浏览器、服务端和用户输入的信任边界，再说明攻击面和防护位置。客户端校验只能改善体验，权限、令牌和最终数据校验仍要由服务端负责。可以把“CORS、Cookie、跨域”拆成机制、实现取舍和失败恢复三个追问，并用可运行示例验证关键结论。</p>`};export{e as default};