var e={answerHtml:`<h2>简答</h2>
<ul>
<li>创建 Worker 要初始化独立的 V8 实例和事件循环，按请求创建会让启动成本叠加到每个请求上，并发高时线程数和内存不受控。</li>
<li>任务池预先创建固定数量的 Worker（通常不超过 <code>os.availableParallelism()</code>），空闲时直接派发任务，没有空闲时进入队列。</li>
<li>每个任务用 ID 对应结果；某个 Worker 崩溃时，让它正在执行的任务失败，并补一个新 Worker。</li>
<li>生产环境还需要排队上限和超时，并在关闭时等待在途任务完成后再终止 Worker。</li>
</ul>
<h2>最小实现</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">import</span> { <span class="hljs-title class_">Worker</span> } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;node:worker_threads&#x27;</span>;
<span class="hljs-keyword">import</span> { availableParallelism } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;node:os&#x27;</span>;

<span class="hljs-keyword">const</span> workerSource = <span class="hljs-string">\`
const { parentPort } = require(&#x27;node:worker_threads&#x27;);
parentPort.on(&#x27;message&#x27;, ({ id, n }) =&gt; {
  let a = 0n, b = 1n;
  for (let i = 0; i &lt; n; i++) [a, b] = [b, a + b];
  parentPort.postMessage({ id, value: a.toString() });
});
\`</span>;

<span class="hljs-keyword">class</span> <span class="hljs-title class_">WorkerPool</span> {
  #idle = [];
  #queue = [];
  #pending = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Map</span>();
  #nextId = <span class="hljs-number">0</span>;

  <span class="hljs-title function_">constructor</span>(<span class="hljs-params">size</span>) {
    <span class="hljs-keyword">for</span> (<span class="hljs-keyword">let</span> i = <span class="hljs-number">0</span>; i &lt; size; i++) <span class="hljs-variable language_">this</span>.#<span class="hljs-title function_">spawn</span>();
  }

  #<span class="hljs-title function_">spawn</span>(<span class="hljs-params"></span>) {
    <span class="hljs-keyword">const</span> worker = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Worker</span>(workerSource, { <span class="hljs-attr">eval</span>: <span class="hljs-literal">true</span> });
    worker.<span class="hljs-title function_">on</span>(<span class="hljs-string">&#x27;message&#x27;</span>, <span class="hljs-function">(<span class="hljs-params">{ id, value }</span>) =&gt;</span> {
      <span class="hljs-variable language_">this</span>.#pending.<span class="hljs-title function_">get</span>(id).<span class="hljs-title function_">resolve</span>(value);
      <span class="hljs-variable language_">this</span>.#pending.<span class="hljs-title function_">delete</span>(id);
      <span class="hljs-variable language_">this</span>.#<span class="hljs-title function_">release</span>(worker);
    });
    worker.<span class="hljs-title function_">on</span>(<span class="hljs-string">&#x27;error&#x27;</span>, <span class="hljs-function">(<span class="hljs-params">error</span>) =&gt;</span> {
      <span class="hljs-comment">// 崩溃的 Worker 上正在执行的任务失败，再补一个新 Worker。</span>
      <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> [id, task] <span class="hljs-keyword">of</span> <span class="hljs-variable language_">this</span>.#pending) {
        <span class="hljs-keyword">if</span> (task.<span class="hljs-property">worker</span> === worker) {
          task.<span class="hljs-title function_">reject</span>(error);
          <span class="hljs-variable language_">this</span>.#pending.<span class="hljs-title function_">delete</span>(id);
        }
      }
      <span class="hljs-variable language_">this</span>.#<span class="hljs-title function_">spawn</span>();
    });
    <span class="hljs-variable language_">this</span>.#<span class="hljs-title function_">release</span>(worker);
  }

  #<span class="hljs-title function_">release</span>(<span class="hljs-params">worker</span>) {
    <span class="hljs-keyword">const</span> next = <span class="hljs-variable language_">this</span>.#queue.<span class="hljs-title function_">shift</span>();
    <span class="hljs-keyword">if</span> (next) <span class="hljs-variable language_">this</span>.#<span class="hljs-title function_">dispatch</span>(worker, next);
    <span class="hljs-keyword">else</span> <span class="hljs-variable language_">this</span>.#idle.<span class="hljs-title function_">push</span>(worker);
  }

  #<span class="hljs-title function_">dispatch</span>(<span class="hljs-params">worker, task</span>) {
    <span class="hljs-variable language_">this</span>.#pending.<span class="hljs-title function_">set</span>(task.<span class="hljs-property">id</span>, { ...task, worker });
    worker.<span class="hljs-title function_">postMessage</span>({ <span class="hljs-attr">id</span>: task.<span class="hljs-property">id</span>, <span class="hljs-attr">n</span>: task.<span class="hljs-property">n</span> });
  }

  <span class="hljs-title function_">run</span>(<span class="hljs-params">n</span>) {
    <span class="hljs-keyword">return</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Promise</span>(<span class="hljs-function">(<span class="hljs-params">resolve, reject</span>) =&gt;</span> {
      <span class="hljs-keyword">const</span> task = { <span class="hljs-attr">id</span>: <span class="hljs-variable language_">this</span>.#nextId++, n, resolve, reject };
      <span class="hljs-keyword">const</span> worker = <span class="hljs-variable language_">this</span>.#idle.<span class="hljs-title function_">pop</span>();
      <span class="hljs-keyword">if</span> (worker) <span class="hljs-variable language_">this</span>.#<span class="hljs-title function_">dispatch</span>(worker, task);
      <span class="hljs-keyword">else</span> <span class="hljs-variable language_">this</span>.#queue.<span class="hljs-title function_">push</span>(task);
    });
  }

  <span class="hljs-keyword">async</span> <span class="hljs-title function_">close</span>(<span class="hljs-params"></span>) {
    <span class="hljs-keyword">await</span> <span class="hljs-title class_">Promise</span>.<span class="hljs-title function_">all</span>(<span class="hljs-variable language_">this</span>.#idle.<span class="hljs-title function_">map</span>(<span class="hljs-function">(<span class="hljs-params">worker</span>) =&gt;</span> worker.<span class="hljs-title function_">terminate</span>()));
  }
}

<span class="hljs-keyword">const</span> pool = <span class="hljs-keyword">new</span> <span class="hljs-title class_">WorkerPool</span>(<span class="hljs-title class_">Math</span>.<span class="hljs-title function_">min</span>(<span class="hljs-number">2</span>, <span class="hljs-title function_">availableParallelism</span>()));
<span class="hljs-keyword">const</span> results = <span class="hljs-keyword">await</span> <span class="hljs-title class_">Promise</span>.<span class="hljs-title function_">all</span>([<span class="hljs-number">10</span>, <span class="hljs-number">20</span>, <span class="hljs-number">30</span>, <span class="hljs-number">90</span>].<span class="hljs-title function_">map</span>(<span class="hljs-function">(<span class="hljs-params">n</span>) =&gt;</span> pool.<span class="hljs-title function_">run</span>(n)));
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(results); <span class="hljs-comment">// [ &#x27;55&#x27;, &#x27;6765&#x27;, &#x27;832040&#x27;, &#x27;2880067194370816120&#x27; ]</span>
<span class="hljs-keyword">await</span> pool.<span class="hljs-title function_">close</span>();
</code></pre></div>
<p>示例为了能单独运行，用 <code>eval: true</code> 内联了 Worker 代码，实际项目应放在独立文件里。<code>close()</code> 只终止空闲 Worker，调用前要确保所有任务已经完成。</p>
<h2>生产环境要补的部分</h2>
<table><thead><tr><th>问题</th><th>处理方式</th></tr></thead><tbody><tr><td>队列无限增长</td><td>设置排队上限，超过时直接拒绝，例如返回 503，让上游重试或降级</td></tr><tr><td>单个任务卡死</td><td>给任务设超时；超时后终止对应 Worker 并补一个新的</td></tr><tr><td>优雅关闭</td><td>停止接收新任务，等待队列和在途任务完成，再调用 <code>terminate()</code></td></tr><tr><td>请求上下文</td><td>AsyncLocalStorage 的 store 不会跨线程，需要在消息里带上请求 ID</td></tr><tr><td>大块二进制数据</td><td>用 transferList 转移 ArrayBuffer，避免复制</td></tr></tbody></table>
<p>池的大小一般按 CPU 核数设置。Worker 数超过核数时，线程之间互相抢占，总吞吐不会提高。如果同一台机器上还运行着多个 Node.js 进程，每个进程的池应相应缩小。</p>
<p>成熟的实现可以直接用 Piscina 这类库，它处理了上面这些问题。</p>
<h2>常见追问</h2>
<ul>
<li><strong>为什么不用 <code>cluster</code> 代替？</strong> cluster 复制整个服务进程来分担请求，适合扩展 I/O 吞吐；任务池把单个请求里的重计算移出主线程，两者解决的问题不同。</li>
<li><strong>Worker 线程和 libuv 线程池是一回事吗？</strong> 不是。libuv 线程池（默认 4 个线程）执行 fs、dns.lookup、部分 crypto 和 zlib 操作，不运行 JavaScript；Worker Threads 运行 JavaScript。</li>
</ul>`};export{e as default};