var e={answerHtml:`<p>浏览器主线程不仅运行 JavaScript，还要参与输入处理、样式计算和布局等工作。如果一次任务连续占用线程很久，后来到达的点击就只能排队，页面也可能无法及时更新。</p>
<p>Long Tasks 相关 API 用大约 50 毫秒的阈值识别长时间占用。但 50 毫秒是观测阈值，不是“低于它就一定流畅”的保证：高刷新率屏幕和连续动画的时间预算更短，多个较短任务也可能影响体验。</p>
<h3>用户等待的不只是事件处理函数</h3>
<p>假设主线程正在计算 200 毫秒的列表排序，用户在第 20 毫秒点了按钮。即使按钮自己的处理函数只用 2 毫秒，它也要先等排序让出线程。之后框架更新、布局和绘制还可能增加等待。</p>
<p>因此，交互响应包括排队等待、处理以及后续呈现。只测按钮处理函数执行了多久，可能漏掉最主要的卡顿来源。</p>
<h3>先减少工作，再考虑拆分</h3>
<p>如果每次输入都对十万条记录重复解析、排序，优先消除重复工作、减少参与计算的数据或建立合适索引。拆分并不会减少总计算量，还可能增加调度成本。</p>
<p>确认必须执行的工作较多后，可以按时间预算分片：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">yieldToBrowser</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">if</span> (globalThis.<span class="hljs-property">scheduler</span>?.<span class="hljs-property">yield</span>) {
    <span class="hljs-keyword">await</span> globalThis.<span class="hljs-property">scheduler</span>.<span class="hljs-title function_">yield</span>();
  } <span class="hljs-keyword">else</span> {
    <span class="hljs-keyword">await</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Promise</span>(<span class="hljs-function">(<span class="hljs-params">resolve</span>) =&gt;</span> <span class="hljs-built_in">setTimeout</span>(resolve, <span class="hljs-number">0</span>));
  }
}

<span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">processInChunks</span>(<span class="hljs-params">items, visit, signal</span>) {
  <span class="hljs-keyword">let</span> sliceStart = performance.<span class="hljs-title function_">now</span>();
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">let</span> i = <span class="hljs-number">0</span>; i &lt; items.<span class="hljs-property">length</span>; i += <span class="hljs-number">1</span>) {
    signal?.<span class="hljs-title function_">throwIfAborted</span>();
    <span class="hljs-title function_">visit</span>(items[i], i);

    <span class="hljs-keyword">if</span> (i + <span class="hljs-number">1</span> &lt; items.<span class="hljs-property">length</span> &amp;&amp; performance.<span class="hljs-title function_">now</span>() - sliceStart &gt;= <span class="hljs-number">8</span>) {
      <span class="hljs-keyword">await</span> <span class="hljs-title function_">yieldToBrowser</span>();
      sliceStart = performance.<span class="hljs-title function_">now</span>();
    }
  }
}
</code></pre></div>
<p>这里约 8 毫秒检查一次是否需要让出，给其他任务执行机会；8 不是通用最优值，要按设备和工作量调整。visit 约定为同步且单次耗时有限，不能传入一个内部还要执行几百毫秒的操作，然后期待外层循环把它抢占。</p>
<p>signal 的取消也只能在检查点生效。若单次 visit 长时间不返回，取消事件和下一次检查都无法及时执行。输入数组在处理期间应保持稳定；若用户又发起新筛选，应取消旧任务或用版本标记丢弃旧结果，避免分片完成后覆盖新状态。</p>
<h3>为什么 await Promise.resolve 没有同样效果</h3>
<p>Promise 的后续通常进入微任务队列。浏览器会在相应检查点排空微任务，连续排入更多微任务可能让输入和渲染继续等待。所以把大循环分成很多 <code>.then()</code>，不等于真正把执行机会交还给其他任务。</p>
<p>scheduler.yield 设计用于让出后安排继续执行；setTimeout 降级会增加一个后续任务，但存在计时器延迟与节流。两者都不是“每次 await 后保证绘制一帧”。浏览器会根据当前调度和渲染时机决定接下来做什么。</p>
<h3>Worker 和渲染优化各解决一部分问题</h3>
<p>纯数据计算可以考虑 Worker，让主线程不承担那段 CPU 工作。但数据克隆、传输和线程启动都有成本，Worker 也不能直接修改页面 DOM。最好减少传输体积并复用工作线程。</p>
<p>如果瓶颈是反复读写布局导致同步计算，应该调整 DOM 访问顺序、减少重排或缩小渲染范围；把网络请求搬到 Worker 并不能修复这类卡顿。大列表还可评估分页或虚拟化，但要处理焦点和可访问性。</p>
<p>验证优化时同时看最长连续占用、关键交互响应和任务总完成时间。分片后总时间略增但点击更及时，可能是合理取舍；若只是让每块恰好低于 50 毫秒，却仍连续卡顿，就没有达成用户体验目标。</p>`};export{e as default};