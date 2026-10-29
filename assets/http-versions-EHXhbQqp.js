var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>三个版本的请求方法、状态码、头部含义完全一样，变的是数据在网络上怎么传。</p>
<p>HTTP/1.1 是文本协议，一个连接同一时间只能处理一个请求，浏览器只好对每个域名开 6 个左右的连接来并发。HTTP/2 改成二进制分帧，一条 TCP 连接里可以同时跑很多个请求，这叫多路复用，还用 HPACK 压缩头部。可它还是跑在 TCP 上，TCP 丢一个包，所有请求都得等重传。</p>
<p>HTTP/3 换到了基于 UDP 的 QUIC 上。每个请求独立重传，一个丢包不影响别的。QUIC 把建连和 TLS 1.3 握手合成一次，新连接 1 个往返，恢复连接可以 0-RTT；手机切网络时还能靠连接 ID 保持连接。</p>
<p>浏览器怎么知道服务器支持哪个版本？HTTP/2 在 TLS 握手里用 ALPN 协商；HTTP/3 靠 <code>Alt-Svc</code> 响应头或者 DNS 的 HTTPS 记录来发现。</p>
</blockquote>
<h2>HTTP/1.1 卡在哪</h2>
<p>最大的问题是队头阻塞。意思是同一个连接上，前一个响应没传完，后面的请求只能排队等着。规范里有个管线化，允许连续发多个请求，但因为实现问题，浏览器基本没启用。</p>
<p>另一个问题是头部重复。每个请求都带着完整的 Cookie、User-Agent，很多是一模一样的内容。</p>
<p>所以当年有一堆优化手段：雪碧图、合并文件、域名分片，本质都是在减少请求数或者多开连接。到了 HTTP/2，这些大多没必要了，域名分片还会拆散连接，反而削弱多路复用。</p>
<h2>HTTP/2 改了什么</h2>
<p>HTTP/2 把请求和响应切成一个个小块，叫帧，每个请求对应一个流。不同流的帧可以交错着发，所以一条连接上能同时跑很多请求。</p>
<p>头部用 HPACK 压缩，它靠静态表、动态表和哈夫曼编码，把重复出现的头部变成很短的编号。</p>
<p>优先级方面，最早的依赖树方案已经在 RFC 9113 里废弃了，现在用 RFC 9218 定义的 <code>Priority</code> 头，里面是 <code>urgency</code> 和 <code>incremental</code> 两个参数。</p>
<p>Server Push 也值得一提，它让服务器主动推资源。Chrome 已经移除了支持，替代方案是 103 Early Hints，见<a href="/questions/network-early-hints/">《HTTP 103 Early Hints 适合怎样的加载优化？》</a>。</p>
<p>另外，浏览器只在 HTTPS 上使用 HTTP/2。</p>
<h2>为什么 HTTP/3 要换掉 TCP</h2>
<p>HTTP/2 在 HTTP 这一层解决了排队，可 TCP 那一层还有排队。TCP 保证字节按顺序交付，一个包丢了，后面已经到的包也得等它重传完。这时所有流都卡住，哪怕丢的包只属于其中一个。</p>
<p>QUIC 在 UDP 之上、在用户态自己实现了可靠传输、拥塞控制和加密，而且每个流单独保证顺序，流之间互不阻塞。</p>
<p>TLS 1.3 直接内置在 QUIC 握手里，没有单独的一轮 TLS 往返。QUIC 用连接 ID 而不是 IP 和端口来识别连接，所以手机从 Wi-Fi 切到蜂窝网络，连接不会断。头部压缩也换成了 QPACK，因为流可能乱序到达，HPACK 那套依赖顺序的方式不再适用。</p>
<p>首次访问通常还是走 HTTP/2。浏览器从响应里看到 <code>Alt-Svc: h3=&quot;:443&quot;</code>，才知道可以用 HTTP/3，后面的请求再升级。DNS 的 HTTPS 记录（也叫 SVCB）可以让浏览器在第一次连接前就知道。</p>
<h2>上了 HTTP/3 一定更快吗</h2>
<p>不一定，收益取决于网络。丢包多、延迟高的移动网络里收益最明显；内网或者丢包很少的环境，差别很小。</p>
<p>还有些企业网络会封 UDP，这时浏览器会回退到 HTTP/2。值不值得开，要看真实用户的数据。</p>
<h2>常见追问</h2>
<p><strong>怎么看当前用的是哪个版本？</strong></p>
<blockquote>
<p>看 DevTools Network 面板的 Protocol 列，<code>h2</code> 就是 HTTP/2，<code>h3</code> 就是 HTTP/3。代码里可以读 <code>PerformanceResourceTiming.nextHopProtocol</code>。</p>
</blockquote>
<p><strong>HTTP/2 下还需要合并文件吗？</strong></p>
<blockquote>
<p>不用为了减少请求数去合并。但小文件太多，压缩率和调度上仍有开销，按缓存粒度合理拆分就好。</p>
</blockquote>`};export{e as default};