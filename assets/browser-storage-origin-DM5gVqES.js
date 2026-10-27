var e={answerHtml:`<h2>先判断到底是哪一种“相同”</h2>
<p>以 <code>https://app.example.com/home</code> 为例，Origin 由协议、主机名和有效端口组成，路径和查询参数不参与：</p>
<table><thead><tr><th>地址</th><th>是否同源</th><th>原因</th></tr></thead><tbody><tr><td><code>https://app.example.com/settings</code></td><td>是</td><td>路径不同不影响 origin</td></tr><tr><td><code>https://app.example.com:443/home</code></td><td>是</td><td>HTTPS 默认端口是 443</td></tr><tr><td><code>https://app.example.com:8443/home</code></td><td>否</td><td>端口不同</td></tr><tr><td><code>http://app.example.com/home</code></td><td>否</td><td>协议不同</td></tr><tr><td><code>https://api.example.com/home</code></td><td>否</td><td>主机名不同</td></tr></tbody></table>
<p><code>http://localhost:5173</code> 和 <code>http://localhost:3000</code> 也是不同源。应使用 URL 解析器比较 <code>origin</code>，不能靠字符串前缀或“最后两段域名”判断。公共后缀如 <code>co.uk</code> 也使简单 split 规则失效。</p>
<h2>site 比 origin 更宽，但用途不同</h2>
<p>在常见 schemeful same-site 规则下，<code>https://app.example.com</code> 和 <code>https://api.example.com</code> 通常属于同一个 site，因为协议和可注册域相同；它们仍然不同源。<code>http</code> 与 <code>https</code> 的协议差异也会影响 site 判断，端口通常不参与 site 比较。</p>
<p>SameSite Cookie 看的是请求上下文和站点关系，不是简单比较 origin。跨站嵌入、导航方式和请求方法都会影响 Cookie 是否发送。不要因为两个子域同站，就以为脚本可以直接读取对方的 Storage。</p>
<h2>同源策略限制的是读取和对象访问</h2>
<p>跨源图片、脚本、字体和导航可能可以加载，表单也可能发出跨源写请求；但一个源的脚本通常不能直接读取另一个源的响应内容或操作其 DOM。判断跨域问题时至少分三步：</p>
<ol>
<li>请求或资源能否发出/加载？</li>
<li>请求是否携带凭据？</li>
<li>响应是否允许当前脚本读取？</li>
</ol>
<p>CORS 只为特定跨源读取提供响应许可，不是认证系统，也不是服务端授权。服务器没有开放 CORS，不代表所有跨站写请求都不会到达；CSRF 防护仍然需要独立设计。</p>
<p>跨源图片可以显示，但画到 canvas 后可能污染画布，无法读取像素。跨源 iframe 可以嵌入，也不代表父页面能访问其中 DOM。加载和读取是两种不同能力。</p>
<h2>Cookie 和 Web Storage 的隔离规则不同</h2>
<p><code>localStorage</code>、IndexedDB 和大多数脚本存储以 origin 作为重要隔离维度。给 API 配置 CORS，不会让 <code>app.example.com</code> 的脚本直接访问 <code>api.example.com</code> 的 Storage。</p>
<p>Cookie 按 Domain、Path、Secure、SameSite 和请求上下文决定是否发送，不按端口隔离。父域 Cookie 可能被发送到多个子域，但这不会让子域拥有相同的 origin。Path 只是请求匹配条件，不是安全边界；同源下的不可信脚本仍可能访问该源的其他能力。</p>
<h2>同源也可能遇到存储分区</h2>
<p>现代浏览器会为了减少跨站跟踪，对嵌入上下文的存储和通信按顶层站点分区。例如同一个 <code>widget.example</code> 分别嵌入 <code>shop.example</code> 和 <code>news.example</code> 时，两个 iframe 的 URL 可以同源，但看到的 Storage、Cookie 或 BroadcastChannel 可能属于不同分区。</p>
<p>直接打开 widget 作为顶层页面，得到的分区也可能不同。是否有授权例外、哪些 API 受影响，要按目标浏览器和部署环境核对。不能从“origin 一样”推出“所有嵌入位置共享登录状态”。</p>
<h2>跨窗口通信要验证来源和消息</h2>
<p>需要跨源窗口通信时使用 <code>postMessage</code>，发送方指定准确的 <code>targetOrigin</code>，接收方同时检查 <code>event.origin</code>、预期的 <code>event.source</code> 和消息结构：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-variable language_">window</span>.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;message&#x27;</span>, <span class="hljs-function">(<span class="hljs-params">event</span>) =&gt;</span> {
  <span class="hljs-keyword">if</span> (event.<span class="hljs-property">origin</span> !== <span class="hljs-string">&#x27;https://app.example.com&#x27;</span>) <span class="hljs-keyword">return</span>;
  <span class="hljs-keyword">if</span> (event.<span class="hljs-property">source</span> !== expectedWindow) <span class="hljs-keyword">return</span>;
  <span class="hljs-keyword">if</span> (event.<span class="hljs-property">data</span>?.<span class="hljs-property">type</span> !== <span class="hljs-string">&#x27;theme-change&#x27;</span>) <span class="hljs-keyword">return</span>;
  <span class="hljs-title function_">applyTheme</span>(event.<span class="hljs-property">data</span>.<span class="hljs-property">value</span>);
});
</code></pre></div>
<p>为了方便长期使用 <code>*</code> 发送敏感信息，或者只因为消息格式正确就信任来源，都会扩大风险。<code>file:</code>、sandbox iframe 的不透明 origin 和废弃的 <code>document.domain</code> 也不能用直觉推断。</p>
<p>同源策略不能修复 XSS、CSRF 和服务端权限漏洞。把问题归类为“能否请求、能否读取、能否操作、谁有权限”，才能选择正确的响应头、客户端策略或服务端修复。</p>`};export{e as default};