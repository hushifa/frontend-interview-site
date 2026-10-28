var e={answerHtml:`<h2>简答</h2>
<ul>
<li>WebSocketStream 把连接暴露为 ReadableStream 和 WritableStream，可以利用流的背压。</li>
<li>背压能限制积压，但不提供消息协议，业务仍要定义丢弃和限流策略。</li>
<li>opened、closed 和 close 要分别处理；文本和二进制消息分开解析。</li>
<li>它仍是实验性 API，不能直接替代普通 WebSocket，要准备降级方案。</li>
</ul>
<p>传统 WebSocket 的 <code>message</code> 事件会持续把消息交给应用；发送端可以通过 bufferedAmount 观察积压，但应用需要自己管理消费速度和队列。WebSocketStream 把连接的接收和发送暴露为 Web Streams，可使用流的背压与取消语义。</p>
<h2>流的背压不等于消息协议</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">consumeStream</span>(<span class="hljs-params">url, onMessage</span>) {
  <span class="hljs-keyword">if</span> (!(<span class="hljs-string">&#x27;WebSocketStream&#x27;</span> <span class="hljs-keyword">in</span> globalThis)) <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">&#x27;当前浏览器不支持 WebSocketStream&#x27;</span>);
  <span class="hljs-keyword">const</span> socket = <span class="hljs-keyword">new</span> <span class="hljs-title class_">WebSocketStream</span>(url);
  <span class="hljs-comment">// 提前观察关闭失败，避免 opened 拒绝后 closed 成为未处理拒绝。</span>
  <span class="hljs-keyword">const</span> completion = socket.<span class="hljs-property">closed</span>.<span class="hljs-title function_">then</span>(
    <span class="hljs-function">(<span class="hljs-params">value</span>) =&gt;</span> ({ <span class="hljs-attr">ok</span>: <span class="hljs-literal">true</span>, value }),
    <span class="hljs-function">(<span class="hljs-params">error</span>) =&gt;</span> ({ <span class="hljs-attr">ok</span>: <span class="hljs-literal">false</span>, error }),
  );
  <span class="hljs-keyword">let</span> writer;
  <span class="hljs-keyword">try</span> {
    <span class="hljs-keyword">const</span> { readable, writable } = <span class="hljs-keyword">await</span> socket.<span class="hljs-property">opened</span>;
    writer = writable.<span class="hljs-title function_">getWriter</span>();
    <span class="hljs-keyword">await</span> writer.<span class="hljs-title function_">write</span>(<span class="hljs-title class_">JSON</span>.<span class="hljs-title function_">stringify</span>({ <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;hello&#x27;</span> }));
    <span class="hljs-keyword">for</span> <span class="hljs-keyword">await</span> (<span class="hljs-keyword">const</span> message <span class="hljs-keyword">of</span> readable) <span class="hljs-keyword">await</span> <span class="hljs-title function_">onMessage</span>(message);
  } <span class="hljs-keyword">finally</span> {
    writer?.<span class="hljs-title function_">releaseLock</span>();
    socket.<span class="hljs-title function_">close</span>();
  }
  <span class="hljs-keyword">const</span> result = <span class="hljs-keyword">await</span> completion;
  <span class="hljs-keyword">if</span> (!result.<span class="hljs-property">ok</span>) <span class="hljs-keyword">throw</span> result.<span class="hljs-property">error</span>;
  <span class="hljs-keyword">return</span> result.<span class="hljs-property">value</span>;
}
</code></pre></div>
<p>此处读取的是 WebSocket 消息流，不是 fetch 响应的任意字节分块。文本消息以字符串交付，二进制消息以 ArrayBuffer 交付。若业务约定每条文本消息就是一个 JSON，可以按消息解析；是否是一条完整业务对象由应用协议决定。</p>
<p>WebSocketStream 当前支持度有限，且 API 语义可能随浏览器实现变化。正式项目要做特性检测和 WebSocket 降级，不能因为本机 Chromium 可运行就覆盖所有用户。</p>
<h2>背压能限制积压，但不能消除所有成本</h2>
<p>读取循环里的 <code>await onMessage</code> 让消费速度反馈到流；如果回调不断启动后台 Promise 却立即返回，应用仍可能积压未完成工作。下游应有界，必要时丢弃已过期的实时状态或合并更新。</p>
<p>写入时等待 writer.write 的 Promise，表示流接受写入的节奏；这不是服务端已经处理业务的确认。需要可靠业务语义时，还要定义序号、确认、重试和幂等。</p>
<p>压缩、网络缓冲和服务器队列也会占用内存。背压是协作机制，不是整个进程内存的硬上限。</p>
<h2>opened、closed 和 close 需要分别处理</h2>
<p>构造连接后要等待 opened 成功或失败；closed 用于观察结束原因。连接失败、服务端关闭和用户主动 close 是不同状态，界面应按需要提示或重连。</p>
<p>释放 reader/writer 锁不会自动等待握手完成。socket.close() 发起关闭，不是用于等待完成的 Promise；需要观察结果时使用 socket.closed 并处理拒绝。不要把 WritableStream.close 的锁约束直接套在 socket.close 上。</p>
<p>重连不应自动重复发送有副作用消息。连接 ID、消息序号和服务端状态查询可以帮助判断哪些数据已经处理；实时光标或位置快照则可按新值覆盖旧值。</p>
<p>WebSocketStream 解决的是流式传输和背压接口，不替代身份认证、业务协议、权限或 WebRTC 音视频能力。没有它的浏览器仍应能够通过成熟 WebSocket 完成核心功能。</p>
<h2>文本消息与二进制消息分别解析</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">parseJsonMessage</span>(<span class="hljs-params">message</span>) {
  <span class="hljs-keyword">if</span> (<span class="hljs-keyword">typeof</span> message !== <span class="hljs-string">&#x27;string&#x27;</span>) {
    <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">TypeError</span>(<span class="hljs-string">&#x27;本协议只接受文本 JSON 消息&#x27;</span>);
  }
  <span class="hljs-keyword">if</span> (message.<span class="hljs-property">length</span> &gt; <span class="hljs-number">65536</span>) <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">RangeError</span>(<span class="hljs-string">&#x27;消息超出应用上限&#x27;</span>);
  <span class="hljs-keyword">return</span> <span class="hljs-title class_">JSON</span>.<span class="hljs-title function_">parse</span>(message);
}
</code></pre></div>
<p>这只完成 JSON 语法解析，返回值还需 Schema 校验。长度限制按 UTF-16 码元计算，不是网络字节数。若采用二进制协议，应根据 ArrayBuffer 的格式解码；不能先把不同 WebSocket 消息拼接成一段文本，再假装网络层丢失了消息边界。</p>
<h2>backpressure 也要考虑业务丢弃策略</h2>
<p>聊天消息通常不能丢；实时光标、传感器和行情快照则可能只需要最新值。当消费速度跟不上时，可以在应用层合并同一对象的旧快照，不能对所有数据都无条件丢弃。</p>
<p>如果下游必须按顺序处理每条消息，队列需要上限。达到上限后应暂停读取、拒绝新任务或让服务端降速；无限累积只会把问题从网络缓冲转移到 JavaScript 堆。</p>
<p>写入流的关闭、abort 和服务端关闭也要传达给业务。close 成功只表达连接关闭流程完成，不代表最后一条业务消息已被服务器持久化。需要确认的操作要有应用层 ack 和幂等键。</p>
<h2>连接失败、重连和权限过期</h2>
<p>opened 失败时不要进入读取循环；closed 结果应记录 code/reason，并区分用户主动关闭、网络断开和服务器拒绝。重连需要退避与最大尝试次数，避免网络断开时每个标签页同时高频重连。</p>
<p>认证令牌过期后，盲目重连同一 URL 不会恢复权限。应刷新或重新建立会话，并清理旧连接的 reader、writer 与事件监听。重连期间用户发出的操作要排队、失败或明确取消，不能悄悄丢失。</p>
<h2>实验性 API 的降级方案</h2>
<p>WebSocketStream 目前不是所有浏览器的 Baseline 能力。降级到 WebSocket 时，应用需要重新适配消息回调、bufferedAmount 和发送队列；不能只把构造函数替换成 <code>new WebSocket()</code> 就认为背压仍然存在。</p>
<p>如果实时业务不适合降级，应该给用户明确的不支持提示或切换到轮询/普通 HTTP，而不是在后台持续报错重试。测试要覆盖 API 不存在、连接超时、超大消息、慢消费者、服务端关闭和页面卸载。</p>
<h2>先确定消息边界，再谈流式解析</h2>
<p>WebSocketStream 保留 WebSocket 消息边界。只有应用自己把一个业务对象拆成多条消息时，才需要按自定义协议重新组装。业务协议最好明确一种格式，例如“长度前缀 + 二进制 payload”或“每条消息一行 JSON”，并限制单条消息最大长度。解析器遇到超限消息应主动关闭连接。文本帧含非法 UTF-8 时，浏览器会直接让连接失败，应用不会收到这条消息。</p>
<p>如果服务端发送的是 JSON 快照，可以在应用层给每条消息带 <code>id</code>、<code>type</code> 和 <code>version</code>。收到旧版本时丢弃，收到缺失字段时记录协议错误；这样即使重连后消息顺序发生变化，也不会把旧状态重新写回界面。解析、校验和渲染最好分开，避免异常消息直接影响 DOM。</p>
<h2>写入背压和业务确认是两件事</h2>
<p><code>writer.write()</code> 解决的是数据是否已经交给浏览器流的节奏，不能证明服务端已执行操作。比如发送“删除文件”时，客户端仍应等待服务端返回带请求 ID 的成功或失败响应，并在超时后明确告诉用户结果未知。重试前要确认操作是否幂等，否则可能重复创建记录或重复发送消息。</p>
<p>发送队列应设置上限。达到上限时可以暂停输入、合并最新状态或拒绝低优先级消息；不要无限把对象放进数组等待网络恢复。页面切到后台时也要评估是否暂停非关键发送，避免多个标签页同时保持高频连接。</p>
<h2>关闭流程要覆盖异常路径</h2>
<p>应用主动退出时，可以先停止产生新消息，再关闭 writer、取消 reader，最后关闭连接；但不能无限等待服务端确认。<code>pagehide</code>、网络断开和令牌过期都可能让这个流程被中断，因此清理逻辑需要幂等，重复调用不会抛出新的业务错误。</p>
<p>封装重连器时要使用指数退避和随机抖动，限制最大等待时间，并在页面不可见时降低频率。重连成功后先重新认证、协商协议版本，再按业务决定补发未确认消息还是重新拉取完整快照；不要盲目重放所有本地队列。</p>`};export{e as default};