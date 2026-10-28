var e={answerHtml:`<h2>简答</h2>
<ul>
<li>Node.js 的事件循环由 libuv 实现，按 timers、pending callbacks、poll、check、close callbacks 等阶段轮转；浏览器的事件循环还要安排渲染，两者的调度模型不同。</li>
<li>每个回调执行完，Node.js 会先清空 <code>process.nextTick</code> 队列，再清空 Promise 微任务队列。</li>
<li>在 CommonJS 入口，顶层的 nextTick 先于 Promise；在 ES 模块入口，模块体本身就在微任务中执行，顶层的 Promise 回调会先于 nextTick。</li>
<li><code>setTimeout(fn, 0)</code> 和 <code>setImmediate</code> 在主模块里的先后不确定；在 I/O 回调里，<code>setImmediate</code> 总是先执行。</li>
</ul>
<h2>事件循环的阶段</h2>
<table><thead><tr><th>阶段</th><th>运行的回调</th></tr></thead><tbody><tr><td>timers</td><td>到期的 <code>setTimeout</code>、<code>setInterval</code></td></tr><tr><td>pending callbacks</td><td>上一轮推迟的部分系统级回调</td></tr><tr><td>poll</td><td>取回新的 I/O 事件并执行对应回调；没有其他工作时在这里等待</td></tr><tr><td>check</td><td><code>setImmediate</code></td></tr><tr><td>close callbacks</td><td>例如 socket 的 <code>close</code> 事件</td></tr></tbody></table>
<p>nextTick 队列和微任务队列不属于任何阶段。Node.js 每执行完一个回调就清空它们，所以递归调用 <code>process.nextTick</code> 会让事件循环一直停在当前位置，I/O 回调得不到执行。</p>
<h2>CommonJS 与 ES 模块的顺序差异</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js">process.<span class="hljs-title function_">nextTick</span>(<span class="hljs-function">() =&gt;</span> <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;nextTick&#x27;</span>));
<span class="hljs-title class_">Promise</span>.<span class="hljs-title function_">resolve</span>().<span class="hljs-title function_">then</span>(<span class="hljs-function">() =&gt;</span> <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;promise&#x27;</span>));
<span class="hljs-built_in">setTimeout</span>(<span class="hljs-function">() =&gt;</span> <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;timeout&#x27;</span>));
<span class="hljs-title function_">setImmediate</span>(<span class="hljs-function">() =&gt;</span> <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;immediate&#x27;</span>));
</code></pre></div>
<p>在 Node.js 22 上分别保存为 <code>.cjs</code> 和 <code>.mjs</code> 运行：</p>
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
<p>CommonJS 模块体是一段普通的同步代码，执行完后先清空 nextTick 队列。ES 模块的求值发生在 Promise 任务里，模块体结束时 Node.js 正在清空微任务队列，同一轮排进去的 Promise 回调会继续执行，nextTick 要等这轮微任务清空之后。</p>
<p>这个差异说明了一件事：业务逻辑不应依赖 nextTick 与 Promise 的相对顺序。需要&quot;当前操作结束后再执行&quot;时，优先用 <code>queueMicrotask</code>，它在浏览器和 Node.js 中语义一致。</p>
<h2>setTimeout 与 setImmediate</h2>
<p>在主模块里，<code>setTimeout(fn, 0)</code> 实际按 1 毫秒处理。事件循环进入 timers 阶段时如果这 1 毫秒还没到，就会先跑到 check 阶段执行 <code>setImmediate</code>，所以两者的先后取决于进程启动速度。上例在本机多次运行都是 timeout 在前，但这个顺序没有保证。</p>
<p>在 I/O 回调里情况是确定的：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> fs = <span class="hljs-built_in">require</span>(<span class="hljs-string">&#x27;node:fs&#x27;</span>);

fs.<span class="hljs-title function_">readFile</span>(__filename, <span class="hljs-function">() =&gt;</span> {
  <span class="hljs-built_in">setTimeout</span>(<span class="hljs-function">() =&gt;</span> <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;timeout&#x27;</span>));
  <span class="hljs-title function_">setImmediate</span>(<span class="hljs-function">() =&gt;</span> <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;immediate&#x27;</span>));
});
<span class="hljs-comment">// immediate</span>
<span class="hljs-comment">// timeout</span>
</code></pre></div>
<p>I/O 回调运行在 poll 阶段，之后紧接着是 check 阶段，<code>setImmediate</code> 一定先执行，<code>setTimeout</code> 要等到下一轮的 timers 阶段。</p>
<h2>常见追问</h2>
<ul>
<li><strong>为什么不要用大量 nextTick 递归？</strong> 它会在进入下一个阶段之前一直执行，阻塞所有 I/O。</li>
<li><strong>CPU 密集任务放在 <code>setImmediate</code> 里分片可以吗？</strong> 可以让出事件循环，但总耗时不变；长时间计算更适合交给 Worker Threads，见<a href="/questions/node-worker-threads/">《Node.js Worker Threads 适合解决什么问题？》</a>。</li>
<li><strong>浏览器里有 nextTick 吗？</strong> 没有。浏览器只有微任务和任务，渲染时机由浏览器决定。</li>
</ul>`};export{e as default};