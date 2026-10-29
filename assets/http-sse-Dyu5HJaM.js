var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>SSE 是服务器往浏览器单向推消息。浏览器发一个普通请求，服务器不结束响应，一条一条往里写事件。WebSocket 则是一条双向连接，两边都能随时发。</p>
<p>因为 SSE 就是一个 <code>Content-Type: text/event-stream</code> 的普通 HTTP 响应，现有的代理、鉴权、HTTP/2 都能直接用。WebSocket 要先做一次协议升级。</p>
<p>SSE 还有个好处，浏览器的 <code>EventSource</code> 断线后会自动重连，并用 <code>Last-Event-ID</code> 请求头告诉服务器最后收到哪条。WebSocket 没有内置重连。不过 SSE 只能传 UTF-8 文本，WebSocket 文本和二进制都行。</p>
<p>所以通知、进度、AI 流式输出这类只需要推的，用 SSE 或 fetch 流；聊天、协同编辑、游戏这种高频双向的，用 WebSocket。</p>
</blockquote>
<h2>服务器发出来的事件长什么样</h2>
<p>SSE 的格式很简单，每行一个字段，空行表示一个事件结束：</p>
<div class="not-prose code-block"><div class="code-language">text</div><pre><code class="hljs language-text">id: 42
event: progress
data: {&quot;percent&quot;: 60}

data: 第一行
data: 第二行

retry: 5000
</code></pre></div>
<p>第一个事件有编号 42，类型是 <code>progress</code>。第二个事件有两行 <code>data</code>，浏览器会用换行把它们拼成一段。<code>retry</code> 设置断线后多少毫秒重连。</p>
<p>另外，以 <code>:</code> 开头的行是注释，浏览器会忽略。服务器常用它发心跳，防止中间的代理觉得连接空闲把它断掉。</p>
<h2>浏览器怎么接收</h2>
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
<p><code>onerror</code> 触发不代表彻底断了。浏览器在自动重连时 <code>readyState</code> 是 <code>CONNECTING</code>，只有变成 <code>CLOSED</code> 才是真的关了。什么情况会关？服务器返回非 200 状态码，或者 <code>Content-Type</code> 不对，<code>EventSource</code> 就会关闭，不再重连。</p>
<h2>EventSource 不够用时怎么办</h2>
<p><code>EventSource</code> 有两个限制：只能发 <code>GET</code>，不能自定义请求头，只能带 Cookie（跨源时设 <code>withCredentials</code>）。</p>
<p>可是调大模型接口这类场景，经常要 <code>POST</code> 请求体或者 <code>Authorization</code> 头。这时就改用 <code>fetch</code>，读 <code>response.body</code> 这个流，自己按上面的格式解析事件。代价是重连和续传也要自己写。</p>
<p>还有一个坑。HTTP/1.1 下浏览器对同一个域名的并发连接数有限，通常是 6 个。每个标签页都开一个 SSE，开多了就把连接占满，别的请求只能排队。HTTP/2 一条连接里能跑很多个请求，就没有这个问题。</p>
<h2>常见追问</h2>
<p><strong>SSE 怎么保证不丢消息？</strong></p>
<blockquote>
<p>服务器给每个事件编号，并保留一段历史。浏览器重连时会带上 <code>Last-Event-ID</code>，服务器按它把漏掉的补发。</p>
</blockquote>
<p><strong>WebSocket 的重连怎么做？</strong></p>
<blockquote>
<p>见<a href="/questions/http-websocket/">《WebSocket 适合什么场景，连接断开后怎样恢复？》</a>。</p>
</blockquote>`};export{e as default};