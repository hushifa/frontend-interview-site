var e={answerHtml:`<h2>简答</h2>
<ul>
<li>“请求失败”可能出在 DNS、TLS、HTTP 状态、CORS、缓存或 Service Worker 等不同层。</li>
<li>先确认最终 URL、源和重定向链；DNS、连接、TLS 错误不能靠改 CORS 修复。</li>
<li>HTTP 状态、响应类型和业务结果要分开检查；CORS 要分别看预检和实际请求。</li>
<li>缓存和 Service Worker 会改变响应来源，流式响应还要检查缓冲与分帧。</li>
</ul>
<p>前端看到“请求失败”时，可能是 DNS 没找到地址、TLS 证书被拒绝、服务器返回 503、浏览器阻止了 CORS、Service Worker 返回旧响应，也可能是接口返回 200 但 JSON 结构错误。每一层的证据和修复方式都不同。</p>
<p>排查的第一原则是先保存原始事实：完整 URL、请求方法、状态、响应头、请求头、时间线、控制台错误和响应体摘要。不要先改代码、清缓存或把所有域名都加入白名单。</p>
<h2>先确认请求身份和部署位置</h2>
<p>检查协议、主机、端口、路径、查询参数和重定向链。相对 URL 会受到当前页面 base、子目录部署和 <code>&lt;base&gt;</code> 标签影响；同一段 fetch 在开发服务器和生产子路径中可能请求不同地址。</p>
<p>如果请求根本没有出现在 Network 中，可能是代码分支、Service Worker、预加载或浏览器策略在更早阶段阻止了它。若出现了请求，要区分它是预检、实际请求、重试还是另一个相似路径的请求。</p>
<h2>DNS、连接和 TLS 错误不能靠 CORS 修复</h2>
<p>域名解析失败、连接超时、证书域名不匹配或 TLS 版本问题，通常在 HTTP 响应之前发生。浏览器脚本可能只得到一个笼统的网络错误，开发者工具、系统 DNS 工具、代理日志和证书检查才能提供更多证据。</p>
<div class="not-prose code-block"><div class="code-language">bash</div><pre><code class="hljs language-bash">curl -I -L --max-time 15 https://api.example.com/health
</code></pre></div>
<p>命令行成功不证明浏览器可以读取响应，因为 curl 不实施同源策略、Cookie 分区和 Permissions Policy；命令行失败也要确认它使用的 DNS、代理和证书环境是否与浏览器相同。TLS 调试时不要关闭证书验证来“确认接口能不能用”，那会掩盖真正的身份和链路问题。</p>
<h2>HTTP 状态、响应类型和业务结果分开看</h2>
<p>拿到 200 只证明 HTTP 层返回成功。还要检查 <code>Content-Type</code>、<code>Content-Encoding</code>、<code>Content-Length</code>、缓存头、响应体和业务字段。登录过期可能返回 HTML 登录页，接口请求随后在 JSON.parse 阶段失败；这不是 JSON 库随机坏了。</p>
<p>404、401、403、409、429、502 和 504 需要不同恢复策略。写操作在超时后可能已经执行，不能只看到 504 就自动重试；429 和 503 还要查看 <code>Retry-After</code>。缓存的旧错误页也可能让当前源站已经修复但用户仍看到失败。</p>
<h2>CORS 要按预检和实际响应两个请求检查</h2>
<p>对于 JSON、PUT 或自定义请求头，先看 OPTIONS 是否发送、响应是否允许真实方法和请求头；再看实际请求是否发送、是否带 Cookie，以及实际响应是否有匹配的 <code>Access-Control-Allow-Origin</code> 和凭据配置。</p>
<p>预检成功不代表实际响应可读。实际响应缺少 CORS 头时，服务器可能已经执行了操作，浏览器只是阻止脚本读取结果。反过来，预检失败时实际请求通常不会发送。这个区别决定了是否需要检查重复写入和 CSRF，而不是只在前端换一个 <code>mode</code>。</p>
<p><code>Access-Control-Allow-Origin</code> 不能写成带路径的 URL；凭据请求不能使用 <code>*</code>；需要读取自定义响应头时还要检查 <code>Access-Control-Expose-Headers</code>。服务端动态回显 Origin 还要有白名单和适当的 Vary，不能把任意来源当成可信。</p>
<h2>缓存和 Service Worker 会改变你看到的来源</h2>
<p>检查 <code>Age</code>、<code>ETag</code>、<code>Cache-Control</code>、<code>Vary</code> 和平台命中头，确认响应来自浏览器、CDN 还是源站。页面更新后看到旧 HTML，可能导致旧哈希资源、错误的 API base 或旧数据继续使用；清浏览器缓存只是诊断手段，不是发布策略。</p>
<p>Service Worker 可能在 Network 面板之前拦截请求。要排查它，查看当前控制器、Cache Storage、更新状态和缓存命中；暂时在测试环境禁用 Service Worker 可以定位问题，但不能把禁用后的网络结果当成离线功能验证。</p>
<h2>流式响应要检查缓冲和分帧</h2>
<p>SSE、fetch 流和 WebSocket 问题不能只看请求是否 200。要检查媒体类型、事件分隔符、代理缓冲、压缩、连接空闲超时和客户端消费速度。服务端日志写出一小块，不代表浏览器已经收到并派发了事件；CDN 或反向代理可能攒够数据后才转发。</p>
<p>流式协议的消息边界也要按协议处理。一次 read 不一定是一行、一条 JSON 或一条 WebSocket 业务消息。解析器要保留跨块残片，遇到半条消息、重复事件和断线重连时记录游标与恢复行为。</p>
<h2>使用证据形成最短排查路径</h2>
<p>可以按这个顺序记录：</p>
<ol>
<li>页面实际 origin、请求 URL 和最终重定向；</li>
<li>DNS/连接/TLS 是否完成；</li>
<li>是否有 Service Worker、预检或重试；</li>
<li>实际状态码、响应头和响应体类型；</li>
<li>Cookie、CORS、CSP、Permissions Policy 是否改变浏览器可见性；</li>
<li>解析、Schema 校验和业务状态是否成功；</li>
<li>缓存、代理和 CDN 是否提供了旧或错误版本。</li>
</ol>
<p>不同工具回答不同问题：Network 展示浏览器看到的请求，Application 面板展示 Service Worker 和存储，Performance 展示主线程与流消费，服务器/CDN 日志展示回源事实，curl 或 openssl 可以帮助隔离浏览器策略。把这些证据对应起来，才不会用“前端报 CORS”掩盖证书、缓存、权限或接口契约问题。</p>`};export{e as default};