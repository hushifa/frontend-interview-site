var e={answerHtml:`<h2>简答</h2>
<ul>
<li><code>crypto.getRandomValues()</code> 生成安全随机数，不要求安全上下文；<code>crypto.randomUUID()</code> 只在安全上下文（HTTPS 或 localhost）可用；<code>crypto.subtle</code> 提供 <code>digest</code>、<code>sign</code>、<code>encrypt</code>、<code>deriveKey</code> 等方法。</li>
<li>整个 <code>crypto.subtle</code> 只在安全上下文中可用，<code>getRandomValues()</code> 不受这一限制。</li>
<li>密钥是 <code>CryptoKey</code> 对象，<code>extractable: false</code> 的密钥无法用 <code>exportKey()</code> 导出，脚本也拿不到原始字节。</li>
<li><code>CryptoKey</code> 可以被结构化克隆，直接存进 IndexedDB，下次打开页面仍能使用而且仍不可导出。</li>
<li>浏览器端加密不能防御 XSS：攻击者的脚本无法导出密钥，但可以直接调用它加解密。</li>
</ul>
<h2>示例：AES-GCM 加密本地数据</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">createKey</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">return</span> crypto.<span class="hljs-property">subtle</span>.<span class="hljs-title function_">generateKey</span>({ <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;AES-GCM&#x27;</span>, <span class="hljs-attr">length</span>: <span class="hljs-number">256</span> }, <span class="hljs-literal">false</span>, [<span class="hljs-string">&#x27;encrypt&#x27;</span>, <span class="hljs-string">&#x27;decrypt&#x27;</span>]);
}

<span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">encrypt</span>(<span class="hljs-params">key, text</span>) {
  <span class="hljs-keyword">const</span> iv = crypto.<span class="hljs-title function_">getRandomValues</span>(<span class="hljs-keyword">new</span> <span class="hljs-title class_">Uint8Array</span>(<span class="hljs-number">12</span>));
  <span class="hljs-keyword">const</span> data = <span class="hljs-keyword">new</span> <span class="hljs-title class_">TextEncoder</span>().<span class="hljs-title function_">encode</span>(text);
  <span class="hljs-keyword">const</span> cipher = <span class="hljs-keyword">await</span> crypto.<span class="hljs-property">subtle</span>.<span class="hljs-title function_">encrypt</span>({ <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;AES-GCM&#x27;</span>, iv }, key, data);
  <span class="hljs-keyword">return</span> { iv, cipher };
}

<span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">decrypt</span>(<span class="hljs-params">key, { iv, cipher }</span>) {
  <span class="hljs-keyword">const</span> plain = <span class="hljs-keyword">await</span> crypto.<span class="hljs-property">subtle</span>.<span class="hljs-title function_">decrypt</span>({ <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;AES-GCM&#x27;</span>, iv }, key, cipher);
  <span class="hljs-keyword">return</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">TextDecoder</span>().<span class="hljs-title function_">decode</span>(plain);
}
</code></pre></div>
<ul>
<li>AES-GCM 的 IV 每次加密都必须不同，12 字节随机值，和密文一起保存。IV 不需要保密。</li>
<li>解密时数据被篡改或密钥不对，<code>decrypt</code> 会 reject，不会返回错误的明文。</li>
</ul>
<h2>从密码派生密钥</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">keyFromPassword</span>(<span class="hljs-params">password, salt</span>) {
  <span class="hljs-keyword">const</span> base = <span class="hljs-keyword">await</span> crypto.<span class="hljs-property">subtle</span>.<span class="hljs-title function_">importKey</span>(<span class="hljs-string">&#x27;raw&#x27;</span>, <span class="hljs-keyword">new</span> <span class="hljs-title class_">TextEncoder</span>().<span class="hljs-title function_">encode</span>(password), <span class="hljs-string">&#x27;PBKDF2&#x27;</span>, <span class="hljs-literal">false</span>, [<span class="hljs-string">&#x27;deriveKey&#x27;</span>]);
  <span class="hljs-keyword">return</span> crypto.<span class="hljs-property">subtle</span>.<span class="hljs-title function_">deriveKey</span>(
    { <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;PBKDF2&#x27;</span>, salt, <span class="hljs-attr">iterations</span>: <span class="hljs-number">600000</span>, <span class="hljs-attr">hash</span>: <span class="hljs-string">&#x27;SHA-256&#x27;</span> },
    base,
    { <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;AES-GCM&#x27;</span>, <span class="hljs-attr">length</span>: <span class="hljs-number">256</span> },
    <span class="hljs-literal">false</span>,
    [<span class="hljs-string">&#x27;encrypt&#x27;</span>, <span class="hljs-string">&#x27;decrypt&#x27;</span>],
  );
}
</code></pre></div>
<p>盐值随机生成并保存，迭代次数要足够大以增加暴力破解成本。从已有的高熵密钥派生子密钥用 HKDF，不需要大量迭代。</p>
<h2>适用边界</h2>
<ul>
<li>适合：端到端加密的聊天、本地加密的离线数据、校验下载文件的哈希、在浏览器中验证签名。</li>
<li>不适合代替 HTTPS，也不应该在前端保存服务端的私钥或 API 密钥。</li>
<li>密钥丢失（用户清除了站点数据）时加密数据无法恢复，需要设计备份或重新同步的流程。</li>
</ul>`};export{e as default};