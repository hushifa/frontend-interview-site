var e={answerHtml:`<h2>简答</h2>
<ul>
<li>每个缓存在响应上追加一个成员，顺序从离源站最近的缓存到离用户最近的缓存。</li>
<li><code>hit</code> 表示直接用缓存应答；<code>fwd</code> 表示转发给了上游，并给出原因，如 <code>uri-miss</code>（没有副本）、<code>stale</code>（副本过期）、<code>vary-miss</code>（Vary 不匹配）、<code>bypass</code>（配置绕过）。</li>
<li><code>fwd-status</code> 是上游返回的状态码，<code>ttl</code> 是剩余新鲜时间，<code>stored</code> 表示这次响应是否被存下，<code>key</code> 可以暴露缓存键。</li>
<li>它是诊断信息，不保证每层都写；<code>Cache-Control</code> 决定缓存行为，<code>Age</code> 只说明副本在缓存里待了多久。</li>
</ul>
<h2>读一个例子</h2>
<div class="not-prose code-block"><div class="code-language">http</div><pre><code class="hljs language-http">Cache-Status: OriginShield; fwd=stale; fwd-status=304; stored, EdgePOP; hit; ttl=120
</code></pre></div>
<ul>
<li><code>OriginShield</code> 发现副本过期，向源站验证，源站回 <code>304</code>，副本被更新并存储。</li>
<li><code>EdgePOP</code> 直接命中，还有 120 秒新鲜期。</li>
</ul>
<h2>用它排查的问题</h2>
<table><thead><tr><th>现象</th><th>关注的参数</th></tr></thead><tbody><tr><td>发版后用户仍拿到旧内容</td><td>哪一层是 <code>hit</code>、<code>ttl</code> 还剩多少</td></tr><tr><td>命中率低</td><td><code>fwd=uri-miss</code> 是否频繁，<code>key</code> 是否包含了不该有的查询参数或头</td></tr><tr><td>不同语言内容串了</td><td><code>fwd=vary-miss</code> 是否出现，<code>Vary</code> 是否设置</td></tr><tr><td>本应缓存却没缓存</td><td><code>stored</code> 缺失，结合 <code>detail</code> 找原因</td></tr></tbody></table>
<h2>使用限制</h2>
<ul>
<li>需要 CDN 或代理实现了该头，很多厂商仍只提供私有头。</li>
<li>生产环境暴露 <code>key</code>、<code>detail</code> 可能泄露内部结构，可以只对带调试标记的请求返回，或在边缘剥离。</li>
<li>浏览器缓存不会写 Cache-Status，浏览器是否命中缓存要看 DevTools 的 Size 列（memory cache、disk cache）。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li>和 <code>Age</code> 有什么区别？<code>Age</code> 说明副本存在多久，不说明哪一层命中、为什么转发。</li>
<li>和 <code>Server-Timing</code> 有什么区别？<code>Server-Timing</code> 报告服务端耗时，可被 Resource Timing 读取；Cache-Status 报告缓存决策。</li>
</ul>`};export{e as default};