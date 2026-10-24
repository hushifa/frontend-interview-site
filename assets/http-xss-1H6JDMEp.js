var e={answerHtml:`<p><strong>XSS</strong> 是攻击者让恶意脚本在目标站点的上下文中执行。防护包括按上下文正确编码、使用安全 DOM API、对必须支持的富文本进行可靠净化，以及配置 CSP 作为纵深防御。</p>
<p><strong>CSRF</strong> 是诱导已登录浏览器向目标站点发送非用户意图的请求。防护可以组合使用 CSRF Token、SameSite Cookie、Origin 校验等，且 GET 不应承担修改状态的操作。</p>
<p>二者防护不能互相替代。HttpOnly 能降低 Cookie 被脚本直接窃取的风险，却不能单独解决 XSS 或 CSRF。</p>
<h3>复习提示</h3>
<p>回答时把请求、响应、缓存和连接状态分开描述，并明确哪一层负责解决问题。涉及协议或状态码时结合实际报文验证，不把框架封装后的表现直接当成 HTTP 标准。建议用一个最小示例验证“XSS、CSRF、安全”，再比较正常路径、失败路径和目标运行环境的差异。</p>`};export{e as default};