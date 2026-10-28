var e={answerHtml:`<h2>简答</h2>
<ul>
<li>同源要求协议、主机、端口完全一致。跨源请求通常能发出去，被拦住的是脚本读取响应。</li>
<li>服务器返回 <code>Access-Control-Allow-Origin</code> 等响应头，浏览器据此决定是否把响应交给脚本，所以必须由服务端配置。</li>
<li>非简单请求（如 <code>PUT</code>、<code>Content-Type: application/json</code>、自定义请求头）会先发 <code>OPTIONS</code> 预检，预检通过才发真实请求。</li>
<li>CORS 不是鉴权。curl 或服务端脚本不受它约束，接口仍要自己校验身份和权限。</li>
</ul>
<h2>为什么要同源策略</h2>
<p>浏览器会自动带上 Cookie。如果任意网站的脚本都能读取其他站点的响应，恶意页面就能以用户身份读取邮箱、银行页面的内容。同源策略限制的是&quot;读&quot;，CORS 是在这个限制上按服务器意愿开口子。</p>
<h2>简单请求与预检</h2>
<p>简单请求需同时满足：方法是 <code>GET</code>、<code>HEAD</code> 或 <code>POST</code>；只用浏览器允许的请求头；<code>Content-Type</code> 只能是 <code>text/plain</code>、<code>multipart/form-data</code> 或 <code>application/x-www-form-urlencoded</code>。</p>
<p>不满足时浏览器先发：</p>
<div class="not-prose code-block"><div class="code-language">http</div><pre><code class="hljs language-http">OPTIONS /api/items HTTP/1.1
Origin: https://app.example
Access-Control-Request-Method: PUT
Access-Control-Request-Headers: content-type
</code></pre></div>
<p>服务器回应：</p>
<div class="not-prose code-block"><div class="code-language">http</div><pre><code class="hljs language-http">Access-Control-Allow-Origin: https://app.example
Access-Control-Allow-Methods: GET, PUT
Access-Control-Allow-Headers: content-type
Access-Control-Max-Age: 600
Vary: Origin
</code></pre></div>
<p><code>Access-Control-Max-Age</code> 让浏览器缓存预检结果；按请求回显 Origin 时要加 <code>Vary: Origin</code>，避免 CDN 把一个来源的响应头缓存给另一个来源。</p>
<h2>排查要点</h2>
<ul>
<li>控制台报 CORS 错误时先看 Network：预检返回 404/401/500 也会表现为 CORS 失败。</li>
<li>脚本读不到自定义响应头时，服务器要用 <code>Access-Control-Expose-Headers</code> 暴露。</li>
<li>携带 Cookie 的跨源请求有额外限制，见《CORS 携带凭据时有哪些限制？》。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li>简单请求被 CORS 拦截，服务器有没有执行？执行了，只是脚本拿不到结果。所以有副作用的接口不能靠 CORS 防跨站伪造，要靠 CSRF 防护。</li>
<li>开发环境怎么绕过？用开发服务器代理把请求变成同源，生产环境再正确配置响应头。</li>
<li><code>mode: &#x27;no-cors&#x27;</code> 有什么用？只能发简单请求，拿到的是不可读的不透明响应，适合打点等不关心结果的场景。</li>
</ul>`};export{e as default};