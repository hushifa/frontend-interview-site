var e={answerHtml:`<p>攻击者不一定要读取跨站响应正文才能知道用户是否登录。假设目标站点的 <code>/account</code> 对已登录用户返回较大的页面，攻击者页面可以尝试加载它，观察加载时间、资源尺寸、重定向或窗口行为，从差异中推断“这个浏览器是否登录”。这类利用浏览器可观察侧信道推断跨站状态的问题称为 XS-Leaks。</p>
<h2>XS-Leaks 和 CORS 解决的是不同问题</h2>
<p>同源策略通常阻止攻击者脚本直接读取跨源响应，但浏览器仍可能允许发起部分请求、加载图片或 iframe，并暴露加载是否完成、尺寸变化、错误类型和时间差。CORS 决定脚本能否读取允许的跨源响应，不能自动消除所有可观察侧信道。反过来，配置了严格 CORS 也不等于敏感页面不会被嵌入或被推断。</p>
<p>常见信号包括：</p>
<ul>
<li>图片、脚本、iframe 的加载成功、失败或重定向；</li>
<li>特定条件下的加载时间、缓存行为和资源差异；</li>
<li><code>window.length</code>、弹窗导航和错误页面差异；</li>
<li>跨站请求是否带上 Cookie 或其他凭据。</li>
</ul>
<p>单个信号通常不可靠，但在大量采样、已知用户操作或稳定网络环境下可能变得有用。防护目标不是让每次请求耗时完全相同，而是减少敏感状态在跨站上下文中的可观察差异。</p>
<p>这里说的是通过允许观察的差异推断，并不是可以直接读取任意跨源页面的响应大小、HTTP 状态或内部资源列表。例如 Resource Timing 的详细跨源计时和大小信息受到 Timing-Allow-Origin 限制；没有授权时一些字段会为零。iframe 的 load 事件也不能直接证明里面是登录页还是账户页。具体攻击要同时满足可嵌入、凭据携带、可区分信号等条件，必须针对目标浏览器验证，不能仅根据页面大小不同就断言可利用。</p>
<h2>先限制跨站请求携带的身份</h2>
<p>Cookie 应根据业务设置合适的 <code>SameSite</code>、<code>Secure</code>、<code>HttpOnly</code> 和作用域。<code>SameSite</code> 可以减少跨站请求自动携带会话 Cookie，但不同导航方式、浏览器策略和嵌入场景需要实测；不能把它当作所有 CSRF 和 XS-Leak 的单独防线。敏感页面应避免允许任意跨站嵌入，并在服务端验证请求上下文。</p>
<p>对于不需要跨站读取的响应，不要配置宽泛的 <code>Access-Control-Allow-Origin</code> 和凭据。CORS 允许读取的范围越大，泄露风险越高；允许凭据时必须使用明确的来源，并校验来源列表，不能把任意 <code>Origin</code> 原样回显。</p>
<h2>使用响应头表达嵌入和请求边界</h2>
<p>可以根据业务选择 <code>Content-Security-Policy: frame-ancestors</code> 或 <code>X-Frame-Options</code> 限制页面被 iframe 嵌入，使用 <code>Cross-Origin-Resource-Policy</code> 限制资源被跨源加载，并通过 <code>Referrer-Policy</code> 减少 URL 信息泄露。它们各自解决不同问题，不能随意堆叠后认为已经完成防护。</p>
<p>Fetch Metadata 请求头（如 <code>Sec-Fetch-Site</code>、<code>Sec-Fetch-Mode</code> 和 <code>Sec-Fetch-Dest</code>）可以帮助服务端识别明显的跨站嵌入或导航，再对敏感端点拒绝或返回统一响应。老浏览器可能没有这些头部，因此应把它们作为增强检查，并保留会话、授权和 CSRF 验证。</p>
<h2>让敏感状态的响应更难被区分</h2>
<p>如果未登录和已登录页面在状态码、重定向、响应大小或可加载资源上差异很大，攻击者更容易建立侧信道。可以对敏感资源要求显式导航或授权，避免把私密状态放进公共缓存，统一不必要的错误响应，并让服务端在无权访问时不要泄露资源是否存在。</p>
<p>这不意味着所有响应都要填充到完全相同大小或人为延迟；过度填充会损害性能，也很难在所有网络和设备上消除差异。优先缩小跨站可观察面，并通过真实浏览器验证攻击路径。</p>
<h2><code>window.name</code>、弹窗和消息也要审查</h2>
<p>跨窗口通信使用 <code>postMessage</code> 时必须校验 <code>event.origin</code>、消息结构和当前会话，不能只检查 <code>event.source</code> 或接受任意来源。弹窗导航、<code>window.opener</code> 和跨源页面之间的生命周期行为可能泄露是否完成登录或跳转。对于不需要 opener 的外部链接，使用合适的 <code>rel</code> 属性或安全导航策略。</p>
<h2>测试 XS-Leak 需要隔离环境</h2>
<p>测试环境可以创建攻击者来源和目标来源，验证：</p>
<ul>
<li>未登录与已登录请求是否携带不同的跨站凭据；</li>
<li>iframe、图片、脚本和弹窗能观察到哪些结果；</li>
<li>响应是否被缓存并在跨站重用；</li>
<li>敏感页面是否被允许嵌入；</li>
<li>新旧浏览器缺少安全头或 Fetch Metadata 时是否仍有基础防护。</li>
</ul>
<p>测试标记必须是无害的，不能在生产站点对真实用户账户进行探测。性能分析和网络日志还要注意不要把测试账号 Cookie、令牌和个人数据上传到公共工具。</p>
<h2>常见误区和选型</h2>
<ul>
<li>认为跨域脚本读不到正文就没有泄露：时间、大小和加载结果仍可能成为信号。</li>
<li>只设置 <code>Access-Control-Allow-Origin: *</code>：这不限制资源被加载，也可能扩大公开数据范围。</li>
<li>只依赖 <code>SameSite</code>：浏览器策略和导航场景不同，仍需授权与请求上下文检查。</li>
<li>对所有响应统一增加延迟：性能代价高且不保证消除统计差异。</li>
<li>只在前端隐藏账户入口：攻击者可以直接构造跨站请求，服务端必须拒绝不合法访问。</li>
</ul>
<p>XS-Leaks 防护应按敏感状态、嵌入需求、缓存策略和浏览器覆盖设计。优先使用服务端授权、合理 Cookie 属性、嵌入控制和统一错误边界，再用攻击者视角的浏览器测试验证真正可观察的信号。</p>
<h2>参考资料</h2>
<ul>
<li><a href="https://owasp.org/www-community/attacks/XS-Leaks">OWASP · XS-Leaks</a></li>
<li><a href="https://xsleaks.dev/">XS-Leaks Wiki</a></li>
<li><a href="https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Set-Cookie#samesitesamesite-value">MDN · SameSite cookies</a></li>
<li><a href="https://developer.mozilla.org/en-US/docs/Glossary/Fetch_metadata_request_header">MDN · Fetch Metadata request headers</a></li>
</ul>`};export{e as default};