var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>常有人问：登录接口的密码要不要在前端先用 MD5 或 RSA 加密一下再发？如果网站已经是 HTTPS，传输这一段本来就是加密的，OWASP 的说法是 TLS 提供机密性（别人读不到）和完整性（别人改不了、也不能把截获的请求重放给服务器）。</p>
<p>前端再加一层，防不住真正的风险。加密代码和密钥都会下载到浏览器里，用户自己、页面里的恶意脚本、拿到代码的人都能直接调用它，伪造出“合法”的密文。Vite 文档也明确说，<code>VITE_</code> 开头的环境变量会被打包进前端代码，不能放 API 密钥。</p>
<p>接口加签解决的是另一件事：在 HTTPS 之外，让服务端确认请求是持有密钥的一方发出的、参数没有被改过、而且不是旧请求的重放。做法是把方法、路径、排序后的参数、时间戳和一个随机 nonce 拼成固定格式的字符串，用密钥算 HMAC 签名。服务端用同样的规则重算，签名不一致就拒绝；时间戳超出允许窗口、或者 nonce 在窗口内出现过，也拒绝。</p>
<p>关键是密钥放在哪里。签名的价值全在于攻击者拿不到密钥，所以服务端之间调用时密钥放在服务端；浏览器里调用时，密钥只能是登录后下发给这个用户、能随时吊销的会话密钥，不能是写死在代码里、所有用户共用的固定密钥。</p>
</blockquote>
<h2>HTTPS 已经解决了什么</h2>
<p>OWASP 的 TLS 速查表列出了 TLS 正确使用时的三项保障：机密性，攻击者读不到流量内容；完整性，攻击者不能篡改流量，也不能把截获的请求重放给服务器；认证，客户端能确认连上的是真正的服务器。所以“传输途中被人看到密码”“请求在路上被改掉”这两类担心，HTTPS 已经处理了。中间人是怎样被防住的，见<a href="/questions/security-https-mitm/">《HTTPS 握手中，中间人攻击是怎样被防住的？》</a>。</p>
<p>OWASP 同时提醒，客户端接受了攻击者的证书时，攻击者就能读到数据。这种情况下前端加密也帮不上忙，因为攻击者既然能当中间人，也能把下发的加密脚本替换掉。</p>
<h2>前端加密为什么防不了</h2>
<p>问题在于前端的一切都在用户手里。加密用的算法、公钥或者对称密钥，都随 JS 下载到浏览器，打开开发者工具就能看到。用户自己想绕过限制，可以直接调用页面里的加密函数；页面里混入了恶意脚本，也能在加密之前读到明文。所以前端加密既挡不住用户，也挡不住 XSS。</p>
<p>Vite 的文档把这件事说得很具体：<code>VITE_</code> 前缀的变量在构建时打包进前端代码，不应该包含 API 密钥这类敏感信息，生产环境应该交给后端服务或者 serverless、边缘函数来保护密钥。其他构建工具的前端环境变量也是同样的道理。</p>
<h2>签名怎样防篡改和重放</h2>
<p>签名的思路是：双方约定好一个密钥和一套拼接规则，发送方把请求的关键内容拼成字符串，用密钥算出 HMAC，作为签名一起发出。HMAC 是一种带密钥的摘要，没有密钥算不出正确的值，内容改了一个字符结果就完全不同。</p>
<p>拼接规则必须是确定的。同样的参数，不管对象里的键是什么顺序，都要拼出同样的字符串，否则双方算出来的签名对不上。所以通常按键名排序后再拼接。</p>
<p>光有签名还挡不住重放：攻击者把一个完整的合法请求原样再发一遍，签名照样正确。所以签名里还要带上时间戳和 nonce。RFC 5849（OAuth 1.0）对这两个字段的解释可以直接借用：nonce 是客户端生成的唯一随机串，服务端用它判断请求以前没出现过，从而防止重放；为了不用永久保存所有 nonce，服务端可以拒绝时间戳太旧的请求，只记住时间窗口内出现过的 nonce，这要求客户端和服务端的时钟大致同步。</p>
<p>下面的例子模拟服务端的校验流程。签名函数换成了一个假的 <code>fakeHmac</code>，只为了让例子不依赖加密库就能运行，真实场景要用 HMAC-SHA256：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">canonical</span>(<span class="hljs-params">{ method, path, params, timestamp, nonce }</span>) {
  <span class="hljs-keyword">const</span> query = <span class="hljs-title class_">Object</span>.<span class="hljs-title function_">keys</span>(params)
    .<span class="hljs-title function_">sort</span>()
    .<span class="hljs-title function_">map</span>(<span class="hljs-function">(<span class="hljs-params">key</span>) =&gt;</span> key + <span class="hljs-string">&#x27;=&#x27;</span> + params[key])
    .<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;&amp;&#x27;</span>);
  <span class="hljs-keyword">return</span> [method, path, query, timestamp, nonce].<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;\\n&#x27;</span>);
}

