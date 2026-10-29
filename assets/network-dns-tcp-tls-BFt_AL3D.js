var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>浏览器要和一个新域名通信，得先过三关才能发 HTTP 请求。</p>
<p>第一关是 DNS，把域名查成 IP。浏览器或系统有缓存时几乎不花时间，没有就得去问递归解析器，可能多出几十到上百毫秒。第二关是 TCP 三次握手，1 个往返。第三关是 TLS 握手，TLS 1.3 再加 1 个往返，TLS 1.2 是 2 个。所以 HTTPS 新连接在发请求前，至少要等 2 个往返。</p>
<p>HTTP/3 用的 QUIC 把传输和加密握手合并成 1 个往返，恢复连接时还能 0-RTT。</p>
<p>前端能做的，就是让这些等待少发生、发生得早：复用连接、用 <code>preconnect</code> 提前建连、用 CDN 让用户就近接入。</p>
</blockquote>
<h2>怎么把每一段量出来</h2>
<p>浏览器在 Navigation Timing 里记录了每一段的开始和结束时间，相减就是耗时：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> [nav] = performance.<span class="hljs-title function_">getEntriesByType</span>(<span class="hljs-string">&#x27;navigation&#x27;</span>);

<span class="hljs-keyword">const</span> dns = nav.<span class="hljs-property">domainLookupEnd</span> - nav.<span class="hljs-property">domainLookupStart</span>;
<span class="hljs-keyword">const</span> tcp = nav.<span class="hljs-property">secureConnectionStart</span> &gt; <span class="hljs-number">0</span>
  ? nav.<span class="hljs-property">secureConnectionStart</span> - nav.<span class="hljs-property">connectStart</span>
  : nav.<span class="hljs-property">connectEnd</span> - nav.<span class="hljs-property">connectStart</span>;
<span class="hljs-keyword">const</span> tls = nav.<span class="hljs-property">secureConnectionStart</span> &gt; <span class="hljs-number">0</span> ? nav.<span class="hljs-property">connectEnd</span> - nav.<span class="hljs-property">secureConnectionStart</span> : <span class="hljs-number">0</span>;
<span class="hljs-keyword">const</span> ttfb = nav.<span class="hljs-property">responseStart</span> - nav.<span class="hljs-property">requestStart</span>;

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">table</span>({ dns, tcp, tls, ttfb, <span class="hljs-attr">protocol</span>: nav.<span class="hljs-property">nextHopProtocol</span> });
</code></pre></div>
<p>TCP 这一段为什么要分情况算？因为 <code>connectEnd - connectStart</code> 把 TLS 也包含进去了。HTTPS 连接里，TLS 从 <code>secureConnectionStart</code> 开始，所以 TCP 要截到这里为止；HTTP 连接没有 TLS，<code>secureConnectionStart</code> 是 0，就直接用整段。</p>
<p>读数据时还有几点要知道。连接被复用时 <code>connectStart</code> 和 <code>connectEnd</code> 相等，DNS 和连接耗时都是 0，这是好事。HTTP/3 下传输和加密握手是合在一起的，再分成 TCP 和 TLS 看就没意义了。跨源资源如果没返回 <code>Timing-Allow-Origin</code> 头，这些字段在 Resource Timing 里都是 0。</p>
<h2>为什么往返时间才是关键</h2>
<p>握手的耗时，大约等于往返次数乘以 RTT。RTT 就是一个包从浏览器到服务器再回来要多久。</p>
<p>手机在 4G 下 RTT 可能是 50 到 100 毫秒，跨洲访问可能超过 200 毫秒。这时光 2 个往返就要几百毫秒，服务器再快也没用。</p>
<p>所以减少往返次数（复用连接、HTTP/3、TLS 1.3），和缩短 RTT（用 CDN 边缘节点让服务器离用户近一点），比优化服务器 CPU 有效得多。</p>
<h2>前端能做什么</h2>
<p>首先是少用新域名。首屏依赖的每个第三方域名，都要单独走一遍这三关。</p>
<p>对关键的第三方域名用 <code>preconnect</code>，可能用到的用 <code>dns-prefetch</code>，见<a href="/questions/network-dns-prefetch-preconnect/">《dns-prefetch、preconnect 和 preload 应该怎样选择？》</a>。</p>
<p>静态资源尽量和页面同域，或者统一走一个 CDN 域名，这样 HTTP/2 能复用同一条连接。</p>
<h2>常见追问</h2>
<p><strong>DNS 能在前端缓存吗？</strong></p>
<blockquote>
<p>不能直接控制。它由浏览器和操作系统按 DNS 记录的 TTL 缓存。</p>
</blockquote>
<p><strong>为什么本地测不出差别？</strong></p>
<blockquote>
<p>本地 RTT 很低，又有各种缓存。要看真实用户数据，或者在 DevTools 里模拟慢网。</p>
</blockquote>`};export{e as default};