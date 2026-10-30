var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>用户登录成功后，服务器要让浏览器之后的请求都能被认出来，常见有两种做法。Session 方案是服务器把“这个用户已登录”记在自己这边，生成一个随机的会话 ID，通过 <code>Set-Cookie</code> 交给浏览器，之后浏览器每次请求自动带上这个 Cookie，服务器拿 ID 去查会话。JWT 方案是服务器把用户 ID、过期时间这些信息签名后整个交给客户端，客户端每次请求带上它，服务器只要验证签名就知道是谁，不用查存储。</p>
<p>两者的区别在状态放在哪里。Session 的状态在服务端，想让某个用户下线，删掉会话就立即生效，可是多台服务器要共享会话存储。JWT 的状态在 Token 自己身上，服务端不用存，扩展方便，可是签发以后到过期之前一直有效，想提前作废就得额外维护黑名单。</p>
<p>Token 存在哪里，要在 XSS 和 CSRF 之间取舍。存在 <code>localStorage</code>，页面上任何脚本都能读到，一旦有 XSS 就会被偷走。存在设了 <code>HttpOnly</code> 的 Cookie 里，脚本读不到，可是浏览器会自动带上，要用 <code>SameSite</code> 和 CSRF Token 防跨站请求。比较常见的做法是：有效期很短的 Access Token 放在内存里，用请求头发送；有效期长的 Refresh Token 放在 <code>HttpOnly; Secure; SameSite</code> 的 Cookie 里，只用来换新的 Access Token。</p>
<p>要注意，JWT 默认只签名不加密，中间那段 Base64URL 编码的内容谁都能解出来，不能放密码这类敏感信息。</p>
</blockquote>
<h2>JWT 长什么样</h2>
<p>一个 JWT 是用两个点隔开的三段：</p>
<div class="not-prose code-block"><div class="code-language">text</div><pre><code class="hljs language-text">eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjMiLCJleHAiOjE3OTk5OTk5OTl9.签名
</code></pre></div>
<p>第一段是头部，说明签名算法；第二段是载荷，放用户 ID（<code>sub</code>）、过期时间（<code>exp</code>）这些声明；第三段是用密钥对前两段算出的签名。前两段只是 Base64URL 编码，可以直接解码：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> payload = <span class="hljs-string">&#x27;eyJzdWIiOiIxMjMiLCJleHAiOjE3OTk5OTk5OTl9&#x27;</span>;
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">JSON</span>.<span class="hljs-title function_">parse</span>(<span class="hljs-title function_">atob</span>(payload))); <span class="hljs-comment">// { sub: &#x27;123&#x27;, exp: 1799999999 }</span>
</code></pre></div>
<p>既然谁都能解码，那别人改了载荷怎么办？改了以后签名就对不上了。服务器收到 Token 会用自己的密钥重新计算签名，跟第三段比较，不一致就拒绝。所以 JWT 保证的是内容没被篡改，而不是内容保密。</p>
<p>前端可以解码载荷读取用户名、过期时间来展示界面，但不能据此判断用户有没有权限，因为前端拿不到密钥，也就没法验证签名。权限判断必须在服务端做。</p>
<h2>为什么 JWT 难以提前作废</h2>
<p>用户点击“退出登录”或者修改了密码，按理说之前的 Token 都应该失效。Session 方案里删掉服务端的会话就行了。</p>
<p>可 JWT 的设计就是服务端不存状态，验签通过就认。只要 <code>exp</code> 还没到，这个 Token 在任何人手里都能用。要让它提前失效，就得在服务端维护一份黑名单，每次请求都查一下，这又回到了有状态的做法。</p>
<p>所以实际项目里，JWT 的有效期通常设得很短，比如十几分钟。就算泄露了，能被利用的时间也有限。过期后用 Refresh Token 换一个新的，用户不用重新登录；服务端要让用户下线时，作废 Refresh Token 就行，旧的 Access Token 很快也会过期。</p>
<h2>Token 存在哪里</h2>
<p>存在 <code>localStorage</code> 的问题是 XSS。页面上只要有一段恶意脚本能执行，它就能 <code>localStorage.getItem(&#x27;token&#x27;)</code> 拿走 Token，发到攻击者的服务器上，之后攻击者在自己的电脑上就能冒充用户。</p>
<p>存在 <code>HttpOnly</code> Cookie 里，脚本读不到，XSS 偷不走。可是 Cookie 会被浏览器自动带上，攻击者在别的网站上诱导用户发请求，请求里就带着用户的 Cookie，这是 CSRF。所以要配合 <code>SameSite=Lax</code> 或 <code>Strict</code>，必要时再加 CSRF Token，详见<a href="/questions/security-csrf-double-submit/">《Double Submit Cookie 能怎样防御 CSRF？》</a>。</p>
<p>把 Access Token 放在内存里，比如一个 JS 变量，刷新页面就没了，XSS 想拿也得在页面运行时才能拿到。刷新后靠 Cookie 里的 Refresh Token 重新换一个。这种组合让两种攻击都更难得手，但它不能替代防 XSS：脚本能在页面里运行，就能直接以用户身份发请求，不需要把 Token 偷走。</p>
<h2>常见追问</h2>
<p><strong>Access Token 过期了，前端怎么无感刷新？</strong></p>
<blockquote>
<p>在请求拦截层统一处理：接口返回 401 时，先调用刷新接口拿新的 Access Token，再重发原来的请求。要注意多个请求同时 401 的情况，应该只发一次刷新请求，其余请求等它完成后再重试，否则会并发刷新好几次。刷新也失败了，就跳转登录页。</p>
</blockquote>
<p><strong>Session 方案在多台服务器上怎么办？</strong></p>
<blockquote>
<p>把会话存到所有服务器都能访问的地方，比如 Redis，任何一台服务器拿到会话 ID 都能查到。也可以让负载均衡按用户固定分到同一台服务器，但那台服务器挂了会话就没了，一般不推荐。</p>
</blockquote>
<p><strong>单点登录（SSO）是怎么做的？</strong></p>
<blockquote>
<p>多个系统共用一个认证中心。用户访问系统 A 时被重定向到认证中心登录，认证中心在自己的域名下记住登录状态，再带着一次性的授权码跳回 A。之后访问系统 B，同样跳到认证中心，发现已经登录过，直接发授权码跳回 B，用户不用再输密码。现在标准化的做法是 OpenID Connect，见<a href="/questions/security-oidc/">《OpenID Connect 和 OAuth 2.0 分别解决什么问题？》</a>。</p>
</blockquote>`};export{e as default};