<span class="hljs-keyword">const</span> <span class="hljs-title function_">fakeHmac</span> = (<span class="hljs-params">key, text</span>) =&gt; key + <span class="hljs-string">&#x27;:&#x27;</span> + text.<span class="hljs-property">length</span>;

<span class="hljs-keyword">function</span> <span class="hljs-title function_">createVerifier</span>(<span class="hljs-params">key, windowSeconds</span>) {
  <span class="hljs-keyword">const</span> seen = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Set</span>();
  <span class="hljs-keyword">return</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">verify</span>(<span class="hljs-params">request, now</span>) {
    <span class="hljs-keyword">if</span> (<span class="hljs-title class_">Math</span>.<span class="hljs-title function_">abs</span>(now - request.<span class="hljs-property">timestamp</span>) &gt; windowSeconds) <span class="hljs-keyword">return</span> <span class="hljs-string">&#x27;expired&#x27;</span>;
    <span class="hljs-keyword">if</span> (seen.<span class="hljs-title function_">has</span>(request.<span class="hljs-property">nonce</span>)) <span class="hljs-keyword">return</span> <span class="hljs-string">&#x27;replayed&#x27;</span>;
    <span class="hljs-keyword">if</span> (<span class="hljs-title function_">fakeHmac</span>(key, <span class="hljs-title function_">canonical</span>(request)) !== request.<span class="hljs-property">signature</span>) <span class="hljs-keyword">return</span> <span class="hljs-string">&#x27;bad-signature&#x27;</span>;
    seen.<span class="hljs-title function_">add</span>(request.<span class="hljs-property">nonce</span>);
    <span class="hljs-keyword">return</span> <span class="hljs-string">&#x27;ok&#x27;</span>;
  };
}

