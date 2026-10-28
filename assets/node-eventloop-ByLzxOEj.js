var e={answerHtml:`<h2>简答</h2>
<ul>
<li>Node 事件循环由 libuv 驱动，主要阶段是 timers、poll、check 和 close。</li>
<li>process.nextTick 队列在 Promise 微任务之前执行。</li>
<li>setImmediate 在 check 阶段执行；在 I/O 回调中调度时，setImmediate 一定早于 setTimeout(0)。</li>
<li>在主模块中，setTimeout(0) 与 setImmediate 的先后顺序不确定。</li>
</ul>
<p>不能。浏览器与 Node.js 都执行 JavaScript、处理 Promise 微任务，但外围调度机制不同。浏览器要协调输入、页面渲染等任务；Node.js 依赖 libuv 等机制处理网络、文件和计时器，并有自己的事件循环阶段和 process.nextTick 队列。</p>
<p>把 Node 输出题统一理解成“一个宏任务队列加一个微任务队列”，容易在 setImmediate、I/O 和模块入口处得出错误结论。</p>
<h2>先认识几个常见阶段</h2>
<p>timers 处理达到时间阈值的定时器；poll 与 I/O 事件的等待、处理有关；check 执行 setImmediate 回调。此外还有 pending callbacks、close callbacks 等阶段。</p>
<p>setTimeout 的延时是等待阈值，不是准时执行承诺。前面的同步任务、I/O 回调或其他工作占用线程时，计时器只能继续等。把延时写成 0，也不表示它会在当前调用栈结束前执行。</p>
<p>从 libuv 1.45（Node.js 20 引入）开始，常规循环中定时器处理调整到 poll 之后；进入循环前还存在兼容处理。讨论旧资料里的阶段图时要核对版本，不应靠一张固定顺序图预测所有入口的行为。</p>
<h2>nextTick 与 Promise 的顺序要看执行上下文</h2>
<p>把下面代码保存为 CommonJS 文件，例如 demo.cjs：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;同步&#x27;</span>);
process.<span class="hljs-title function_">nextTick</span>(<span class="hljs-function">() =&gt;</span> <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;nextTick&#x27;</span>));
<span class="hljs-title class_">Promise</span>.<span class="hljs-title function_">resolve</span>().<span class="hljs-title function_">then</span>(<span class="hljs-function">() =&gt;</span> <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;Promise&#x27;</span>));
<span class="hljs-title function_">queueMicrotask</span>(<span class="hljs-function">() =&gt;</span> <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;queueMicrotask&#x27;</span>));
</code></pre></div>
<p>在 Node.js 22 的普通 CommonJS 入口中，输出为：同步、nextTick、Promise、queueMicrotask。nextTick 不是 check 或 timers 那样的事件循环阶段；Node 在执行边界处理其队列，再处理常见的 Promise 微任务。</p>
<p>但把同一段代码作为 ESM 入口执行时，会看到：同步、Promise、queueMicrotask、nextTick。ESM 模块求值已经处于微任务相关的执行过程，不能把 CommonJS 顶层的观察结果不加条件地推广过去。</p>
<p>Promise 回调和 queueMicrotask 都进入微任务队列，这里按入队顺序执行。微任务内部继续排微任务、排 nextTick 时，还要结合当前队列正在排空的过程分析，而不是把“nextTick 优先”理解成它能抢占正在执行的 JavaScript。</p>
<h2>setImmediate 与 setTimeout 不总有固定先后</h2>
<p>在程序顶层同时安排二者，顺序可能受计时和启动条件影响，不适合用一次运行结果证明固定规律。但在典型 I/O 回调中安排，setImmediate 会先有执行机会：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// 保存为 demo.cjs 后运行。</span>
<span class="hljs-keyword">const</span> { readFile } = <span class="hljs-built_in">require</span>(<span class="hljs-string">&#x27;node:fs&#x27;</span>);

<span class="hljs-title function_">readFile</span>(__filename, <span class="hljs-function">() =&gt;</span> {
  <span class="hljs-built_in">setTimeout</span>(<span class="hljs-function">() =&gt;</span> <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;timeout&#x27;</span>), <span class="hljs-number">0</span>);
  <span class="hljs-title function_">setImmediate</span>(<span class="hljs-function">() =&gt;</span> <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;immediate&#x27;</span>));
});
</code></pre></div>
<p>这里先输出 immediate，再输出 timeout。原因是代码从 I/O 回调中安排任务，后续 check 阶段可以处理 immediate；定时器还要等对应处理时机。不要把它改写成“所有 setImmediate 永远比 setTimeout 快”。</p>
<h2>await 不会把计算搬到其他线程</h2>
<p>同步大循环、复杂正则或巨大 JSON.parse 会占用当前 JavaScript 线程。即使外层函数声明为 async，这段计算仍然会阻塞其他请求回调。</p>
<p>持续递归 nextTick 可能让 I/O 饥饿；反复 await Promise.resolve 也不一定给 I/O 或计时器足够机会，因为它可能只是在不断续接微任务。需要分片让出事件循环时，可以考虑 setImmediate 等调度方式；CPU 密集任务则考虑 Worker 或独立进程。</p>
<p>分析 Node 时序题时，先标出同步代码和入队位置，再确认 Node 版本、模块类型及当前是否在 I/O 回调里。业务代码通常不应依赖不保证的相对顺序；需要先后关系时，直接通过 Promise、回调或明确的任务协议表达。</p>`};export{e as default};