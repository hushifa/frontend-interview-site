var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>用户在搜索框里打字，同时下面一个大列表正在用新数据重新渲染。React 要让打字先响应、列表慢慢渲染，靠的是两层机制：reconciler 里的 Lane 决定“哪个更新更急”，<code>scheduler</code> 包决定“什么时候执行、执行多久让出主线程”。</p>
<p>Scheduler 收到任务时，按优先级给它算一个过期时间，比如用户阻塞级是 250 毫秒，普通级是 5000 毫秒，再按过期时间放进一个小顶堆。在浏览器里，它用 <code>MessageChannel</code> 发消息来安排一个宏任务，在这个宏任务里连续执行任务，执行超过约 5 毫秒就停下来，把主线程还给浏览器去处理输入和绘制，再发一条消息接着做。这就是时间切片。源码注释说选 <code>MessageChannel</code> 是因为 <code>setTimeout</code> 有 4 毫秒的嵌套限制。</p>
<p>Lane 是一个 31 位的二进制数，每一位代表一种优先级，位越低越急。点击这类离散事件里的更新是 <code>SyncLane</code>，<code>startTransition</code> 里的更新是 <code>TransitionLane</code>。根节点上待处理的更新用按位或合并，<code>lanes &amp; -lanes</code> 取出最低的那一位，就是下一次要处理的最高优先级。渲染某个 Lane 时，React 再把它映射成 Scheduler 的优先级交给 Scheduler。</p>
<p>要注意，不是所有渲染都被切片。源码里同步、连续输入和默认优先级的 Lane 被归为阻塞型，走不检查让出的同步工作循环；只有 Transition 这类非阻塞更新才在每个 fiber 之间检查 <code>shouldYield</code>。另外，这些都是 React 内部实现，常量和函数名会随版本变化，下文以 2026 年 10 月 facebook/react 主分支源码为准。</p>
</blockquote>
<h2>为什么要自己写调度器</h2>
<p>渲染一个大组件树，如果一口气做完，主线程会被占住几十甚至几百毫秒，期间用户的输入没有反应。Fiber 把渲染拆成一个个小单元，做完一个单元就可以停下，原理见<a href="/questions/react-virtual-dom-fiber/">《React 的虚拟 DOM 和 diff 是怎样工作的？Fiber 解决了什么问题？》</a>。</p>
<p>可是“什么时候停、停了以后什么时候继续”需要有人管，这就是 <code>scheduler</code> 包的工作。浏览器自带的 <code>requestIdleCallback</code> 只在空闲时触发，什么时候有空闲说不准，React 没有用它，见<a href="/questions/browser-request-idle-callback/">《requestIdleCallback 适合做什么？为什么不能用它保证任务一定执行？》</a>。</p>
<h2>Scheduler 怎样排队</h2>
<p>Scheduler 对外的入口是 <code>unstable_scheduleCallback(priorityLevel, callback)</code>。优先级定义在 <code>SchedulerPriorities.js</code> 里，从 1 到 5 依次是 <code>ImmediatePriority</code>、<code>UserBlockingPriority</code>、<code>NormalPriority</code>、<code>LowPriority</code>、<code>IdlePriority</code>。</p>
<p>每个优先级对应一个超时时间，加上当前时间就是任务的过期时间 <code>expirationTime</code>。当前源码的取值如下：</p>
<table><thead><tr><th>优先级</th><th>超时</th><th>来源</th></tr></thead><tbody><tr><td>ImmediatePriority</td><td>-1，立即过期</td><td><code>Scheduler.js</code></td></tr><tr><td>UserBlockingPriority</td><td>250 毫秒</td><td><code>userBlockingPriorityTimeout</code></td></tr><tr><td>NormalPriority</td><td>5000 毫秒</td><td><code>normalPriorityTimeout</code></td></tr><tr><td>LowPriority</td><td>10000 毫秒</td><td><code>lowPriorityTimeout</code></td></tr><tr><td>IdlePriority</td><td>1073741823，永不过期</td><td><code>maxSigned31BitInt</code></td></tr></tbody></table>
<p>任务对象的 <code>sortIndex</code> 设为 <code>expirationTime</code>，放进 <code>taskQueue</code>。<code>taskQueue</code> 是 <code>SchedulerMinHeap.js</code> 实现的小顶堆，比较的是 <code>sortIndex</code>，相同时比较自增的 <code>id</code>。所以过期时间最早的任务总在堆顶，优先级高的任务虽然后来，算出来的过期时间更早，也会排到前面。</p>
<p>带 <code>delay</code> 参数的任务还没到开始时间，会先放进另一个堆 <code>timerQueue</code>，按开始时间排序，到时间后再挪进 <code>taskQueue</code>。</p>
<h2>时间切片是怎样实现的</h2>
<p>真正干活的是 <code>performWorkUntilDeadline</code>。它记下开始时间，然后调用 <code>flushWork</code>，里面的 <code>workLoop</code> 不断从堆顶取任务执行。每取一个任务前，如果这个任务还没过期，并且 <code>shouldYieldToHost()</code> 返回 <code>true</code>，就停下来。</p>
<p><code>shouldYieldToHost</code> 的判断很简单：从这次开始到现在，过去的时间小于 <code>frameInterval</code> 就继续，否则让出。<code>frameInterval</code> 的默认值来自 <code>frameYieldMs</code>，当前是 5 毫秒。</p>
<p>停下以后还有任务，就再安排一次 <code>performWorkUntilDeadline</code>。安排的方式按环境选择：</p>
<ul>
<li>有 <code>setImmediate</code> 的环境（Node.js 和旧版 IE）用 <code>setImmediate</code>，源码注释说它不会像 <code>MessageChannel</code> 那样阻止 Node.js 进程退出，执行时机也更早。</li>
<li>浏览器和 Worker 里用 <code>MessageChannel</code>：<code>port1.onmessage</code> 设为 <code>performWorkUntilDeadline</code>，每次通过 <code>port2.postMessage(null)</code> 触发。注释写的原因是 <code>setTimeout</code> 有 4 毫秒的限制。</li>
<li>都没有时才退回 <code>setTimeout(performWorkUntilDeadline, 0)</code>。</li>
</ul>
<p><code>postMessage</code> 触发的是一个宏任务，所以每次让出以后，浏览器能先处理排在前面的输入事件和渲染，再回来接着执行。这里的 4 毫秒限制指的是 HTML 规范对嵌套定时器的规定，详见<a href="/questions/alg-set-interval/">《怎样用 setTimeout 实现 setInterval？两者有什么区别？》</a>。</p>
<p>还有一点：任务的回调如果返回一个函数，Scheduler 会把它当作同一个任务的后续，留在堆里下次接着执行。React 正是用这种方式把一次没做完的渲染接上。</p>
<p>下面用普通 JavaScript 模拟这个过程。每个单位工作耗时 1 毫秒，切片长度 5 毫秒。“渲染列表”先进队列，需要 8 个单位；“响应输入”后进队列，只需 2 个单位，但优先级更高：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> timeouts = { <span class="hljs-title class_">UserBlocking</span>: <span class="hljs-number">250</span>, <span class="hljs-title class_">Normal</span>: <span class="hljs-number">5000</span>, <span class="hljs-title class_">Low</span>: <span class="hljs-number">10000</span> };
<span class="hljs-keyword">let</span> now = <span class="hljs-number">0</span>;
<span class="hljs-keyword">let</span> taskId = <span class="hljs-number">0</span>;
<span class="hljs-keyword">const</span> taskQueue = [];
<span class="hljs-keyword">const</span> done = [];

