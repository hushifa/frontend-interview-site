var e={answerHtml:`<h2>简答</h2>
<ul>
<li>HTTP/1.1：文本协议，一个连接同时只能处理一个请求，浏览器靠每个域名开约 6 个连接来并发。</li>
<li>HTTP/2：二进制分帧，在一条 TCP 连接上多路复用多个流，并用 HPACK 压缩头部。但 TCP 丢一个包，所有流都要等重传。</li>
<li>HTTP/3：跑在 QUIC（UDP）上，每个流独立重传，一个流丢包不影响其他流；QUIC 把传输和 TLS 1.3 握手合并，新连接 1 个往返，恢复连接可以 0-RTT；网络切换时可以靠连接 ID 迁移连接。</li>
<li>浏览器通过 TLS 的 ALPN 协商 HTTP/2，通过 <code>Alt-Svc</code> 响应头或 DNS 的 HTTPS 记录发现服务器支持 HTTP/3。</li>
</ul>
<h2>HTTP/1.1 的问题</h2>
<ul>
<li>队头阻塞：同一连接上前一个响应没结束，后面的请求只能等。管线化因为实现问题基本没被浏览器启用。</li>
<li>头部重复：每个请求都带完整的 Cookie、User-Agent。</li>
<li>当年的优化手段：雪碧图、合并文件、域名分片。在 HTTP/2 下这些手段大多没有必要，域名分片还会削弱多路复用。</li>
</ul>
<h2>HTTP/2</h2>
<ul>
<li>二进制帧和流：请求和响应被切成帧，交错发送，同一连接并发多个流。</li>
<li>HPACK：用静态表、动态表和哈夫曼编码压缩重复的头部。</li>
<li>优先级：原来的依赖树方案已在 RFC 9113 中废弃，现在用 RFC 9218 定义的 <code>Priority</code> 头（<code>urgency</code> 和 <code>incremental</code>）。</li>
<li>Server Push：Chrome 已移除支持，替代方案是 103 Early Hints，见《HTTP 103 Early Hints 适合怎样的加载优化？》。</li>
<li>浏览器只在 HTTPS 上使用 HTTP/2。</li>
</ul>
<h2>HTTP/3 与 QUIC</h2>
<ul>
<li>QUIC 在用户态实现可靠传输、拥塞控制和加密，流之间互不阻塞。</li>
<li>TLS 1.3 内置在 QUIC 握手中，没有单独的 TLS 往返。</li>
<li>连接 ID 让手机从 Wi-Fi 切到蜂窝网络时连接不中断。</li>
<li>头部压缩改用 QPACK，适配乱序到达的流。</li>
</ul>
<p>首次访问通常还是走 HTTP/2，浏览器从 <code>Alt-Svc: h3=&quot;:443&quot;</code> 得知可以用 HTTP/3 后，后续请求才升级。DNS 的 HTTPS（SVCB）记录可以让浏览器在第一次连接前就知道。</p>
<h2>收益取决于网络</h2>
<p>丢包多、延迟高的移动网络里 HTTP/3 收益最明显；内网或低丢包环境差别很小。部分企业网络会封 UDP，浏览器会回退到 HTTP/2。是否值得开启，以真实用户数据为准。</p>
<h2>常见追问</h2>
<ul>
<li>怎么看用的是哪个版本？DevTools Network 面板的 Protocol 列（<code>h2</code>、<code>h3</code>），或 <code>PerformanceResourceTiming.nextHopProtocol</code>。</li>
<li>HTTP/2 下还需要合并文件吗？不必为减少请求数合并，但过多小文件仍有压缩率和调度开销，按缓存粒度合理拆分即可。</li>
</ul>`};export{e as default};