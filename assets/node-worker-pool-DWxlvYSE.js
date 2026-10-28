var e={answerHtml:`<h2>简答</h2>
<ul>
<li>每个请求都新建 Worker 会带来启动成本，还可能在高峰期耗尽资源。</li>
<li>任务池固定线程数，并限制排队长度，队列满时快速拒绝。</li>
<li>Worker 崩溃时要拒绝它正在处理的任务，再决定替换线程还是关闭整个池。</li>
<li>主线程和 Worker 之间传递数据会产生结构化克隆的成本。</li>
</ul>
<p>Node.js 很适合处理大量 I/O，但图片缩放、PDF 解析、压缩和复杂 JSON 计算如果在主线程同步执行，会阻塞所有请求。Worker Threads 可以把 JavaScript 计算放到其他线程，但每次请求都创建一个 Worker 会承担启动、加载模块和内存成本，还可能被恶意请求耗尽资源。任务池的作用是复用有限数量的 Worker，让任务排队并控制总并发。</p>
<h2>Worker 解决的是 CPU 隔离，不是自动加速</h2>
<p>主线程和 Worker 有各自的事件循环和堆，默认通过消息传递数据。把一个很小的任务丢进 Worker，结构化克隆和线程调度的成本可能比计算本身还大。适合放入 Worker 的通常是持续几十毫秒以上、可以独立计算且不需要直接访问 DOM 的工作；数据库、网络和文件 I/O 不一定需要 Worker。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// worker.mjs</span>
<span class="hljs-keyword">import</span> { parentPort } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;node:worker_threads&#x27;</span>;

parentPort.<span class="hljs-title function_">on</span>(<span class="hljs-string">&#x27;message&#x27;</span>, <span class="hljs-function">(<span class="hljs-params">{ id, values }</span>) =&gt;</span> {
  <span class="hljs-keyword">try</span> {
    <span class="hljs-keyword">const</span> total = values.<span class="hljs-title function_">reduce</span>(<span class="hljs-function">(<span class="hljs-params">sum, value</span>) =&gt;</span> sum + value * value, <span class="hljs-number">0</span>);
    parentPort.<span class="hljs-title function_">postMessage</span>({ id, <span class="hljs-attr">ok</span>: <span class="hljs-literal">true</span>, <span class="hljs-attr">result</span>: total });
  } <span class="hljs-keyword">catch</span> (error) {
    parentPort.<span class="hljs-title function_">postMessage</span>({ id, <span class="hljs-attr">ok</span>: <span class="hljs-literal">false</span>, <span class="hljs-attr">error</span>: <span class="hljs-title class_">String</span>(error) });
  }
});
</code></pre></div>
<p>示例中的 Worker 只处理可序列化数据，不能访问主线程的请求对象或数据库连接。生产代码还要限制输入大小，不能让用户提交无限长度数组来占满线程和内存。</p>
<h2>任务池要限制队列和线程数量</h2>
<p>一个基本任务池需要记录空闲 Worker、运行中的任务和等待队列。提交任务时如果队列超过上限，应快速拒绝或返回“稍后重试”，不能无限把任务放进内存。线程数量通常不应简单等于请求并发数，而要结合 CPU 核数、任务耗时、其他 Node 进程和部署容器的 CPU 配额决定。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">import</span> { <span class="hljs-title class_">Worker</span> } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;node:worker_threads&#x27;</span>;

<span class="hljs-keyword">export</span> <span class="hljs-keyword">class</span> <span class="hljs-title class_">WorkerPool</span> {
  #workers;
  #queue = [];
  #nextId = <span class="hljs-number">1</span>;
  #closed = <span class="hljs-literal">false</span>;
  #closing;

  <span class="hljs-title function_">constructor</span>(<span class="hljs-params">url, size = <span class="hljs-number">2</span>, maxQueue = <span class="hljs-number">50</span></span>) {
    <span class="hljs-keyword">if</span> (!<span class="hljs-title class_">Number</span>.<span class="hljs-title function_">isInteger</span>(size) || size &lt; <span class="hljs-number">1</span> || size &gt; <span class="hljs-number">32</span> ||
        !<span class="hljs-title class_">Number</span>.<span class="hljs-title function_">isInteger</span>(maxQueue) || maxQueue &lt; <span class="hljs-number">1</span> || maxQueue &gt; <span class="hljs-number">1000</span>) {
      <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">RangeError</span>(<span class="hljs-string">&#x27;线程数须为 1～32，等待队列容量须为 1～1000&#x27;</span>);
    }
    <span class="hljs-variable language_">this</span>.#workers = [];
    <span class="hljs-variable language_">this</span>.<span class="hljs-property">maxQueue</span> = maxQueue;
    <span class="hljs-keyword">try</span> {
      <span class="hljs-keyword">for</span> (<span class="hljs-keyword">let</span> index = <span class="hljs-number">0</span>; index &lt; size; index += <span class="hljs-number">1</span>) {
        <span class="hljs-keyword">const</span> slot = { <span class="hljs-attr">worker</span>: <span class="hljs-keyword">new</span> <span class="hljs-title class_">Worker</span>(url), <span class="hljs-attr">busy</span>: <span class="hljs-literal">false</span>, <span class="hljs-attr">task</span>: <span class="hljs-literal">null</span> };
        <span class="hljs-variable language_">this</span>.#workers.<span class="hljs-title function_">push</span>(slot);
        slot.<span class="hljs-property">worker</span>.<span class="hljs-title function_">on</span>(<span class="hljs-string">&#x27;message&#x27;</span>, <span class="hljs-function">(<span class="hljs-params">message</span>) =&gt;</span> <span class="hljs-variable language_">this</span>.#<span class="hljs-title function_">finish</span>(slot, message));
        slot.<span class="hljs-property">worker</span>.<span class="hljs-title function_">on</span>(<span class="hljs-string">&#x27;error&#x27;</span>, <span class="hljs-function">(<span class="hljs-params">error</span>) =&gt;</span> <span class="hljs-variable language_">this</span>.#<span class="hljs-title function_">failSlot</span>(slot, error));
        slot.<span class="hljs-property">worker</span>.<span class="hljs-title function_">on</span>(<span class="hljs-string">&#x27;exit&#x27;</span>, <span class="hljs-function">(<span class="hljs-params">code</span>) =&gt;</span> {
          <span class="hljs-keyword">if</span> (!<span class="hljs-variable language_">this</span>.#closed) <span class="hljs-variable language_">this</span>.#<span class="hljs-title function_">failSlot</span>(slot, <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">\`Worker 意外退出：<span class="hljs-subst">\${code}</span>\`</span>));
        });
      }
    } <span class="hljs-keyword">catch</span> (error) {
      <span class="hljs-comment">// 构造函数不能 await；发起已创建线程的回收，再传播启动错误。</span>
      <span class="hljs-keyword">void</span> <span class="hljs-variable language_">this</span>.<span class="hljs-title function_">close</span>(error);
      <span class="hljs-keyword">throw</span> error;
    }
  }

  <span class="hljs-title function_">run</span>(<span class="hljs-params">values</span>) {
    <span class="hljs-keyword">if</span> (<span class="hljs-variable language_">this</span>.#closed) <span class="hljs-keyword">return</span> <span class="hljs-title class_">Promise</span>.<span class="hljs-title function_">reject</span>(<span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">&#x27;任务池已关闭&#x27;</span>));
    <span class="hljs-keyword">if</span> (!<span class="hljs-title class_">Array</span>.<span class="hljs-title function_">isArray</span>(values) || values.<span class="hljs-property">length</span> &gt; <span class="hljs-number">100_000</span> ||
        !values.<span class="hljs-title function_">every</span>(<span class="hljs-title class_">Number</span>.<span class="hljs-property">isFinite</span>)) {
      <span class="hljs-keyword">return</span> <span class="hljs-title class_">Promise</span>.<span class="hljs-title function_">reject</span>(<span class="hljs-keyword">new</span> <span class="hljs-title class_">RangeError</span>(<span class="hljs-string">&#x27;输入须为最多 100000 项的有限数值数组&#x27;</span>));
    }
    <span class="hljs-keyword">if</span> (<span class="hljs-variable language_">this</span>.#queue.<span class="hljs-property">length</span> &gt;= <span class="hljs-variable language_">this</span>.<span class="hljs-property">maxQueue</span>) {
      <span class="hljs-keyword">return</span> <span class="hljs-title class_">Promise</span>.<span class="hljs-title function_">reject</span>(<span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">&#x27;任务队列已满&#x27;</span>));
    }
    <span class="hljs-keyword">return</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Promise</span>(<span class="hljs-function">(<span class="hljs-params">resolve, reject</span>) =&gt;</span> {
      <span class="hljs-variable language_">this</span>.#queue.<span class="hljs-title function_">push</span>({ <span class="hljs-attr">id</span>: <span class="hljs-variable language_">this</span>.#nextId++, <span class="hljs-attr">values</span>: [...values], resolve, reject });
      <span class="hljs-variable language_">this</span>.#<span class="hljs-title function_">dispatch</span>();
    });
  }

  #<span class="hljs-title function_">dispatch</span>(<span class="hljs-params"></span>) {
    <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> slot <span class="hljs-keyword">of</span> <span class="hljs-variable language_">this</span>.#workers) {
      <span class="hljs-keyword">if</span> (slot.<span class="hljs-property">busy</span> || <span class="hljs-variable language_">this</span>.#queue.<span class="hljs-property">length</span> === <span class="hljs-number">0</span>) <span class="hljs-keyword">continue</span>;
      slot.<span class="hljs-property">busy</span> = <span class="hljs-literal">true</span>;
      slot.<span class="hljs-property">task</span> = <span class="hljs-variable language_">this</span>.#queue.<span class="hljs-title function_">shift</span>();
      <span class="hljs-keyword">try</span> {
        slot.<span class="hljs-property">worker</span>.<span class="hljs-title function_">postMessage</span>({ <span class="hljs-attr">id</span>: slot.<span class="hljs-property">task</span>.<span class="hljs-property">id</span>, <span class="hljs-attr">values</span>: slot.<span class="hljs-property">task</span>.<span class="hljs-property">values</span> });
      } <span class="hljs-keyword">catch</span> (error) {
        <span class="hljs-variable language_">this</span>.#<span class="hljs-title function_">failSlot</span>(slot, error);
        <span class="hljs-keyword">return</span>;
      }
    }
  }

  #<span class="hljs-title function_">finish</span>(<span class="hljs-params">slot, message</span>) {
    <span class="hljs-keyword">if</span> (!slot.<span class="hljs-property">task</span> || message.<span class="hljs-property">id</span> !== slot.<span class="hljs-property">task</span>.<span class="hljs-property">id</span>) <span class="hljs-keyword">return</span>;
    <span class="hljs-keyword">const</span> task = slot.<span class="hljs-property">task</span>;
    slot.<span class="hljs-property">task</span> = <span class="hljs-literal">null</span>;
    slot.<span class="hljs-property">busy</span> = <span class="hljs-literal">false</span>;
    message.<span class="hljs-property">ok</span> ? task.<span class="hljs-title function_">resolve</span>(message.<span class="hljs-property">result</span>) : task.<span class="hljs-title function_">reject</span>(<span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(message.<span class="hljs-property">error</span>));
    <span class="hljs-variable language_">this</span>.#<span class="hljs-title function_">dispatch</span>();
  }

  #<span class="hljs-title function_">failSlot</span>(<span class="hljs-params">slot, error</span>) {
    <span class="hljs-comment">// 本例选择故障后关闭整池，绝不把新任务发给已经退出的线程。</span>
    <span class="hljs-keyword">void</span> <span class="hljs-variable language_">this</span>.<span class="hljs-title function_">close</span>(error);
  }

  <span class="hljs-title function_">close</span>(<span class="hljs-params">reason = <span class="hljs-keyword">new</span> <span class="hljs-built_in">Error</span>(<span class="hljs-string">&#x27;任务池正在关闭&#x27;</span>)</span>) {
    <span class="hljs-keyword">if</span> (<span class="hljs-variable language_">this</span>.#closing) <span class="hljs-keyword">return</span> <span class="hljs-variable language_">this</span>.#closing;
    <span class="hljs-variable language_">this</span>.#closed = <span class="hljs-literal">true</span>;
    <span class="hljs-keyword">const</span> queued = <span class="hljs-variable language_">this</span>.#queue.<span class="hljs-title function_">splice</span>(<span class="hljs-number">0</span>);
    <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> task <span class="hljs-keyword">of</span> queued) task.<span class="hljs-title function_">reject</span>(reason);
    <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> slot <span class="hljs-keyword">of</span> <span class="hljs-variable language_">this</span>.#workers) {
      slot.<span class="hljs-property">task</span>?.<span class="hljs-title function_">reject</span>(reason);
      slot.<span class="hljs-property">task</span> = <span class="hljs-literal">null</span>;
    }
    <span class="hljs-variable language_">this</span>.#closing = <span class="hljs-title class_">Promise</span>.<span class="hljs-title function_">allSettled</span>(
      <span class="hljs-variable language_">this</span>.#workers.<span class="hljs-title function_">map</span>(<span class="hljs-function">(<span class="hljs-params">{ worker }</span>) =&gt;</span> worker.<span class="hljs-title function_">terminate</span>()),
    );
    <span class="hljs-keyword">return</span> <span class="hljs-variable language_">this</span>.#closing;
  }
}
</code></pre></div>
<p>将两段代码分别保存为 <code>worker.mjs</code> 和 <code>pool.mjs</code>，使用 <code>new WorkerPool(new URL(&#x27;./worker.mjs&#x27;, import.meta.url))</code> 创建池。调用者必须处理 <code>run()</code> 的拒绝，结束时等待 <code>close()</code>。本例的关闭是立即拒绝排队及运行任务并终止线程，不是优雅排空；线程异常（包括意外以 0 退出）会关闭整池，不自动重试可能产生副作用的任务。生产实现可进一步设计有限次数的线程替换、任务超时和排空关闭。构造阶段发生同步异常时会发起已创建线程的回收再抛出；若调用方必须等待回收彻底完成再继续，应改为异步工厂接口。</p>
<p>线程数上限只是教学限制，不是 CPU 配额建议。数值平方和仍可能溢出为 Infinity，涉及金额或精确计算应另行限定数值范围。若 <code>postMessage</code> 发送大数组，结构化克隆本身可能很慢；二进制数据可评估 Transferable 或 <code>SharedArrayBuffer</code>。Node.js Worker 使用共享内存不要求浏览器的跨源隔离响应头，但需要同步设计；浏览器环境的限制不能直接套到 Node.js。</p>
<p>run 接受任务后会复制数值数组，使等待队列保存的是提交时的数据快照。否则调用者在等待期间修改原数组，会让任务处理未经校验的新内容。这个复制是 O(n) 成本，并且发送到 Worker 时还可能发生结构化克隆，不能把任务池宣传成零复制。示例输入契约是普通数值数组，不是含 getter 或 Proxy 副作用的不可信可执行对象。</p>
<h2>取消需要协议支持</h2>
<p>主线程调用 <code>worker.terminate()</code> 可以终止线程，但会丢失当前任务并可能造成部分结果。更友好的方式是给任务分配 ID，并让 Worker 在可中断边界检查取消状态。但如果 Worker 正在执行一个长同步循环，message 回调根本没有机会运行；仅仅 postMessage({ cancel: id }) 不会打断它。</p>
<p>一种方案是把计算拆成有上限的小块，每块完成后用 setImmediate 等方式让出事件循环，使取消消息有机会更新本地标记。只 await Promise.resolve() 通常仍在连续微任务链中，不应依赖它让消息事件得到处理。另一种方案是用 SharedArrayBuffer 中的整数标记与 Atomics.load/store 协作，计算循环定期检查，代价是更复杂的共享状态协议。每个任务必须有自己的身份或标记生命周期，避免上一任务的取消误伤下一任务。</p>
<p>这些都是协作式取消，无法撤销已经完成的外部写入。对于无法插入检查点的第三方同步计算，可以在截止时间销毁 Worker，并由主线程明确拒绝对应 Promise；只调用 terminate 不会替应用结算任务池中的 Promise。恢复或重试仍须考虑幂等性。</p>
<p>HTTP 客户端断开不代表服务器必须立刻取消计算，但如果任务结果只对该请求有意义，可以在请求的 <code>AbortSignal</code> 触发时从队列移除或发送取消消息。长任务更适合提交为后台任务，让客户端查询状态，而不是让请求一直占用连接。</p>
<h2>错误和资源隔离</h2>
<p>Worker 抛错、返回非法消息或内存超限时，主线程不能把整个进程一起拖垮。消息应带任务 ID，结果按协议校验类型和大小；异常要关联任务和版本，但不要把堆栈、用户输入或内部路径原样返回给浏览器。线程池的队列、运行数、失败数和耗时应纳入监控，才能发现某类输入持续压满资源。</p>
<h2>优雅关闭和部署</h2>
<p>进程收到关闭信号时，应停止接收新任务，拒绝队列中的任务或持久化到可靠队列，并给运行中的 Worker 一个有限完成时间。不能在 HTTP 服务器刚关闭后立即强制终止所有线程，否则正在处理的导出或转码会产生半成品。任务结果要以临时文件加原子发布或可恢复状态保存，不能只放在线程内存里。</p>
<h2>常见误区和选型</h2>
<ul>
<li>每个请求新建 Worker：启动成本高，容易被并发请求耗尽资源。</li>
<li>线程数量等于用户数：线程过多会争抢 CPU，主线程和其他服务也会变慢。</li>
<li>用 Worker 处理 I/O：增加消息传输复杂度，未必比异步 I/O 更快。</li>
<li>无限增长任务队列：内存最终会成为隐形的请求放大器。</li>
<li>只捕获 Worker 错误不处理退出：线程崩溃后任务可能永久挂起。</li>
</ul>
<p>短小计算可以留在主线程；较重且独立的 CPU 任务使用有上限的 Worker 池；需要持久化、跨进程扩展和断点恢复的任务应考虑队列或独立作业服务。选型依据应包含任务时长、输入大小、取消需求和故障恢复，而不是只看“是否使用多线程”。</p>
<h2>参考资料</h2>
<ul>
<li><a href="https://nodejs.org/api/worker_threads.html">Node.js · Worker threads</a></li>
<li><a href="https://nodejs.org/api/worker_threads.html#class-messagechannel">Node.js · MessageChannel 与消息传递</a></li>
<li><a href="https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm">MDN · Structured clone algorithm</a></li>
<li><a href="https://nodejs.org/api/worker_threads.html#workerterminate">Node.js · <code>worker.terminate()</code></a></li>
</ul>`};export{e as default};