<span class="hljs-keyword">const</span> a = <span class="hljs-title function_">canonical</span>({ <span class="hljs-attr">method</span>: <span class="hljs-string">&#x27;POST&#x27;</span>, <span class="hljs-attr">path</span>: <span class="hljs-string">&#x27;/pay&#x27;</span>, <span class="hljs-attr">params</span>: { <span class="hljs-attr">b</span>: <span class="hljs-number">2</span>, <span class="hljs-attr">a</span>: <span class="hljs-number">1</span> }, <span class="hljs-attr">timestamp</span>: <span class="hljs-number">100</span>, <span class="hljs-attr">nonce</span>: <span class="hljs-string">&#x27;n1&#x27;</span> });
<span class="hljs-keyword">const</span> b = <span class="hljs-title function_">canonical</span>({ <span class="hljs-attr">method</span>: <span class="hljs-string">&#x27;POST&#x27;</span>, <span class="hljs-attr">path</span>: <span class="hljs-string">&#x27;/pay&#x27;</span>, <span class="hljs-attr">params</span>: { <span class="hljs-attr">a</span>: <span class="hljs-number">1</span>, <span class="hljs-attr">b</span>: <span class="hljs-number">2</span> }, <span class="hljs-attr">timestamp</span>: <span class="hljs-number">100</span>, <span class="hljs-attr">nonce</span>: <span class="hljs-string">&#x27;n1&#x27;</span> });
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(a === b ? <span class="hljs-string">&#x27;same&#x27;</span> : <span class="hljs-string">&#x27;different&#x27;</span>); <span class="hljs-comment">// same</span>

<span class="hljs-keyword">const</span> verify = <span class="hljs-title function_">createVerifier</span>(<span class="hljs-string">&#x27;k&#x27;</span>, <span class="hljs-number">300</span>);
<span class="hljs-keyword">const</span> request = { <span class="hljs-attr">method</span>: <span class="hljs-string">&#x27;POST&#x27;</span>, <span class="hljs-attr">path</span>: <span class="hljs-string">&#x27;/pay&#x27;</span>, <span class="hljs-attr">params</span>: { <span class="hljs-attr">amount</span>: <span class="hljs-number">100</span> }, <span class="hljs-attr">timestamp</span>: <span class="hljs-number">1000</span>, <span class="hljs-attr">nonce</span>: <span class="hljs-string">&#x27;n1&#x27;</span> };
request.<span class="hljs-property">signature</span> = <span class="hljs-title function_">fakeHmac</span>(<span class="hljs-string">&#x27;k&#x27;</span>, <span class="hljs-title function_">canonical</span>(request));

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">verify</span>(request, <span class="hljs-number">1010</span>)); <span class="hljs-comment">// ok</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">verify</span>(request, <span class="hljs-number">1020</span>)); <span class="hljs-comment">// replayed</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">verify</span>({ ...request, <span class="hljs-attr">nonce</span>: <span class="hljs-string">&#x27;n2&#x27;</span> }, <span class="hljs-number">2000</span>)); <span class="hljs-comment">// expired</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">verify</span>({ ...request, <span class="hljs-attr">nonce</span>: <span class="hljs-string">&#x27;n3&#x27;</span>, <span class="hljs-attr">params</span>: { <span class="hljs-attr">amount</span>: <span class="hljs-number">1000</span> } }, <span class="hljs-number">1030</span>)); <span class="hljs-comment">// bad-signature</span>
</code></pre></div>
<p>第一行说明了为什么要排序：参数对象写成 <code>{ b: 2, a: 1 }</code> 还是 <code>{ a: 1, b: 2 }</code>，排序后拼出的字符串一样，双方算的签名才对得上。</p>
<p>后面四行对应四种情况。第一次请求通过，并把 <code>n1</code> 记下来；同一个请求再发一次，nonce 已经见过，判为重放；换了 nonce 但时间戳离现在超过 300 秒，判为过期；把金额从 100 改成 1000，签名对不上。注意校验的顺序：签名通过以后才记录 nonce，否则攻击者随便发一些签名错误的请求，就能把正常请求要用的 nonce 占掉。</p>
<p>为什么时间戳也要放进签名里？如果不签，攻击者可以把旧请求的时间戳改成现在，绕过过期检查。时间戳和 nonce 都参与签名，改了任何一个，签名就不对了。</p>
<p>浏览器里生成 nonce 可以用 <code>crypto.randomUUID()</code>，MDN 说明它用密码学安全的随机数生成器生成 v4 UUID。算 HMAC 可以用 Web Crypto 的 <code>crypto.subtle.sign</code>：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">sign</span>(<span class="hljs-params">key, text</span>) {
  <span class="hljs-comment">// key 是 importKey 导入的 HMAC 密钥，算法为 HMAC + SHA-256</span>
  <span class="hljs-keyword">const</span> data = <span class="hljs-keyword">new</span> <span class="hljs-title class_">TextEncoder</span>().<span class="hljs-title function_">encode</span>(text);
  <span class="hljs-keyword">const</span> signature = <span class="hljs-keyword">await</span> crypto.<span class="hljs-property">subtle</span>.<span class="hljs-title function_">sign</span>(<span class="hljs-string">&#x27;HMAC&#x27;</span>, key, data);
  <span class="hljs-keyword">return</span> <span class="hljs-title function_">btoa</span>(<span class="hljs-title class_">String</span>.<span class="hljs-title function_">fromCharCode</span>(...<span class="hljs-keyword">new</span> <span class="hljs-title class_">Uint8Array</span>(signature)));
}

<span class="hljs-keyword">const</span> nonce = crypto.<span class="hljs-title function_">randomUUID</span>();
<span class="hljs-keyword">const</span> timestamp = <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">floor</span>(<span class="hljs-title class_">Date</span>.<span class="hljs-title function_">now</span>() / <span class="hljs-number">1000</span>);
</code></pre></div>
<h2>密钥应该放在哪里</h2>
<p>签名有用的前提是攻击者没有密钥。把一个所有用户共用的固定密钥写进前端代码，任何人都能从打包后的 JS 里找到它，然后给任意请求算出正确的签名，签名就失去了意义。混淆代码只能增加查找的时间，不能让密钥保密。</p>
<p>所以要看调用方是谁。服务端调用开放平台接口时，密钥放在服务端的环境变量或密钥管理服务里，浏览器完全接触不到。浏览器必须签名时，只能用和当前用户绑定的密钥：登录后由服务端下发，或者在浏览器里生成后把公钥登记到服务端，这样泄露了也只影响这一个用户，并且可以随时吊销。在浏览器里保存这类密钥，可以用 Web Crypto 生成不可导出的密钥，见<a href="/questions/api-web-crypto-key-management/">《Web Crypto API 如何正确管理浏览器端密钥？》</a>。</p>
<p>即使这样，签名防的也是“请求在别处被伪造或重放”，防不了用户本人。用户自己的浏览器里有自己的密钥，他总能签出自己想发的请求。所以金额、权限、库存这些规则，最终都要在服务端按业务校验，不能因为请求带了合法签名就相信里面的参数。</p>
<h2>常见追问</h2>
<p><strong>登录密码用 RSA 在前端加密一下有没有用？</strong></p>
<blockquote>
<p>在 HTTPS 下，防窃听这件事 TLS 已经做了，前端再加密不增加这方面的保护。它也防不住页面里的恶意脚本，脚本可以在加密之前读到输入框里的明文。真正要做的是全站 HTTPS，服务端用 Argon2id、bcrypt 这类专门的密码哈希算法存储密码。</p>
</blockquote>
<p><strong>nonce 要在服务端保存多久？</strong></p>
<blockquote>
<p>保存时间和时间戳窗口一样长就够了。超出窗口的请求本来就会因为过期被拒绝，没必要再记它的 nonce。RFC 5849 也是这样解释的：服务端拒绝时间戳太旧的请求，就不用无限期地保存所有 nonce。</p>
</blockquote>
<p><strong>客户端时间不准怎么办？</strong></p>
<blockquote>
<p>时间戳校验要求双方时钟大致同步。RFC 5849 提到，服务端可以提供让客户端同步时钟的方式，或者双方都和可信的时间服务同步。前端常见的做法是服务端在响应里返回当前时间，客户端记下和本地时间的差值，生成时间戳时加上这个差值。</p>
</blockquote>`};export{e as default};