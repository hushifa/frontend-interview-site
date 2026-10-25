var e={answerHtml:`<p>XSS 和 CSRF 都可能让用户在不知情时受到损害，但攻击利用的信任不同。</p>
<p><strong>XSS 是让攻击者控制的内容在目标网站上下文中变成可执行代码。CSRF 是诱导浏览器向目标网站发送用户并不打算发送的请求，并利用浏览器自动携带的身份凭据让请求通过。</strong></p>
<p>可以用两个场景来区分：评论区错误地把评论当 HTML 执行，是 XSS；用户已登录资料管理网站，另一个页面偷偷提交修改资料的表单，是 CSRF。后者即使读不到修改接口的响应，只要服务器已经执行操作，攻击仍可能成功。</p>
<h2>XSS 的关键是数据进入了什么解释环境</h2>
<p>用户提交的文字可能来自评论、URL 查询参数、第三方接口或本地存储。它们都不能仅因为“已经进了数据库”或“是后端返回的”就自动成为可信 HTML。</p>
<p>如果只要展示文字，应使用文本接口：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">renderComment</span>(<span class="hljs-params">container, comment</span>) {
  <span class="hljs-keyword">const</span> paragraph = <span class="hljs-variable language_">document</span>.<span class="hljs-title function_">createElement</span>(<span class="hljs-string">&#x27;p&#x27;</span>);
  paragraph.<span class="hljs-property">textContent</span> = comment;
  container.<span class="hljs-title function_">replaceChildren</span>(paragraph);
}
</code></pre></div>
<p>即使 comment 包含看起来像标签或事件属性的字符串，它也会作为文字显示。若改成把不可信字符串交给 <code>innerHTML</code>，浏览器就会按 HTML 解析，其中的危险内容可能获得执行机会。防护重点是避免让普通数据进入危险的解释入口，而不是检查字符串里有没有某个单词。</p>
<p>常见分类中，存储型 XSS 的内容被保存后展示给其他用户，反射型 XSS 的内容通过当前请求反射到页面，DOM 型 XSS 则强调前端代码把不可信数据流入危险 DOM 操作。这些是对传播和执行路径的不同描述，不是绝对互斥的三个盒子。</p>
<h2>框架转义有帮助，但存在明确边界</h2>
<p>React 的普通文本插值、Vue 的普通模板插值等会按其规则安全处理文本，不能因此得出“用了框架就没有 XSS”。React 的 <code>dangerouslySetInnerHTML</code>、Vue 的 <code>v-html</code> 等入口仍要求调用者保证传入 HTML 的安全性。</p>
<p>HTML 文本、属性、URL、JavaScript 和 CSS 的解释规则也不同。把 <code>&lt;</code> 转义了，并不代表拼接到任意脚本或 URL 中就安全。例如用户提供一个链接地址时，即使使用 DOM 属性赋值，也仍要限制协议和业务允许的目标；不能允许任意 <code>javascript:</code> 地址因为没有拼 HTML 就被当成安全链接。</p>
<p>也不要把不可信数据拼进 <code>eval()</code>、<code>new Function()</code> 或内联事件处理器。需要解析 JSON 时使用 <code>JSON.parse()</code>，而不是执行字符串。</p>
<h2>必须展示富文本时，净化和 CSP 各有职责</h2>
<p>用户输入本来就允许部分 HTML，例如加粗、列表和链接时，全部改成纯文本会丢失功能。这时应使用维护良好的 HTML 净化库，例如 DOMPurify，按明确允许的元素、属性和 URL 规则生成安全内容，再交给 HTML 渲染入口。</p>
<p>不要自己用正则删除 <code>&lt;script&gt;</code> 就认为完成净化。危险内容还可能出现在事件属性、URL、不同命名空间以及浏览器解析产生的结构中。净化之后也不能再拼入未经处理的片段，否则会破坏此前的安全保证。Markdown 同样需要控制原始 HTML、链接协议和插件扩展，不能因为输入格式不是 HTML 就自动信任渲染结果。</p>
<p>CSP 可以限制脚本、样式和其他资源的加载与执行来源。采用合适的 nonce/hash 策略、减少不安全的内联执行和动态代码执行，有助于降低遗漏漏洞的影响；但宽泛允许脚本来源或大量使用 <code>unsafe-inline</code>，防护效果会显著不同。CSP 是额外防线，不应拿来代替安全渲染。</p>
<p>在支持的环境中，Trusted Types 可以限制危险 DOM 接口接受普通字符串，迫使调用走受控策略；策略本身仍要正确净化，随意把输入包装成可信类型不会自动变安全。</p>
<h2>CSRF 为什么常与 Cookie 登录态有关</h2>
<p>浏览器会根据域、路径、Secure、SameSite 等规则自动附带 Cookie。服务器如果只验证“这个会话 Cookie 有效”，却不验证请求是否来自合理的操作来源，就可能把攻击者诱导的请求也当成用户操作。</p>
<p>表单能发送跨源请求。CORS 主要控制某些跨源访问能力，包括响应能否被脚本读取和非简单请求是否通过预检；它并不普遍阻止简单表单请求到达服务端。因此“没有允许跨域，接口就不会被调用”是错误判断。</p>
<p>XSS 则更进一步：脚本已经在目标网站的上下文执行，通常可以发起同源操作、读取页面数据，甚至获取页面可读的 CSRF Token。修好 CSRF 防线不能代替修好 XSS。</p>
<h2>CSRF Token 要在服务端验证</h2>
<p>一种常见方案是：服务器向已认证页面提供不可预测、与当前会话关联的 CSRF Token；页面在修改状态时把它放进请求头或表单字段；服务器在执行操作前验证它。</p>
<p>下面只是请求形态示例，token 必须由真实服务端机制提供：</p>
<div class="not-prose code-block"><div class="code-language">http</div><pre><code class="hljs language-http">POST /api/profile HTTP/1.1
Host: account.example.com
Cookie: session=...
Content-Type: application/json
X-CSRF-Token: ...

{&quot;displayName&quot;:&quot;新的昵称&quot;}
</code></pre></div>
<p>攻击者的网站可能诱导浏览器带上 session Cookie，却通常不能跨源读取目标页面中的随机 token，因此难以构造完整的有效请求。Token 不应写死，也不应放进 URL 让它进入历史、日志和 Referer。</p>
<p>另一类“双重提交 Cookie”方案也需要防止 token 被注入或伪造，通常使用成熟框架提供的会话绑定或签名机制，而不是只比较两份由攻击者可能控制的字符串。具体实现应沿用服务端框架的安全机制，前端自己生成一个随机数但服务端不验证，没有防护作用。</p>
<h2>SameSite 和来源检查应怎样配合</h2>
<p>显式设置 <code>SameSite=Lax</code> 或 <code>Strict</code> 可以限制 Cookie 在部分跨站场景发送，但不能把它当成覆盖所有情况的单一防线。</p>
<p>Lax 仍允许某些顶层安全方法导航携带 Cookie，所以不能设计“访问某个 GET URL 就删除账号”。Strict 限制更强，但可能影响外部链接进入后的登录体验和特定认证流程；需要跨站 Cookie 的场景使用 <code>SameSite=None</code> 时，还必须满足 Secure 等要求，并重新设计相应 CSRF 防护。</p>
<p>“同站”和“同源”也不同。例如 HTTPS 下的 <code>account.example.com</code> 与 <code>content.example.com</code> 可以是同站，却不是同源。如果某个同站子域不可信，不能只凭 SameSite 就放心接受请求。</p>
<p>服务端可以结合精确的 <code>Origin</code> 允许列表校验来源，并合理处理缺失或 <code>null</code> 的情况；也可利用 <code>Sec-Fetch-Site</code> 等 Fetch Metadata 提供的上下文。不要用字符串包含判断，例如看到域名中含 <code>example.com</code> 就放行，也不要认为这些头代替了用户身份认证。</p>
<p>对严格的 JSON API，要求合适的内容类型、自定义头，并拒绝不符合契约的简单请求，配合谨慎的 CORS 配置，可以构成防线的一部分。但若服务器同时接受表单类型、忽略 Content-Type，或允许任意来源带凭据访问，原先的假设就可能失效。</p>
<h2>HttpOnly、HTTPS 和 Token 存储都不是万能修复</h2>
<p>HttpOnly 阻止普通页面脚本直接读取对应 Cookie，但 XSS 代码仍可能让浏览器携带 Cookie 发起同源请求；它也不阻止 CSRF 利用自动附带的 Cookie。</p>
<p>HTTPS 保护通信链路，不会阻止应用自己执行注入脚本或接受伪造的业务请求。把认证信息从 Cookie 改放 localStorage，可以改变自动携带凭据的条件，却会暴露在同源脚本访问范围内，不能因此宣称整个系统更安全。</p>
<p>审核时分别追踪两条路径：不可信内容从哪里进入、最后是否被解释为代码；修改状态的请求凭什么证明是用户预期的操作。按这两条路径选择防护，比给所有安全问题统一加一个请求头更可靠。</p>
<p>进一步阅读：<a href="https://developer.mozilla.org/en-US/docs/Web/Security/Attacks/XSS">MDN：XSS</a>、<a href="https://developer.mozilla.org/en-US/docs/Web/Security/Attacks/CSRF">MDN：CSRF</a>。</p>`};export{e as default};