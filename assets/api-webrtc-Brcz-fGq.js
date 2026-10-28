var e={answerHtml:`<h2>简答</h2>
<ul>
<li><strong>信令</strong>：建立连接前，双方要交换 SDP（媒体能力和编码参数）和 ICE 候选（可用的网络地址）。WebRTC 不规定信令方式，一般用 WebSocket 或 HTTP 实现。</li>
<li><strong>STUN</strong>：设备通常在 NAT 后面，只知道自己的内网地址。STUN 服务器告诉它&quot;你在公网上看起来是哪个 IP 和端口&quot;，用于打洞直连。</li>
<li><strong>TURN</strong>：对称型 NAT 或严格防火墙下无法直连时，TURN 服务器中转所有媒体数据。成本高，但保证能连上。</li>
<li><strong>ICE</strong>：收集所有候选地址（本地、STUN 得到的、TURN 中继），逐对尝试连通，选出最好的一条路径。</li>
</ul>
<h2>连接流程</h2>
<ol>
<li>A 创建 <code>RTCPeerConnection</code>，添加音视频轨道，生成 offer 并设为本地描述。</li>
<li>A 通过信令把 offer 发给 B。</li>
<li>B 设为远端描述，生成 answer，通过信令发回 A。</li>
<li>双方在 <code>icecandidate</code> 事件中拿到候选，通过信令发给对方，对方调用 <code>addIceCandidate</code>。</li>
<li>ICE 找到可用路径，<code>connectionState</code> 变为 <code>connected</code>，媒体开始传输。</li>
</ol>
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
<p>双方同时发起协商时容易冲突，处理方法见<a href="/questions/api-webrtc-perfect-negotiation/">《WebRTC 的 perfect negotiation 如何避免协商碰撞？》</a>。</p>
<h2>TURN 的部署要点</h2>
<ul>
<li>生产环境一定要配置 TURN，否则一部分用户会连不上。</li>
<li>TURN 凭据要由服务端按用户签发并设置短有效期，不要把长期密码写在前端代码里。</li>
<li>只有 UDP 被封时还可以用 <code>turns:</code>（TLS over TCP 443 端口）穿透。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li>多人会议也是点对点吗：人数少可以网状互连，人数多时通常用 SFU 服务器转发，每个人只上传一路。</li>
<li>数据通道：<code>pc.createDataChannel()</code> 可以在同一连接上传任意数据，支持可靠和不可靠两种模式。</li>
</ul>`};export{e as default};