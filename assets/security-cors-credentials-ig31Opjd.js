var e={answerHtml:`<h2>简答</h2>
<ul>
<li><code>fetch</code> 默认 <code>credentials: &#x27;same-origin&#x27;</code>，跨源时要显式设为 <code>&#x27;include&#x27;</code>；<code>XMLHttpRequest</code> 用 <code>withCredentials = true</code>。</li>
<li>携带凭据时，<code>Access-Control-Allow-Origin</code>、<code>Allow-Headers</code>、<code>Allow-Methods</code>、<code>Expose-Headers</code> 都不能用 <code>*</code>，必须写具体值。</li>
<li>服务端还要返回 <code>Access-Control-Allow-Credentials: true</code>，按白名单回显 Origin 并加 <code>Vary: Origin</code>。</li>
<li>凭据本身不触发预检，是否预检仍看方法、请求头和 Content-Type。</li>
<li>CORS 只决定能否读取响应；Cookie 能否发出取决于 SameSite、Secure 和浏览器对第三方 Cookie 的策略。</li>
</ul>
<h2>示例</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> response = <span class="hljs-keyword">await</span> <span class="hljs-title function_">fetch</span>(<span class="hljs-string">&#x27;https://api.example.com/profile&#x27;</span>, {
  <span class="hljs-attr">credentials</span>: <span class="hljs-string">&#x27;include&#x27;</span>,
});
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">http</div><pre><code class="hljs language-http">Access-Control-Allow-Origin: https://app.example.com
Access-Control-Allow-Credentials: true
Vary: Origin
</code></pre></div>
<p>有预检时，预检响应同样要带这两个头：</p>
<div class="not-prose code-block"><div class="code-language">http</div><pre><code class="hljs language-http">Access-Control-Allow-Origin: https://app.example.com
Access-Control-Allow-Credentials: true
Access-Control-Allow-Methods: PUT
Access-Control-Allow-Headers: content-type, x-csrf-token
</code></pre></div>
<h2>Cookie 为什么还是没带上</h2>
<table><thead><tr><th>原因</th><th>说明</th></tr></thead><tbody><tr><td>SameSite</td><td><code>app.example.com</code> 调 <code>api.example.com</code> 是同站，<code>Lax</code> 可以带；调 <code>api.other.com</code> 是跨站，需要 <code>SameSite=None; Secure</code></td></tr><tr><td>第三方 Cookie 被浏览器限制</td><td>跨站时 Safari 默认阻止，Firefox 按顶层站点分区，Chrome 用户可能手动屏蔽</td></tr><tr><td>Cookie 的 Domain、Path 不匹配</td><td>检查 Application 面板中 Cookie 的属性</td></tr><tr><td>非 HTTPS</td><td><code>Secure</code> Cookie 只在 HTTPS 发送</td></tr></tbody></table>
<p>最稳妥的做法是让 API 和页面同站（例如都在 <code>example.com</code> 下），或者通过同源的反向代理访问 API。</p>
<h2>安全风险</h2>
<ul>
<li>不加白名单、直接回显任意 Origin 并允许凭据，等于让任何网站都能以用户身份读取接口数据。</li>
<li>白名单用完整的源精确匹配，不要用 <code>endsWith(&#x27;example.com&#x27;)</code>，<code>evilexample.com</code> 也能匹配。</li>
<li><code>Origin: null</code> 可能来自沙箱 iframe 或本地文件，不要放进白名单。</li>
<li>CORS 通过不等于请求合法，修改操作还需要 CSRF 防护和服务端鉴权。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li>为什么预检请求不带 Cookie？规范规定预检请求永远不带凭据，所以预检接口不能要求登录。</li>
<li>用 <code>Authorization</code> 头代替 Cookie 呢？它是标准请求头，但不在 CORS 安全列表中，会触发预检，需要在 <code>Allow-Headers</code> 中列出，不受 SameSite 影响。</li>
</ul>`};export{e as default};