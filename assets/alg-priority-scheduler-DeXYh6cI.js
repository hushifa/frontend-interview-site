var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>场景是页面一下要发很多请求，但最多只能同时发 2 个，而且首屏要用的数据要优先发。调度器提供一个 <code>add(task, priority)</code> 方法，<code>task</code> 是一个返回 Promise 的函数，还没调用。<code>add</code> 返回一个 Promise，任务真正执行完时才兑现或拒绝。</p>
<p>内部维护两样东西：一个按优先级排好的等待队列，和一个“正在运行几个”的计数。每次有任务加入或者有任务结束，就检查一下：运行数没到上限、队列里还有任务，就从队头取一个启动。任务结束时，不管成功失败，都把计数减一，再去取下一个。</p>
<p>为什么要传函数而不是传 Promise？因为 Promise 一创建，里面的请求就已经发出去了，调度器没法再控制它什么时候开始。传函数，调度器想什么时候调用就什么时候调用。</p>
<p>要注意三点。同一段同步代码里加入的任务，要等它们都进了队列再开始调度，否则第一个加进来的会抢先启动，优先级就白排了。优先级相同的按加入顺序执行。单个任务失败只让它自己的 Promise 拒绝，计数照样要减，否则这个位置就永远空不出来。</p>
</blockquote>
<h2>实现</h2>
<p>先看整体结构：<code>waiting</code> 是等待队列，<code>running</code> 是正在运行的数量，<code>runNext</code> 负责“有空位就补上”。<code>add</code> 把任务按优先级插进队列，并安排一次 <code>runNext</code>。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">createScheduler</span>(<span class="hljs-params">limit</span>) {
  <span class="hljs-keyword">const</span> waiting = [];
  <span class="hljs-keyword">let</span> running = <span class="hljs-number">0</span>;

  <span class="hljs-keyword">function</span> <span class="hljs-title function_">runNext</span>(<span class="hljs-params"></span>) {
    <span class="hljs-keyword">while</span> (running &lt; limit &amp;&amp; waiting.<span class="hljs-property">length</span> &gt; <span class="hljs-number">0</span>) {
      <span class="hljs-keyword">const</span> item = waiting.<span class="hljs-title function_">shift</span>();
      running++;
      <span class="hljs-title class_">Promise</span>.<span class="hljs-title function_">resolve</span>()
        .<span class="hljs-title function_">then</span>(item.<span class="hljs-property">task</span>)
        .<span class="hljs-title function_">then</span>(item.<span class="hljs-property">resolve</span>, item.<span class="hljs-property">reject</span>)
        .<span class="hljs-title function_">finally</span>(<span class="hljs-function">() =&gt;</span> {
          running--;
          <span class="hljs-title function_">runNext</span>();
        });
    }
  }

  <span class="hljs-keyword">function</span> <span class="hljs-title function_">add</span>(<span class="hljs-params">task, priority = <span class="hljs-number">0</span></span>) {
    <span class="hljs-keyword">return</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Promise</span>(<span class="hljs-function">(<span class="hljs-params">resolve, reject</span>) =&gt;</span> {
      <span class="hljs-keyword">const</span> item = { task, priority, resolve, reject };
      <span class="hljs-comment">// 数字越大越先执行；插到第一个优先级更低的任务前面，同优先级保持加入顺序</span>
      <span class="hljs-keyword">const</span> index = waiting.<span class="hljs-title function_">findIndex</span>(<span class="hljs-function">(<span class="hljs-params">other</span>) =&gt;</span> other.<span class="hljs-property">priority</span> &lt; priority);
      <span class="hljs-keyword">if</span> (index === -<span class="hljs-number">1</span>) waiting.<span class="hljs-title function_">push</span>(item);
      <span class="hljs-keyword">else</span> waiting.<span class="hljs-title function_">splice</span>(index, <span class="hljs-number">0</span>, item);
      <span class="hljs-comment">// 推迟到微任务里再调度，让同一段同步代码里加入的任务先全部排好序</span>
      <span class="hljs-title class_">Promise</span>.<span class="hljs-title function_">resolve</span>().<span class="hljs-title function_">then</span>(runNext);
    });
  }

  <span class="hljs-keyword">return</span> { add };
}

