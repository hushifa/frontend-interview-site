var e={answerHtml:`<h2>简答</h2>
<ul>
<li>源（origin）由协议、主机、端口三部分组成，三者都相同才是同源。</li>
<li>站点（site）由协议和可注册域（eTLD+1）组成，不包含端口，子域不同也算同站点。</li>
<li>同源策略限制脚本读取跨源资源的内容、访问跨源窗口的 DOM，以及读取跨源存储。</li>
<li>Cookie 的 <code>SameSite</code>、浏览器的进程隔离按&quot;站点&quot;划分；CORS、localStorage、IndexedDB 按&quot;源&quot;划分。</li>
</ul>
<h2>例子</h2>
<p>以 <code>https://app.example.com</code> 为基准：</p>
<table><thead><tr><th>URL</th><th>同源</th><th>同站点</th></tr></thead><tbody><tr><td><code>https://app.example.com/path</code></td><td>是</td><td>是</td></tr><tr><td><code>https://api.example.com</code></td><td>否，主机不同</td><td>是</td></tr><tr><td><code>https://app.example.com:8443</code></td><td>否，端口不同</td><td>是</td></tr><tr><td><code>http://app.example.com</code></td><td>否，协议不同</td><td>否，协议不同</td></tr><tr><td><code>https://example.org</code></td><td>否</td><td>否</td></tr></tbody></table>
<p>可注册域依据公共后缀列表（Public Suffix List）计算。<code>github.io</code> 在列表里，所以 <code>a.github.io</code> 和 <code>b.github.io</code> 是不同站点。</p>
<h2>同源策略限制什么</h2>
<ul>
<li>脚本读取跨源 <code>fetch</code> 的响应内容，除非服务端用 CORS 头授权。</li>
<li>访问跨源 iframe 或 <code>window.open</code> 打开窗口的 DOM 和大部分属性。</li>
<li>读取其他源的 localStorage、IndexedDB 和 Cookie（Cookie 按域和路径规则）。</li>
</ul>
<p>它不限制：<code>&lt;img&gt;</code>、<code>&lt;script&gt;</code>、<code>&lt;link&gt;</code> 加载跨源资源，表单提交到跨源地址。这也是 CSRF 存在的原因。</p>
<h2>常见追问</h2>
<ul>
<li><code>document.domain</code> 还能用吗：现代浏览器默认禁用修改 <code>document.domain</code> 来放宽同源检查，不要再依赖它。</li>
<li>跨源窗口怎样安全通信：用 <code>postMessage</code>，接收方校验 <code>event.origin</code>。</li>
<li>为什么跨站 iframe 会放到独立进程，见《浏览器为什么要拆分进程？前端如何理解故障隔离边界？》。</li>
</ul>`};export{e as default};