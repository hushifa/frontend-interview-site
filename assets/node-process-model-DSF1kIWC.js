var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>这三个东西解决的是三种不同的问题。一个请求里有一段很重的计算，比如压缩、加密，用 Worker Threads，它是同一进程里的另一个线程，启动和通信成本最低，可它崩溃或内存泄漏会影响整个进程。</p>
<p>要调用外部程序，比如 ffmpeg、git、图片工具，用 <code>child_process</code>。它启动的是独立进程，子进程崩溃不会拖垮主进程，所以也适合隔离不稳定的代码。</p>
<p>想让一个 HTTP 服务用满多核 CPU，用 cluster，或者在容器层面多跑几个实例。每个进程都是一份完整的服务副本。</p>
<p>要注意，这三者都不是安全沙箱，子进程默认继承当前用户的全部权限。</p>
</blockquote>
<h2>三者放在一起比较</h2>
<table><thead><tr><th></th><th>Worker Threads</th><th>child_process</th><th>cluster</th></tr></thead><tbody><tr><td>单位</td><td>线程</td><td>进程</td><td>进程（服务副本）</td></tr><tr><td>运行内容</td><td>JavaScript</td><td>任意可执行程序或 Node 脚本</td><td>同一个服务入口</td></tr><tr><td>内存</td><td>同一进程，各自独立的堆</td><td>完全独立</td><td>完全独立</td></tr><tr><td>通信</td><td><code>postMessage</code>，可转移或共享内存</td><td>stdio 管道、IPC（<code>fork</code>）</td><td>主进程与工作进程之间的 IPC</td></tr><tr><td>一方崩溃</td><td>可能影响整个进程</td><td>主进程只收到退出事件</td><td>主进程可以重启该工作进程</td></tr><tr><td>典型用途</td><td>压缩、解析、加密计算</td><td>调用命令行工具、隔离不稳定的代码</td><td>多核运行 HTTP 服务</td></tr></tbody></table>
<p>区别的关键在“是不是同一个进程”。Worker 和主线程在同一个进程里，所以通信便宜，但一损俱损；子进程和 cluster 的工作进程是独立的，内存不共享，通信要走管道或 IPC，代价是隔离更好。</p>
<h2>调用外部命令要注意什么</h2>
<p>下面用 <code>execFile</code> 读取最近一次提交的哈希：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">import</span> { execFile } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;node:child_process&#x27;</span>;
<span class="hljs-keyword">import</span> { promisify } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;node:util&#x27;</span>;

<span class="hljs-keyword">const</span> run = <span class="hljs-title function_">promisify</span>(execFile);

<span class="hljs-keyword">const</span> { stdout } = <span class="hljs-keyword">await</span> <span class="hljs-title function_">run</span>(<span class="hljs-string">&#x27;git&#x27;</span>, [<span class="hljs-string">&#x27;log&#x27;</span>, <span class="hljs-string">&#x27;-1&#x27;</span>, <span class="hljs-string">&#x27;--format=%h&#x27;</span>], {
  <span class="hljs-attr">timeout</span>: <span class="hljs-number">5000</span>,
  <span class="hljs-attr">maxBuffer</span>: <span class="hljs-number">1024</span> * <span class="hljs-number">1024</span>,
});
</code></pre></div>
<p>为什么不用更简单的 <code>exec</code>？因为 <code>exec</code> 会把整条命令交给 shell 解析，如果把用户输入拼进命令字符串，用户就能塞进 <code>;</code> 之类的符号执行别的命令，这叫命令注入。<code>execFile</code> 或 <code>spawn</code> 用数组传参，参数不经过 shell。</p>
<p><code>timeout</code> 和 <code>maxBuffer</code> 也不是摆设，它们防止外部程序卡住不返回，或者输出太多把服务的内存撑爆。</p>
<p>输出量很大或者需要边读边处理时，用 <code>spawn</code>。它通过流返回 stdout，不会把全部输出攒在内存里。</p>
<h2>cluster 和容器怎么选</h2>
<p>cluster 的做法是主进程监听端口，再把连接分给多个工作进程；某个工作进程挂了，主进程可以重新 <code>fork</code> 一个。</p>
<p>在 Kubernetes 这类容器平台上，更常见的是每个容器只跑一个 Node.js 进程，扩缩容和重启交给平台。这样监控、日志和资源限制都按容器来管，比较清楚。</p>
<p>不管哪种方式，多个进程之间都不共享内存。会话、限流计数、缓存这些状态要放到 Redis 等外部存储里。否则同一个用户的请求落到不同进程，会看到不同的数据。</p>
<h2>常见追问</h2>
<p><strong>Worker 的通信与任务池细节？</strong></p>
<blockquote>
<p>见<a href="/questions/node-worker-threads/">《Node.js Worker Threads 适合解决什么问题？》</a>和<a href="/questions/node-worker-pool/">《Node.js 为什么要用 Worker Threads 任务池？》</a>。</p>
</blockquote>
<p><strong>怎样限制子进程的权限？</strong></p>
<blockquote>
<p>用操作系统层面的隔离，比如低权限用户、容器、seccomp。Node.js 的权限模型（<code>--permission</code>，v22.13.0 和 v23.5.0 起稳定）开启后，默认禁止访问文件系统、创建子进程和 Worker，需要用 <code>--allow-fs-read</code>、<code>--allow-child-process</code>、<code>--allow-worker</code> 等参数逐项放开。它防的是代码误用权限，代替不了操作系统隔离。</p>
</blockquote>`};export{e as default};