var e={answerHtml:`<h2>简答</h2>
<ul>
<li>XSS：攻击者的代码在你的源下运行，同源策略对它无效，能读 DOM、发请求、读非 HttpOnly 的 Cookie。</li>
<li>CSRF：攻击代码在别的网站上，读不到你的页面，只能&quot;盲发&quot;请求，依赖浏览器自动带上用户的 Cookie。</li>
<li>防 XSS：默认用文本方式输出（<code>textContent</code>、框架的插值），富文本用 DOMPurify 这类库净化，再加 CSP 和 Trusted Types 兜底。</li>
<li>防 CSRF：会话 Cookie 设 <code>SameSite=Lax</code> 或 <code>Strict</code>，修改操作校验 CSRF 令牌或 <code>Origin</code>、<code>Sec-Fetch-Site</code> 请求头，<code>GET</code> 不做修改。</li>
<li>存在 XSS 时 CSRF 防护基本失效，因为恶意脚本可以先读到令牌再发请求。</li>
</ul>
<h2>XSS 的三种类型</h2>
<table><thead><tr><th>类型</th><th>恶意内容从哪来</th><th>例子</th></tr></thead><tbody><tr><td>存储型</td><td>存在数据库里，展示给其他用户</td><td>评论里写入 <code>&lt;img src=x onerror=...&gt;</code></td></tr><tr><td>反射型</td><td>URL 参数，服务端原样输出</td><td>搜索页直接输出 <code>?q=</code> 的值</td></tr><tr><td>DOM 型</td><td>前端代码把可控数据写进危险接口</td><td><code>el.innerHTML = location.hash.slice(1)</code></td></tr></tbody></table>
<h2>防 XSS</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// 安全：按文本处理</span>
comment.<span class="hljs-property">textContent</span> = userInput;

<span class="hljs-comment">// 必须渲染 HTML 时先净化</span>
<span class="hljs-keyword">import</span> <span class="hljs-title class_">DOMPurify</span> <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;dompurify&#x27;</span>;
container.<span class="hljs-property">innerHTML</span> = <span class="hljs-title class_">DOMPurify</span>.<span class="hljs-title function_">sanitize</span>(userHtml);
</code></pre></div>
<ul>
<li>框架默认转义插值，危险在逃生口：React 的 <code>dangerouslySetInnerHTML</code>、Vue 的 <code>v-html</code>。</li>
<li><code>href</code> 也是入口：<code>javascript:</code> URL 会执行脚本，链接地址要校验协议只允许 <code>http:</code>、<code>https:</code>。</li>
<li>CSP 限制脚本来源，即使注入成功也不能执行，见《CSP 的 nonce、hash 与 Report-Only 如何使用？》。</li>
<li>会话 Cookie 设 <code>HttpOnly</code>，减少脚本直接读取令牌，但不能阻止脚本在页面里以用户身份发请求。</li>
</ul>
<h2>防 CSRF</h2>
<div class="not-prose code-block"><div class="code-language">http</div><pre><code class="hljs language-http">Set-Cookie: __Host-session=abc; Secure; HttpOnly; SameSite=Lax; Path=/
</code></pre></div>
<ul>
<li><code>SameSite=Lax</code> 时跨站的 <code>POST</code>、<code>fetch</code> 请求不带 Cookie，只有顶层导航的 <code>GET</code> 会带上。</li>
<li>服务端对修改操作检查 <code>Origin</code> 是否是自己的站点，或检查 <code>Sec-Fetch-Site</code> 是否为 <code>same-origin</code>。</li>
<li>需要更强保证或兼容旧浏览器时使用 CSRF 令牌，见《Double Submit Cookie 能怎样防御 CSRF？》。</li>
<li>同站不等于同源：<code>evil.example.com</code> 和 <code>app.example.com</code> 是同站，SameSite 拦不住来自子域名的请求。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li>用 <code>localStorage</code> 存令牌、请求头携带，是不是就没有 CSRF 了？是的，浏览器不会自动带上它；但一旦有 XSS，令牌会被直接读走。</li>
<li>CORS 能防 CSRF 吗？不能。简单请求可以跨源发出，CORS 只限制读取响应。</li>
</ul>`};export{e as default};