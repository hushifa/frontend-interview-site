var e={answerHtml:`<h2>简答</h2>
<ul>
<li>scheduler.postTask 把回调交给浏览器调度，可选 user-blocking、user-visible、background 三种优先级。</li>
<li>可以传入 signal 取消任务，TaskController 还能修改后续任务的优先级。</li>
<li>它不是 setTimeout 或 requestAnimationFrame 的同义替换，返回的 Promise 可以把结果传给后续流程。</li>
<li>优先级不是严格公平的队列；使用前用 globalThis.scheduler?.postTask 做特性检测。</li>
</ul>
<p>页面可能同时要处理输入反馈、更新搜索结果和整理离线索引。这些工作对用户的重要程度不同。<code>scheduler.postTask()</code> 允许表达任务优先级，并通过 Promise 得到任务结果。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">buildSearchIndex</span>(<span class="hljs-params">items, signal</span>) {
  <span class="hljs-keyword">if</span> (!globalThis.<span class="hljs-property">scheduler</span>?.<span class="hljs-property">postTask</span>) <span class="hljs-keyword">return</span> <span class="hljs-title function_">buildInChunks</span>(items, signal);
  <span class="hljs-keyword">return</span> scheduler.<span class="hljs-title function_">postTask</span>(
    <span class="hljs-function">() =&gt;</span> <span class="hljs-title function_">buildInChunks</span>(items, signal),
    { <span class="hljs-attr">priority</span>: <span class="hljs-string">&#x27;background&#x27;</span>, signal },
  );
}
</code></pre></div>
<p>示例中的 buildInChunks 仍应主动分片；把一个很长的同步循环放进 postTask，不会让它在执行中自动被抢占。background 只是调度偏好，不是“永远等用户任务完成”或严格的实时保证。</p>
<h2>三种优先级表达不同意图</h2>
<p>user-blocking 适合与当前用户操作紧密相关的任务，user-visible 是默认的可见更新，background 适合预取、索引和清理。浏览器会综合其他因素安排执行，不能把优先级当作固定的时间排序。</p>
<p>如果任务在用户输入后已经过期，取消它通常比继续执行更有价值。AbortSignal 可以取消尚未执行或可取消的任务；任务开始后，回调内部仍需响应 signal，普通同步代码不会被强行终止。</p>
<h2>signal 与 priority 的组合有规则</h2>
<p>只需要固定优先级时可以传 <code>priority</code>；需要动态调整时使用合适的 TaskController/TaskSignal 机制。不要同时配置互相冲突的来源，具体版本的接口和支持度需按文档核对。</p>
<p><code>postTask</code> 返回的 Promise 可能因任务错误或取消而拒绝。应区分 AbortError、业务错误和未处理异常，避免把取消显示成系统故障，也不要因为 catch 后忽略就继续使用不完整结果。</p>
<h2>它与 setTimeout、requestAnimationFrame 不是同义替换</h2>
<p>setTimeout 主要表达最小延迟，requestAnimationFrame 适合与下一帧绘制协作，postTask 表达任务优先级与取消。选择看工作目的，而不是把所有“稍后执行”统一换成新 API。</p>
<p>它也不能替代 Worker：CPU 密集计算仍会占用当前执行上下文。要移出主线程，需要 Worker 或其他执行模型，并承担数据传递成本。</p>
<p>浏览器兼容性和后台节流要核对。没有 Scheduler API 时，可以采用分片、setTimeout 等降级，但应保持取消和不会阻塞用户操作的语义。测试要覆盖任务过期、取消、错误和大量连续输入。</p>
<h2>postTask 的返回值可以把结果传给后续流程</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">prepareSuggestions</span>(<span class="hljs-params">items, signal</span>) {
  <span class="hljs-keyword">const</span> task = scheduler.<span class="hljs-title function_">postTask</span>(
    <span class="hljs-function">() =&gt;</span> items.<span class="hljs-title function_">filter</span>(<span class="hljs-function">(<span class="hljs-params">item</span>) =&gt;</span> item.<span class="hljs-property">visible</span>),
    { <span class="hljs-attr">priority</span>: <span class="hljs-string">&#x27;user-visible&#x27;</span>, signal },
  );
  <span class="hljs-keyword">try</span> {
    <span class="hljs-keyword">return</span> <span class="hljs-keyword">await</span> task;
  } <span class="hljs-keyword">catch</span> (error) {
    <span class="hljs-keyword">if</span> (signal.<span class="hljs-property">aborted</span>) <span class="hljs-keyword">return</span> [];
    <span class="hljs-keyword">throw</span> error;
  }
}
</code></pre></div>
<p>这段代码把取消与业务结果分开：用户已经输入了新关键词时，旧任务可以返回空或被上层丢弃；真正的计算异常则继续向上报告。不要为了让界面不报错，把所有 rejected Promise 都转成空数据，因为这样会隐藏真实缺陷。</p>
<p>如果任务内部还会启动 fetch、Worker 或自定义 Promise，postTask 的 signal 不会自动传给这些子任务。需要手动传递，并在任务结束时清理监听、计时器和结果提交。</p>
<h2>优先级不是严格的公平队列</h2>
<p>高优先级任务可能持续到达，让 background 工作长时间得不到机会；反过来，浏览器还会根据渲染、输入、系统资源和页面可见性调整安排。不要用 postTask 构造“必须在 16ms 内执行”的硬实时系统。</p>
<p>持续的大任务仍需分片并周期性让出执行权。可以在每批工作后用 <code>scheduler.yield()</code>（如果目标环境支持）或其他任务边界继续，避免一次 callback 自己占住主线程太久。</p>
<h2>TaskController 可以修改后续任务优先级</h2>
<p>当用户从搜索输入转为提交，可以让仍在排队的任务改变优先级或取消。动态优先级需要使用对应的 TaskController/TaskSignal 组合，而不是先设置固定 priority 后再期望 signal 改写它。</p>
<p>具体接口仍处于逐步支持状态，TypeScript 类型和浏览器实现可能滞后。应通过能力检测、类型补充或封装适配，并为旧浏览器保留普通分片路径。</p>
<h2>与 React/Vue 调度不要重复打架</h2>
<p>框架已经可能对状态更新做批处理或优先级区分。把框架更新再包进 postTask，不会自动知道组件是否已卸载；任务执行前仍要检查当前页面和请求身份，避免向已销毁组件提交结果。</p>
<p>适合的用法是把框架外的大块索引、预处理或低优先级整理交给浏览器调度，而不是把每一次 setState 都手动排进队列。先用 Performance 和交互指标确认确实存在调度问题，再引入额外抽象。</p>
<h2>优先级应该由用户动作的有效期决定</h2>
<p>搜索框是很典型的例子：用户输入 <code>re</code> 后排队的补全任务，在用户继续输入 <code>rea</code> 时已经没有展示价值。可以为每次输入建立独立控制器，并在提交结果前确认它仍然是最新查询：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">let</span> queryVersion = <span class="hljs-number">0</span>;
<span class="hljs-keyword">let</span> controller;

<span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">updateSuggestions</span>(<span class="hljs-params">query</span>) {
  controller?.<span class="hljs-title function_">abort</span>();
  <span class="hljs-keyword">const</span> currentController = <span class="hljs-keyword">new</span> <span class="hljs-title class_">TaskController</span>({ <span class="hljs-attr">priority</span>: <span class="hljs-string">&#x27;user-visible&#x27;</span> });
  controller = currentController;
  <span class="hljs-keyword">const</span> version = ++queryVersion;

  <span class="hljs-keyword">try</span> {
    <span class="hljs-keyword">const</span> result = <span class="hljs-keyword">await</span> scheduler.<span class="hljs-title function_">postTask</span>(
      <span class="hljs-function">() =&gt;</span> <span class="hljs-title function_">fetchSuggestions</span>(query, currentController.<span class="hljs-property">signal</span>),
      { <span class="hljs-attr">signal</span>: currentController.<span class="hljs-property">signal</span> },
    );
    <span class="hljs-keyword">if</span> (version === queryVersion) <span class="hljs-title function_">renderSuggestions</span>(result);
  } <span class="hljs-keyword">catch</span> (error) {
    <span class="hljs-keyword">if</span> (error.<span class="hljs-property">name</span> !== <span class="hljs-string">&#x27;AbortError&#x27;</span>) <span class="hljs-keyword">throw</span> error;
  }
}
</code></pre></div>
<p>示例把“取消任务”和“忽略过期结果”同时做了，因为任务可能已经开始执行，单靠 abort 不一定能阻止第三方代码继续完成。若 <code>fetchSuggestions</code> 不接受 signal，也至少要保留版本检查，避免旧请求覆盖新结果。</p>
<h2>分片时要估算工作量</h2>
<p>把一万条数据放进一个 <code>postTask</code> 回调，浏览器仍要连续执行这段同步代码，输入和绘制会被阻塞。更稳妥的方式是每批处理固定数量，或在达到时间预算后让出控制权：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">processInBatches</span>(<span class="hljs-params">items, signal</span>) {
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">let</span> index = <span class="hljs-number">0</span>; index &lt; items.<span class="hljs-property">length</span>; index += <span class="hljs-number">100</span>) {
    <span class="hljs-keyword">if</span> (signal.<span class="hljs-property">aborted</span>) <span class="hljs-keyword">throw</span> signal.<span class="hljs-property">reason</span>;
    <span class="hljs-title function_">processBatch</span>(items.<span class="hljs-title function_">slice</span>(index, index + <span class="hljs-number">100</span>));
    <span class="hljs-keyword">if</span> (globalThis.<span class="hljs-property">scheduler</span>?.<span class="hljs-property">yield</span>) <span class="hljs-keyword">await</span> globalThis.<span class="hljs-property">scheduler</span>.<span class="hljs-title function_">yield</span>();
  }
}
</code></pre></div>
<p>批次太小会增加调度开销，太大又会造成长任务，应结合 Performance 面板中的 Long Task 和真实设备测试调整。</p>
<h2>不要用 priority 掩盖架构问题</h2>
<p>如果页面每次滚动都创建大量重复任务，单纯把它们设为 background 仍会浪费 CPU 和电量。应先去重、合并、缓存或在事件层节流；对于大型 JSON 解析、图像处理和压缩，优先考虑 Worker。Scheduler 适合表达“什么时候更值得做”，不能替代任务拆分、取消、缓存和资源释放。</p>`};export{e as default};