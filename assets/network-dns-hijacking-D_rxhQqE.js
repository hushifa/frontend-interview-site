var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>比如用户反馈，打开你的 App 或网站，偶尔会跳到一个陌生的广告页，或者页面角落多出一块不是你放的广告。前一种常见原因是 DNS 劫持：域名被解析成了别人的 IP，用户连上的根本不是你的服务器。后一种是传输途中被改了内容，页面走的是明文 HTTP，中间的网络设备可以随意往里插东西。</p>
<p>HTTPS 能防住大部分。TLS 有完整性校验，内容在途中被改会被发现；它还要求服务器出示这个域名的有效证书，所以就算 DNS 被劫持到假服务器，假服务器也拿不出证书，浏览器会报错，不会把它当成你的网站。可是它防不住“打不开”：解析被拦截、连接被切断时，HTTPS 只能让浏览器报错，没法让请求到达你的服务器。</p>
<p>剩下的漏洞要靠几样东西补上。HSTS 让浏览器以后只用 HTTPS 访问这个域名，防止被降级回 HTTP；DoH（RFC 8484）把 DNS 查询放进 HTTPS 里发，途中的设备看不到也改不了；App 里常用 HTTPDNS，直接通过 HTTP(S) 向解析服务查询，绕开运营商的本地 DNS。页面里引用的第三方脚本，可以用 SRI 校验哈希、用 CSP 限制能从哪里加载。</p>
<p>要注意，HSTS 只有在浏览器收到过一次这个响应头以后才生效，第一次用 HTTP 访问时仍然可能被劫持，要靠 preload 列表弥补。DoH 保护的也只是客户端到解析服务器这一段，解析服务器本身给出的结果它管不了。</p>
</blockquote>
<h2>两种劫持分别发生在哪一步</h2>
<p>打开一个网址，浏览器先把域名解析成 IP，再连上这个 IP 发请求，过程见<a href="/questions/network-dns-resolution/">《DNS 解析的过程是怎样的？》</a>。劫持就发生在这两步上。</p>
<p>DNS 劫持出在第一步。用户的查询通常发给运营商或路由器提供的本地 DNS，如果这一环返回了错误的 IP，浏览器就会老老实实连到错误的服务器上，地址栏里的域名却没有变。阿里云 HTTPDNS 的文档描述过这种现象：部分用户因为域名劫持，在使用 App 时被跳转到不良网站，或者出现卡顿、掉线。</p>
<p>运营商劫持出在第二步，也就是内容传输的路上。HTTP 是明文的，页面经过的每个网络设备都能读到内容，也能改。改了以后浏览器无从察觉，所以用户会看到页面上多出广告、脚本，或者被重定向到别的页面。</p>
<h2>HTTPS 能防住什么</h2>
<p>MDN 对 TLS 的说明里有两条和劫持直接相关。一是完整性：攻击者没法在数据传输途中偷偷修改内容而不被发现，所以往页面里插广告这种做法在 HTTPS 下行不通。二是身份认证：服务器要证明自己就是它声称的那个实体，也就是出示这个域名的有效证书，见<a href="/questions/http-https/">《HTTPS 相比 HTTP 提供了哪些保障？》</a>。</p>
<p>身份认证正好能对付 DNS 劫持。域名被解析到假服务器以后，浏览器照样会和它进行 TLS 握手，并要求它出示证书。假服务器没有你这个域名的有效证书，握手就过不去，浏览器显示证书错误，不会把假页面当成你的网站展示出来。证书校验的细节见<a href="/questions/security-https-mitm/">《HTTPS 握手中，中间人攻击是怎样被防住的？》</a>。</p>
<h2>HTTPS 防不住什么</h2>
<p>HTTPS 能保证“连上的就是你”，但保证不了“一定能连上”。DNS 被劫持时，结果是证书错误、打不开，用户照样用不了，只是不会被骗。连接被拦截、被重置也一样，TLS 不能让被挡住的请求送达。</p>
<p>另一个缺口是降级。如果用户输入的是 <code>example.com</code>，浏览器先用 HTTP 发出第一个请求，服务器再重定向到 HTTPS。这第一个明文请求在途中就能被拦下，攻击者可以不让它跳转，一直用 HTTP 和用户通信。MDN 的 HSTS 页面写明，浏览器在知道这个域名是 HSTS 站点之前加载 http 地址，这第一次请求就容易受到网络攻击。</p>
<h2>HSTS 怎样防止降级</h2>
<p>服务器在 HTTPS 响应里带上这个头：</p>
<div class="not-prose code-block"><div class="code-language">http</div><pre><code class="hljs language-http">Strict-Transport-Security: max-age=31536000; includeSubDomains
</code></pre></div>
<p>浏览器记住以后，在 <code>max-age</code> 有效期内，用户再输入 <code>http://example.com</code>，浏览器会直接改用 HTTPS，明文请求根本不会发出去。<code>includeSubDomains</code> 让这条规则也作用于所有子域名。MDN 还写明，HSTS 站点出现证书错误时，浏览器不会给用户“继续访问”的选项，所以被劫持到假服务器的时候，用户没法手动点过去。</p>
<p>HSTS 必须通过 HTTPS 下发，通过 HTTP 发送的这个头会被忽略。它的弱点在第一次访问，浏览器还没收到过这个头，仍然可能被降级，RFC 6797 把这叫作 Bootstrap MITM 漏洞。preload 列表就是为此准备的：把域名提交到浏览器内置的列表，浏览器从第一次访问起就只用 HTTPS。MDN 写明，使用 <code>preload</code> 时 <code>max-age</code> 至少要 31536000 秒（一年），并且必须带 <code>includeSubDomains</code>。</p>
<h2>DoH 和 HTTPDNS 怎样绕开被污染的解析</h2>
<p>HTTPS 能发现假服务器，但用户还是打不开页面。要让解析结果本身不被篡改，得保护 DNS 查询这一段。</p>
<p>传统 DNS 查询是明文的，途中的设备能看到问的是哪个域名，也能抢先回一个假答案。DoH 的做法是把 DNS 查询原样装进 HTTPS 请求里发给解析服务器。RFC 8484 规定，请求和响应的类型是 <code>application/dns-message</code>，查询可以用 GET，也可以用 POST：</p>
<div class="not-prose code-block"><div class="code-language">http</div><pre><code class="hljs language-http">GET /dns-query?dns=AAABAAABAAAAAAAAA3d3dwdleGFtcGxlA2NvbQAAAQAB HTTP/2
Host: dnsserver.example.net
Accept: application/dns-message
</code></pre></div>
<p>因为走的是 HTTPS，查询靠 TLS 获得完整性和机密性。RFC 8484 写明，它考虑的主要场景之一就是防止路径上的设备干扰 DNS 操作。不过它保护的是客户端和这台解析服务器之间的通信，解析服务器自己返回的结果是否可信，取决于你选的服务。</p>
<p>App 里常见的是 HTTPDNS。它不是一个标准协议，而是云厂商提供的解析服务。按阿里云文档的说法，App 集成 SDK 以后，可以绕过传统的 Local DNS，直接通过 HTTP(S) 向 HTTPDNS 服务发送查询，从而避开运营商 Local DNS 上的劫持；服务端还能直接看到客户端的出口 IP，更准确地判断地区和运营商。拿到 IP 以后，App 再用这个 IP 去连业务服务器。</p>
<h2>SRI 和 CSP 补的是哪一块</h2>
<p>前面说的都是你自己域名的连接。页面里还会引用 CDN 上的第三方脚本，如果这个 CDN 的内容被改了，HTTPS 也帮不上忙，因为浏览器和 CDN 之间的连接本身是正常的。</p>
<p>SRI（子资源完整性）让你在标签上写出文件内容的哈希，浏览器下载后自己算一遍，不一致就拒绝加载，返回网络错误：</p>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">script</span>
  <span class="hljs-attr">src</span>=<span class="hljs-string">&quot;https://cdn.example.com/lib.js&quot;</span>
  <span class="hljs-attr">integrity</span>=<span class="hljs-string">&quot;sha384-...&quot;</span>
  <span class="hljs-attr">crossorigin</span>=<span class="hljs-string">&quot;anonymous&quot;</span>&gt;</span><span class="hljs-tag">&lt;/<span class="hljs-name">script</span>&gt;</span>
