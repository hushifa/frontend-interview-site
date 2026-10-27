var e={answerHtml:`<h2>WebRTC 连接不是“创建对象就通了”</h2>
<p>两台浏览器要传视频，至少要解决三件事：双方如何找到彼此并交换协商信息，网络上是否存在可达路径，连接建立后如何传输和恢复媒体。WebRTC 提供后两部分的大量能力，但不负责账号、房间、邀请和业务权限。</p>
<p>因此信令、ICE、STUN 和 TURN 不是同一个东西：信令负责传递信息，ICE 负责收集和检查候选路径，STUN 帮浏览器发现外部映射地址，TURN 在直连失败时中继流量。</p>
<h2>信令交换的是描述，不是视频</h2>
<p>应用可以用 WebSocket、HTTP 或其他自定义通道传递 offer、answer 和 ICE candidates。SDP 描述媒体能力、编码、方向和连接协商信息，不是摄像头视频本身。</p>
<p>典型流程是：</p>
<ol>
<li>一方创建 <code>RTCPeerConnection</code> 和本地媒体轨道。</li>
<li>创建 offer，设置本地描述并通过信令发送。</li>
<li>对方设置远端描述，创建 answer，再发回。</li>
<li>双方持续交换 ICE candidates。</li>
<li>连接状态变化后开始播放或发送数据。</li>
</ol>
<p>候选可能在远端描述设置前到达，因此信令层要暂存并按顺序处理：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> pendingCandidates = [];
<span class="hljs-keyword">let</span> remoteDescriptionReady = <span class="hljs-literal">false</span>;

<span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">receiveCandidate</span>(<span class="hljs-params">candidate</span>) {
  <span class="hljs-keyword">if</span> (!remoteDescriptionReady) {
    pendingCandidates.<span class="hljs-title function_">push</span>(candidate);
    <span class="hljs-keyword">return</span>;
  }
  <span class="hljs-keyword">await</span> peer.<span class="hljs-title function_">addIceCandidate</span>(candidate);
}

<span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">markRemoteReady</span>(<span class="hljs-params">description</span>) {
  <span class="hljs-keyword">await</span> peer.<span class="hljs-title function_">setRemoteDescription</span>(description);
  remoteDescriptionReady = <span class="hljs-literal">true</span>;
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> candidate <span class="hljs-keyword">of</span> pendingCandidates.<span class="hljs-title function_">splice</span>(<span class="hljs-number">0</span>)) {
    <span class="hljs-keyword">await</span> peer.<span class="hljs-title function_">addIceCandidate</span>(candidate);
  }
}
</code></pre></div>
<p>真实应用还要处理双方同时发起协商、增加轨道、网络切换和冲突，通常采用 perfect negotiation 等成熟模式。信令服务必须做房间鉴权；允许浏览器访问麦克风不代表用户有权加入任意会议。</p>
<h2>ICE 会寻找可用候选对</h2>
<p>浏览器会收集不同类型的候选：本机网络接口地址、通过 STUN 得到的服务器反射地址，以及 TURN 分配的中继地址。ICE 对候选对进行连通性检查，选择一条可工作的路径。</p>
<p>STUN 只是帮助浏览器了解自己在外部网络看到的映射地址。它不能保证 NAT 会允许入站连接，也不能解决企业防火墙、UDP 限制和对称 NAT。只在同一个 Wi-Fi 下测试成功，不能证明跨运营商和公司网络可用。</p>
<h2>TURN 是可靠性成本，不是可选装饰</h2>
<p>直连失败时，TURN 服务器可以作为中继转发媒体和数据。生产系统通常需要鉴权的 TURN 服务，而不是只配置一个公共 STUN 地址。TURN 会消耗服务器带宽，需要规划凭据、地域、容量、计费和过期时间。</p>
<p>中继服务器负责传输，不自动理解房间、录制或业务协议。WebRTC 的传输加密也不等同于“服务器永远无法访问媒体”，尤其在 SFU、混流、录制等架构中，媒体可能在服务器侧被处理。安全声明必须结合实际拓扑和密钥设计。</p>
<h2>多人会议通常需要媒体服务器</h2>
<p>N 个浏览器两两建立连接时，每个用户的上传、编码和连接数量会迅速增加。多人会议常用 SFU 接收并转发各路媒体，或使用混流服务器生成一路视频。此时 <code>RTCPeerConnection</code> 的对端可能是媒体服务器，不一定是另一台浏览器。</p>
<p><code>RTCDataChannel</code> 可以独立传输聊天、控制和协作数据，不要求先打开摄像头。可靠性、顺序、消息大小和拥塞策略要按业务选择，不能把媒体轨道的假设直接套到数据通道。</p>
<h2>连接成功后仍要管理生命周期</h2>
<p>监听 <code>iceConnectionState</code>、<code>connectionState</code> 和轨道事件，区分短暂 <code>disconnected</code> 与确定 <code>failed</code>。网络切换可能需要 ICE restart 或重新协商，不要一有抖动就销毁整个会话。重连仍要重新检查房间权限和会话有效期。</p>
<p>结束通话时关闭 PeerConnection、移除信令监听和计时器，并停止不再使用的 <code>MediaStreamTrack</code>：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">closeCall</span>(<span class="hljs-params">stream, peer, cleanupSignal</span>) {
  <span class="hljs-title function_">cleanupSignal</span>();
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> track <span class="hljs-keyword">of</span> stream?.<span class="hljs-title function_">getTracks</span>() ?? []) track.<span class="hljs-title function_">stop</span>();
  peer.<span class="hljs-title function_">close</span>();
}
</code></pre></div>
<p>关闭连接不会自动停止所有摄像头来源，也不会自动清空 <code>video.srcObject</code>。诊断可以使用 <code>getStats()</code> 查看候选路径、丢包和往返时间，但日志要避免暴露不必要的网络地址和媒体内容。验收应覆盖权限拒绝、跨网、TURN、设备切换、后台恢复和重连。</p>`};export{e as default};