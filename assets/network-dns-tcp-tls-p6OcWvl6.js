var e={answerHtml:`<h2>简答</h2>
<ul>
<li>DNS：把域名解析为 IP。命中浏览器或系统缓存时几乎为 0，否则要问递归解析器，可能多出几十到上百毫秒。</li>
<li>TCP：三次握手，1 个往返。</li>
<li>TLS 1.3：再加 1 个往返（TLS 1.2 是 2 个）。HTTPS 新连接在发出请求前至少等待 2 个往返。</li>
<li>HTTP/3 的 QUIC 把传输和加密握手合并为 1 个往返，恢复连接时可以 0-RTT。</li>
<li>连接复用、<code>preconnect</code> 和 CDN 就近接入都在减少这些等待。</li>
</ul>
<h2>用时间戳拆分</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> [nav] = performance.<span class="hljs-title function_">getEntriesByType</span>(<span class="hljs-string">&#x27;navigation&#x27;</span>);

<span class="hljs-keyword">const</span> dns = nav.<span class="hljs-property">domainLookupEnd</span> - nav.<span class="hljs-property">domainLookupStart</span>;
<span class="hljs-keyword">const</span> tcp = nav.<span class="hljs-property">secureConnectionStart</span> &gt; <span class="hljs-number">0</span>
  ? nav.<span class="hljs-property">secureConnectionStart</span> - nav.<span class="hljs-property">connectStart</span>
  : nav.<span class="hljs-property">connectEnd</span> - nav.<span class="hljs-property">connectStart</span>;
<span class="hljs-keyword">const</span> tls = nav.<span class="hljs-property">secureConnectionStart</span> &gt; <span class="hljs-number">0</span> ? nav.<span class="hljs-property">connectEnd</span> - nav.<span class="hljs-property">secureConnectionStart</span> : <span class="hljs-number">0</span>;
<span class="hljs-keyword">const</span> ttfb = nav.<span class="hljs-property">responseStart</span> - nav.<span class="hljs-property">requestStart</span>;

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">table</span>({ dns, tcp, tls, ttfb, <span class="hljs-attr">protocol</span>: nav.<span class="hljs-property">nextHopProtocol</span> });
</code></pre></div>
<ul>
<li><code>connectEnd - connectStart</code> 包含 TLS，所以 TCP 段要截到 <code>secureConnectionStart</code>。</li>
<li>连接复用时 <code>connectStart</code> 和 <code>connectEnd</code> 相等，DNS 和连接耗时为 0。</li>
<li>HTTP/3 下传输和加密握手合在一起，按 TCP 和 TLS 分开解读没有意义。</li>
<li>跨源资源没有 <code>Timing-Allow-Origin</code> 时，这些字段在 Resource Timing 里为 0。</li>
</ul>
<h2>往返时间才是关键</h2>
<p>握手耗时约等于往返次数乘以 RTT。手机在 4G 下 RTT 可能是 50–100ms，跨洲访问可能超过 200ms，这时 2 个往返就要几百毫秒。所以减少往返（复用连接、HTTP/3、TLS 1.3）和缩短 RTT（CDN 边缘节点）比优化服务器 CPU 更有效。</p>
<h2>前端能做什么</h2>
<ul>
<li>减少首屏依赖的第三方域名数量，每个新域名都要一套握手。</li>
<li>对关键第三方域名用 <code>preconnect</code>，可能用到的用 <code>dns-prefetch</code>，见《dns-prefetch、preconnect 和 preload 应该怎样选择？》。</li>
<li>静态资源尽量和页面同域或走同一个 CDN 域名，便于 HTTP/2 连接复用。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li>DNS 能在前端缓存吗？不能直接控制，由浏览器和操作系统按 TTL 缓存。</li>
<li>为什么本地测不出差别？本地 RTT 很低且有缓存，要用真实用户数据或在 DevTools 中模拟慢网。</li>
</ul>`};export{e as default};