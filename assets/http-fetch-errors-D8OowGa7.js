var e={answerHtml:`<h2>简答</h2>
<ul>
<li><code>fetch()</code> 返回的 Promise 只要收到 HTTP 响应就会兑现，状态码是 404、500 也一样。</li>
<li>拒绝的情况是拿不到可用响应：网络错误、DNS 失败、CORS 拦截、CSP 拦截、<code>AbortController</code> 取消，此时抛 <code>TypeError</code> 或 <code>AbortError</code>。</li>
<li>要用 <code>response.ok</code>（状态码 200–299）判断 HTTP 成功，不成功时自己抛错。</li>
<li><code>response.json()</code> 也可能失败，例如正文不是 JSON；正文是流，只能读一次。</li>
</ul>
<h2>一个完整的封装</h2>
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
<p>超时也可以直接用 <code>AbortSignal.timeout(8000)</code>，超时时抛出的错误名是 <code>TimeoutError</code>。</p>
<h2>正文只能读一次</h2>
<p><code>Response</code> 的正文是 <code>ReadableStream</code>，<code>json()</code>、<code>text()</code> 读过之后 <code>bodyUsed</code> 变成 <code>true</code>，再读会拒绝。需要读两次时，先 <code>response.clone()</code>。</p>
<h2>常见追问</h2>
<ul>
<li>为什么 CORS 错误拿不到具体原因？浏览器有意不把跨源失败细节暴露给脚本，只能在 DevTools 的 Network 和控制台查看。</li>
<li>业务错误码放在 200 响应里怎么办？封装时同时检查 <code>response.ok</code> 和业务字段，两类错误分开处理。</li>
<li>axios 为什么 404 会进入 catch？axios 默认用 <code>validateStatus</code> 把 2xx 以外视为错误，这是库的约定，不是 HTTP 的行为。</li>
</ul>`};export{e as default};