var e={answerHtml:`<h2>简答</h2>
<ul>
<li>消息队列一般是至少一次投递，消费者必须做幂等处理。</li>
<li>处理完成后才确认消息；超时或崩溃后，消息会重新投递。</li>
<li>取消是一种需要持久化的业务状态，消费者在检查点读取它。</li>
<li>重试要有次数上限和退避，最终失败的消息进入死信队列。</li>
</ul>
<p>用户点击“导出报表”后，前端可能在几秒内关闭页面、修改筛选条件或点击取消。若服务端已经把任务放进持久化队列，简单地把 HTTP 连接断开并不能让任务自动消失；消费者可能已经取到消息，数据库写入也可能已经发生。要把这条链路设计可靠，首先要把几个容易混淆的概念分开。</p>
<table><thead><tr><th>概念</th><th>表示什么</th><th>能否自动撤销已经发生的副作用</th></tr></thead><tbody><tr><td>请求取消</td><td>调用方不再等待这次 HTTP 响应</td><td>不能保证服务端停止任务</td></tr><tr><td>执行取消</td><td>当前处理函数收到信号并主动停止</td><td>只能影响仍支持协作式取消的工作</td></tr><tr><td>消息确认</td><td>消费者告诉队列这条消息已处理或已接管</td><td>不等于数据库事务自动提交或回滚</td></tr><tr><td>业务撤销</td><td>领域状态明确记录“不要再继续”</td><td>需要任务代码在关键阶段检查并遵守</td></tr><tr><td>回滚</td><td>撤销同一事务中的数据库变更</td><td>不能撤销已经发送的邮件、外部 API 写入或文件上传</td></tr></tbody></table>
<h2>HTTP 断开时不要直接删除任务</h2>
<p>提交后台任务的接口通常只负责校验输入、保存任务记录和把消息放入可靠队列，然后返回任务 ID。客户端断开时，可以把“客户端不再等待”记录到日志或取消意图中，但是否真的取消要由任务类型决定：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">import</span> { randomUUID } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;node:crypto&#x27;</span>;

<span class="hljs-keyword">export</span> <span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">createExport</span>(<span class="hljs-params">request, response, repository, queue</span>) {
  <span class="hljs-keyword">const</span> taskId = <span class="hljs-title function_">randomUUID</span>();
  <span class="hljs-keyword">const</span> input = <span class="hljs-keyword">await</span> <span class="hljs-title function_">readAndValidateJson</span>(request);

  <span class="hljs-keyword">await</span> repository.<span class="hljs-title function_">insertTask</span>({
    <span class="hljs-attr">id</span>: taskId,
    <span class="hljs-attr">status</span>: <span class="hljs-string">&#x27;queued&#x27;</span>,
    input,
    <span class="hljs-attr">requestedAt</span>: <span class="hljs-keyword">new</span> <span class="hljs-title class_">Date</span>(),
  });

  <span class="hljs-keyword">await</span> queue.<span class="hljs-title function_">publish</span>({
    <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;export.requested&#x27;</span>,
    taskId,
    <span class="hljs-attr">schemaVersion</span>: <span class="hljs-number">1</span>,
  });

  response.<span class="hljs-title function_">writeHead</span>(<span class="hljs-number">202</span>, { <span class="hljs-string">&#x27;content-type&#x27;</span>: <span class="hljs-string">&#x27;application/json&#x27;</span> });
  response.<span class="hljs-title function_">end</span>(<span class="hljs-title class_">JSON</span>.<span class="hljs-title function_">stringify</span>({ taskId, <span class="hljs-attr">status</span>: <span class="hljs-string">&#x27;queued&#x27;</span> }));
}
</code></pre></div>
<p><code>202 Accepted</code> 表示服务端接受了异步处理请求，不表示报表已经生成。消息发布和任务记录必须有明确的一致性方案：如果先写数据库后发布消息，发布失败会留下“排队中但无人处理”的任务；如果先发布再写数据库，消费者可能先查不到任务。生产实现可以使用事务性 outbox、队列与数据库的原子能力，或由可靠的补偿任务扫描异常状态，不能只依赖两个独立的 <code>await</code>。</p>
<h2>AbortSignal 需要贯穿同一执行链</h2>
<p>如果任务只对当前请求有意义，<code>AbortSignal</code> 可以传给仍在等待的下游操作：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">loadReportData</span>(<span class="hljs-params">task, signal</span>) {
  signal.<span class="hljs-title function_">throwIfAborted</span>();

  <span class="hljs-keyword">const</span> response = <span class="hljs-keyword">await</span> <span class="hljs-title function_">fetch</span>(task.<span class="hljs-property">dataUrl</span>, {
    signal,
    <span class="hljs-attr">headers</span>: { <span class="hljs-attr">accept</span>: <span class="hljs-string">&#x27;application/json&#x27;</span> },
  });
  <span class="hljs-keyword">if</span> (!response.<span class="hljs-property">ok</span>) {
    <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">\`下游返回 HTTP <span class="hljs-subst">\${response.status}</span>\`</span>);
  }

  <span class="hljs-keyword">const</span> data = <span class="hljs-keyword">await</span> response.<span class="hljs-title function_">json</span>();
  signal.<span class="hljs-title function_">throwIfAborted</span>();
  <span class="hljs-keyword">return</span> data;
}
</code></pre></div>
<p>只在最外层创建 controller、却不把 signal 传给 <code>fetch</code>、数据库驱动、文件流或自定义循环，实际上没有完成取消。<code>AbortSignal</code> 也不会强行中断任意同步 JavaScript；CPU 密集循环需要在可接受的检查点主动检查信号，外部库不支持取消时只能等待、隔离到可终止的 Worker，或让任务继续完成后丢弃结果。</p>
<p>取消发生在 <code>fetch</code> 已经把请求发送出去之后，也不能保证远端没有处理请求。对于写入、扣款和创建资源，客户端取消只能停止等待，不能被解释成业务撤销。需要撤销时应设计独立的取消命令和领域状态，例如“生成任务取消请求”，由消费者在安全边界检查后决定是否停止。</p>
<h2>消费消息时先建立租约，再决定确认时机</h2>
<p>队列通常采用至少一次投递：消费者处理过程中崩溃，消息可能重新出现。一个通用的消费者状态可以是 <code>queued → running → succeeded/failed/canceled</code>，并为运行中的任务设置租约或可见性超时：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">consume</span>(<span class="hljs-params">message, repository, runExport, signal</span>) {
  <span class="hljs-keyword">const</span> { taskId } = <span class="hljs-title function_">parseMessage</span>(message);
  <span class="hljs-keyword">const</span> task = <span class="hljs-keyword">await</span> repository.<span class="hljs-title function_">claimTask</span>(taskId, {
    <span class="hljs-attr">leaseMs</span>: <span class="hljs-number">30_000</span>,
  });

  <span class="hljs-keyword">if</span> (!task || task.<span class="hljs-property">status</span> === <span class="hljs-string">&#x27;succeeded&#x27;</span> || task.<span class="hljs-property">status</span> === <span class="hljs-string">&#x27;canceled&#x27;</span>) {
    <span class="hljs-keyword">return</span> { <span class="hljs-attr">acknowledge</span>: <span class="hljs-literal">true</span> };
  }

  <span class="hljs-keyword">try</span> {
    <span class="hljs-keyword">await</span> <span class="hljs-title function_">runExport</span>(task, signal);
    <span class="hljs-keyword">await</span> repository.<span class="hljs-title function_">markSucceeded</span>(taskId, { <span class="hljs-attr">finishedAt</span>: <span class="hljs-keyword">new</span> <span class="hljs-title class_">Date</span>() });
    <span class="hljs-keyword">return</span> { <span class="hljs-attr">acknowledge</span>: <span class="hljs-literal">true</span> };
  } <span class="hljs-keyword">catch</span> (error) {
    <span class="hljs-keyword">if</span> (signal.<span class="hljs-property">aborted</span> || error?.<span class="hljs-property">name</span> === <span class="hljs-string">&#x27;AbortError&#x27;</span>) {
      <span class="hljs-keyword">await</span> repository.<span class="hljs-title function_">markCanceled</span>(taskId, { <span class="hljs-attr">reason</span>: signal.<span class="hljs-property">reason</span> });
      <span class="hljs-keyword">return</span> { <span class="hljs-attr">acknowledge</span>: <span class="hljs-literal">true</span> };
    }

    <span class="hljs-keyword">await</span> repository.<span class="hljs-title function_">recordAttemptFailure</span>(taskId, <span class="hljs-title function_">summarize</span>(error));
    <span class="hljs-keyword">return</span> { <span class="hljs-attr">acknowledge</span>: <span class="hljs-literal">false</span> };
  }
}
</code></pre></div>
<p>示例中的 <code>acknowledge: false</code> 代表交给队列的重投递策略；不同队列的 API 和语义不同，不能把这个对象直接当成某个厂商 SDK 的可运行代码。确认太早会在进程崩溃后丢任务，确认太晚则会使消息超时重复投递。消费者必须能承受同一任务同时被两个实例短暂处理，租约续期、版本条件更新和幂等状态转换要一起设计。</p>
<p><code>claimTask</code> 不能只是“先查询再更新”两步无条件操作。应使用数据库事务、条件更新或锁，让只有一个消费者能把同一版本从 <code>queued</code> 改为 <code>running</code>。租约过期后的接管也要检查版本和持有者，旧消费者恢复后不能继续覆盖新消费者的结果。</p>
<h2>幂等是重试的前提</h2>
<p>网络超时、进程崩溃和确认响应丢失都会造成“业务可能成功，但消费者不知道”的状态。此时重新投递是正常的，不能简单把重试次数当成重复执行的安全保证。任务应使用稳定的操作 ID 或幂等键：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">saveExportResult</span>(<span class="hljs-params">repository, taskId, artifact</span>) {
  <span class="hljs-keyword">return</span> repository.<span class="hljs-title function_">transaction</span>(<span class="hljs-title function_">async</span> (tx) =&gt; {
    <span class="hljs-keyword">const</span> task = <span class="hljs-keyword">await</span> tx.<span class="hljs-title function_">getTaskForUpdate</span>(taskId);
    <span class="hljs-keyword">if</span> (task.<span class="hljs-property">status</span> === <span class="hljs-string">&#x27;succeeded&#x27;</span>) <span class="hljs-keyword">return</span> task.<span class="hljs-property">result</span>;
    <span class="hljs-keyword">if</span> (task.<span class="hljs-property">status</span> === <span class="hljs-string">&#x27;canceled&#x27;</span>) <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">&#x27;任务已取消&#x27;</span>);

    <span class="hljs-keyword">await</span> tx.<span class="hljs-title function_">insertArtifactIfAbsent</span>({
      <span class="hljs-attr">idempotencyKey</span>: <span class="hljs-string">\`export:<span class="hljs-subst">\${taskId}</span>\`</span>,
      taskId,
      <span class="hljs-attr">location</span>: artifact.<span class="hljs-property">location</span>,
    });
    <span class="hljs-keyword">await</span> tx.<span class="hljs-title function_">markSucceeded</span>(taskId, { <span class="hljs-attr">result</span>: artifact.<span class="hljs-property">location</span> });
    <span class="hljs-keyword">return</span> artifact.<span class="hljs-property">location</span>;
  });
}
</code></pre></div>
<p>这个事务可以防止同一个任务重复登记结果，但它不能撤销已经发出的邮件、第三方支付请求或对象存储上传。外部副作用应使用幂等键、可查询状态、outbox 或补偿流程。生成文件时可以先写临时对象，数据库确认后再以原子命名或版本标记发布，避免用户看到半成品。</p>
<h2>取消命令必须有版本和权限</h2>
<p>取消接口不应只接受一个任务 ID 就把任意任务标成取消。服务端要验证当前用户、租户、任务版本和可取消状态；已经成功或进入不可逆外部副作用阶段的任务，可能只能标记“取消请求已收到”，而不能承诺完全撤销：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">requestCancel</span>(<span class="hljs-params">user, taskId, repository, queue</span>) {
  <span class="hljs-keyword">const</span> task = <span class="hljs-keyword">await</span> repository.<span class="hljs-title function_">requestCancelIfAllowed</span>({
    taskId,
    <span class="hljs-attr">ownerId</span>: user.<span class="hljs-property">id</span>,
    <span class="hljs-attr">allowedStatuses</span>: [<span class="hljs-string">&#x27;queued&#x27;</span>, <span class="hljs-string">&#x27;running&#x27;</span>],
  });

  <span class="hljs-keyword">if</span> (!task) {
    <span class="hljs-keyword">return</span> { <span class="hljs-attr">status</span>: <span class="hljs-string">&#x27;unchanged&#x27;</span> };
  }

  <span class="hljs-keyword">await</span> queue.<span class="hljs-title function_">publish</span>({
    <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;task.cancel-requested&#x27;</span>,
    taskId,
    <span class="hljs-attr">taskVersion</span>: task.<span class="hljs-property">version</span>,
  });
  <span class="hljs-keyword">return</span> { <span class="hljs-attr">status</span>: <span class="hljs-string">&#x27;cancel-requested&#x27;</span> };
}
</code></pre></div>
<p>消费者处理取消消息时要比较版本，不能让旧的取消事件覆盖后来重新提交的新任务。取消状态和执行状态最好由同一状态机约束，避免出现数据库显示 <code>canceled</code>、但消费者仍发布成功结果的竞态。即使取消命令返回成功，响应也应说明是“已请求取消”还是“已确认未执行”，不要模糊地承诺副作用已经消失。</p>
<h2>超时、重试和死信要按错误类型区分</h2>
<p>超时是一个截止时间，不等于任务失败原因。可以把错误分为：</p>
<ul>
<li>可暂时恢复的网络错误、限流和服务端 5xx：使用有上限的指数退避和随机抖动；</li>
<li>参数错误、权限拒绝和资源不存在：通常不应无限重试，应尽快标记失败并通知用户；</li>
<li>取消或过期任务：确认消息、停止后续工作，不要把用户主动取消记成系统故障；</li>
<li>代码 bug、数据损坏和未知异常：记录脱敏诊断，进入死信或人工处理队列。</li>
</ul>
<p>每次重试都要增加尝试次数、下次执行时间和原因，设置任务总截止时间。只设置“最多重试 3 次”而没有全局时间、队列容量和死信处理，仍可能在高峰时造成重试风暴。错误日志要避免输出令牌、完整任务输入和个人数据。</p>
<h2>优雅退出要停止接新消息并排空正在处理的任务</h2>
<p>收到 <code>SIGTERM</code> 后，消费者通常应先停止拉取新消息，再给当前任务一个有限时间完成或协作取消；不能立即确认所有消息，也不能无限等待一个不支持取消的下游：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">let</span> accepting = <span class="hljs-literal">true</span>;
<span class="hljs-keyword">const</span> running = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Set</span>();

<span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">onMessage</span>(<span class="hljs-params">message</span>) {
  <span class="hljs-keyword">if</span> (!accepting) <span class="hljs-keyword">return</span> <span class="hljs-title function_">requeue</span>(message);

  <span class="hljs-keyword">const</span> controller = <span class="hljs-keyword">new</span> <span class="hljs-title class_">AbortController</span>();
  <span class="hljs-keyword">const</span> job = <span class="hljs-title function_">consume</span>(message, repository, runExport, controller.<span class="hljs-property">signal</span>)
    .<span class="hljs-title function_">finally</span>(<span class="hljs-function">() =&gt;</span> running.<span class="hljs-title function_">delete</span>(job));
  running.<span class="hljs-title function_">add</span>(job);
  <span class="hljs-keyword">return</span> job;
}

<span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">shutdown</span>(<span class="hljs-params"></span>) {
  accepting = <span class="hljs-literal">false</span>;
  <span class="hljs-keyword">await</span> <span class="hljs-title function_">stopConsuming</span>();

  <span class="hljs-keyword">const</span> deadline = <span class="hljs-title class_">AbortSignal</span>.<span class="hljs-title function_">timeout</span>(<span class="hljs-number">10_000</span>);
  <span class="hljs-keyword">await</span> <span class="hljs-title class_">Promise</span>.<span class="hljs-title function_">race</span>([
    <span class="hljs-title class_">Promise</span>.<span class="hljs-title function_">allSettled</span>([...running]),
    <span class="hljs-keyword">new</span> <span class="hljs-title class_">Promise</span>(<span class="hljs-function">(<span class="hljs-params">resolve</span>) =&gt;</span> deadline.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;abort&#x27;</span>, resolve, { <span class="hljs-attr">once</span>: <span class="hljs-literal">true</span> })),
  ]);
  <span class="hljs-keyword">await</span> <span class="hljs-title function_">closeDatabaseAndQueue</span>();
}
</code></pre></div>
<p>示例只是生命周期示意，真实实现还要保存每个 controller，截止时向仍在运行的任务发出协作取消，并让队列根据确认结果重新投递未完成消息。<code>Promise.race</code> 返回后不代表另一组任务自动停止；关闭数据库前必须明确它们是完成、取消、重新入队还是失败。平台的 termination grace period、readiness 摘除延迟和消费者租约时间也要一起配置。</p>
<p>可靠的后台任务系统不追求“取消按钮一按，所有代码立刻消失”。它要让用户看到真实状态，让仍可取消的工作尽快停止，让已经发生的副作用可查询、可重试或可补偿，并用幂等和版本条件承受重复投递。<code>AbortSignal</code> 是执行层的协作信号，队列确认是投递层协议，数据库事务和业务状态机才是结果可信度的基础。</p>`};export{e as default};