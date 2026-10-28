var e={notesHtml:`<p>SSE 流解析器。用 fetch 发 POST 或带自定义请求头的请求，又要按 SSE 格式读取响应时，用它处理事件分隔和 data、event、id 等字段。</p>
<p>如果原生 EventSource 已经够用，就不需要它。字节流要先用 TextDecoder 的 stream 模式解码；解析出的 data 不保证是合法 JSON。重连、鉴权和去重由应用负责。主版本之间回调接口有变化，按所装版本的 README 接入。</p>
<p>许可：MIT。</p>`};export{e as default};