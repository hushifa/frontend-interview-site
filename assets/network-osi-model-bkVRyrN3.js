var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>浏览器发一个 HTTP 请求，数据要一层层往下交：HTTP 报文交给 TCP 分段，TCP 段交给 IP 加上地址，IP 包再交给网卡和 Wi-Fi 变成信号发出去，对方收到后一层层往上拆。网络模型就是把这个过程按职责分层。</p>
<p>OSI 是 ISO 和 ITU-T 定义的参考模型，共七层，从下往上是物理层、数据链路层、网络层、传输层、会话层、表示层、应用层。互联网实际用的是 TCP/IP 模型，RFC 1122 把它分成四层：链路层、网际层（IP 所在的层）、传输层、应用层。TCP/IP 的应用层通常被对应到 OSI 的上三层，会话层和表示层的事都交给应用自己处理。</p>
<p>分层的好处是每层只管自己的事。HTTP 不用关心数据走网线还是 Wi-Fi，换成 HTTP/3 时，下面的 IP 也不用改。</p>
<p>前端最常接触的是应用层的 HTTP、DNS、WebSocket，和传输层的 TCP、UDP、QUIC。TLS 放在哪一层没有统一说法，通常说它位于 TCP 和 HTTP 之间。</p>
</blockquote>
<h2>七层各管什么</h2>
<p>按 ITU-T X.200 的编号，从第 7 层往下排，配上前端常见的例子：</p>
<table><thead><tr><th>层</th><th>OSI 名称</th><th>负责什么</th><th>常见例子</th></tr></thead><tbody><tr><td>7</td><td>应用层</td><td>给应用提供网络服务</td><td>HTTP、DNS、WebSocket</td></tr><tr><td>6</td><td>表示层</td><td>数据的表示、编码转换</td><td>常被拿来举字符编码、压缩、加密的例子</td></tr><tr><td>5</td><td>会话层</td><td>管理双方的对话</td><td>很少有独立的协议对应</td></tr><tr><td>4</td><td>传输层</td><td>端到端传输</td><td>TCP、UDP</td></tr><tr><td>3</td><td>网络层</td><td>跨网络寻址和路由</td><td>IP、ICMP</td></tr><tr><td>2</td><td>数据链路层</td><td>同一个网络里相邻节点之间传帧</td><td>以太网、Wi-Fi 的 MAC 层</td></tr><tr><td>1</td><td>物理层</td><td>把比特变成电信号、光信号或无线电</td><td>网线、光纤、无线信号</td></tr></tbody></table>
<p>表里第 5、6 层的例子写得比较虚，这不是遗漏。互联网协议并没有按 OSI 的会话层和表示层单独设计，RFC 1122 也说，互联网的应用层“基本上合并了 OSI 最上面两层（表示层和应用层）的功能”。所以面试时把会话层、表示层讲成“概念上的划分，实际都在应用里实现”就够了。</p>
<h2>TCP/IP 四层是怎么对应的</h2>
<p>RFC 1122 给互联网主机定的四层是：</p>
<ul>
<li>应用层：HTTP、DNS、SMTP 这些。</li>
<li>传输层：给应用提供端到端通信，主要是 TCP 和 UDP。</li>
<li>网际层：IP 把数据从源主机送到目的主机，不保证送达，包可能损坏、重复、乱序或丢失，可靠性交给上层。</li>
<li>链路层：和直接连着的网络打交道，比如以太网。</li>
</ul>
<p>和 OSI 对照，通常的讲法是 OSI 的 5、6、7 层对应应用层（RFC 1122 原文只提到合并了表示层和应用层，会话层的功能在互联网里也由应用或传输层承担），4 层对应传输层，3 层对应网际层，1、2 层对应链路层。也有教材讲“五层模型”，就是把链路层拆回数据链路层和物理层，方便教学，它不是另外一套标准。</p>
<h2>前端为什么要知道这些</h2>
<p>排查网络问题时，分层能帮你定位卡在哪一步。浏览器 DevTools 的请求耗时里，DNS 查询属于应用层；建 TCP 连接属于传输层；TLS 握手在 TCP 之上；之后发请求、等首字节、下载内容都是 HTTP。每一步的等待见<a href="/questions/network-dns-tcp-tls/">《DNS、TCP 和 TLS 握手分别会给页面增加哪些等待？》</a>。</p>
<p>还有一些常见说法也和分层有关。“四层负载均衡”按 IP 和端口转发，不看 HTTP 内容；“七层负载均衡”能看到 URL 和请求头，可以按路径分流。CDN 和反向代理一般工作在七层。</p>
<h2>常见追问</h2>
<p><strong>TLS 属于哪一层？</strong></p>
<blockquote>
<p>没有标准答案。TLS 跑在 TCP 之上、给 HTTP 提供加密通道，按 TCP/IP 模型一般放在应用层里，或者说在传输层和应用层之间。把它归到 OSI 的表示层或会话层也有人这么讲，但这只是类比，OSI 标准并没有规定 TLS。</p>
</blockquote>
<p><strong>ping 用的是哪一层？</strong></p>
<blockquote>
<p><code>ping</code> 发的是 ICMP 回显请求。ICMP 和 IP 一样在网际层，它没有端口，所以 ping 得通不代表某个端口上的服务可用。</p>
</blockquote>
<p><strong>WebSocket 在哪一层？</strong></p>
<blockquote>
<p>应用层。它先用一次 HTTP 请求完成握手，之后在同一条 TCP 连接上按自己的帧格式收发消息。</p>
</blockquote>`};export{e as default};