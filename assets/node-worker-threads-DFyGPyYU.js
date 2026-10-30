var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>Node.js 的 JavaScript 跑在一个主线程上。一个请求里要做 200 毫秒的图片处理或加密计算，这 200 毫秒里别的请求全都得排队等着。Worker Threads 就是把这类 CPU 密集的计算挪到另一个线程去做，主线程只管收发消息。</p>
<p>反过来，普通的网络和文件 I/O 本来就由 libuv 异步处理，不占主线程，放进 Worker 通常没有收益。</p>
<p>每个 Worker 有独立的 V8 实例和事件循环，创建它是有开销的。Node.js 文档建议实际使用时做成 Worker 池，否则创建 Worker 的开销可能超过它带来的收益。</p>
<p>线程之间传数据有三种方式：<code>postMessage</code> 默认结构化克隆，也就是复制一份；把 ArrayBuffer 放进 transferList 可以直接转移所有权，不复制；SharedArrayBuffer 配合 Atomics 可以让两边共享同一块内存。</p>
</blockquote>
<h2>为什么需要 Worker</h2>
<p>主线程同一时间只能执行一段 JavaScript。一段同步计算占着它的时候，其他请求的回调都执行不了，整体延迟就上去了。把计算放进 Worker，主线程可以继续处理别的请求。</p>
<p>下面这个函数在 Worker 里算 SHA-256，主线程通过 Promise 拿结果：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">import</span> { <span class="hljs-title class_">Worker</span> } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;node:worker_threads&#x27;</span>;

<span class="hljs-keyword">function</span> <span class="hljs-title function_">hashInWorker</span>(<span class="hljs-params">input</span>) {
  <span class="hljs-keyword">return</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Promise</span>(<span class="hljs-function">(<span class="hljs-params">resolve, reject</span>) =&gt;</span> {
    <span class="hljs-keyword">const</span> worker = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Worker</span>(<span class="hljs-keyword">new</span> <span class="hljs-title function_">URL</span>(<span class="hljs-string">&#x27;./hash-worker.mjs&#x27;</span>, <span class="hljs-keyword">import</span>.<span class="hljs-property">meta</span>.<span class="hljs-property">url</span>), {
      <span class="hljs-attr">workerData</span>: input,
    });
    worker.<span class="hljs-title function_">once</span>(<span class="hljs-string">&#x27;message&#x27;</span>, resolve);
    worker.<span class="hljs-title function_">once</span>(<span class="hljs-string">&#x27;error&#x27;</span>, reject);
    worker.<span class="hljs-title function_">once</span>(<span class="hljs-string">&#x27;exit&#x27;</span>, <span class="hljs-function">(<span class="hljs-params">code</span>) =&gt;</span> {
      <span class="hljs-keyword">if</span> (code !== <span class="hljs-number">0</span>) <span class="hljs-title function_">reject</span>(<span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">\`Worker 退出码 <span class="hljs-subst">\${code}</span>\`</span>));
    });
  });
}
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// hash-worker.mjs</span>
<span class="hljs-keyword">import</span> { parentPort, workerData } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;node:worker_threads&#x27;</span>;
<span class="hljs-keyword">import</span> { createHash } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;node:crypto&#x27;</span>;

parentPort.<span class="hljs-title function_">postMessage</span>(<span class="hljs-title function_">createHash</span>(<span class="hljs-string">&#x27;sha256&#x27;</span>).<span class="hljs-title function_">update</span>(workerData).<span class="hljs-title function_">digest</span>(<span class="hljs-string">&#x27;hex&#x27;</span>));
</code></pre></div>
<p><code>workerData</code> 是创建时传给 Worker 的初始数据，Worker 算完用 <code>parentPort.postMessage</code> 把结果发回来。除了 <code>message</code>，还要监听 <code>error</code> 和 <code>exit</code>，否则 Worker 出错时这个 Promise 永远不会结束。</p>
<p>这个示例每次调用都新建一个 Worker，只适合低频任务。高频调用时要复用 Worker，任务池的实现见<a href="/questions/node-worker-pool/">《怎样实现一个 Node.js Worker Threads 任务池？》</a>。</p>
<h2>数据怎样在线程之间传递</h2>
<table><thead><tr><th>方式</th><th>特点</th></tr></thead><tbody><tr><td>结构化克隆（默认）</td><td>复制一份数据，支持对象、Map、Date、TypedArray 等；函数和类实例的原型不会保留</td></tr><tr><td>转移（transferList）</td><td>ArrayBuffer、MessagePort 等可转移对象移交给另一方，原线程中的变为不可用</td></tr><tr><td>SharedArrayBuffer</td><td>两个线程读写同一块内存，需要用 Atomics 协调读写顺序</td></tr></tbody></table>
<p>转移是什么效果，看下面这个例子：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> buffer = <span class="hljs-keyword">new</span> <span class="hljs-title class_">ArrayBuffer</span>(<span class="hljs-number">8</span>);
<span class="hljs-keyword">const</span> { port1, port2 } = <span class="hljs-keyword">new</span> <span class="hljs-title class_">MessageChannel</span>();
port2.<span class="hljs-property">onmessage</span> = <span class="hljs-function">(<span class="hljs-params">event</span>) =&gt;</span> {
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(event.<span class="hljs-property">data</span>.<span class="hljs-property">byteLength</span>); <span class="hljs-comment">// 8</span>
  port2.<span class="hljs-title function_">close</span>();
};
port1.<span class="hljs-title function_">postMessage</span>(buffer, [buffer]);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(buffer.<span class="hljs-property">byteLength</span>); <span class="hljs-comment">// 0</span>
</code></pre></div>
<p>发送之后，原来的 <code>buffer</code> 长度变成了 0，接收方拿到的是完整的 8 字节。因为第二个参数把它放进了 transferList，这块内存的所有权直接交给了对方，自己这边就不能再用了。大块二进制数据用转移，可以省掉复制的成本。</p>
<h2>能不能中途取消一个 Worker 任务</h2>
<p>Worker 正在跑同步循环时，它没空处理收到的消息。所以“发一条取消消息”只在任务会分段让出线程时才有效。需要立刻停下时，调用 <code>worker.terminate()</code>，它会结束整个线程，正在执行的任务没有机会清理资源。</p>
<h2>常见追问</h2>
<p><strong>Worker 和 child_process、cluster 怎么选？</strong></p>
<blockquote>
<p>见<a href="/questions/node-process-model/">《Node.js 的子进程、Worker 和集群应该怎样选择？》</a>。</p>
</blockquote>
<p><strong>Worker 是安全沙箱吗？</strong></p>
<blockquote>
<p>不是。Worker 和主线程在同一个进程里，文件系统和网络权限都一样，不能用来运行不可信的代码。</p>
</blockquote>
<p><strong>Worker 里能用 AsyncLocalStorage 吗？</strong></p>
<blockquote>
<p>Worker 有自己的上下文，主线程的 store 不会自动传过去，需要通过消息显式传递请求 ID 等信息。</p>
</blockquote>
<p><strong>Worker 线程和 libuv 线程池是一回事吗？</strong></p>
<blockquote>
<p>不是。libuv 线程池默认 4 个线程，执行 fs、dns.lookup、部分 crypto 和 zlib 操作，它不运行 JavaScript。Worker Threads 运行的是 JavaScript。</p>
</blockquote>`};export{e as default};