var e={answerHtml:`<h2>简答</h2>
<ul>
<li>WebSocketStream 用 Streams 的读写流表示连接，接收端按读取节奏表达处理能力。</li>
<li>写入端等待 writer.write() 的 Promise，就不会无限制地堆积数据。</li>
<li>opened 表示握手成功，closed 表示连接结束，两者都要处理拒绝。</li>
<li>有背压仍需限制消息体积，并在业务层限流。</li>
</ul>
<p>假设行情服务每秒推送一千条消息，而页面每秒只能完成两百条消息的解析和绘图。只要这种速度差持续存在，剩下的消息就会积压，内存越来越多，用户看到的内容也越来越滞后。</p>
<p>背压解决的是“下游处理不过来时，让上游知道该慢一点”。它不是把处理代码变快，而是让生产和消费的速度能够协调。</p>
<p>传统 WebSocket 使用 <code>message</code> 事件交付数据，没有标准的接收背压接口。即使这样写：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js">socket.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;message&#x27;</span>, <span class="hljs-title function_">async</span> (event) =&gt; {
  <span class="hljs-keyword">await</span> <span class="hljs-title function_">saveMessage</span>(event.<span class="hljs-property">data</span>);
});
</code></pre></div>
<p>浏览器也不会等待 <code>saveMessage</code> 完成再派发下一条消息。这段代码只是示意事件监听方式，<code>socket</code> 和 <code>saveMessage</code> 需要由业务提供；其中的 <code>await</code> 只暂停当前回调，不会暂停事件源，还可能产生大量并行的保存任务。</p>
<p>WebSocketStream 尝试把 WebSocket 连接接入 Web Streams，让应用通过可读流、可写流表达消费能力。<strong>它目前仍是非标准、实验性的 API，支持范围有限，不适合作为面向所有浏览器的唯一通信实现。</strong></p>
<h2>接收端通过读取节奏表达处理能力</h2>
<p>连接成功后，<code>socket.opened</code> 兑现的对象包含 <code>readable</code> 和 <code>writable</code>。应用从 <code>readable</code> 获取 reader，每处理完一条消息再调用一次 <code>read()</code>，底层流就能结合自身队列和传输实现传递背压。</p>
<p>与给 <code>message</code> 加 <code>async</code> 的关键区别是：下一次读取由应用发起。这样可以避免应用层无节制地创建处理任务，但仍可能存在流队列、网络缓冲和已经到达的数据，不能理解成“永远只有一条消息占用内存”。</p>
<p>下面的订阅示例约定服务端理解 <code>{ type: &#x27;subscribe&#x27;, topic: &#x27;prices&#x27; }</code>。<code>handleMessage</code> 接收每条原始消息，可同步处理，也可返回 Promise；服务端正常结束流时函数返回关闭信息。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">consumeFeed</span>(<span class="hljs-params">url, handleMessage</span>) {
  <span class="hljs-keyword">if</span> (!(<span class="hljs-string">&#x27;WebSocketStream&#x27;</span> <span class="hljs-keyword">in</span> globalThis)) {
    <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">&#x27;当前浏览器不支持 WebSocketStream&#x27;</span>);
  }

  <span class="hljs-keyword">const</span> socket = <span class="hljs-keyword">new</span> <span class="hljs-title class_">WebSocketStream</span>(url, {
    <span class="hljs-attr">signal</span>: <span class="hljs-title class_">AbortSignal</span>.<span class="hljs-title function_">timeout</span>(<span class="hljs-number">5000</span>),
  });

  <span class="hljs-comment">// 立即观察关闭失败，避免握手失败时漏接另一个 Promise 的拒绝。</span>
  <span class="hljs-keyword">const</span> closedOutcome = socket.<span class="hljs-property">closed</span>.<span class="hljs-title function_">then</span>(
    <span class="hljs-function">(<span class="hljs-params">value</span>) =&gt;</span> ({ <span class="hljs-attr">ok</span>: <span class="hljs-literal">true</span>, value }),
    <span class="hljs-function">(<span class="hljs-params">error</span>) =&gt;</span> ({ <span class="hljs-attr">ok</span>: <span class="hljs-literal">false</span>, error }),
  );

  <span class="hljs-keyword">let</span> reader;
  <span class="hljs-keyword">let</span> writer;
  <span class="hljs-keyword">try</span> {
    <span class="hljs-keyword">const</span> { readable, writable } = <span class="hljs-keyword">await</span> socket.<span class="hljs-property">opened</span>;
    reader = readable.<span class="hljs-title function_">getReader</span>();
    writer = writable.<span class="hljs-title function_">getWriter</span>();

    <span class="hljs-keyword">await</span> writer.<span class="hljs-title function_">write</span>(<span class="hljs-title class_">JSON</span>.<span class="hljs-title function_">stringify</span>({ <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;subscribe&#x27;</span>, <span class="hljs-attr">topic</span>: <span class="hljs-string">&#x27;prices&#x27;</span> }));

    <span class="hljs-keyword">while</span> (<span class="hljs-literal">true</span>) {
      <span class="hljs-keyword">const</span> { value, done } = <span class="hljs-keyword">await</span> reader.<span class="hljs-title function_">read</span>();
      <span class="hljs-keyword">if</span> (done) <span class="hljs-keyword">break</span>;
      <span class="hljs-keyword">await</span> <span class="hljs-title function_">handleMessage</span>(value);
    }
  } <span class="hljs-keyword">finally</span> {
    reader?.<span class="hljs-title function_">releaseLock</span>();
    writer?.<span class="hljs-title function_">releaseLock</span>();
    socket.<span class="hljs-title function_">close</span>();
  }

  <span class="hljs-keyword">const</span> outcome = <span class="hljs-keyword">await</span> closedOutcome;
  <span class="hljs-keyword">if</span> (!outcome.<span class="hljs-property">ok</span>) <span class="hljs-keyword">throw</span> outcome.<span class="hljs-property">error</span>;
  <span class="hljs-keyword">return</span> outcome.<span class="hljs-property">value</span>;
}
</code></pre></div>
<p>调用方仍要用 <code>try/catch</code> 或 <code>.catch()</code> 处理 <code>consumeFeed()</code> 的失败。例如处理器解析了不合法的 JSON 并抛错时，函数会尝试关闭连接，然后把错误交给调用方；不会继续消费后续消息。</p>
<p>这段代码是顺序消费示例，不是行情业务的完整客户端。它没有实现消息鉴权、重连、页面卸载后的主动取消或历史恢复。用于组件时，应把连接所有权放在组件或独立连接服务中，向清理逻辑暴露 <code>close()</code>，避免组件销毁后仍在等待下一次读取。</p>
<h2>写入端也要配合，不能无视 Promise</h2>
<p><code>writer.write(message)</code> 返回 Promise。循环中等待本次写入完成，再生产下一条消息，可以避免生产者不受限制地向可写流排队。需要根据队列压力调度生产时，还可以使用 <code>writer.ready</code> 和 <code>desiredSize</code> 等 Streams 能力。</p>
<p>如果应用把一百万次 <code>writer.write()</code> 全部调用后再一起 <code>Promise.all()</code>，数据仍然会提前创建并排队。流提供了表达压力的机制，但生产代码必须尊重它；“接口返回 Promise”本身不等于自动控制了所有内存。</p>
<p>同样，写入 Promise 兑现只说明这次流写入在传输层相应阶段完成，不代表接收端的业务已经保存数据。订单确认、消息送达仍需要应用协议的确认消息。</p>
<p>传统 WebSocket 的 <code>bufferedAmount</code> 可以帮助应用观察待发送字节量，选择暂缓发送或合并数据，但它不是可等待的读取背压接口，也不能告诉页面接收队列是否安全。</p>
<h2><code>signal</code>、<code>close()</code> 和两个 Promise 各管什么</h2>
<p><code>opened</code> 表示握手成功后可取得读写流，<code>closed</code> 表示连接最终如何结束。握手失败时，两者都可能拒绝；只捕获 <code>opened</code> 而完全不观察 <code>closed</code>，可能留下未处理的 Promise 拒绝。示例因此在创建连接后立即为 <code>closed</code> 安装处理器。</p>
<p>构造函数的 <code>signal</code> 用来在握手完成前取消建立连接，例如实现五秒连接超时。<strong>它在连接建立后不起取消作用</strong>，不能靠同一个 AbortSignal 关闭已经运行的消息订阅。</p>
<p>已建立的连接需要用 <code>socket.close()</code>，也可以按该 API 的定义通过关闭可写端结束连接。需要指定正常关闭原因时，接口形式是：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js">socket.<span class="hljs-title function_">close</span>({ <span class="hljs-attr">closeCode</span>: <span class="hljs-number">1000</span>, <span class="hljs-attr">reason</span>: <span class="hljs-string">&#x27;停止订阅&#x27;</span> });
</code></pre></div>
<p>这与传统 <code>WebSocket.close(1000, &#x27;停止订阅&#x27;)</code> 的参数形式不同。<code>close()</code> 发起关闭，不返回一个代表关闭完成的 Promise；要了解最终结果，应观察 <code>closed</code>。异常断连时 <code>closed</code> 会拒绝，不能只写成功分支。</p>
<p><code>releaseLock()</code> 仅释放 reader 或 writer 对流的独占锁，不会因此自动取消业务订阅或关闭网络连接，这也是示例在释放锁后还调用 <code>socket.close()</code> 的原因。</p>
<h2>为什么有背压仍然需要业务限流</h2>
<p>一个巨大消息在被交给应用前就可能已经占用大量内存，因此仍要限制消息体积。服务端也不能把无法发送的数据永远保存在自己的队列里；慢客户端可能需要降频、合并、断开，或者退回快照更新。</p>
<p>对于行情这样的“只关心最新状态”，跳过过时中间值通常比忠实排队展示更合理。对于交易流水这样的“每条都必须处理”，应有持久化日志和游标恢复，而不是指望一个长连接永久保存所有数据。</p>
<p>即使某个浏览器支持 WebSocketStream，也应验证实际版本行为和服务器互通情况。需要兼容更多浏览器时，可选择传统 WebSocket 并自行设计有界队列、确认窗口或服务端限速。用一个 ReadableStream 包装传统 <code>message</code> 事件，只是改变了应用看到的接口；如果消息源仍不理会消费速度，就没有凭空得到同等的底层背压能力。</p>`};export{e as default};