var e={answerHtml:`<h2>简答</h2>
<ul>
<li>Cookie 会自动随匹配的请求发送，单个约 4KB，适合会话标识这类服务端要读取的数据。</li>
<li>localStorage 按源持久保存，同源的所有标签页共享，容量通常约 5MB。</li>
<li>sessionStorage 按源加标签页隔离，关闭标签页后清除。</li>
<li>两种 Web Storage 都是同步 API、只能存字符串，页面脚本都能读到，不要存令牌等敏感数据。</li>
</ul>
<h2>对比</h2>
<table><thead><tr><th></th><th>Cookie</th><th>localStorage</th><th>sessionStorage</th></tr></thead><tbody><tr><td>容量</td><td>单个约 4KB</td><td>通常约 5MB</td><td>通常约 5MB</td></tr><tr><td>生命周期</td><td>由 <code>Expires</code>/<code>Max-Age</code> 决定，未设置则为会话 Cookie</td><td>手动清除前一直保存</td><td>标签页关闭后清除</td></tr><tr><td>作用范围</td><td>按 Domain、Path 匹配</td><td>同源共享</td><td>同源且同一标签页</td></tr><tr><td>随请求发送</td><td>是</td><td>否</td><td>否</td></tr><tr><td>脚本可读</td><td>设置 <code>HttpOnly</code> 后不可读</td><td>可读</td><td>可读</td></tr></tbody></table>
<h2>选择建议</h2>
<ul>
<li><strong>登录会话</strong>：服务端下发 <code>HttpOnly; Secure; SameSite=Lax</code> 的 Cookie，页面脚本读不到，XSS 无法直接窃取。</li>
<li><strong>主题、语言、草稿</strong>：localStorage。</li>
<li><strong>单个标签页的流程状态</strong>：sessionStorage，例如多步表单的进度。</li>
<li><strong>大量结构化数据或二进制</strong>：IndexedDB，它是异步的，不阻塞主线程。</li>
</ul>
<h2>使用细节</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">readJSON</span>(<span class="hljs-params">key, fallback</span>) {
  <span class="hljs-keyword">try</span> {
    <span class="hljs-keyword">const</span> raw = <span class="hljs-variable language_">localStorage</span>.<span class="hljs-title function_">getItem</span>(key);
    <span class="hljs-keyword">return</span> raw === <span class="hljs-literal">null</span> ? fallback : <span class="hljs-title class_">JSON</span>.<span class="hljs-title function_">parse</span>(raw);
  } <span class="hljs-keyword">catch</span> {
    <span class="hljs-keyword">return</span> fallback;
  }
}
</code></pre></div>
<ul>
<li>写入可能抛出 <code>QuotaExceededError</code>，隐私模式或存储被禁用时也可能失败，读写都要处理异常。</li>
<li>其他同源标签页修改 localStorage 时，本页会收到 <code>storage</code> 事件，修改的那一页自己收不到。</li>
<li>sessionStorage 在&quot;复制标签页&quot;时会复制一份，之后两边互相独立。</li>
</ul>`};export{e as default};