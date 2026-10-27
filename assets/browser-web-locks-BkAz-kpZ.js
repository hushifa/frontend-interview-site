var e={answerHtml:`<p>两个标签页同时刷新同一份本地数据时，可能都读到旧值，再各自写回，后写入的一方覆盖前一方。Web Locks 允许它们约定一个同源锁名，让同名任务在获得锁后按顺序执行。</p>
<h3>锁保护的是一段异步回调</h3>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">refreshSharedData</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">if</span> (!navigator.<span class="hljs-property">locks</span>) <span class="hljs-keyword">return</span> <span class="hljs-title function_">updateWithoutLock</span>();
  <span class="hljs-keyword">return</span> navigator.<span class="hljs-property">locks</span>.<span class="hljs-title function_">request</span>(<span class="hljs-string">&#x27;shared-data-refresh&#x27;</span>, <span class="hljs-title function_">async</span> (lock) =&gt; {
    <span class="hljs-keyword">if</span> (!lock) <span class="hljs-keyword">return</span>;
    <span class="hljs-keyword">const</span> latest = <span class="hljs-keyword">await</span> <span class="hljs-title function_">readFromServer</span>();
    <span class="hljs-keyword">await</span> <span class="hljs-title function_">writeToIndexedDb</span>(latest);
    <span class="hljs-keyword">return</span> latest;
  });
}
</code></pre></div>
<p>回调返回的 Promise 完成后，锁才会释放。只有所有访问者都遵守相同的锁名和协议，才能形成协作；一个绕过锁的页面仍可能并发写入。</p>
<p>锁名按资源划分，不要把完全无关的任务都放进一个全局锁，否则会产生不必要排队。也不要随意给同一资源起多个名字，否则互斥关系失效。</p>
<h3>exclusive 与 shared 表达不同关系</h3>
<p>默认是独占锁，同名任务必须等待前一个完成。shared 模式允许多个读者同时持有，但独占写者要等现有共享者退出。这个约定只有在读写访问者都按相同规则工作时才有意义。</p>
<p>请求可以使用 AbortSignal 取消等待中的锁请求。取消等待不会自动中止一个已经获得锁的回调；回调内部仍需把 signal 传给 fetch、读取或其他可取消工作，并在安全位置检查是否应该停止。</p>
<h3>它不是通用事务和死锁解决器</h3>
<p>Web Locks 只协调锁请求，不让 localStorage 的读取和写入自动变成事务，也不会替 IndexedDB 或服务端提供一致性。重要数据应使用合适的事务存储与服务端约束。</p>
<p>如果持锁回调等待永不结束的 Promise，其他请求会一直排队。不要在锁内等待用户点击、打开确认框或做与共享资源无关的长任务；需要超时和恢复时，把取消协议设计进工作本身。</p>
<p>多个锁按不同顺序互相等待可能造成应用层死锁。尽量只申请一个明确锁，或规定一致的申请顺序，并在必要时使用 ifAvailable 等策略降级，而不是无限等待。</p>
<h3>标签页关闭时不应依赖清理回调</h3>
<p>浏览器关闭、崩溃或冻结页面时，锁最终会随执行上下文释放，但业务未必已经完成。不能把“持锁者消失”当成同步成功；任务需要可重试、幂等和状态恢复。</p>
<p>这项 API 适合协调刷新、领导者选举和同源后台工作，不适合保存密钥或替代服务端分布式锁。支持度也应按目标浏览器与 WebView 核对，无法使用时准备不会破坏数据的降级路径。</p>
<h3>ifAvailable 与排队策略</h3>
<p>默认请求会等待同名锁释放。如果页面只是想在有空时刷新一次，不希望因为后台标签页长期占用而排队，可以使用 <code>ifAvailable</code>：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">refreshIfIdle</span>(<span class="hljs-params">refresh</span>) {
  <span class="hljs-keyword">if</span> (!navigator.<span class="hljs-property">locks</span>) <span class="hljs-keyword">return</span> <span class="hljs-literal">false</span>;
  <span class="hljs-keyword">const</span> result = <span class="hljs-keyword">await</span> navigator.<span class="hljs-property">locks</span>.<span class="hljs-title function_">request</span>(
    <span class="hljs-string">&#x27;refresh-catalog&#x27;</span>,
    { <span class="hljs-attr">ifAvailable</span>: <span class="hljs-literal">true</span> },
    <span class="hljs-title function_">async</span> (lock) =&gt; {
      <span class="hljs-keyword">if</span> (!lock) <span class="hljs-keyword">return</span> <span class="hljs-literal">false</span>;
      <span class="hljs-keyword">await</span> <span class="hljs-title function_">refresh</span>();
      <span class="hljs-keyword">return</span> <span class="hljs-literal">true</span>;
    },
  );
  <span class="hljs-keyword">return</span> result;
}
</code></pre></div>
<p>返回 false 表示这次没有获得锁，不代表刷新失败；产品可以等待下一次可见、在线或用户操作。不能把 ifAvailable 当成“抢锁”，也不能在拿不到锁时绕过协议直接写入共享资源。</p>
<h3>锁请求的返回值和异常</h3>
<p>request 返回回调的结果，因此可以把“是否执行”和执行结果传回调用方。回调抛出的错误会使请求 Promise 拒绝；如果业务需要记录失败并释放锁，应在回调内部处理或让上层明确捕获。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> result = <span class="hljs-keyword">await</span> navigator.<span class="hljs-property">locks</span>.<span class="hljs-title function_">request</span>(<span class="hljs-string">&#x27;settings&#x27;</span>, <span class="hljs-title function_">async</span> () =&gt; {
  <span class="hljs-keyword">const</span> settings = <span class="hljs-keyword">await</span> <span class="hljs-title function_">readSettings</span>();
  <span class="hljs-keyword">if</span> (!settings) <span class="hljs-keyword">return</span> { <span class="hljs-attr">updated</span>: <span class="hljs-literal">false</span>, <span class="hljs-attr">reason</span>: <span class="hljs-string">&#x27;missing&#x27;</span> };
  <span class="hljs-keyword">await</span> <span class="hljs-title function_">writeSettings</span>({ ...settings, <span class="hljs-attr">version</span>: settings.<span class="hljs-property">version</span> + <span class="hljs-number">1</span> });
  <span class="hljs-keyword">return</span> { <span class="hljs-attr">updated</span>: <span class="hljs-literal">true</span> };
});
</code></pre></div>
<p>锁并不自动重试异常，也不保证回调内的两次存储操作构成原子事务。如果第二次写入失败，应用需要存储层支持回滚或使用事务，不能靠锁撤销已经完成的第一步。</p>
<h3>取消等待与中止工作要分开</h3>
<p>把 signal 传给 request 可以取消还在队列中等待的请求。若回调已经取得锁，取消信号不会自动打断它；应把同一个 signal 传给可取消的网络任务，并在写入前后检查状态。</p>
<p>锁内不应等待用户确认。如果业务必须审批，可以先在锁外取得确认，或把资源状态设计成“待处理”，在锁内只做短而明确的状态转换，避免其他标签页长时间饥饿。</p>
<h3>跨上下文和故障恢复</h3>
<p>锁只在同一 origin 内协调，协议、端口或子域不同就不是同一个锁管理器。页面、Worker 和其他同源上下文可以参与，但每个参与者都必须使用一致的名称、mode 与数据访问流程。</p>
<p>浏览器崩溃后锁会释放，但持锁工作可能只完成一半。任务记录应有 pending/running/succeeded 等状态和超时恢复策略；重新获得锁时先检查上次任务是否已经实际完成，避免重复副作用。</p>
<p>调试并发问题时可以使用 <code>navigator.locks.query()</code> 查看当前持有和等待的锁，但这是某个时刻的快照，不应拿它作为精确的事务判断。Web Locks 让协作更容易，却仍要求应用自己建立可靠的数据协议。</p>
<h3>领导者选举不能只看一个布尔值</h3>
<p>常见用法是让多个标签页竞争一个 <code>app-leader</code> 锁，由拿到锁的页面执行轮询或定时同步：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">runLeaderTask</span>(<span class="hljs-params">signal</span>) {
  <span class="hljs-keyword">await</span> navigator.<span class="hljs-property">locks</span>.<span class="hljs-title function_">request</span>(<span class="hljs-string">&#x27;app-leader&#x27;</span>, <span class="hljs-title function_">async</span> (lock) =&gt; {
    <span class="hljs-keyword">if</span> (!lock) <span class="hljs-keyword">return</span>;
    <span class="hljs-keyword">while</span> (!signal.<span class="hljs-property">aborted</span> &amp;&amp; <span class="hljs-variable language_">document</span>.<span class="hljs-property">visibilityState</span> !== <span class="hljs-string">&#x27;hidden&#x27;</span>) {
      <span class="hljs-keyword">await</span> <span class="hljs-title function_">syncOnce</span>();
      <span class="hljs-keyword">await</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Promise</span>(<span class="hljs-function">(<span class="hljs-params">resolve</span>) =&gt;</span> <span class="hljs-built_in">setTimeout</span>(resolve, <span class="hljs-number">10_000</span>));
    }
  });
}
</code></pre></div>
<p>锁释放后另一个页面可以接管，但页面是否可见、网络是否在线、同步任务是否已经完成，仍然需要业务状态配合。不要把“当前持有锁”当作永久主节点身份，也不要在锁内无限循环而不给出退出条件。实际项目通常会在 <code>visibilitychange</code>、<code>online</code> 和 <code>pagehide</code> 时结束当前工作，让更合适的页面重新竞争。</p>
<h3>锁名和数据版本要一起设计</h3>
<p>同一资源如果既有刷新任务又有用户编辑任务，最好明确它们是否需要同一把锁，以及写入时如何比较版本。例如读取配置后记录 <code>version</code>，写回时让存储层检查版本没有变化；只有锁而没有版本检查，仍可能被未遵守协议的旧页面覆盖。</p>
<p>锁的粒度也会影响体验。把整个同步流程放进一把大锁容易让设置保存、缓存清理互相阻塞；拆成太多锁又会让顺序难以推理。应优先围绕“哪一段写操作必须互斥”划分锁，网络请求和纯计算尽量放在锁外，拿到结果后再用短锁提交。</p>
<h3>观测和降级要能解释“没执行”</h3>
<p>当任务因为 <code>ifAvailable</code> 没拿到锁时，界面不应提示“同步失败”，而应记录为稍后重试或由其他标签页完成。可以记录等待时长、锁名、任务类型和最终结果，帮助区分锁竞争、网络失败与存储异常。降级到没有 Web Locks 的浏览器时，优先使用 IndexedDB 事务、BroadcastChannel 协调或允许重复但幂等的操作；不要简单删除锁后继续执行原来的并发写入。</p>`};export{e as default};