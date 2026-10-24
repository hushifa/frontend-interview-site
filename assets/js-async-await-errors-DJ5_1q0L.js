var e={answerHtml:`<p>调用 <code>async</code> 函数时，函数会立刻返回一个 Promise；执行到 <code>await</code> 时，只是把当前函数后面的逻辑拆成一次后续恢复，并把控制权交还给事件循环，不会阻塞整个 JavaScript 线程。等待的 Promise 成功，<code>await</code> 表达式得到它的值；Promise 拒绝，异常会在 <code>await</code> 这一行抛出，因此可以用普通的 <code>try/catch</code> 处理。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">loadUser</span>(<span class="hljs-params">id</span>) {
  <span class="hljs-keyword">try</span> {
    <span class="hljs-keyword">const</span> response = <span class="hljs-keyword">await</span> <span class="hljs-title function_">fetch</span>(<span class="hljs-string">\`/api/users/<span class="hljs-subst">\${id}</span>\`</span>);
    <span class="hljs-keyword">if</span> (!response.<span class="hljs-property">ok</span>) <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">\`HTTP <span class="hljs-subst">\${response.status}</span>\`</span>);
    <span class="hljs-keyword">return</span> <span class="hljs-keyword">await</span> response.<span class="hljs-title function_">json</span>();
  } <span class="hljs-keyword">catch</span> (error) {
    <span class="hljs-comment">// 这里可以区分网络失败、业务错误或用户主动取消</span>
    <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">&#x27;用户信息加载失败&#x27;</span>, { <span class="hljs-attr">cause</span>: error });
  }
}
</code></pre></div>
<p>彼此独立的任务如果这样写，会一个完成后才开始下一个：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> user = <span class="hljs-keyword">await</span> <span class="hljs-title function_">loadUser</span>(id);
<span class="hljs-keyword">const</span> permissions = <span class="hljs-keyword">await</span> <span class="hljs-title function_">loadPermissions</span>(id);
</code></pre></div>
<p>如果两个请求互不依赖，可以先创建 Promise，再并行等待：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> [user, permissions] = <span class="hljs-keyword">await</span> <span class="hljs-title class_">Promise</span>.<span class="hljs-title function_">all</span>([
  <span class="hljs-title function_">loadUser</span>(id),
  <span class="hljs-title function_">loadPermissions</span>(id),
]);
</code></pre></div>
<p><code>Promise.all</code> 在任意一个任务拒绝时会尽快拒绝，但不会自动取消其他已经开始的任务；提交、搜索和上传场景需要另行考虑 <code>AbortController</code>、幂等性和过期结果。任务很多或服务端有速率限制时，不能简单地一次创建几百个 Promise，而应使用并发池或分批处理。</p>
<p>在 <code>try</code> 中，<code>return await task()</code> 会把拒绝留在当前 <code>try/catch</code> 的范围内；直接 <code>return task()</code> 则把 Promise 交给外层，当前函数已经离开 <code>try</code>。<code>finally</code> 一定会执行，其中的 <code>return</code> 或新的 <code>throw</code> 可能覆盖原来的结果，所以通常只在 <code>finally</code> 中做清理。取消客户端等待也不等于服务端写入已经撤销，写操作必须能查询状态或安全重试。</p>`};export{e as default};