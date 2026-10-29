var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>发布新版本时，平台会给旧进程发一个 <code>SIGTERM</code> 信号让它退出。如果直接退，正在处理的请求就断了，用户看到报错。优雅退出就是先把手头的活干完再走。</p>
<p>顺序是这样的：先让 readiness 健康检查返回 503，等一小段时间让负载均衡器把这个实例摘掉，不再给它派新请求；然后调用 <code>server.close()</code>，它停止接收新连接，等在途请求处理完再回调，Node.js 19 起还会顺手关掉空闲的 keep-alive 连接；最后关闭数据库连接池、停掉队列消费。</p>
<p>整个流程要设一个截止时间，到期还没完成，就调用 <code>server.closeAllConnections()</code> 和 <code>process.exit(1)</code> 强制结束。截止时间要比平台的终止宽限期短。在途请求本身也要有超时，否则一个卡住的请求会让退出无限期地等下去。</p>
<p>要注意，正常退出时不要先调 <code>process.exit()</code>，让事件循环自然清空就行。提前调用会截断还没写完的响应和日志。</p>
</blockquote>
<h2>为什么不能收到信号就立刻关闭</h2>
<p>收到 <code>SIGTERM</code> 的那一刻，负载均衡器还不知道这个实例要下线，还在往这里派新请求。如果马上 <code>server.close()</code>，这些新请求就会被直接拒绝。所以退出要按下面的顺序来：</p>
<ol>
<li>标记正在关闭，readiness 检查开始返回 503。</li>
<li>等待负载均衡器发现并摘除实例，这段延迟取决于健康检查间隔。</li>
<li><code>server.close()</code>，停止接新连接，等待在途请求完成。</li>
<li>关闭数据库连接池、停止队列消费、清理定时器。</li>
<li>超过截止时间仍未完成，记录原因并强制退出。</li>
</ol>
<h2>代码怎么写</h2>
<p>下面的实现里，<code>/ready</code> 是健康检查接口，<code>shutdown</code> 按上面的顺序执行：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">import</span> http <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;node:http&#x27;</span>;

<span class="hljs-keyword">let</span> shuttingDown = <span class="hljs-literal">false</span>;
<span class="hljs-keyword">let</span> shutdownPromise;

<span class="hljs-keyword">const</span> server = http.<span class="hljs-title function_">createServer</span>(<span class="hljs-title function_">async</span> (request, response) =&gt; {
  <span class="hljs-keyword">if</span> (request.<span class="hljs-property">url</span> === <span class="hljs-string">&#x27;/ready&#x27;</span>) {
    response.<span class="hljs-title function_">writeHead</span>(shuttingDown ? <span class="hljs-number">503</span> : <span class="hljs-number">200</span>).<span class="hljs-title function_">end</span>();
    <span class="hljs-keyword">return</span>;
  }
  <span class="hljs-keyword">await</span> <span class="hljs-title function_">handle</span>(request, response);
});
server.<span class="hljs-title function_">listen</span>(<span class="hljs-number">3000</span>);

<span class="hljs-keyword">function</span> <span class="hljs-title function_">shutdown</span>(<span class="hljs-params">signal, { drainDelayMs = <span class="hljs-number">5_000</span>, deadlineMs = <span class="hljs-number">25_000</span> } = {}</span>) {
  <span class="hljs-comment">// 重复收到信号时复用同一个流程。</span>
  <span class="hljs-keyword">if</span> (shutdownPromise) <span class="hljs-keyword">return</span> shutdownPromise;
  shuttingDown = <span class="hljs-literal">true</span>;
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">\`收到 <span class="hljs-subst">\${signal}</span>，开始关闭\`</span>);

  shutdownPromise = (<span class="hljs-title function_">async</span> () =&gt; {
    <span class="hljs-keyword">const</span> deadline = <span class="hljs-built_in">setTimeout</span>(<span class="hljs-function">() =&gt;</span> {
      <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">error</span>(<span class="hljs-string">&#x27;超过截止时间，强制退出&#x27;</span>);
      server.<span class="hljs-title function_">closeAllConnections</span>();
      process.<span class="hljs-title function_">exit</span>(<span class="hljs-number">1</span>);
    }, deadlineMs);
    deadline.<span class="hljs-title function_">unref</span>();

    <span class="hljs-keyword">await</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Promise</span>(<span class="hljs-function">(<span class="hljs-params">resolve</span>) =&gt;</span> <span class="hljs-built_in">setTimeout</span>(resolve, drainDelayMs));
    <span class="hljs-keyword">await</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Promise</span>(<span class="hljs-function">(<span class="hljs-params">resolve, reject</span>) =&gt;</span>
      server.<span class="hljs-title function_">close</span>(<span class="hljs-function">(<span class="hljs-params">error</span>) =&gt;</span> (error ? <span class="hljs-title function_">reject</span>(error) : <span class="hljs-title function_">resolve</span>())),
    );
    <span class="hljs-keyword">await</span> db.<span class="hljs-title function_">close</span>();
    <span class="hljs-built_in">clearTimeout</span>(deadline);
  })();

  <span class="hljs-keyword">return</span> shutdownPromise;
}

