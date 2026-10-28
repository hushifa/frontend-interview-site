var e={answerHtml:`<h2>简答</h2>
<ul>
<li>问题：浏览器单页应用和移动应用是公共客户端，无法保存 <code>client_secret</code>。授权码可能通过重定向、日志、恶意应用注册的同名回调被截获，攻击者拿去就能换到令牌。</li>
<li>PKCE 把授权码和&quot;发起这次授权的那个客户端实例&quot;绑定：只有持有 <code>code_verifier</code> 的一方能完成兑换。</li>
<li><code>code_challenge_method</code> 用 <code>S256</code>；<code>plain</code> 会把原值暴露在授权请求里，RFC 9700 指出目前只有 <code>S256</code> 能避免这一点。</li>
<li>RFC 9700 规定：公共客户端必须（MUST）使用 PKCE；机密客户端推荐（RECOMMENDED）使用；授权服务器必须支持 PKCE。</li>
<li>它不替代 <code>state</code>（防 CSRF）和回调地址精确匹配，也不认证客户端身份。</li>
</ul>
<h2>流程</h2>
<ol>
<li>客户端生成 43–128 个字符的随机 <code>code_verifier</code>，计算 <code>code_challenge = BASE64URL(SHA256(code_verifier))</code>。</li>
<li>跳转授权：<code>/authorize?response_type=code&amp;client_id=...&amp;redirect_uri=...&amp;state=...&amp;code_challenge=...&amp;code_challenge_method=S256</code>。</li>
<li>回调拿到 <code>code</code>，校验 <code>state</code>。</li>
<li>换令牌：<code>POST /token</code>，参数包括 <code>grant_type=authorization_code</code>、<code>code</code>、<code>redirect_uri</code>、<code>code_verifier</code>。</li>
<li>授权服务器重新计算摘要，与第 2 步保存的 <code>code_challenge</code> 比较，一致才签发令牌。</li>
</ol>
<h2>生成参数</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">base64url</span>(<span class="hljs-params">bytes</span>) {
  <span class="hljs-keyword">return</span> <span class="hljs-title function_">btoa</span>(<span class="hljs-title class_">String</span>.<span class="hljs-title function_">fromCharCode</span>(...bytes)).<span class="hljs-title function_">replace</span>(<span class="hljs-regexp">/\\+/g</span>, <span class="hljs-string">&#x27;-&#x27;</span>).<span class="hljs-title function_">replace</span>(<span class="hljs-regexp">/\\//g</span>, <span class="hljs-string">&#x27;_&#x27;</span>).<span class="hljs-title function_">replace</span>(<span class="hljs-regexp">/=+$/</span>, <span class="hljs-string">&#x27;&#x27;</span>);
}

<span class="hljs-keyword">export</span> <span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">createPkce</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">const</span> verifier = <span class="hljs-title function_">base64url</span>(crypto.<span class="hljs-title function_">getRandomValues</span>(<span class="hljs-keyword">new</span> <span class="hljs-title class_">Uint8Array</span>(<span class="hljs-number">32</span>)));
  <span class="hljs-keyword">const</span> digest = <span class="hljs-keyword">await</span> crypto.<span class="hljs-property">subtle</span>.<span class="hljs-title function_">digest</span>(<span class="hljs-string">&#x27;SHA-256&#x27;</span>, <span class="hljs-keyword">new</span> <span class="hljs-title class_">TextEncoder</span>().<span class="hljs-title function_">encode</span>(verifier));
  <span class="hljs-keyword">return</span> { verifier, <span class="hljs-attr">challenge</span>: <span class="hljs-title function_">base64url</span>(<span class="hljs-keyword">new</span> <span class="hljs-title class_">Uint8Array</span>(digest)) };
}
</code></pre></div>
<p><code>verifier</code> 保存在 <code>sessionStorage</code> 中直到回调完成，用完即删。<code>crypto.subtle</code> 只在安全上下文（HTTPS 或 localhost）可用。</p>
<h2>RFC 9700 的其他相关要求</h2>
<ul>
<li>不应再使用隐式流程（<code>response_type=token</code>），改用授权码加 PKCE。</li>
<li>授权服务器校验回调地址必须用精确字符串匹配（localhost 回调的端口号除外）。</li>
<li>签发给公共客户端的刷新令牌必须做发送方约束（如 DPoP）或启用轮换。</li>
</ul>
<h2>前端令牌存放</h2>
<p>浏览器中直接持有访问令牌，XSS 可以读取。更安全的方案是 BFF：由同源后端作为机密客户端完成授权码兑换，浏览器只持有 <code>HttpOnly</code> 会话 Cookie。</p>
<h2>常见追问</h2>
<ul>
<li>有了 PKCE 还需要 <code>state</code> 吗？需要。<code>state</code> 防止攻击者把自己的授权码注入受害者的回调，PKCE 防止截获的授权码被兑换。</li>
<li>和 OIDC 的关系？OIDC 在 OAuth 之上加了身份认证，同样使用授权码加 PKCE，见《OpenID Connect 和 OAuth 2.0 分别解决什么问题？》。</li>
</ul>`};export{e as default};