<span class="hljs-keyword">function</span> <span class="hljs-title function_">scheduleCallback</span>(<span class="hljs-params">priority, name, units</span>) {
  <span class="hljs-keyword">const</span> expirationTime = now + timeouts[priority];
  taskQueue.<span class="hljs-title function_">push</span>({ <span class="hljs-attr">id</span>: taskId++, name, units, expirationTime });
  taskQueue.<span class="hljs-title function_">sort</span>(<span class="hljs-function">(<span class="hljs-params">a, b</span>) =&gt;</span> a.<span class="hljs-property">expirationTime</span> - b.<span class="hljs-property">expirationTime</span> || a.<span class="hljs-property">id</span> - b.<span class="hljs-property">id</span>);
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">performWorkUntilDeadline</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">const</span> startTime = now;
  <span class="hljs-keyword">while</span> (taskQueue.<span class="hljs-property">length</span> &gt; <span class="hljs-number">0</span>) {
    <span class="hljs-keyword">if</span> (now - startTime &gt;= <span class="hljs-number">5</span>) {
      <span class="hljs-keyword">return</span> <span class="hljs-string">&#x27;让出主线程&#x27;</span>;
    }
    <span class="hljs-keyword">const</span> task = taskQueue[<span class="hljs-number">0</span>];
    now += <span class="hljs-number">1</span>;
    task.<span class="hljs-property">units</span> -= <span class="hljs-number">1</span>;
    <span class="hljs-keyword">if</span> (task.<span class="hljs-property">units</span> === <span class="hljs-number">0</span>) {
      taskQueue.<span class="hljs-title function_">shift</span>();
      done.<span class="hljs-title function_">push</span>(task.<span class="hljs-property">name</span> + <span class="hljs-string">&#x27;@&#x27;</span> + now);
    }
  }
  <span class="hljs-keyword">return</span> <span class="hljs-string">&#x27;队列清空&#x27;</span>;
}

<span class="hljs-title function_">scheduleCallback</span>(<span class="hljs-string">&#x27;Normal&#x27;</span>, <span class="hljs-string">&#x27;渲染列表&#x27;</span>, <span class="hljs-number">8</span>);
<span class="hljs-title function_">scheduleCallback</span>(<span class="hljs-string">&#x27;UserBlocking&#x27;</span>, <span class="hljs-string">&#x27;响应输入&#x27;</span>, <span class="hljs-number">2</span>);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">performWorkUntilDeadline</span>()); <span class="hljs-comment">// 让出主线程</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(done.<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;, &#x27;</span>)); <span class="hljs-comment">// 响应输入@2</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">performWorkUntilDeadline</span>()); <span class="hljs-comment">// 队列清空</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(done.<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;, &#x27;</span>)); <span class="hljs-comment">// 响应输入@2, 渲染列表@10</span>
</code></pre></div>
<p>“响应输入”虽然后加入，过期时间是 250，比“渲染列表”的 5000 早，排到了堆顶，所以先完成。接着“渲染列表”做了 3 个单位，到第 5 毫秒，切片用完，让出主线程。下一次宏任务再把剩下的 5 个单位做完。</p>
<p>这个模拟用数组排序代替小顶堆，用一个数字代替真实时间，只为说明顺序。真实的 Scheduler 只在两个任务之间检查让出；一次渲染内部的让出是由 React 的工作循环在每个 fiber 之间调用 <code>shouldYield</code> 实现的，下面会讲到。</p>
<h2>Lane 用二进制位表示优先级</h2>
<p>Scheduler 只认 5 个优先级，React 内部需要更细的区分：同一时间可能有多个不同来源的更新在等待，有的还需要分组、合并。所以 reconciler 用 Lane 表示更新的优先级。</p>
<p><code>ReactFiberLane.js</code> 里 <code>TotalLanes</code> 是 31，每个 Lane 是一个只有一位为 1 的二进制数，越靠右越优先。几个常见的 Lane：</p>
<table><thead><tr><th>Lane</th><th>二进制</th><th>来源</th></tr></thead><tbody><tr><td>SyncLane</td><td><code>0b10</code></td><td>点击、输入等离散事件里的更新</td></tr><tr><td>InputContinuousLane</td><td><code>0b1000</code></td><td>滚动、<code>mousemove</code> 等连续事件里的更新</td></tr><tr><td>DefaultLane</td><td><code>0b100000</code></td><td>不在事件中触发的普通更新</td></tr><tr><td>TransitionLane1 到 14</td><td>第 8 位到第 21 位</td><td><code>startTransition</code> 里的更新</td></tr><tr><td>IdleLane</td><td>第 29 位</td><td>空闲优先级</td></tr></tbody></table>
<p>事件和 Lane 的对应关系在 <code>ReactEventPriorities.js</code> 里：<code>DiscreteEventPriority</code> 就是 <code>SyncLane</code>，<code>ContinuousEventPriority</code> 就是 <code>InputContinuousLane</code>，<code>DefaultEventPriority</code> 就是 <code>DefaultLane</code>。<code>ReactDOMEventListener.js</code> 把 <code>click</code>、<code>input</code> 等事件归为离散事件，<code>scroll</code>、<code>mousemove</code> 等归为连续事件。Transition 有 14 条 Lane，新的 Transition 会依次分到下一条，用完再回到第一条。</p>
<p>用位表示的好处是集合运算都是位运算。多个更新合在一起是按位或，<code>mergeLanes(a, b)</code> 就是 <code>a | b</code>；去掉某个 Lane 是 <code>removeLanes(set, subset)</code>，写作 <code>set &amp; ~subset</code>；取最高优先级是 <code>getHighestPriorityLane(lanes)</code>，写作 <code>lanes &amp; -lanes</code>，利用补码只留下最低位的 1。下面照源码里的数值算一遍：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> <span class="hljs-title class_">SyncLane</span> = <span class="hljs-number">0b0000010</span>;
<span class="hljs-keyword">const</span> <span class="hljs-title class_">InputContinuousLane</span> = <span class="hljs-number">0b0001000</span>;
<span class="hljs-keyword">const</span> <span class="hljs-title class_">DefaultLane</span> = <span class="hljs-number">0b0100000</span>;

<span class="hljs-keyword">function</span> <span class="hljs-title function_">mergeLanes</span>(<span class="hljs-params">a, b</span>) {
  <span class="hljs-keyword">return</span> a | b;
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">getHighestPriorityLane</span>(<span class="hljs-params">lanes</span>) {
  <span class="hljs-keyword">return</span> lanes &amp; -lanes;
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">removeLanes</span>(<span class="hljs-params">set, subset</span>) {
  <span class="hljs-keyword">return</span> set &amp; ~subset;
}

<span class="hljs-keyword">let</span> pendingLanes = <span class="hljs-number">0</span>;
pendingLanes = <span class="hljs-title function_">mergeLanes</span>(pendingLanes, <span class="hljs-title class_">DefaultLane</span>);
pendingLanes = <span class="hljs-title function_">mergeLanes</span>(pendingLanes, <span class="hljs-title class_">SyncLane</span>);
pendingLanes = <span class="hljs-title function_">mergeLanes</span>(pendingLanes, <span class="hljs-title class_">InputContinuousLane</span>);

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(pendingLanes.<span class="hljs-title function_">toString</span>(<span class="hljs-number">2</span>)); <span class="hljs-comment">// 101010</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">getHighestPriorityLane</span>(pendingLanes) === <span class="hljs-title class_">SyncLane</span> ? <span class="hljs-string">&#x27;SyncLane&#x27;</span> : <span class="hljs-string">&#x27;其他&#x27;</span>); <span class="hljs-comment">// SyncLane</span>

pendingLanes = <span class="hljs-title function_">removeLanes</span>(pendingLanes, <span class="hljs-title class_">SyncLane</span>);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">getHighestPriorityLane</span>(pendingLanes) === <span class="hljs-title class_">InputContinuousLane</span> ? <span class="hljs-string">&#x27;InputContinuousLane&#x27;</span> : <span class="hljs-string">&#x27;其他&#x27;</span>); <span class="hljs-comment">// InputContinuousLane</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>((pendingLanes &amp; <span class="hljs-title class_">DefaultLane</span>) !== <span class="hljs-number">0</span> ? <span class="hljs-string">&#x27;还有 DefaultLane&#x27;</span> : <span class="hljs-string">&#x27;没有&#x27;</span>); <span class="hljs-comment">// 还有 DefaultLane</span>
</code></pre></div>
<p>三个更新合并以后，一个数字就记下了三种待处理的优先级。处理完 <code>SyncLane</code> 把它去掉，剩下的最高优先级就是 <code>InputContinuousLane</code>，<code>DefaultLane</code> 还在等。</p>
<h2>Lane 怎样交给 Scheduler</h2>
<p>更新发生时，<code>requestUpdateLane</code> 决定它的 Lane：在 Transition 里就分一条 TransitionLane，否则按当前事件优先级取 Lane。Lane 合并进根节点的 <code>pendingLanes</code> 后，<code>ReactFiberRootScheduler.js</code> 取出下一批要处理的 Lane。</p>
<p>如果里面有 <code>SyncLane</code>，不交给 Scheduler，源码注释说同步工作总会在微任务结束时刷新。其他情况先把 Lane 换算成事件优先级，再映射为 Scheduler 优先级：离散和连续事件对应 <code>UserBlockingPriority</code>，默认对应 <code>NormalPriority</code>，空闲对应 <code>IdlePriority</code>，然后调用 <code>scheduleCallback</code>。</p>
<h2>哪些渲染会被切片</h2>
<p>拿到要渲染的 Lane 后，<code>ReactFiberWorkLoop.js</code> 先算 <code>shouldTimeSlice</code>。<code>includesBlockingLane</code> 把 <code>SyncLane</code>、<code>InputContinuousLane</code>、<code>DefaultLane</code> 等归为阻塞型，包含阻塞型 Lane 或者已过期的 Lane 时，走 <code>workLoopSync</code>，一个 fiber 接一个做完，不检查让出。</p>
<p>否则走并发循环，当前默认是 <code>workLoopConcurrentByScheduler</code>：只要还有 fiber，并且 <code>shouldYield()</code> 返回 <code>false</code>，就继续处理下一个 fiber。<code>shouldYield</code> 就是 Scheduler 的 <code>shouldYieldToHost</code>。所以真正被切片、能被打断的，主要是 Transition、Retry、Idle 这类非阻塞更新。这也解释了为什么要用 <code>useTransition</code> 才能让大列表渲染不卡输入，见<a href="/questions/react-transitions/">《useTransition 和 useDeferredValue 能优化哪些卡顿？》</a>。</p>
<p>低优先级更新也不会无限等下去。<code>markStarvedLanesAsExpired</code> 会给每个待处理的 Lane 记一个过期时间，同步和连续输入类是 250 毫秒，Transition 是 5000 毫秒（Retry Lane 的过期由 <code>enableRetryLaneExpiration</code> 开关控制，当前默认关闭），过期后加入 <code>expiredLanes</code>，下次渲染就按同步方式做完，避免一直被高优先级更新插队而“饿死”。</p>
<h2>常见追问</h2>
<p><strong>为什么用 MessageChannel，不用 setTimeout 或 requestAnimationFrame？</strong></p>
<blockquote>
<p>源码注释给的理由是 <code>setTimeout</code> 有 4 毫秒的限制：HTML 规范规定定时器嵌套超过 5 层后，延迟至少 4 毫秒，时间切片每 5 毫秒就要让出一次，这个损耗太大。<code>MessageChannel</code> 的消息是宏任务，没有这个限制，又能让浏览器在两次之间处理输入和绘制。在 Node.js 里 Scheduler 优先用 <code>setImmediate</code>。</p>
</blockquote>
<p><strong>Scheduler 的优先级和 Lane 是什么关系？</strong></p>
<blockquote>
<p>两者分属两个包。Lane 在 reconciler 里，用 31 个二进制位区分更新，能表示“一组待处理的更新”。Scheduler 是一个通用的任务调度器，只有 5 个优先级。React 调度一次渲染时，先取最高优先级的 Lane，换算成事件优先级，再映射成 Scheduler 优先级。<code>SyncLane</code> 的渲染不经过 Scheduler，在微任务里同步完成。</p>
</blockquote>
<p><strong>时间切片会让渲染变快吗？</strong></p>
<blockquote>
<p>不会，总工作量没有减少，还多了让出和恢复的开销。它的作用是不让一次长渲染长时间占住主线程，让输入事件能插进来，高优先级更新可以打断低优先级的渲染先完成。</p>
</blockquote>`};export{e as default};