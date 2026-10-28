var e={answerHtml:`<h2>简答</h2>
<ul>
<li>AsyncLocalStorage 在异步调用链中传递上下文，常用于请求 ID、用户信息和日志关联。</li>
<li>run(store, fn) 中启动的所有异步操作都能用 getStore() 读到同一个 store。</li>
<li>上下文按异步调用链隔离，不同请求互不影响。</li>
<li>Node.js 24 起默认用 AsyncContextFrame 实现，开销更低。</li>
</ul>
<p>一个 BFF 同时处理数百个请求，日志需要带上请求 ID、租户和 trace 信息。如果把这些值放在模块级变量里，并发请求会互相覆盖；如果每层函数都手动传参，漏传一层就会丢失关联。<code>AsyncLocalStorage</code> 可以在 Node.js 异步调用链中保存一份上下文，让深层日志读取当前请求的数据。</p>
<h2>在请求入口建立上下文</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">import</span> http <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;node:http&#x27;</span>;
<span class="hljs-keyword">import</span> { randomUUID } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;node:crypto&#x27;</span>;
<span class="hljs-keyword">import</span> { <span class="hljs-title class_">AsyncLocalStorage</span> } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;node:async_hooks&#x27;</span>;

<span class="hljs-keyword">const</span> storage = <span class="hljs-keyword">new</span> <span class="hljs-title class_">AsyncLocalStorage</span>();

<span class="hljs-keyword">const</span> server = http.<span class="hljs-title function_">createServer</span>(<span class="hljs-function">(<span class="hljs-params">request, response</span>) =&gt;</span> {
  <span class="hljs-keyword">const</span> context = {
    <span class="hljs-comment">// 示例生成内部标识，不直接信任客户端自报的请求 ID。</span>
    <span class="hljs-attr">requestId</span>: <span class="hljs-title function_">randomUUID</span>(),
    <span class="hljs-attr">method</span>: request.<span class="hljs-property">method</span>,
  };

  storage.<span class="hljs-title function_">run</span>(context, <span class="hljs-title function_">async</span> () =&gt; {
    <span class="hljs-keyword">try</span> {
      <span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;请求开始&#x27;</span>);
      <span class="hljs-keyword">await</span> <span class="hljs-title function_">handleRequest</span>(request);
      response.<span class="hljs-title function_">setHeader</span>(<span class="hljs-string">&#x27;Content-Type&#x27;</span>, <span class="hljs-string">&#x27;application/json; charset=utf-8&#x27;</span>);
      response.<span class="hljs-title function_">end</span>(<span class="hljs-title class_">JSON</span>.<span class="hljs-title function_">stringify</span>({ <span class="hljs-attr">requestId</span>: storage.<span class="hljs-title function_">getStore</span>().<span class="hljs-property">requestId</span> }));
    } <span class="hljs-keyword">catch</span> (error) {
      <span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;请求失败&#x27;</span>, { <span class="hljs-attr">kind</span>: <span class="hljs-string">&#x27;request-error&#x27;</span> });
      response.<span class="hljs-property">statusCode</span> = <span class="hljs-number">500</span>;
      response.<span class="hljs-title function_">end</span>(<span class="hljs-string">&#x27;error&#x27;</span>);
    }
  });
});

<span class="hljs-keyword">function</span> <span class="hljs-title function_">log</span>(<span class="hljs-params">message, extra = {}</span>) {
  <span class="hljs-keyword">const</span> context = storage.<span class="hljs-title function_">getStore</span>();
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">JSON</span>.<span class="hljs-title function_">stringify</span>({ ...extra, message, <span class="hljs-attr">requestId</span>: context?.<span class="hljs-property">requestId</span> }));
}

<span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">handleRequest</span>(<span class="hljs-params">request</span>) {
  <span class="hljs-keyword">const</span> idBefore = storage.<span class="hljs-title function_">getStore</span>().<span class="hljs-property">requestId</span>;
  <span class="hljs-comment">// 固定的两条路径让请求完成顺序不同，便于观察并发隔离。</span>
  <span class="hljs-keyword">await</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Promise</span>(<span class="hljs-function">(<span class="hljs-params">resolve</span>) =&gt;</span> <span class="hljs-built_in">setTimeout</span>(resolve, request.<span class="hljs-property">url</span> === <span class="hljs-string">&#x27;/slow&#x27;</span> ? <span class="hljs-number">40</span> : <span class="hljs-number">5</span>));
  <span class="hljs-keyword">if</span> (storage.<span class="hljs-title function_">getStore</span>().<span class="hljs-property">requestId</span> !== idBefore) <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">&#x27;上下文发生串用&#x27;</span>);
  <span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;请求完成&#x27;</span>);
}

server.<span class="hljs-title function_">listen</span>(<span class="hljs-number">3000</span>, <span class="hljs-string">&#x27;127.0.0.1&#x27;</span>);
</code></pre></div>
<p><code>run()</code> 只在回调及其异步后续中提供上下文；请求结束后不应把 store 引用保存到全局集合。<code>getStore()</code> 在上下文外会返回 <code>undefined</code>，日志工具必须能处理启动脚本、定时任务和测试环境没有请求上下文的情况。</p>
<p>保存为 server.mjs 后用 Node.js 运行，并同时请求 /slow 与 /fast。每次响应返回独立 requestId；日志中同一次请求的“开始”和“完成”应保持相同 ID，完成顺序则可以交错。示例没有鉴权业务，仅演示异步上下文。</p>
<p>HTTP 响应结束不会自动取消在 run 中启动的定时器。异步任务仍存活时，它也可能继续持有 store，因此不要创建永不结束的请求内轮询。run 在同步调用返回后恢复外层上下文，而其创建的异步后续仍能继承 store；这与“整个进程当前只有一份上下文”不同。</p>
<h2>并发请求为什么不会互相覆盖</h2>
<p>每次 <code>run()</code> 都有自己的 store，Node.js 会沿异步资源关联当前执行上下文。两个请求同时执行 <code>await</code> 时，恢复后仍会回到各自的 store，因此不需要使用模块级可变变量。上下文对象本身仍是可变对象，建议在创建后尽量只读，避免某个下游函数改写租户或用户字段后影响同一请求的后续日志。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> context = <span class="hljs-title class_">Object</span>.<span class="hljs-title function_">freeze</span>({ requestId, tenantId });
storage.<span class="hljs-title function_">run</span>(context, <span class="hljs-function">() =&gt;</span> {
  <span class="hljs-comment">// 这里启动的 Promise、定时器和大多数 Node 异步 API 会继承 context</span>
});
</code></pre></div>
<p>这不是权限隔离。攻击者如果能控制请求头，服务端必须校验或重新生成 request ID；租户和用户信息必须来自经过认证的会话。上下文只用于关联和诊断，不能决定“是否允许访问资源”。</p>
<h2>回调和第三方库可能破坏关联</h2>
<p>原生 Promise、定时器和常见 Node API 通常能保持上下文，但手动保存回调、跨线程消息、旧式原生扩展或第三方异步调度器可能不在预期的异步资源链上。遇到上下文丢失时，先定位哪个边界没有传播，再使用 <code>AsyncResource</code> 或库提供的上下文 API 修复，不要在所有函数中重新读取全局变量。</p>
<p>Worker Threads 拥有独立的事件循环和内存，不会自动共享主线程的 store。发送任务时应显式传递经过筛选的 trace/request ID，在 Worker 中建立自己的上下文；不要把完整用户对象或认证凭证通过消息传过去。</p>
<h2><code>enterWith</code> 要谨慎使用</h2>
<p><code>enterWith()</code> 会改变当前同步执行上下文，并可能影响后续事件监听器。它适合少数明确的适配场景，容易让事件回调意外继承上一次上下文。请求入口通常优先使用 <code>run()</code>，让作用域随着回调结束而清晰退出。</p>
<h2>错误、流和响应结束</h2>
<p>异常被捕获或 Promise 拒绝不会自动清理外部资源。请求上下文可以帮助日志关联错误，但数据库连接、文件流、计时器和订阅仍要在 <code>finally</code> 中释放。流事件和回调如果由请求范围外启动，要确认它们仍与正确上下文关联，或者在创建时显式绑定。</p>
<p>上下文数据也可能被日志系统复制到错误、指标标签和 trace 属性中。只放低敏感度的标识，限制字符串长度，避免把 Cookie、Authorization、提示词和用户输入写入每条日志。高基数的 request ID 不适合直接作为聚合指标标签。</p>
<h2>测试和性能</h2>
<p>测试应同时发起多个请求，断言每条日志的 request ID 不串用；覆盖超时、异常、流式响应、定时任务和 Worker 边界。测试结束后清除监听器和临时上下文，避免异步任务继续写入下一用例。</p>
<p><code>AsyncLocalStorage</code> 的上下文访问有运行时成本，store 对象越大、日志复制越多，开销越明显。只存必要标识，并在真实负载下测量；不要为了传递一个常量把所有业务状态都塞进上下文。需要跨服务传播时使用标准 Trace Context 或明确的请求头协议，而不是假设进程内上下文能自动跨网络。</p>
<h2>常见误区</h2>
<ul>
<li>用模块级变量保存当前请求：并发时必然互相覆盖。</li>
<li>把上下文当权限来源：客户端可控字段必须重新验证。</li>
<li>认为 Worker 自动继承上下文：线程之间需要显式传递。</li>
<li>处处使用 <code>enterWith()</code>：事件监听器可能意外继承错误上下文。</li>
<li>把完整用户对象放进 store：扩大内存、日志和隐私风险。</li>
</ul>
<h2>参考资料</h2>
<ul>
<li><a href="https://nodejs.org/api/async_context.html#class-asynclocalstorage">Node.js · AsyncLocalStorage</a></li>
<li><a href="https://nodejs.org/api/async_hooks.html#class-asyncresource">Node.js · AsyncResource</a></li>
<li><a href="https://www.w3.org/TR/trace-context/">W3C · Trace Context</a></li>
</ul>
<h2>Node.js 24 起默认使用 AsyncContextFrame</h2>
<p>从 Node.js 24.0.0 起，AsyncLocalStorage 默认由 AsyncContextFrame 实现：上下文随 V8 的 Promise 续体传播，不再依赖 async_hooks，开销更低。需要旧实现时可以用 <code>--no-async-context-frame</code> 关闭；官方说明两种实现的上下文流可能有差异，升级时应回归测试依赖上下文的日志和追踪。</p>`};export{e as default};