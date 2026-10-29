var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>一个请求可能经过好几层缓存，比如 CDN 边缘节点、回源用的中间层。Cache-Status 让每一层都在响应上追加一条记录，顺序是从离源站最近的那层，到离用户最近的那层。</p>
<p>每条记录说明这一层做了什么。<code>hit</code> 表示直接用缓存回答了；<code>fwd</code> 表示转给了上游，并写明原因，比如 <code>uri-miss</code> 是没有副本，<code>stale</code> 是副本过期，<code>vary-miss</code> 是 Vary 对不上，<code>bypass</code> 是配置要求绕过。</p>
<p>还有几个参数常用：<code>fwd-status</code> 是上游回的状态码，<code>ttl</code> 是还剩多少新鲜时间，<code>stored</code> 表示这次响应有没有存下来，<code>key</code> 能显示缓存键。</p>
<p>要注意，它只是诊断信息，不保证每层都写。真正决定缓存行为的是 <code>Cache-Control</code>，而 <code>Age</code> 只说明副本在缓存里待了多久。</p>
</blockquote>
<h2>读懂一个例子</h2>
<div class="not-prose code-block"><div class="code-language">http</div><pre><code class="hljs language-http">Cache-Status: OriginShield; fwd=stale; fwd-status=304; stored, EdgePOP; hit; ttl=120
</code></pre></div>
<p>逗号分开的是两层缓存，靠前的离源站近。<code>OriginShield</code> 这一层发现副本过期了，就去源站验证，源站回了 <code>304</code>，这一层把副本更新后存了下来。<code>EdgePOP</code> 是离用户最近的边缘节点，它直接命中，副本还有 120 秒新鲜期。</p>
<p>只看 <code>Age</code>，你只知道副本存了多久，看不出是哪一层命中的、为什么回了源。</p>
<h2>能用它排查哪些问题</h2>
<table><thead><tr><th>现象</th><th>关注的参数</th></tr></thead><tbody><tr><td>发版后用户仍拿到旧内容</td><td>哪一层是 <code>hit</code>、<code>ttl</code> 还剩多少</td></tr><tr><td>命中率低</td><td><code>fwd=uri-miss</code> 是否频繁，<code>key</code> 是否包含了不该有的查询参数或头</td></tr><tr><td>不同语言内容串了</td><td><code>fwd=vary-miss</code> 是否出现，<code>Vary</code> 是否设置</td></tr><tr><td>本应缓存却没缓存</td><td><code>stored</code> 缺失，结合 <code>detail</code> 找原因</td></tr></tbody></table>
<p>比如命中率低，常见原因是缓存键里混进了追踪参数，每个用户的 URL 都不一样。这时看 <code>key</code>，就能直接看出来。</p>
<h2>用的时候有哪些限制</h2>
<p>首先，得 CDN 或代理实现了这个头才有。很多厂商目前还只提供自己的私有头。</p>
<p>其次，<code>key</code> 和 <code>detail</code> 可能暴露内部结构。生产环境可以只对带调试标记的请求返回，或者在边缘节点把它去掉。</p>
<p>最后，浏览器自己的缓存不会写 Cache-Status。浏览器有没有命中，要看 DevTools 的 Size 列，显示 memory cache 或 disk cache 就是命中了。</p>
<h2>常见追问</h2>
<p><strong>和 <code>Age</code> 有什么区别？</strong></p>
<blockquote>
<p><code>Age</code> 只说明副本存在多久，不说明是哪一层命中、为什么转发。</p>
</blockquote>
<p><strong>和 <code>Server-Timing</code> 有什么区别？</strong></p>
<blockquote>
<p><code>Server-Timing</code> 报告服务端各环节的耗时，前端可以通过 Resource Timing 读到。Cache-Status 报告的是缓存做了什么决定。</p>
</blockquote>`};export{e as default};