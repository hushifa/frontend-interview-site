var e={answerHtml:`<h2>简答</h2>
<ul>
<li>收到 SIGTERM 后先停止接收新请求，再等待已有请求完成。</li>
<li>server.close() 停止接受新连接（Node.js 19 起也会关闭空闲连接），但不会中断正在处理的请求，所以每个请求都要有超时。</li>
<li>设置一个最终截止时间，超时后强制退出。</li>
<li>关闭开始时把 readiness 检查改为失败，让负载均衡器尽快摘除实例。</li>
</ul>
<p>在容器平台滚动发布 Node.js 服务时，旧进程收到 <code>SIGTERM</code> 后如果立刻退出，正在上传文件、写入订单或等待数据库响应的请求会被中断。新的请求又可能在负载均衡器还没完成摘除前继续进入旧实例。优雅退出的目标是：停止接收新流量，给已有请求一个有限的完成时间，完成必要清理后再退出；超时或清理失败时仍要有强制终止边界。</p>
<h2><code>process.exit()</code> 为什么会截断请求</h2>
<p><code>process.exit()</code> 会立即结束进程，事件循环里尚未完成的异步操作、响应写入和日志刷新都可能来不及执行。设置 <code>process.exitCode</code> 则不同：它只指定进程在事件循环自然清空后的退出码。因此收到终止信号后，不能先调用 <code>process.exit()</code> 再期待 <code>finally</code> 或 HTTP 响应完成。</p>
<p>退出流程一般分为四步：</p>
<ol>
<li>标记实例正在关闭，让健康检查返回失败或不再接收流量。</li>
<li>停止接收新连接，并等待已有请求结束。</li>
<li>关闭数据库连接、消息消费者和定时任务等资源。</li>
<li>达到截止时间仍未完成时，记录原因并强制退出。</li>
</ol>
<h2>HTTP 服务器需要“停止接新请求”和“排空旧请求”</h2>
<p><code>server.close()</code> 会停止接受新的连接，并在连接全部关闭后回调。它不会替你取消一个卡住的请求，也不会自动关闭其他资源。Node.js 版本和 HTTP 模块不同，空闲 keep-alive 连接还可能需要显式处理，因此不能只调用一个方法就认为服务已经排空。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">import</span> http <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;node:http&#x27;</span>;

<span class="hljs-keyword">let</span> shuttingDown = <span class="hljs-literal">false</span>;
<span class="hljs-keyword">let</span> shutdownPromise;

<span class="hljs-keyword">const</span> server = http.<span class="hljs-title function_">createServer</span>(<span class="hljs-title function_">async</span> (request, response) =&gt; {
  <span class="hljs-keyword">try</span> {
    <span class="hljs-keyword">await</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Promise</span>(<span class="hljs-function">(<span class="hljs-params">resolve</span>) =&gt;</span> <span class="hljs-built_in">setTimeout</span>(resolve, <span class="hljs-number">20</span>));
    <span class="hljs-keyword">if</span> (shuttingDown) response.<span class="hljs-title function_">setHeader</span>(<span class="hljs-string">&#x27;Connection&#x27;</span>, <span class="hljs-string">&#x27;close&#x27;</span>);
    response.<span class="hljs-title function_">writeHead</span>(<span class="hljs-number">200</span>, { <span class="hljs-string">&#x27;Content-Type&#x27;</span>: <span class="hljs-string">&#x27;text/plain; charset=utf-8&#x27;</span> });
    response.<span class="hljs-title function_">end</span>(<span class="hljs-string">&#x27;ok&#x27;</span>);
  } <span class="hljs-keyword">catch</span> (error) {
    <span class="hljs-keyword">if</span> (!response.<span class="hljs-property">headersSent</span>) response.<span class="hljs-title function_">writeHead</span>(<span class="hljs-number">500</span>);
    response.<span class="hljs-title function_">end</span>(<span class="hljs-string">&#x27;error&#x27;</span>);
  }
});

server.<span class="hljs-title function_">listen</span>(<span class="hljs-number">3000</span>);

<span class="hljs-keyword">function</span> <span class="hljs-title function_">shutdown</span>(<span class="hljs-params">signal</span>) {
  <span class="hljs-keyword">if</span> (shutdownPromise) <span class="hljs-keyword">return</span> shutdownPromise;
  shuttingDown = <span class="hljs-literal">true</span>;

  shutdownPromise = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Promise</span>(<span class="hljs-function">(<span class="hljs-params">resolve</span>) =&gt;</span> {
    <span class="hljs-keyword">const</span> forceTimer = <span class="hljs-built_in">setTimeout</span>(<span class="hljs-function">() =&gt;</span> {
      <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">error</span>(<span class="hljs-string">&#x27;优雅退出超时，强制结束进程&#x27;</span>);
      <span class="hljs-comment">// 最终截止阶段允许中断请求；exitCode 本身不能结束活跃连接。</span>
      server.<span class="hljs-title function_">closeAllConnections</span>();
      process.<span class="hljs-title function_">exit</span>(<span class="hljs-number">1</span>);
    }, <span class="hljs-number">10_000</span>);
    forceTimer.<span class="hljs-title function_">unref</span>();

    server.<span class="hljs-title function_">close</span>(<span class="hljs-function">(<span class="hljs-params">error</span>) =&gt;</span> {
      <span class="hljs-built_in">clearTimeout</span>(forceTimer);
      <span class="hljs-keyword">if</span> (error) {
        <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">error</span>(<span class="hljs-string">&#x27;关闭 HTTP 服务失败&#x27;</span>, error);
        process.<span class="hljs-property">exitCode</span> = <span class="hljs-number">1</span>;
      }
      <span class="hljs-title function_">resolve</span>();
    });
  });

  <span class="hljs-keyword">return</span> shutdownPromise;
}

<span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> signal <span class="hljs-keyword">of</span> [<span class="hljs-string">&#x27;SIGTERM&#x27;</span>, <span class="hljs-string">&#x27;SIGINT&#x27;</span>]) {
  process.<span class="hljs-title function_">on</span>(signal, <span class="hljs-function">() =&gt;</span> {
    <span class="hljs-keyword">void</span> <span class="hljs-title function_">shutdown</span>(signal).<span class="hljs-title function_">then</span>(<span class="hljs-function">() =&gt;</span> {
      process.<span class="hljs-property">exitCode</span> ??= <span class="hljs-number">0</span>;
    });
  });
}
</code></pre></div>
<p>示例面向 Node.js 22 的普通 HTTP/1 服务，用 <code>server.close()</code> 作为排空入口，并用同一个 Promise 防止重复信号启动多套清理流程。正常结束设置退出码，让事件循环自然清空；超过最终截止时间才使用 <code>process.exit(1)</code>，此时明确接受未完成响应和日志可能被截断。定时器 <code>unref()</code> 让它本身不会阻止正常退出，但活跃连接仍会让进程存活并触发截止处理。</p>
<p>Node.js 19 起，HTTP <code>server.close()</code> 会关闭空闲连接；<code>closeAllConnections()</code> 自 18.2 提供，且不关闭已经升级为 WebSocket 的连接。示例不实现 WebSocket、数据库或队列资源清理。加入这些资源后，应把全局截止计时器保留到所有清理结束，而不是在 HTTP 排空后就清除。<code>Promise.allSettled</code> 可以收集清理结果，但不能让永不结束的 Promise 自动超时。</p>
<h2>健康检查和负载均衡器必须配合</h2>
<p>进程收到 <code>SIGTERM</code> 后应立即把 readiness 检查改为失败，例如返回 503；否则负载均衡器可能继续把新请求发给正在关闭的实例。readiness 表示“现在是否适合接收流量”，liveness 表示“进程是否还活着”，两者不能共用一个永远返回 200 的接口。</p>
<p>健康检查失败到负载均衡器真正摘除之间存在传播延迟。优雅退出截止时间应大于这段延迟，并预留已有请求的完成时间。若平台支持 <code>preStop</code> 或 termination grace period，也要把它和 Node.js 内部的强制截止时间一起设计，避免平台先杀进程导致应用层没有机会清理。</p>
<h2>请求超时是优雅退出的必要条件</h2>
<p>如果一个请求没有超时，客户端断开或上游服务失联后，Node 进程可能永远等不到它结束。应根据业务设置请求头、请求体和空闲连接的超时，并在超时时取消数据库查询或下游 <code>fetch</code>：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">loadData</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">const</span> controller = <span class="hljs-keyword">new</span> <span class="hljs-title class_">AbortController</span>();
  <span class="hljs-keyword">const</span> timer = <span class="hljs-built_in">setTimeout</span>(<span class="hljs-function">() =&gt;</span> controller.<span class="hljs-title function_">abort</span>(), <span class="hljs-number">5_000</span>);

  <span class="hljs-keyword">try</span> {
    <span class="hljs-keyword">const</span> response = <span class="hljs-keyword">await</span> <span class="hljs-title function_">fetch</span>(<span class="hljs-string">&#x27;https://api.example.test/data&#x27;</span>, {
      <span class="hljs-attr">signal</span>: controller.<span class="hljs-property">signal</span>,
    });
    <span class="hljs-keyword">if</span> (!response.<span class="hljs-property">ok</span>) <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">\`下游返回 HTTP <span class="hljs-subst">\${response.status}</span>\`</span>);
    <span class="hljs-keyword">return</span> <span class="hljs-keyword">await</span> response.<span class="hljs-title function_">json</span>();
  } <span class="hljs-keyword">finally</span> {
    <span class="hljs-built_in">clearTimeout</span>(timer);
  }
}
</code></pre></div>
<p>超时不能只在 Node 进程层设置。下游请求、数据库连接池、消息确认和文件流都要有自己的取消或截止策略，否则最外层的优雅退出仍会被内部任务拖住。取消操作也应区分“客户端主动取消”和“服务端关闭”，避免把正常排空误报成业务错误。</p>
<h2>keep-alive、WebSocket 和长连接要单独处理</h2>
<p>普通 HTTP 请求完成后，keep-alive TCP 连接可能仍然空闲。关闭服务器时应按当前 Node.js 版本文档选择合适的连接关闭方法，并在截止时间到达时销毁仍未结束的连接。WebSocket、SSE 和长轮询不会自然快速结束，应用需要向客户端发送关闭或重连信号，或者把它们纳入更短的单独截止时间。</p>
<p>不能把 <code>server.closeAllConnections()</code> 当作默认方案：它会中断正在传输的请求，适合强制截止阶段，而不是正常排空阶段。使用前要确认 Node.js 版本支持，并记录被强制中断的连接数量。</p>
<h2>消息消费者要先停止拉取，再处理已取出的消息</h2>
<p>服务包含队列消费者时，退出顺序通常是先停止新的拉取，再等待已经取出的消息完成或回滚确认。直接杀进程可能导致消息重复投递；因此处理函数必须具备幂等性，确认消息的时机要放在业务写入成功之后。优雅退出也不能无限等待一条外部服务永远不返回的消息，应使用任务级超时和可重试的失败策略。</p>
<h2>常见误区和选型</h2>
<ul>
<li>只监听 <code>SIGTERM</code>：本地 Ctrl+C 通常是 <code>SIGINT</code>，两者都应按相同策略处理。</li>
<li>关闭监听端口后立即退出：已有请求和数据库事务仍可能未完成。</li>
<li>清理函数没有上限：任何网络依赖都可能卡住，必须有全局截止时间。</li>
<li>多次信号启动多个清理流程：用 Promise 锁定第一次退出流程，后续信号可以记录并加速强制阶段。</li>
<li>把优雅退出当成数据一致性保证：它只能减少中断，不能代替事务、幂等、重试和恢复机制。</li>
</ul>
<p>短请求的无状态 HTTP 服务通常采用“拒绝新流量、等待请求完成、超时强制结束”的方案；含长连接、队列或复杂事务的服务应为各类资源分别设计关闭协议，并通过滚动发布演练验证实际时间，而不是只依赖本地单元测试。</p>
<h2>参考资料</h2>
<ul>
<li><a href="https://nodejs.org/api/net.html#serverclosecallback">Node.js · <code>server.close()</code></a></li>
<li><a href="https://nodejs.org/api/http.html#server-requesttimeout">Node.js · HTTP server timeouts</a></li>
<li><a href="https://nodejs.org/api/process.html#signal-events">Node.js · Process signals</a></li>
<li><a href="https://nodejs.org/api/globals.html#class-abortcontroller">Node.js · <code>AbortController</code></a></li>
</ul>`};export{e as default};