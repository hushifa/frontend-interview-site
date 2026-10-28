var e={answerHtml:`<h2>简答</h2>
<ul>
<li>WebSocket 通过一次 HTTP <code>Upgrade</code> 握手建立全双工连接，之后双方都能随时发文本或二进制消息。</li>
<li>断线重连要自己实现，用指数退避加随机抖动，避免服务器重启后所有客户端同时涌入。</li>
<li>连接恢复不等于数据恢复：客户端记录最后收到的消息序号，重连后请服务器补发；发出的消息要等服务器确认，超时重发，并用消息 ID 去重。</li>
<li>只能推送、不需要双向时，SSE 更简单，见《SSE 与 WebSocket 有什么区别？》。</li>
</ul>
<h2>握手</h2>
<div class="not-prose code-block"><div class="code-language">http</div><pre><code class="hljs language-http">GET /chat HTTP/1.1
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==
Origin: https://app.example
</code></pre></div>
<p>服务器回 <code>101 Switching Protocols</code>。WebSocket 不受 CORS 约束，服务器必须自己校验 <code>Origin</code>，否则任何网站都能借用户的 Cookie 建立连接（跨站 WebSocket 劫持）。</p>
<h2>带重连和补发的客户端</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">connect</span>(<span class="hljs-params">url, onMessage</span>) {
  <span class="hljs-keyword">let</span> socket;
  <span class="hljs-keyword">let</span> attempt = <span class="hljs-number">0</span>;
  <span class="hljs-keyword">let</span> lastSeq = <span class="hljs-number">0</span>;
  <span class="hljs-keyword">let</span> stopped = <span class="hljs-literal">false</span>;

  <span class="hljs-keyword">function</span> <span class="hljs-title function_">open</span>(<span class="hljs-params"></span>) {
    socket = <span class="hljs-keyword">new</span> <span class="hljs-title class_">WebSocket</span>(<span class="hljs-string">\`<span class="hljs-subst">\${url}</span>?since=<span class="hljs-subst">\${lastSeq}</span>\`</span>);

    socket.<span class="hljs-property">onopen</span> = <span class="hljs-function">() =&gt;</span> {
      attempt = <span class="hljs-number">0</span>;
    };

    socket.<span class="hljs-property">onmessage</span> = <span class="hljs-function">(<span class="hljs-params">event</span>) =&gt;</span> {
      <span class="hljs-keyword">const</span> message = <span class="hljs-title class_">JSON</span>.<span class="hljs-title function_">parse</span>(event.<span class="hljs-property">data</span>);
      <span class="hljs-keyword">if</span> (message.<span class="hljs-property">seq</span> &lt;= lastSeq) <span class="hljs-keyword">return</span>; <span class="hljs-comment">// 重复消息</span>
      lastSeq = message.<span class="hljs-property">seq</span>;
      <span class="hljs-title function_">onMessage</span>(message);
    };

    socket.<span class="hljs-property">onclose</span> = <span class="hljs-function">(<span class="hljs-params">event</span>) =&gt;</span> {
      <span class="hljs-keyword">if</span> (stopped || event.<span class="hljs-property">code</span> === <span class="hljs-number">1000</span>) <span class="hljs-keyword">return</span>;
      <span class="hljs-keyword">const</span> delay = <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">min</span>(<span class="hljs-number">30_000</span>, <span class="hljs-number">1000</span> * <span class="hljs-number">2</span> ** attempt) * (<span class="hljs-number">0.5</span> + <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">random</span>() / <span class="hljs-number">2</span>);
      attempt += <span class="hljs-number">1</span>;
      <span class="hljs-built_in">setTimeout</span>(open, delay);
    };
  }

  <span class="hljs-title function_">open</span>();
  <span class="hljs-keyword">return</span> {
    <span class="hljs-attr">send</span>: <span class="hljs-function">(<span class="hljs-params">data</span>) =&gt;</span> socket.<span class="hljs-property">readyState</span> === <span class="hljs-title class_">WebSocket</span>.<span class="hljs-property">OPEN</span> &amp;&amp; socket.<span class="hljs-title function_">send</span>(<span class="hljs-title class_">JSON</span>.<span class="hljs-title function_">stringify</span>(data)),
    <span class="hljs-attr">close</span>: <span class="hljs-function">() =&gt;</span> {
      stopped = <span class="hljs-literal">true</span>;
      socket.<span class="hljs-title function_">close</span>(<span class="hljs-number">1000</span>);
    },
  };
}
</code></pre></div>
<h2>心跳</h2>
<p>TCP 连接可能已经断开但两端都不知道，NAT 和代理也会清理空闲连接。浏览器 API 不能发送协议层的 ping 帧，常见做法是每隔 20–30 秒发一条应用层心跳消息，一段时间内没收到回应就主动关闭并重连。页面从后台恢复（<code>visibilitychange</code>）或网络恢复（<code>online</code> 事件）时，可以立即检查连接。</p>
<h2>背压</h2>
<p><code>send()</code> 不会阻塞，数据先进入浏览器缓冲区。快速发送大量数据时，检查 <code>socket.bufferedAmount</code>，超过阈值就暂停发送。</p>
<h2>常见追问</h2>
<ul>
<li>消息顺序有保证吗？单个连接内有序。重连后的补发和新消息可能交错，按序号处理。</li>
<li>怎样鉴权？握手时带 Cookie，或连接后第一条消息发送短期令牌。不要把长期令牌放在 URL 查询参数里，它会进入服务器日志。</li>
</ul>`};export{e as default};