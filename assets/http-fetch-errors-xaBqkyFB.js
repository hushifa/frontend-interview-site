var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p><code>fetch()</code> 返回的 Promise，只要收到了 HTTP 响应就会成功，哪怕状态码是 404 或 500。在 fetch 看来，服务器回了话，请求就算完成了。</p>
<p>它只在拿不到可用响应时才失败：网络断了、DNS 解析失败、被 CORS 或 CSP 拦住、被 <code>AbortController</code> 取消。这时会抛 <code>TypeError</code> 或者 <code>AbortError</code>。</p>
<p>所以判断 HTTP 是否成功，要看 <code>response.ok</code>，它在状态码是 200 到 299 时为 <code>true</code>。不成功就自己抛错。</p>
<p>还要注意，读正文是另一个会失败的地方。<code>response.json()</code> 遇到不是 JSON 的正文会报错，而且正文只能读一次。</p>
</blockquote>
<h2>先看 404 时 fetch 拿到的是什么</h2>
<p>下面直接构造一个 404 响应，看看它的样子。这段可以在 Node 18 以上运行。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> response = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Response</span>(<span class="hljs-string">&#x27;Not Found&#x27;</span>, { <span class="hljs-attr">status</span>: <span class="hljs-number">404</span> });
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(response.<span class="hljs-property">ok</span>, response.<span class="hljs-property">status</span>); <span class="hljs-comment">// false 404</span>
</code></pre></div>
<p>这个对象就是 404 时 <code>fetch</code> 交给你的东西。它是个正常的 <code>Response</code>，Promise 照样兑现，只是 <code>ok</code> 为 <code>false</code>。代码里如果只写了 <code>try...catch</code>，没检查 <code>ok</code>，就会把错误页当成功数据去处理。</p>
<h2>一个完整的封装</h2>
<p>所以实际项目里一般会包一层，把三类失败分开：HTTP 错误、取消或超时、网络和解析失败。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">getJSON</span>(<span class="hljs-params">url, { signal } = {}</span>) {
  <span class="hljs-keyword">const</span> response = <span class="hljs-keyword">await</span> <span class="hljs-title function_">fetch</span>(url, { signal });

  <span class="hljs-keyword">if</span> (!response.<span class="hljs-property">ok</span>) {
    <span class="hljs-keyword">const</span> text = <span class="hljs-keyword">await</span> response.<span class="hljs-title function_">text</span>();
    <span class="hljs-keyword">const</span> error = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">\`HTTP <span class="hljs-subst">\${response.status}</span>\`</span>);
    error.<span class="hljs-property">status</span> = response.<span class="hljs-property">status</span>;
    error.<span class="hljs-property">body</span> = text;
    <span class="hljs-keyword">throw</span> error;
  }

  <span class="hljs-keyword">if</span> (response.<span class="hljs-property">status</span> === <span class="hljs-number">204</span>) <span class="hljs-keyword">return</span> <span class="hljs-literal">null</span>;
  <span class="hljs-keyword">return</span> response.<span class="hljs-title function_">json</span>();
}

<span class="hljs-keyword">const</span> controller = <span class="hljs-keyword">new</span> <span class="hljs-title class_">AbortController</span>();
<span class="hljs-keyword">const</span> timer = <span class="hljs-built_in">setTimeout</span>(<span class="hljs-function">() =&gt;</span> controller.<span class="hljs-title function_">abort</span>(), <span class="hljs-number">8000</span>);

<span class="hljs-keyword">try</span> {
  <span class="hljs-keyword">const</span> data = <span class="hljs-keyword">await</span> <span class="hljs-title function_">getJSON</span>(<span class="hljs-string">&#x27;/api/items&#x27;</span>, { <span class="hljs-attr">signal</span>: controller.<span class="hljs-property">signal</span> });
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(data);
} <span class="hljs-keyword">catch</span> (error) {
  <span class="hljs-keyword">if</span> (error.<span class="hljs-property">name</span> === <span class="hljs-string">&#x27;AbortError&#x27;</span>) {
    <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;已取消或超时&#x27;</span>);
  } <span class="hljs-keyword">else</span> <span class="hljs-keyword">if</span> (error.<span class="hljs-property">status</span>) {
    <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;服务器返回错误&#x27;</span>, error.<span class="hljs-property">status</span>);
  } <span class="hljs-keyword">else</span> {
    <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;网络或解析失败&#x27;</span>, error);
  }
} <span class="hljs-keyword">finally</span> {
  <span class="hljs-built_in">clearTimeout</span>(timer);
}
</code></pre></div>
<p><code>!response.ok</code> 时先把正文读成文本存起来，因为后端的错误信息往往在正文里。204 表示没有正文，直接调 <code>json()</code> 会报错，所以单独处理。</p>
<p>超时也可以不自己写定时器，直接用 <code>AbortSignal.timeout(8000)</code>。这时超时抛出的错误名是 <code>TimeoutError</code>，不是 <code>AbortError</code>，判断时要注意。</p>
<h2>为什么正文只能读一次</h2>
<p><code>Response</code> 的正文是一个流，叫 <code>ReadableStream</code>，数据读走就没了。读过一次以后 <code>bodyUsed</code> 变成 <code>true</code>，再读就会失败。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> ok = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Response</span>(<span class="hljs-string">&#x27;{&quot;a&quot;:1}&#x27;</span>);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-keyword">await</span> ok.<span class="hljs-title function_">json</span>()); <span class="hljs-comment">// { a: 1 }</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(ok.<span class="hljs-property">bodyUsed</span>); <span class="hljs-comment">// true</span>
<span class="hljs-keyword">try</span> {
  <span class="hljs-keyword">await</span> ok.<span class="hljs-title function_">text</span>();
} <span class="hljs-keyword">catch</span> (error) {
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(error.<span class="hljs-property">name</span>); <span class="hljs-comment">// TypeError</span>
}
</code></pre></div>
<p>真需要读两次，比如一份给日志、一份给业务，就在读之前先调 <code>response.clone()</code>。</p>
<h2>常见追问</h2>
<p><strong>为什么 CORS 错误拿不到具体原因？</strong></p>
<blockquote>
<p>浏览器故意不把跨源失败的细节告诉脚本，免得泄露别的站点的信息。具体原因只能在 DevTools 的 Network 和控制台里看。</p>
</blockquote>
<p><strong>业务错误码放在 200 响应里怎么办？</strong></p>
<blockquote>
<p>封装时同时检查 <code>response.ok</code> 和业务字段，两类错误分开处理。</p>
</blockquote>
<p><strong>axios 为什么 404 会进 catch？</strong></p>
<blockquote>
<p>axios 默认用 <code>validateStatus</code> 把 2xx 以外的状态都当错误。这是库自己的约定，不是 HTTP 的行为。</p>
</blockquote>`};export{e as default};