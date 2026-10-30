var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>后台任务跑了一分钟，页面要实时显示进度。用 SSE 时，浏览器发一个普通请求，服务器返回 <code>Content-Type: text/event-stream</code>，但不结束响应，而是一条一条往里写事件。</p>
<p>每个事件由几行字段组成：<code>data</code> 是内容，<code>event</code> 是事件类型，<code>id</code> 是编号，<code>retry</code> 设置重连间隔，空行表示一个事件结束。浏览器的 <code>EventSource</code> 负责解析，按类型派发给监听函数。</p>
<p>断线时 <code>EventSource</code> 会自动重连，并在请求头 <code>Last-Event-ID</code> 里带上最后收到的编号。服务器保留一段历史，按这个编号补发漏掉的事件，就能做到断线续传。</p>
<p>要注意，服务器返回非 200 状态码或者 <code>Content-Type</code> 不对时，浏览器会直接关闭连接，不再重连。<code>EventSource</code> 也只能发 GET、不能自定义请求头。SSE 和轮询、WebSocket 怎么选，见<a href="/questions/network-polling-comparison/">《短轮询、长轮询、SSE 和 WebSocket 有什么区别？怎么选？》</a>。</p>
</blockquote>
<h2>服务器发出来的事件长什么样</h2>
<p>格式很简单，每行一个字段，空行表示一个事件结束：</p>
<div class="not-prose code-block"><div class="code-language">text</div><pre><code class="hljs language-text">id: 42
event: progress
data: {&quot;percent&quot;: 60}

data: 第一行
data: 第二行

retry: 5000
</code></pre></div>
<p>第一个事件有编号 42，类型是 <code>progress</code>。第二个事件没写 <code>event</code>，类型就是默认的 <code>message</code>，会触发 <code>onmessage</code>；它有两行 <code>data</code>，浏览器用换行把它们拼成一段。最后一段只有 <code>retry</code>，作用是把重连间隔设成 5000 毫秒，它本身不派发事件。</p>
<p>以 <code>:</code> 开头的行是注释，浏览器会忽略。服务器常隔一段时间发一行注释当心跳，防止中间的代理觉得连接空闲把它断掉。</p>
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
<p>为什么 <code>onerror</code> 触发了，连接却还在？因为网络断开时浏览器会触发 <code>error</code>，同时把 <code>readyState</code> 设为 <code>CONNECTING</code>，等一段时间后自动重连。只有 <code>readyState</code> 变成 <code>CLOSED</code> 才是真的关了。HTML 标准规定，响应状态码不是 200，或者 <code>Content-Type</code> 不是 <code>text/event-stream</code>，浏览器就会让连接失败并不再重连。所以服务器想让客户端停止重连，可以返回 204 这类非 200 状态。</p>
<h2>怎样做到断线不丢消息</h2>
<p><code>EventSource</code> 会记住最后一个事件的 <code>id</code>，重连时放进 <code>Last-Event-ID</code> 请求头。服务器要做的是给每个事件编号，并保留最近一段历史，收到带这个头的请求就从下一条开始补发。</p>
<p>所以编号要能比较先后，比如自增序号或带时间的 ID。历史保留多久要看业务，客户端离线太久、历史已经清掉时，服务器应该让客户端重新拉一次完整状态，而不是假装补齐了。</p>
<h2>EventSource 不够用时怎么办</h2>
<p><code>EventSource</code> 只能发 <code>GET</code>，不能自定义请求头，只能带 Cookie（跨源时设 <code>withCredentials</code>）。调大模型接口这类场景，经常要 <code>POST</code> 请求体或者 <code>Authorization</code> 头。这时就改用 <code>fetch</code>，读 <code>response.body</code> 这个流，自己按上面的格式解析事件。代价是重连、<code>Last-Event-ID</code> 和续传也要自己写。</p>
<p>还有一个坑。MDN 提醒，不用 HTTP/2 时，浏览器对同一个域名的 SSE 连接数有限，上限是 6 个，多个标签页一起开就会占满。HTTP/2 一条连接里能跑很多个请求，默认上限要大得多。</p>
<h2>常见追问</h2>
<p><strong>服务器怎样控制重连间隔？</strong></p>
<blockquote>
<p>发一行 <code>retry: 毫秒数</code>，浏览器之后的重连就按这个间隔等待。不发时用浏览器的默认值。</p>
</blockquote>
<p><strong>WebSocket 的重连怎么做？</strong></p>
<blockquote>
<p>WebSocket 没有内置重连，要自己做退避重连和补发，见<a href="/questions/http-websocket/">《WebSocket 适合什么场景，连接断开后怎样恢复？》</a>。</p>
</blockquote>`};export{e as default};