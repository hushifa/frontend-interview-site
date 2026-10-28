var e={answerHtml:`<h2>简答</h2>
<ul>
<li><code>controller.abort(reason)</code> 让 <code>controller.signal</code> 变为已取消并触发 <code>abort</code> 事件，监听这个 signal 的 API 自行停止。</li>
<li><code>fetch</code> 被取消后 Promise 以 <code>AbortError</code>（或传入的 reason）reject；<code>addEventListener</code> 传入 signal 后，取消时监听器被移除。</li>
<li>它不能打断正在运行的同步循环，也不会让服务端撤销已经开始执行的写操作。</li>
<li><code>AbortSignal.timeout(ms)</code> 创建超时自动取消的 signal，<code>AbortSignal.any([...])</code> 合并多个 signal。</li>
</ul>
<h2>取消过期的搜索请求</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">let</span> controller;

<span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">search</span>(<span class="hljs-params">keyword</span>) {
  controller?.<span class="hljs-title function_">abort</span>();
  controller = <span class="hljs-keyword">new</span> <span class="hljs-title class_">AbortController</span>();

  <span class="hljs-keyword">try</span> {
    <span class="hljs-keyword">const</span> response = <span class="hljs-keyword">await</span> <span class="hljs-title function_">fetch</span>(<span class="hljs-string">\`/api/search?q=<span class="hljs-subst">\${<span class="hljs-built_in">encodeURIComponent</span>(keyword)}</span>\`</span>, {
      <span class="hljs-attr">signal</span>: <span class="hljs-title class_">AbortSignal</span>.<span class="hljs-title function_">any</span>([controller.<span class="hljs-property">signal</span>, <span class="hljs-title class_">AbortSignal</span>.<span class="hljs-title function_">timeout</span>(<span class="hljs-number">5000</span>)]),
    });
    <span class="hljs-keyword">return</span> <span class="hljs-keyword">await</span> response.<span class="hljs-title function_">json</span>();
  } <span class="hljs-keyword">catch</span> (error) {
    <span class="hljs-keyword">if</span> (error.<span class="hljs-property">name</span> === <span class="hljs-string">&#x27;AbortError&#x27;</span>) <span class="hljs-keyword">return</span> <span class="hljs-literal">null</span>;
    <span class="hljs-keyword">throw</span> error;
  }
}
</code></pre></div>
<p>超时触发时错误名是 <code>TimeoutError</code>，用户主动取消是 <code>AbortError</code>，可以分开处理。</p>
<h2>让自己的函数支持取消</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">wait</span>(<span class="hljs-params">ms, { signal } = {}</span>) {
  <span class="hljs-keyword">return</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Promise</span>(<span class="hljs-function">(<span class="hljs-params">resolve, reject</span>) =&gt;</span> {
    signal?.<span class="hljs-title function_">throwIfAborted</span>();
    <span class="hljs-keyword">const</span> <span class="hljs-title function_">onAbort</span> = (<span class="hljs-params"></span>) =&gt; {
      <span class="hljs-built_in">clearTimeout</span>(timer);
      <span class="hljs-title function_">reject</span>(signal.<span class="hljs-property">reason</span>);
    };
    <span class="hljs-comment">// 正常结束时移除监听，复用同一个 signal 时不会累积</span>
    <span class="hljs-keyword">const</span> timer = <span class="hljs-built_in">setTimeout</span>(<span class="hljs-function">() =&gt;</span> {
      signal?.<span class="hljs-title function_">removeEventListener</span>(<span class="hljs-string">&#x27;abort&#x27;</span>, onAbort);
      <span class="hljs-title function_">resolve</span>();
    }, ms);
    signal?.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;abort&#x27;</span>, onAbort, { <span class="hljs-attr">once</span>: <span class="hljs-literal">true</span> });
  });
}
</code></pre></div>
<p>长时间的同步计算要在循环中主动检查 <code>signal.aborted</code> 或调用 <code>signal.throwIfAborted()</code>。</p>
<h2>不能取消的情况</h2>
<ul>
<li>请求已经到达服务端：取消只是浏览器不再等待响应。下单、支付等写操作需要用幂等键防止重试导致重复执行。</li>
<li>已经开始的同步代码。</li>
<li>不接受 signal 的第三方 API。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li>一个 controller 能重复使用吗：不能，取消后 signal 永久处于已取消状态，每次新操作要新建一个。</li>
<li>React 中的用法：在 <code>useEffect</code> 中创建 controller，清理函数里调用 <code>abort()</code>。</li>
</ul>`};export{e as default};