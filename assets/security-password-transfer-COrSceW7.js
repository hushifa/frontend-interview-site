var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>用户在登录框输入密码，点登录后，密码通过 HTTPS 发给服务端，服务端把它和数据库里存的哈希值比对。传输这一段由 TLS 保护，OWASP 写明 TLS 提供机密性（别人读不到）和完整性（别人改不了，也不能重放截获的请求）。</p>
<p>有人会想在前端先把密码 MD5 或 SHA-256 一下再发。这样做替代不了 HTTPS：服务端比对的就是这个哈希值，它成了新的“密码”，被截获以后攻击者直接拿去发请求一样能登录。</p>
<p>真正决定密码安全的是服务端怎么存。OWASP 要求不能明文存，要用 Argon2id、bcrypt 或 PBKDF2 这类故意算得很慢的哈希，并给每个密码加一个随机盐，这样数据库泄露后攻击者也很难批量猜出原密码。MD5、SHA-256 算得太快，不适合存密码；可逆加密也不行，因为拿到密钥就能还原。</p>
<p>前端能做的是配合：页面全站 HTTPS，密码框用正确的 <code>autocomplete</code> 值方便密码管理器，不限制特殊字符、允许长密码，登录失败只提示“用户名或密码错误”。</p>
</blockquote>
<h2>HTTPS 已经保护了传输</h2>
<p>OWASP 的 TLS 速查表列出 TLS 正确使用时的保障：机密性，攻击者读不到流量内容；完整性，攻击者不能篡改流量，也不能把截获的请求重放给服务器。所以“密码在路上被人看到”这件事，只要全站 HTTPS 并且证书校验正常，就已经解决了。</p>
<p>OWASP 也提醒，如果客户端接受了攻击者的证书，攻击者就能读到发往这个端点的数据。这种情况下前端多加一层处理也没用，因为能当中间人的人同样能替换下发的脚本。更完整的讨论见<a href="/questions/security-request-signing/">《用了 HTTPS 还要在前端加密吗？接口加签和防重放怎样设计？》</a>。</p>
<h2>前端哈希为什么替代不了 HTTPS</h2>
<p>下面用一个模拟函数代替真实哈希，只为说明流程。服务端存的是“前端哈希值”的样子，登录时比对客户端发来的值。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">fakeHash</span>(<span class="hljs-params">text</span>) {
  <span class="hljs-keyword">return</span> <span class="hljs-string">&#x27;h(&#x27;</span> + text + <span class="hljs-string">&#x27;)&#x27;</span>;
}

<span class="hljs-keyword">const</span> stored = <span class="hljs-title function_">fakeHash</span>(<span class="hljs-string">&#x27;secret123&#x27;</span>);

<span class="hljs-keyword">function</span> <span class="hljs-title function_">login</span>(<span class="hljs-params">received</span>) {
  <span class="hljs-keyword">return</span> received === stored ? <span class="hljs-string">&#x27;登录成功&#x27;</span> : <span class="hljs-string">&#x27;登录失败&#x27;</span>;
}

<span class="hljs-keyword">const</span> sentByBrowser = <span class="hljs-title function_">fakeHash</span>(<span class="hljs-string">&#x27;secret123&#x27;</span>);
<span class="hljs-keyword">const</span> capturedByAttacker = sentByBrowser;

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">login</span>(sentByBrowser)); <span class="hljs-comment">// 登录成功</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">login</span>(capturedByAttacker)); <span class="hljs-comment">// 登录成功</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">login</span>(<span class="hljs-string">&#x27;secret123&#x27;</span>)); <span class="hljs-comment">// 登录失败</span>
</code></pre></div>
<p>攻击者不知道原密码 <code>secret123</code>，可是他截获的哈希值照样登录成功。原因是服务端只认收到的那个字符串，前端哈希后的结果就是实际意义上的密码。前端哈希最多能避免原始密码明文出现在请求里，对“别人拿到请求就能登录”毫无帮助，所以传输安全仍然要靠 HTTPS。</p>
<h2>服务端应该怎样存密码</h2>
<p>OWASP 密码存储速查表的第一条是：密码永远不能明文存储，要用强的慢哈希算法，比如 Argon2id、bcrypt 或 PBKDF2。哈希是单向的，没法从哈希值“解密”出原文，所以适合做密码校验。加密是双向的，拿到密钥就能还原明文，适合存地址这类需要展示的数据，不适合存密码。</p>
<p>为什么要“慢”？因为数据库泄露后，攻击者会拿常见密码一个个去算哈希比对。SHA-256 这类快速哈希一秒能算海量次，OWASP 明确说它们不适合存密码。慢哈希故意让每次计算都消耗时间或内存，把批量猜测的成本拉高。</p>
<p>盐是给每个密码单独生成的随机值，和密码一起参与哈希。OWASP 要求每个密码一个唯一的盐，这样两个用户密码相同，存下来的哈希也不同，攻击者也没法用提前算好的彩虹表。大多数主流库会自动生成和管理盐，不需要自己处理。</p>
<p>OWASP 给出的最低参数：Argon2id 使用 19 MiB 内存、迭代 2 次、并行度 1；旧系统使用 bcrypt 时工作因子不低于 10，并且密码长度限制在 72 字节，因为多数 bcrypt 实现的输入上限就是 72 字节；需要 FIPS-140 合规时用 PBKDF2-HMAC-SHA256，迭代 600,000 次以上。</p>
<h2>前端在密码上能做什么</h2>
<p>第一是全站 HTTPS，登录页和提交接口都不能走 HTTP。</p>
<p>第二是让密码管理器正常工作。MDN 写明，<code>autocomplete=&quot;new-password&quot;</code> 用于注册和修改密码时的“新密码”“确认新密码”输入框，和输入当前密码的框区分开，当前密码用 <code>current-password</code>。见<a href="/questions/html-autocomplete/">《HTML autocomplete 属性怎样帮助表单体验和隐私？》</a>。</p>
<p>第三是不要乱加密码规则。OWASP 认证速查表建议允许所有字符，包括 Unicode 和空格，不要强制要求大小写、数字、特殊字符这类组合规则；最大长度至少允许 64 个字符，方便用户使用长短语。</p>
<p>第四是错误提示保持通用。OWASP 要求登录、重置密码等功能无论账号是否存在都返回同样的提示，防止攻击者靠提示差异判断哪些用户名存在。</p>
<h2>常见追问</h2>
<p><strong>登录密码用 RSA 在前端加密有没有用？</strong></p>
<blockquote>
<p>和前端哈希是同一个问题。公钥是公开下发的，攻击者截获密文后直接重放就能登录；页面被注入恶意脚本时，脚本在加密前就能读到输入框里的明文。传输安全靠 HTTPS，存储安全靠服务端慢哈希，前端 RSA 两件事都替代不了。</p>
</blockquote>
<p><strong>为什么 bcrypt 要限制 72 字节？</strong></p>
<blockquote>
<p>OWASP 写明，多数 bcrypt 实现的输入上限是 72 字节，所以用 bcrypt 时要把密码最大长度限制在 72 字节以内。这个限制按字节算，中文字符在 UTF-8 下一个字占 3 个字节，同样的字数占用更多。新系统 OWASP 首选 Argon2id。</p>
</blockquote>`};export{e as default};