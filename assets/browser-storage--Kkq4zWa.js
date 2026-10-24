var e={answerHtml:`<p>Cookie 会在符合域、路径及 SameSite 等条件的 HTTP 请求中自动携带，并可配置过期时间、Secure 与 HttpOnly。localStorage 通常跨会话保留；sessionStorage 以源与顶级浏览上下文隔离，通常在当前标签页会话结束后清除。</p>
<p>Web Storage 需要 JavaScript 主动读写，不会自动随请求发送，且 API 是同步的。浏览器策略、隐私模式和存储配额可能限制使用，应处理异常。</p>
<p>不要把 Web Storage 当成安全的秘密存储。XSS 能读取脚本可访问的数据；HttpOnly Cookie 可阻止脚本直接读取，但仍需结合 CSRF 防护和整体安全设计。</p>
<h3>排查路径</h3>
<p>浏览器问题通常同时涉及页面生命周期、事件循环、渲染调度和资源状态。排查时先记录触发顺序和页面可见性，再用 Performance、Network 或对应的 Application 面板确认事实，不要只根据某一次 console 输出推断机制。</p>
<p>跨浏览器或跨页面场景要考虑特性检测、恢复路径和清理时机。只在首次加载事件里写逻辑，往往会漏掉回退、前进、恢复和后台切换等状态。</p>`};export{e as default};