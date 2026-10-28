var e={answerHtml:`<h2>简答</h2>
<ul>
<li>每轮事件循环取一个宏任务执行，执行完立即清空微任务队列，然后才可能渲染。</li>
<li>Promise 回调和 queueMicrotask 是微任务，setTimeout、消息事件和 I/O 回调是宏任务。</li>
<li>微任务里持续添加微任务会阻塞渲染和后续宏任务。</li>
<li>requestAnimationFrame 在渲染前执行，不属于普通任务队列。</li>
</ul>
<p>讨论事件循环，先限定环境：这里主要说浏览器页面主线程里的任务与微任务，不把 Web Worker 的独立执行环境或 Node.js 的阶段模型混进同一条顺序。</p>
<p>在当前 JavaScript 执行过程中，同步语句不会因为后面注册了一个 Promise 回调就被它从中间抢走。等宿主到达微任务检查点，才处理已经排队的微任务；随后再按调度条件处理任务和页面渲染。</p>
<h2>先从最小例子看清入队时机</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;A&#x27;</span>);
<span class="hljs-built_in">setTimeout</span>(<span class="hljs-function">() =&gt;</span> <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;B&#x27;</span>), <span class="hljs-number">0</span>);
<span class="hljs-title class_">Promise</span>.<span class="hljs-title function_">resolve</span>().<span class="hljs-title function_">then</span>(<span class="hljs-function">() =&gt;</span> <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;C&#x27;</span>));
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;D&#x27;</span>);
<span class="hljs-comment">// 输出顺序：A → D → C → B</span>
</code></pre></div>
<p>A 立即输出。setTimeout 注册定时器，不会在这一行直接调用回调；Promise.resolve 得到已兑现的 Promise，但 then 里的 C 仍要作为后续反应执行，不会当场插入同步代码。</p>
<p>因此先输出 D。到达微任务检查点后，C 可以执行；定时器的 B 要等到后续任务被调度。这里的顺序不是因为字符串 C 比 B“级别更高”，而是两者进入了不同的调度路径。</p>
<h2>Promise 构造器里的代码仍然是同步的</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;开始&#x27;</span>);
<span class="hljs-keyword">new</span> <span class="hljs-title class_">Promise</span>(<span class="hljs-function"><span class="hljs-params">resolve</span> =&gt;</span> {
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;执行器&#x27;</span>);
  <span class="hljs-title function_">resolve</span>();
}).<span class="hljs-title function_">then</span>(<span class="hljs-function">() =&gt;</span> <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;回调&#x27;</span>));
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;结束&#x27;</span>);
<span class="hljs-comment">// 输出顺序：开始 → 执行器 → 结束 → 回调</span>
</code></pre></div>
<p>创建 Promise 会同步执行传入的执行器函数。只有后续的反应回调需要排队，所以不能把“凡是写在 Promise 里的代码”都归为异步代码。</p>
<p>同样，async 函数在遇到第一个实际暂停点之前也会同步执行。把耗时循环包进 async 或 Promise 构造器，并不会自动交给另一个线程处理。</p>
<h2>微任务会继续处理本轮新增的微任务</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-title function_">queueMicrotask</span>(<span class="hljs-function">() =&gt;</span> {
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;微任务1&#x27;</span>);
  <span class="hljs-title function_">queueMicrotask</span>(<span class="hljs-function">() =&gt;</span> <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;微任务3&#x27;</span>));
});
<span class="hljs-title class_">Promise</span>.<span class="hljs-title function_">resolve</span>().<span class="hljs-title function_">then</span>(<span class="hljs-function">() =&gt;</span> <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;微任务2&#x27;</span>));
<span class="hljs-built_in">setTimeout</span>(<span class="hljs-function">() =&gt;</span> <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;定时器&#x27;</span>), <span class="hljs-number">0</span>);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;同步&#x27;</span>);
<span class="hljs-comment">// 输出顺序：同步 → 微任务1 → 微任务2 → 微任务3 → 定时器</span>
</code></pre></div>
<p>同步部分结束前，队列里先有微任务1，再有微任务2。运行微任务1时，把微任务3追加到队列末尾，所以它不是紧接着插队到微任务2前面，而是在微任务2之后运行。</p>
<p>微任务检查点会持续处理队列中新加入的工作，直到相关队列清空。因此递归安排微任务可能让页面长时间没有机会响应输入或绘制。不断 await 一个已经就绪的值，也不能可靠地给页面制造新的绘制机会，因为后续逻辑仍可能在微任务中接着执行。</p>
<h2>不要把规则简化成全局只有两个队列</h2>
<p>浏览器有不同任务来源，例如定时器、用户交互、网络相关工作。宿主对任务队列有自己的选择规则，不能推断所有来源都严格按一个统一的先进先出队列执行。</p>
<p>微任务检查点也不只存在于“一个宏任务结束后”这一个口头位置。宿主在执行栈满足条件的其他回调边界也可能执行检查点。复杂事件分发、多个回调和模块求值的顺序，要根据具体 API 与执行路径判断。</p>
<p>常见的 Promise 反应、queueMicrotask 与 MutationObserver 使用微任务机制，但何时排入队列取决于条件。一个仍在等待网络结果的 Promise，不能仅凭它“属于 Promise”就比已经可执行的定时器更早继续。</p>
<h2>0 毫秒不是立即执行</h2>
<p>setTimeout 的延迟影响任务何时满足调度条件，不是对回调实际执行时刻的精确承诺。当前同步代码、已有任务、微任务、嵌套定时器规则与后台节流都可能让回调更晚运行。</p>
<p>网络请求由浏览器的网络机制推进。请求结果到来后，宿主安排处理，Promise 的后续反应再进入相关微任务流程。不能把这个过程简单描述成“Promise 本身在后台线程运行”。</p>
<h2>DOM 改变了，不代表屏幕已经绘制了</h2>
<p>脚本设置文字或样式后，DOM 与样式状态已经变化，但用户看到的新画面还需要浏览器进行渲染更新。若紧接着继续执行很长的同步计算，或者不断追加微任务，加载提示可能已经存在于 DOM 中却迟迟没有显示。</p>
<p>浏览器会根据刷新节奏、可见性、工作负载等安排渲染，不保证每个任务结束后都绘制一次。requestAnimationFrame 适合在渲染更新阶段协调视觉修改，但其回调发生时也不能直接断言“这一帧已经画到屏幕上”。</p>
<p>需要给用户交互和其他工作机会时，应拆分长任务，按需求选择任务级调度或 Worker。setTimeout 等可以产生后续任务，但也不能提供固定帧率或严格时限。优化的目标是减少主线程持续占用，而不是给慢代码换一个异步语法外壳。</p>
<h2>两种微任务入口的错误处理也不同</h2>
<p>queueMicrotask 回调直接抛出的异常按宿主普通异常路径报告；Promise.then 回调抛错则使它返回的新 Promise 拒绝，需要在链上处理。二者都可能在微任务阶段运行，却不具有完全相同的错误接口。</p>
<p>Node.js 还有自己的事件循环阶段与 process.nextTick 队列，模块环境也会影响一些相对顺序。面试分析时应先说明环境，再列同步执行和各次入队的位置，最后根据宿主规则判断输出，而不是只背一张不分环境的优先级表。</p>`};export{e as default};