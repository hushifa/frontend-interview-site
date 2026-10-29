var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>服务端下发一个装着随机令牌的 Cookie，前端发修改请求时，把这个 Cookie 的值读出来，再放进 <code>X-CSRF-Token</code> 请求头里。服务端比较 Cookie 里的值和请求头里的值，一致才处理。</p>
<p>为什么这样能防 CSRF？因为 Cookie 是浏览器自动带的，可请求头必须由页面脚本主动设置。恶意网站受同源策略限制，读不到你网站的 Cookie，也就不知道该往请求头里填什么。</p>
<p>可是只比较“两者相等”的朴素做法有漏洞。如果攻击者能通过子域名或中间人往浏览器里写一个 Cookie，他就可以写一个自己知道的值，再在请求里提交同样的值。所以 OWASP 推荐签名版：令牌是用服务端密钥对“会话标识加随机数”算出的 HMAC，服务端验证签名，并确认令牌属于当前会话。</p>
<p>要注意，这个 Cookie 要让前端读，所以不能设 <code>HttpOnly</code>，但会话 Cookie 仍然要 <code>HttpOnly</code>。它要和 <code>SameSite</code>、<code>Origin</code> 校验一起用。如果服务端本来就有会话存储，同步令牌模式更简单。</p>
</blockquote>
<h2>请求长什么样</h2>
<div class="not-prose code-block"><div class="code-language">http</div><pre><code class="hljs language-http">POST /api/profile HTTP/1.1
Cookie: __Host-session=s3ss10n; __Host-csrf=7f3a.c9e1
X-CSRF-Token: 7f3a.c9e1
Content-Type: application/json
</code></pre></div>
<p>同一个值出现了两次，一次在 Cookie 里，一次在请求头里，这就是“双重提交”这个名字的来历。</p>
<h2>前端怎么带上令牌</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">readCookie</span>(<span class="hljs-params">name</span>) {
  <span class="hljs-keyword">const</span> prefix = <span class="hljs-string">\`<span class="hljs-subst">\${name}</span>=\`</span>;
  <span class="hljs-keyword">const</span> item = <span class="hljs-variable language_">document</span>.<span class="hljs-property">cookie</span>.<span class="hljs-title function_">split</span>(<span class="hljs-string">&#x27;; &#x27;</span>).<span class="hljs-title function_">find</span>(<span class="hljs-function">(<span class="hljs-params">part</span>) =&gt;</span> part.<span class="hljs-title function_">startsWith</span>(prefix));
  <span class="hljs-keyword">return</span> item ? <span class="hljs-built_in">decodeURIComponent</span>(item.<span class="hljs-title function_">slice</span>(prefix.<span class="hljs-property">length</span>)) : <span class="hljs-literal">null</span>;
}

<span class="hljs-keyword">export</span> <span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">postJSON</span>(<span class="hljs-params">url, body</span>) {
  <span class="hljs-keyword">const</span> token = <span class="hljs-title function_">readCookie</span>(<span class="hljs-string">&#x27;__Host-csrf&#x27;</span>);
  <span class="hljs-keyword">if</span> (!token) <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">&#x27;缺少 CSRF 令牌，请刷新页面&#x27;</span>);

  <span class="hljs-keyword">return</span> <span class="hljs-title function_">fetch</span>(url, {
    <span class="hljs-attr">method</span>: <span class="hljs-string">&#x27;POST&#x27;</span>,
    <span class="hljs-attr">headers</span>: { <span class="hljs-string">&#x27;Content-Type&#x27;</span>: <span class="hljs-string">&#x27;application/json&#x27;</span>, <span class="hljs-string">&#x27;X-CSRF-Token&#x27;</span>: token },
    <span class="hljs-attr">body</span>: <span class="hljs-title class_">JSON</span>.<span class="hljs-title function_">stringify</span>(body),
  });
}
</code></pre></div>
<p>前端做的事很简单，读 Cookie、放进请求头。安全性全靠一点：只有你自己网站的脚本能读到这个 Cookie。</p>
<h2>服务端怎么签名和验证</h2>
<p>下面是 Node 的示意代码。令牌格式是“随机数.签名”，签名把会话标识也算了进去：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">import</span> { createHmac, randomBytes, timingSafeEqual } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;node:crypto&#x27;</span>;

<span class="hljs-keyword">const</span> <span class="hljs-variable constant_">SECRET</span> = process.<span class="hljs-property">env</span>.<span class="hljs-property">CSRF_SECRET</span>;

<span class="hljs-keyword">function</span> <span class="hljs-title function_">sign</span>(<span class="hljs-params">sessionId, nonce</span>) {
  <span class="hljs-keyword">return</span> <span class="hljs-title function_">createHmac</span>(<span class="hljs-string">&#x27;sha256&#x27;</span>, <span class="hljs-variable constant_">SECRET</span>).<span class="hljs-title function_">update</span>(<span class="hljs-string">\`<span class="hljs-subst">\${sessionId.length}</span>:<span class="hljs-subst">\${sessionId}</span>:<span class="hljs-subst">\${nonce}</span>\`</span>).<span class="hljs-title function_">digest</span>(<span class="hljs-string">&#x27;hex&#x27;</span>);
}

<span class="hljs-keyword">export</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">issueToken</span>(<span class="hljs-params">sessionId</span>) {
  <span class="hljs-keyword">const</span> nonce = <span class="hljs-title function_">randomBytes</span>(<span class="hljs-number">16</span>).<span class="hljs-title function_">toString</span>(<span class="hljs-string">&#x27;hex&#x27;</span>);
  <span class="hljs-keyword">return</span> <span class="hljs-string">\`<span class="hljs-subst">\${nonce}</span>.<span class="hljs-subst">\${sign(sessionId, nonce)}</span>\`</span>;
}

<span class="hljs-keyword">export</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">verify</span>(<span class="hljs-params">sessionId, cookieToken, headerToken</span>) {
  <span class="hljs-keyword">if</span> (!cookieToken || cookieToken !== headerToken) <span class="hljs-keyword">return</span> <span class="hljs-literal">false</span>;
  <span class="hljs-keyword">const</span> [nonce, mac] = cookieToken.<span class="hljs-title function_">split</span>(<span class="hljs-string">&#x27;.&#x27;</span>);
  <span class="hljs-keyword">if</span> (!nonce || !mac) <span class="hljs-keyword">return</span> <span class="hljs-literal">false</span>;
  <span class="hljs-keyword">const</span> expected = <span class="hljs-title class_">Buffer</span>.<span class="hljs-title function_">from</span>(<span class="hljs-title function_">sign</span>(sessionId, nonce));
  <span class="hljs-keyword">const</span> actual = <span class="hljs-title class_">Buffer</span>.<span class="hljs-title function_">from</span>(mac);
  <span class="hljs-keyword">return</span> expected.<span class="hljs-property">length</span> === actual.<span class="hljs-property">length</span> &amp;&amp; <span class="hljs-title function_">timingSafeEqual</span>(expected, actual);
}
</code></pre></div>
<p>签名为什么能堵住朴素版的漏洞？攻击者就算能往浏览器写 Cookie，他也没有服务端密钥，算不出合法的签名。而且签名里含会话标识，拿自己账号的令牌放到别人的会话里也通不过。用测试密钥实际运行，给 <code>alice</code> 签发的令牌，<code>verify(&#x27;alice&#x27;, t, t)</code> 返回 <code>true</code>，换成 <code>verify(&#x27;bob&#x27;, t, t)</code> 就返回 <code>false</code>。</p>
<p>代码里还有两个细节。签名输入带了长度前缀，避免不同的会话标识和随机数拼出同一个字符串。比较用 <code>timingSafeEqual</code>，耗时不随内容变化，防止攻击者通过响应时间一点点猜出签名。生产环境优先用框架自带的 CSRF 中间件。</p>
<h2>还要注意什么</h2>
<p>Cookie 用 <code>__Host-</code> 前缀，它要求 <code>Secure</code>、<code>Path=/</code>、不能设 <code>Domain</code>，这样子域名就没法覆盖它。令牌只保护修改操作，<code>GET</code> 本来就不该改数据。登录和登出之后重新签发令牌。</p>
<p>最后，有 XSS 时这套机制会失效，因为恶意脚本跑在你的页面里，可以直接读到令牌。</p>
<h2>常见追问</h2>
<p><strong>已经设了 <code>SameSite=Lax</code>，还要这个吗？</strong></p>
<blockquote>
<p><code>SameSite</code> 拦不住同站子域名发来的请求，而且依赖浏览器的实现。令牌是额外的一层保证。</p>
</blockquote>
<p><strong>同步令牌模式是什么？</strong></p>
<blockquote>
<p>服务端把令牌存在会话里，页面通过模板或接口拿到令牌，提交时和会话里的值比较。它不需要用 Cookie 承载令牌，也就没有 Cookie 被写入伪造值的问题。</p>
</blockquote>`};export{e as default};