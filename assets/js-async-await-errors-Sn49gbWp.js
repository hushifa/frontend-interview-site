var e={answerHtml:`<h2>简答</h2>
<ul>
<li>async 函数调用时同步执行到第一个 <code>await</code>，然后返回一个 Promise；<code>return</code> 的值使它兑现，<code>throw</code> 使它拒绝。</li>
<li><code>await</code> 后面的代码总是在微任务中恢复，即使等待的是普通值。</li>
<li>在 <code>try</code> 里写 <code>return await p</code>，<code>p</code> 的拒绝才会进入本地 <code>catch</code>；直接 <code>return p</code> 会让拒绝绕过本地 <code>catch</code>，交给调用方。</li>
<li>先启动再统一等待是并行（<code>Promise.all([a(), b()])</code>），逐个 <code>await a(); await b()</code> 是串行。</li>
<li><code>fetch</code> 遇到 404、500 不会拒绝，要检查 <code>response.ok</code>。</li>
</ul>
<h2>执行顺序</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;调用前&#x27;</span>);

<span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">task</span>(<span class="hljs-params"></span>) {
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;函数内&#x27;</span>);
  <span class="hljs-keyword">await</span> <span class="hljs-number">42</span>;
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;恢复&#x27;</span>);
  <span class="hljs-keyword">return</span> <span class="hljs-number">7</span>;
}

<span class="hljs-keyword">const</span> promise = <span class="hljs-title function_">task</span>();
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;调用后&#x27;</span>);
promise.<span class="hljs-title function_">then</span>(<span class="hljs-function"><span class="hljs-params">value</span> =&gt;</span> <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(value));
<span class="hljs-comment">// 输出顺序：调用前 → 函数内 → 调用后 → 恢复 → 7</span>
</code></pre></div>
<p><code>await</code> 暂停的是这个函数的执行，线程继续执行调用方的同步代码。第一个 <code>await</code> 之前的耗时计算仍会阻塞调用方。</p>
<h2>return 与 return await</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">failLater</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">return</span> <span class="hljs-title class_">Promise</span>.<span class="hljs-title function_">reject</span>(<span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">&#x27;任务失败&#x27;</span>));
}

<span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">directReturn</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">try</span> {
    <span class="hljs-keyword">return</span> <span class="hljs-title function_">failLater</span>();
  } <span class="hljs-keyword">catch</span> {
    <span class="hljs-keyword">return</span> <span class="hljs-string">&#x27;当前函数已捕获&#x27;</span>;
  }
}

<span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">awaitedReturn</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">try</span> {
    <span class="hljs-keyword">return</span> <span class="hljs-keyword">await</span> <span class="hljs-title function_">failLater</span>();
  } <span class="hljs-keyword">catch</span> {
    <span class="hljs-keyword">return</span> <span class="hljs-string">&#x27;当前函数已捕获&#x27;</span>;
  }
}

<span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">demonstrate</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">const</span> direct = <span class="hljs-keyword">await</span> <span class="hljs-title function_">directReturn</span>().<span class="hljs-title function_">catch</span>(<span class="hljs-function"><span class="hljs-params">error</span> =&gt;</span> <span class="hljs-string">\`外层接到：<span class="hljs-subst">\${error.message}</span>\`</span>);
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(direct); <span class="hljs-comment">// 外层接到：任务失败</span>
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-keyword">await</span> <span class="hljs-title function_">awaitedReturn</span>()); <span class="hljs-comment">// 当前函数已捕获</span>
}

<span class="hljs-title function_">demonstrate</span>();
</code></pre></div>
<p><code>finally</code> 也一样：直接 <code>return p</code> 时，<code>finally</code> 会在 <code>p</code> 完成之前运行，需要资源保留到任务结束就要 <code>return await</code>。不在 <code>try</code> 中时，两种写法效果相同。</p>
<h2>串行与并行</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">loadUser</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">return</span> { <span class="hljs-attr">id</span>: <span class="hljs-number">1</span> };
}

<span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">loadPermissions</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">return</span> [<span class="hljs-string">&#x27;read&#x27;</span>];
}

<span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">initialize</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">const</span> [user, permissions] = <span class="hljs-keyword">await</span> <span class="hljs-title class_">Promise</span>.<span class="hljs-title function_">all</span>([
    <span class="hljs-title function_">loadUser</span>(),
    <span class="hljs-title function_">loadPermissions</span>(),
  ]);
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">\`<span class="hljs-subst">\${user.id}</span>:<span class="hljs-subst">\${permissions.join(<span class="hljs-string">&#x27;,&#x27;</span>)}</span>\`</span>); <span class="hljs-comment">// 1:read</span>
}

<span class="hljs-title function_">initialize</span>();
</code></pre></div>
<p>两个函数在构造数组时就都已调用，<code>Promise.all</code> 只负责等待。注意：</p>
<ul>
<li>有依赖关系（需要 <code>user.id</code>）的请求只能串行。</li>
<li>先 <code>const a = loadA(); const b = loadB();</code> 再分别 <code>await a; await b;</code> 时，如果 <code>b</code> 在 <code>await a</code> 期间拒绝，会先触发未处理拒绝警告。并行任务应立即交给 <code>Promise.all</code> 或 <code>allSettled</code>。</li>
<li>任务很多时一次全部启动可能压垮服务，需要并发池。</li>
<li><code>Promise.all</code> 失败后其他任务仍在运行，要停止它们需传入 <code>AbortSignal</code>。</li>
</ul>
<h2>请求的错误层次</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">getJson</span>(<span class="hljs-params">url, signal</span>) {
  <span class="hljs-keyword">const</span> response = <span class="hljs-keyword">await</span> <span class="hljs-title function_">fetch</span>(url, { signal });
  <span class="hljs-keyword">if</span> (!response.<span class="hljs-property">ok</span>) {
    <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">\`HTTP <span class="hljs-subst">\${response.status}</span>\`</span>);
  }
  <span class="hljs-keyword">try</span> {
    <span class="hljs-keyword">return</span> <span class="hljs-keyword">await</span> response.<span class="hljs-title function_">json</span>();
  } <span class="hljs-keyword">catch</span> (error) {
    <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">&#x27;响应不是合法 JSON&#x27;</span>, { <span class="hljs-attr">cause</span>: error });
  }
}
</code></pre></div>
<p>网络失败、用户取消（<code>AbortError</code>）、HTTP 错误、解析错误、业务校验失败应分别处理，<code>cause</code> 保留原始错误。</p>
<h2>常见追问</h2>
<ul>
<li>顶层 <code>await</code> 能用在哪里？ES 模块顶层，以及浏览器控制台；经典脚本和 CommonJS 不行。</li>
<li><code>await</code> 一个 thenable 会怎样？会调用它的 <code>then</code> 方法，按其结果恢复。</li>
<li>同步错误、定时器回调错误和全局兜底，见<a href="/questions/js-errors-event-handling/">《同步错误、Promise 拒绝和全局异常应该怎样处理？》</a>。</li>
</ul>`};export{e as default};