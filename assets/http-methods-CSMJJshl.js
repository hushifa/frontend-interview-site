var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>安全的意思是只读，不改服务器上的资源。<code>GET</code>、<code>HEAD</code>、<code>OPTIONS</code>、<code>TRACE</code> 都是安全方法。</p>
<p>幂等的意思是同一个请求发一次和发十次，对服务器的效果一样。所有安全方法都是幂等的，另外 <code>PUT</code> 和 <code>DELETE</code> 也是。</p>
<p>这两个概念有用，是因为浏览器、代理和客户端库会依赖它们。比如网络断了，客户端敢自动重试幂等请求；可是 <code>POST</code> 和 <code>PATCH</code> 不保证幂等，超时后自动重试 <code>POST</code>，可能就下了两次单。</p>
<p>要注意，这些是协议约定，得服务端按约定去实现。拿 <code>GET</code> 去做删除，就破坏了约定。</p>
</blockquote>
<h2>为什么这些约定很重要</h2>
<p>很多工具会默认相信这些语义。连接中断时，客户端可以自动重试幂等请求，因为多发一次也没关系。</p>
<p>预取、爬虫和聊天软件的链接预览会随手访问 <code>GET</code> 链接。如果某个 <code>GET</code> 链接有副作用，比如“点一下就删除”，它可能被这些工具意外触发。</p>
<p>缓存也主要只针对 <code>GET</code> 和 <code>HEAD</code> 的响应。</p>
<h2>幂等看的是效果，不是响应</h2>
<p>很多人会把幂等理解成“每次返回的结果一样”，这是不对的。</p>
<p>比如 <code>DELETE /orders/1</code>，第一次返回 <code>204</code>，第二次返回 <code>404</code>。响应不同，但服务器的状态一样，订单都不存在了，所以它仍然是幂等的。</p>
<p><code>PUT /users/1</code> 是用完整的内容覆盖资源，重复执行结果一样。<code>PATCH</code> 是否幂等要看补丁内容：<code>{&quot;name&quot;: &quot;A&quot;}</code> 发几次结果都是 A，是幂等的；“计数加一”每发一次就多一，就不是。</p>
<h2>怎样让 POST 也能安全重试</h2>
<p>办法是让客户端给这次操作生成一个唯一的键，叫幂等键，服务器按键去重。</p>
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
<p>注意 <code>key</code> 是在函数外面生成的，重试时用的是同一个键。服务器第一次处理后把“键 → 结果”存起来，同一个键再来，就直接返回存好的结果，不会再下一次单。</p>
<p><code>Idempotency-Key</code> 这个请求头目前还是 IETF 草案，不过很多支付类 API 已经在用同名的约定。</p>
<h2>常见追问</h2>
<p><strong><code>GET</code> 能带请求体吗？</strong></p>
<blockquote>
<p>规范没有定义 <code>GET</code> 请求体的含义，很多服务器和代理会忽略或拒绝它，所以不要依赖。</p>
</blockquote>
<p><strong>表单为什么只支持 <code>GET</code> 和 <code>POST</code>？</strong></p>
<blockquote>
<p>HTML 表单的 <code>method</code> 只定义了这两个值，再加一个对话框用的 <code>dialog</code>。其他方法要用 <code>fetch</code> 发。</p>
</blockquote>`};export{e as default};