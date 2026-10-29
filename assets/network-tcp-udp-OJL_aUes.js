var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>浏览器加载网页，HTTP/1.1 和 HTTP/2 都跑在 TCP 上：先三次握手建好连接，再把数据当成一条有序的字节流发过去，丢了包会重传，接收方拿到的顺序和发送方一致。UDP 不建连接，每次发一个独立的数据报，发出去就不管了，可能丢、可能重复、可能乱序。</p>
<p>为什么还要 UDP？因为它简单、没有握手和重传带来的等待。对实时音视频来说，晚到的旧画面已经没用了，与其等重传，不如直接丢掉看下一帧。</p>
<p>前端最常碰到的两个例子是 QUIC 和 WebRTC。HTTP/3 用的 QUIC 跑在 UDP 上，可是它在 UDP 之上自己做了连接、可靠传输、流控和 TLS 加密，所以不能说 HTTP/3 不可靠。WebRTC 的媒体流和 <code>RTCDataChannel</code> 通常也走 UDP，数据通道还能设置成不重传、不保序。</p>
<p>要注意，“TCP 可靠、UDP 不可靠”说的是协议本身提供什么保证。用 UDP 的应用可以在上面自己补上可靠性，QUIC 就是这样做的。</p>
</blockquote>
<h2>两者分别提供了什么</h2>
<p>RFC 1122 介绍传输层时，把两者概括成一句话：TCP 是可靠的、面向连接的传输服务，提供端到端可靠性、重新排序和流量控制；UDP 是无连接的“数据报”服务。RFC 9293 也说 TCP 提供“可靠、有序的字节流服务”。</p>
<p>UDP 的定义很短，RFC 768 只有三页。它说 UDP 用“最少的协议机制”给程序发消息，并且明确写着不保证送达，也不防重复。UDP 头部只有源端口、目的端口、长度和校验和四个字段，比 TCP 头部简单得多。</p>
<p>把区别放在一起看：</p>
<table><thead><tr><th>对比项</th><th>TCP</th><th>UDP</th></tr></thead><tbody><tr><td>连接</td><td>先三次握手</td><td>不建连接</td></tr><tr><td>数据形式</td><td>字节流，没有消息边界</td><td>一个个数据报，保留边界</td></tr><tr><td>可靠性</td><td>确认、重传，按序交付</td><td>不保证送达、顺序和不重复</td></tr><tr><td>流量控制、拥塞控制</td><td>有</td><td>协议本身没有</td></tr></tbody></table>
<p>“字节流没有消息边界”是什么意思？发送方分两次写入“abc”和“def”，TCP 接收方可能一次读到“abcdef”，也可能分三次读到。应用层要自己划分消息，HTTP 就靠头部和 <code>Content-Length</code> 或分块编码来划分。UDP 发一个数据报，对方收到的就是一个完整的数据报。</p>
<h2>为什么 QUIC 要建在 UDP 上</h2>
<p>TCP 是按顺序交付的，前面一个包丢了，后面的数据即使到了，也得等重传补上才能交给应用。HTTP/2 在一个 TCP 连接上跑多个请求，于是一个包丢失会卡住所有请求，这叫队头阻塞。</p>
<p>QUIC 把多路复用放在自己这层来做。RFC 9000 说，QUIC 的好处之一是避免多个流之间的队头阻塞：丢包时，只有数据在那个包里的流需要等重传，其他流可以继续。</p>
<p>那为什么不直接改 TCP？TCP 在操作系统内核里实现，路上还有大量中间设备认识它，改起来推广很慢。RFC 9000 写明 QUIC 的包放在 UDP 数据报里传，为的是“更方便地部署在现有系统和网络中”。QUIC 在用户态实现，可以跟着浏览器和服务器更新。另外，QUIC 把传输握手和 TLS 1.3 握手合在一起做，包内容也大部分是加密的。HTTP 各版本的具体差别见<a href="/questions/http-versions/">《HTTP/1.1、HTTP/2 和 HTTP/3 的主要区别是什么？》</a>。</p>
<h2>WebRTC 用的是什么</h2>
<p>视频通话里，网络一抖，宁可画面糊一下也不要卡住等重传，所以媒体流适合跑在 UDP 上。</p>
<p><code>RTCDataChannel</code> 用来在两个浏览器之间直接传任意数据。按 MDN 的说明，它的底层是 SCTP 跑在 DTLS 上，SDP 里的协议一般写成 <code>&quot;UDP/DTLS/SCTP&quot;</code>，也就是 UDP 承载 DTLS，DTLS 承载 SCTP；也有 <code>&quot;TCP/DTLS/SCTP&quot;</code> 的情况。创建通道时可以选择要不要保证顺序和可靠：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> channel = peerConnection.<span class="hljs-title function_">createDataChannel</span>(<span class="hljs-string">&#x27;game-state&#x27;</span>, {
  <span class="hljs-attr">ordered</span>: <span class="hljs-literal">false</span>,
  <span class="hljs-attr">maxRetransmits</span>: <span class="hljs-number">0</span>,
});
</code></pre></div>
<p><code>ordered: false</code> 表示不要求按顺序交付，<code>maxRetransmits: 0</code> 表示丢了不重传。游戏里同步角色位置就适合这样设置，新位置马上会覆盖旧位置，旧数据丢了也无所谓。<code>maxRetransmits</code> 和 <code>maxPacketLifeTime</code> 只能二选一，同时传会抛错。</p>
<p>两端在不同的内网里时，可能没法直接连通，这时 WebRTC 会通过 TURN 服务器中转数据。</p>
<h2>常见追问</h2>
<p><strong>DNS 用 TCP 还是 UDP？</strong></p>
<blockquote>
<p>普通查询通常走 UDP，因为一问一答很短，不值得握手。RFC 1035 最初把 UDP 消息限制在 512 字节以内（后来的 EDNS 扩展可以放宽），超出时响应会带上截断标志（TC），客户端通常改用 TCP 重新查询；区域传送则要用 TCP。浏览器里的 DNS over HTTPS 走的是 HTTPS。</p>
</blockquote>
<p><strong>UDP 有校验和，为什么还说它不可靠？</strong></p>
<blockquote>
<p>校验和只能发现数据报在传输中损坏，损坏的会被丢掉。可是丢了以后 UDP 不会重传，也不管顺序，所以它保证不了数据一定送到。</p>
</blockquote>
<p><strong>浏览器里能直接发 UDP 吗？</strong></p>
<blockquote>
<p>普通网页不能直接打开 UDP 套接字。能用到 UDP 的途径是 HTTP/3、WebRTC，以及基于 HTTP/3 的 WebTransport，都是浏览器封装好的协议。</p>
</blockquote>`};export{e as default};