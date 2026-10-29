var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>浏览器和服务器建 TCP 连接，要来回发三个包。浏览器先发一个 SYN，带上自己的初始序号，意思是“我想建连接”。服务器回一个 SYN+ACK，确认收到了浏览器的序号，同时带上自己的初始序号。浏览器再回一个 ACK，确认收到了服务器的序号。三个包走完，双方都知道对方能收也能发，也对齐了从哪个序号开始编号，连接就建好了。</p>
<p>为什么要三次，而不是两次？RFC 9293 给出的主要原因是防止旧的重复连接请求造成混乱。网络里可能滞留着很久以前发出的 SYN，如果服务器收到 SYN 就直接建连，就会为一个早已失效的请求白白建立连接。多了第三次，客户端可以识别出这是自己没发过的旧请求，回一个 RST 把它拒掉。</p>
<p>断开要四次，是因为 TCP 是双向的，每个方向要各自关闭。一方发 FIN 表示“我没有数据要发了”，对方回 ACK；但对方可能还有数据没发完，等它发完了，再发自己的 FIN，这边再回 ACK。所以回 ACK 和发 FIN 通常分成两步，一共四个包。</p>
<p>要注意，先发 FIN 的一方，收到对方的 FIN 并回了 ACK 以后，不会马上关闭，而要在 TIME-WAIT 状态等 2 倍 MSL。这是为了让最后那个 ACK 丢了还能重发，也让旧连接残留的包在网络里消失。</p>
</blockquote>
<h2>三次握手每一步确认了什么</h2>
<p>把三个包按时间排开看：</p>
<div class="not-prose code-block"><div class="code-language">text</div><pre><code class="hljs language-text">客户端                                服务器
CLOSED                                LISTEN
  | --- SYN, seq=x ------------------&gt; |
SYN-SENT                             SYN-RECEIVED
  | &lt;-- SYN, ACK, seq=y, ack=x+1 ----- |
ESTABLISHED
  | --- ACK, ack=y+1 ----------------&gt; |
                                     ESTABLISHED
</code></pre></div>
<p>第一个包让服务器知道：客户端能发，起始序号是 x。第二个包里的 <code>ack=x+1</code>，让客户端知道服务器收到了自己的 SYN，也就是服务器能收；同时 <code>seq=y</code> 是服务器自己的起始序号。第三个包的 <code>ack=y+1</code>，让服务器知道客户端收到了它的序号。</p>
<p>序号有什么用？TCP 靠序号给每个字节编号，接收方据此判断有没有丢包、顺序对不对。初始序号不是从 0 开始，而是每次随机选的，这样旧连接残留的包很难恰好落在新连接的序号范围里。</p>
<h2>两次握手会出什么问题</h2>
<p>假设只握两次，服务器收到 SYN、回了 SYN+ACK 就算建好连接。</p>
<p>现在有一个客户端很早以前发出的 SYN，在网络里绕了很久才到达服务器，客户端那边早就放弃了这次连接。服务器收到后回复并建好连接，开始分配资源等待数据，可客户端根本不会发数据，这个连接就白白占着。</p>
<p>有了第三次握手，服务器要等客户端的 ACK 才进入建立状态。客户端收到这个莫名其妙的 SYN+ACK，发现确认号对不上自己当前的请求，就回一个 RST，服务器收到后放弃这次连接。这就是 RFC 9293 说的，三次握手的主要目的是防止旧的重复连接请求造成混乱。</p>
<h2>四次挥手和 TIME-WAIT</h2>
<p>断开时的顺序是这样的，假设客户端先关：</p>
<div class="not-prose code-block"><div class="code-language">text</div><pre><code class="hljs language-text">客户端                                服务器
ESTABLISHED                          ESTABLISHED
  | --- FIN -------------------------&gt; |
FIN-WAIT-1                           CLOSE-WAIT
  | &lt;-- ACK -------------------------- |
FIN-WAIT-2                           （服务器继续发完剩余数据）
  | &lt;-- FIN -------------------------- |
TIME-WAIT                            LAST-ACK
  | --- ACK -------------------------&gt; |
（等 2 MSL）                          CLOSED
CLOSED
</code></pre></div>
<p>服务器收到 FIN 以后，先回 ACK，表示知道客户端不再发了。可服务器这边可能还有响应没发完，所以它进入 CLOSE-WAIT，把数据发完，再发自己的 FIN。两个方向的关闭分开进行，才多出了一个包。如果服务器刚好也没有数据要发，ACK 和 FIN 可以合在一个包里。</p>
<p>客户端为什么要在 TIME-WAIT 等 2 MSL？MSL 是一个包在网络里能存活的最长时间，RFC 9293 把它取作 2 分钟，实际系统通常设得更短。等这么久有两个目的：如果最后那个 ACK 丢了，服务器会重发 FIN，客户端还在，就能再回一次 ACK；同时让这个连接残留的包在网络里过期，不会混进之后用同样地址和端口建立的新连接。</p>
<h2>和前端有什么关系</h2>
<p>每次新建 TCP 连接都要先花 1 个往返握手，HTTPS 还要再加 TLS 握手，所以浏览器会尽量复用连接。HTTP/1.1 默认长连接，HTTP/2 在一个连接上并发多个请求，都是为了少握手。对关键的第三方域名用 <code>preconnect</code>，就是提前把握手做完。这些等待具体有多长，见<a href="/questions/network-dns-tcp-tls/">《DNS、TCP 和 TLS 握手分别会给页面增加哪些等待？》</a>。</p>
<h2>常见追问</h2>
<p><strong>握手阶段能携带数据吗？</strong></p>
<blockquote>
<p>标准的三次握手里，第三个 ACK 包可以携带数据。另外有 TCP Fast Open 扩展，允许在 SYN 里带数据，但需要客户端和服务器都支持，而且之前连接过。HTTP/3 用的 QUIC 走 UDP，把传输握手和 TLS 握手合在一起，新连接只要 1 个往返。</p>
</blockquote>
<p><strong>服务器上大量 TIME-WAIT 是什么原因？</strong></p>
<blockquote>
<p>TIME-WAIT 出现在主动关闭的一方。如果服务器主动关闭了大量短连接，比如没开长连接，它就会积累大量 TIME-WAIT。常见做法是开启长连接复用，减少频繁建连和断开。</p>
</blockquote>
<p><strong>什么是 SYN 洪泛攻击？</strong></p>
<blockquote>
<p>攻击者发大量 SYN 却不回第三个 ACK，服务器为每个半连接保留状态，资源被耗光。常见防护是 SYN Cookie，服务器不预先保存状态，而是把信息编码进自己的初始序号，等收到 ACK 再验证。</p>
</blockquote>`};export{e as default};