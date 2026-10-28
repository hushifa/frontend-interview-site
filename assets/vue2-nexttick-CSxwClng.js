var e={answerHtml:`<blockquote>
<p>Vue 2 已于 2023-12-31 停止维护，本题以 Vue 2.7（vuejs/vue main 分支）源码为准。<code>nextTick</code> 的日常用法见<a href="/questions/vue-nexttick/">《修改状态后，为什么有时需要 await nextTick()？》</a>。</p>
</blockquote>
<h2>简答</h2>
<ul>
<li>数据变化时，依赖它的 watcher 调用 <code>queueWatcher</code> 入队；同一个 watcher 按 <code>id</code> 去重，一轮中只入队一次。</li>
<li>第一次入队时用 <code>nextTick(flushSchedulerQueue)</code> 安排刷新；刷新前按 <code>id</code> 升序排序（带 <code>post</code> 标记的排在最后），保证父组件先于子组件、用户 watcher 先于渲染 watcher。</li>
<li><code>nextTick</code> 把回调存进 <code>callbacks</code> 数组，同一轮只调用一次 <code>timerFunc</code>，统一执行。</li>
<li><code>timerFunc</code> 的降级顺序：原生 <code>Promise.then</code> → <code>MutationObserver</code> → <code>setImmediate</code> → <code>setTimeout(fn, 0)</code>，前两者是微任务。</li>
<li><code>nextTick</code> 回调与 <code>flushSchedulerQueue</code> 在同一个 <code>callbacks</code> 数组里按注册顺序执行，所以在修改数据之前注册的回调读不到新 DOM。</li>
</ul>
<h2>入队与去重：queueWatcher</h2>
<p><code>queueWatcher</code> 用 <code>has[id]</code> 记录已入队的 watcher：</p>
<ul>
<li>已在队列中直接返回，这就是官方文档说的“同一个 watcher 被多次触发，只会被推入队列一次”。</li>
<li>不在刷新中时直接 <code>push</code>；正在刷新时，按 <code>id</code> 插入到合适位置，如果已经越过它的位置，就紧接着执行。</li>
<li><code>waiting</code> 标记保证每轮只调用一次 <code>nextTick(flushSchedulerQueue)</code>。</li>
</ul>
<h2>刷新：flushSchedulerQueue</h2>
<p>源码注释列出排序的三个目的：</p>
<ol>
<li>组件从父到子更新，因为父组件总是先于子组件创建，<code>id</code> 更小。</li>
<li>组件的用户 watcher（<code>watch</code> 选项、<code>$watch</code>）先于渲染 watcher 执行，因为它们创建得更早。</li>
<li>父组件的 watcher 执行时销毁了子组件，可以跳过子组件的 watcher。</li>
</ol>
<p>循环中不缓存 <code>queue.length</code>，因为执行过程中可能有新的 watcher 插入。执行每个 watcher 前先把 <code>has[id]</code> 置空；开发环境下如果同一个 watcher 再次入队超过 <code>MAX_UPDATE_COUNT</code>（100）次，会警告“You may have an infinite update loop”并中止。队列跑完后先调用 <code>activated</code>，再倒序调用组件的 <code>updated</code> 钩子。</p>
<h2>nextTick 的降级策略</h2>
<p><code>next-tick.ts</code> 在模块加载时选定 <code>timerFunc</code>：</p>
<table><thead><tr><th>条件</th><th>实现</th><th>类型</th></tr></thead><tbody><tr><td>原生 <code>Promise</code> 可用</td><td><code>p.then(flushCallbacks)</code>，iOS 上额外 <code>setTimeout(noop)</code> 以绕过 UIWebView 的问题</td><td>微任务</td></tr><tr><td>非 IE 且有原生 <code>MutationObserver</code></td><td>监听一个文本节点，修改其内容触发回调</td><td>微任务</td></tr><tr><td>原生 <code>setImmediate</code> 可用</td><td><code>setImmediate(flushCallbacks)</code></td><td>宏任务</td></tr><tr><td>都不可用</td><td><code>setTimeout(flushCallbacks, 0)</code></td><td>宏任务</td></tr></tbody></table>
<p>注释说明了历史：2.5 曾混用宏任务和微任务，因为在重绘前改状态（如 out-in 过渡）和事件处理中存在问题，之后改回全部使用微任务。代价是微任务优先级过高，可能插在连续事件甚至同一事件的冒泡之间执行。<code>MutationObserver</code> 排在 Promise 之后，是因为它在 iOS ≥ 9.3.3 的 UIWebView 中有问题，在 IE11 中也不可靠。</p>
<p>不传回调且环境支持 Promise 时，<code>nextTick()</code> 返回一个 Promise。</p>
<h2>示例：回调注册顺序决定能否读到新 DOM</h2>
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
<p>第一次调用 <code>$nextTick</code> 时 <code>timerFunc</code> 已经用 <code>Promise.resolve().then</code> 安排了 <code>flushCallbacks</code>，后面的 <code>Promise.then</code> 排在它之后，所以最后执行。</p>
<h2>常见追问</h2>
<ul>
<li>为什么不每次修改都同步渲染？同一事件中的多次修改会合并成一次渲染，避免重复计算和 DOM 操作。</li>
<li>测试中想同步更新怎么办？源码中开发环境 <code>config.async = false</code> 时直接同步执行 <code>flushSchedulerQueue</code>，这是给测试工具用的，不应在业务中使用。</li>
<li>Vue 3 有什么不同？Vue 3 不再做降级，直接基于 Promise 安排刷新。</li>
</ul>`};export{e as default};