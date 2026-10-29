var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>页面在 <code>app.example.com</code>，接口在 <code>api.example.com</code>，这是跨源请求。<code>fetch</code> 默认的 <code>credentials</code> 是 <code>&#x27;same-origin&#x27;</code>，跨源时不带 Cookie，要显式设成 <code>&#x27;include&#x27;</code>；<code>XMLHttpRequest</code> 则是设 <code>withCredentials = true</code>。</p>
<p>服务端也要配合。它必须返回 <code>Access-Control-Allow-Credentials: true</code>，并且 <code>Access-Control-Allow-Origin</code> 要写具体的源，不能是 <code>*</code>。同样，<code>Allow-Headers</code>、<code>Allow-Methods</code>、<code>Expose-Headers</code> 在带凭据时也都不能用 <code>*</code>。通常的做法是按白名单回显请求的 Origin，再加上 <code>Vary: Origin</code>。</p>
<p>带不带凭据本身不影响要不要预检，是否预检仍然看请求方法、请求头和 Content-Type。</p>
<p>要注意，CORS 只决定页面能不能读到响应，Cookie 能不能发出去是另一回事，取决于 SameSite、Secure 和浏览器对第三方 Cookie 的策略。</p>
</blockquote>
<h2>前后端各要写什么</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> response = <span class="hljs-keyword">await</span> <span class="hljs-title function_">fetch</span>(<span class="hljs-string">&#x27;https://api.example.com/profile&#x27;</span>, {
  <span class="hljs-attr">credentials</span>: <span class="hljs-string">&#x27;include&#x27;</span>,
});
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">http</div><pre><code class="hljs language-http">Access-Control-Allow-Origin: https://app.example.com
Access-Control-Allow-Credentials: true
Vary: Origin
</code></pre></div>
<p>为什么要加 <code>Vary: Origin</code>？因为服务端是按请求的 Origin 回显的，不同来源拿到的响应头不一样。不加的话，缓存可能把给 A 网站的响应发给 B 网站，B 就读不了，或者反过来。</p>
<p>如果请求需要预检，预检响应也要带上这两个头：</p>
<div class="not-prose code-block"><div class="code-language">http</div><pre><code class="hljs language-http">Access-Control-Allow-Origin: https://app.example.com
Access-Control-Allow-Credentials: true
Access-Control-Allow-Methods: PUT
Access-Control-Allow-Headers: content-type, x-csrf-token
</code></pre></div>
<h2>CORS 配好了，Cookie 为什么还是没带上</h2>
<p>这是最常见的困惑。原因是 CORS 管的是“读响应”，而 Cookie 发不发由另一套规则决定。</p>
<table><thead><tr><th>原因</th><th>说明</th></tr></thead><tbody><tr><td>SameSite</td><td><code>app.example.com</code> 调 <code>api.example.com</code> 是同站，<code>Lax</code> 可以带；调 <code>api.other.com</code> 是跨站，需要 <code>SameSite=None; Secure</code></td></tr><tr><td>第三方 Cookie 被浏览器限制</td><td>跨站时 Safari 默认阻止，Firefox 按顶层站点分区，Chrome 用户可能手动屏蔽</td></tr><tr><td>Cookie 的 Domain、Path 不匹配</td><td>检查 Application 面板中 Cookie 的属性</td></tr><tr><td>非 HTTPS</td><td><code>Secure</code> Cookie 只在 HTTPS 发送</td></tr></tbody></table>
<p>最稳妥的办法是让 API 和页面同站，比如都放在 <code>example.com</code> 下，或者通过同源的反向代理访问 API，这样就绕开了第三方 Cookie 的问题。</p>
<h2>配置不当会有什么风险</h2>
<p>最危险的是不加白名单，收到什么 Origin 就回显什么，同时又允许凭据。这样任何网站都能以用户的身份读取接口数据。</p>
<p>白名单要用完整的源精确匹配。不要用 <code>endsWith(&#x27;example.com&#x27;)</code>，因为 <code>evilexample.com</code> 也是以 <code>example.com</code> 结尾的。<code>Origin: null</code> 可能来自沙箱 iframe 或本地文件，攻击者很容易构造出来，不要放进白名单。</p>
<p>最后，CORS 通过不等于请求合法。CORS 是浏览器保护用户的机制，修改操作仍然需要 CSRF 防护和服务端鉴权。</p>
<h2>常见追问</h2>
<p><strong>为什么预检请求不带 Cookie？</strong></p>
<blockquote>
<p>规范规定预检请求永远不带凭据。所以预检接口不能要求登录，否则预检就过不去。</p>
</blockquote>
<p><strong>用 <code>Authorization</code> 头代替 Cookie 呢？</strong></p>
<blockquote>
<p>它是标准请求头，但不在 CORS 的安全列表里，所以会触发预检，需要在 <code>Allow-Headers</code> 里列出来。好处是它不受 SameSite 影响，要不要带完全由前端代码决定。</p>
</blockquote>`};export{e as default};