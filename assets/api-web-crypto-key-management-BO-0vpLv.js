var e={answerHtml:`<p>应用想在浏览器中加密草稿、验证下载文件或实现 Passkey 辅助流程，开发者常把“字符串做 SHA-256”称为加密，或者把密钥放进 <code>localStorage</code> 后认为数据安全。Web Crypto API 提供的是底层密码学原语，真正安全取决于用途、密钥生命周期、认证方式、随机数和服务端协议。</p>
<h2>哈希、加密、签名和派生解决不同问题</h2>
<ul>
<li><strong>哈希</strong>：把输入映射为摘要，用于完整性或指纹；不能从摘要还原原文，也不等于密码存储方案。</li>
<li><strong>对称加密</strong>：同一把秘密密钥加密和解密，适合保护数据机密性；必须使用认证加密模式并安全保存密钥。</li>
<li><strong>签名</strong>：私钥签名、公钥验证，证明持有者和内容完整性；不是把内容隐藏起来。</li>
<li><strong>密钥派生</strong>：从密码或主密钥派生工作密钥，需要盐值、成本参数和明确协议。</li>
</ul>
<p>把密码直接哈希一次、把 AES-CTR 当作完整加密、把公钥当成秘密，都会造成错误的安全假设。</p>
<h2>生成随机密钥和随机数</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> key = <span class="hljs-keyword">await</span> crypto.<span class="hljs-property">subtle</span>.<span class="hljs-title function_">generateKey</span>(
  {
    <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;AES-GCM&#x27;</span>,
    <span class="hljs-attr">length</span>: <span class="hljs-number">256</span>,
  },
  <span class="hljs-literal">false</span>,
  [<span class="hljs-string">&#x27;encrypt&#x27;</span>, <span class="hljs-string">&#x27;decrypt&#x27;</span>],
);

<span class="hljs-keyword">const</span> iv = crypto.<span class="hljs-title function_">getRandomValues</span>(<span class="hljs-keyword">new</span> <span class="hljs-title class_">Uint8Array</span>(<span class="hljs-number">12</span>));
<span class="hljs-keyword">const</span> plaintext = <span class="hljs-keyword">new</span> <span class="hljs-title class_">TextEncoder</span>().<span class="hljs-title function_">encode</span>(<span class="hljs-string">&#x27;需要保护的草稿&#x27;</span>);
<span class="hljs-comment">// 绑定记录身份；解密端必须从可信业务上下文取得同样的值。</span>
<span class="hljs-keyword">const</span> additionalData = <span class="hljs-keyword">new</span> <span class="hljs-title class_">TextEncoder</span>().<span class="hljs-title function_">encode</span>(<span class="hljs-string">&#x27;draft:42:format:1&#x27;</span>);
<span class="hljs-keyword">const</span> ciphertext = <span class="hljs-keyword">await</span> crypto.<span class="hljs-property">subtle</span>.<span class="hljs-title function_">encrypt</span>(
  { <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;AES-GCM&#x27;</span>, iv, additionalData, <span class="hljs-attr">tagLength</span>: <span class="hljs-number">128</span> },
  key,
  plaintext,
);

<span class="hljs-keyword">const</span> restored = <span class="hljs-keyword">await</span> crypto.<span class="hljs-property">subtle</span>.<span class="hljs-title function_">decrypt</span>(
  { <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;AES-GCM&#x27;</span>, iv, additionalData, <span class="hljs-attr">tagLength</span>: <span class="hljs-number">128</span> },
  key,
  ciphertext,
);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-keyword">new</span> <span class="hljs-title class_">TextDecoder</span>().<span class="hljs-title function_">decode</span>(restored)); <span class="hljs-comment">// 需要保护的草稿</span>

<span class="hljs-keyword">const</span> damaged = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Uint8Array</span>(ciphertext.<span class="hljs-title function_">slice</span>(<span class="hljs-number">0</span>));
damaged[<span class="hljs-number">0</span>] ^= <span class="hljs-number">1</span>;
<span class="hljs-keyword">try</span> {
  <span class="hljs-keyword">await</span> crypto.<span class="hljs-property">subtle</span>.<span class="hljs-title function_">decrypt</span>(
    { <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;AES-GCM&#x27;</span>, iv, additionalData, <span class="hljs-attr">tagLength</span>: <span class="hljs-number">128</span> },
    key,
    damaged,
  );
  <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">&#x27;预期认证失败，但解密成功&#x27;</span>);
} <span class="hljs-keyword">catch</span> (error) {
  <span class="hljs-keyword">if</span> (error.<span class="hljs-property">name</span> !== <span class="hljs-string">&#x27;OperationError&#x27;</span>) <span class="hljs-keyword">throw</span> error;
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;密文被修改，拒绝使用&#x27;</span>);
}
</code></pre></div>
<p>AES-GCM 的 IV 不要求保密，但同一把密钥下不能重复使用；它通常使用 12 字节随机 IV，具体限制要按实现和协议固定。密文应和 IV、版本、算法参数一起保存，解密时还要验证认证标签。不要使用 <code>Math.random()</code> 生成 IV、盐或密钥，也不要截断密文或忽略 <code>decrypt</code> 的失败。</p>
<p><code>extractable: false</code> 可以限制密钥导出，但不是对恶意同源脚本的绝对防护；同源 XSS 仍可能调用密钥进行允许的操作。浏览器端密钥保护必须和 CSP、Trusted Types、依赖治理及会话安全一起设计。</p>
<p>这段代码可以在支持 Web Crypto 的安全上下文中作为模块运行。Web Crypto 的 AES-GCM 输出已包含认证标签，decrypt 会校验它；无需自己比较标签，更不能验证失败后仍展示解出的部分数据。AAD 不加密，只参与认证，不能把秘密放进去并期待它被隐藏。错误的密钥、IV 或 AAD 也可能导致认证失败，生产界面不应仅凭 OperationError 就断言用户遭遇攻击。</p>
<p>随机 IV 是概率性避免重复，不是无限使用的保证。高频、多设备共享密钥的协议必须规划调用量、唯一性和轮换，不能把同一个示例 iv 重用于多次 encrypt。重复解密同一条密文则不属于重复加密使用 IV。</p>
<h2>密钥存储和导入</h2>
<p><code>CryptoKey</code> 可以放入 IndexedDB（具体可序列化性和浏览器支持需实测），但存储它不等于密钥已经脱离当前源的信任边界。任何能够执行同源脚本的代码都可能尝试使用可访问的密钥。<code>localStorage</code> 适合保存非敏感版本或状态，不适合保存原始密钥、会话令牌和密码。</p>
<p>导入外部 JWK、原始字节或 PEM 时要校验算法、用途、长度和版本，不能让输入决定任意算法：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> publicKey = <span class="hljs-keyword">await</span> crypto.<span class="hljs-property">subtle</span>.<span class="hljs-title function_">importKey</span>(
  <span class="hljs-string">&#x27;jwk&#x27;</span>,
  jwk,
  { <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;ECDSA&#x27;</span>, <span class="hljs-attr">namedCurve</span>: <span class="hljs-string">&#x27;P-256&#x27;</span> },
  <span class="hljs-literal">false</span>,
  [<span class="hljs-string">&#x27;verify&#x27;</span>],
);
</code></pre></div>
<p>示例只允许公钥验证用途。生产协议应确认曲线、签名编码和哈希算法与服务端实现一致；不要因为导入成功就信任密钥来源，密钥绑定和撤销仍属于应用协议。</p>
<h2>密码派生不能用普通哈希替代</h2>
<p>用户密码熵通常较低，不能直接作为 AES 密钥，也不能只做一次 SHA-256。浏览器可以使用 PBKDF2 等 API 进行派生，但成本参数、盐值、升级和服务端验证要由完整协议定义。更高风险的账号密码存储应交给服务端使用适合密码哈希的方案；浏览器端派生不应让密码在网络或日志中暴露。</p>
<p>加密草稿的密钥恢复也需要产品设计：用户清除浏览器数据、换设备、忘记密码或撤销会话时，数据是否仍可恢复？如果没有密钥备份或服务端密钥包装，纯客户端加密数据可能永久无法解密。不要把“无法恢复”当作默认安全优势而不告知用户。</p>
<h2>版本、轮换和关联数据</h2>
<p>加密格式应包含版本、算法、密钥 ID、IV 和密文长度边界。密钥轮换时，新数据使用新密钥，旧数据按版本解密后重新加密；不能把新密钥直接覆盖旧密钥导致历史数据不可读。关联数据（AAD）可以认证租户、记录 ID 或版本，但这些字段必须在解密前由业务上下文确定，不能信任密文中自称的租户。</p>
<h2>安全上下文、兼容性和性能</h2>
<p>Web Crypto 的许多能力要求安全上下文（HTTPS），在 Web Worker 中也可能可用。算法、曲线、密钥格式和浏览器实现存在差异，不能只在一个浏览器成功就宣布兼容。大文件加密应评估流式处理、分块协议和内存峰值；<code>subtle.encrypt</code> 接收完整 ArrayBuffer 时可能一次性占用大量内存。</p>
<h2>常见误区</h2>
<ul>
<li>把哈希称为加密：哈希没有保密性。</li>
<li>用 AES-ECB 或复用 GCM IV：会泄露模式或破坏认证安全。</li>
<li>把密钥放进 localStorage：XSS 或同源脚本可直接读取。</li>
<li>只加密前端：服务端、备份和日志仍可能保存明文。</li>
<li>只验证签名不验证密钥绑定：攻击者可能替换成自己的公钥。</li>
</ul>
<p>高风险密码学方案优先采用经过审查的协议和库，不要自行设计算法组合。Web Crypto 适合明确、可验证的原语调用；密钥生成、分发、恢复、撤销和服务端权限才是完整安全方案的主体。</p>
<h2>参考资料</h2>
<ul>
<li><a href="https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API">MDN · Web Crypto API</a></li>
<li><a href="https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto">MDN · SubtleCrypto</a></li>
<li><a href="https://www.w3.org/TR/WebCryptoAPI/">W3C · Web Cryptography API</a></li>
<li><a href="https://www.rfc-editor.org/rfc/rfc5869.html">RFC 5869 · HKDF</a></li>
</ul>`};export{e as default};