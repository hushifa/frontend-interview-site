var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>页面在 <code>https://app.example</code>，脚本去请求 <code>https://api.example</code>，主机不同，这就是跨源。协议、主机、端口三者有一个不一样都算。跨源请求一般能发出去，浏览器拦住的是脚本读取响应。</p>
<p>为什么要服务端配合？因为决定权在服务器手里。服务器在响应里加上 <code>Access-Control-Allow-Origin</code> 这类头，浏览器看到自己的来源在允许范围内，才把响应交给脚本。</p>
<p>不是所有请求都直接发。用了 <code>PUT</code>、<code>Content-Type: application/json</code> 或者自定义请求头，浏览器会先发一个 <code>OPTIONS</code> 请求问一下，这叫预检，通过了才发真正的请求。</p>
<p>要注意，CORS 不是鉴权。curl 和服务端脚本根本不管 CORS，接口还是要自己校验身份和权限。</p>
</blockquote>
<h2>为什么浏览器要拦着</h2>
<p>浏览器发请求时会自动带上 Cookie。假如任何网站的脚本都能读别的站点的响应，你打开一个恶意页面，它就能用你的身份去请求邮箱、网银，再把内容读出来。</p>
<p>所以浏览器默认不让脚本读跨源响应，这条规则叫同源策略。它限制的是“读”，而 CORS 是在这个限制上，按服务器的意愿开个口子。</p>
<h2>什么时候会先发预检</h2>
<p>一个请求要同时满足下面几条，才算简单请求，可以直接发：方法是 <code>GET</code>、<code>HEAD</code> 或 <code>POST</code>；只用浏览器允许的请求头；<code>Content-Type</code> 只能是 <code>text/plain</code>、<code>multipart/form-data</code> 或 <code>application/x-www-form-urlencoded</code>。</p>
<p>不满足的话，浏览器先发一个预检：</p>
<div class="not-prose code-block"><div class="code-language">http</div><pre><code class="hljs language-http">OPTIONS /api/items HTTP/1.1
Origin: https://app.example
Access-Control-Request-Method: PUT
Access-Control-Request-Headers: content-type
</code></pre></div>
<p>服务器要这样回：</p>
<div class="not-prose code-block"><div class="code-language">http</div><pre><code class="hljs language-http">Access-Control-Allow-Origin: https://app.example
Access-Control-Allow-Methods: GET, PUT
Access-Control-Allow-Headers: content-type
Access-Control-Max-Age: 600
Vary: Origin
</code></pre></div>
<p><code>Access-Control-Max-Age</code> 让浏览器把预检结果缓存一段时间，不用每次都问。<code>Vary: Origin</code> 也很关键。服务器如果是把请求里的 Origin 原样写回去，不加 <code>Vary: Origin</code> 的话，CDN 可能把给 A 来源的响应头缓存下来，再发给 B 来源。</p>
<h2>报了 CORS 错误怎么排查</h2>
<p>先去 Network 面板看预检请求。预检返回 404、401、500，控制台也只会说是 CORS 失败，其实是接口本身出了问题。</p>
<p>如果请求成功了，脚本却读不到某个自定义响应头，那是服务器没用 <code>Access-Control-Expose-Headers</code> 把它暴露出来。</p>
<p>带 Cookie 的跨源请求还有额外限制，见<a href="/questions/security-cors-credentials/">《CORS 携带凭据时有哪些限制？》</a>。</p>
<h2>常见追问</h2>
<p><strong>简单请求被 CORS 拦了，服务器执行了吗？</strong></p>
<blockquote>
<p>执行了，只是脚本拿不到结果。所以有副作用的接口不能靠 CORS 防跨站伪造，要靠 CSRF 防护。</p>
</blockquote>
<p><strong>开发环境怎么绕过？</strong></p>
<blockquote>
<p>用开发服务器做代理，把请求变成同源的。生产环境再正确配置响应头。</p>
</blockquote>
<p><strong><code>mode: &#x27;no-cors&#x27;</code> 有什么用？</strong></p>
<blockquote>
<p>它只能发简单请求，拿到的是一个读不了内容的不透明响应。适合打点这种不关心结果的场景。</p>
</blockquote>`};export{e as default};