<span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> signal <span class="hljs-keyword">of</span> [<span class="hljs-string">&#x27;SIGTERM&#x27;</span>, <span class="hljs-string">&#x27;SIGINT&#x27;</span>]) {
  process.<span class="hljs-title function_">once</span>(signal, <span class="hljs-function">() =&gt;</span> {
    <span class="hljs-title function_">shutdown</span>(signal).<span class="hljs-title function_">catch</span>(<span class="hljs-function">(<span class="hljs-params">error</span>) =&gt;</span> {
      <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">error</span>(error);
      process.<span class="hljs-property">exitCode</span> = <span class="hljs-number">1</span>;
    });
  });
}
</code></pre></div>
<p>本地实测（去掉等待和数据库部分）：关闭开始时一个耗时 300 毫秒的请求正在处理，它正常返回 <code>ok</code> 后 <code>server.close()</code> 才回调，此后的新连接被拒绝，进程以退出码 0 结束。</p>
<p>截止计时器调用了 <code>unref()</code>，你可能会问这是做什么的。一个活着的定时器会让进程一直不退出；<code>unref()</code> 以后，它就不再拦着进程。这样正常排空后进程可以直接退出，不用等满 25 秒。</p>
<p>正常路径里没有调用 <code>process.exit()</code>。资源全部关闭以后事件循环里没有事情了，进程会自己退出。</p>
<p><code>SIGINT</code> 是本地按 Ctrl+C 时收到的信号，按同样的流程处理。截止时间设成 25 秒，是因为 Kubernetes 的 <code>terminationGracePeriodSeconds</code> 默认 30 秒，到期后会直接发 <code>SIGKILL</code>，那时就来不及做任何清理了。</p>
<h2>长连接和后台任务怎么处理</h2>
<table><thead><tr><th>类型</th><th>处理方式</th></tr></thead><tbody><tr><td>普通请求</td><td>设置请求级超时，并把 <code>AbortSignal</code> 传给下游 <code>fetch</code> 和数据库查询</td></tr><tr><td>空闲 keep-alive 连接</td><td>Node.js 19 起 <code>server.close()</code> 会关闭；更早的版本要调用 <code>server.closeIdleConnections()</code></td></tr><tr><td>WebSocket、SSE</td><td><code>server.close()</code> 不会结束它们，<code>closeAllConnections()</code> 也不会关闭已升级的 WebSocket；应用要主动通知客户端重连并关闭这些连接</td></tr><tr><td>队列消费者</td><td>先停止拉取新消息，等已取出的消息处理完再确认；被强制中断的消息会重新投递，处理逻辑必须幂等</td></tr></tbody></table>
<p><code>closeAllConnections()</code> 会把正在传输的请求也一起中断，所以只在截止阶段使用。</p>
<h2>常见追问</h2>
<p><strong>为什么不在收到信号后立刻 <code>server.close()</code>？</strong></p>
<blockquote>
<p>那时负载均衡器还没摘除实例，新请求会继续到达，这些请求会被直接拒绝。先让 readiness 失败、等一段时间，能减少这类错误。</p>
</blockquote>
<p><strong>优雅退出能保证数据一致吗？</strong></p>
<blockquote>
<p>不能。进程可能被 <code>SIGKILL</code> 或者直接崩溃，一致性要靠事务、幂等和重试。优雅退出只是减少正常发布时的中断。</p>
</blockquote>
<p><strong>readiness 和 liveness 有什么区别？</strong></p>
<blockquote>
<p>readiness 表示能不能接收流量，关闭时要返回失败。liveness 表示进程是否还活着，关闭过程中仍应返回成功，否则平台可能以为进程挂了，提前把容器重启掉。</p>
</blockquote>`};export{e as default};