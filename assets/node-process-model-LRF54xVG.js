var e={answerHtml:`<p>Node.js 的事件循环适合协调大量异步 I/O，但一段长时间的同步计算仍会阻塞当前进程。另一方面，调用 ffmpeg、git 或系统工具时，任务本来就属于外部程序；部署多份 HTTP 服务时，又需要把流量和故障分散到多个进程。</p>
<p>这三类问题分别对应不同工具：Worker Threads 在同一进程中运行 JavaScript 线程，<code>child_process</code> 启动独立操作系统进程，<code>cluster</code> 组织多个 Node 进程接收服务流量。它们不是“性能更强的三种同义 API”。</p>
<h2>Worker Threads 解决线程级 CPU 隔离</h2>
<p>Worker 适合可以拆成计算任务、又不需要独立操作系统权限的 JavaScript 工作。线程之间默认通过结构化克隆传递消息，适合普通数据；ArrayBuffer 可以转移所有权，SharedArrayBuffer 则需要 Atomics 等同步协议。</p>
<p>Worker 与主线程共享同一个进程的资源和故障边界。创建很多 Worker 会增加堆内存、调度和通信成本，生产环境通常需要有限线程池、队列上限和任务取消策略。它也不是运行不可信代码的安全沙箱。</p>
<h2>child_process 适合外部程序和更强进程边界</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">import</span> { execFile } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;node:child_process&#x27;</span>;
<span class="hljs-keyword">import</span> { promisify } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;node:util&#x27;</span>;

<span class="hljs-keyword">const</span> runFile = <span class="hljs-title function_">promisify</span>(execFile);

<span class="hljs-keyword">export</span> <span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">getImageMetadata</span>(<span class="hljs-params">filePath</span>) {
  <span class="hljs-keyword">const</span> { stdout } = <span class="hljs-keyword">await</span> <span class="hljs-title function_">runFile</span>(<span class="hljs-string">&#x27;identify&#x27;</span>, [<span class="hljs-string">&#x27;-format&#x27;</span>, <span class="hljs-string">&#x27;%wx%h&#x27;</span>, filePath], {
    <span class="hljs-attr">shell</span>: <span class="hljs-literal">false</span>,
    <span class="hljs-attr">timeout</span>: <span class="hljs-number">5_000</span>,
    <span class="hljs-attr">maxBuffer</span>: <span class="hljs-number">64</span> * <span class="hljs-number">1024</span>,
  });
  <span class="hljs-keyword">return</span> stdout.<span class="hljs-title function_">trim</span>();
}
</code></pre></div>
<p><code>execFile</code> 在不启用 shell 时可以避免一部分 shell 拼接风险，但参数仍要按工具语义校验。用户提供的路径不应直接成为任意可执行文件参数；应使用服务端维护的文件 ID 映射、限制目录和权限，并处理符号链接、超时、输出大小和退出码。</p>
<p><code>exec</code> 会经过 shell，只有确实需要 shell 语法且参数已经严格固定时才考虑。<code>spawn</code> 适合持续读取 stdout/stderr 的长任务；<code>fork</code> 用于启动另一个 Node 模块并通过 IPC 通信。无论选择哪一个，子进程退出、被杀、输出爆满和父进程关闭都要有明确状态。</p>
<p>独立进程拥有自己的 V8 堆、事件循环和模块缓存。它可以限制或隔离一部分 CPU、内存和权限，但启动、序列化、IPC 和部署成本更高；进程边界也不是容器或操作系统安全策略的完整替代。</p>
<p>上面的 identify 是外部图像工具命令，不是 Node.js 内置 API；示例要求环境安装了对应可执行程序，ImageMagick 版本和系统发行方式可能采用不同入口。生产环境应固定可信可执行文件路径与版本，不依赖可被修改的 PATH 随机解析。即使 shell: false，用户参数以短横线开头、特殊格式语法或工具支持的协议形式出现时，仍可能被解释为选项或其他输入，必须按所调用工具的规则限制。</p>
<p>timeout 通常通过发送终止信号尝试结束子进程，不是整个进程树都已销毁的保证。子进程派生的后代、忽略信号的程序和平台差异需要额外处理；不能把 5000 毫秒理解为任务一定在该时刻彻底停止。maxBuffer 控制收集输出的大小，也不是子进程的内存配额。</p>
<h2>cluster 主要解决多进程服务实例</h2>
<p>HTTP 服务可以启动多个 Node 进程，让不同进程处理请求，从而利用多核并在一个进程异常时保留部分服务能力。cluster 提供进程间的组织和通信机制，但不替代反向代理、容器编排、健康检查和负载均衡。</p>
<p>每个进程拥有自己的内存、模块缓存和连接池。把会话、限流计数或缓存放在普通全局变量中，并不会在多个 worker 之间共享；需要共享时使用外部存储或明确的 IPC 协议。连接到本地文件的写入也要考虑多进程并发和锁。</p>
<p>集群中的一个进程崩溃后，其他进程仍可能持有旧配置或未完成请求。重启策略、优雅关闭、连接排空和幂等重试必须由应用和部署系统共同设计。把 cluster 当成“自动高可用”会掩盖状态丢失和单点依赖。</p>
<h2>通信方式决定数据和错误语义</h2>
<p>线程消息、子进程 IPC 和网络请求都可能复制数据、延迟交付、乱序结束或传递错误。不要因为发送函数返回就认为任务已经完成；需要业务确认时，应让执行端返回结构化结果、版本和错误分类。</p>
<p>大对象频繁跨边界传递可能比在主线程处理还慢。优先传递 ID、范围或可转移的缓冲区，并明确所有权；SharedArrayBuffer 可以减少线程间复制，但会带来数据竞争。浏览器的安全上下文与跨源隔离要求不能直接套到 Node.js Worker；普通子进程也不能像同进程 Worker 那样直接共享一个 JavaScript SharedArrayBuffer。</p>
<p>取消也要分别设计：<code>worker.terminate()</code> 或杀死子进程是强制停止，不保证 finally 执行，也不能撤销已经写文件、发请求或修改数据库的副作用。可恢复任务应采用分片、检查点、幂等 ID 和成功后提交。</p>
<h2>先按问题选择，再看扩展方式</h2>
<table><thead><tr><th>场景</th><th>优先考虑</th><th>主要代价</th></tr></thead><tbody><tr><td>单个 CPU 密集 JavaScript 任务</td><td>Worker Threads</td><td>线程池、消息和内存管理</td></tr><tr><td>调用 ffmpeg、压缩工具或系统命令</td><td>child_process</td><td>参数安全、进程清理、输出和权限</td></tr><tr><td>多核运行 HTTP 服务</td><td>多进程部署或 cluster</td><td>状态外置、健康检查、优雅发布</td></tr><tr><td>普通网络或文件异步 I/O</td><td>原生异步 API</td><td>不必额外创建线程/进程</td></tr></tbody></table>
<p>如果一项任务需要强隔离、不信任第三方二进制或独立升级，通常应评估独立服务或容器，而不是把所有事情塞进一个 Node 进程。若只是偶发的小计算，优化算法或分片让出主线程可能比启动 Worker 更简单。</p>
<p>上线前要测量端到端时间、队列等待、CPU、堆内存、IPC 传输、进程重启和故障恢复。工具选择正确的证据不是“某个示例成功运行”，而是目标任务在真实负载下具备可解释的资源边界和恢复路径。</p>`};export{e as default};