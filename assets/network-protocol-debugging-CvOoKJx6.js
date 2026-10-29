var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>用户说“请求失败了”，问题可能出在很多层：地址写错、DNS、连接和 TLS、HTTP 本身、浏览器策略（CORS、CSP、混合内容）、缓存和 Service Worker，或者数据解析。所以第一步不是改代码，而是先把事实记下来：完整 URL、方法、状态码、请求头和响应头、Timing、控制台错误。先清缓存或改代码，证据就没了。</p>
<p>然后看有没有状态码。Network 里显示 <code>(failed)</code>、没有状态码，多半是 DNS、连接、TLS 或者浏览器策略的问题。这种时候去改 CORS 配置，修不好证书错误。</p>
<p>有状态码的话，分开看三件事：HTTP 状态对不对、<code>Content-Type</code> 和正文是不是预期的、业务字段是不是成功。</p>
<p>还有两点要注意。CORS 问题要把预检请求和实际请求分开查；响应也不一定来自服务器，可能来自缓存或 Service Worker。</p>
</blockquote>
<h2>每一层看什么</h2>
<table><thead><tr><th>层</th><th>典型现象</th><th>证据</th></tr></thead><tbody><tr><td>URL</td><td>请求了错误地址、子路径部署后相对路径错</td><td>Network 中的实际 URL、重定向链</td></tr><tr><td>DNS / 连接 / TLS</td><td><code>ERR_NAME_NOT_RESOLVED</code>、<code>ERR_CERT_*</code>、超时</td><td>错误码、Timing 中停在哪一段</td></tr><tr><td>HTTP</td><td>4xx、5xx、意外的 3xx</td><td>状态码、响应头、正文</td></tr><tr><td>浏览器策略</td><td>控制台提示 CORS、CSP、混合内容、权限策略</td><td>控制台消息、预检请求</td></tr><tr><td>缓存 / Service Worker</td><td>拿到旧内容</td><td>Size 列显示 <code>(disk cache)</code> 或 <code>(ServiceWorker)</code>、<code>Age</code> 头</td></tr><tr><td>数据</td><td><code>JSON.parse</code> 报错、字段缺失</td><td>实际正文，例如登录过期返回了 HTML</td></tr></tbody></table>
<p>最后一行很常见。<code>JSON.parse</code> 报错，看起来是数据问题，打开正文一看，是登录过期后网关返回了一个 HTML 登录页。</p>
<h2>几个典型场景</h2>
<p>**接口在浏览器里失败，curl 却成功。**这是因为 curl 不执行同源策略，也不带浏览器的 Cookie，两边的条件根本不一样。先看控制台有没有 CORS 或 CSP 错误，再看预检有没有返回 2xx 和正确的 <code>Access-Control-Allow-*</code>。</p>
<p>**发版后部分用户还是旧页面。**检查 HTML 的 <code>Cache-Control</code>、CDN 的命中情况，以及有没有 Service Worker 在返回缓存。Application 面板里能看到 Service Worker 的状态和 Cache Storage。</p>
<p>**流式输出一下子全出来了。**本来应该一个字一个字出，结果等很久一次性出现。这通常是中间的代理或 CDN 把响应攒起来了，或者开了压缩缓冲。要检查代理配置（比如关掉缓冲）和响应头。服务端日志说已经写出去了，不代表浏览器已经收到。</p>
<p>**写操作超时了。**服务器可能已经执行成功，只是响应没回来。这时不要直接重试非幂等请求，先查一下结果，或者用幂等键。</p>
<h2>各个工具负责什么</h2>
<p>Network 面板看的是浏览器实际发出和收到的内容，可以导出 HAR 文件交给后端。Console 很重要，CORS、CSP、混合内容这些策略错误，只有这里有详细说明。Application 面板看 Service Worker、Cache Storage 和 Cookie。</p>
<p>想绕开浏览器策略、单独验证 DNS、TLS 和 HTTP，就用 <code>curl -v</code> 和 <code>openssl s_client</code>。请求到底有没有到服务器、有没有回源，要看服务器和 CDN 的日志。</p>
<p>导出 HAR 前要注意，里面有 Cookie 和令牌，分享前要脱敏。</p>
<h2>常见追问</h2>
<p><strong>为什么 JS 拿不到失败的具体原因？</strong></p>
<blockquote>
<p>浏览器对网络错误和跨源错误，只给脚本一个笼统的 <code>TypeError</code>，免得泄露跨源信息。细节只能在 DevTools 里看。</p>
</blockquote>
<p><strong>请求一直 <code>(pending)</code> 不结束？</strong></p>
<blockquote>
<p>可能是服务器没响应，可能是连接数满了（HTTP/1.1 下同一域名大约 6 个），也可能是一个流式响应还在进行中。</p>
</blockquote>`};export{e as default};