</code></pre></div>
<p><code>integrity</code> 支持 <code>sha256</code>、<code>sha384</code>、<code>sha512</code> 三种前缀。跨域资源要配合 <code>crossorigin</code> 属性，因为 SRI 要求用 CORS 请求资源。</p>
<p>CSP 管的是“页面能从哪里加载资源”。MDN 写明，它主要用来防御 XSS，通过 <code>script-src</code> 等指令限定允许的脚本来源，被注入的 <code>&lt;script src=&quot;https://evil.example.com/...&quot;&gt;</code> 就加载不了；它的 <code>upgrade-insecure-requests</code> 指令还能让浏览器把页面里的 HTTP 子资源请求升级成 HTTPS。用法见<a href="/questions/sec-csp/">《CSP 的 nonce 和 hash 策略怎样写？》</a>。</p>
<h2>常见追问</h2>
<p><strong>全站上了 HTTPS，为什么还有用户反馈被劫持？</strong></p>
<blockquote>
<p>先看是哪一种现象。如果是证书错误、打不开，说明解析或连接被劫持了，HTTPS 起了作用，但请求到不了你的服务器，要从解析入手，比如 App 里接入 HTTPDNS。如果还能看到被插的广告，多半是某个环节仍然走了 HTTP，比如用户第一次访问时先发的明文请求，或者页面里有 HTTP 子资源。这时要上 HSTS，并考虑 preload，页面加上 <code>upgrade-insecure-requests</code>。</p>
</blockquote>
<p><strong>DoH 和 HTTPDNS 有什么区别？</strong></p>
<blockquote>
<p>DoH 是 IETF 的标准协议（RFC 8484），把标准的 DNS 报文放进 HTTPS 里传，浏览器和操作系统可以内置支持。HTTPDNS 是云厂商提供的服务，App 通过厂商的 SDK 或 HTTP 接口查询，拿到 IP 后自己发起连接，主要用在移动 App 里。两者的目标相同，都是绕开不可信的本地解析。</p>
</blockquote>
<p><strong>HSTS 的 max-age 设错了能撤回吗？</strong></p>
<blockquote>
<p>可以，但要用户再访问一次。MDN 写明，把 <code>max-age</code> 设成 0 就能关闭 HSTS，而且这个头只能通过 HTTPS 下发，用 HTTP 关不掉。浏览器要收到新的响应头才会更新，没再访问的用户在原来的有效期内还会强制使用 HTTPS。</p>
</blockquote>`};export{e as default};