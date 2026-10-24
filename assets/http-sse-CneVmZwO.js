var e={answerHtml:`<p>SSE 主要用于服务端向浏览器单向推送文本事件，浏览器可使用 EventSource 消费，响应类型通常为 text/event-stream。事件以规定的字段和空行分隔，不是随意发送文本就能正确解析。</p>
<p>原生 EventSource 支持连接恢复机制，服务端可通过事件 id 协助续传，但业务仍需处理重复、遗漏和失效状态。客户端发送操作通常使用另外的 HTTP 请求；需要双向低延迟消息时再考虑 WebSocket。</p>
<p>代理缓冲、超时和连接数量会影响实际表现。原生 EventSource 的请求配置能力也有限，若使用自定义 fetch 流式客户端，需要自己实现事件解析、取消和重连，不能照搬所有原生行为。</p>`};export{e as default};