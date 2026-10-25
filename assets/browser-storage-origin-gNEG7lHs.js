var e={answerHtml:`<p>“前端和接口域名不一样，所以跨域了”是常见说法，但精确判断时需要区分源和站点。它们回答不同问题：源常用于脚本访问与数据隔离，站点常用于 SameSite Cookie 和隐私分区规则。</p>
<p>对于普通 HTTP/HTTPS URL，<strong>源由协议、主机名和有效端口共同决定</strong>，路径和查询参数不参与。站点则通常使用协议加可注册域来判断，不要求主机名和端口都相同。</p>
<h2>先用几个 URL 看同源</h2>
<p>以 <code>https://app.example.com/home</code> 为参照：</p>
<table><thead><tr><th>另一个地址</th><th>是否同源</th><th>原因</th></tr></thead><tbody><tr><td><code>https://app.example.com/settings?tab=1</code></td><td>是</td><td>只改变路径和查询参数</td></tr><tr><td><code>https://app.example.com:443/home</code></td><td>是</td><td>HTTPS 默认有效端口就是 443</td></tr><tr><td><code>https://app.example.com:8443/home</code></td><td>否</td><td>有效端口不同</td></tr><tr><td><code>http://app.example.com/home</code></td><td>否</td><td>协议不同</td></tr><tr><td><code>https://api.example.com/home</code></td><td>否</td><td>主机名不同</td></tr></tbody></table>
<p>开发时 <code>http://localhost:5173</code> 与 <code>http://localhost:3000</code> 也是不同源。只有一个端口变了，浏览器规则也会受到影响。</p>
<p>不要用字符串前缀或“域名中包含 example.com”判断同源。可以用 URL 解析器得到规范化的 origin，再进行精确比较：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> base = <span class="hljs-keyword">new</span> <span class="hljs-title function_">URL</span>(<span class="hljs-string">&#x27;https://app.example.com/home&#x27;</span>);
<span class="hljs-keyword">const</span> cases = [
  <span class="hljs-string">&#x27;https://app.example.com:443/settings&#x27;</span>,
  <span class="hljs-string">&#x27;https://app.example.com:8443/settings&#x27;</span>,
  <span class="hljs-string">&#x27;https://api.example.com/settings&#x27;</span>,
];

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(cases.<span class="hljs-title function_">map</span>(<span class="hljs-function">(<span class="hljs-params">address</span>) =&gt;</span> <span class="hljs-keyword">new</span> <span class="hljs-title function_">URL</span>(address).<span class="hljs-property">origin</span> === base.<span class="hljs-property">origin</span>));
</code></pre></div>
<p>输出为 <code>[true, false, false]</code>。这里仅比较普通 HTTP/HTTPS 源，不能把所有特殊协议的安全规则都简化成字符串相等。</p>
<h2>同站点比同源更宽，但也不只是“域名后两段”</h2>
<p>在现代常见的 schemeful same-site 判断中，<code>https://app.example.com</code> 与 <code>https://api.example.com</code> 通常属于同一个站点，因为协议相同，可注册域都是 example.com；它们仍然不同源。</p>
<p><code>http://app.example.com</code> 与 <code>https://app.example.com</code> 因协议不同，不能简单视为同站点。端口则通常不参与站点比较，所以同一主机的两个 HTTPS 端口可能同站但跨源。</p>
<p>可注册域的计算与公共后缀规则有关。例如 <code>co.uk</code> 是公共后缀，不能一律用“最后两段域名”作为站点。IP 地址等情况也有对应规则，自己随手 split 域名很容易判断错。</p>
<p>Cookie 的 SameSite 使用的是相关站点与请求上下文规则，不是简单比较两个 URL 的 origin。跨站嵌入、导航方式和方法也会影响 Cookie 是否发送。</p>
<h2>同源策略并不禁止所有跨源请求</h2>
<p>网页通常可以加载跨源图片、导航到外站，表单也可能向跨源地址提交。浏览器限制的重点之一是：一个源的脚本是否能读取另一个源的数据或直接操作其对象。</p>
<p>因此至少要分别问：</p>
<ol>
<li>这个资源是否允许被加载，或者这个请求是否会发出？</li>
<li>请求是否会携带相应凭据？</li>
<li>响应是否允许被当前脚本读取？</li>
</ol>
<p>CORS 为特定跨源读取提供受控许可，也会对需要预检的请求决定是否发送实际请求，但它不是源站身份认证或资源授权。服务器就算没有开放 CORS，也不能假定所有跨站写请求都到不了自己。</p>
<p>跨源图片能在 <code>&lt;img&gt;</code> 中显示，也不代表绘制到 canvas 后就能随意读取像素。跨源 iframe 能嵌入，也不表示父页面可访问其中任意 DOM。这些都是“能加载”和“能读取或操作”的区别。</p>
<h2>Cookie、Web Storage 的隔离方式并不相同</h2>
<p>localStorage、IndexedDB 等通常以源作为重要隔离维度。给接口配置 CORS，不会因此让 app.example.com 的脚本直接打开 api.example.com 的 localStorage。</p>
<p>Cookie 按自己的 Domain、Path、Secure、SameSite 等规则选择，不按端口隔离，也不能完全照搬 Web Storage 的规则。父域 Cookie 可能被发送到符合范围的多个子域，而这些子域并没有因此获得相同的 origin。</p>
<p>Path 主要控制 Cookie 在哪些请求路径发送，不是把同源应用变成互相安全隔离的独立系统。同一个源下的不可信脚本仍可能访问该源很多能力，所以把互不信任的应用放在同一源的不同路径下，需要认真评估风险。</p>
<h2>同源还不一定意味着能共享同一份状态</h2>
<p>现代浏览器为限制跨站跟踪，会对某些存储和通信能力引入顶层站点分区。</p>
<p>例如 <code>https://widget.example</code> 分别嵌入在 <code>https://shop.example</code> 和 <code>https://news.example</code> 中。两个 iframe 的 URL 可以同源，但在采用相应分区规则的环境中，它们看到的存储可能是不同分区，BroadcastChannel 等通信也可能无法互通。直接打开 widget.example 的顶层页面，又可能处于另一份分区。</p>
<p>具体涉及哪些 API、是否存在授权例外、如何受浏览器设置影响，应按目标环境核实。不能从“origin 一样”直接推导“跨所有嵌入位置共享登录和数据”。参见 <a href="https://developer.mozilla.org/en-US/docs/Web/Privacy/Guides/State_Partitioning">MDN：状态分区</a>。</p>
<h2>特殊源和跨窗口通信不要靠猜</h2>
<p><code>file:</code> 页面在不同浏览器中的源处理有差异，直接双击 HTML 不能代表真实网站部署。受 sandbox 限制的 iframe 等还可能得到不透明源，序列化成 <code>null</code>；两个都显示为 null 的不透明源，不意味着它们就是同一个可信来源。</p>
<p>新项目不应依赖已弃用的 <code>document.domain</code> 来放宽域关系，它也不能统一改变所有存储 API 的隔离规则。</p>
<p>需要跨窗口通信时，可以使用 <code>postMessage</code>，发送方指定准确的 targetOrigin，接收方核对 <code>event.origin</code>、预期窗口引用 <code>event.source</code> 和消息结构。不能为图方便永久使用 <code>*</code> 发送敏感信息，也不能把接收到了消息本身当成来源可信。</p>
<p>同源策略是浏览器提供的重要隔离机制，但 XSS 会让恶意代码进入可信源内部，CSRF 会利用请求与凭据规则，服务端也可能有权限漏洞。把这些边界分清楚，才能知道问题应该修在浏览器请求配置、资源响应头，还是服务端业务权限上。</p>`};export{e as default};