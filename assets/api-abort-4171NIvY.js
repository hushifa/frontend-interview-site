var e={answerHtml:`<p>AbortController 通过 signal 向支持它的 API 传递取消信号，例如 fetch、部分流操作与事件监听清理。它不是能强制终止任意 JavaScript 函数的机制，普通 Promise 也不会因为外部创建了 controller 就自动取消。</p>
<p>一个 signal 被取消后不能恢复为未取消状态，新一轮任务通常应创建新的 controller。切换搜索条件或卸载组件时取消旧请求，可以减少无用处理，但仍应根据任务身份避免旧结果覆盖新状态。</p>
<p>取消客户端等待不保证服务端写操作未发生。需要区分主动取消与真实错误，在业务层设计重试、幂等或状态查询。不要把 AbortError 当成需要反复自动重试的网络失败。</p>`};export{e as default};