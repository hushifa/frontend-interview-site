var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>比如做一个端到端加密的笔记，数据要在浏览器里加密再上传，就要用 Web Crypto。<code>crypto.subtle</code> 提供 <code>digest</code>、<code>sign</code>、<code>encrypt</code>、<code>deriveKey</code> 等方法，它只在安全上下文（HTTPS 或 localhost）中可用。<code>crypto.randomUUID()</code> 也要求安全上下文，只有 <code>crypto.getRandomValues()</code> 没有这个限制。</p>
<p>密钥用 <code>CryptoKey</code> 对象表示。生成时把 <code>extractable</code> 设为 <code>false</code>，这个密钥就不能用 <code>exportKey()</code> 导出，脚本也拿不到原始字节。</p>
<p><code>CryptoKey</code> 可以被结构化克隆，所以能直接存进 IndexedDB。下次打开页面取出来还能用，而且仍然不可导出。</p>
<p>但要清楚它的边界：浏览器端加密挡不住 XSS。攻击者的脚本虽然导不出密钥，却可以直接拿这个密钥去加解密。还有，用户清除站点数据，密钥就没了，加密的数据也解不开。</p>
</blockquote>
<h2>用 AES-GCM 加密本地数据</h2>
<p>下面生成一个不可导出的密钥，用它加密和解密一段文字。</p>
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
<p><code>generateKey</code> 的第二个参数 <code>false</code> 就是 <code>extractable</code>，第三个参数限定这个密钥只能用来加密和解密。</p>
<p>IV 是什么？它是每次加密时混进去的一个随机数，让同样的内容每次加密出来都不一样。AES-GCM 要求同一个密钥下，IV 每次都必须不同，所以每次生成 12 字节随机值，和密文一起保存。IV 不需要保密。</p>
<h2>不可导出和防篡改，实际是什么效果</h2>
<p>下面这段在 Node 里也能运行，看看导出和篡改分别会怎样：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> key = <span class="hljs-keyword">await</span> crypto.<span class="hljs-property">subtle</span>.<span class="hljs-title function_">generateKey</span>({ <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;AES-GCM&#x27;</span>, <span class="hljs-attr">length</span>: <span class="hljs-number">256</span> }, <span class="hljs-literal">false</span>, [<span class="hljs-string">&#x27;encrypt&#x27;</span>, <span class="hljs-string">&#x27;decrypt&#x27;</span>]);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(key.<span class="hljs-property">extractable</span>); <span class="hljs-comment">// false</span>

<span class="hljs-keyword">try</span> {
  <span class="hljs-keyword">await</span> crypto.<span class="hljs-property">subtle</span>.<span class="hljs-title function_">exportKey</span>(<span class="hljs-string">&#x27;raw&#x27;</span>, key);
} <span class="hljs-keyword">catch</span> (error) {
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;导出失败&#x27;</span>);
}

<span class="hljs-keyword">const</span> iv = crypto.<span class="hljs-title function_">getRandomValues</span>(<span class="hljs-keyword">new</span> <span class="hljs-title class_">Uint8Array</span>(<span class="hljs-number">12</span>));
<span class="hljs-keyword">const</span> cipher = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Uint8Array</span>(
  <span class="hljs-keyword">await</span> crypto.<span class="hljs-property">subtle</span>.<span class="hljs-title function_">encrypt</span>({ <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;AES-GCM&#x27;</span>, iv }, key, <span class="hljs-keyword">new</span> <span class="hljs-title class_">TextEncoder</span>().<span class="hljs-title function_">encode</span>(<span class="hljs-string">&#x27;hi&#x27;</span>)),
);
cipher[<span class="hljs-number">0</span>] ^= <span class="hljs-number">1</span>;
<span class="hljs-keyword">try</span> {
  <span class="hljs-keyword">await</span> crypto.<span class="hljs-property">subtle</span>.<span class="hljs-title function_">decrypt</span>({ <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;AES-GCM&#x27;</span>, iv }, key, cipher);
} <span class="hljs-keyword">catch</span> (error) {
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;篡改后&#x27;</span>, error.<span class="hljs-property">name</span>); <span class="hljs-comment">// 篡改后 OperationError</span>
}
</code></pre></div>
<p>导出不可导出的密钥会直接失败。然后把密文的第一个字节改了一位，再解密，<code>decrypt</code> 没有返回一段错乱的明文，而是直接 reject。因为 AES-GCM 带有校验，数据被篡改或者密钥不对，都会解密失败。所以拿到结果就能确信数据没被改过。</p>
<h2>从密码派生密钥</h2>
<p>如果想用用户的密码来加密，不能直接拿密码当密钥，要先派生：</p>
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
<p>为什么要迭代 60 万次？因为密码通常很短、好猜，迭代次数大，每猜一次密码的成本就高，暴力破解就慢。盐值要随机生成并保存，让相同的密码派生出不同的密钥。</p>
<p>如果已经有一个高熵的密钥，只是想从它派生子密钥，就用 HKDF，不需要大量迭代。</p>
<h2>它适合做什么，不适合做什么</h2>
<p>适合的场景有：端到端加密的聊天、本地加密的离线数据、校验下载文件的哈希、在浏览器里验证签名。</p>
<p>它不能代替 HTTPS。也不要在前端保存服务端的私钥或 API 密钥，前端代码里的东西用户都能看到。</p>
<h2>常见追问</h2>
<p><strong>密钥设成不可导出，是不是就安全了？</strong></p>
<blockquote>
<p>只防住了“把密钥偷走”。页面有 XSS 时，攻击者的脚本可以直接调用这个密钥加解密，效果差不多。所以它不能代替防 XSS。</p>
</blockquote>
<p><strong>用户清除了站点数据怎么办？</strong></p>
<blockquote>
<p>存在 IndexedDB 里的密钥也会被清掉，加密的数据就再也解不开了。所以要提前设计备份，或者能从服务端重新同步的流程。</p>
</blockquote>`};export{e as default};