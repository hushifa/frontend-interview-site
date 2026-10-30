var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>比如订单页要及时显示“已发货”。最简单的是短轮询，每隔几秒发一次请求问服务器，没有新数据就回一个空响应。长轮询是服务器收到请求先不回，等有新数据或者超时再回，浏览器收到后马上发下一个。SSE 是服务器回一个一直不结束的 HTTP 响应，有事件就往里写。WebSocket 是先握手升级，然后浏览器和服务器在同一条连接上双向收发。</p>
<p>它们的差别来自“谁先开口”。轮询都是浏览器去拉，短轮询的延迟取决于间隔，间隔越短，服务器和网络的负担越重；长轮询能在有数据时立刻返回，但每条消息都是完整的 HTTP 请求和响应，带一整套头。SSE 和 WebSocket 是连接建好后服务器直接推。</p>
<p>选的时候看需求。只有服务器往浏览器推，比如通知、进度、大模型的流式输出，用 SSE 就够了，它走普通 HTTP，浏览器还会自动重连。聊天、协同编辑这种双向高频的场景用 WebSocket。更新不频繁、或者环境不支持长连接时，轮询最简单可靠。</p>
<p>要注意，长轮询、SSE 和 WebSocket 都要服务器为每个客户端长期占着连接，规模大时要算好资源；SSE 只能传文本，WebSocket 不自带重连和消息确认，要自己写。</p>
</blockquote>
<h2>短轮询和长轮询差在哪</h2>
<p>RFC 6202 把这两种做法放在一起比较。短轮询（short polling）是浏览器定期发请求“拉”数据，服务器没有数据就回空响应，浏览器等一会儿再问。所以轮询频率由能接受的延迟决定，要是想做到秒级延迟，频繁的请求就会给服务器和网络带来不小的负担。</p>
<p>长轮询（long polling）把等待挪到了服务器那边。服务器收到请求后先不回，直到有了新数据、状态变化或者超时才回复，浏览器收到响应后通常马上发下一个请求。这样服务器手里几乎总挂着一个请求，有新消息就能立刻用它回复，看起来像是服务器主动推送。</p>
<p>下面是浏览器端长轮询的写法，<code>/api/updates</code> 是假设的接口，服务器在有新数据或超时时才返回：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">longPoll</span>(<span class="hljs-params">signal</span>) {
  <span class="hljs-keyword">let</span> cursor = <span class="hljs-string">&#x27;0&#x27;</span>;

  <span class="hljs-keyword">while</span> (!signal.<span class="hljs-property">aborted</span>) {
    <span class="hljs-keyword">try</span> {
      <span class="hljs-keyword">const</span> response = <span class="hljs-keyword">await</span> <span class="hljs-title function_">fetch</span>(<span class="hljs-string">\`/api/updates?after=<span class="hljs-subst">\${cursor}</span>\`</span>, { signal });
      <span class="hljs-keyword">if</span> (response.<span class="hljs-property">status</span> === <span class="hljs-number">204</span>) <span class="hljs-keyword">continue</span>; <span class="hljs-comment">// 服务器等到超时也没有新数据</span>
      <span class="hljs-keyword">const</span> data = <span class="hljs-keyword">await</span> response.<span class="hljs-title function_">json</span>();
      cursor = data.<span class="hljs-property">cursor</span>;
      <span class="hljs-title function_">render</span>(data.<span class="hljs-property">items</span>);
    } <span class="hljs-keyword">catch</span> (error) {
      <span class="hljs-keyword">if</span> (signal.<span class="hljs-property">aborted</span>) <span class="hljs-keyword">return</span>;
      <span class="hljs-keyword">await</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Promise</span>(<span class="hljs-function">(<span class="hljs-params">resolve</span>) =&gt;</span> <span class="hljs-built_in">setTimeout</span>(resolve, <span class="hljs-number">3000</span>)); <span class="hljs-comment">// 出错后等一会儿再连</span>
    }
  }
}

<span class="hljs-keyword">const</span> controller = <span class="hljs-keyword">new</span> <span class="hljs-title class_">AbortController</span>();
<span class="hljs-title function_">longPoll</span>(controller.<span class="hljs-property">signal</span>);
</code></pre></div>
<p>为什么要带 <code>cursor</code>？因为两次请求之间有空档，这段时间产生的消息不能丢。浏览器把上次收到的位置告诉服务器，服务器从那里往后给，就不会漏也不会重复。出错后等几秒再连，是为了避免服务器出问题时浏览器不停地猛发请求。</p>
<p>长轮询也有代价，RFC 6202 列了几条。每条消息都是一次完整的 HTTP 请求加响应，消息小的时候，头部可能占了传输量的大部分。服务器刚回完一条消息，要等浏览器发来下一个请求才能再推，所以最坏情况下延迟超过三次网络传输。而且每个客户端都要占着一个 TCP 连接和一个未完成的 HTTP 请求，一些网关、代理对同时挂着的请求数有限制。</p>
<h2>SSE 和 WebSocket 解决了什么</h2>
<p>SSE（Server-Sent Events）不再一次请求只回一条消息。服务器回一个 <code>Content-Type: text/event-stream</code> 的响应，但不结束它，有事件就往里写一段。浏览器用 <code>EventSource</code> 接收，断线后会自动重连，并通过 <code>Last-Event-ID</code> 告诉服务器最后收到哪条。它只能服务器往浏览器单向推 UTF-8 文本。</p>
<p>WebSocket 是另一种协议。浏览器先发一个 HTTP 请求要求升级，握手成功后，这条连接上双方可以随时发文本或二进制消息，不再有每条消息一套 HTTP 头的开销。可是重连、心跳和消息确认，浏览器都不管，要自己实现。</p>
<p>这两者的细节和对比见<a href="/questions/http-sse/">《SSE 的事件格式、自动重连和 Last-Event-ID 是怎样工作的？》</a>，WebSocket 的重连和补发见<a href="/questions/http-websocket/">《WebSocket 适合什么场景，连接断开后怎样恢复？》</a>。</p>
<h2>放在一起怎么选</h2>
<p>四种方式可以按下面的思路对比：</p>
<ul>
<li>短轮询：实现最简单，任何 HTTP 环境都能用；延迟取决于间隔，没有新数据时也在发请求。适合更新慢、对实时性要求不高的场景，比如几分钟刷新一次的看板。</li>
<li>长轮询：有数据能立刻返回，也只用普通 HTTP；每条消息都带完整的头，服务器要挂着请求。适合消息不多、又没法用长连接的环境。</li>
<li>SSE：服务器单向推，自动重连，走普通 HTTP；只能传文本，<code>EventSource</code> 只能发 GET、不能自定义请求头。适合通知、进度、流式输出。</li>
<li>WebSocket：双向、可传二进制、每条消息开销小；要处理协议升级，重连和确认要自己写。适合聊天、协同编辑、多人游戏。</li>
</ul>
<p>真正做选择时，先问“浏览器是不是也要频繁发消息”。如果不需要，SSE 往往比 WebSocket 简单。再看代理、网关和服务器能不能撑住大量长连接，撑不住时轮询反而更稳。</p>
<h2>常见追问</h2>
<p><strong>长轮询和短轮询哪个对服务器压力更大？</strong></p>
<blockquote>
<p>不能一概而论。短轮询在没有数据时也不停地发请求，间隔越短浪费越多；长轮询请求数少，但每个客户端都长期挂着一个请求和一个连接。RFC 6202 提到，有些网关、代理和服务器对同时挂着的请求数有限制，所以规模大时长轮询要专门评估。</p>
</blockquote>
<p><strong>长轮询两次请求之间来的消息会丢吗？</strong></p>
<blockquote>
<p>如果只是“有数据就回”，会。所以要让浏览器每次带上最后收到的位置，比如一个游标或消息编号，服务器从这个位置之后开始返回，空档里产生的消息就能在下一次请求里补上。</p>
</blockquote>
<p><strong>为什么大模型的流式输出常用 SSE 而不是 WebSocket？</strong></p>
<blockquote>
<p>因为这类场景主要是服务器往浏览器推，浏览器只在开头发一次请求。SSE 走普通 HTTP，现有的鉴权、代理都能直接用。要发 POST 请求体或者自定义头时，通常用 <code>fetch</code> 读响应流，自己按 SSE 格式解析，代价是重连要自己写。</p>
</blockquote>`};export{e as default};