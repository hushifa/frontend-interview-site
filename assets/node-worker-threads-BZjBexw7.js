var e={answerHtml:`<h2>简答</h2>
<ul>
<li>Worker Threads 用于 CPU 密集任务，例如图片处理、压缩、解析大 JSON、加密计算；这些任务放在主线程会让所有请求都排队等待。</li>
<li>普通的网络和文件 I/O 已经由 libuv 异步处理，放进 Worker 通常得不到收益。</li>
<li>每个 Worker 有独立的 V8 实例、堆和事件循环，启动有几十毫秒级的成本，频繁使用时应复用，做成任务池。</li>
<li><code>postMessage</code> 默认结构化克隆数据；把 ArrayBuffer 放进 transferList 可以转移所有权而不复制；SharedArrayBuffer 配合 Atomics 可以共享内存。</li>
</ul>
<h2>为什么需要 Worker</h2>
<p>Node.js 的 JavaScript 运行在一个主线程上。一个请求里执行 200 毫秒的同步计算，这 200 毫秒里其他请求的回调都无法执行，延迟会整体上升。把计算移到 Worker 后，主线程只负责收发消息。</p>
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
<p>这个示例每次调用都创建一个新 Worker，只适合低频任务。高频调用的做法见<a href="/questions/node-worker-pool/">《Node.js 为什么要用 Worker Threads 任务池？》</a>。</p>
<h2>数据怎样在线程间传递</h2>
<table><thead><tr><th>方式</th><th>特点</th></tr></thead><tbody><tr><td>结构化克隆（默认）</td><td>复制一份数据，支持对象、Map、Date、TypedArray 等；函数和类实例的原型不会保留</td></tr><tr><td>转移（transferList）</td><td>ArrayBuffer、MessagePort 等可转移对象移交给另一方，原线程中的变为不可用</td></tr><tr><td>SharedArrayBuffer</td><td>两个线程读写同一块内存，需要用 Atomics 协调读写顺序</td></tr></tbody></table>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> buffer = <span class="hljs-keyword">new</span> <span class="hljs-title class_">ArrayBuffer</span>(<span class="hljs-number">8</span>);
<span class="hljs-keyword">const</span> { port1, port2 } = <span class="hljs-keyword">new</span> <span class="hljs-title class_">MessageChannel</span>();
port2.<span class="hljs-property">onmessage</span> = <span class="hljs-function">(<span class="hljs-params">event</span>) =&gt;</span> {
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(event.<span class="hljs-property">data</span>.<span class="hljs-property">byteLength</span>); <span class="hljs-comment">// 8</span>
  port2.<span class="hljs-title function_">close</span>();
};
port1.<span class="hljs-title function_">postMessage</span>(buffer, [buffer]);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(buffer.<span class="hljs-property">byteLength</span>); <span class="hljs-comment">// 0</span>
</code></pre></div>
<p>转移之后，原线程中的 <code>buffer</code> 长度变为 0。大块二进制数据用转移可以省掉复制成本。</p>
<h2>取消与终止</h2>
<p>Worker 正在执行同步循环时不会处理收到的消息，所以&quot;发一条取消消息&quot;只在任务会分段让出线程时才有效。需要立即停止时调用 <code>worker.terminate()</code>，它会结束整个线程，正在执行的任务没有机会清理资源。</p>
<h2>常见追问</h2>
<ul>
<li><strong>Worker 和 child_process、cluster 怎么选？</strong> 见<a href="/questions/node-process-model/">《Node.js 的子进程、Worker 和集群应该怎样选择？》</a>。</li>
<li><strong>Worker 是安全沙箱吗？</strong> 不是。Worker 和主线程在同一个进程里，拥有相同的文件系统和网络权限，不能用来运行不可信代码。</li>
<li><strong>Worker 里能用 AsyncLocalStorage 吗？</strong> Worker 有自己的上下文，主线程的 store 不会自动传过去，需要通过消息显式传递请求 ID 等信息。</li>
</ul>`};export{e as default};