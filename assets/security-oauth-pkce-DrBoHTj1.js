var e={answerHtml:`<p>授权码流程中，用户在授权服务器完成操作后，浏览器会被重定向回应用，并携带一个短期授权码。应用再拿这个码去令牌端点兑换令牌。问题是：如果别人截获了这个码，怎样避免他抢先兑换？</p>
<p>PKCE 让授权码的兑换与最初发起请求的客户端实例关联。发起时提交一个随机秘密的摘要，兑换时证明自己持有那个秘密；只拿到授权码的人不应能完成兑换。</p>
<h3>verifier 和 challenge 在不同阶段出现</h3>
<p>一次流程可以按下面的顺序理解：</p>
<ol>
<li>客户端生成高熵随机 code_verifier，并保存到本次授权事务中。</li>
<li>对 verifier 计算 SHA-256，再做不带填充的 Base64URL 编码，得到 code_challenge。</li>
<li>跳转授权端点时发送 challenge 和 <code>code_challenge_method=S256</code>，不发送 verifier。</li>
<li>授权服务器把 challenge 与随后签发的授权码关联。</li>
<li>客户端收到授权码，向令牌端点提交 code 和原始 verifier。</li>
<li>服务端重新计算摘要，匹配且其他校验也通过，才签发令牌。</li>
</ol>
<p>PKCE 验证发生在“用授权码换令牌”时，不是先用 verifier 去换授权码。challenge 也不是把授权码加密后的结果，两者是在不同阶段产生的值。</p>
<h3>浏览器中怎样计算 S256</h3>
<p>下面只演示 PKCE 参数生成，不是一套完整登录 SDK：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">base64url</span>(<span class="hljs-params">bytes</span>) {
  <span class="hljs-keyword">return</span> <span class="hljs-title function_">btoa</span>(<span class="hljs-title class_">String</span>.<span class="hljs-title function_">fromCharCode</span>(...bytes))
    .<span class="hljs-title function_">replace</span>(<span class="hljs-regexp">/\\+/g</span>, <span class="hljs-string">&#x27;-&#x27;</span>)
    .<span class="hljs-title function_">replace</span>(<span class="hljs-regexp">/\\//g</span>, <span class="hljs-string">&#x27;_&#x27;</span>)
    .<span class="hljs-title function_">replace</span>(<span class="hljs-regexp">/=+$/</span>, <span class="hljs-string">&#x27;&#x27;</span>);
}

<span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">challengeFor</span>(<span class="hljs-params">verifier</span>) {
  <span class="hljs-keyword">const</span> digest = <span class="hljs-keyword">await</span> crypto.<span class="hljs-property">subtle</span>.<span class="hljs-title function_">digest</span>(
    <span class="hljs-string">&#x27;SHA-256&#x27;</span>,
    <span class="hljs-keyword">new</span> <span class="hljs-title class_">TextEncoder</span>().<span class="hljs-title function_">encode</span>(verifier),
  );
  <span class="hljs-keyword">return</span> <span class="hljs-title function_">base64url</span>(<span class="hljs-keyword">new</span> <span class="hljs-title class_">Uint8Array</span>(digest));
}

<span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">createPkce</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">const</span> random = crypto.<span class="hljs-title function_">getRandomValues</span>(<span class="hljs-keyword">new</span> <span class="hljs-title class_">Uint8Array</span>(<span class="hljs-number">32</span>));
  <span class="hljs-keyword">const</span> verifier = <span class="hljs-title function_">base64url</span>(random);
  <span class="hljs-keyword">return</span> { verifier, <span class="hljs-attr">challenge</span>: <span class="hljs-keyword">await</span> <span class="hljs-title function_">challengeFor</span>(verifier) };
}
</code></pre></div>
<p>32 个随机字节提供 256 位随机性，编码后得到 43 个字符，符合 RFC 7636 对 verifier 长度和字符集的要求。不能用 Math.random、时间戳或固定字符串代替。摘要应直接编码原始字节，不是把十六进制字符串再做 Base64。</p>
<p>每次授权都生成新值，并与当前事务对应，回调结束后清理。页面跳转、多标签页并发和失败重试都可能打乱关联，所以不应只用一个全局变量保存所有登录请求。也不要把 verifier 写进授权 URL 或日志。</p>
<h3>PKCE 不是浏览器里的客户端密钥</h3>
<p>浏览器前端是公共客户端，打包进 JavaScript 的 client_secret 不能保密。client_id 用来标识已注册的应用，通常可以公开；PKCE 则证明当前兑换者持有本次事务的随机秘密，不证明运行这段代码的一定是某个不可伪造的应用。</p>
<p>机密客户端有自己的客户端认证机制，PKCE 可以作为补充，并不限于 SPA 或原生应用使用。</p>
<h3>仍然需要完整的回调与令牌校验</h3>
<p>实际应用还需要关联授权响应，检查预期的授权服务器、回调地址和事务状态。通常由成熟 SDK 管理不可预测的 state；在正确实现且确认授权服务器支持 PKCE 的条件下，PKCE 也可承担特定 CSRF 防护作用，但不能因此省略其他响应关联和来源检查。OIDC 中的 nonce 则用于把 ID Token 关联到认证请求，职责不同。</p>
<p>授权码应短期、单次使用，回调地址应按注册规则精确匹配；不能把接收到的任意 issuer 或令牌端点当作可信配置。前端直接兑换令牌还取决于提供方是否支持相应的浏览器客户端与 CORS。</p>
<p>PKCE 不能阻止已经在应用中执行的恶意脚本读取 verifier 或盗用已取得的令牌，也不解决过宽的 scope、令牌泄露或错误会话管理。它补上的是授权码兑换的关键关联，不是给整个登录流程自动加上一层万能保护。</p>`};export{e as default};