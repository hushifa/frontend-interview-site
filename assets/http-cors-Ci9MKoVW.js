var e={answerHtml:`<p>源由协议、主机和端口组成。<a href="https://app.example">https://app.example</a> 与 <a href="https://api.example">https://api.example</a> 不同源，同一个主机使用不同端口也可能不同源；路径不同本身不产生新的源。</p>
<p>同源策略限制脚本对其他源资源的某些访问能力。CORS 让服务器明确说明哪些来源可以读取相应响应，不是让前端单方面宣布“我允许自己跨域”。</p>
<h3>请求发出与响应可读是两件事</h3>
<p>某些跨源请求可以直接发出，服务器也可能正常处理并返回 200，但如果没有满足 CORS 响应规则，浏览器仍然会阻止脚本取得可读结果。</p>
<p>因此后端日志显示收到了请求，不证明前端一定能读取响应；前端出现 CORS 错误，也不证明服务器完全没有执行操作。这正是 CORS 不能替代 CSRF 和服务端授权的原因之一。</p>
<p>图片、脚本、表单提交等资源方式还有各自规则，不能把所有跨源行为都简化成“浏览器禁止发送”。需要分析的是具体 API 和你希望获得的访问能力。</p>
<h3>一个需要预检的请求会经历两步</h3>
<p>假设页面来自 <a href="https://app.example%EF%BC%8C%E5%B8%8C%E6%9C%9B%E5%90%91%E5%8F%A6%E4%B8%80%E4%B8%AA%E6%BA%90%E5%8F%91%E9%80%81">https://app.example，希望向另一个源发送</a> PUT JSON，并带一个自定义头。浏览器通常先发预检，关键字段类似：</p>
<div class="not-prose code-block"><div class="code-language">http</div><pre><code class="hljs language-http">OPTIONS /profile HTTP/1.1
Host: api.example
Origin: https://app.example
Access-Control-Request-Method: PUT
Access-Control-Request-Headers: content-type,x-client-version
</code></pre></div>
<p>服务器允许时，可以返回：</p>
<div class="not-prose code-block"><div class="code-language">http</div><pre><code class="hljs language-http">HTTP/1.1 204 No Content
Access-Control-Allow-Origin: https://app.example
Access-Control-Allow-Methods: PUT
Access-Control-Allow-Headers: Content-Type, X-Client-Version
Access-Control-Allow-Credentials: true
Access-Control-Max-Age: 600
Vary: Origin
</code></pre></div>
<p>浏览器检查方法、请求头和来源等条件后，才发送实际请求。实际响应也仍然需要相应 CORS 头，而不是“OPTIONS 成功过，后面的响应就可以省略”。</p>
<div class="not-prose code-block"><div class="code-language">http</div><pre><code class="hljs language-http">HTTP/1.1 200 OK
Content-Type: application/json
Access-Control-Allow-Origin: https://app.example
Access-Control-Allow-Credentials: true
Access-Control-Expose-Headers: ETag, X-Request-ID
Vary: Origin
</code></pre></div>
<p>这些是用于解释的关键字段，实际接口还需要自己的认证、正文、缓存与其他 HTTP 配置。</p>
<h3>哪些请求可能不先预检</h3>
<p>常见的 GET、HEAD 或使用允许的头与内容类型的 POST，可以满足相应 CORS safelist 条件而不预检。判断还涉及头值等要求，不能只记成“GET 都不预检，POST 都预检”。</p>
<p>application/json、自定义请求头、PUT 等常常会触发预检。credentials:&#x27;include&#x27; 本身则不意味着一定预检，例如某些带凭据的 GET 仍可直接发送。</p>
<p>预检成功有自己的缓存机制，所以后续同类请求未必每次都看到 OPTIONS。Access-Control-Max-Age 也受浏览器上限和缓存键规则影响，不应与普通响应 max-age 当成同一份缓存。</p>
<p>预检按协议不应依赖普通请求携带的 Cookie 等凭据，因此服务器不能把“先有登录 Cookie 才允许 OPTIONS”作为通用前提。真正的业务请求仍然需要独立检查认证与权限。</p>
<h3>凭据配置需要浏览器与服务端同时满足</h3>
<p>fetch 默认只在同源场景采用相应凭据行为。跨源请求若需要 Cookie 等浏览器凭据，可以按需求设置 credentials:&#x27;include&#x27;，同时服务器需允许具体来源并返回适当的 Access-Control-Allow-Credentials。</p>
<p>凭据模式为 include 时，Access-Control-Allow-Origin 不能使用 * 代替具体源，即使当前请求恰好没有可发送的 Cookie，也不能据此放宽为同样的通配规则。</p>
<p>Cookie 自身的 Domain、Path、SameSite、Secure、浏览器第三方 Cookie 策略等仍然生效。CORS 允许读取不等于 Cookie 一定会被发送；同站也不等于同源，子域之间可能同站但仍需处理 CORS。</p>
<p>手工添加 Authorization 等头还要符合请求头许可规则，不能把 credentials 当作控制任意手工头的统一开关。Authorization 这类头也需要按规定显式允许，不能无条件认为一个 * 会覆盖全部情况。</p>
<h3>响应可读，不代表所有头都向脚本开放</h3>
<p>跨源可读响应默认只暴露相应安全列表中的响应头。若前端需要读取 ETag、自定义分页信息或 X-Request-ID，应通过 Access-Control-Expose-Headers 等配置开放。</p>
<p>Access-Control-Allow-Headers 允许的是请求里带哪些头，Expose-Headers 决定脚本能读哪些响应头，两者不能交换使用。Set-Cookie 等受保护头也不能因为随便写了 Expose-Headers 就变成普通脚本可读取信息。</p>
<p>服务端按 Origin 动态选择响应时，应从受控允许列表判断，并配合适当 Vary 防止缓存把一个来源的策略误用于另一个来源。无条件回显任意 Origin 并允许凭据，不是可靠的访问边界。</p>
<h3>no-cors 不是修复接口读取的方法</h3>
<p>mode:&#x27;no-cors&#x27; 会限制请求可采用的方法和头，并通常让脚本得到 opaque 响应。它可能有 status:0、不可读的正文和受限头信息，不能拿来继续按普通 JSON 接口解析。</p>
<p>前端在请求头里添加 Access-Control-Allow-Origin 也不能授予自己读取权限，那是响应侧的声明，而且随意添加头还可能触发额外预检。</p>
<p>开发代理把浏览器请求先发到同源开发服务器，再由服务器转发，是另一种部署路径。它在开发环境有效，不表示生产静态页面也自动拥有同样代理；生产需要实际网关、同源后端或正确的 CORS 配置。</p>
<h3>调试时沿阶段找证据</h3>
<p>先确认 URL 和源是否符合预期，再检查是否发生预检、预检响应是否允许方法与头、实际请求有没有发送，以及实际响应是否继续携带正确策略。之后再看凭据条件与响应头暴露。</p>
<p>浏览器为了限制信息泄漏，脚本得到的拒绝通常不会包含完整 CORS 原因；控制台和 Network 面板才可能提供更具体的线索。命令行请求成功也不证明浏览器脚本能够读取，因为普通命令行客户端不会实施同一套同源策略。</p>`};export{e as default};