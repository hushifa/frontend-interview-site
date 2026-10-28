var e={answerHtml:`<h2>简答</h2>
<ul>
<li>注册：服务端生成随机 <code>challenge</code>，前端调用 <code>navigator.credentials.create()</code>，认证器生成密钥对，服务端验证响应后保存公钥和凭证 ID。</li>
<li>登录：服务端生成新的 <code>challenge</code>，前端调用 <code>navigator.credentials.get()</code>，认证器签名，服务端用公钥验证签名、<code>challenge</code>、<code>origin</code> 和 RP ID。</li>
<li>抗钓鱼：凭证绑定 RP ID（站点域名），浏览器把真实来源写进签名数据，假冒站点拿不到也用不了真实站点的凭证。</li>
<li>用户在场（UP）只表示有人触碰确认；用户验证（UV）表示完成了 PIN 或生物识别。需要 UV 时服务端必须检查标志位。</li>
<li>服务端从不接触私钥和生物特征；同步型 Passkey 的私钥由平台的密码管理服务加密同步。</li>
</ul>
<h2>登录调用</h2>
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
<p><code>base64urlToBytes</code> 和 <code>serializeCredential</code> 负责二进制与 JSON 的转换，实际项目中使用成熟的客户端库（如 <code>@simplewebauthn/browser</code>）处理。浏览器支持时也可以用 <code>PublicKeyCredential.parseRequestOptionsFromJSON()</code> 和 <code>credential.toJSON()</code>。</p>
<h2>服务端必须验证</h2>
<table><thead><tr><th>检查项</th><th>原因</th></tr></thead><tbody><tr><td><code>challenge</code> 与本次会话保存的一致、未过期、只用一次</td><td>防重放</td></tr><tr><td><code>origin</code> 是自己的站点</td><td>防钓鱼和跨站调用</td></tr><tr><td><code>rpIdHash</code> 对应自己的 RP ID</td><td>凭证属于本站</td></tr><tr><td>UP、UV 标志符合要求</td><td>确认用户在场或完成验证</td></tr><tr><td>签名用保存的公钥验证通过</td><td>证明持有私钥</td></tr></tbody></table>
<p>注册时绑定的用户必须来自服务端会话，不能信任前端传来的用户 ID，否则攻击者可以把自己的凭证绑到别人的账号上。</p>
<p>签名计数器：部分认证器提供递增计数，用于发现凭证被复制；同步型 Passkey 通常不提供有意义的计数，计数异常应作为风险信号而不是一律拒绝。</p>
<h2>产品层面</h2>
<ul>
<li>允许一个账号注册多个 Passkey，支持命名和删除，删除最后一个凭证前要求再次验证。</li>
<li>账号恢复的强度决定了整体安全：如果仅凭一条短信就能重置并绑定新 Passkey，攻击者会绕过它。</li>
<li>登录成功后仍是应用自己的会话管理，会话 Cookie 被盗与 Passkey 无关。</li>
<li>提供条件式界面：输入框加 <code>autocomplete=&quot;username webauthn&quot;</code>，配合 <code>mediation: &#x27;conditional&#x27;</code>，在自动填充中展示 Passkey。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li>WebAuthn 能防 XSS 吗？不能。XSS 可以在登录后的会话中直接操作，认证方式只保护登录这一步。</li>
<li>只能在 HTTPS 下用吗？是的，需要安全上下文（localhost 例外）。</li>
</ul>`};export{e as default};