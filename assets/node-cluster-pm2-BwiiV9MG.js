var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>一个 Node.js 进程里的 JavaScript 只跑在一个主线程上，机器有 8 核，单进程的 HTTP 服务也只能用满一核。cluster 模块的做法是让一个主进程 fork 出多个工作进程，每个工作进程跑同一份服务代码，并且都能监听同一个端口。</p>
<p>连接怎么分？除 Windows 外的平台默认用轮询：主进程自己监听端口、接收连接，再轮流交给工作进程。另一种方式是让工作进程直接接收连接，可官方文档说实际分配会很不均衡。</p>
<p>好处是用满多核，而且一个工作进程崩溃不影响其他进程，主进程收到 <code>exit</code> 事件后可以再 fork 一个。PM2 的 cluster 模式就是基于这个模块，再加上按 CPU 数量启动实例和零停机的 <code>reload</code>。</p>
<p>要注意两点。工作进程之间不共享内存，会话、登录状态、限流计数要放到 Redis 这类外部存储。还有，Node.js 不会自动维护工作进程的数量，崩溃后重启要应用或进程管理器自己做。</p>
</blockquote>
<h2>最小的 cluster 服务长什么样</h2>
<p>下面的写法来自 Node.js 官方文档，主进程按可用并行度 fork 工作进程，工作进程各自创建 HTTP 服务并监听 8000 端口。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">import</span> cluster <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;node:cluster&#x27;</span>;
<span class="hljs-keyword">import</span> http <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;node:http&#x27;</span>;
<span class="hljs-keyword">import</span> { availableParallelism } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;node:os&#x27;</span>;
<span class="hljs-keyword">import</span> process <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;node:process&#x27;</span>;

<span class="hljs-keyword">if</span> (cluster.<span class="hljs-property">isPrimary</span>) {
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">let</span> i = <span class="hljs-number">0</span>; i &lt; <span class="hljs-title function_">availableParallelism</span>(); i++) {
    cluster.<span class="hljs-title function_">fork</span>();
  }

  cluster.<span class="hljs-title function_">on</span>(<span class="hljs-string">&#x27;exit&#x27;</span>, <span class="hljs-function">(<span class="hljs-params">worker, code, signal</span>) =&gt;</span> {
    <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">\`工作进程 <span class="hljs-subst">\${worker.process.pid}</span> 退出，重新启动一个\`</span>);
    cluster.<span class="hljs-title function_">fork</span>();
  });
} <span class="hljs-keyword">else</span> {
  http
    .<span class="hljs-title function_">createServer</span>(<span class="hljs-function">(<span class="hljs-params">req, res</span>) =&gt;</span> {
      res.<span class="hljs-title function_">end</span>(<span class="hljs-string">\`由 <span class="hljs-subst">\${process.pid}</span> 处理\\n\`</span>);
    })
    .<span class="hljs-title function_">listen</span>(<span class="hljs-number">8000</span>);
}
</code></pre></div>
<p>同一份文件会执行多次。第一次执行时 <code>cluster.isPrimary</code> 为真，进入主进程分支；<code>cluster.fork()</code> 底层用的是 <code>child_process.fork()</code>，新进程重新执行这个文件，这时 <code>isPrimary</code> 为假，走工作进程分支。</p>
<p>多个进程都调用 <code>listen(8000)</code>，为什么不报端口占用？因为工作进程里的 <code>server.listen()</code> 会把大部分工作交给主进程，监听 socket 由主进程创建；在默认的轮询方式下，工作进程拿到的是主进程转交的连接。</p>
<p><code>exit</code> 事件里重新 <code>fork</code> 这一步必须自己写。官方文档明确说 Node.js 不会自动管理工作进程数量，进程全部退出后，已有连接会断开，新连接会被拒绝。</p>
<h2>连接是怎样分到各个工作进程的</h2>
<p>cluster 支持两种分配方式，对应 <code>cluster.schedulingPolicy</code> 的两个值。<code>SCHED_RR</code> 是轮询，主进程接收连接后轮流发给工作进程，这是除 Windows 外所有平台的默认值。<code>SCHED_NONE</code> 是把监听 socket 交给工作进程，由它们直接抢连接，交给操作系统调度。</p>
<p>第二种理论上更快，可官方文档记录过，8 个进程里超过 70% 的连接落到了其中 2 个进程上，所以默认用轮询。这个策略也能通过环境变量 <code>NODE_CLUSTER_SCHED_POLICY</code> 设置为 <code>rr</code> 或 <code>none</code>，在第一个工作进程启动后就不能再改。</p>
<h2>为什么状态不能放在进程内存里</h2>
<p>每个工作进程是独立的进程，内存完全隔离。如果把会话存在某个进程的一个对象里，用户下一次请求被分到另一个进程，就找不到这个会话了。官方文档也提醒，Node.js 不提供路由逻辑，应用不要过度依赖内存里的会话和登录数据。</p>
<p>所以多进程部署时，会话、缓存、限流计数要放进 Redis 或数据库；需要在进程之间传消息时，可以用工作进程和主进程之间的 IPC（<code>worker.send()</code> 和 <code>process.on(&#x27;message&#x27;)</code>），但它只在同一台机器上有效。</p>
<h2>PM2 在 cluster 之上做了什么</h2>
<p>PM2 是常见的 Node.js 进程管理器。它的文档说明，cluster 模式依赖 Node.js 的 cluster 模块，用 <code>pm2 start app.js -i max</code> 就能按 CPU 数量启动多个实例，应用代码不用改。</p>
<p>它还提供 <code>reload</code>：和先杀掉再启动的 <code>restart</code> 不同，<code>reload</code> 做到零停机重载；重载超时会退回普通的 <code>restart</code>。进程数量管理和不停机发布，正是手写 cluster 时要自己处理的部分。</p>
<p>选型时要知道 PM2 采用 AGPL-3.0 许可。另外在 Kubernetes 这类容器平台上，常见做法是每个容器只跑一个进程，扩容和重启交给平台，详见<a href="/questions/node-process-model/">《Node.js 的子进程、Worker 和集群应该怎样选择？》</a>。</p>
<h2>常见追问</h2>
<p><strong>cluster 和 Worker Threads 有什么区别？</strong></p>
<blockquote>
<p>cluster 复制的是整个服务进程，用来让 HTTP 服务用满多核，进程之间内存隔离。Worker Threads 是同一进程里的线程，用来把一段 CPU 密集的计算挪出主线程。前者解决吞吐，后者解决单个请求里的重计算。</p>
</blockquote>
<p><strong>发布新版本时怎样不中断服务？</strong></p>
<blockquote>
<p>思路是逐个替换：先启动新的工作进程，等它开始监听，再让旧进程调用 <code>worker.disconnect()</code> 停止接收新连接，处理完已有请求后退出。具体的退出细节见<a href="/questions/node-graceful-shutdown/">《Node.js 服务如何实现优雅退出？》</a>。</p>
</blockquote>`};export{e as default};