var e={answerHtml:`<p>fetch 在收到 HTTP 错误状态时通常仍会兑现 Promise，因为浏览器成功获得了一个响应。网络失败或取消等情况才可能使请求 Promise 拒绝。应检查 response.ok 或具体 status，再决定业务处理。</p>
<p>解析响应体也是异步操作，JSON 格式不合法会导致解析失败；204 或空正文不应直接按 JSON 处理。响应体是流，读取后不能无条件反复读取，需要提前决定是否克隆或只消费一次。</p>
<p>使用 AbortController 可以取消支持取消机制的请求，并区分 AbortError 与实际故障。请求取消不能保证服务端尚未执行写操作，因此提交类请求仍要设计幂等与状态查询。</p>`};export{e as default};