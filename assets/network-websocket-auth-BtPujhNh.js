var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>用 <code>fetch</code> 调接口时，令牌放在 <code>Authorization</code> 请求头里。可是浏览器的 <code>new WebSocket(url, protocols)</code> 只有这两个参数，没有地方设置请求头，所以 WebSocket 鉴权要换办法。</p>
<p>协议本身不规定怎样鉴权。RFC 6455 说服务器可以用普通 HTTP 服务能用的任何方式，比如 Cookie、HTTP 认证或 TLS 客户端证书。浏览器发起握手时会带上这个域名的 Cookie，所以同站部署、已经用 Cookie 登录的项目，握手时直接校验 Cookie 就行。</p>
<p>用令牌的项目常见两种做法。一种是先用已登录的 HTTP 请求换一个有效期很短、只能用一次的票据，放在连接 URL 的查询参数里；另一种是先建立连接，第一条消息发令牌，服务端在规定时间内没收到有效令牌就断开。</p>
<p>要注意两点。第一，WebSocket 不受同源策略限制，靠 Cookie 鉴权时服务端必须校验 <code>Origin</code>，不在白名单就返回 403，否则恶意网站能借用户的 Cookie 建立连接。第二，长期有效的令牌不要放进 URL，URL 会被写进服务器日志、代理日志，RFC 6750 明确不建议把 Bearer 令牌放在 URL 里。</p>
</blockquote>
<h2>为什么不能设置请求头</h2>
<p>MDN 给出的构造函数签名只有两种：<code>new WebSocket(url)</code> 和 <code>new WebSocket(url, protocols)</code>。<code>protocols</code> 是子协议名，浏览器会把它们放进 <code>Sec-WebSocket-Protocol</code> 请求头，除此以外没有任何参数能影响请求头。</p>
<p>这不是协议的限制。RFC 6455 规定握手请求可以包含其他头字段，原文举的例子就是 Cookie 和 <code>Authorization</code>。限制只在浏览器提供的 API 上。</p>
<p>握手本身长什么样，以及服务器怎样回 <code>101 Switching Protocols</code>，见<a href="/questions/http-websocket/">《WebSocket 适合什么场景，连接断开后怎样恢复？》</a>。</p>
<h2>方案一：靠 Cookie，服务端校验 Origin</h2>
<p>WHATWG WebSockets 标准把握手请求交给 Fetch 发送，凭据模式是 <code>include</code>，所以浏览器会像普通请求一样，带上目标域名下符合条件的 Cookie。对同站部署、本来就用 Cookie 维持登录的应用，这是最省事的办法，前端什么都不用改。</p>
<p>可是“自动带 Cookie”也正是风险所在。WebSocket 不走 CORS，任何网站的脚本都能向你的服务器发起连接，浏览器同样会带上用户的 Cookie。RFC 6455 的 Origin 小节说，只服务特定网站的服务器应该校验 <code>Origin</code> 是否是预期的来源，不是就返回 403。这个头由浏览器填写，页面脚本改不了，所以它能防止恶意页面冒充；它防不了的是非浏览器客户端，这类客户端能随意伪造 <code>Origin</code>，所以 <code>Origin</code> 只是防跨站，不能代替身份校验。</p>
<p>Cookie 的 <code>SameSite</code>、<code>HttpOnly</code> 等属性怎样影响它的发送和读取，见<a href="/questions/sec-cookies/">《HttpOnly、Secure 和 SameSite 分别保护什么？》</a>。</p>
<h2>方案二：用短期票据放进 URL</h2>
<p>前后端分属不同域名，或者登录态是存在内存里的访问令牌时，Cookie 用不上。这时可以先用普通的 HTTP 请求换一张票据：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">connect</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">const</span> res = <span class="hljs-keyword">await</span> <span class="hljs-title function_">fetch</span>(<span class="hljs-string">&#x27;/api/ws-ticket&#x27;</span>, {
    <span class="hljs-attr">method</span>: <span class="hljs-string">&#x27;POST&#x27;</span>,
    <span class="hljs-attr">headers</span>: { <span class="hljs-title class_">Authorization</span>: <span class="hljs-string">\`Bearer <span class="hljs-subst">\${accessToken}</span>\`</span> },
  });
  <span class="hljs-keyword">const</span> { ticket } = <span class="hljs-keyword">await</span> res.<span class="hljs-title function_">json</span>();
  <span class="hljs-keyword">return</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">WebSocket</span>(<span class="hljs-string">\`wss://ws.example.com/chat?ticket=<span class="hljs-subst">\${<span class="hljs-built_in">encodeURIComponent</span>(ticket)}</span>\`</span>);
}
</code></pre></div>
<p>换票据的请求可以正常带 <code>Authorization</code> 头。服务端发出的票据只用于这一次握手，有效期很短，比如几十秒，用过一次就作废。</p>
<p>为什么不直接把访问令牌放进 URL？RFC 6750 第 5.3 节说，Bearer 令牌不应该放在 URL 里，因为浏览器、Web 服务器和其他软件不一定会妥善保护 URL，它可能留在浏览历史、服务器日志里，被别人捡到后直接拿去用。票据把这个风险降到很小：就算被记进日志，它也已经过期或者用过了。</p>
<h2>方案三：连上后第一条消息发令牌</h2>
<p>另一种做法是不在握手里鉴权，连接建立以后，前端发的第一条消息就是令牌：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> socket = <span class="hljs-keyword">new</span> <span class="hljs-title class_">WebSocket</span>(<span class="hljs-string">&#x27;wss://ws.example.com/chat&#x27;</span>);

socket.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;open&#x27;</span>, <span class="hljs-function">() =&gt;</span> {
  socket.<span class="hljs-title function_">send</span>(<span class="hljs-title class_">JSON</span>.<span class="hljs-title function_">stringify</span>({ <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;auth&#x27;</span>, <span class="hljs-attr">token</span>: accessToken }));
});
</code></pre></div>
<p>令牌走的是加密的 WebSocket 数据帧，不会出现在 URL 和日志里。代价是服务器要先接受一条还没鉴权的连接，所以服务端要设一个时限，比如几秒内收不到有效的 <code>auth</code> 消息就关闭连接，鉴权成功前也不处理其他消息、不推送数据。否则任何人都能建一堆空连接占着资源。</p>
<p>这种做法还有一个好处：访问令牌快过期时，可以在同一条连接上再发一次新令牌，而不用断开重连。令牌本身怎样刷新，见<a href="/questions/security-token-refresh/">《Access Token 过期后，前端怎样做无感刷新？》</a>。</p>
<h2>能不能把令牌塞进子协议</h2>
<p><code>Sec-WebSocket-Protocol</code> 是浏览器唯一允许脚本影响的请求头，所以有人把令牌当成子协议名传进去，比如 <code>new WebSocket(url, [&#x27;chat&#x27;, token])</code>。</p>
<p>这种写法要满足两条规范要求。一是子协议名必须是合法的头字段值，WHATWG 标准规定，值重复或者格式不合规时构造函数直接抛 <code>SyntaxError</code>，所以令牌里不能有空格、逗号这类字符。二是服务器必须在响应里选中并返回其中一个子协议，WHATWG 标准规定，客户端传了子协议而响应里没有 <code>Sec-WebSocket-Protocol</code>，连接就会失败；RFC 6455 也规定服务器不能返回客户端没请求过的子协议。服务器自然不能把令牌原样回显，所以通常要再放一个真正的子协议名，比如上面的 <code>chat</code>，让服务器选它。</p>
<p>另外，令牌还是在请求头里，网关和代理的日志会不会记录这个头，要逐个确认。所以这个办法能用，但比上面两种更绕。</p>
<h2>无论哪种方案都要做的事</h2>
<p>连接要用 <code>wss://</code>。MDN 说大多数浏览器已经只允许安全的 WebSocket 连接，从 HTTPS 页面连 <code>ws://</code> 属于混合内容，会被拦截。RFC 6455 也说连接的机密性和完整性依靠在 TLS 上运行。</p>
<p>握手鉴权只发生在连接建立那一刻。一条连接可能保持几个小时，期间用户可能退出登录、权限可能被收回，所以服务端要能在这些事件发生时主动关闭对应的连接，或者对敏感操作逐条校验权限。</p>
<h2>常见追问</h2>
<p><strong>为什么握手时看到了 Cookie，跨站的恶意页面也能连上？</strong></p>
<blockquote>
<p>因为浏览器发起 WebSocket 握手时会带上目标站的 Cookie，而 WebSocket 不受 CORS 约束，浏览器不会因为跨源就拦截。所以服务端必须自己校验 <code>Origin</code> 头，这种攻击叫跨站 WebSocket 劫持。</p>
</blockquote>
<p><strong>Node.js 里连 WebSocket 也有这个限制吗？</strong></p>
<blockquote>
<p>限制来自浏览器的 <code>WebSocket</code> 构造函数。RFC 6455 允许握手带 <code>Authorization</code> 等任意头，所以浏览器以外的客户端可以按协议发送这些头，能不能设置要看所用客户端库的文档。</p>
</blockquote>
<p><strong>用 SSE 推送时鉴权有同样的问题吗？</strong></p>
<blockquote>
<p>浏览器的 <code>EventSource</code> 构造函数只接受 URL 和一个 <code>withCredentials</code> 选项，也不能设置请求头，所以同样依赖 Cookie 或 URL 参数。SSE 的协议细节见<a href="/questions/http-sse/">《SSE 的事件格式、自动重连和 Last-Event-ID 是怎样工作的？》</a>。</p>
</blockquote>`};export{e as default};