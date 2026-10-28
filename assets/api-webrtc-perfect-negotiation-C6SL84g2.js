var e={answerHtml:`<h2>简答</h2>
<ul>
<li>双方同时发起协商会产生 offer collision。</li>
<li>perfect negotiation 给两端分配 polite 和 impolite 角色：polite 方回滚并接受对方的 offer，impolite 方忽略冲突的 offer。</li>
<li>用 makingOffer 和 ignoreOffer 判断冲突，现代浏览器设置远端 offer 时会隐式回滚。</li>
<li>ICE restart 与重新连接不同；信令、权限和资源清理仍由应用负责。</li>
</ul>
<p>在最简单的 WebRTC 演示中，一方创建 offer，另一方创建 answer，看起来像严格的请求响应。但真实应用会在很多时刻触发重新协商：用户打开摄像头、共享屏幕、添加数据通道、切换发送方向，或者网络恢复后进行 ICE restart。如果双方恰好同时创建并发送 offer，就会出现 offer collision，两个连接都可能等待对方的 answer，甚至进入 <code>have-local-offer</code> 与 <code>have-remote-offer</code> 无法继续的状态。</p>
<p>“让某一方永远先发”并不能彻底解决问题，因为消息延迟、用户操作和网络恢复会改变时序。更稳妥的做法是让双方运行同一套协商逻辑，只给每个连接分配两个角色：</p>
<ul>
<li><strong>polite（礼让方）</strong>：发生碰撞时愿意回滚自己的本地 offer，接受对方的 offer；</li>
<li><strong>impolite（不礼让方）</strong>：发生碰撞时忽略收到的 offer，继续完成自己已经开始的协商。</li>
</ul>
<p>角色只解决“谁在碰撞时退让”，不代表谁拥有更高业务权限，也不能代替房间鉴权。</p>
<h2>先理解碰撞条件</h2>
<p><code>negotiationneeded</code> 表示连接需要重新协商，但它不是“立刻发送 offer”的保证。事件可能因为多个变更被合并，也可能在应用尚未完成上一次协商时再次触发。发送 offer 前应维护 <code>makingOffer</code> 标记，并在收到远端描述时检查连接状态：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> peer = <span class="hljs-keyword">new</span> <span class="hljs-title class_">RTCPeerConnection</span>({
  <span class="hljs-attr">iceServers</span>: [{ <span class="hljs-attr">urls</span>: <span class="hljs-string">&#x27;stun:stun.example.test&#x27;</span> }],
});

<span class="hljs-keyword">const</span> polite = <span class="hljs-comment">/* 由房间内的稳定角色分配决定 */</span> <span class="hljs-literal">true</span>;
<span class="hljs-keyword">let</span> makingOffer = <span class="hljs-literal">false</span>;
<span class="hljs-keyword">let</span> ignoreOffer = <span class="hljs-literal">false</span>;

peer.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;negotiationneeded&#x27;</span>, <span class="hljs-title function_">async</span> () =&gt; {
  <span class="hljs-keyword">try</span> {
    makingOffer = <span class="hljs-literal">true</span>;
    <span class="hljs-keyword">await</span> peer.<span class="hljs-title function_">setLocalDescription</span>();
    <span class="hljs-title function_">signal</span>({ <span class="hljs-attr">description</span>: peer.<span class="hljs-property">localDescription</span> });
  } <span class="hljs-keyword">catch</span> (error) {
    <span class="hljs-title function_">reportNegotiationError</span>(error);
  } <span class="hljs-keyword">finally</span> {
    makingOffer = <span class="hljs-literal">false</span>;
  }
});

peer.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;icecandidate&#x27;</span>, <span class="hljs-function">(<span class="hljs-params">{ candidate }</span>) =&gt;</span> {
  <span class="hljs-title function_">signal</span>({ candidate });
});
</code></pre></div>
<p>这里的 <code>setLocalDescription()</code> 不传参数时，会根据当前状态创建合适的 offer 或 answer。它必须在 <code>negotiationneeded</code> 的异步处理里完成，并将完整的本地描述通过信令发送。<code>signal</code> 只是业务层的占位函数，可以用 WebSocket、WebTransport 或其他经过鉴权的通道实现；WebRTC 本身不提供房间和信令服务器。</p>
<h2>收到远端描述时先判断是否冲突</h2>
<p>收到一个 offer 时，下面这个判断表达了“当前是否已经有本地 offer，且这次 offer 不是我们可以接受的正常结果”：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">receiveDescription</span>(<span class="hljs-params">description</span>) {
  <span class="hljs-keyword">const</span> readyForOffer = !makingOffer &amp;&amp;
    (peer.<span class="hljs-property">signalingState</span> === <span class="hljs-string">&#x27;stable&#x27;</span> || peer.<span class="hljs-property">signalingState</span> === <span class="hljs-string">&#x27;have-remote-offer&#x27;</span>);
  <span class="hljs-keyword">const</span> offerCollision = description.<span class="hljs-property">type</span> === <span class="hljs-string">&#x27;offer&#x27;</span> &amp;&amp; !readyForOffer;

  ignoreOffer = !polite &amp;&amp; offerCollision;
  <span class="hljs-keyword">if</span> (ignoreOffer) <span class="hljs-keyword">return</span>;

  <span class="hljs-keyword">if</span> (offerCollision) {
    <span class="hljs-keyword">await</span> peer.<span class="hljs-title function_">setLocalDescription</span>({ <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;rollback&#x27;</span> });
  }

  <span class="hljs-keyword">await</span> peer.<span class="hljs-title function_">setRemoteDescription</span>(description);

  <span class="hljs-keyword">if</span> (description.<span class="hljs-property">type</span> === <span class="hljs-string">&#x27;offer&#x27;</span>) {
    <span class="hljs-keyword">await</span> peer.<span class="hljs-title function_">setLocalDescription</span>();
    <span class="hljs-title function_">signal</span>({ <span class="hljs-attr">description</span>: peer.<span class="hljs-property">localDescription</span> });
  }
}
</code></pre></div>
<p>礼让方在碰撞时使用 <code>{ type: &#x27;rollback&#x27; }</code> 撤销自己的本地 offer，回到可以接受远端 offer 的状态，然后设置远端描述并生成 answer。不礼让方直接忽略碰撞 offer。<code>ignoreOffer</code> 还应影响后续 ICE 候选：如果忽略了某个 offer，属于它的候选也不能被无条件加入，否则 <code>addIceCandidate()</code> 可能因没有对应的远端描述而报错。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// icecandidate 监听已在上文注册，这里只处理接收端</span>
<span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">receiveCandidate</span>(<span class="hljs-params">candidate</span>) {
  <span class="hljs-keyword">try</span> {
    <span class="hljs-keyword">await</span> peer.<span class="hljs-title function_">addIceCandidate</span>(candidate);
  } <span class="hljs-keyword">catch</span> (error) {
    <span class="hljs-keyword">if</span> (!ignoreOffer) <span class="hljs-keyword">throw</span> error;
  }
}
</code></pre></div>
<p>这段示例假设信令层已经保证描述和候选属于同一个会话，并且候选到达顺序可处理。真实网络中候选可能先于远端描述到达，应像基础 WebRTC 题中那样暂存，待 <code>setRemoteDescription()</code> 成功后按顺序加入。不能因为采用 perfect negotiation 就忽略候选的时序问题。</p>
<h2>为什么 rollback 比手动清空状态可靠</h2>
<p><code>signalingState</code> 是浏览器对 SDP 协商状态的约束。手动把自己的变量改成“空闲”并不会改变 <code>RTCPeerConnection</code> 的内部状态。现行规范和现代浏览器在 <code>have-local-offer</code> 时调用 <code>setRemoteDescription(offer)</code> 会隐式执行 rollback，示例中显式 rollback 主要为了兼容旧实现并让意图更清楚。rollback 让浏览器撤销尚未完成的本地描述，并恢复到稳定状态，再接受新的远端 offer。</p>
<p>rollback 只能处理尚未完成的协商。它不能撤销已经应用的媒体轨道、权限决定或业务状态，也不能修复服务端把旧房间消息误发到新连接的问题。每条信令消息都应带会话标识、单调递增序号或可验证的连接代际，重连后清理旧连接的监听器和待处理消息。</p>
<h2>重新连接与 ICE restart 不是同一个动作</h2>
<p><code>iceConnectionState</code> 或 <code>connectionState</code> 进入 <code>disconnected</code> 可能只是短暂网络抖动；立即关闭连接会丢失正在进行的媒体和数据。进入 <code>failed</code>、检测到网络接口变化，或确认候选路径已经失效时，通常才考虑 ICE restart 或重新建立连接。ICE restart 会更新 ICE 凭据并需要重新协商，仍应走同一套碰撞处理逻辑：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">restartIce</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">if</span> (peer.<span class="hljs-property">connectionState</span> === <span class="hljs-string">&#x27;closed&#x27;</span>) <span class="hljs-keyword">return</span>;
  peer.<span class="hljs-title function_">restartIce</span>();
  <span class="hljs-comment">// restartIce 会促使后续的 negotiationneeded；不要在这里并行手写第二个 offer。</span>
}
</code></pre></div>
<p><code>restartIce()</code> 不等于无条件立即连接成功，也不保证 TURN 一定可用。生产环境需要监控候选类型、往返时间、丢包和失败原因，必要时切换有鉴权和容量规划的 TURN 服务。<code>getStats()</code> 的网络地址和媒体指标属于诊断数据，日志中应控制权限和保留期限。</p>
<h2>信令、权限和资源生命周期仍要由应用负责</h2>
<p>perfect negotiation 只解决 SDP 协商竞争，不能解决以下问题：</p>
<ul>
<li>房间成员是否有权接收或发送媒体；</li>
<li>用户拒绝摄像头或麦克风后，UI 是否仍能完成纯音频或只读观看；</li>
<li>屏幕共享结束、设备拔出、标签页进入后台后，轨道和预览是否正确停止；</li>
<li>用户离开房间后，WebSocket、定时器、<code>RTCPeerConnection</code>、<code>MediaStreamTrack</code> 和待处理候选是否全部清理；</li>
<li>重连期间旧信令消息是否会污染新连接。</li>
</ul>
<p>结束通话时应显式关闭信令和 PeerConnection，并停止不再使用的轨道：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">closePeerConnection</span>(<span class="hljs-params">peer, stream, removeSignalListener</span>) {
  removeSignalListener?.();
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> track <span class="hljs-keyword">of</span> stream?.<span class="hljs-title function_">getTracks</span>() ?? []) {
    track.<span class="hljs-title function_">stop</span>();
  }
  peer.<span class="hljs-title function_">close</span>();
}
</code></pre></div>
<p><code>peer.close()</code> 不会替应用停止所有媒体采集，也不会自动销毁页面上的 <code>&lt;video&gt;</code> 预览或业务定时器。重复关闭应是幂等的，异步信令回调在关闭后收到消息时也要安全返回。</p>
<h2>如何验证协商逻辑</h2>
<p>单次两人通话成功不能证明协商实现可靠。至少要制造以下时序：</p>
<ol>
<li>两端同时添加轨道，确认其中一端礼让、另一端继续，并最终回到 <code>stable</code>；</li>
<li>在上一次 answer 尚未到达时连续添加多个轨道，确认不会并行发送互相覆盖的 offer；</li>
<li>让 ICE candidate 早于远端描述到达，确认会暂存而不是丢失；</li>
<li>连接进入 <code>disconnected</code> 后恢复网络，确认不会重复创建多个 PeerConnection；</li>
<li>关闭页面或离开房间时，确认旧信令不能修改新连接；</li>
<li>拒绝媒体权限、没有可用摄像头和 TURN 不可达时，确认用户仍能得到明确错误和退出路径。</li>
</ol>
<p>面试中完整的回答不应只说“监听 <code>negotiationneeded</code>”。关键是把协商状态、碰撞时的回滚策略、候选的关联、重连代际和资源生命周期放在同一个状态模型里。perfect negotiation 让双方都能处理任意一方发起的变更，但它仍然需要可靠的信令顺序、房间鉴权和对失败路径的明确设计。</p>`};export{e as default};