var e={answerHtml:`<p>传统 WebSocket 的 <code>message</code> 事件没有标准的读取背压接口，消息大量到达时，应用需要自己限制队列或暂停业务处理。WebSocketStream 尝试通过 Web Streams 暴露可读、可写流，让读取和写入可以与背压机制组合。</p>
<p>它目前不是普遍可用的稳定 Web API，不能直接作为生产环境的唯一实现。使用时需要特性检测、降级到 WebSocket，并验证服务器协议、断线重连和取消语义。</p>
<p>即使使用 Streams，也要限制消息大小、处理恶意发送、关闭流和错误。背压能控制消费速度，但不会替代鉴权、限流和服务端资源保护。</p>`};export{e as default};