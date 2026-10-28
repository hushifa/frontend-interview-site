var e={answerHtml:`<h2>简答</h2>
<ul>
<li>先记录事实：完整 URL、方法、状态码、请求头和响应头、Timing、控制台错误。不要先清缓存或改代码，证据会丢失。</li>
<li>状态栏显示 <code>(failed)</code> 且没有状态码，多半是 DNS、连接、TLS 或浏览器策略问题，改 CORS 配置修不好证书错误。</li>
<li>有状态码时分开看三件事：HTTP 状态、<code>Content-Type</code> 与正文是否符合预期、业务字段是否成功。</li>
<li>CORS 问题要分别检查预检请求和实际请求；响应可能来自缓存或 Service Worker，不一定来自服务器。</li>
</ul>
<h2>逐层排查</h2>
<table><thead><tr><th>层</th><th>典型现象</th><th>证据</th></tr></thead><tbody><tr><td>URL</td><td>请求了错误地址、子路径部署后相对路径错</td><td>Network 中的实际 URL、重定向链</td></tr><tr><td>DNS / 连接 / TLS</td><td><code>ERR_NAME_NOT_RESOLVED</code>、<code>ERR_CERT_*</code>、超时</td><td>错误码、Timing 中停在哪一段</td></tr><tr><td>HTTP</td><td>4xx、5xx、意外的 3xx</td><td>状态码、响应头、正文</td></tr><tr><td>浏览器策略</td><td>控制台提示 CORS、CSP、混合内容、权限策略</td><td>控制台消息、预检请求</td></tr><tr><td>缓存 / Service Worker</td><td>拿到旧内容</td><td>Size 列显示 <code>(disk cache)</code> 或 <code>(ServiceWorker)</code>、<code>Age</code> 头</td></tr><tr><td>数据</td><td><code>JSON.parse</code> 报错、字段缺失</td><td>实际正文，例如登录过期返回了 HTML</td></tr></tbody></table>
<h2>几个典型场景</h2>
<p><strong>接口在浏览器失败、curl 成功</strong>：curl 不执行同源策略，也不带浏览器的 Cookie。先看控制台是否有 CORS 或 CSP 错误，再看预检是否返回 2xx 和正确的 <code>Access-Control-Allow-*</code>。</p>
<p><strong>发版后部分用户仍是旧页面</strong>：检查 HTML 的 <code>Cache-Control</code>、CDN 命中情况，以及是否有 Service Worker 在返回缓存。Application 面板可以查看 Service Worker 状态和 Cache Storage。</p>
<p><strong>流式输出一次性出现</strong>：中间的代理或 CDN 缓冲了响应，或者开启了压缩缓冲。检查代理配置（如关闭缓冲）和响应头，服务端日志显示已写出不代表浏览器已收到。</p>
<p><strong>写操作超时</strong>：服务器可能已经执行成功，只是响应没回来。不要直接重试非幂等请求，先查询结果或使用幂等键。</p>
<h2>工具分工</h2>
<ul>
<li>Network 面板：浏览器实际发出和收到的内容，可以导出 HAR 交给后端。</li>
<li>Console：CORS、CSP、混合内容等策略错误只在这里有详细说明。</li>
<li>Application 面板：Service Worker、Cache Storage、Cookie。</li>
<li><code>curl -v</code>、<code>openssl s_client</code>：绕开浏览器策略，单独验证 DNS、TLS 和 HTTP。</li>
<li>服务器、CDN 日志：确认请求是否到达、是否回源。</li>
</ul>
<p>导出 HAR 前注意，它包含 Cookie 和令牌，分享前要脱敏。</p>
<h2>常见追问</h2>
<ul>
<li>为什么 JS 拿不到失败原因？浏览器对网络和跨源错误只给脚本一个笼统的 <code>TypeError</code>，避免泄露跨源信息，细节只在 DevTools 中可见。</li>
<li><code>(pending)</code> 一直不结束？可能是服务器没有响应、连接数已满（HTTP/1.1 同域名约 6 个），或流式响应仍在进行。</li>
</ul>`};export{e as default};