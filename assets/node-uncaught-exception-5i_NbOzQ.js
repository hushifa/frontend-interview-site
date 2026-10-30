var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>比如一个请求处理函数里，定时器回调访问了 <code>undefined</code> 的属性，没有任何 <code>try/catch</code> 接住，错误一路冒泡到事件循环，Node.js 就会触发 <code>process</code> 上的 <code>uncaughtException</code> 事件。Promise 被拒绝了、过了一轮事件循环还没人处理，触发的是 <code>unhandledRejection</code>。</p>
<p>默认行为是打印堆栈、以退出码 1 退出。对 Promise，从 Node.js 15 起 <code>--unhandled-rejections</code> 的默认模式是 <code>throw</code>：有 <code>unhandledRejection</code> 监听器就交给它，没有就当作未捕获异常处理，进程同样会退出。</p>
<p>这两个事件的用处是最后一道兜底：记录错误、上报监控、同步释放文件描述符这类资源。只想记录、不想改变默认的退出行为，可以监听 <code>uncaughtExceptionMonitor</code>。</p>
<p>要注意，加了 <code>uncaughtException</code> 监听器以后，进程默认不再退出，而且退出码会变成 0。官方文档明确说，未处理的异常意味着程序处于未定义的状态，捕获后恢复正常运行是不安全的。所以监听器里做完记录就应该退出，再由 PM2、systemd 或容器平台这类外部进程重启服务。</p>
</blockquote>
<h2>两个事件分别在什么时候触发</h2>
<p><code>uncaughtException</code> 对应同步抛出、没人捕获的异常，它会一路冒泡回事件循环。<code>unhandledRejection</code> 对应 Promise：被拒绝以后，在一轮事件循环之内没有挂上处理函数，就会触发，回调参数是拒绝原因 <code>reason</code> 和那个 Promise。</p>
<p>Promise 的拒绝可以晚一点再处理，所以 Node.js 还有一个 <code>rejectionHandled</code> 事件：先触发过 <code>unhandledRejection</code> 的 Promise，后来又被挂上了 <code>catch</code>，就会触发它。文档的说法是，同步代码里未处理的异常列表只会变长，而 Promise 的未处理列表会变长也会变短。</p>
<h2>默认行为和 --unhandled-rejections</h2>
<p>没有任何监听器时，未捕获的异常会打印堆栈并以退出码 1 退出，并且覆盖之前设置的 <code>process.exitCode</code>。</p>
<p>未处理的拒绝由命令行选项 <code>--unhandled-rejections</code> 控制。Node.js 15.0.0 把默认值从“打印警告”改成了 <code>throw</code>，几种模式如下：</p>
<ul>
<li><code>throw</code>（默认）：先触发 <code>unhandledRejection</code>，没有监听器就当作未捕获异常抛出。</li>
<li><code>strict</code>：直接当作未捕获异常抛出；如果这个异常被处理了，再触发 <code>unhandledRejection</code>。</li>
<li><code>warn</code>：不管有没有监听器都只打印警告。</li>
<li><code>warn-with-error-code</code>：先触发 <code>unhandledRejection</code>，没有监听器就打印警告，并把退出码设为 1。</li>
<li><code>none</code>：不打印任何警告。</li>
</ul>
<p>用 Node.js 22.23.3 验证：直接执行 <code>Promise.reject(new Error(&#x27;r&#x27;))</code>，进程退出码是 1；加上 <code>--unhandled-rejections=warn</code>，只打印 <code>UnhandledPromiseRejectionWarning</code>，退出码是 0。</p>
<p>所以在默认的 <code>throw</code> 模式下，一个未处理的拒绝如果没有 <code>unhandledRejection</code> 监听器，就会走到 <code>uncaughtException</code> 这条路上，此时回调的第二个参数 <code>origin</code> 是 <code>&#x27;unhandledRejection&#x27;</code>，同步错误则是 <code>&#x27;uncaughtException&#x27;</code>。</p>
<h2>为什么捕获后仍应退出</h2>
<p>加上 <code>uncaughtException</code> 监听器，会覆盖默认的退出行为。文档写得很清楚：有监听器而又没改 <code>process.exitCode</code> 时，进程会以 0 退出，看起来像正常结束，监控很容易漏掉。</p>
<p>更关键的是状态。异常可能发生在任何地方：一个数据库连接借出去还没还，一把锁拿到了还没释放，一个对象改到一半。错误被跳过以后，这些半完成的状态都留在内存里。文档把它比作升级电脑时直接拔电源：十次里九次没事，第十次系统就坏了。所以文档的结论是，<code>uncaughtException</code> 正确的用法是在进程关闭前同步清理已分配的资源，捕获后恢复正常运行是不安全的。</p>
<p>下面是常见的写法，记录后设置退出码并退出。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js">process.<span class="hljs-title function_">on</span>(<span class="hljs-string">&#x27;uncaughtException&#x27;</span>, <span class="hljs-function">(<span class="hljs-params">err, origin</span>) =&gt;</span> {
  logger.<span class="hljs-title function_">fatal</span>({ err, origin }, <span class="hljs-string">&#x27;未捕获的异常，进程即将退出&#x27;</span>);
  process.<span class="hljs-property">exitCode</span> = <span class="hljs-number">1</span>;
  process.<span class="hljs-title function_">exit</span>();
});

process.<span class="hljs-title function_">on</span>(<span class="hljs-string">&#x27;unhandledRejection&#x27;</span>, <span class="hljs-function">(<span class="hljs-params">reason</span>) =&gt;</span> {
  <span class="hljs-comment">// 交给 uncaughtException 统一处理，保持同一条退出路径</span>
  <span class="hljs-keyword">throw</span> reason;
});
</code></pre></div>
<p><code>unhandledRejection</code> 监听器里重新抛出，是为了让两类错误走同一条退出路径。用 Node.js 22.23.3 验证，重新抛出的拒绝原因会进入 <code>uncaughtException</code> 监听器，<code>origin</code> 是 <code>&#x27;uncaughtException&#x27;</code>，进程以退出码 1 退出。另外要知道，<code>uncaughtException</code> 监听器自己再抛出的异常不会被捕获，进程会以非 0 退出码退出并打印堆栈，文档说这是为了避免无限递归。<code>logger.fatal</code> 这类日志调用如果是异步写入，<code>process.exit()</code> 可能让最后一条日志来不及落盘，选日志库时要确认它有同步刷新的方式。</p>
<p>只想观察、不想接管退出行为，可以改用 <code>uncaughtExceptionMonitor</code>。它在 <code>uncaughtException</code> 之前触发，监听它不会改变默认行为，没有 <code>uncaughtException</code> 监听器时进程照样崩溃。</p>
<h2>由谁负责重启</h2>
<p>文档建议用一个独立的外部进程来检测应用失败并重启，不管 <code>uncaughtException</code> 有没有触发。实际部署中这个角色由 PM2、systemd、Kubernetes 这类工具承担，多进程和 PM2 的做法见<a href="/questions/node-cluster-pm2/">《Node.js 的 cluster 模块怎样实现多进程部署？PM2 做了什么？》</a>。</p>
<p>退出前要不要先把在途请求处理完，和正常发布时的停机流程类似，可以参考<a href="/questions/node-graceful-shutdown/">《Node.js 服务如何实现优雅退出？》</a>。区别在于崩溃时进程状态已经不可信，等待时间应该更短，超时就直接退出。</p>
<h2>常见追问</h2>
<p><strong>浏览器里的 unhandledrejection 和 Node.js 的是一回事吗？</strong></p>
<blockquote>
<p>不是同一套接口。浏览器是 <code>window</code> 上的 <code>unhandledrejection</code> 事件，主要用于上报，页面不会因此关闭；Node.js 是 <code>process</code> 上的 <code>unhandledRejection</code>，默认会让进程退出。浏览器一侧的做法见<a href="/questions/js-errors-event-handling/">《同步错误、Promise 拒绝和全局异常应该怎样处理？》</a>。</p>
</blockquote>
<p><strong>能不能把 --unhandled-rejections 设成 warn，避免进程挂掉？</strong></p>
<blockquote>
<p>技术上可以，但它只是把问题藏起来。被拒绝的 Promise 背后通常是一次失败的数据库写入或外部调用，静默继续运行会让数据处于不一致的状态。更好的做法是找到漏掉的 <code>catch</code> 补上，兜底监听器只负责记录和退出。</p>
</blockquote>
<p><strong>有了这两个兜底，业务代码还需要 try/catch 吗？</strong></p>
<blockquote>
<p>需要。兜底只能让进程体面地退出，没法把这次请求救回来。能预期的错误，比如参数不合法、下游超时，应该在业务代码里捕获，返回合适的错误响应，进程继续正常服务。</p>
</blockquote>`};export{e as default};