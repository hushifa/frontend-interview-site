var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>XSS 是攻击者想办法让自己的脚本在你的页面里跑起来，比如在评论里塞一段 <code>&lt;img src=x onerror=...&gt;</code>，别的用户打开评论区，这段脚本就以你网站的身份执行。</p>
<p>它危险在于脚本跑在你自己的源下，同源策略管不住它，能读页面内容、以用户身份发请求、读没设 <code>HttpOnly</code> 的 Cookie。恶意内容按来源分三种：存进数据库的存储型，来自 URL 参数的反射型，以及前端代码自己把可控数据写进 <code>innerHTML</code> 这类接口的 DOM 型。</p>
<p>防范的核心是默认把用户输入当文本输出，必须渲染 HTML 时先用 DOMPurify 这类库净化，链接地址只允许 <code>http:</code> 和 <code>https:</code>。在这之上再加 CSP 限制哪些脚本能执行，会话 Cookie 设 <code>HttpOnly</code>，即使注入成功也能减轻损失。</p>
<p>常和它一起问的是 CSRF。CSRF 的代码在别的网站上，读不到你的页面，只能借浏览器自动带的 Cookie 盲发请求。要注意，一旦有 XSS，CSRF 防护基本就失效了，因为恶意脚本可以先读到令牌再发请求。</p>
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
<h2>和 CSRF 有什么区别</h2>
<p>CSRF 是用户登录着你的网站时，又打开了一个恶意网站，那个网站放一个自动提交的表单，让浏览器带着用户的 Cookie 去调你的接口。两者最大的区别是攻击代码在哪里运行：XSS 的脚本跑在你的页面里，什么都能读；CSRF 的代码在别的网站上，读不到你的页面和响应，只能利用浏览器自动带 Cookie 这一点“盲发”请求。所以防 CSRF 的思路是让跨站请求不带 Cookie（<code>SameSite</code>），或者让服务端认出请求不是自己页面发的（<code>Origin</code> 校验、CSRF 令牌），具体做法和 <code>SameSite</code> 拦不住同站子域名的问题见<a href="/questions/security-csrf-double-submit/">《Double Submit Cookie 能怎样防御 CSRF？》</a>。</p>
<h2>常见追问</h2>
<p><strong>令牌存在 <code>localStorage</code> 里，和 XSS 有什么关系？</strong></p>
<blockquote>
<p><code>localStorage</code> 里的东西浏览器不会自动带上，所以用它存令牌、放进请求头里发，CSRF 用不了。可是页面里的任何脚本都能读 <code>localStorage</code>，一旦有 XSS，令牌可以直接被读走。<code>HttpOnly</code> 的 Cookie 脚本读不到，但仍挡不住恶意脚本直接在页面里以用户身份发请求。</p>
</blockquote>
<p><strong>只在前端过滤输入够不够？</strong></p>
<blockquote>
<p>不够。攻击者可以绕过页面直接调接口，把恶意内容存进数据库。所以输出时按场景转义或净化才是关键，服务端保存和展示前也要处理，前端过滤只是改善体验。</p>
</blockquote>`};export{e as default};