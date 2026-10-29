var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>你在咖啡馆连了攻击者开的 Wi-Fi，访问 <code>https://bank.example</code>。攻击者能截住你发出的每个包，于是他假装自己是银行服务器，和你握手；同时再以你的身份和真正的银行握手，在中间转发并偷看数据。这就是中间人攻击。</p>
<p>HTTPS 靠证书和签名防住它。服务器在握手里发出证书，再用证书对应的私钥给整段握手内容签名（<code>CertificateVerify</code>）。浏览器检查三件事：证书链能一级级追到系统或浏览器信任的根 CA；证书上的域名和地址栏里的域名一致；签名能用证书里的公钥验证通过。攻击者拿不到银行的私钥，自己签的证书又追不到受信任的根，或者域名对不上，浏览器就会报证书错误、终止连接。</p>
<p>剩下的漏洞在“还没开始 HTTPS”的时候。用户输入 <code>bank.example</code> 时浏览器可能先发 HTTP 请求，攻击者可以拦下这一跳，一直用 HTTP 跟用户通信，这叫 SSL 剥离。HSTS 让浏览器记住“这个域名只用 HTTPS”，之后连 HTTP 请求都不发；首次访问的空档再用 HSTS 预加载列表补上。</p>
<p>要注意，这套防护的前提是信任的根 CA 没出问题。公司电脑或抓包工具装了自己的根证书，它签出的证书浏览器也会接受，这时中间人就能看到内容。</p>
</blockquote>
<h2>中间人想做什么，卡在哪一步</h2>
<p>先看攻击者的位置。他能看到、修改、丢弃你和服务器之间的所有包，所以加密本身挡不住他。如果没有身份验证，他和你协商一把密钥、再和服务器协商另一把，两头都“加密”了，他在中间解开再加密，双方都发现不了。</p>
<p>所以关键是浏览器要确认：跟我协商密钥的这个人，真的是 <code>bank.example</code> 的持有者。TLS 1.3 的做法是，服务器发出 <code>Certificate</code> 以后，紧跟着发 <code>CertificateVerify</code>。RFC 8446 说，它是“用 Certificate 消息里公钥对应的私钥，对整个握手做的签名”。接着发 <code>Finished</code>，它是对整个握手计算的 MAC，用来确认双方看到的握手内容一致、密钥一致。</p>
<p>攻击者这时有两条路，都走不通。第一条，把银行的真证书原样转发给你。可是他没有银行的私钥，签不出能用这张证书的公钥验证通过的 <code>CertificateVerify</code>。第二条，换成自己的证书。他有自己的私钥，签名能过，可是这张证书要么不是受信任的 CA 签发的，要么上面的域名不是 <code>bank.example</code>，正规 CA 不会给他签别人的域名。</p>
<h2>浏览器怎样校验证书</h2>
<p>证书链校验是在问“这张证书是谁担保的”。网站证书由中间 CA 签名，中间 CA 的证书再由根 CA 签名，根证书预装在操作系统或浏览器里。浏览器用上一级的公钥验证下一级的签名，一直验到一个自己信任的根，同时检查有效期和吊销状态。</p>
<p>主机名校验是在问“这张证书是给谁的”。证书里的 SAN（主题备用名称）列出它适用的域名，浏览器拿你访问的域名去比。RFC 9525 规定按标签逐段、不区分大小写比较；通配符只能占最左边一整段，并且只匹配一段，所以 <code>*.example.com</code> 能匹配 <code>www.example.com</code>，匹配不了 <code>a.b.example.com</code>，也匹配不了 <code>example.com</code>。</p>
<p>两步缺一不可。只验证书链不验域名，攻击者用自己合法申请的 <code>evil.example</code> 证书就能冒充任何网站。</p>
<h2>证书错误为什么不能点“继续访问”</h2>
<p>浏览器报证书错误时，很多用户会点“仍然继续”。这一下就把前面的防护全部作废了。</p>
<p>RFC 6797 把这叫做“点击通过的不安全”。启用 HSTS 以后，规范要求浏览器遇到任何安全传输错误或警告都直接终止连接，并且不给用户绕过的选项。MDN 也写明，之后连接这个主机时，浏览器不会让用户绕过证书无效这类错误。</p>
<h2>SSL 剥离和 HSTS</h2>
<p>证书校验只在 HTTPS 连接里起作用。MDN 给出过一个典型场景：用户第一次访问 <code>http://example.com/</code>，浏览器还不知道它要 HTTPS，于是先走明文 HTTP，服务器回 301 跳转到 HTTPS。攻击者如果拦下这次 HTTP 请求，不让跳转发生，自己去和服务器走 HTTPS，再用 HTTP 把内容转给用户，用户的浏览器就根本不会做证书校验。</p>
<p>服务器在 HTTPS 响应里加上这个头：</p>
<div class="not-prose code-block"><div class="code-language">http</div><pre><code class="hljs language-http">Strict-Transport-Security: max-age=31536000; includeSubDomains
</code></pre></div>
<p>浏览器记住以后，在 <code>max-age</code> 秒内，所有指向这个域名的 <code>http://</code> 地址都会在本地改写成 <code>https://</code> 再发出，攻击者就没有明文请求可拦了。<code>includeSubDomains</code> 把规则扩展到所有子域名。这个头只有通过 HTTPS 收到才算数，RFC 6797 要求浏览器忽略 HTTP 响应里的 HSTS 头，否则攻击者也能伪造或删掉它。</p>
<p>第一次访问之前浏览器还没收到这个头，仍然有空档。解决办法是 HSTS 预加载：把域名提交到浏览器内置的列表里，浏览器出厂就知道它只能用 HTTPS。按 MDN 的说明，用 <code>preload</code> 时 <code>max-age</code> 至少一年，并且必须带 <code>includeSubDomains</code>。HTTPS 本身提供的保障和部署要点，见<a href="/questions/http-https/">《HTTPS 相比 HTTP 提供了哪些保障？》</a>。</p>
<h2>常见追问</h2>
<p><strong>Charles、Fiddler 这类抓包工具为什么能解开 HTTPS？</strong></p>
<blockquote>
<p>它们就是一个中间人，只不过事先让你在电脑或手机上安装并信任了它的根证书。它给每个网站现场签一张证书，证书链能追到这个“受信任”的根，浏览器就放行了。所以安装根证书等于把查看全部 HTTPS 流量的权限交了出去。</p>
</blockquote>
<p><strong>攻击者从 CA 那里骗到了一张别人域名的证书怎么办？</strong></p>
<blockquote>
<p>这是证书体系本身的风险。按 MDN 的说明，Chrome 要求公开信任的证书附带证书透明度（CT）日志的记录，域名所有者可以监控有没有人给自己的域名签了证书，发现后要求吊销。另外可以用 DNS 的 CAA 记录（RFC 8659）声明哪些 CA 可以给自己的域名签发证书，这条记录由 CA 在签发前检查。</p>
</blockquote>
<p><strong>TLS 怎样防止攻击者把版本降级到更旧、更弱的协议？</strong></p>
<blockquote>
<p>TLS 1.3 的 <code>Finished</code> 消息覆盖了整个握手，中间被改过的协商内容会让校验失败。RFC 8446 还专门设计了降级保护：支持 TLS 1.3 的服务器如果协商出了更低的版本，会在 <code>ServerHello</code> 的随机数末尾放入固定标记，支持 1.3 的客户端看到就会中止握手。</p>
</blockquote>`};export{e as default};