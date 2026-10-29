var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>一个网址的“源”由三部分组成：协议、主机、端口。三样都一样，才算同源。<code>https://app.example.com</code> 和 <code>https://api.example.com</code> 主机不同，就不是同源。</p>
<p>“站点”的范围更大，只看协议和可注册域，也叫 eTLD+1，比如 <code>example.com</code>。端口不看，子域不同也算同站点，所以上面那两个网址是同站点。平时说的“跨域”，一般指的是跨源。</p>
<p>同源策略限制的是：脚本读取跨源资源的内容、访问跨源窗口的 DOM、读取别的源的存储。</p>
<p>要注意不同机制用的是不同的边界。Cookie 的 <code>SameSite</code>、浏览器的进程隔离按“站点”划分；CORS、localStorage、IndexedDB 按“源”划分。</p>
</blockquote>
<h2>先看几个例子</h2>
<p>以 <code>https://app.example.com</code> 为基准：</p>
<table><thead><tr><th>URL</th><th>同源</th><th>同站点</th></tr></thead><tbody><tr><td><code>https://app.example.com/path</code></td><td>是</td><td>是</td></tr><tr><td><code>https://api.example.com</code></td><td>否，主机不同</td><td>是</td></tr><tr><td><code>https://app.example.com:8443</code></td><td>否，端口不同</td><td>是</td></tr><tr><td><code>http://app.example.com</code></td><td>否，协议不同</td><td>否，协议不同</td></tr><tr><td><code>https://example.org</code></td><td>否</td><td>否</td></tr></tbody></table>
<p>路径不影响源。浏览器里每个 URL 都有 <code>origin</code> 属性，只包含协议、主机和端口，可以在 Node 里直接验证：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> base = <span class="hljs-keyword">new</span> <span class="hljs-title function_">URL</span>(<span class="hljs-string">&#x27;https://app.example.com&#x27;</span>);
<span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> url <span class="hljs-keyword">of</span> [<span class="hljs-string">&#x27;https://app.example.com/path&#x27;</span>, <span class="hljs-string">&#x27;https://api.example.com&#x27;</span>, <span class="hljs-string">&#x27;https://app.example.com:8443&#x27;</span>, <span class="hljs-string">&#x27;http://app.example.com&#x27;</span>]) {
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(url, <span class="hljs-keyword">new</span> <span class="hljs-title function_">URL</span>(url).<span class="hljs-property">origin</span> === base.<span class="hljs-property">origin</span>);
}
<span class="hljs-comment">// https://app.example.com/path true</span>
<span class="hljs-comment">// https://api.example.com false</span>
<span class="hljs-comment">// https://app.example.com:8443 false</span>
<span class="hljs-comment">// http://app.example.com false</span>
</code></pre></div>
<h2>可注册域是怎么算的</h2>
<p>你可能会想，那 <code>a.github.io</code> 和 <code>b.github.io</code> 是不是同站点？不是。可注册域是按公共后缀列表（Public Suffix List）算的，<code>github.io</code> 在这个列表里，地位和 <code>.com</code> 一样。所以 <code>a.github.io</code> 和 <code>b.github.io</code> 的可注册域分别是它们自己，属于不同站点。</p>
<h2>同源策略到底拦什么</h2>
<p>它拦的是“读”。脚本用 <code>fetch</code> 请求跨源地址，响应内容读不到，除非服务端用 CORS 头授权。跨源 iframe 或者 <code>window.open</code> 打开的窗口，它的 DOM 和大部分属性访问不了。其他源的 localStorage、IndexedDB 和 Cookie 也读不到，其中 Cookie 按域和路径的规则来。</p>
<p>可是它不拦“加载”和“提交”。<code>&lt;img&gt;</code>、<code>&lt;script&gt;</code>、<code>&lt;link&gt;</code> 照样能加载跨源资源，表单也能提交到跨源地址。正因为表单能跨源提交，还会自动带上 Cookie，才有了 CSRF 攻击。</p>
<h2>常见追问</h2>
<p><strong>还能用 <code>document.domain</code> 放宽同源限制吗？</strong></p>
<blockquote>
<p>不要再依赖它。现代浏览器默认禁止通过修改 <code>document.domain</code> 来放宽同源检查。</p>
</blockquote>
<p><strong>跨源的两个窗口怎样安全地通信？</strong></p>
<blockquote>
<p>用 <code>postMessage</code>。接收方一定要校验 <code>event.origin</code>，确认消息来自信任的源。跨站 iframe 为什么会放到独立进程，见<a href="/questions/browser-process-model/">《浏览器为什么要拆分进程？前端如何理解故障隔离边界？》</a>。</p>
</blockquote>`};export{e as default};