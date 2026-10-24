var e={answerHtml:`<p><strong>XSS</strong> 是攻击者让恶意脚本在目标站点的上下文中执行。防护包括按上下文正确编码、使用安全 DOM API、对必须支持的富文本进行可靠净化，以及配置 CSP 作为纵深防御。</p>
<p><strong>CSRF</strong> 是诱导已登录浏览器向目标站点发送非用户意图的请求。防护可以组合使用 CSRF Token、SameSite Cookie、Origin 校验等，且 GET 不应承担修改状态的操作。</p>
<p>二者防护不能互相替代。HttpOnly 能降低 Cookie 被脚本直接窃取的风险，却不能单独解决 XSS 或 CSRF。</p>`};export{e as default};