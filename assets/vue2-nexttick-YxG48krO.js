var e={answerHtml:`<blockquote>
<p>Vue 2 已于 2023-12-31 停止维护，本题以 Vue 2.7（vuejs/vue main 分支）源码为准。<code>nextTick</code> 的日常用法见<a href="/questions/vue-nexttick/">《修改状态后，为什么有时需要 await nextTick()？》</a>。</p>
</blockquote>
<h2>简答</h2>
<blockquote>
<p>数据一变，依赖它的 watcher 不会马上执行，而是调用 <code>queueWatcher</code> 进入一个队列。同一个 watcher 按 <code>id</code> 去重，一轮里只会进一次，所以同一事件里改十次数据，组件也只渲染一次。</p>
<p>第一次有 watcher 入队时，Vue 用 <code>nextTick(flushSchedulerQueue)</code> 安排一次刷新。刷新前按 <code>id</code> 从小到大排序（带 <code>post</code> 标记的排在最后），因为 id 是按创建顺序分配的，这样就保证了父组件先于子组件、用户写的 watcher 先于渲染 watcher。</p>
<p><code>nextTick</code> 本身是把回调存进一个 <code>callbacks</code> 数组，同一轮只调用一次 <code>timerFunc</code> 统一执行。<code>timerFunc</code> 按环境降级：原生 <code>Promise.then</code> → <code>MutationObserver</code> → <code>setImmediate</code> → <code>setTimeout(fn, 0)</code>，前两个是微任务，后两个是宏任务。</p>
<p>有一个细节常被问到：<code>nextTick</code> 的回调和 <code>flushSchedulerQueue</code> 在同一个数组里按注册顺序执行。所以在修改数据之前注册的 <code>nextTick</code> 回调，读到的还是旧 DOM。</p>
</blockquote>
<h2>watcher 怎么入队和去重</h2>
<p><code>queueWatcher</code> 用 <code>has[id]</code> 记录哪些 watcher 已经在队列里了。</p>
<p>已经在队列里就直接返回，这就是官方文档说的“同一个 watcher 被多次触发，只会被推入队列一次”。不在刷新过程中时直接 <code>push</code> 到队尾；如果正在刷新，就按 <code>id</code> 插到合适的位置，如果已经越过了它该在的位置，就紧接着执行。另外有一个 <code>waiting</code> 标记，保证每轮只调用一次 <code>nextTick(flushSchedulerQueue)</code>。</p>
<h2>刷新时为什么要排序</h2>
<p>源码注释列出了排序的三个目的：</p>
<ol>
<li>组件从父到子更新。父组件总是先于子组件创建，所以 <code>id</code> 更小。</li>
<li>组件的用户 watcher（<code>watch</code> 选项、<code>$watch</code>）先于渲染 watcher 执行，因为它们创建得更早。</li>
<li>如果父组件的 watcher 执行时把子组件销毁了，子组件的 watcher 可以直接跳过。</li>
</ol>
<p>循环里没有缓存 <code>queue.length</code>，因为执行过程中可能有新的 watcher 插进来。执行每个 watcher 前，先把 <code>has[id]</code> 清空，这样它在执行中又被触发时还能再入队。可是如果一直这样循环，就成了死循环，所以开发环境下同一个 watcher 再次入队超过 <code>MAX_UPDATE_COUNT</code>（100）次，Vue 会警告“You may have an infinite update loop”并中止。</p>
<p>队列跑完后，先调用 <code>activated</code> 钩子，再倒序调用组件的 <code>updated</code> 钩子。</p>
<h2>nextTick 为什么要降级</h2>
<p><code>next-tick.ts</code> 在模块加载时就选定了 <code>timerFunc</code>：</p>
<table><thead><tr><th>条件</th><th>实现</th><th>类型</th></tr></thead><tbody><tr><td>原生 <code>Promise</code> 可用</td><td><code>p.then(flushCallbacks)</code>，iOS 上额外 <code>setTimeout(noop)</code> 以绕过 UIWebView 的问题</td><td>微任务</td></tr><tr><td>非 IE 且有原生 <code>MutationObserver</code></td><td>监听一个文本节点，修改其内容触发回调</td><td>微任务</td></tr><tr><td>原生 <code>setImmediate</code> 可用</td><td><code>setImmediate(flushCallbacks)</code></td><td>宏任务</td></tr><tr><td>都不可用</td><td><code>setTimeout(flushCallbacks, 0)</code></td><td>宏任务</td></tr></tbody></table>
<p>优先用微任务，是因为微任务在当前代码执行完后、浏览器绘制前就会执行，更新能赶在用户看到画面之前完成。源码注释还记录了一段历史：2.5 曾经混用宏任务和微任务，结果在重绘前改状态（比如 out-in 过渡）和事件处理中都出了问题，之后改回全部用微任务。代价是微任务优先级太高，可能插在连续事件之间，甚至同一事件的冒泡过程之间执行。</p>
<p><code>MutationObserver</code> 排在 Promise 后面，是因为它在 iOS ≥ 9.3.3 的 UIWebView 中有问题，在 IE11 中也不可靠。</p>
<p>不传回调、并且环境支持 Promise 时，<code>nextTick()</code> 会返回一个 Promise。</p>
<h2>回调注册的顺序决定能不能读到新 DOM</h2>
<p>下面在修改数据前后各注册一个 <code>$nextTick</code>，再加一个普通的 <code>Promise.then</code>：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// vue@2.7.16，在浏览器中运行</span>
<span class="hljs-keyword">const</span> vm = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Vue</span>({ <span class="hljs-attr">data</span>: { <span class="hljs-attr">n</span>: <span class="hljs-number">0</span> }, <span class="hljs-attr">template</span>: <span class="hljs-string">&#x27;&lt;p&gt;{{ n }}&lt;/p&gt;&#x27;</span> }).$mount();
<span class="hljs-keyword">const</span> out = [];

vm.$nextTick(<span class="hljs-function">() =&gt;</span> out.<span class="hljs-title function_">push</span>(<span class="hljs-string">&#x27;先注册: &#x27;</span> + vm.<span class="hljs-property">$el</span>.<span class="hljs-property">textContent</span>));
vm.<span class="hljs-property">n</span> = <span class="hljs-number">1</span>; <span class="hljs-comment">// flushSchedulerQueue 排在上一个回调之后</span>
vm.$nextTick(<span class="hljs-function">() =&gt;</span> out.<span class="hljs-title function_">push</span>(<span class="hljs-string">&#x27;后注册: &#x27;</span> + vm.<span class="hljs-property">$el</span>.<span class="hljs-property">textContent</span>));
<span class="hljs-title class_">Promise</span>.<span class="hljs-title function_">resolve</span>().<span class="hljs-title function_">then</span>(<span class="hljs-function">() =&gt;</span> out.<span class="hljs-title function_">push</span>(<span class="hljs-string">&#x27;Promise.then&#x27;</span>));
out.<span class="hljs-title function_">push</span>(<span class="hljs-string">&#x27;同步: &#x27;</span> + vm.<span class="hljs-property">$el</span>.<span class="hljs-property">textContent</span>);

<span class="hljs-built_in">setTimeout</span>(<span class="hljs-function">() =&gt;</span> <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(out));
<span class="hljs-comment">// [&#x27;同步: 0&#x27;, &#x27;先注册: 0&#x27;, &#x27;后注册: 1&#x27;, &#x27;Promise.then&#x27;]</span>
</code></pre></div>
<p>很多人以为 <code>$nextTick</code> 里一定能读到新 DOM，可是“先注册”那个回调读到的是 0。原因是 <code>callbacks</code> 数组按注册顺序排：先是“先注册”的回调，然后 <code>vm.n = 1</code> 让 <code>flushSchedulerQueue</code> 排进来，再是“后注册”的回调。执行到“先注册”时，DOM 还没刷新。</p>
<p>那 <code>Promise.then</code> 为什么最后执行？因为第一次调用 <code>$nextTick</code> 时，<code>timerFunc</code> 已经用 <code>Promise.resolve().then</code> 安排了 <code>flushCallbacks</code>。后面这个 <code>Promise.then</code> 排在它之后，而 <code>flushCallbacks</code> 会一口气把数组里三个回调全跑完。</p>
<h2>常见追问</h2>
<p><strong>为什么不每次修改都同步渲染？</strong></p>
<blockquote>
<p>同一个事件里的多次修改会合并成一次渲染，避免重复计算和 DOM 操作。同步渲染的话，改几次就要渲染几次。</p>
</blockquote>
<p><strong>测试中想同步更新怎么办？</strong></p>
<blockquote>
<p>源码里开发环境设置 <code>config.async = false</code> 时，会直接同步执行 <code>flushSchedulerQueue</code>。这是给测试工具用的，不要在业务代码里用。</p>
</blockquote>
<p><strong>Vue 3 有什么不同？</strong></p>
<blockquote>
<p>Vue 3 不再做降级，直接基于 Promise 安排刷新。</p>
</blockquote>`};export{e as default};