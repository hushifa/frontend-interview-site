var e={answerHtml:`<p>Node 的主线程如果忙于大型计算，就无法及时运行其他请求的 JavaScript 回调。把函数声明成 async 不会让循环自动并行。Worker Threads 提供独立的 JavaScript 执行线程，可以把 CPU 密集计算移出去，让主线程继续处理连接和调度。</p>
<p>但普通网络请求、文件异步 API 本来就有相应的异步机制，通常不需要每次调用再创建一个 Worker。某些内置压缩或加密 API 也已有异步实现，应先确认瓶颈究竟在哪。</p>
<h3>一个独立运行的 Worker 示例</h3>
<p>将下面代码保存为 sum.mjs，在 Node 中运行。示例使用一个 Worker 演示消息和退出处理，不是生产线程池：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">import</span> { <span class="hljs-title class_">Worker</span>, isMainThread, parentPort, workerData } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;node:worker_threads&#x27;</span>;

<span class="hljs-keyword">if</span> (isMainThread) {
  <span class="hljs-keyword">const</span> result = <span class="hljs-keyword">await</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Promise</span>(<span class="hljs-function">(<span class="hljs-params">resolve, reject</span>) =&gt;</span> {
    <span class="hljs-keyword">const</span> worker = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Worker</span>(<span class="hljs-keyword">new</span> <span class="hljs-title function_">URL</span>(<span class="hljs-keyword">import</span>.<span class="hljs-property">meta</span>.<span class="hljs-property">url</span>), {
      <span class="hljs-attr">workerData</span>: { <span class="hljs-attr">count</span>: <span class="hljs-number">1_000_000</span> },
    });
    <span class="hljs-keyword">let</span> received = <span class="hljs-literal">false</span>;
    <span class="hljs-keyword">let</span> answer;

    worker.<span class="hljs-title function_">once</span>(<span class="hljs-string">&#x27;message&#x27;</span>, <span class="hljs-function">(<span class="hljs-params">value</span>) =&gt;</span> {
      received = <span class="hljs-literal">true</span>;
      answer = value;
    });
    worker.<span class="hljs-title function_">once</span>(<span class="hljs-string">&#x27;error&#x27;</span>, reject);
    worker.<span class="hljs-title function_">once</span>(<span class="hljs-string">&#x27;exit&#x27;</span>, <span class="hljs-function">(<span class="hljs-params">code</span>) =&gt;</span> {
      <span class="hljs-keyword">if</span> (code !== <span class="hljs-number">0</span>) <span class="hljs-title function_">reject</span>(<span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">\`计算线程异常退出：<span class="hljs-subst">\${code}</span>\`</span>));
      <span class="hljs-keyword">else</span> <span class="hljs-keyword">if</span> (!received) <span class="hljs-title function_">reject</span>(<span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">&#x27;计算线程没有返回结果&#x27;</span>));
      <span class="hljs-keyword">else</span> <span class="hljs-title function_">resolve</span>(answer);
    });
  });

  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(result); <span class="hljs-comment">// 500000500000</span>
} <span class="hljs-keyword">else</span> {
  <span class="hljs-keyword">const</span> { count } = workerData;
  <span class="hljs-keyword">if</span> (!<span class="hljs-title class_">Number</span>.<span class="hljs-title function_">isSafeInteger</span>(count) || count &lt; <span class="hljs-number">0</span> || count &gt; <span class="hljs-number">1_000_000</span>) {
    <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">RangeError</span>(<span class="hljs-string">&#x27;计算规模超出示例限制&#x27;</span>);
  }
  <span class="hljs-keyword">let</span> total = <span class="hljs-number">0</span>;
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">let</span> i = <span class="hljs-number">1</span>; i &lt;= count; i += <span class="hljs-number">1</span>) total += i;
  parentPort.<span class="hljs-title function_">postMessage</span>(total);
}
</code></pre></div>
<p>同一文件在主线程和 Worker 中分别执行，通过 isMainThread 进入不同分支。workerData 提供初始任务，postMessage 发送结果。示例等待 Worker 正常退出后才返回结果，避免把“收到一条消息”直接当作整个任务生命周期成功。</p>
<p>这段求和存在数学公式，实际不会为了它启动线程；循环只是为了展示 CPU 工作的位置。真实收益取决于计算量是否足以抵消启动和通信成本。</p>
<h3>传递数据有三种不同成本</h3>
<p>普通消息默认使用结构化克隆，双方得到独立数据。函数不能这样克隆，普通类实例也不能期待原型和方法按原样保留；任务协议应使用明确的数据结构。</p>
<p>对合适的 ArrayBuffer，可以通过 transferList 转移底层存储。转移后发送方的相关视图不能继续像原来那样使用这块内存，因此要明确所有权。Node Buffer 还可能共享内部池，不应未经确认就转移它的底层 buffer，避免复制范围或所有权与预期不符。</p>
<p>SharedArrayBuffer 则让线程访问共享内存，不是复制，也不是让原对象自动线程安全。多线程读写共享状态需要 Atomics 等同步协议；普通 <code>counter++</code> 不是跨线程原子操作。</p>
<h3>生产环境通常需要池和排队上限</h3>
<p>每个请求创建一个 Worker 会产生启动成本，也可能在高峰期启动过多线程。更常见的是维护有限 Worker 池，任务按容量排队，并限制输入规模、排队长度和执行时间。</p>
<p>线程数不是越多越快。CPU 核心、每个 Worker 的堆内存、主线程负担和数据传输成本都要测量。队列满时还需要拒绝、降级或延迟机制，否则只是把主线程阻塞变成内存中的任务堆积。</p>
<h3>取消不是发一条消息就一定停下</h3>
<p>若 Worker 正在执行不让出线程的大循环，它也无法立即处理“取消”消息。可以采用分片计算、共享原子标志协作检查，或在必要时调用 terminate 强制停止。</p>
<p>强制终止不能当作 finally 一定执行的优雅退出，也不能撤销已经写出的文件或外部副作用。任务设计最好让结果在成功后统一提交，失败时有明确清理。</p>
<p>Worker 与主线程仍属于同一进程，不是执行恶意代码的安全沙箱。它可以使用 Node 能力，进程级资源耗尽或底层故障也可能影响整体。需要更强进程隔离时评估子进程或独立服务；要扩展服务实例处理能力时，进程级部署与负载均衡又是另一层问题。</p>`};export{e as default};