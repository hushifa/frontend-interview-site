var e={answerHtml:`<h2>简答</h2>
<ul>
<li>安全：语义上只读，不改变服务器资源。<code>GET</code>、<code>HEAD</code>、<code>OPTIONS</code>、<code>TRACE</code> 是安全方法。</li>
<li>幂等：同一请求执行多次，对服务器的预期效果与执行一次相同。所有安全方法，加上 <code>PUT</code> 和 <code>DELETE</code> 是幂等的。</li>
<li><code>POST</code> 和 <code>PATCH</code> 都不保证幂等。网络超时后自动重试 <code>POST</code> 可能重复下单。</li>
<li>这些是协议约定，服务端必须按约定实现，用 <code>GET</code> 做删除就破坏了约定。</li>
</ul>
<h2>为什么重要</h2>
<p>浏览器、代理和客户端库会依赖这些语义：</p>
<ul>
<li>连接中断时，客户端可以自动重试幂等请求。</li>
<li>预取、爬虫和链接预览会随意访问 <code>GET</code> 链接，<code>GET</code> 带副作用会被意外触发。</li>
<li>缓存主要针对 <code>GET</code> 和 <code>HEAD</code> 的响应。</li>
</ul>
<h2>幂等指的是效果，不是响应</h2>
<p><code>DELETE /orders/1</code> 第一次返回 <code>204</code>，第二次返回 <code>404</code>，响应不同，但服务器状态一样（订单不存在），仍然是幂等的。</p>
<p><code>PUT /users/1</code> 用完整表示覆盖资源，重复执行结果相同。<code>PATCH</code> 是否幂等取决于补丁内容：<code>{&quot;name&quot;: &quot;A&quot;}</code> 是幂等的，&quot;计数加一&quot;就不是。</p>
<h2>让 POST 可以安全重试</h2>
<p>客户端生成唯一键，服务器按键去重：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> key = crypto.<span class="hljs-title function_">randomUUID</span>();

<span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">createOrder</span>(<span class="hljs-params">payload</span>) {
  <span class="hljs-keyword">return</span> <span class="hljs-title function_">fetch</span>(<span class="hljs-string">&#x27;/api/orders&#x27;</span>, {
    <span class="hljs-attr">method</span>: <span class="hljs-string">&#x27;POST&#x27;</span>,
    <span class="hljs-attr">headers</span>: {
      <span class="hljs-string">&#x27;Content-Type&#x27;</span>: <span class="hljs-string">&#x27;application/json&#x27;</span>,
      <span class="hljs-string">&#x27;Idempotency-Key&#x27;</span>: key,
    },
    <span class="hljs-attr">body</span>: <span class="hljs-title class_">JSON</span>.<span class="hljs-title function_">stringify</span>(payload),
  });
}
</code></pre></div>
<p>服务器第一次处理后保存&quot;键 → 结果&quot;，同一个键再次到达时直接返回保存的结果。<code>Idempotency-Key</code> 请求头目前仍是 IETF 草案，很多支付类 API 已经采用同名约定。</p>
<h2>常见追问</h2>
<ul>
<li><code>GET</code> 能带请求体吗？规范没有定义 <code>GET</code> 请求体的语义，很多服务器和代理会忽略或拒绝，不要依赖。</li>
<li>表单为什么只支持 <code>GET</code> 和 <code>POST</code>？HTML 表单的 <code>method</code> 只定义了这两个值（加上用于对话框的 <code>dialog</code>），其他方法要用 <code>fetch</code>。</li>
</ul>`};export{e as default};