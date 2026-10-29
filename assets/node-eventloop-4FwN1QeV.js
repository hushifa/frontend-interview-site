var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>浏览器的事件循环要兼顾页面渲染，Node.js 不用渲染，它的事件循环由 libuv 实现，按几个固定的阶段一圈圈转：timers 跑到期的定时器，poll 处理 I/O，check 跑 <code>setImmediate</code>，还有 pending callbacks 和 close callbacks。</p>
<p>在这些阶段之外，还有两个队列：<code>process.nextTick</code> 队列和 Promise 的微任务队列。每执行完一个回调，Node.js 先清空 nextTick 队列，再清空微任务队列。</p>
<p>所以 nextTick 一般先于 Promise，但不是一定。在 CommonJS 文件里，顶层的 nextTick 先执行；在 ES 模块里，模块本身就是在微任务里执行的，顶层的 Promise 回调反而先于 nextTick。</p>
<p>还有一个常考点：在主模块里，<code>setTimeout(fn, 0)</code> 和 <code>setImmediate</code> 谁先执行是不确定的；但在 I/O 回调里，<code>setImmediate</code> 一定先执行。</p>
</blockquote>
<h2>事件循环分哪几个阶段</h2>
<p>Node.js 的事件循环每一圈按顺序经过下面几个阶段，每个阶段处理自己那一类回调：</p>
<table><thead><tr><th>阶段</th><th>运行的回调</th></tr></thead><tbody><tr><td>timers</td><td>到期的 <code>setTimeout</code>、<code>setInterval</code></td></tr><tr><td>pending callbacks</td><td>上一轮推迟的部分系统级回调</td></tr><tr><td>poll</td><td>取回新的 I/O 事件并执行对应回调；没有其他工作时在这里等待</td></tr><tr><td>check</td><td><code>setImmediate</code></td></tr><tr><td>close callbacks</td><td>例如 socket 的 <code>close</code> 事件</td></tr></tbody></table>
<p>nextTick 队列和微任务队列不属于任何阶段。Node.js 每执行完一个回调就清空它们一次。所以如果在 nextTick 回调里不停地再调用 <code>process.nextTick</code>，事件循环就一直停在原地，进不了下一个阶段，I/O 回调永远得不到执行。</p>
<h2>同样的代码，为什么 .cjs 和 .mjs 输出不一样</h2>
<p>下面四行代码，分别存成 <code>.cjs</code> 和 <code>.mjs</code> 运行：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js">process.<span class="hljs-title function_">nextTick</span>(<span class="hljs-function">() =&gt;</span> <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;nextTick&#x27;</span>));
<span class="hljs-title class_">Promise</span>.<span class="hljs-title function_">resolve</span>().<span class="hljs-title function_">then</span>(<span class="hljs-function">() =&gt;</span> <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;promise&#x27;</span>));
<span class="hljs-built_in">setTimeout</span>(<span class="hljs-function">() =&gt;</span> <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;timeout&#x27;</span>));
<span class="hljs-title function_">setImmediate</span>(<span class="hljs-function">() =&gt;</span> <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;immediate&#x27;</span>));
</code></pre></div>
<p>在 Node.js 22 上的输出：</p>
<div class="not-prose code-block"><div class="code-language">text</div><pre><code class="hljs language-text">// a.cjs
nextTick
promise
timeout
immediate

// a.mjs
promise
nextTick
timeout
immediate
</code></pre></div>
<p>前两行的顺序反过来了。这是为什么？</p>
<p>CommonJS 的模块体就是一段普通的同步代码。它执行完以后，Node.js 按规矩先清空 nextTick 队列，再清空微任务队列，所以 <code>nextTick</code> 在前。</p>
<p>ES 模块不一样，它的求值本身就发生在一个 Promise 任务里。模块体执行完的时候，Node.js 正处在清空微任务队列的过程中，同一轮排进去的 Promise 回调会接着执行。nextTick 只能等这一轮微任务清空之后才轮到。</p>
<p>这个差异说明，业务逻辑不应该依赖 nextTick 和 Promise 谁先谁后。如果只是想“等当前操作结束再执行”，优先用 <code>queueMicrotask</code>，它在浏览器和 Node.js 里语义一致。</p>
<h2>setTimeout 和 setImmediate 谁先执行</h2>
<p>在主模块里，<code>setTimeout(fn, 0)</code> 实际上按 1 毫秒处理。事件循环进入 timers 阶段时，如果这 1 毫秒还没到，就先跳过，跑到 check 阶段执行 <code>setImmediate</code>。所以两者的先后取决于进程启动有多快。上面的例子在本机多次运行都是 timeout 在前，但这个顺序没有保证。</p>
<p>换到 I/O 回调里，结果就确定了：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> fs = <span class="hljs-built_in">require</span>(<span class="hljs-string">&#x27;node:fs&#x27;</span>);

fs.<span class="hljs-title function_">readFile</span>(__filename, <span class="hljs-function">() =&gt;</span> {
  <span class="hljs-built_in">setTimeout</span>(<span class="hljs-function">() =&gt;</span> <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;timeout&#x27;</span>));
  <span class="hljs-title function_">setImmediate</span>(<span class="hljs-function">() =&gt;</span> <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;immediate&#x27;</span>));
});
<span class="hljs-comment">// immediate</span>
<span class="hljs-comment">// timeout</span>
</code></pre></div>
<p>原因是 I/O 回调运行在 poll 阶段，poll 后面紧跟着就是 check 阶段，所以 <code>setImmediate</code> 一定先执行。<code>setTimeout</code> 要等转到下一圈的 timers 阶段。</p>
<h2>常见追问</h2>
<p><strong>为什么不要用大量 nextTick 递归？</strong></p>
<blockquote>
<p>因为 nextTick 队列在进入下一个阶段之前会一直执行到空。递归添加的话队列永远空不了，所有 I/O 都会被卡住。</p>
</blockquote>
<p><strong>CPU 密集任务放在 <code>setImmediate</code> 里分片可以吗？</strong></p>
<blockquote>
<p>可以让出事件循环，让别的回调有机会执行，但总耗时并没有减少。长时间的计算更适合交给 Worker Threads，见<a href="/questions/node-worker-threads/">《Node.js Worker Threads 适合解决什么问题？》</a>。</p>
</blockquote>
<p><strong>浏览器里有 nextTick 吗？</strong></p>
<blockquote>
<p>没有。浏览器只有微任务和任务，渲染时机由浏览器自己决定。</p>
</blockquote>`};export{e as default};