<span class="hljs-keyword">const</span> <span class="hljs-title function_">sleep</span> = (<span class="hljs-params">ms</span>) =&gt; <span class="hljs-keyword">new</span> <span class="hljs-title class_">Promise</span>(<span class="hljs-function">(<span class="hljs-params">resolve</span>) =&gt;</span> <span class="hljs-built_in">setTimeout</span>(resolve, ms));
<span class="hljs-keyword">const</span> scheduler = <span class="hljs-title function_">createScheduler</span>(<span class="hljs-number">2</span>);
<span class="hljs-keyword">const</span> log = [];

<span class="hljs-keyword">function</span> <span class="hljs-title function_">job</span>(<span class="hljs-params">name, ms</span>) {
  <span class="hljs-keyword">return</span> <span class="hljs-title function_">async</span> () =&gt; {
    log.<span class="hljs-title function_">push</span>(<span class="hljs-string">\`开始 <span class="hljs-subst">\${name}</span>\`</span>);
    <span class="hljs-keyword">await</span> <span class="hljs-title function_">sleep</span>(ms);
    log.<span class="hljs-title function_">push</span>(<span class="hljs-string">\`结束 <span class="hljs-subst">\${name}</span>\`</span>);
    <span class="hljs-keyword">return</span> name;
  };
}

<span class="hljs-keyword">const</span> results = [
  scheduler.<span class="hljs-title function_">add</span>(<span class="hljs-title function_">job</span>(<span class="hljs-string">&#x27;A&#x27;</span>, <span class="hljs-number">100</span>), <span class="hljs-number">1</span>),
  scheduler.<span class="hljs-title function_">add</span>(<span class="hljs-title function_">job</span>(<span class="hljs-string">&#x27;B&#x27;</span>, <span class="hljs-number">20</span>), <span class="hljs-number">1</span>),
  scheduler.<span class="hljs-title function_">add</span>(<span class="hljs-title function_">job</span>(<span class="hljs-string">&#x27;C&#x27;</span>, <span class="hljs-number">20</span>), <span class="hljs-number">1</span>),
  scheduler.<span class="hljs-title function_">add</span>(<span class="hljs-title function_">job</span>(<span class="hljs-string">&#x27;D&#x27;</span>, <span class="hljs-number">20</span>), <span class="hljs-number">5</span>),
  scheduler.<span class="hljs-title function_">add</span>(<span class="hljs-function">() =&gt;</span> {
    log.<span class="hljs-title function_">push</span>(<span class="hljs-string">&#x27;开始 E&#x27;</span>);
    <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">&#x27;E 失败&#x27;</span>);
  }, <span class="hljs-number">3</span>),
];

<span class="hljs-title class_">Promise</span>.<span class="hljs-title function_">allSettled</span>(results).<span class="hljs-title function_">then</span>(<span class="hljs-function">(<span class="hljs-params">settled</span>) =&gt;</span> {
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(log.<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27; | &#x27;</span>)); <span class="hljs-comment">// 开始 D | 开始 E | 开始 A | 结束 D | 开始 B | 结束 B | 开始 C | 结束 C | 结束 A</span>
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(settled.<span class="hljs-title function_">map</span>(<span class="hljs-function">(<span class="hljs-params">r</span>) =&gt;</span> r.<span class="hljs-property">value</span> ?? r.<span class="hljs-property">reason</span>.<span class="hljs-property">message</span>).<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;,&#x27;</span>)); <span class="hljs-comment">// A,B,C,D,E 失败</span>
});
</code></pre></div>
<p>A 明明第一个加进来，为什么 D 和 E 先开始？因为 <code>add</code> 没有当场调度，而是用 <code>Promise.resolve().then(runNext)</code> 推迟到微任务里。五个 <code>add</code> 都是同步执行的，等第一次 <code>runNext</code> 跑起来，队列已经排成了 D(5)、E(3)、A(1)、B(1)、C(1)。上限是 2，于是 D 和 E 先启动。</p>
<p>E 一启动就同步抛错，为什么调度器没崩？任务是通过 <code>Promise.resolve().then(item.task)</code> 调用的，<code>then</code> 回调里抛出的错误会让返回的 Promise 拒绝，而不是往外抛。所以 E 的错误交给了 <code>item.reject</code>，E 的 Promise 拒绝。随后 <code>finally</code> 把计数减一、补上 A，两个位置里一个是 D、一个是 A。</p>
<p>D 20 毫秒后结束，补上 B；B 结束补上 C；C 在 60 毫秒左右结束，A 到 100 毫秒才结束。几个时长故意拉开了差距，因为定时器的实际触发时间会有误差，时长太接近时先后可能颠倒。日志的顺序正好对应这个过程。结果数组按 <code>add</code> 的调用顺序排列，跟谁先完成没有关系，因为每个 <code>add</code> 返回的是各自的 Promise。</p>
<h2>为什么失败时计数一定能减回去</h2>
<p><code>finally</code> 的回调不管前面成功还是失败都会执行，MDN 也说明它不接收参数、也不改变链上的结果。这里写在 <code>.then(item.resolve, item.reject)</code> 之后，前一步两个分支都已经处理了，链到这里一定是成功状态，所以不会产生未处理的拒绝。计数减一和 <code>runNext</code> 放在这里，就保证了每个任务结束时都会腾出一个位置。</p>
<p>如果把计数放在任务成功的分支里，一旦有任务失败，<code>running</code> 就永远少减一次。失败几次，并发上限就少几个，最后整个队列卡住。</p>
<h2>后加入的高优先级任务能插队吗</h2>
<p>能插到等待队列的前面，但不会打断已经在跑的任务。在 Node.js 22.23 里用 <code>createScheduler(1)</code> 测过：先加一个 20 毫秒的任务让它跑起来，5 毫秒后再加一个优先级 0 的和一个优先级 9 的，结果执行顺序是“正在跑的那个 → 优先级 9 → 优先级 0”。另外测了 10 个任务、上限 3 的情况，同时运行的数量最多就是 3。</p>
<p>队列这里用的是数组插入，<code>findIndex</code> 加 <code>splice</code> 是 O(n)。任务数量很大时可以换成二叉堆，见<a href="/questions/alg-priority-queue/">《前端任务怎样按优先级排队？二叉堆为什么不需要每次完整排序？》</a>。</p>
<h2>常见追问</h2>
<p><strong>一个任务失败，要不要让后面的任务都停下来？</strong></p>
<blockquote>
<p>看业务。上面的写法是各管各的，适合互不依赖的请求。如果任务之间有依赖，一个失败后面就没意义，就要在失败时清空等待队列，并通知正在运行的任务中止。这种“整体失败”的写法见<a href="/questions/alg-concurrency-pool/">《怎样实现有明确失败语义的异步并发池？》</a>。</p>
</blockquote>
<p><strong>怎么取消还在排队的任务？</strong></p>
<blockquote>
<p>可以让 <code>add</code> 再返回一个取消函数，或者接收一个 <code>AbortSignal</code>。取消时如果任务还在 <code>waiting</code> 里，就把它移出去并拒绝它的 Promise；如果已经开始了，调度器停不了它，要靠任务自己响应 <code>AbortSignal</code>，比如把 signal 传给 <code>fetch</code>。</p>
</blockquote>
<p><strong>为什么要用 Promise.resolve().then(runNext)，而不是 setTimeout？</strong></p>
<blockquote>
<p>两种都能让同步加入的任务先排好序。微任务在当前同步代码结束后马上执行，不会额外等一轮任务；<code>setTimeout</code> 要等到下一个任务，至少多一点延迟。这里只需要“等同步代码跑完”，用微任务就够了。</p>
</blockquote>`};export{e as default};