var e={answerHtml:`<p>登录成功后，服务端可能通过下面的响应头给浏览器设置会话 Cookie：</p>
<div class="not-prose code-block"><div class="code-language">http</div><pre><code class="hljs language-http">Set-Cookie: __Host-session=随机会话标识; Path=/; Secure; HttpOnly; SameSite=Lax
</code></pre></div>
<p>浏览器保存它，以后在满足条件的请求中自动携带。三个属性分别限制“脚本能不能读”“通过什么连接发送”“跨站时是否发送”，不是可以互相替代的安全开关。</p>
<h3>HttpOnly：不让页面脚本直接取走会话凭证</h3>
<p>设置 HttpOnly 后，页面不能通过 <code>document.cookie</code> 读取这个 Cookie，也不能通过它改写该 HttpOnly Cookie。但浏览器仍然可以把它附加到符合条件的请求中，包括 JavaScript 发出的 <code>fetch</code> 请求。</p>
<p>假设页面出现 XSS，攻击者注入的脚本想读取会话标识并发送到自己的服务器，HttpOnly 能挡住对这个 Cookie 的直接读取。但恶意脚本已经运行在你的站点中，仍可能调用“修改邮箱”接口、读取接口返回的个人信息。因此，<strong>HttpOnly 减少凭证被直接窃取的机会，不等于修复 XSS</strong>。</p>
<p>前端不能用 <code>document.cookie</code> 给 Cookie 加上 HttpOnly；应由服务端通过 Set-Cookie 设置。</p>
<h3>Secure：限制 Cookie 的传输通道</h3>
<p>Secure Cookie 通常只通过 HTTPS 发送；浏览器对 localhost 等本地开发场景存在例外。它避免会话 Cookie 随普通 HTTP 请求明文传输，但不会给 Cookie 值额外加密，也不限制页面脚本读取——后者需要 HttpOnly。</p>
<p>实际部署仍要使用全站 HTTPS。不能因为 Cookie 加了 Secure，就认为通过 HTTP 加载的页面、脚本和跳转已经安全。</p>
<h3>SameSite：判断这次请求是不是从另一个站点发起</h3>
<p>先区分“站点”和“源”：<code>https://app.example.com</code> 与 <code>https://api.example.com</code> 通常同站，但不同源；端口也是源的一部分，却不是站点划分的同一种边界。现代 SameSite 判断还考虑协议，所以不能把它简单说成“禁止跨域 Cookie”。</p>
<table><thead><tr><th>设置</th><th>跨站场景中的典型行为</th><th>对用户流程的影响</th></tr></thead><tbody><tr><td>Strict</td><td>跨站请求通常不携带</td><td>从外站链接进入时，首次请求可能不带登录 Cookie</td></tr><tr><td>Lax</td><td>允许跨站的顶层导航且使用安全方法，例如点击链接进行 GET 导航</td><td>兼顾常见外链访问和部分 CSRF 防护</td></tr><tr><td>None</td><td>不通过 SameSite 限制跨站携带，必须同时设置 Secure</td><td>适用于确实需要跨站 Cookie 的流程，但仍受浏览器其他 Cookie 政策限制</td></tr></tbody></table>
<p>Lax 并不是“所有 GET 都放行”：跨站图片请求、iframe 加载、<code>fetch</code> 都不能仅因使用 GET 就套用顶层导航的例外。相反，如果服务端用 GET 执行删除操作，攻击者可能利用顶层导航触发它，所以读取接口和修改接口的职责仍应分开。</p>
<p>有些浏览器在没有显式设置 SameSite、采用默认 Lax 时，对刚设置的 Cookie 还有短时间内允许顶层 POST 的兼容行为。不要依赖默认值来设计安全策略，应明确写出需要的属性。</p>
<h3>为什么这三个属性仍不够</h3>
<p>SameSite 不能阻止所有 CSRF，例如同站的恶意子域不一定被它拦住。敏感操作还应结合 CSRF Token、Origin 校验和服务端授权。跨源 <code>fetch</code> 是否发送 Cookie 还受 <code>credentials</code> 设置等条件影响；CORS 则约束脚本能否读取响应，不会被 SameSite 替代。</p>
<p>示例使用 <code>__Host-</code> 前缀：在支持此前缀规则的浏览器中，要求 Secure、<code>Path=/</code>，并且不能设置 Domain，从而把 Cookie 绑定到设置它的主机。不要为了方便给所有子域共享登录 Cookie 而随意扩大 Domain。Path 只参与匹配发送路径，不是可靠的权限隔离边界。</p>
<p>排查“不带 Cookie”时，应在开发者工具中分别查看 Set-Cookie 是否被接受、Cookie 保存的属性、实际请求的 Cookie 和浏览器给出的阻止原因。只看 <code>document.cookie</code> 没有某个值，不能判断登录 Cookie 没设置成功，它可能只是 HttpOnly。</p>`};export{e as default};