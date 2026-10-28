var e={answerHtml:`<h2>简答</h2>
<ul>
<li>WebSocket：一条 TCP 连接上的有序、可靠消息流，一个消息丢包重传时后面的消息都要等。</li>
<li>WebTransport：基于 HTTP/3（QUIC），可以打开多条互不阻塞的流，还能发送不保证到达的数据报（datagram）。</li>
<li>适合 WebTransport 的场景：游戏状态同步、实时音视频控制、大量并发的小请求，最新数据比旧数据更重要。</li>
<li>WebSocket 仍是更通用的选择：服务端、代理和负载均衡器普遍支持，基于 TCP 的网络环境更容易连通。</li>
<li>MDN 标为 Baseline 2026（2026 年 3 月起主流浏览器可用），服务端需要支持 HTTP/3。</li>
</ul>
<h2>对比</h2>
<table><thead><tr><th></th><th>WebSocket</th><th>WebTransport</th></tr></thead><tbody><tr><td>传输层</td><td>TCP</td><td>QUIC（UDP）</td></tr><tr><td>通道</td><td>一条有序消息流</td><td>多条独立流 + 数据报</td></tr><tr><td>可靠性</td><td>可靠</td><td>流可靠，数据报不可靠</td></tr><tr><td>背压</td><td>无，需要自己看 <code>bufferedAmount</code></td><td>基于 Streams，自带背压</td></tr><tr><td>服务端支持</td><td>广泛</td><td>需要 HTTP/3，生态较新</td></tr></tbody></table>
<h2>示例</h2>
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
<ul>
<li>位置信息用数据报发送，丢一帧也没关系，下一帧就会覆盖。</li>
<li>聊天消息必须送达，用可靠的流。</li>
<li>每条流独立，一条流丢包不影响其他流。</li>
</ul>
<h2>落地注意</h2>
<ul>
<li>部分企业网络会封锁 UDP，需要准备 WebSocket 作为回退。</li>
<li>检测支持：<code>&#x27;WebTransport&#x27; in globalThis</code>。</li>
<li>数据报大小受路径 MTU 限制，可以读取 <code>transport.datagrams.maxDatagramSize</code>。</li>
<li>WebSocket 的流式接口见<a href="/questions/browser-websocket-stream/">《WebSocketStream 怎样处理消息类型与关闭生命周期？》</a>。</li>
</ul>`};export{e as default};