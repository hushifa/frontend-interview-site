var e={answerHtml:`<h2>简答</h2>
<ul>
<li>单个请求里有重计算，用 Worker Threads：同一进程内的线程，启动和通信成本最低，但崩溃或内存泄漏会影响整个进程。</li>
<li>要运行外部程序（ffmpeg、git、图片工具），用 <code>child_process</code>：独立进程，崩溃不会拖垮主进程，适合需要隔离的场景。</li>
<li>想让一个 HTTP 服务用满多核，用 cluster 或在容器层面运行多个实例：每个进程都是完整的服务副本。</li>
<li>三者都不是安全沙箱，子进程默认继承当前用户的全部权限。</li>
</ul>
<h2>对比</h2>
<table><thead><tr><th></th><th>Worker Threads</th><th>child_process</th><th>cluster</th></tr></thead><tbody><tr><td>单位</td><td>线程</td><td>进程</td><td>进程（服务副本）</td></tr><tr><td>运行内容</td><td>JavaScript</td><td>任意可执行程序或 Node 脚本</td><td>同一个服务入口</td></tr><tr><td>内存</td><td>同一进程，各自独立的堆</td><td>完全独立</td><td>完全独立</td></tr><tr><td>通信</td><td><code>postMessage</code>，可转移或共享内存</td><td>stdio 管道、IPC（<code>fork</code>）</td><td>主进程与工作进程之间的 IPC</td></tr><tr><td>一方崩溃</td><td>可能影响整个进程</td><td>主进程只收到退出事件</td><td>主进程可以重启该工作进程</td></tr><tr><td>典型用途</td><td>压缩、解析、加密计算</td><td>调用命令行工具、隔离不稳定的代码</td><td>多核运行 HTTP 服务</td></tr></tbody></table>
<h2>调用外部命令</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">import</span> { execFile } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;node:child_process&#x27;</span>;
<span class="hljs-keyword">import</span> { promisify } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;node:util&#x27;</span>;

<span class="hljs-keyword">const</span> run = <span class="hljs-title function_">promisify</span>(execFile);

<span class="hljs-keyword">const</span> { stdout } = <span class="hljs-keyword">await</span> <span class="hljs-title function_">run</span>(<span class="hljs-string">&#x27;git&#x27;</span>, [<span class="hljs-string">&#x27;log&#x27;</span>, <span class="hljs-string">&#x27;-1&#x27;</span>, <span class="hljs-string">&#x27;--format=%h&#x27;</span>], {
  <span class="hljs-attr">timeout</span>: <span class="hljs-number">5000</span>,
  <span class="hljs-attr">maxBuffer</span>: <span class="hljs-number">1024</span> * <span class="hljs-number">1024</span>,
});
</code></pre></div>
<p>优先用 <code>execFile</code> 或 <code>spawn</code> 并以数组传参。<code>exec</code> 会经过 shell 解析，用户输入拼进命令字符串就可能发生命令注入。<code>timeout</code> 和 <code>maxBuffer</code> 防止外部程序卡住或输出过多拖垮服务。</p>
<p>输出量大或需要流式处理时用 <code>spawn</code>，它通过流返回 stdout，不会把全部输出缓存在内存里。</p>
<h2>cluster 与容器</h2>
<p>cluster 让主进程监听端口，再把连接分发给多个工作进程，工作进程挂掉时主进程可以重新 <code>fork</code>。在 Kubernetes 等容器平台上，更常见的做法是每个容器只跑一个 Node.js 进程，由平台负责扩缩容和重启，这样监控、日志和资源限制都按容器管理。</p>
<p>多个进程之间不共享内存。会话、限流计数、缓存这些状态要放到 Redis 等外部存储，否则同一用户的请求落到不同进程会看到不同的数据。</p>
<h2>常见追问</h2>
<ul>
<li><strong>Worker 的通信与任务池细节？</strong> 见《Node.js Worker Threads 适合解决什么问题？》和《Node.js 为什么要用 Worker Threads 任务池，而不是每次请求都创建 Worker？》。</li>
<li><strong>怎样限制子进程的权限？</strong> 用操作系统层面的隔离：低权限用户、容器、seccomp 等。Node.js 的权限模型（<code>--permission</code>，v22.13.0 和 v23.5.0 起稳定）开启后，默认禁止访问文件系统、创建子进程和 Worker，需要用 <code>--allow-fs-read</code>、<code>--allow-child-process</code>、<code>--allow-worker</code> 等参数逐项放开。它防的是代码误用权限，不能代替操作系统隔离。</li>
</ul>`};export{e as default};