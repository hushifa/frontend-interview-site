var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>用户点“导出报表”，报表可能要跑好几分钟，不能让 HTTP 请求一直等着。所以提交接口只做三件事：校验输入、写一条任务记录、投递一条消息，然后马上返回 <code>202</code> 和任务 ID。前端拿着 ID 去轮询或订阅状态，HTTP 连接断开也不影响后台任务。</p>
<p>主流队列提供的是至少一次投递，同一条消息可能被处理不止一次。所以消费者要用任务 ID 做幂等，写副作用之前先看看是不是已经做过了。消息要等业务处理完才确认，消费者中途崩溃或超时没确认，队列会重新投递。</p>
<p>取消是写进数据库的一个任务状态，消费者在每个阶段开始前检查它。<code>AbortSignal</code> 只能停掉当前进程里还在等待的操作，已经发出去的邮件、已经写进外部系统的数据，它撤销不了。</p>
<p>出错时要分情况：可以重试的错误按退避重试，并且设次数上限；超过上限或者根本不该重试的错误，进入死信队列等人工处理。</p>
</blockquote>
<h2>提交任务时，为什么记录和消息要放在一个事务里</h2>
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
<p>写数据库和发消息是两个系统，分开做就可能一个成功一个失败。先写数据库再发消息，发布失败了，就留下一个“排队中但没人处理”的任务；先发消息再写数据库，消费者可能拿到消息却查不到记录。</p>
<p>上面的做法叫事务性 outbox：消息先写进同一个数据库事务里的一张表，再由独立的进程把它可靠地投递到队列。这样两者要么都成功，要么都没发生。</p>
<p>前端拿到任务 ID 后查询 <code>GET /exports/:id</code>，显示 <code>queued</code>、<code>running</code>、<code>succeeded</code>、<code>failed</code>、<code>cancelled</code> 等状态。</p>
<h2>消费者要处理哪些情况</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">handleExport</span>(<span class="hljs-params">message, { db, storage, signal }</span>) {
  <span class="hljs-keyword">const</span> task = <span class="hljs-keyword">await</span> db.<span class="hljs-title function_">find</span>(<span class="hljs-string">&#x27;tasks&#x27;</span>, message.<span class="hljs-property">taskId</span>);
  <span class="hljs-keyword">if</span> (!task || [<span class="hljs-string">&#x27;succeeded&#x27;</span>, <span class="hljs-string">&#x27;cancelled&#x27;</span>].<span class="hljs-title function_">includes</span>(task.<span class="hljs-property">status</span>)) <span class="hljs-keyword">return</span> <span class="hljs-string">&#x27;ack&#x27;</span>;
  <span class="hljs-keyword">if</span> (task.<span class="hljs-property">status</span> === <span class="hljs-string">&#x27;cancel_requested&#x27;</span>) {
    <span class="hljs-keyword">await</span> db.<span class="hljs-title function_">update</span>(<span class="hljs-string">&#x27;tasks&#x27;</span>, task.<span class="hljs-property">id</span>, { <span class="hljs-attr">status</span>: <span class="hljs-string">&#x27;cancelled&#x27;</span> });
    <span class="hljs-keyword">return</span> <span class="hljs-string">&#x27;ack&#x27;</span>;
  }

  <span class="hljs-comment">// 条件更新：只在状态仍是 queued 或 running（崩溃后重新投递）时写入，</span>
  <span class="hljs-comment">// 不会覆盖期间并发写入的 cancel_requested；没写成就按新状态重新判断。</span>
  <span class="hljs-keyword">const</span> claimed = <span class="hljs-keyword">await</span> db.<span class="hljs-title function_">updateWhere</span>(
    <span class="hljs-string">&#x27;tasks&#x27;</span>,
    { <span class="hljs-attr">id</span>: task.<span class="hljs-property">id</span>, <span class="hljs-attr">status</span>: [<span class="hljs-string">&#x27;queued&#x27;</span>, <span class="hljs-string">&#x27;running&#x27;</span>] },
    { <span class="hljs-attr">status</span>: <span class="hljs-string">&#x27;running&#x27;</span> },
  );
  <span class="hljs-keyword">if</span> (!claimed) <span class="hljs-keyword">return</span> <span class="hljs-title function_">handleExport</span>(message, { db, storage, signal });

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
<p>先看幂等。幂等的意思是做一次和做多次结果一样。函数开头检查任务是否已经完成，输出文件也用任务 ID 命名，所以同一条消息处理两遍，也只会有一份结果。发邮件这种没法覆盖的副作用，要先记录“已发送”再确认消息，或者让下游接口接受一个幂等键。</p>
<p>再看确认时机。函数返回 <code>ack</code> 以后才确认消息。如果处理到一半进程崩溃了，消息没有被确认，队列会重新投递，从头再做一遍，靠幂等保证结果不重复。</p>
<p>然后是取消。用户点取消，只是把状态改成 <code>cancel_requested</code>，消费者在下一个检查点看到它才停下来。所以开始前和耗时阶段之间都要检查一次。你可能会问，为什么写 <code>running</code> 要用条件更新？因为在读取任务和写入之间，用户可能刚好点了取消。直接覆盖成 <code>running</code>，这次取消就丢了。</p>
<p>最后是超时。队列的确认超时（有的叫可见性超时）要比正常处理时间长，否则消息处理到一半，就被当成超时投递给另一个消费者了。耗时长的任务需要定期延长租约。</p>
<h2>出错了怎么重试</h2>
<table><thead><tr><th>错误类型</th><th>处理</th></tr></thead><tbody><tr><td>下游 503、网络超时</td><td>指数退避加随机抖动后重试，例如最多 5 次</td></tr><tr><td>输入不合法、数据不存在</td><td>不重试，任务标记为 <code>failed</code>，确认消息</td></tr><tr><td>超过重试上限</td><td>进入死信队列，告警后人工排查</td></tr></tbody></table>
<p>重试次数要记录在消息头或任务记录里，不能放在消费者进程的内存里，因为每次重试可能由不同的进程处理。</p>
<h2>消费者进程怎样关闭</h2>
<p>消费者进程收到 <code>SIGTERM</code> 时，先停止拉取新消息，等已经取出的消息处理完并确认，再关闭连接。超过截止时间还没完成的消息不确认，交给队列重新投递，靠幂等保证结果正确。HTTP 服务的关闭流程见<a href="/questions/node-graceful-shutdown/">《Node.js 服务如何实现优雅退出？》</a>。</p>
<h2>常见追问</h2>
<p><strong>能做到恰好一次吗？</strong></p>
<blockquote>
<p>投递层面通常做不到。实际的做法是“至少一次投递加幂等处理”，让多次处理的结果和一次相同。</p>
</blockquote>
<p><strong>前端怎样得知任务完成？</strong></p>
<blockquote>
<p>轮询状态接口最简单。需要即时一些，就用 SSE 或 WebSocket 推送，但推送只是通知，最终状态以查询接口为准。</p>
</blockquote>`};export{e as default};