var e={answerHtml:`<h2>简答</h2>
<ul>
<li>原理：Cookie 自动随请求发送，请求头必须由页面脚本主动设置；跨站页面受同源策略限制，读不到目标站点的 Cookie。</li>
<li>朴素版只比较&quot;Cookie 值等于请求头值&quot;。如果攻击者能通过子域名或中间人写入 Cookie，就能放入一个已知值再提交同样的值。</li>
<li>OWASP 推荐签名版：令牌是用服务端密钥对&quot;会话标识 + 随机数&quot;计算的 HMAC，服务端验证签名并确认属于当前会话。</li>
<li>CSRF Cookie 需要让前端读取，所以不能设 <code>HttpOnly</code>；会话 Cookie 仍然要 <code>HttpOnly</code>。</li>
<li>与 <code>SameSite</code>、<code>Origin</code> 校验一起使用；服务端有会话存储时，同步令牌模式更简单。</li>
</ul>
<h2>请求形态</h2>
<div class="not-prose code-block"><div class="code-language">http</div><pre><code class="hljs language-http">POST /api/profile HTTP/1.1
Cookie: __Host-session=s3ss10n; __Host-csrf=7f3a.c9e1
X-CSRF-Token: 7f3a.c9e1
Content-Type: application/json
</code></pre></div>
<h2>前端</h2>
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
<h2>服务端（Node 示意）</h2>
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
<p>签名输入带长度前缀，避免不同组合拼出相同字符串；比较用恒定时间。生产中优先使用框架自带的 CSRF 中间件。</p>
<h2>注意</h2>
<ul>
<li><code>__Host-</code> 前缀要求 <code>Secure</code>、<code>Path=/</code>、无 <code>Domain</code>，子域名无法覆盖这个 Cookie。</li>
<li>只保护修改操作，<code>GET</code> 本来就不应该改数据。</li>
<li>登录、登出后重新签发令牌。</li>
<li>有 XSS 时这套机制失效，脚本可以直接读取令牌。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li>已经有 <code>SameSite=Lax</code> 还要吗？<code>SameSite</code> 拦不住同站的子域名请求，也依赖浏览器实现，令牌是额外的保证。</li>
<li>同步令牌模式是什么？服务端把令牌存在会话里，页面通过模板或接口拿到令牌，提交时与会话中的值比较，不需要 Cookie 承载令牌。</li>
</ul>`};export{e as default};