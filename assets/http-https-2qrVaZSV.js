var e={answerHtml:`<h2>简答</h2>
<ul>
<li>机密性：内容加密，中间人看不到请求和响应的内容（能看到目标 IP，通常也能看到 SNI 里的域名）。</li>
<li>完整性：内容被篡改会被发现，运营商无法插入广告脚本。</li>
<li>身份认证：证书链证明&quot;你连接的就是这个域名的持有者&quot;，防止 DNS 劫持后的冒充。</li>
<li>TLS 1.3 完整握手只需 1 个往返；完整握手的密钥交换使用临时 Diffie-Hellman，具备前向保密（只用 PSK、不带 DHE 的会话恢复除外）：服务器私钥日后泄露，也解不开之前录下的流量。</li>
</ul>
<h2>TLS 1.3 握手</h2>
<ol>
<li>ClientHello：客户端发支持的算法，并直接附上自己的密钥共享（<code>key_share</code>）。</li>
<li>ServerHello：服务器选定算法、回自己的密钥共享，双方此时已能算出握手密钥。之后的证书、<code>CertificateVerify</code>、<code>Finished</code> 都是加密发送的。</li>
<li>客户端校验证书链和签名，发送 <code>Finished</code>，随后发送应用数据。</li>
</ol>
<p>和 TLS 1.2 对比：1.2 完整握手需要 2 个往返，证书明文传输，还允许静态 RSA 密钥交换（不具备前向保密）。1.3 删除了静态 RSA 和一批旧算法。</p>
<p>会话恢复可以用 0-RTT 在第一个包里带应用数据，但 0-RTT 数据可能被重放，只适合幂等请求。</p>
<h2>证书校验的是什么</h2>
<p>浏览器检查证书链能追溯到受信任的根、未过期、未吊销、证书上的域名与访问的域名一致。证书只证明域名控制权，钓鱼网站同样可以拿到有效证书，所以小锁图标不代表网站可信。</p>
<h2>部署注意</h2>
<ul>
<li>混合内容：HTTPS 页面加载 HTTP 脚本会被浏览器拦截，图片等被动内容会被自动升级或拦截。</li>
<li>HSTS：<code>Strict-Transport-Security</code> 让浏览器在有效期内只用 HTTPS 访问该域名，防止首次 HTTP 请求被降级劫持。</li>
<li>很多 API 只在安全上下文可用，例如 Service Worker、Web Crypto 的 <code>crypto.subtle</code>、地理位置。</li>
<li>TLS 在 CDN 或负载均衡终止时，到源站这一段需要单独加密。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li>HTTPS 慢在哪里？主要是握手往返。TLS 1.3、连接复用、会话恢复和 HTTP/3 都在减少这部分开销，加解密本身的 CPU 成本在现代硬件上很小。</li>
<li>抓包工具为什么能看到 HTTPS 内容？它在本机装了自己的根证书做中间人，浏览器因为信任了这个根证书才放行。</li>
</ul>`};export{e as default};