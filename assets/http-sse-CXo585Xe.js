var e={answerHtml:`<h2>简答</h2>
<ul>
<li>方向：SSE 只能服务器推给客户端，客户端发消息仍用普通请求；WebSocket 双向。</li>
<li>协议：SSE 是 <code>Content-Type: text/event-stream</code> 的普通 HTTP 响应，能直接走现有的代理、鉴权和 HTTP/2；WebSocket 需要协议升级。</li>
<li>重连：<code>EventSource</code> 断线后自动重连，并通过 <code>Last-Event-ID</code> 请求头告诉服务器最后收到的事件；WebSocket 没有内置重连。</li>
<li>数据：SSE 只传 UTF-8 文本；WebSocket 支持文本和二进制。</li>
<li>选择：通知、进度、AI 流式输出用 SSE 或 fetch 流；聊天、协同编辑、游戏这类高频双向场景用 WebSocket。</li>
</ul>
<h2>事件格式</h2>
<div class="not-prose code-block"><div class="code-language">text</div><pre><code class="hljs language-text">id: 42
event: progress
data: {&quot;percent&quot;: 60}

data: 第一行
data: 第二行

retry: 5000
</code></pre></div>
<p>每个事件以空行结束；多行 <code>data</code> 会用换行拼接；<code>retry</code> 设置重连间隔（毫秒）；以 <code>:</code> 开头的行是注释，常用来发心跳，防止代理断开空闲连接。</p>
<h2>客户端</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> source = <span class="hljs-keyword">new</span> <span class="hljs-title class_">EventSource</span>(<span class="hljs-string">&#x27;/api/tasks/7/events&#x27;</span>);

source.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;progress&#x27;</span>, <span class="hljs-function">(<span class="hljs-params">event</span>) =&gt;</span> {
  <span class="hljs-keyword">const</span> { percent } = <span class="hljs-title class_">JSON</span>.<span class="hljs-title function_">parse</span>(event.<span class="hljs-property">data</span>);
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;进度&#x27;</span>, percent, <span class="hljs-string">&#x27;最后事件 ID&#x27;</span>, event.<span class="hljs-property">lastEventId</span>);
});

source.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;done&#x27;</span>, <span class="hljs-function">() =&gt;</span> source.<span class="hljs-title function_">close</span>());

source.<span class="hljs-property">onerror</span> = <span class="hljs-function">() =&gt;</span> {
  <span class="hljs-comment">// readyState 为 CONNECTING 表示浏览器正在自动重连</span>
  <span class="hljs-keyword">if</span> (source.<span class="hljs-property">readyState</span> === <span class="hljs-title class_">EventSource</span>.<span class="hljs-property">CLOSED</span>) <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;连接已关闭&#x27;</span>);
};
</code></pre></div>
<p>服务器返回非 200 状态码或错误的 <code>Content-Type</code> 时，<code>EventSource</code> 会关闭且不再重连。</p>
<h2>EventSource 的限制和 fetch 流</h2>
<p><code>EventSource</code> 只能发 <code>GET</code>，不能自定义请求头（只能带 Cookie，可设 <code>withCredentials</code>）。需要 <code>POST</code> 请求体或 <code>Authorization</code> 头时（例如调用大模型接口），改用 <code>fetch</code> 读取 <code>response.body</code>，自己解析事件格式，重连和续传也要自己实现。</p>
<p>HTTP/1.1 下浏览器对同一域名的并发连接数有限（通常 6 个），多个标签页各开一个 SSE 会占满连接；HTTP/2 多路复用后没有这个问题。</p>
<h2>常见追问</h2>
<ul>
<li>SSE 怎么保证不丢消息？服务器为事件编号并保留一段历史，重连时按 <code>Last-Event-ID</code> 补发。</li>
<li>WebSocket 的重连怎么做？见<a href="/questions/http-websocket/">《WebSocket 适合什么场景，连接断开后怎样恢复？》</a>。</li>
</ul>`};export{e as default};