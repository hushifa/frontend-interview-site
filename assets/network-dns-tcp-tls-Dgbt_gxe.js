var e={answerHtml:`<p>打开一个页面时，用户等待的不只有“服务器生成 HTML”这一段。浏览器可能先解析域名，再寻找可用连接，建立 TLS 保护，最后才发送 HTTP 请求。某些阶段可以被缓存或复用，某些阶段会因网络、代理和协议版本重新发生。</p>
<p>把所有时间都归为“后端慢”会导致错误优化。反过来，也不能把浏览器开发者工具中的每一段时间机械地解释成一个服务器函数。</p>
<h2>DNS 解决的是名称到地址的发现</h2>
<p>浏览器需要把 <code>app.example.com</code> 解析成可连接的地址。结果可能来自浏览器缓存、操作系统缓存、本地网络或递归 DNS 服务；缓存命中时不一定发生完整的递归查询。</p>
<p>一个域名可能对应多个地址，解析结果还可能受 TTL、网络位置、IPv4/IPv6 能力和服务端策略影响。DNS 解析成功只说明得到候选地址，不代表目标端口可连接，也不代表后续 TLS 证书匹配。</p>
<p><code>dns-prefetch</code> 可以尝试提前解析来源；它不建立 TCP 或 QUIC 连接，也不下载资源。若请求本来就会很快发出、DNS 已经缓存或来源最终没有使用，提示收益可能接近于零，甚至增加额外网络活动。</p>
<h2>TCP 或 QUIC 负责建立传输路径</h2>
<p>传统 HTTP/1.1 和 HTTP/2 通常基于 TCP。TCP 建立连接后，双方还要处理拥塞控制、丢包恢复和流量控制。TCP 是可靠的有序字节流，但它不理解 HTTP 请求边界。</p>
<p>HTTP/3 使用 QUIC，通常承载在 UDP 之上；QUIC 自己提供可靠流、拥塞控制和 TLS 1.3 集成。不能把“UDP”直接理解成正文不可靠，也不能把 HTTP/3 当成所有请求都没有等待的开关。</p>
<p>连接可以复用。浏览器对同一个来源已有可用 HTTP/2 或 HTTP/3 连接时，新请求可能不需要重新建立传输和 TLS；不同主机名、端口、代理路径和连接状态会改变复用条件。一个页面引用很多第三方来源，仍可能需要多组连接。</p>
<h2>TLS 负责保护和验证连接</h2>
<p>HTTPS 建立 TLS 会话时，客户端要验证证书和主机名，并协商后续保护应用数据的密钥。证书验证成功不代表业务接口授权成功，也不代表返回内容本身可信。</p>
<p>常见 HTTPS 等待包括连接准备、TLS 握手和最终 HTTP 请求。会话恢复、连接复用和协议版本可以减少部分往返，但首次访问、代理、证书链和网络策略仍会影响结果。0-RTT 等能力还涉及重放风险，不能把所有写操作都当成适合早期数据。</p>
<p>TLS 可能在 CDN、负载均衡器或反向代理处终止。浏览器到 CDN 的连接安全，不自动证明 CDN 到源站的下一段连接也使用了同样的保护；部署时要分段检查。</p>
<h2>Timing API 的字段不是万能诊断答案</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> entry = performance.<span class="hljs-title function_">getEntriesByType</span>(<span class="hljs-string">&#x27;navigation&#x27;</span>)[<span class="hljs-number">0</span>];
<span class="hljs-keyword">if</span> (entry) {
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">table</span>({
    <span class="hljs-attr">dns</span>: entry.<span class="hljs-property">domainLookupEnd</span> - entry.<span class="hljs-property">domainLookupStart</span>,
    <span class="hljs-attr">tcp</span>: entry.<span class="hljs-property">connectEnd</span> - entry.<span class="hljs-property">connectStart</span>,
    <span class="hljs-attr">tls</span>: entry.<span class="hljs-property">secureConnectionStart</span> &gt; <span class="hljs-number">0</span>
      ? entry.<span class="hljs-property">connectEnd</span> - entry.<span class="hljs-property">secureConnectionStart</span>
      : <span class="hljs-literal">null</span>,
    <span class="hljs-attr">requestToFirstByte</span>: entry.<span class="hljs-property">responseStart</span> - entry.<span class="hljs-property">requestStart</span>,
  });
}
</code></pre></div>
<p>这些差值只能描述当前导航条目记录到的阶段时间。DNS 或 TCP 为 0 可能表示连接复用、缓存或信息不可用，不应解释成“这一阶段永远没有成本”。<code>secureConnectionStart</code> 为 0 也可能与非 HTTPS 或复用有关。</p>
<p>资源条目可以进一步查看不同来源，但浏览器安全策略、跨源 Timing-Allow-Origin 和隐私限制可能减少可见细节。开发者工具的瀑布、服务器日志、CDN 日志和真实用户数据要结合分析，不能只看一个字段归因。</p>
<h2>preconnect 应该只给确定会使用的来源</h2>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">link</span> <span class="hljs-attr">rel</span>=<span class="hljs-string">&quot;preconnect&quot;</span> <span class="hljs-attr">href</span>=<span class="hljs-string">&quot;https://fonts.example.com&quot;</span> <span class="hljs-attr">crossorigin</span>&gt;</span>
</code></pre></div>
<p>preconnect 让浏览器有机会提前完成适用的 DNS、传输和安全连接准备；它不下载字体，也不能保证后续请求一定复用。<code>crossorigin</code> 应匹配后续请求的凭据模式，否则已经准备的连接可能无法按预期使用。</p>
<p>对很多低概率第三方来源预连接会占用连接、CPU 和网络资源，还可能提前暴露访问意图。首屏只需要一个来源时，不应把所有分析、广告和未来页面来源都放进模板。</p>
<h2>常见排查方式和错误归因</h2>
<p>如果 DNS 时间高，先检查缓存、域名配置、递归服务和网络位置；不要先给页面加更多 JavaScript。若连接时间高，检查连接复用、协议版本、代理和网络丢包。若 TLS 阶段失败，检查证书链、主机名、系统时间和终止代理；忽略证书校验只是隐藏问题。</p>
<p>如果请求已经复用连接，新增 preconnect 不会创造明显收益；如果真正瓶颈在服务器处理或响应体下载，优化 DNS 也不会缩短那段等待。跨源字体、图片和接口还要分别检查 CORS、CSP、Cookie 与缓存策略。</p>
<p>不同协议的连接并非都能由前端 fetch 代码直接选择。浏览器会根据服务端能力、ALPN、网络和实现策略协商 HTTP 版本；应用应从服务端和实际 Network 协议列验证，而不是把“启用 HTTP/3”写成客户端 API 参数。</p>
<p>优化网络连接时应看冷缓存和热缓存、移动网络、IPv4/IPv6、重定向、代理和真实设备。最终目标是减少关键资源到达和可交互前的等待，而不是让每个握手阶段的数字都看起来为零。</p>`};export{e as default};