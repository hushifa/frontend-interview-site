var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>比如做一个网页版客服聊天。前端要处理的核心问题有四个：消息按什么顺序显示、同一条消息会不会出现两次、发送失败了怎么办、断网回来以后漏掉的消息怎么补。</p>
<p>顺序以服务端为准。服务端给每个会话里的消息分配一个递增的序号，前端按序号排列，不用客户端的时间，因为各人手机的时钟不一样，网络到达顺序也不可靠。去重靠两种 ID：发送时客户端先生成一个唯一的客户端消息 ID，服务端确认后返回正式的序号；收到推送时序号已经有了，就丢掉。</p>
<p>发送状态分三种。点击发送后消息立刻显示，状态是发送中；收到服务端确认后变成已发送；超时没确认就标成失败，让用户点重发。重发必须用同一个客户端消息 ID，这样服务端其实已经收到、只是确认丢了的情况下，也不会存成两条。</p>
<p>连接方面，WebSocket 断了要自己退避重连；重连以后带上本地最后的序号，把断线期间的消息拉回来。浏览器的 WebSocket API 没有发送协议层 ping 的方法，所以要发应用层的心跳来及时发现假死连接。消息多了以后用虚拟列表渲染，往上加载历史消息时要保持滚动位置不跳。</p>
</blockquote>
<h2>消息为什么按服务端序号排</h2>
<p>两个人几乎同时发消息，各自的屏幕上应该显示同样的顺序。如果按客户端时间排，手机时钟有快有慢，顺序就可能不一致；如果按到达顺序排，网络有快有慢，重连补发的旧消息也会晚到。</p>
<p>所以通常由服务端在存储每条消息时，给它分配一个在这个会话里递增的序号。服务端只有一个，它定下的顺序所有客户端都一样。序号还有第二个用处：本地记住最后收到的序号，就知道从哪里开始补消息；序号中间断了一截，就知道漏了消息，可以主动拉取。</p>
<p>这里的序号是业务协议自己设计的，WebSocket 协议本身不提供消息编号、确认和重传，这些都要在应用层做。</p>
<h2>发送状态和去重怎样实现</h2>
<p>用户点发送时，消息还没有服务端序号。可是不能等服务端返回才显示，否则弱网下点了发送什么都没发生，用户会以为没点上。所以先生成一个客户端消息 ID，消息立刻以“发送中”的状态显示出来，服务端确认时带回这个 ID 和正式序号，前端按 ID 找到这条消息并更新。</p>
<p>下面模拟这套逻辑：本地乐观插入、确认后改状态、超时标失败、收到推送时去重，并始终按序号排序，还没有序号的消息排在最后：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">createStore</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">const</span> byClientId = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Map</span>();
  <span class="hljs-keyword">const</span> seqSeen = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Set</span>();

  <span class="hljs-keyword">function</span> <span class="hljs-title function_">list</span>(<span class="hljs-params"></span>) {
    <span class="hljs-keyword">return</span> [...byClientId.<span class="hljs-title function_">values</span>()].<span class="hljs-title function_">sort</span>(<span class="hljs-function">(<span class="hljs-params">a, b</span>) =&gt;</span> (a.<span class="hljs-property">seq</span> ?? <span class="hljs-title class_">Infinity</span>) - (b.<span class="hljs-property">seq</span> ?? <span class="hljs-title class_">Infinity</span>));
  }

  <span class="hljs-keyword">return</span> {
    <span class="hljs-title function_">sendLocal</span>(<span class="hljs-params">clientId, text</span>) {
      byClientId.<span class="hljs-title function_">set</span>(clientId, { clientId, text, <span class="hljs-attr">status</span>: <span class="hljs-string">&#x27;sending&#x27;</span>, <span class="hljs-attr">seq</span>: <span class="hljs-literal">null</span> });
    },
    <span class="hljs-title function_">ack</span>(<span class="hljs-params">clientId, seq</span>) {
      <span class="hljs-keyword">const</span> message = byClientId.<span class="hljs-title function_">get</span>(clientId);
      <span class="hljs-keyword">if</span> (!message || seqSeen.<span class="hljs-title function_">has</span>(seq)) <span class="hljs-keyword">return</span>;
      seqSeen.<span class="hljs-title function_">add</span>(seq);
      <span class="hljs-title class_">Object</span>.<span class="hljs-title function_">assign</span>(message, { seq, <span class="hljs-attr">status</span>: <span class="hljs-string">&#x27;sent&#x27;</span> });
    },
    <span class="hljs-title function_">fail</span>(<span class="hljs-params">clientId</span>) {
      <span class="hljs-keyword">const</span> message = byClientId.<span class="hljs-title function_">get</span>(clientId);
      <span class="hljs-keyword">if</span> (message &amp;&amp; message.<span class="hljs-property">status</span> === <span class="hljs-string">&#x27;sending&#x27;</span>) message.<span class="hljs-property">status</span> = <span class="hljs-string">&#x27;failed&#x27;</span>;
    },
    <span class="hljs-title function_">receive</span>(<span class="hljs-params">message</span>) {
      <span class="hljs-keyword">if</span> (seqSeen.<span class="hljs-title function_">has</span>(message.<span class="hljs-property">seq</span>)) <span class="hljs-keyword">return</span> <span class="hljs-literal">false</span>;
      seqSeen.<span class="hljs-title function_">add</span>(message.<span class="hljs-property">seq</span>);
      byClientId.<span class="hljs-title function_">set</span>(message.<span class="hljs-property">clientId</span>, { ...message, <span class="hljs-attr">status</span>: <span class="hljs-string">&#x27;sent&#x27;</span> });
      <span class="hljs-keyword">return</span> <span class="hljs-literal">true</span>;
    },
    list,
  };
}

<span class="hljs-keyword">const</span> store = <span class="hljs-title function_">createStore</span>();
store.<span class="hljs-title function_">receive</span>({ <span class="hljs-attr">clientId</span>: <span class="hljs-string">&#x27;b1&#x27;</span>, <span class="hljs-attr">text</span>: <span class="hljs-string">&#x27;你好&#x27;</span>, <span class="hljs-attr">seq</span>: <span class="hljs-number">1</span> });
store.<span class="hljs-title function_">sendLocal</span>(<span class="hljs-string">&#x27;a1&#x27;</span>, <span class="hljs-string">&#x27;在吗&#x27;</span>);
store.<span class="hljs-title function_">sendLocal</span>(<span class="hljs-string">&#x27;a2&#x27;</span>, <span class="hljs-string">&#x27;订单号 123&#x27;</span>);
store.<span class="hljs-title function_">ack</span>(<span class="hljs-string">&#x27;a1&#x27;</span>, <span class="hljs-number">2</span>);
store.<span class="hljs-title function_">fail</span>(<span class="hljs-string">&#x27;a2&#x27;</span>);

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(store.<span class="hljs-title function_">list</span>().<span class="hljs-title function_">map</span>(<span class="hljs-function">(<span class="hljs-params">m</span>) =&gt;</span> m.<span class="hljs-property">text</span> + <span class="hljs-string">&#x27;:&#x27;</span> + m.<span class="hljs-property">status</span>).<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27; | &#x27;</span>)); <span class="hljs-comment">// 你好:sent | 在吗:sent | 订单号 123:failed</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(store.<span class="hljs-title function_">receive</span>({ <span class="hljs-attr">clientId</span>: <span class="hljs-string">&#x27;b1&#x27;</span>, <span class="hljs-attr">text</span>: <span class="hljs-string">&#x27;你好&#x27;</span>, <span class="hljs-attr">seq</span>: <span class="hljs-number">1</span> })); <span class="hljs-comment">// false</span>

store.<span class="hljs-title function_">sendLocal</span>(<span class="hljs-string">&#x27;a2&#x27;</span>, <span class="hljs-string">&#x27;订单号 123&#x27;</span>);
store.<span class="hljs-title function_">ack</span>(<span class="hljs-string">&#x27;a2&#x27;</span>, <span class="hljs-number">4</span>);
store.<span class="hljs-title function_">receive</span>({ <span class="hljs-attr">clientId</span>: <span class="hljs-string">&#x27;b2&#x27;</span>, <span class="hljs-attr">text</span>: <span class="hljs-string">&#x27;请稍等&#x27;</span>, <span class="hljs-attr">seq</span>: <span class="hljs-number">3</span> });
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(store.<span class="hljs-title function_">list</span>().<span class="hljs-title function_">map</span>(<span class="hljs-function">(<span class="hljs-params">m</span>) =&gt;</span> m.<span class="hljs-property">seq</span>).<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;,&#x27;</span>)); <span class="hljs-comment">// 1,2,3,4</span>
</code></pre></div>
<p>第一行是三条消息的当前状态：对方的“你好”是推送来的，已发送；自己的“在吗”拿到了确认，序号是 2；“订单号 123”超时，标成失败。</p>
<p>第二行模拟重连后服务端补发了一条已经有的消息，序号 1 已经见过，所以被丢掉，不会显示两条。</p>
<p>第三行是重发以后的结果。重发用的还是 <code>a2</code> 这个 ID，所以它覆盖了原来那条失败的消息，而不是新增一条。确认带回的序号是 4，期间又收到对方序号为 3 的消息，排序以后显示顺序是 1、2、3、4。注意“订单号 123”是在“请稍等”之前点的发送，但服务端给它的序号更大，界面以服务端为准。</p>
<p>服务端也要按客户端消息 ID 去重。超时不一定是服务端没收到，可能是收到了、确认在回来的路上丢了。客户端用同一个 ID 重发，服务端发现这个 ID 已经存过，就直接返回原来的序号，不再存一条。客户端消息 ID 可以用 <code>crypto.randomUUID()</code> 生成，MDN 说明它用密码学安全的随机数生成器生成 v4 UUID。</p>
<h2>断线以后怎样补消息</h2>
<p>WebSocket 断开时，<code>close</code> 事件会触发，但连接有时会“假死”：手机切了网络，两端都没收到关闭，连接却已经不通了。所以除了监听 <code>close</code>，还要有心跳。</p>
<p>RFC 6455 定义了协议层的 Ping 和 Pong 帧，Ping 可以用作保活，也可以检查对端是否还有响应。可是浏览器的 <code>WebSocket</code> 接口只有 <code>send()</code> 和 <code>close()</code> 两个方法，没有发送 Ping 帧的 API，所以前端一般每隔一段时间发一条应用层的心跳消息，一段时间收不到回应，就主动关闭连接重连。</p>
<p>重连要用退避：第一次等 1 秒，失败了等 2 秒、4 秒，设一个上限，再加一点随机，避免服务器重启后所有客户端同时涌上来。连上以后带上本地最后的序号，请求服务端补发之后的消息，补发的和实时推送的可能重叠，按序号去重即可。具体的重连代码和心跳做法，见<a href="/questions/http-websocket/">《WebSocket 适合什么场景，连接断开后怎样恢复？》</a>。</p>
<p>离线期间用户发的消息怎么办？可以先存在本地，标成发送中或者失败，连上以后按顺序用原来的客户端消息 ID 重发。发送前还可以看看 <code>bufferedAmount</code>。MDN 说明它是已经调用 <code>send()</code> 排进队列、还没发到网络上的字节数，连接关闭后它也不会清零，继续调用 <code>send()</code> 它会一直增长。所以这个值很大时，说明网络发不出去，应该暂停发送，而不是继续往里塞。</p>
<h2>消息多了怎样保证流畅</h2>
<p>一个群聊可能有几万条消息，全部渲染成 DOM 会很卡，所以消息列表一般用虚拟列表，只渲染可见区域附近的消息，原理见<a href="/questions/perf-virtual-list/">《定高虚拟列表怎样手写？怎样根据 scrollTop 算出要渲染哪几行？》</a>。</p>
<p>聊天列表比普通列表多两个麻烦。一是高度不固定，文字、图片、卡片各有各的高度，要测量后缓存。二是方向反过来：新消息在底部，往上滚动加载历史消息。历史消息插入到顶部时，如果不处理，内容整体被往下推，用户正在看的那条消息就跳走了。常见做法是插入前记下 <code>scrollHeight</code> 和 <code>scrollTop</code>，插入后把 <code>scrollTop</code> 加上高度的增量，让用户看的位置保持不动。</p>
<p>新消息到达时也要区分情况：用户停在底部，就自动滚到最新；用户正往上翻看历史，就不要强行拉到底，改为显示“有新消息”的提示。动态高度和滚动锚点的处理，见<a href="/questions/performance-virtual-list/">《动态高度的虚拟列表怎样处理测量、滚动锚点和焦点？》</a>。</p>
<h2>常见追问</h2>
<p><strong>为什么不直接用客户端时间戳排序？</strong></p>
<blockquote>
<p>每台设备的时钟都可能不准，差几秒甚至几分钟都有可能，按它排，两个人看到的顺序可能不一样。服务端序号由同一个地方分配，所有客户端看到的顺序一致，还能用来发现漏掉的消息。客户端时间可以用来显示，但不用来排序。</p>
</blockquote>
<p><strong>消息已读状态怎样同步？</strong></p>
<blockquote>
<p>不用每条消息单独上报。客户端记录用户在这个会话里看到的最大序号，上报给服务端，序号不大于它的消息都算已读。这样多台设备之间同步时，也只需要比较一个数字。</p>
</blockquote>
<p><strong>多个标签页同时打开聊天，要建多个 WebSocket 吗？</strong></p>
<blockquote>
<p>可以每个标签页各建一个，实现最简单，但连接数会翻倍，也可能重复提醒。要节省连接，可以只让一个标签页持有连接，再通过 <code>BroadcastChannel</code> 或者 <code>SharedWorker</code> 把消息分发给其他标签页，见<a href="/questions/browser-broadcast-channel/">《BroadcastChannel 的消息怎样发送和接收，有哪些限制？》</a>。</p>
</blockquote>`};export{e as default};