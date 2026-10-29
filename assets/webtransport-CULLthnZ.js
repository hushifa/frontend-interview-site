var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>WebSocket 是一条 TCP 连接上的有序、可靠消息流。可靠的代价是，一条消息丢包要重传，后面的消息就都得等着，这叫队头阻塞。</p>
<p>WebTransport 基于 HTTP/3，也就是 QUIC 协议。它能开多条互不阻塞的流，一条流丢包不影响别的流；还能发数据报（datagram），不保证送达，丢了就丢了。</p>
<p>所以它适合“最新的数据比旧数据重要”的场景，比如游戏状态同步、实时音视频的控制信号、大量并发的小请求。</p>
<p>但 WebSocket 仍然更通用。服务端、代理和负载均衡器基本都支持它，基于 TCP 的网络也更容易连通。WebTransport 在 MDN 上标为 Baseline 2026（2026 年 3 月起主流浏览器可用），服务端要支持 HTTP/3，有些企业网络还会封 UDP，所以要准备 WebSocket 作为回退。</p>
</blockquote>
<h2>两者对比</h2>
<table><thead><tr><th></th><th>WebSocket</th><th>WebTransport</th></tr></thead><tbody><tr><td>传输层</td><td>TCP</td><td>QUIC（UDP）</td></tr><tr><td>通道</td><td>一条有序消息流</td><td>多条独立流 + 数据报</td></tr><tr><td>可靠性</td><td>可靠</td><td>流可靠，数据报不可靠</td></tr><tr><td>背压</td><td>无，需要自己看 <code>bufferedAmount</code></td><td>基于 Streams，自带背压</td></tr><tr><td>服务端支持</td><td>广泛</td><td>需要 HTTP/3，生态较新</td></tr></tbody></table>
<p>背压是指接收方处理不过来时，让发送方慢下来。WebSocket 没有这个机制，发得太快数据会在浏览器里堆积，要自己看 <code>bufferedAmount</code> 控制。WebTransport 的读写都是 Streams，写入时会自动等待。</p>
<h2>一个游戏连接的例子</h2>
<p>下面用数据报发玩家位置，用可靠的流发聊天消息。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> transport = <span class="hljs-keyword">new</span> <span class="hljs-title class_">WebTransport</span>(<span class="hljs-string">&#x27;https://game.example.com:4433/session&#x27;</span>);
<span class="hljs-keyword">await</span> transport.<span class="hljs-property">ready</span>;

<span class="hljs-comment">// createWritable() 是现行标准；datagrams.writable 已弃用，只作回退</span>
<span class="hljs-keyword">const</span> datagrams =
  <span class="hljs-keyword">typeof</span> transport.<span class="hljs-property">datagrams</span>.<span class="hljs-property">createWritable</span> === <span class="hljs-string">&#x27;function&#x27;</span>
    ? transport.<span class="hljs-property">datagrams</span>.<span class="hljs-title function_">createWritable</span>()
    : transport.<span class="hljs-property">datagrams</span>.<span class="hljs-property">writable</span>;
<span class="hljs-keyword">const</span> writer = datagrams.<span class="hljs-title function_">getWriter</span>();
<span class="hljs-built_in">setInterval</span>(<span class="hljs-function">() =&gt;</span> {
  writer.<span class="hljs-title function_">write</span>(<span class="hljs-title function_">encodePosition</span>(player));
}, <span class="hljs-number">50</span>);

<span class="hljs-keyword">const</span> stream = <span class="hljs-keyword">await</span> transport.<span class="hljs-title function_">createBidirectionalStream</span>();
<span class="hljs-keyword">const</span> chatWriter = stream.<span class="hljs-property">writable</span>.<span class="hljs-title function_">getWriter</span>();
<span class="hljs-keyword">await</span> chatWriter.<span class="hljs-title function_">write</span>(<span class="hljs-keyword">new</span> <span class="hljs-title class_">TextEncoder</span>().<span class="hljs-title function_">encode</span>(<span class="hljs-string">&#x27;hello&#x27;</span>));

transport.<span class="hljs-property">closed</span>
  .<span class="hljs-title function_">then</span>(<span class="hljs-function">() =&gt;</span> <span class="hljs-title function_">showOffline</span>())
  .<span class="hljs-title function_">catch</span>(<span class="hljs-function">() =&gt;</span> <span class="hljs-title function_">reconnect</span>());
</code></pre></div>
<p>为什么位置用数据报？位置每 50 毫秒发一次，丢一帧没关系，下一帧马上就覆盖了。如果用可靠传输，丢的那一帧要重传，后面的新位置反而被它堵住。</p>
<p>聊天消息必须送到，所以用可靠的流。而且每条流是独立的，聊天流丢包也不会影响其他流。</p>
<p><code>transport.closed</code> 正常关闭时 resolve，异常断开时 reject，所以可以分别显示“已离线”和尝试重连。</p>
<h2>落地时要注意什么</h2>
<p>部分企业网络会封锁 UDP，WebTransport 连不上，所以要准备 WebSocket 作为回退。检测浏览器是否支持，用 <code>&#x27;WebTransport&#x27; in globalThis</code>。</p>
<p>数据报的大小受网络路径的 MTU 限制，单个数据报不能太大，可以读 <code>transport.datagrams.maxDatagramSize</code> 看上限。</p>
<p>WebSocket 的流式接口见<a href="/questions/browser-websocket-stream/">《WebSocketStream 怎样处理消息类型与关闭生命周期？》</a>。</p>
<h2>常见追问</h2>
<p><strong>什么是队头阻塞？</strong></p>
<blockquote>
<p>在一条有序的通道里，前面的消息丢包重传时，后面已经到达的消息也不能先交给应用，只能排队等着。WebSocket 跑在 TCP 上就有这个问题。WebTransport 的多条流互相独立，一条卡住不影响其他流。</p>
</blockquote>
<p><strong>新项目要不要直接用 WebTransport？</strong></p>
<blockquote>
<p>看场景。普通的聊天、通知推送，WebSocket 足够，而且部署简单。只有在很在意延迟、能接受丢数据的场景，比如游戏，才值得上 WebTransport，同时还要保留 WebSocket 回退。</p>
</blockquote>`};export{e as default};