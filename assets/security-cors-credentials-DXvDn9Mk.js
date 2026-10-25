var e={answerHtml:`<p>以 <code>https://app.example.com</code> 调用 <code>https://api.example.com/profile</code> 为例：两个地址不同源，浏览器需要检查 CORS；但它们在通常的 HTTPS 配置下属于同站。这时要分别判断两件事：请求是否携带登录 Cookie，以及响应是否允许被前端 JavaScript 读取。</p>
<h3>前端声明“希望携带”，服务端声明“允许读取”</h3>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> response = <span class="hljs-keyword">await</span> <span class="hljs-title function_">fetch</span>(<span class="hljs-string">&#x27;https://api.example.com/profile&#x27;</span>, {
  <span class="hljs-attr">credentials</span>: <span class="hljs-string">&#x27;include&#x27;</span>,
});

<span class="hljs-keyword">if</span> (!response.<span class="hljs-property">ok</span>) <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">\`读取资料失败：<span class="hljs-subst">\${response.status}</span>\`</span>);
<span class="hljs-keyword">const</span> profile = <span class="hljs-keyword">await</span> response.<span class="hljs-title function_">json</span>();
</code></pre></div>
<p>fetch 默认 credentials 为 <code>same-origin</code>，上面的跨源调用若需要 Cookie，就要显式设置 include。它不是强制浏览器无视 Cookie 规则发送凭证，只是允许在其他条件满足时携带。</p>
<p>API 的实际响应至少需要匹配如下 CORS 许可：</p>
<div class="not-prose code-block"><div class="code-language">http</div><pre><code class="hljs language-http">Access-Control-Allow-Origin: https://app.example.com
Access-Control-Allow-Credentials: true
Vary: Origin
</code></pre></div>
<p>Allow-Origin 是一个具体来源，不是带路径的 URL，也不是逗号分隔的多个地址。若服务端根据请求 Origin 动态返回它，应先匹配可信白名单，再返回对应值；Vary: Origin 用于告知缓存不同 Origin 的响应可能不同。</p>
<p>对于 include 模式，不能使用 <code>Access-Control-Allow-Origin: *</code>，即使当次浏览器恰好没有可发送的 Cookie，也不能靠这一点绕过规则。Allow-Credentials 的有效许可值是小写 <code>true</code>，不是 <code>*</code>。</p>
<p>随意回显所有 Origin 并开启凭据，会让攻击者的网站有机会读取用户的受保护响应。设置了 CORS 响应头不代表配置就是安全的，关键在于到底授权了谁。</p>
<h3>哪些请求还需要先预检</h3>
<p>携带 Cookie 本身不必然触发预检。例如没有额外非安全列出请求头的 GET，可能直接发送。若请求使用 JSON Content-Type、自定义头或 PUT 等方法，通常先发送 OPTIONS：</p>
<div class="not-prose code-block"><div class="code-language">http</div><pre><code class="hljs language-http">OPTIONS /profile HTTP/1.1
Origin: https://app.example.com
Access-Control-Request-Method: PUT
Access-Control-Request-Headers: content-type,x-csrf-token
</code></pre></div>
<p>服务端可以根据允许的接口返回：</p>
<div class="not-prose code-block"><div class="code-language">http</div><pre><code class="hljs language-http">Access-Control-Allow-Origin: https://app.example.com
Access-Control-Allow-Credentials: true
Access-Control-Allow-Methods: PUT
Access-Control-Allow-Headers: Content-Type, X-CSRF-Token
Vary: Origin
</code></pre></div>
<p>按 Fetch 规则，预检不携带会话 Cookie，不能要求 OPTIONS 先通过普通登录 Cookie 校验，否则真实请求可能根本发不出去。预检只是询问许可；真正的 PUT 仍必须鉴权、授权和校验 CSRF。企业 TLS 客户端证书在某些浏览器中存在特殊实现行为，不应与普通 Cookie 预检混为一谈。</p>
<p>预检通过后，实际响应仍需有对应的 Allow-Origin 和 Allow-Credentials。只给 OPTIONS 配置正确、实际接口或错误响应漏掉响应头，前端依然可能得到 CORS 错误。</p>
<p>凭据模式下，Allow-Headers、Allow-Methods 和 Expose-Headers 中的星号也不能当作通常的通配许可使用，应明确列出需要的项。若前端要读取自定义响应头，还应通过 Expose-Headers 暴露；Set-Cookie 则不能因此变成可由脚本读取的响应头。</p>
<h3>CORS 通过了，Cookie 也可能不发送</h3>
<p>Cookie 必须匹配 API 主机、路径和 Secure 等要求。真正跨站时还受 SameSite 限制，通常需要考虑 <code>SameSite=None; Secure</code>，但浏览器第三方 Cookie 限制仍可能阻止它。</p>
<p>因此，不要看到两个子域不同源，就立即认为一定要 SameSite=None；也不要看到 include，就以为被禁用的第三方 Cookie 会恢复可用。CORS、Cookie 匹配和站点判断是不同层的决策。</p>
<h3>CORS 报错不等于服务器没有执行请求</h3>
<p>需要预检的请求若预检失败，浏览器不会发送对应的实际请求。但无需预检的请求可能已经到达服务器并完成操作，只是响应不能被脚本读取。这也是 CORS 不能替代 CSRF 防护的原因。</p>
<p>调试时按顺序看：是否发出 OPTIONS、是否发出实际请求、实际请求是否带 Cookie、响应许可是否匹配、Cookie 是否被浏览器阻止。HTTP 200 只说明服务器返回了成功状态，不能证明脚本拿到了响应。改成 <code>mode: &#x27;no-cors&#x27;</code> 会得到受限制的 opaque 响应，不是让前端正常读取 API 的解决办法。</p>`};export{e as default};