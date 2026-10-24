var e={answerHtml:`<p><code>dns-prefetch</code> 只提示浏览器提前解析域名；<code>preconnect</code> 还可以提前建立连接，可能包含 TCP 与 TLS 握手；<code>preload</code> 则是告诉浏览器当前页面很快需要某个具体资源，并要求正确填写 <code>as</code>、<code>crossorigin</code> 等属性。</p>
<p>它们解决的阶段不同。对确实会访问的第三方域名，可以少量使用 <code>preconnect</code>；只希望低成本提前解析时使用 <code>dns-prefetch</code>。<code>preload</code> 适合首屏确定需要、但浏览器从 HTML 结构不容易及时发现的资源，例如关键字体或脚本。预加载错误资源会抢占带宽，反而拖慢真正关键内容。</p>
<p>还要注意跨源字体和模块脚本的凭据模式必须与实际请求一致，否则预加载可能无法复用，形成重复请求。最终应结合浏览器 Network 面板和性能指标验证，不要看到标签存在就认为一定提速。</p>
<h2>常见追问</h2>
<ul>
<li><code>preconnect</code> 不能替代缓存、压缩和合理的资源加载顺序。</li>
<li>第三方域名很多时不应全部预连接；连接本身也消耗浏览器和网络资源。</li>
</ul>`};export{e as default};