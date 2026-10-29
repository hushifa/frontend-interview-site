var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>用 Passkey 登录时，用户按一下指纹就进去了，不用输密码。背后是 WebAuthn：手机、电脑或安全钥匙里的认证器生成一对密钥，私钥留在认证器里，公钥交给服务端保存。</p>
<p>注册时，服务端生成一个随机的 <code>challenge</code>，前端调用 <code>navigator.credentials.create()</code>，认证器生成密钥对，服务端验证后保存公钥和凭证 ID。登录时，服务端再生成一个新的 <code>challenge</code>，前端调用 <code>navigator.credentials.get()</code>，认证器用私钥签名，服务端用公钥验证签名、<code>challenge</code>、<code>origin</code> 和 RP ID。</p>
<p>它能防钓鱼，是因为凭证绑定了 RP ID，也就是站点的域名，浏览器还会把真实的来源写进签名数据。假冒的网站拿不到真实站点的凭证，拿到了也用不了。服务端也从来不接触私钥和生物特征。同步型的 Passkey，私钥由平台的密码管理服务加密后在设备间同步。</p>
<p>要注意两个标志位的区别。用户在场（UP）只表示有人碰了一下确认；用户验证（UV）表示完成了 PIN 或生物识别。需要 UV 时，服务端必须检查这个标志位。</p>
</blockquote>
<h2>登录时前端做什么</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> options = <span class="hljs-keyword">await</span> <span class="hljs-title function_">fetch</span>(<span class="hljs-string">&#x27;/webauthn/login/options&#x27;</span>, { <span class="hljs-attr">method</span>: <span class="hljs-string">&#x27;POST&#x27;</span> }).<span class="hljs-title function_">then</span>(<span class="hljs-function">(<span class="hljs-params">r</span>) =&gt;</span> r.<span class="hljs-title function_">json</span>());

<span class="hljs-keyword">const</span> credential = <span class="hljs-keyword">await</span> navigator.<span class="hljs-property">credentials</span>.<span class="hljs-title function_">get</span>({
  <span class="hljs-attr">publicKey</span>: {
    <span class="hljs-attr">challenge</span>: <span class="hljs-title function_">base64urlToBytes</span>(options.<span class="hljs-property">challenge</span>),
    <span class="hljs-attr">rpId</span>: <span class="hljs-string">&#x27;example.com&#x27;</span>,
    <span class="hljs-attr">userVerification</span>: <span class="hljs-string">&#x27;required&#x27;</span>,
    <span class="hljs-attr">allowCredentials</span>: [], <span class="hljs-comment">// 为空时使用可发现凭证，用户从列表中选择 Passkey</span>
  },
});

<span class="hljs-keyword">await</span> <span class="hljs-title function_">fetch</span>(<span class="hljs-string">&#x27;/webauthn/login/verify&#x27;</span>, {
  <span class="hljs-attr">method</span>: <span class="hljs-string">&#x27;POST&#x27;</span>,
  <span class="hljs-attr">headers</span>: { <span class="hljs-string">&#x27;Content-Type&#x27;</span>: <span class="hljs-string">&#x27;application/json&#x27;</span> },
  <span class="hljs-attr">body</span>: <span class="hljs-title class_">JSON</span>.<span class="hljs-title function_">stringify</span>(<span class="hljs-title function_">serializeCredential</span>(credential)),
});
</code></pre></div>
<p>整个过程是三步：先向服务端要一个 <code>challenge</code>，交给浏览器让认证器签名，再把结果发回服务端验证。为什么每次都要新的 <code>challenge</code>？因为签名针对的是这个随机值，攻击者就算录下了一次登录的签名，下次 <code>challenge</code> 变了，旧签名就没用了。</p>
<p><code>base64urlToBytes</code> 和 <code>serializeCredential</code> 负责二进制和 JSON 之间的转换，实际项目里用成熟的客户端库处理，比如 <code>@simplewebauthn/browser</code>。浏览器支持时，也可以用 <code>PublicKeyCredential.parseRequestOptionsFromJSON()</code> 和 <code>credential.toJSON()</code>。</p>
<h2>服务端必须验证什么</h2>
<table><thead><tr><th>检查项</th><th>原因</th></tr></thead><tbody><tr><td><code>challenge</code> 与本次会话保存的一致、未过期、只用一次</td><td>防重放</td></tr><tr><td><code>origin</code> 是自己的站点</td><td>防钓鱼和跨站调用</td></tr><tr><td><code>rpIdHash</code> 对应自己的 RP ID</td><td>凭证属于本站</td></tr><tr><td>UP、UV 标志符合要求</td><td>确认用户在场或完成验证</td></tr><tr><td>签名用保存的公钥验证通过</td><td>证明持有私钥</td></tr></tbody></table>
<p>注册环节有个容易漏的点：把凭证绑到哪个用户，必须以服务端会话为准，不能信任前端传来的用户 ID。否则攻击者可以把自己的凭证绑到别人的账号上，之后用自己的指纹登录别人的账号。</p>
<p>还有签名计数器。部分认证器每次签名都会让计数加一，服务端发现计数倒退，说明凭证可能被复制了。可是同步型的 Passkey 通常不提供有意义的计数，所以计数异常应该当成风险信号，而不是一律拒绝登录。</p>
<h2>产品上要考虑什么</h2>
<p>允许一个账号注册多个 Passkey，支持命名和删除，删除最后一个之前要求再次验证。</p>
<p>账号恢复的强度决定了整体的安全性。如果只凭一条短信就能重置账号、绑定新的 Passkey，攻击者就会绕过 Passkey，直接走恢复流程。</p>
<p>登录成功之后，就是应用自己的会话管理了。会话 Cookie 被盗和 Passkey 无关，Passkey 只保护登录这一步。</p>
<p>体验上可以提供条件式界面：输入框加 <code>autocomplete=&quot;username webauthn&quot;</code>，配合 <code>mediation: &#x27;conditional&#x27;</code>，用户点输入框时，自动填充列表里会直接出现 Passkey。</p>
<h2>常见追问</h2>
<p><strong>WebAuthn 能防 XSS 吗？</strong></p>
<blockquote>
<p>不能。XSS 发生在登录之后的页面里，恶意脚本可以直接用已有的会话操作。认证方式只保护登录这一步。</p>
</blockquote>
<p><strong>只能在 HTTPS 下用吗？</strong></p>
<blockquote>
<p>是的，它需要安全上下文，localhost 例外。</p>
</blockquote>`};export{e as default};