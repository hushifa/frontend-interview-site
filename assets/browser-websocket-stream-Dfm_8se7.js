var e={answerHtml:`<h2>简答</h2>
<ul>
<li><code>new WebSocketStream(url)</code> 后等待 <code>opened</code>，得到 <code>{ readable, writable, protocol, extensions }</code>。</li>
<li>文本消息读出来是字符串，二进制消息是 <code>Uint8Array</code>；写入字符串发送文本帧，写入 <code>ArrayBuffer</code> 或类型化数组发送二进制帧。</li>
<li>每次读取得到一条完整消息，消息边界由 WebSocket 协议保证，不需要自己拼接。</li>
<li>读取慢时浏览器停止从网络接收，形成背压；传统 <code>WebSocket</code> 的 <code>onmessage</code> 无法做到这一点。</li>
<li>MDN 标为实验性、非标准，目前只有 Chromium 支持，使用前检测 <code>&#x27;WebSocketStream&#x27; in globalThis</code>。</li>
</ul>
<h2>示例</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">connect</span>(<span class="hljs-params">url, onMessage</span>) {
  <span class="hljs-keyword">const</span> wss = <span class="hljs-keyword">new</span> <span class="hljs-title class_">WebSocketStream</span>(url);
  <span class="hljs-keyword">const</span> { readable, writable } = <span class="hljs-keyword">await</span> wss.<span class="hljs-property">opened</span>;
  <span class="hljs-keyword">const</span> writer = writable.<span class="hljs-title function_">getWriter</span>();
  <span class="hljs-keyword">const</span> reader = readable.<span class="hljs-title function_">getReader</span>();

  (<span class="hljs-title function_">async</span> () =&gt; {
    <span class="hljs-keyword">while</span> (<span class="hljs-literal">true</span>) {
      <span class="hljs-keyword">const</span> { value, done } = <span class="hljs-keyword">await</span> reader.<span class="hljs-title function_">read</span>();
      <span class="hljs-keyword">if</span> (done) <span class="hljs-keyword">break</span>;
      <span class="hljs-keyword">await</span> <span class="hljs-title function_">onMessage</span>(<span class="hljs-keyword">typeof</span> value === <span class="hljs-string">&#x27;string&#x27;</span> ? <span class="hljs-title class_">JSON</span>.<span class="hljs-title function_">parse</span>(value) : value);
    }
  })().<span class="hljs-title function_">catch</span>(<span class="hljs-function">() =&gt;</span> {});

  wss.<span class="hljs-property">closed</span>.<span class="hljs-title function_">then</span>(<span class="hljs-function">(<span class="hljs-params">{ closeCode, reason }</span>) =&gt;</span> <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;连接关闭&#x27;</span>, closeCode, reason));

  <span class="hljs-keyword">return</span> {
    <span class="hljs-attr">send</span>: <span class="hljs-function">(<span class="hljs-params">data</span>) =&gt;</span> writer.<span class="hljs-title function_">write</span>(<span class="hljs-title class_">JSON</span>.<span class="hljs-title function_">stringify</span>(data)),
    <span class="hljs-attr">close</span>: <span class="hljs-function">() =&gt;</span> wss.<span class="hljs-title function_">close</span>({ <span class="hljs-attr">closeCode</span>: <span class="hljs-number">1000</span>, <span class="hljs-attr">reason</span>: <span class="hljs-string">&#x27;done&#x27;</span> }),
  };
}
</code></pre></div>
<ul>
<li><code>onMessage</code> 是异步的，处理完一条才读下一条，处理变慢时浏览器自动减少接收。</li>
<li><code>closed</code> 在连接关闭时以 <code>{ closeCode, reason }</code> 完成，异常断开时 reject。</li>
<li>创建时可以传 <code>{ signal }</code>，在连接建立前取消。</li>
</ul>
<h2>和 WebSocket 对比</h2>
<table><thead><tr><th></th><th>WebSocket</th><th>WebSocketStream</th></tr></thead><tbody><tr><td>接收</td><td><code>onmessage</code> 事件，来多少推多少</td><td>按需 <code>read()</code>，自带背压</td></tr><tr><td>发送背压</td><td>自己检查 <code>bufferedAmount</code></td><td><code>writer.write()</code> 的 Promise 等待</td></tr><tr><td>关闭</td><td><code>onclose</code> 事件</td><td><code>closed</code> Promise</td></tr><tr><td>兼容性</td><td>所有浏览器</td><td>仅 Chromium，非标准</td></tr></tbody></table>
<h2>回退写法</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> supportsStream = <span class="hljs-string">&#x27;WebSocketStream&#x27;</span> <span class="hljs-keyword">in</span> globalThis;
<span class="hljs-keyword">const</span> client = supportsStream ? <span class="hljs-keyword">await</span> <span class="hljs-title function_">connect</span>(url, handle) : <span class="hljs-title function_">connectLegacy</span>(url, handle);
</code></pre></div>
<p><code>connectLegacy</code> 用 <code>WebSocket</code> 实现相同的接口。服务端协议不变，两种客户端都能连接。基础的 WebSocket 握手和心跳见《WebSocket 适合什么场景，连接断开后怎样恢复？》。</p>`};export{e as default};