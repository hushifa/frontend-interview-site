var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>XSS 是攻击者想办法让自己的脚本在你的页面里跑起来，比如在评论里塞一段 <code>&lt;img src=x onerror=...&gt;</code>。CSRF 是用户登录着你的网站时，又打开了一个恶意网站，那个网站偷偷给你的网站发请求，浏览器会自动带上用户的 Cookie。</p>
<p>两者最大的区别是攻击代码在哪里跑。XSS 的脚本跑在你自己的源下，同源策略管不住它，它能读页面、发请求、读没设 <code>HttpOnly</code> 的 Cookie。CSRF 的代码在别的网站上，读不到你的页面，只能“盲发”请求。</p>
<p>防 XSS，默认按文本输出，必须渲染 HTML 时先用 DOMPurify 这类库净化，再加 CSP 兜底。防 CSRF，会话 Cookie 设 <code>SameSite=Lax</code> 或 <code>Strict</code>，修改操作校验 CSRF 令牌或 <code>Origin</code> 请求头，<code>GET</code> 不做修改。</p>
<p>要注意，一旦有 XSS，CSRF 防护基本就失效了，因为恶意脚本可以先读到令牌再发请求。</p>
</blockquote>
<h2>XSS：攻击者的脚本跑进了你的页面</h2>
<p>浏览器有一条基本规则：不同源的页面不能互相读数据，这叫同源策略。可是 XSS 的脚本是混在你自己的页面里执行的，浏览器把它当成你的代码，所以这条规则对它不起作用。</p>
<p>恶意内容一般从三个地方来。存储型是存进数据库的，比如评论里写了 <code>&lt;img src=x onerror=...&gt;</code>，别的用户打开评论区就中招。反射型来自 URL 参数，比如搜索页把 <code>?q=</code> 的值原样输出到页面里。DOM 型完全发生在前端，比如 <code>el.innerHTML = location.hash.slice(1)</code>，前端代码自己把可控的数据写进了危险的接口。</p>
<h2>怎么防 XSS</h2>
<p>最根本的办法是把用户输入当文本，不当 HTML。只有确实要显示富文本时，才先净化再插入：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// 安全：按文本处理</span>
comment.<span class="hljs-property">textContent</span> = userInput;

<span class="hljs-comment">// 必须渲染 HTML 时先净化</span>
<span class="hljs-keyword">import</span> <span class="hljs-title class_">DOMPurify</span> <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;dompurify&#x27;</span>;
container.<span class="hljs-property">innerHTML</span> = <span class="hljs-title class_">DOMPurify</span>.<span class="hljs-title function_">sanitize</span>(userHtml);
</code></pre></div>
<p>用框架的人可能会想，React、Vue 的插值不是已经自动转义了吗？没错，危险在框架留出的逃生口，也就是 React 的 <code>dangerouslySetInnerHTML</code> 和 Vue 的 <code>v-html</code>。另外链接地址也是入口，<code>javascript:</code> 开头的 URL 点一下就会执行脚本，所以 <code>href</code> 要校验协议，只允许 <code>http:</code> 和 <code>https:</code>。</p>
<p>前面这些是第一道防线。第二道是 CSP，它限制哪些脚本能执行，就算注入成功，脚本也跑不起来，见<a href="/questions/sec-csp/">《CSP 的 nonce、hash 与 Report-Only 如何使用？》</a>。会话 Cookie 再加上 <code>HttpOnly</code>，脚本就读不走令牌。可是它挡不住脚本直接在页面里以用户身份发请求，所以只是减轻损失。</p>
<h2>CSRF：借用浏览器自动带的 Cookie</h2>
<p>CSRF 能成功，是因为浏览器发请求时会自动带上目标网站的 Cookie，不管这个请求是谁发起的。恶意网站读不到你的页面，但它可以放一个自动提交的表单，让浏览器带着用户的登录态去调你的接口。</p>
<p>所以防护的思路是：让跨站请求不带 Cookie，或者让服务端能认出请求不是自己页面发的。</p>
<div class="not-prose code-block"><div class="code-language">http</div><pre><code class="hljs language-http">Set-Cookie: __Host-session=abc; Secure; HttpOnly; SameSite=Lax; Path=/
</code></pre></div>
<p><code>SameSite=Lax</code> 的意思是，跨站的 <code>POST</code>、<code>fetch</code> 请求不带这个 Cookie，只有从别的网站点链接跳过来这种顶层 <code>GET</code> 导航才会带。所以 <code>GET</code> 接口本来就不该修改数据。</p>
<p>服务端还可以检查请求头。修改操作看 <code>Origin</code> 是不是自己的站点，或者看 <code>Sec-Fetch-Site</code> 是不是 <code>same-origin</code>。需要更强的保证或者要兼容旧浏览器时，再加 CSRF 令牌，见<a href="/questions/security-csrf-double-submit/">《Double Submit Cookie 能怎样防御 CSRF？》</a>。</p>
<h2>为什么 SameSite 拦不住子域名</h2>
<p>这里有个容易误解的地方：同站不等于同源。<code>evil.example.com</code> 和 <code>app.example.com</code> 主机名不同，不是同源，但它们属于同一个站点 <code>example.com</code>。SameSite 只看站点，所以子域名发过来的请求它拦不住。如果子域名可能被别人控制，就还需要令牌或 <code>Origin</code> 校验。</p>
<h2>常见追问</h2>
<p><strong>用 <code>localStorage</code> 存令牌、放在请求头里发，是不是就没有 CSRF 了？</strong></p>
<blockquote>
<p>是的，浏览器不会自动带上 <code>localStorage</code> 里的东西，别的网站也读不到它，所以 CSRF 用不了。可是代价是一旦有 XSS，脚本可以直接把令牌读走，风险转到了 XSS 这边。</p>
</blockquote>
<p><strong>CORS 能防 CSRF 吗？</strong></p>
<blockquote>
<p>不能。CORS 管的是跨源能不能读响应，不管能不能发请求。像普通的表单提交这类简单请求，照样能跨源发出去，服务端照样会执行。</p>
</blockquote>`};export{e as default};