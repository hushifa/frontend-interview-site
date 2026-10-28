var e={answerHtml:`<h2>简答</h2>
<ul>
<li><code>all</code>：全部成功时按输入顺序返回结果数组；任一拒绝立刻拒绝。适合&quot;缺一不可&quot;。</li>
<li><code>allSettled</code>：等全部敲定，返回 <code>{ status, value | reason }</code> 数组，自身不会拒绝。适合批量操作后汇总成败。</li>
<li><code>race</code>：跟随第一个敲定的 Promise，成功失败都算。常用于超时竞争。</li>
<li><code>any</code>：第一个成功即成功；全部失败时以 <code>AggregateError</code> 拒绝，<code>errors</code> 按输入顺序保存原因。适合多源择优。</li>
<li>空输入：<code>all</code>、<code>allSettled</code> 立即以 <code>[]</code> 成功，<code>any</code> 立即以 <code>AggregateError</code> 拒绝，<code>race</code> 永远挂起。</li>
</ul>
<h2>对比示例</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">compare</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">const</span> tasks = [
    <span class="hljs-title class_">Promise</span>.<span class="hljs-title function_">reject</span>(<span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">&#x27;A失败&#x27;</span>)),
    <span class="hljs-title class_">Promise</span>.<span class="hljs-title function_">resolve</span>(<span class="hljs-string">&#x27;B成功&#x27;</span>),
  ];

  <span class="hljs-keyword">try</span> {
    <span class="hljs-keyword">await</span> <span class="hljs-title class_">Promise</span>.<span class="hljs-title function_">all</span>(tasks);
  } <span class="hljs-keyword">catch</span> (error) {
    <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">\`all:<span class="hljs-subst">\${error.message}</span>\`</span>); <span class="hljs-comment">// all:A失败</span>
  }

  <span class="hljs-keyword">const</span> settled = <span class="hljs-keyword">await</span> <span class="hljs-title class_">Promise</span>.<span class="hljs-title function_">allSettled</span>(tasks);
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(settled.<span class="hljs-title function_">map</span>(<span class="hljs-function"><span class="hljs-params">item</span> =&gt;</span> item.<span class="hljs-property">status</span>).<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;,&#x27;</span>)); <span class="hljs-comment">// rejected,fulfilled</span>
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(settled.<span class="hljs-title function_">map</span>(<span class="hljs-function"><span class="hljs-params">item</span> =&gt;</span>
    item.<span class="hljs-property">status</span> === <span class="hljs-string">&#x27;fulfilled&#x27;</span> ? item.<span class="hljs-property">value</span> : item.<span class="hljs-property">reason</span>.<span class="hljs-property">message</span>,
  ).<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;|&#x27;</span>)); <span class="hljs-comment">// A失败|B成功</span>

  <span class="hljs-keyword">try</span> {
    <span class="hljs-keyword">await</span> <span class="hljs-title class_">Promise</span>.<span class="hljs-title function_">race</span>(tasks);
  } <span class="hljs-keyword">catch</span> (error) {
    <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">\`race:<span class="hljs-subst">\${error.message}</span>\`</span>); <span class="hljs-comment">// race:A失败</span>
  }

  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">\`any:<span class="hljs-subst">\${<span class="hljs-keyword">await</span> <span class="hljs-built_in">Promise</span>.any(tasks)}</span>\`</span>); <span class="hljs-comment">// any:B成功</span>
}

<span class="hljs-title function_">compare</span>();
</code></pre></div>
<h2>组合方法不负责的事</h2>
<ul>
<li><strong>启动</strong>：传进去时请求已经发出。<code>Promise.all(urls.map(fetch))</code> 会同时发出全部请求，需要限流时用并发池，见<a href="/questions/alg-concurrency-pool/">《怎样实现有明确失败语义的异步并发池？》</a>。</li>
<li><strong>取消</strong>：<code>all</code> 拒绝或 <code>race</code> 超时后，其余任务仍在运行。需要停止时给每个任务传同一个 <code>AbortSignal</code>，在失败时调用 <code>controller.abort()</code>。</li>
<li><strong>未处理拒绝</strong>：<code>all</code> 拒绝后，其余 Promise 再拒绝不会触发 <code>unhandledrejection</code>，因为组合方法已经给它们挂了处理器。</li>
</ul>
<h2>超时写法</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">withTimeout</span>(<span class="hljs-params">promise, ms</span>) {
  <span class="hljs-keyword">return</span> <span class="hljs-title class_">Promise</span>.<span class="hljs-title function_">race</span>([
    promise,
    <span class="hljs-keyword">new</span> <span class="hljs-title class_">Promise</span>(<span class="hljs-function">(<span class="hljs-params">_, reject</span>) =&gt;</span>
      <span class="hljs-built_in">setTimeout</span>(<span class="hljs-function">() =&gt;</span> <span class="hljs-title function_">reject</span>(<span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">&#x27;超时&#x27;</span>)), ms)),
  ]);
}
</code></pre></div>
<p>更好的写法是让底层请求也停止：<code>fetch(url, { signal: AbortSignal.timeout(ms) })</code>。</p>
<h2>常见追问</h2>
<ul>
<li><code>all</code> 返回的结果顺序？按输入顺序，与完成先后无关。</li>
<li>输入里有非 Promise 值怎么办？会被 <code>Promise.resolve</code> 包装，当作已成功。</li>
<li><code>any</code> 和 <code>race</code> 的区别？<code>race</code> 被第一个失败打断，<code>any</code> 会忽略失败继续等成功。</li>
</ul>`};export{e as default};