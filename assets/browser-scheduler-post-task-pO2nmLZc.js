var e={answerHtml:`<p>页面同时要更新用户刚输入的搜索建议、渲染当前列表，还想整理下次可能用到的索引。这几件事的重要程度不同。<code>scheduler.postTask()</code> 让应用把回调交给浏览器调度，并表达任务优先级，而不必把所有延后工作都塞进没有业务优先级信息的计时器。</p>
<p>它安排的是任务回调，不是创建新的计算线程。在窗口中调用时，回调仍会占用页面主线程；同步执行太久，依然会阻塞输入和渲染。</p>
<h2>三种优先级分别适合什么工作</h2>
<table><thead><tr><th>优先级</th><th>含义与典型场景</th></tr></thead><tbody><tr><td><code>user-blocking</code></td><td>用户正等待结果，例如当前交互必需的处理</td></tr><tr><td><code>user-visible</code></td><td>当前页面需要显示，但相对不那么紧急的工作；也是默认值</td></tr><tr><td><code>background</code></td><td>可延后完成、暂时不影响当前体验的准备工作</td></tr></tbody></table>
<p>浏览器会结合优先级调度符合执行条件的任务，但这不是实时系统的截止时间保证，也不是强行抢占正在执行的 JavaScript。网络、渲染和其他任务源仍有各自的调度约束，不能由这三个字符串推导整个页面所有回调的绝对顺序。</p>
<p>把所有任务都标成 user-blocking，就失去了区分重要程度的意义。延后的任务如果用户不再需要，还应取消，而不只是降低优先级后无限积压。</p>
<p><code>delay</code> 可以指定最少等待时间。设置了高优先级但仍处于 delay 等待期间的任务，并不会因此越过尚未到期的条件；实际开始时间也可能比 delay 更晚。</p>
<h2>返回值是 Promise，取消也会造成拒绝</h2>
<p>下面是可在支持该接口的浏览器中运行的完整取消示例：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">demonstrateTaskCancellation</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">if</span> (<span class="hljs-keyword">typeof</span> globalThis.<span class="hljs-property">scheduler</span>?.<span class="hljs-property">postTask</span> !== <span class="hljs-string">&#x27;function&#x27;</span>) {
    <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;当前环境不支持 postTask&#x27;</span>);
    <span class="hljs-keyword">return</span>;
  }

  <span class="hljs-keyword">const</span> controller = <span class="hljs-keyword">new</span> <span class="hljs-title class_">AbortController</span>();
  <span class="hljs-keyword">const</span> task = globalThis.<span class="hljs-property">scheduler</span>.<span class="hljs-title function_">postTask</span>(<span class="hljs-function">() =&gt;</span> {
    <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;任务已经开始&#x27;</span>);
    <span class="hljs-keyword">return</span> <span class="hljs-number">42</span>;
  }, {
    <span class="hljs-attr">priority</span>: <span class="hljs-string">&#x27;background&#x27;</span>,
    <span class="hljs-attr">delay</span>: <span class="hljs-number">1000</span>,
    <span class="hljs-attr">signal</span>: controller.<span class="hljs-property">signal</span>,
  });

  controller.<span class="hljs-title function_">abort</span>();

  <span class="hljs-keyword">try</span> {
    <span class="hljs-keyword">const</span> value = <span class="hljs-keyword">await</span> task;
    <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(value);
  } <span class="hljs-keyword">catch</span> (error) {
    <span class="hljs-keyword">if</span> (error === controller.<span class="hljs-property">signal</span>.<span class="hljs-property">reason</span>) {
      <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;任务已取消&#x27;</span>);
    } <span class="hljs-keyword">else</span> {
      <span class="hljs-keyword">throw</span> error;
    }
  }
}

<span class="hljs-title function_">demonstrateTaskCancellation</span>().<span class="hljs-title function_">catch</span>(<span class="hljs-variable language_">console</span>.<span class="hljs-property">error</span>);
</code></pre></div>
<p>在支持的环境中，这里输出“任务已取消”，不会执行那个回调。若只是写 <code>scheduler.postTask(...); controller.abort();</code>，却不观察返回的 Promise，就可能产生未处理的 Promise 拒绝。</p>
<p>任务正常完成时，Promise 采用回调的返回值；回调抛出错误时，它会拒绝；回调返回 Promise 时，结果也会采用这个 Promise 的最终状态。所以错误处理应覆盖实际返回值，不是只给同步调用套一层 try/catch。</p>
<p>示例通过与 <code>signal.reason</code> 比较识别本次取消原因。调用 abort 时可以提供自定义原因，不应永远假定取消值一定是某个固定名称的 Error。</p>
<h2>取消排队，不等于中断已经运行的程序</h2>
<p>在任务尚未开始时取消，可以让它不再执行。已经进入同步循环后，浏览器不能突然在某条普通 JavaScript 指令之间插入一次用户点击处理并抢占它。</p>
<p>对于 async 回调，也不要以为给 postTask 传一个 signal，就自动取消回调中所有网络、定时器和后续工作。回调若已开始，需要把 signal 继续传给支持取消的操作，或在适当处理边界主动检查。</p>
<p>还要区分外层任务 Promise 的状态与回调的控制流。在取消和回调启动交错时，外层 Promise 可能已经因取消而拒绝，已启动的异步回调却仍会在普通 await 之后继续执行。因此进入外层 catch，不是“内部工作已经停止”的证据；回调内部的等待、取消和资源释放也要有合适的错误处理与 finally 边界。</p>
<p>取消还不等于撤销：任务之前写入的 DOM、数据库或业务请求不会自动回滚。筛选条件变化时，除了取消尚未执行的任务，还应检查结果是否属于最新一次操作，防止过期结果覆盖界面。</p>
<h2>任务很长时，需要主动让出</h2>
<p>把一个五百毫秒循环从 click 回调搬到 postTask，只是改变它开始的时间，并没有缩短它连续占用主线程的时长。</p>
<p>可以把工作分成有限的批次，在批次之间使用 <code>scheduler.yield()</code> 等方式让浏览器有机会处理其他事情。yield 的后续执行会安排为后续调度任务，不等同于 <code>await Promise.resolve()</code> 只接上一个微任务。</p>
<p>在 postTask 回调内调用 yield 时，后续执行可以继承该任务的优先级和相应取消上下文；同优先级下，yield 的继续执行还有专门的调度规则。但调用者仍需捕获取消导致的拒绝，不能把这一能力泛化为“任意 await 都会自动继承取消”。</p>
<p>如果单项计算本身就很重，批次之间检查仍然太晚，应进一步拆分算法或考虑 Worker。Worker 适合独立计算，postTask 更适合协调当前线程上不同重要程度的工作。</p>
<h2>想改变排队任务的优先级，用 TaskController</h2>
<p>普通 AbortController 只有取消相关能力，没有任务优先级。需要动态调整时，可以创建 TaskController，通过它的 TaskSignal 提供优先级，之后调用 <code>setPriority()</code>。</p>
<p>例如列表项原本在屏幕外，对应准备工作使用 background；用户滚动到附近后，再把这组尚未执行的工作提高到 user-visible。提升改变的是调度优先级，不会增加 CPU 算力，也不会把已经完成的工作重新执行。</p>
<p>如果在 postTask 的 options 中显式写了 <code>priority</code>，这个固定优先级会覆盖 signal 提供的优先级，此时不能期待 <code>setPriority()</code> 改动该任务。需要动态优先级时，应让 signal 成为优先级来源，不同时设置固定 priority。</p>
<h2>兼容处理应保留功能，不假装复制整个调度器</h2>
<p>使用前分别检查 <code>scheduler.postTask</code>、<code>scheduler.yield</code> 和 TaskController 等实际需要的能力，不能因为存在 scheduler 对象就认定所有方法都可用。支持范围还应按项目目标浏览器验证。</p>
<p>不支持时，可以用 setTimeout 等方式把工作安排到后续任务，并手动处理清理和取消；这种降级保留“稍后执行”的功能，但不提供同等的三档优先级或 yield 调度语义。</p>
<p><code>requestIdleCallback()</code> 等待空闲机会，有自己的适用范围；<code>requestAnimationFrame()</code> 用于协调视觉更新；微任务用于小范围且有界的即时收尾。它们并不是更换名称就等价的 postTask 实现。</p>
<p>评估效果时，观察实际长任务、交互延迟和关键内容的完成时间。后台工作晚一点完成可能正是预期收益，但任务回调仍然很长、输入仍然卡顿时，应继续减少或拆分工作，而不是不断调高优先级。</p>`};export{e as default};