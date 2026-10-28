var e={answerHtml:`<h2>简答</h2>
<ul>
<li>WebTransport 基于 HTTP/3，提供多条可靠流和不可靠数据报。</li>
<li>先判断数据能否丢失：能丢的状态更新适合数据报，必须送达的用可靠流。</li>
<li>会话建立不等于用户已登录，仍要做身份认证。</li>
<li>WebSocket 更成熟、部署更简单，很多场景仍是更好的选择。</li>
</ul>
<h2>先看数据能不能丢</h2>
<p>聊天消息、支付确认和协作操作通常要求可靠、有序并能确认业务结果；实时光标、传感器和位置快照则可能只关心最新状态，旧数据到达时已经没有价值。传输协议的选择应先从这个语义开始，而不是先比较 API 名称。</p>
<p>WebSocket 是成熟的双向消息通道，适合大量普通实时业务。WebTransport 通常基于 HTTP/3，提供多条可靠的单向或双向流，以及可能丢失、乱序的数据报：</p>
<table><thead><tr><th>数据</th><th>典型语义</th><th>选择方向</th></tr></thead><tbody><tr><td>聊天与操作确认</td><td>不能随意丢，需业务确认</td><td>WebSocket 或可靠 stream</td></tr><tr><td>多个独立大任务</td><td>每条任务内部有序</td><td>多条 WebTransport stream</td></tr><tr><td>高频最新快照</td><td>旧值可丢弃</td><td>WebTransport datagram</td></tr></tbody></table>
<p>可靠传输只保证协议层交付，不代表服务端事务成功。付款、写文件和发消息仍需要应用层响应、幂等键和错误恢复。</p>
<h2>WebTransport 的多路复用解决什么</h2>
<p>在一个 WebSocket 连接里，应用通常要自己交错不同消息。大文件或慢处理可能让后续小消息排队。WebTransport 的多个 stream 各自保持内部顺序，可以减少某条流的重传对其他流的队头阻塞。</p>
<p>但它们仍共享连接的拥塞控制、带宽、CPU 和内存。不能无限创建流，也不能把多个 stream 当成无限并行的线程。服务器和客户端都要限制流数量、缓冲区和单条任务大小。</p>
<p>可靠 stream 是字节流，不自带业务消息边界：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> writer = sendStream.<span class="hljs-property">writable</span>.<span class="hljs-title function_">getWriter</span>();
<span class="hljs-keyword">const</span> payload = <span class="hljs-keyword">new</span> <span class="hljs-title class_">TextEncoder</span>().<span class="hljs-title function_">encode</span>(<span class="hljs-title class_">JSON</span>.<span class="hljs-title function_">stringify</span>(message));
<span class="hljs-keyword">const</span> frame = <span class="hljs-title function_">encodeLengthPrefixed</span>(payload);
<span class="hljs-keyword">await</span> writer.<span class="hljs-title function_">write</span>(frame);
writer.<span class="hljs-title function_">releaseLock</span>();
</code></pre></div>
<p>接收方必须处理半包、多包、长度上限和解析错误。一次 <code>read()</code> 不一定对应一次 <code>write()</code>。datagram 保留数据报单位，但受尺寸限制，可能丢失或乱序，业务通常需要序号和时间戳来丢弃旧状态。</p>
<h2>会话接受不等于用户已登录</h2>
<p>创建 WebTransport 会话后要等待 <code>ready</code>，用 <code>closed</code> 观察结束原因。HTTP/3 握手成功只说明传输层建立，服务端仍需验证来源、短期凭据、租户和房间权限。不要把长期令牌直接放进 URL，因为 URL 可能进入代理和服务器日志。</p>
<p>部署还要满足 TLS、HTTP/3、服务器实现和代理链条件。部分网络限制 UDP 或 HTTP/3，导致本地测试成功、企业网络失败。生产系统应观测握手失败、协议版本和网络类型，并准备合理的降级路径。</p>
<h2>WebSocket 仍然常常是更好的选择</h2>
<p>WebSocket 的浏览器和基础设施覆盖更广，消息模型、监控和排障成本更低。它没有 WebTransport 那样的多路流和 datagram，但普通聊天、通知和协作消息通常不需要这些能力。发送端仍要控制队列和 <code>bufferedAmount</code>，不能无限 <code>send</code>。</p>
<p>只有在确实需要多条独立可靠流、可丢弃数据报或 HTTP/3 传输特性时，WebTransport 的额外复杂度才更有价值。比较时要包括服务器部署、握手、消息大小、弱网、浏览器覆盖、耗电和监控，而不是只测理想环境的一次延迟。</p>
<p>降级也不是把构造函数换成 <code>new WebSocket()</code>。如果原设计依赖不可靠快照，降级后要重新设计排队、合并、丢弃和消息封装；如果关键数据必须可靠，则要在两种传输上统一应用层协议。</p>
<p>WebTransport 和 WebSocket 都不是完整的音视频会议栈。摄像头、媒体协商和网络自适应应评估 WebRTC，不要因为名字包含 Transport 就从头重建媒体系统。</p>`};export{e as default};