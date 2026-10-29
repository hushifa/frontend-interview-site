var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>普通 WebSocket 用 <code>onmessage</code> 接收，服务端推多快，回调就触发多快。如果每条消息处理得很慢，消息就会在内存里越堆越多。WebSocketStream 换了一种方式：<code>new WebSocketStream(url)</code> 以后等 <code>opened</code>，拿到 <code>readable</code> 和 <code>writable</code> 两个流，自己按需 <code>read()</code>。</p>
<p>读得慢时，浏览器会停止从网络接收，让服务端那边也慢下来，这叫背压。每次读到的都是一条完整的消息，消息边界由 WebSocket 协议保证，不用自己拼。文本消息读出来是字符串，二进制消息是 <code>Uint8Array</code>；写入字符串就发文本帧，写入 <code>ArrayBuffer</code> 或类型化数组就发二进制帧。</p>
<p>背压也有边界：它不限制单条消息的大小，<code>write()</code> 兑现也不代表对端已经收到。</p>
<p>最大的限制是兼容性。MDN 标为实验性、非标准，目前只有 Chromium 支持，用之前要检测 <code>&#x27;WebSocketStream&#x27; in globalThis</code>，并保留普通 WebSocket 的回退。</p>
</blockquote>
<h2>先看一个完整的连接</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">connect</span>(<span class="hljs-params">url, onMessage</span>) {
  <span class="hljs-keyword">const</span> wss = <span class="hljs-keyword">new</span> <span class="hljs-title class_">WebSocketStream</span>(url);
  wss.<span class="hljs-property">closed</span>
    .<span class="hljs-title function_">then</span>(<span class="hljs-function">(<span class="hljs-params">{ closeCode, reason }</span>) =&gt;</span> <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;连接关闭&#x27;</span>, closeCode, reason))
    .<span class="hljs-title function_">catch</span>(<span class="hljs-function">(<span class="hljs-params">error</span>) =&gt;</span> <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">warn</span>(<span class="hljs-string">&#x27;连接异常断开&#x27;</span>, error));

  <span class="hljs-keyword">let</span> readable, writable;
  <span class="hljs-keyword">try</span> {
    ({ readable, writable } = <span class="hljs-keyword">await</span> wss.<span class="hljs-property">opened</span>);
  } <span class="hljs-keyword">catch</span> (error) {
    <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">&#x27;连接建立失败&#x27;</span>, { <span class="hljs-attr">cause</span>: error });
  }
  <span class="hljs-keyword">const</span> writer = writable.<span class="hljs-title function_">getWriter</span>();
  <span class="hljs-keyword">const</span> reader = readable.<span class="hljs-title function_">getReader</span>();

  (<span class="hljs-title function_">async</span> () =&gt; {
    <span class="hljs-keyword">while</span> (<span class="hljs-literal">true</span>) {
      <span class="hljs-keyword">const</span> { value, done } = <span class="hljs-keyword">await</span> reader.<span class="hljs-title function_">read</span>();
      <span class="hljs-keyword">if</span> (done) <span class="hljs-keyword">break</span>;
      <span class="hljs-keyword">await</span> <span class="hljs-title function_">onMessage</span>(<span class="hljs-keyword">typeof</span> value === <span class="hljs-string">&#x27;string&#x27;</span> ? <span class="hljs-title class_">JSON</span>.<span class="hljs-title function_">parse</span>(value) : value);
    }
  })().<span class="hljs-title function_">catch</span>(<span class="hljs-function">(<span class="hljs-params">error</span>) =&gt;</span> <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">warn</span>(<span class="hljs-string">&#x27;读取中断&#x27;</span>, error));

  <span class="hljs-keyword">return</span> {
    <span class="hljs-attr">send</span>: <span class="hljs-function">(<span class="hljs-params">data</span>) =&gt;</span> writer.<span class="hljs-title function_">write</span>(<span class="hljs-title class_">JSON</span>.<span class="hljs-title function_">stringify</span>(data)),
    <span class="hljs-attr">close</span>: <span class="hljs-function">() =&gt;</span> wss.<span class="hljs-title function_">close</span>({ <span class="hljs-attr">closeCode</span>: <span class="hljs-number">1000</span>, <span class="hljs-attr">reason</span>: <span class="hljs-string">&#x27;done&#x27;</span> }),
  };
}
</code></pre></div>
<p><code>opened</code> 兑现以后拿到两个流。读的那一段是个循环：读一条，<code>await onMessage</code> 处理完，再读下一条。</p>
<p>背压就藏在这个 <code>await</code> 里。<code>onMessage</code> 是异步的，处理完一条才去读下一条。处理变慢，读取就跟着变慢，浏览器就会自动减少从网络接收。</p>
<p><code>closed</code> 管关闭。正常关闭时它以 <code>{ closeCode, reason }</code> 兑现，异常断开时 reject。创建时也可以传 <code>{ signal }</code>，在连接建立之前取消。</p>
<p>为什么 <code>opened</code> 和 <code>closed</code> 都要处理拒绝？因为连接随时可能异常断开，不处理就会冒出未处理的 Promise 拒绝。</p>
<h2>背压管不到哪些事</h2>
<p>背压只控制接收的速度，不限制单条消息有多大。服务端仍要限制消息体积，业务层也仍要做限流。</p>
<p><code>writer.write()</code> 兑现，只表示数据交给浏览器去发了，不代表对端已经收到，更不代表已经处理。需要确认的话，让应用层回一个 ACK。</p>
<p>关闭方面，<code>close()</code> 没有返回表示完成的 Promise，关闭结果要看 <code>closed</code>。另外 <code>reader.releaseLock()</code> 和 <code>writer.releaseLock()</code> 只是释放流的锁，不会关闭连接；要关连接，得调 <code>wss.close()</code>。</p>
<h2>和普通 WebSocket 对比</h2>
<table><thead><tr><th></th><th>WebSocket</th><th>WebSocketStream</th></tr></thead><tbody><tr><td>接收</td><td><code>onmessage</code> 事件，来多少推多少</td><td>按需 <code>read()</code>，自带背压</td></tr><tr><td>发送背压</td><td>自己检查 <code>bufferedAmount</code></td><td><code>writer.write()</code> 的 Promise 等待</td></tr><tr><td>关闭</td><td><code>onclose</code> 事件</td><td><code>closed</code> Promise</td></tr><tr><td>兼容性</td><td>所有浏览器</td><td>仅 Chromium，非标准</td></tr></tbody></table>
<h2>不支持的浏览器怎么办</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> supportsStream = <span class="hljs-string">&#x27;WebSocketStream&#x27;</span> <span class="hljs-keyword">in</span> globalThis;
<span class="hljs-keyword">const</span> client = supportsStream ? <span class="hljs-keyword">await</span> <span class="hljs-title function_">connect</span>(url, handle) : <span class="hljs-title function_">connectLegacy</span>(url, handle);
</code></pre></div>
<p><code>connectLegacy</code> 用普通 <code>WebSocket</code> 实现同样的接口。服务端协议不用改，两种客户端都能连上。基础的 WebSocket 握手和心跳见<a href="/questions/http-websocket/">《WebSocket 适合什么场景，连接断开后怎样恢复？》</a>。</p>
<h2>常见追问</h2>
<p><strong><code>writer.write()</code> 的 Promise 兑现了，是不是说明服务端收到了？</strong></p>
<blockquote>
<p>不是。它只表示数据已经交给浏览器去发送。要确认对端收到或处理了，得在应用层让对方回 ACK。</p>
</blockquote>
<p><strong>调用 <code>reader.releaseLock()</code> 会关闭连接吗？</strong></p>
<blockquote>
<p>不会。它只是释放流的锁，让别的代码能读。关闭连接要调用 <code>wss.close()</code>，关闭结果看 <code>closed</code>。</p>
</blockquote>`};export{e as default};