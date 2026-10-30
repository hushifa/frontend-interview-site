var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>Node.js 文档建议 CPU 密集任务用 Worker 池来跑，因为每个 Worker 都要初始化独立的 V8 实例和事件循环，每来一个任务就新建一个，创建的开销可能超过它带来的收益，并发一高线程数和内存也控制不住。为什么需要 Worker、线程之间怎样传数据，见<a href="/questions/node-worker-threads/">《Node.js Worker Threads 适合解决什么问题？》</a>。</p>
<p>任务池的做法是提前建好固定数量的 Worker，通常不超过 <code>os.availableParallelism()</code>。有任务来了，交给空闲的 Worker；没有空闲的，就先进队列排着。</p>
<p>每个任务带一个 ID，结果回来时按 ID 找到对应的调用方。某个 Worker 崩溃了，就让它手上的任务失败，再补一个新 Worker。</p>
<p>放到生产环境还要补几样：排队上限、任务超时，以及关闭时先等在途任务完成再终止 Worker。</p>
</blockquote>
<h2>一个能跑的最小任务池</h2>
<p>下面的池子开 2 个 Worker，计算几个斐波那契数。重点看 <code>#idle</code>、<code>#queue</code>、<code>#pending</code> 这三个结构怎么配合：</p>
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
<p><code>#idle</code> 放空闲的 Worker，<code>#queue</code> 放还没分到 Worker 的任务，<code>#pending</code> 按 ID 记着已经派出去、还没回来的任务。<code>run</code> 被调用时，有空闲 Worker 就直接派发，没有就排队。一个 Worker 算完发回消息，<code>#release</code> 先看队列里有没有等着的任务，有就接着干，没有才回到空闲列表。</p>
<p>四个任务同时提交，池子只有 2 个 Worker，所以后两个任务先排队，等前面的算完才被派出去。结果仍然按提交顺序排列，因为每个 Promise 只认自己的 ID，<code>Promise.all</code> 也按数组顺序返回。</p>
<p>示例为了能单独运行，用 <code>eval: true</code> 内联了 Worker 代码，实际项目应该放在独立文件里。<code>close()</code> 只终止空闲的 Worker，调用前要确保所有任务都已经完成。</p>
<h2>放到生产环境还要补什么</h2>
<table><thead><tr><th>问题</th><th>处理方式</th></tr></thead><tbody><tr><td>队列无限增长</td><td>设置排队上限，超过时直接拒绝，例如返回 503，让上游重试或降级</td></tr><tr><td>单个任务卡死</td><td>给任务设超时；超时后终止对应 Worker 并补一个新的</td></tr><tr><td>优雅关闭</td><td>停止接收新任务，等待队列和在途任务完成，再调用 <code>terminate()</code></td></tr><tr><td>大块二进制数据</td><td>用 transferList 转移 ArrayBuffer，避免复制</td></tr></tbody></table>
<h2>池子开多大合适</h2>
<p>一般按 CPU 核数来定。Worker 数超过核数，线程之间只是互相抢 CPU，总吞吐并不会提高。如果同一台机器上还跑着多个 Node.js 进程，每个进程的池都要相应缩小。</p>
<p>成熟的实现可以直接用 Piscina 这类库，上面这些问题它都处理了。</p>
<h2>常见追问</h2>
<p><strong>为什么不用 <code>cluster</code> 代替？</strong></p>
<blockquote>
<p>cluster 复制整个服务进程来分担请求，适合扩展 I/O 吞吐；任务池是把单个请求里的重计算移出主线程。两者解决的问题不同。</p>
</blockquote>`};export{e as default};