var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>浏览器里的单页应用和手机 App 叫公共客户端，代码在用户手里，存不住 <code>client_secret</code>。可是 OAuth 授权码流程里，授权码会经过重定向回到客户端，可能出现在日志里，也可能被恶意 App 注册的同名回调截走。攻击者拿到授权码，就能去换令牌。</p>
<p>PKCE 的做法是：客户端先生成一个随机字符串，叫 <code>code_verifier</code>，授权请求里只发它的 SHA-256 摘要，叫 <code>code_challenge</code>。换令牌时再提交原值，授权服务器重新算摘要比对。只截获授权码没用，因为攻击者手里没有 <code>code_verifier</code>。</p>
<p>RFC 9700 规定，公共客户端必须使用 PKCE，机密客户端推荐使用，授权服务器必须支持。摘要方法用 <code>S256</code>，<code>plain</code> 会把原值直接暴露在授权请求里。</p>
<p>要注意它管不了的事。它不认证客户端是谁，也不替代回调地址的精确匹配。至于防 CSRF，只有确认授权服务器支持 PKCE 时才能靠它，不能确认时仍然要用 <code>state</code> 或 OIDC 的 <code>nonce</code>。</p>
</blockquote>
<h2>流程是怎样的</h2>
<ol>
<li>客户端生成 43 到 128 个字符的随机 <code>code_verifier</code>，计算 <code>code_challenge = BASE64URL(SHA256(code_verifier))</code>。</li>
<li>跳转授权：<code>/authorize?response_type=code&amp;client_id=...&amp;redirect_uri=...&amp;state=...&amp;code_challenge=...&amp;code_challenge_method=S256</code>。</li>
<li>回调拿到 <code>code</code>，校验 <code>state</code>。</li>
<li>换令牌：<code>POST /token</code>，参数包括 <code>grant_type=authorization_code</code>、<code>code</code>、<code>redirect_uri</code>、<code>code_verifier</code>。</li>
<li>授权服务器重新计算摘要，与第 2 步保存的 <code>code_challenge</code> 比较，一致才签发令牌。</li>
</ol>
<p>关键在第 2 步和第 4 步的不对称。第 2 步经过浏览器地址栏，可能被人看到，但发的只是摘要，从摘要反推不出原值。第 4 步才交出原值，而这一步是客户端直接请求授权服务器的。所以它把授权码和“发起这次授权的那个客户端实例”绑在了一起。</p>
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
<p>32 个随机字节经过 base64url 编码，正好是 43 个字符，落在规范要求的范围里。用 Node 22 实际运行，<code>verifier</code> 和 <code>challenge</code> 的长度都是 43。</p>
<p><code>verifier</code> 存在 <code>sessionStorage</code> 里，等回调完成就删掉。另外 <code>crypto.subtle</code> 只在安全上下文里能用，也就是 HTTPS 或 localhost。</p>
<h2>RFC 9700 还有哪些相关要求</h2>
<p>不应该再用隐式流程，也就是 <code>response_type=token</code>，改用授权码加 PKCE。授权服务器校验回调地址时，必须用精确的字符串匹配，只有 localhost 回调的端口号例外。签发给公共客户端的刷新令牌，必须做发送方约束（比如 DPoP）或者启用轮换。</p>
<h2>令牌放在前端安全吗</h2>
<p>浏览器直接持有访问令牌时，一旦有 XSS 就会被读走。更安全的方案是 BFF，也就是一个同源的后端，由它作为机密客户端完成授权码兑换，浏览器只持有一个 <code>HttpOnly</code> 的会话 Cookie。</p>
<h2>常见追问</h2>
<p><strong>有了 PKCE 还需要 <code>state</code> 吗？</strong></p>
<blockquote>
<p>RFC 9700 的规定是：确认授权服务器支持 PKCE 时，客户端可以靠 PKCE 防 CSRF；无法确认时必须用 <code>state</code> 或 <code>nonce</code>。很多应用仍然保留 <code>state</code>，顺便带上登录前所在的页面信息。</p>
</blockquote>
<p><strong>PKCE 和 OIDC 是什么关系？</strong></p>
<blockquote>
<p>OIDC 在 OAuth 之上加了身份认证，同样使用授权码加 PKCE，见<a href="/questions/security-oidc/">《OpenID Connect 和 OAuth 2.0 分别解决什么问题？》</a>。</p>
</blockquote>`};export{e as default};