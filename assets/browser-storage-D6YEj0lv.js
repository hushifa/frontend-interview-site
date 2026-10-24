var e={answerHtml:`<p>Cookie 会在符合域、路径及 SameSite 等条件的 HTTP 请求中自动携带，并可配置过期时间、Secure 与 HttpOnly。localStorage 通常跨会话保留；sessionStorage 以源与顶级浏览上下文隔离，通常在当前标签页会话结束后清除。</p>
<p>Web Storage 需要 JavaScript 主动读写，不会自动随请求发送，且 API 是同步的。浏览器策略、隐私模式和存储配额可能限制使用，应处理异常。</p>
<p>不要把 Web Storage 当成安全的秘密存储。XSS 能读取脚本可访问的数据；HttpOnly Cookie 可阻止脚本直接读取，但仍需结合 CSRF 防护和整体安全设计。</p>`};export{e as default};