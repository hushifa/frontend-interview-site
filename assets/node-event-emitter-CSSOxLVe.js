var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>Node.js 里的 HTTP 服务、流、子进程，背后都是 <code>EventEmitter</code>：用 <code>on</code> 注册监听器，用 <code>emit</code> 触发事件。要先知道一点，<code>emit</code> 是同步的，它会按注册顺序把监听器一个个调用完才返回，并不是丢到下一轮去执行。</p>
<p>最容易出事的是 <code>error</code> 事件。如果一个 emitter 没有 <code>error</code> 监听器，<code>emit(&#x27;error&#x27;)</code> 会直接把错误抛出来，没人捕获的话进程就崩了。所以官方建议总是给 <code>error</code> 事件加监听器。</p>
<p>还有监听器上限。同一个事件默认超过 10 个监听器，Node.js 会打印 <code>MaxListenersExceededWarning</code>，提示可能有内存泄漏。这不是硬限制，监听器照样能加，但它通常说明每个请求都在加监听器却没有移除。</p>
<p>另外 <code>events</code> 模块提供了两个工具函数：<code>once()</code> 返回一个 Promise，等到事件触发时兑现；<code>on()</code> 返回一个异步迭代器，可以用 <code>for await</code> 一条条处理事件。两者在等待时遇到 <code>error</code> 事件都会拒绝或抛出，<code>on()</code> 的循环要靠 <code>break</code> 或 <code>AbortSignal</code> 结束。</p>
</blockquote>
<h2>emit 是同步调用监听器的</h2>
<p>下面的代码用 Node.js 22.23.3 运行。<code>emit</code> 之前和之后各打印一次，看监听器什么时候执行。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">import</span> { <span class="hljs-title class_">EventEmitter</span> } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;node:events&#x27;</span>;

<span class="hljs-keyword">const</span> orders = <span class="hljs-keyword">new</span> <span class="hljs-title class_">EventEmitter</span>();
orders.<span class="hljs-title function_">on</span>(<span class="hljs-string">&#x27;created&#x27;</span>, <span class="hljs-function">(<span class="hljs-params">id</span>) =&gt;</span> <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;记录日志&#x27;</span>, id));
orders.<span class="hljs-title function_">once</span>(<span class="hljs-string">&#x27;created&#x27;</span>, <span class="hljs-function">(<span class="hljs-params">id</span>) =&gt;</span> <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;只发一次通知&#x27;</span>, id));

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;触发前&#x27;</span>);
orders.<span class="hljs-title function_">emit</span>(<span class="hljs-string">&#x27;created&#x27;</span>, <span class="hljs-number">1</span>); <span class="hljs-comment">// 依次打印：记录日志 1、只发一次通知 1</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;触发后&#x27;</span>);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(orders.<span class="hljs-title function_">emit</span>(<span class="hljs-string">&#x27;created&#x27;</span>, <span class="hljs-number">2</span>), orders.<span class="hljs-title function_">listenerCount</span>(<span class="hljs-string">&#x27;created&#x27;</span>)); <span class="hljs-comment">// 先打印“记录日志 2”，再打印 true 1</span>
</code></pre></div>
<p>输出顺序是“触发前、记录日志 1、只发一次通知 1、触发后”。两个监听器都在 <code>emit</code> 返回之前执行完了，这就是官方文档说的同步、按注册顺序调用。所以监听器里如果有很重的同步计算，会直接阻塞调用 <code>emit</code> 的那段代码；需要异步时，要在监听器里自己用 <code>setImmediate()</code> 或 <code>process.nextTick()</code> 推迟。</p>
<p><code>once</code> 注册的监听器触发一次就被移除，所以第二次 <code>emit</code> 只剩一个监听器。<code>emit</code> 的返回值表示这个事件有没有监听器，有就是 <code>true</code>。</p>
<p><code>on</code>、<code>off</code>、<code>once</code> 和 <code>emit</code> 怎样手写，以及 <code>emit</code> 过程中增删监听器会怎样，见<a href="/questions/alg-event-emitter/">《怎样手写一个支持 on、off、once 和 emit 的事件中心？》</a>。</p>
<h2>为什么没有 error 监听器会让进程崩溃</h2>
<p><code>error</code> 是一个特殊的事件名。官方文档规定，emitter 没有任何 <code>error</code> 监听器时，触发 <code>error</code> 事件会把错误抛出，打印堆栈后 Node.js 进程退出。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">import</span> { <span class="hljs-title class_">EventEmitter</span> } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;node:events&#x27;</span>;

<span class="hljs-keyword">const</span> emitter = <span class="hljs-keyword">new</span> <span class="hljs-title class_">EventEmitter</span>();
<span class="hljs-keyword">try</span> {
  emitter.<span class="hljs-title function_">emit</span>(<span class="hljs-string">&#x27;error&#x27;</span>, <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">&#x27;连接断开&#x27;</span>));
} <span class="hljs-keyword">catch</span> (err) {
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;被抛出了&#x27;</span>, err.<span class="hljs-property">message</span>); <span class="hljs-comment">// 被抛出了 连接断开</span>
}

emitter.<span class="hljs-title function_">on</span>(<span class="hljs-string">&#x27;error&#x27;</span>, <span class="hljs-function">(<span class="hljs-params">err</span>) =&gt;</span> <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;已处理&#x27;</span>, err.<span class="hljs-property">message</span>));
emitter.<span class="hljs-title function_">emit</span>(<span class="hljs-string">&#x27;error&#x27;</span>, <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">&#x27;连接断开&#x27;</span>)); <span class="hljs-comment">// 已处理 连接断开</span>
</code></pre></div>
<p>为什么这样设计？因为错误是不能被默默吞掉的。普通事件没人听，<code>emit</code> 返回 <code>false</code> 就算了；错误没人处理，就按异常抛出去，逼开发者正视它。所以用流、socket 这类对象时，一定要监听 <code>error</code>，否则一次网络断开就可能让整个服务退出。</p>
<p>如果只想观察错误、比如上报监控，又不想改变“没人处理就抛出”的行为，可以监听 <code>events.errorMonitor</code> 这个符号。它的监听器先于 <code>error</code> 监听器执行，但不算“处理了错误”，没有真正的 <code>error</code> 监听器时错误照样抛出。</p>
<h2>监听器上限是在提醒什么</h2>
<p>默认情况下，同一个事件的监听器超过 10 个，Node.js 会往 stderr 打印一条警告：</p>
<div class="not-prose code-block"><div class="code-language">text</div><pre><code class="hljs language-text">MaxListenersExceededWarning: Possible EventEmitter memory leak detected. 11 data listeners added to [EventEmitter]. MaxListeners is 10.
</code></pre></div>
<p>这不是硬限制，第 11 个监听器照样会加上去。它的作用是提醒：常见的错误写法是每来一个请求，就给一个全局的 emitter 加一个监听器，用完不移除，监听器越积越多，它们闭包里引用的数据也释放不掉。</p>
<p>所以看到这个警告，第一反应应该是找出在哪里重复添加了监听器，而不是调大上限。确实需要更多监听器时，用 <code>emitter.setMaxListeners(n)</code> 只改这一个实例；<code>events.defaultMaxListeners</code> 会影响所有实例，包括修改之前创建的，官方文档提醒要谨慎使用。启动时加 <code>--trace-warnings</code> 能看到是哪行代码加的监听器。排查泄漏的完整方法见<a href="/questions/node-memory-leak/">《Node.js 服务内存泄漏怎样排查？》</a>。</p>
<h2>events.once() 和 events.on() 怎样配合 async/await</h2>
<p><code>emitter.once()</code> 是注册回调，而 <code>events</code> 模块的 <code>once()</code> 函数返回一个 Promise，适合“等某个事件发生一次”：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">import</span> { <span class="hljs-title class_">EventEmitter</span>, once } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;node:events&#x27;</span>;

<span class="hljs-keyword">const</span> server = <span class="hljs-keyword">new</span> <span class="hljs-title class_">EventEmitter</span>();
<span class="hljs-keyword">const</span> ready = <span class="hljs-title function_">once</span>(server, <span class="hljs-string">&#x27;ready&#x27;</span>);
server.<span class="hljs-title function_">emit</span>(<span class="hljs-string">&#x27;ready&#x27;</span>, <span class="hljs-number">8000</span>);
<span class="hljs-keyword">const</span> [port] = <span class="hljs-keyword">await</span> ready;
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(port); <span class="hljs-comment">// 8000</span>
</code></pre></div>
<p>Promise 兑现的值是一个数组，里面是 <code>emit</code> 时传的所有参数，所以要解构取值。等待期间如果触发了 <code>error</code>，Promise 会被拒绝，这样 <code>try/catch</code> 就能捕获。</p>
<p><code>on()</code> 函数返回异步迭代器，适合一条条处理持续到来的事件：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">import</span> { <span class="hljs-title class_">EventEmitter</span>, on } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;node:events&#x27;</span>;

<span class="hljs-keyword">const</span> ticks = <span class="hljs-keyword">new</span> <span class="hljs-title class_">EventEmitter</span>();
<span class="hljs-keyword">const</span> controller = <span class="hljs-keyword">new</span> <span class="hljs-title class_">AbortController</span>();
process.<span class="hljs-title function_">nextTick</span>(<span class="hljs-function">() =&gt;</span> {
  ticks.<span class="hljs-title function_">emit</span>(<span class="hljs-string">&#x27;tick&#x27;</span>, <span class="hljs-string">&#x27;a&#x27;</span>);
  ticks.<span class="hljs-title function_">emit</span>(<span class="hljs-string">&#x27;tick&#x27;</span>, <span class="hljs-string">&#x27;b&#x27;</span>);
  controller.<span class="hljs-title function_">abort</span>();
});

<span class="hljs-keyword">try</span> {
  <span class="hljs-keyword">for</span> <span class="hljs-keyword">await</span> (<span class="hljs-keyword">const</span> [value] <span class="hljs-keyword">of</span> <span class="hljs-title function_">on</span>(ticks, <span class="hljs-string">&#x27;tick&#x27;</span>, { <span class="hljs-attr">signal</span>: controller.<span class="hljs-property">signal</span> })) {
    <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;收到&#x27;</span>, value); <span class="hljs-comment">// 收到 a、收到 b</span>
  }
} <span class="hljs-keyword">catch</span> (err) {
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(err.<span class="hljs-property">name</span>); <span class="hljs-comment">// AbortError</span>
}
</code></pre></div>
<p>这个循环不会自己结束，因为事件随时可能再来。结束它有三种办法：循环里 <code>break</code>，传入 <code>signal</code> 后调用 <code>abort()</code>（循环会抛出 <code>AbortError</code>），或者用 <code>close</code> 选项指定某些事件触发时结束。退出循环时它会移除自己加的监听器。</p>
<p>官方文档还提醒，<code>for await</code> 的循环体是一次处理一个事件的，即使里面有 <code>await</code>，下一个事件也要等这一个处理完。需要并发处理时不要用它。</p>
<h2>常见追问</h2>
<p><strong>EventEmitter 和浏览器的 EventTarget 有什么区别？</strong></p>
<blockquote>
<p><code>EventEmitter</code> 的监听器直接收到 <code>emit</code> 传的参数，同一个函数可以重复注册多次，<code>error</code> 事件有“没人监听就抛出”的特殊规则。<code>EventTarget</code> 的监听器收到的是一个 <code>Event</code> 对象，同一个监听器对同一类型只能注册一次，<code>error</code> 也没有特殊行为。Node.js 也实现了 <code>EventTarget</code>，但没有事件冒泡这类层级传播；<code>events.once()</code> 对 <code>EventTarget</code> 同样适用。</p>
</blockquote>
<p><strong>监听器是 async 函数，里面抛错会怎样？</strong></p>
<blockquote>
<p><code>emit</code> 不会等待它，官方文档指出，这时抛出的错误会变成未处理的 Promise 拒绝。可以在创建 emitter 时传 <code>{ captureRejections: true }</code>，这样被拒绝的 Promise 会转成 <code>error</code> 事件；或者在 async 监听器里自己 <code>try/catch</code>。</p>
</blockquote>`};export{e as default};