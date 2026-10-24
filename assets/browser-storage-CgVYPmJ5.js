var e={answerHtml:`<p>Cookie 会在符合域、路径及 SameSite 等条件的 HTTP 请求中自动携带，并可配置过期时间、Secure 与 HttpOnly。localStorage 通常跨会话保留；sessionStorage 以源与顶级浏览上下文隔离，通常在当前标签页会话结束后清除。</p>
<p>Web Storage 需要 JavaScript 主动读写，不会自动随请求发送，且 API 是同步的。浏览器策略、隐私模式和存储配额可能限制使用，应处理异常。</p>
<p>不要把 Web Storage 当成安全的秘密存储。XSS 能读取脚本可访问的数据；HttpOnly Cookie 可阻止脚本直接读取，但仍需结合 CSRF 防护和整体安全设计。</p>
<h3>复习提示</h3>
<p>回答时沿着页面生命周期、事件循环、渲染和存储边界说明过程。浏览器 API 的支持情况要结合特性检测和目标版本验证，不能只凭开发机现象下结论。可先用一个最小示例验证“Cookie、存储、安全”，再补充空值、异常和兼容性边界。</p>`};export{e as default};