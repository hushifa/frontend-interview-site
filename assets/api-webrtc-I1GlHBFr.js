var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>两个浏览器要视频通话，连上之前得先互相了解：支持什么编码，以及从哪个地址能找到对方。前者叫 SDP，后者叫 ICE 候选。WebRTC 不规定怎么交换这些信息，这条通道叫信令，要自己用 WebSocket 或 HTTP 实现。</p>
<p>难点在网络地址。设备通常在 NAT（路由器的地址转换）后面，只知道自己的内网地址。STUN 服务器的作用是告诉它“你在公网上看起来是哪个 IP 和端口”，双方拿着公网地址尝试打洞直连。</p>
<p>但对称型 NAT 或严格的防火墙下，打洞会失败。这时就要 TURN 服务器，把所有媒体数据中转过去。成本高，但保证能连上。</p>
<p>把这些串起来的是 ICE：它收集所有候选地址，包括本地的、STUN 得到的、TURN 中继的，一对一对试，选出最好的一条路。所以生产环境一定要配 TURN，否则总有一部分用户连不上。</p>
</blockquote>
<h2>一次连接是怎么建立的</h2>
<p>整个过程分五步：</p>
<ol>
<li>A 创建 <code>RTCPeerConnection</code>，添加音视频轨道，生成 offer 并设为本地描述。</li>
<li>A 通过信令把 offer 发给 B。</li>
<li>B 把它设为远端描述，生成 answer，通过信令发回 A。</li>
<li>双方在 <code>icecandidate</code> 事件里拿到自己的候选地址，通过信令发给对方，对方调用 <code>addIceCandidate</code>。</li>
<li>ICE 找到可用的路径，<code>connectionState</code> 变成 <code>connected</code>，媒体开始传输。</li>
</ol>
<p>可以看到，第 2、3、4 步都要靠信令。WebRTC 自己只负责第 5 步以后的传输。</p>
<p>下面是创建连接时配置 STUN 和 TURN 的代码：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> pc = <span class="hljs-keyword">new</span> <span class="hljs-title class_">RTCPeerConnection</span>({
  <span class="hljs-attr">iceServers</span>: [
    { <span class="hljs-attr">urls</span>: <span class="hljs-string">&#x27;stun:stun.example.com:3478&#x27;</span> },
    { <span class="hljs-attr">urls</span>: <span class="hljs-string">&#x27;turn:turn.example.com:3478&#x27;</span>, <span class="hljs-attr">username</span>: <span class="hljs-string">&#x27;user&#x27;</span>, <span class="hljs-attr">credential</span>: <span class="hljs-string">&#x27;temp-token&#x27;</span> },
  ],
});

pc.<span class="hljs-property">onicecandidate</span> = <span class="hljs-function">(<span class="hljs-params">{ candidate }</span>) =&gt;</span> signaling.<span class="hljs-title function_">send</span>({ candidate });
pc.<span class="hljs-property">ontrack</span> = <span class="hljs-function">(<span class="hljs-params">{ streams }</span>) =&gt;</span> {
  remoteVideo.<span class="hljs-property">srcObject</span> = streams[<span class="hljs-number">0</span>];
};
</code></pre></div>
<p>每发现一个候选地址，<code>onicecandidate</code> 就触发一次，通过信令发给对方。对方的音视频到达时触发 <code>ontrack</code>，把流交给 <code>&lt;video&gt;</code> 播放。</p>
<p>双方同时发起协商时容易冲突，处理方法见<a href="/questions/api-webrtc-perfect-negotiation/">《WebRTC 的 perfect negotiation 如何避免协商碰撞？》</a>。</p>
<h2>部署 TURN 要注意什么</h2>
<p>TURN 一定要配，否则处在严格网络里的用户就连不上。</p>
<p>TURN 会中转流量，谁都能用就会被白嫖带宽。所以凭据要由服务端按用户签发，设置很短的有效期，不要把长期密码写在前端代码里。</p>
<p>有些网络把 UDP 全封了，这时还可以用 <code>turns:</code>，也就是走 TCP 443 端口上的 TLS，这个端口和 HTTPS 相同，通常不会被防火墙拦截。</p>
<h2>常见追问</h2>
<p><strong>多人会议也是点对点吗？</strong></p>
<blockquote>
<p>人少的时候可以网状互连，每个人和其他人各连一条。人多了上传带宽扛不住，通常用 SFU 服务器转发，每个人只上传一路，由服务器分发给其他人。</p>
</blockquote>
<p><strong>WebRTC 只能传音视频吗？</strong></p>
<blockquote>
<p>不是。用 <code>pc.createDataChannel()</code> 可以在同一条连接上传任意数据，还能选可靠或不可靠两种模式。</p>
</blockquote>`};export{e as default};