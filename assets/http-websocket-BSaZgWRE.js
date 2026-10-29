var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>WebSocket 先用一次 HTTP 请求做 <code>Upgrade</code> 握手，之后这条连接就变成双向的，浏览器和服务器都能随时发文本或二进制消息。所以它适合聊天、协同编辑、游戏这种低延迟、两边都要频繁说话的场景。</p>
<p>它不管断线重连，要自己写。一般用指数退避加随机抖动，也就是每次失败等待时间翻倍，再随机打点折扣，免得服务器重启后所有客户端同一秒涌进来。</p>
<p>还要分清楚，连接恢复了不等于数据恢复了。客户端要记下最后收到的消息序号，重连后让服务器补发；自己发出的消息要等服务器确认，超时就重发，用消息 ID 去重。</p>
<p>如果只需要服务器推、不需要双向，SSE 更简单，见<a href="/questions/http-sse/">《SSE 与 WebSocket 有什么区别？》</a>。</p>
</blockquote>
<h2>握手长什么样</h2>
<p>浏览器发的是一个普通的 GET，只是多了几个头：</p>
<div class="not-prose code-block"><div class="code-language">http</div><pre><code class="hljs language-http">GET /chat HTTP/1.1
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==
Origin: https://app.example
</code></pre></div>
<p>服务器同意就回 <code>101 Switching Protocols</code>，之后这条连接就不再是 HTTP 了。</p>
<p>这里有个安全问题。WebSocket 不受 CORS 约束，任何网站的脚本都能连你的服务器，而且浏览器会带上用户的 Cookie。所以服务器必须自己检查 <code>Origin</code>，不然恶意网站就能借用户身份建立连接，这叫跨站 WebSocket 劫持。</p>
<h2>带重连和补发的客户端</h2>
<p>下面这个客户端做了三件事：断线后退避重连，重连时带上最后的序号，收到重复消息就丢掉。</p>
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
<p>重连地址里带着 <code>since=\${lastSeq}</code>，服务器据此补发断线期间的消息。补发的和新来的可能重叠，所以 <code>onmessage</code> 里序号不大于 <code>lastSeq</code> 的直接跳过。</p>
<p>等待时间是 1 秒、2 秒、4 秒这样翻倍，最多 30 秒，再乘上 0.5 到 1 之间的随机数。连上以后 <code>attempt</code> 清零。关闭码 1000 表示正常关闭，这时不重连，用户主动调用 <code>close</code> 也是。</p>
<h2>为什么还要心跳</h2>
<p>TCP 连接可能已经断了，两端却都不知道，比如手机进了电梯。NAT 和代理也会把长时间没动静的连接清掉。</p>
<p>浏览器的 API 发不了协议层的 ping 帧，所以常见做法是每隔 20 到 30 秒发一条应用层的心跳消息，一段时间收不到回应，就主动关掉重连。另外，页面从后台切回来（<code>visibilitychange</code>）或者网络恢复（<code>online</code> 事件）时，可以马上检查一下连接。</p>
<h2>发得太快怎么办</h2>
<p><code>send()</code> 不会阻塞，数据先放进浏览器的缓冲区再慢慢发。如果一直猛发大量数据，缓冲区会越积越多。这时看 <code>socket.bufferedAmount</code>，超过阈值就先停一停，这叫背压。</p>
<h2>常见追问</h2>
<p><strong>消息顺序有保证吗？</strong></p>
<blockquote>
<p>单个连接内是有序的。但重连后补发的消息和新消息可能交错，所以要按序号处理。</p>
</blockquote>
<p><strong>怎样鉴权？</strong></p>
<blockquote>
<p>握手时带 Cookie，或者连上以后第一条消息发一个短期令牌。不要把长期令牌放在 URL 查询参数里，它会被写进服务器日志。</p>
</blockquote>`};export{e as default};