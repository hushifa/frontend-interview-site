var e={answerHtml:`<h2>简答</h2>
<ul>
<li>当前同步代码先运行到调用栈清空，期间注册的回调只是入队。</li>
<li>调用栈清空后进入微任务检查点，微任务队列会被清空，清空过程中新加入的微任务也在这一轮执行。</li>
<li>Promise 回调、<code>queueMicrotask</code> 和 <code>MutationObserver</code> 回调属于微任务；<code>setTimeout</code>、用户事件、<code>MessageChannel</code> 消息属于任务。</li>
<li>浏览器可以在两个任务之间渲染，但不保证每个任务后都渲染；<code>requestAnimationFrame</code> 回调在渲染前执行。</li>
<li>微任务不断产生新的微任务，会让后续任务和渲染一直等待。</li>
</ul>
<h2>经典输出题</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;A&#x27;</span>);
<span class="hljs-built_in">setTimeout</span>(<span class="hljs-function">() =&gt;</span> <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;B&#x27;</span>), <span class="hljs-number">0</span>);
<span class="hljs-title class_">Promise</span>.<span class="hljs-title function_">resolve</span>().<span class="hljs-title function_">then</span>(<span class="hljs-function">() =&gt;</span> <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;C&#x27;</span>));
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;D&#x27;</span>);
<span class="hljs-comment">// 输出顺序：A → D → C → B</span>
</code></pre></div>
<p><code>A</code>、<code>D</code> 是同步代码。<code>then</code> 回调进入微任务队列，<code>setTimeout</code> 回调进入定时器对应的任务源。脚本执行完后先清空微任务输出 <code>C</code>，之后事件循环才取出定时器任务输出 <code>B</code>。</p>
<h2>一轮循环大致做什么</h2>
<ol>
<li>从某个任务队列取出一个任务执行（脚本本身、定时器回调、事件回调等）。</li>
<li>调用栈清空后执行微任务检查点，直到微任务队列为空。</li>
<li>如果到了渲染时机，依次处理 resize/scroll 等事件、<code>requestAnimationFrame</code> 回调、样式与布局、绘制。</li>
<li>回到第 1 步。</li>
</ol>
<p>HTML 规范允许浏览器在多个任务源之间按优先级选择，所以&quot;不同来源的任务谁先执行&quot;不是固定顺序，只能保证同一任务源内按入队顺序。</p>
<h2>await 与微任务</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">run</span>(<span class="hljs-params"></span>) {
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-number">1</span>);
  <span class="hljs-keyword">await</span> <span class="hljs-literal">null</span>;
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-number">3</span>);
}
<span class="hljs-title function_">run</span>();
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-number">2</span>);
<span class="hljs-comment">// 1 → 2 → 3</span>
</code></pre></div>
<p><code>await</code> 之前的代码同步执行；<code>await</code> 之后的部分作为微任务恢复。</p>
<h2>微任务饥饿</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">loop</span>(<span class="hljs-params"></span>) {
  <span class="hljs-title function_">queueMicrotask</span>(loop); <span class="hljs-comment">// 永远不会让出给定时器和渲染</span>
}
</code></pre></div>
<p>需要长时间分片处理时，应把每片放进任务（<code>setTimeout</code>、<code>MessageChannel</code>、<code>scheduler.postTask</code>）或用 <code>scheduler.yield()</code> 让出，而不是放在微任务里循环。</p>
<h2>常见追问</h2>
<ul>
<li>Node.js 的顺序一样吗？大体模型相同，但 Node 有 <code>process.nextTick</code> 队列和 libuv 的阶段划分，见<a href="/questions/node-eventloop/">《Node.js 事件循环和浏览器有什么不同？nextTick 一定先于 Promise 吗？》</a>。</li>
<li><code>setTimeout(fn, 0)</code> 是否立刻执行？不会，它至少等当前任务和微任务完成；嵌套层级较深时浏览器还会把延迟钳制到至少 4ms。</li>
</ul>`};export{e as default};