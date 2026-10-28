var e={answerHtml:`<h2>简答</h2>
<ul>
<li>提交接口只校验输入、写任务记录、投递消息，然后返回 <code>202</code> 和任务 ID；前端轮询或订阅任务状态，HTTP 连接断开不会停止后台任务。</li>
<li>主流队列提供至少一次投递，同一条消息可能被处理多次，消费者要用任务 ID 做幂等，副作用写入前检查是否已完成。</li>
<li>消息在业务处理完成后才确认；消费者崩溃或超时未确认时，队列会重新投递。</li>
<li>取消是写进数据库的任务状态，消费者在每个阶段开始前检查；<code>AbortSignal</code> 只能停止当前进程里还在等待的操作，撤销不了已经发出的邮件或外部写入。</li>
<li>可重试的错误按退避重试并设次数上限，超过上限或不可重试的错误进入死信队列，等人工处理。</li>
</ul>
<h2>提交与查询</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">export</span> <span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">createExport</span>(<span class="hljs-params">input, { db, outbox }</span>) {
  <span class="hljs-keyword">const</span> taskId = crypto.<span class="hljs-title function_">randomUUID</span>();
  <span class="hljs-keyword">await</span> db.<span class="hljs-title function_">transaction</span>(<span class="hljs-title function_">async</span> (tx) =&gt; {
    <span class="hljs-keyword">await</span> tx.<span class="hljs-title function_">insert</span>(<span class="hljs-string">&#x27;tasks&#x27;</span>, { <span class="hljs-attr">id</span>: taskId, <span class="hljs-attr">status</span>: <span class="hljs-string">&#x27;queued&#x27;</span>, input });
    <span class="hljs-comment">// 与任务记录在同一个事务里写入待发送消息，由后台进程投递到队列。</span>
    <span class="hljs-keyword">await</span> outbox.<span class="hljs-title function_">add</span>(tx, { <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;export.requested&#x27;</span>, taskId });
  });
  <span class="hljs-keyword">return</span> { <span class="hljs-attr">status</span>: <span class="hljs-number">202</span>, <span class="hljs-attr">body</span>: { taskId, <span class="hljs-attr">status</span>: <span class="hljs-string">&#x27;queued&#x27;</span> } };
}
</code></pre></div>
<p>如果先写数据库再单独发布消息，发布失败会留下&quot;排队中但没人处理&quot;的任务；先发布再写数据库，消费者可能查不到记录。事务性 outbox 把消息先写进同一个数据库事务，再由独立进程可靠地投递，避免两者不一致。</p>
<p>前端拿到任务 ID 后查询 <code>GET /exports/:id</code>，显示 <code>queued</code>、<code>running</code>、<code>succeeded</code>、<code>failed</code>、<code>cancelled</code> 等状态。</p>
<h2>消费者</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">handleExport</span>(<span class="hljs-params">message, { db, storage, signal }</span>) {
  <span class="hljs-keyword">const</span> task = <span class="hljs-keyword">await</span> db.<span class="hljs-title function_">find</span>(<span class="hljs-string">&#x27;tasks&#x27;</span>, message.<span class="hljs-property">taskId</span>);
  <span class="hljs-keyword">if</span> (!task || [<span class="hljs-string">&#x27;succeeded&#x27;</span>, <span class="hljs-string">&#x27;cancelled&#x27;</span>].<span class="hljs-title function_">includes</span>(task.<span class="hljs-property">status</span>)) <span class="hljs-keyword">return</span> <span class="hljs-string">&#x27;ack&#x27;</span>;

  <span class="hljs-keyword">await</span> db.<span class="hljs-title function_">update</span>(<span class="hljs-string">&#x27;tasks&#x27;</span>, task.<span class="hljs-property">id</span>, { <span class="hljs-attr">status</span>: <span class="hljs-string">&#x27;running&#x27;</span> });

  <span class="hljs-keyword">const</span> rows = <span class="hljs-keyword">await</span> <span class="hljs-title function_">loadRows</span>(task.<span class="hljs-property">input</span>, signal);
  <span class="hljs-keyword">if</span> ((<span class="hljs-keyword">await</span> db.<span class="hljs-title function_">find</span>(<span class="hljs-string">&#x27;tasks&#x27;</span>, task.<span class="hljs-property">id</span>)).<span class="hljs-property">status</span> === <span class="hljs-string">&#x27;cancel_requested&#x27;</span>) {
    <span class="hljs-keyword">await</span> db.<span class="hljs-title function_">update</span>(<span class="hljs-string">&#x27;tasks&#x27;</span>, task.<span class="hljs-property">id</span>, { <span class="hljs-attr">status</span>: <span class="hljs-string">&#x27;cancelled&#x27;</span> });
    <span class="hljs-keyword">return</span> <span class="hljs-string">&#x27;ack&#x27;</span>;
  }

  <span class="hljs-comment">// 以任务 ID 作为对象名，重复执行只会覆盖同一个文件。</span>
  <span class="hljs-keyword">await</span> storage.<span class="hljs-title function_">put</span>(<span class="hljs-string">\`exports/<span class="hljs-subst">\${task.id}</span>.csv\`</span>, <span class="hljs-title function_">toCsv</span>(rows));
  <span class="hljs-keyword">await</span> db.<span class="hljs-title function_">update</span>(<span class="hljs-string">&#x27;tasks&#x27;</span>, task.<span class="hljs-property">id</span>, { <span class="hljs-attr">status</span>: <span class="hljs-string">&#x27;succeeded&#x27;</span> });
  <span class="hljs-keyword">return</span> <span class="hljs-string">&#x27;ack&#x27;</span>;
}
</code></pre></div>
<p>要点：</p>
<ul>
<li><strong>幂等</strong>：开头检查任务是否已完成；输出文件用任务 ID 命名，重复处理不会产生两份结果。发邮件这类不可覆盖的副作用，要先记录&quot;已发送&quot;再确认消息，或者让下游接口接受幂等键。</li>
<li><strong>确认时机</strong>：函数返回 <code>ack</code> 后才确认消息。处理到一半进程崩溃，消息会重新投递，从头再做一遍。</li>
<li><strong>取消检查点</strong>：在耗时阶段之间重新读取任务状态。用户点击取消只是把状态改成 <code>cancel_requested</code>，消费者在下一个检查点停下来。</li>
<li><strong>超时</strong>：队列的确认超时（或可见性超时）要大于正常的处理时间，否则消息会在处理中途被投递给另一个消费者。耗时长的任务需要定期延长租约。</li>
</ul>
<h2>重试与死信</h2>
<table><thead><tr><th>错误类型</th><th>处理</th></tr></thead><tbody><tr><td>下游 503、网络超时</td><td>指数退避加随机抖动后重试，例如最多 5 次</td></tr><tr><td>输入不合法、数据不存在</td><td>不重试，任务标记为 <code>failed</code>，确认消息</td></tr><tr><td>超过重试上限</td><td>进入死信队列，告警后人工排查</td></tr></tbody></table>
<p>重试次数记录在消息头或任务记录里，不能依赖消费者进程的内存，因为每次重试可能由不同的进程处理。</p>
<h2>优雅关闭</h2>
<p>消费者进程收到 <code>SIGTERM</code> 时，先停止拉取新消息，等已取出的消息处理完并确认，再关闭连接。超过截止时间仍未完成的消息不确认，交给队列重新投递，靠幂等保证结果正确。HTTP 服务的关闭流程见《Node.js 服务如何实现优雅退出？》。</p>
<h2>常见追问</h2>
<ul>
<li><strong>能做到恰好一次吗？</strong> 投递层面通常做不到。实际做法是&quot;至少一次投递加幂等处理&quot;，让多次处理的结果和一次相同。</li>
<li><strong>前端怎样得知任务完成？</strong> 轮询状态接口最简单；需要即时性时用 SSE 或 WebSocket 推送，推送只是通知，最终状态以查询接口为准。</li>
</ul>`};export{e as default};