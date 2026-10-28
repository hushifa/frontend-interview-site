var e={answerHtml:`<h2>简答</h2>
<ul>
<li>定时器回调和 Promise 微任务不在同一队列。</li>
<li>推进 Fake Timers 不一定执行定时器回调里产生的微任务。</li>
<li>优先使用测试框架提供的异步推进方法，不要手动猜 await 次数。</li>
<li>可以向被测代码注入计时器，让时间可控。</li>
</ul>
<p>搜索框请求失败后每秒重试，接口连续失败三次后显示错误；测试看起来只用了几毫秒，却声称已经验证了四秒的退避过程。另一个测试开启 Fake Timers 后，Promise 回调没有执行，开发者只能不断增加 <code>await</code>。问题通常不是断言写错，而是把定时器、微任务和真实时间当成了同一种队列。</p>
<h2>定时器和 Promise 不在同一队列</h2>
<p><code>setTimeout</code>、<code>setInterval</code> 等回调由计时器任务调度；Promise continuation 和 <code>queueMicrotask</code> 属于微任务。推进 Fake Timers 的时间通常只会让到期的计时器进入待执行状态，不一定自动执行由计时器回调创建的 Promise 微任务。测试框架提供的异步推进方法应优先使用，而不是手动猜测需要多少个 <code>await</code>。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">export</span> <span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">retryAfter</span>(<span class="hljs-params">task, delays, setTimer = <span class="hljs-built_in">setTimeout</span></span>) {
  <span class="hljs-keyword">if</span> (!<span class="hljs-title class_">Array</span>.<span class="hljs-title function_">isArray</span>(delays) || !<span class="hljs-title class_">Array</span>.<span class="hljs-title function_">from</span>(delays).<span class="hljs-title function_">every</span>(<span class="hljs-function">(<span class="hljs-params">ms</span>) =&gt;</span>
    <span class="hljs-title class_">Number</span>.<span class="hljs-title function_">isInteger</span>(ms) &amp;&amp; ms &gt;= <span class="hljs-number">0</span> &amp;&amp; ms &lt;= <span class="hljs-number">2147483647</span>)) {
    <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">RangeError</span>(<span class="hljs-string">&#x27;退避值必须是有效的非负整数毫秒数&#x27;</span>);
  }
  <span class="hljs-keyword">const</span> schedule = [...delays];
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">let</span> attempt = <span class="hljs-number">0</span>; ; attempt += <span class="hljs-number">1</span>) {
    <span class="hljs-keyword">try</span> {
      <span class="hljs-keyword">return</span> <span class="hljs-keyword">await</span> <span class="hljs-title function_">task</span>();
    } <span class="hljs-keyword">catch</span> (error) {
      <span class="hljs-keyword">if</span> (attempt === schedule.<span class="hljs-property">length</span>) <span class="hljs-keyword">throw</span> error;
    }
    <span class="hljs-comment">// 等待失败也会拒绝外层 Promise，不留下悬挂任务。</span>
    <span class="hljs-keyword">await</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Promise</span>(<span class="hljs-function">(<span class="hljs-params">resolve</span>) =&gt;</span> <span class="hljs-title function_">setTimer</span>(resolve, schedule[attempt]));
  }
}
</code></pre></div>
<p>在测试中可以注入计时器，或使用 Vitest/Jest 的 fake timers。依赖注入让纯业务逻辑不必知道测试框架，但仍要验证真实浏览器中的 <code>AbortController</code>、网络失败和页面卸载行为；Fake Timers 只能控制 JavaScript 时间，不会模拟真实网络和渲染调度。</p>
<h2>测试重试时要推进“任务完成后的时间”</h2>
<p>如果第一次任务同步失败，计时器可能立刻被安排；如果任务返回 Promise，测试需要先让 Promise 微任务完成，再推进下一次计时器。一个稳妥的流程是：启动请求，等待初始微任务，推进到下一次退避时间，等待异步回调，再断言下一次调用。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">import</span> { afterEach, expect, it, vi } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;vitest&#x27;</span>;

<span class="hljs-title function_">afterEach</span>(<span class="hljs-function">() =&gt;</span> {
  vi.<span class="hljs-title function_">clearAllTimers</span>();
  vi.<span class="hljs-title function_">useRealTimers</span>();
  vi.<span class="hljs-title function_">restoreAllMocks</span>();
});

<span class="hljs-title function_">it</span>(<span class="hljs-string">&#x27;按退避时间重试，并在成功后停止&#x27;</span>, <span class="hljs-title function_">async</span> () =&gt; {
  vi.<span class="hljs-title function_">useFakeTimers</span>();
  <span class="hljs-keyword">const</span> task = vi
    .<span class="hljs-title function_">fn</span>()
    .<span class="hljs-title function_">mockRejectedValueOnce</span>(<span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">&#x27;暂时失败&#x27;</span>))
    .<span class="hljs-title function_">mockResolvedValueOnce</span>(<span class="hljs-string">&#x27;ok&#x27;</span>);

  <span class="hljs-keyword">const</span> promise = <span class="hljs-title function_">retryAfter</span>(task, [<span class="hljs-number">1000</span>]);
  <span class="hljs-keyword">await</span> vi.<span class="hljs-title function_">advanceTimersByTimeAsync</span>(<span class="hljs-number">0</span>);
  <span class="hljs-title function_">expect</span>(task).<span class="hljs-title function_">toHaveBeenCalledTimes</span>(<span class="hljs-number">1</span>);

  <span class="hljs-keyword">await</span> vi.<span class="hljs-title function_">advanceTimersByTimeAsync</span>(<span class="hljs-number">999</span>);
  <span class="hljs-title function_">expect</span>(task).<span class="hljs-title function_">toHaveBeenCalledTimes</span>(<span class="hljs-number">1</span>);
  <span class="hljs-keyword">await</span> vi.<span class="hljs-title function_">advanceTimersByTimeAsync</span>(<span class="hljs-number">1</span>);
  <span class="hljs-keyword">await</span> <span class="hljs-title function_">expect</span>(promise).<span class="hljs-property">resolves</span>.<span class="hljs-title function_">toBe</span>(<span class="hljs-string">&#x27;ok&#x27;</span>);
  <span class="hljs-title function_">expect</span>(task).<span class="hljs-title function_">toHaveBeenCalledTimes</span>(<span class="hljs-number">2</span>);
  <span class="hljs-title function_">expect</span>(vi.<span class="hljs-title function_">getTimerCount</span>()).<span class="hljs-title function_">toBe</span>(<span class="hljs-number">0</span>);
});

<span class="hljs-title function_">it</span>(<span class="hljs-string">&#x27;失败耗尽后停止，不留下下一次重试&#x27;</span>, <span class="hljs-title function_">async</span> () =&gt; {
  vi.<span class="hljs-title function_">useFakeTimers</span>();
  <span class="hljs-keyword">const</span> error = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">&#x27;持续失败&#x27;</span>);
  <span class="hljs-keyword">const</span> task = vi.<span class="hljs-title function_">fn</span>().<span class="hljs-title function_">mockRejectedValue</span>(error);
  <span class="hljs-keyword">const</span> promise = <span class="hljs-title function_">retryAfter</span>(task, [<span class="hljs-number">100</span>, <span class="hljs-number">200</span>]);
  <span class="hljs-comment">// 先安装拒绝断言，避免推进时先触发未处理拒绝。</span>
  <span class="hljs-keyword">const</span> assertion = <span class="hljs-title function_">expect</span>(promise).<span class="hljs-property">rejects</span>.<span class="hljs-title function_">toBe</span>(error);
  <span class="hljs-keyword">await</span> vi.<span class="hljs-title function_">advanceTimersByTimeAsync</span>(<span class="hljs-number">300</span>);
  <span class="hljs-keyword">await</span> assertion;
  <span class="hljs-title function_">expect</span>(task).<span class="hljs-title function_">toHaveBeenCalledTimes</span>(<span class="hljs-number">3</span>);
  <span class="hljs-title function_">expect</span>(vi.<span class="hljs-title function_">getTimerCount</span>()).<span class="hljs-title function_">toBe</span>(<span class="hljs-number">0</span>);
});

<span class="hljs-title function_">it</span>(<span class="hljs-string">&#x27;拒绝稀疏或非法退避值，并且不执行任务&#x27;</span>, <span class="hljs-title function_">async</span> () =&gt; {
  <span class="hljs-keyword">const</span> task = vi.<span class="hljs-title function_">fn</span>();
  <span class="hljs-keyword">await</span> <span class="hljs-title function_">expect</span>(<span class="hljs-title function_">retryAfter</span>(task, <span class="hljs-keyword">new</span> <span class="hljs-title class_">Array</span>(<span class="hljs-number">2</span>))).<span class="hljs-property">rejects</span>.<span class="hljs-title function_">toThrow</span>(<span class="hljs-title class_">RangeError</span>);
  <span class="hljs-keyword">await</span> <span class="hljs-title function_">expect</span>(<span class="hljs-title function_">retryAfter</span>(task, [-<span class="hljs-number">1</span>])).<span class="hljs-property">rejects</span>.<span class="hljs-title function_">toThrow</span>(<span class="hljs-title class_">RangeError</span>);
  <span class="hljs-keyword">await</span> <span class="hljs-title function_">expect</span>(<span class="hljs-title function_">retryAfter</span>(task, [<span class="hljs-title class_">NaN</span>])).<span class="hljs-property">rejects</span>.<span class="hljs-title function_">toThrow</span>(<span class="hljs-title class_">RangeError</span>);
  <span class="hljs-title function_">expect</span>(task).<span class="hljs-property">not</span>.<span class="hljs-title function_">toHaveBeenCalled</span>();
});
</code></pre></div>
<p><code>advanceTimersByTimeAsync</code> 是 Vitest 当前提供的异步推进方式之一；不同测试框架名称和微任务处理细节可能不同，应以锁定版本的文档为准。不要把 <code>runAllTimers()</code> 当成所有异步测试的默认方案：无限轮询或递归定时器会让测试永不结束，应该设置最大尝试次数并断言停止条件。</p>
<h2>轮询必须有结束条件和可取消路径</h2>
<p>轮询代码如果只依赖 <code>setInterval</code>，可能在上一次请求尚未结束时发起下一次请求，造成并发重叠。测试应验证请求失败、成功、超时、取消和组件卸载：</p>
<ul>
<li>成功后不再安排下一次计时器；</li>
<li>达到最大次数后拒绝或进入错误状态；</li>
<li><code>AbortSignal</code> 取消正在等待的请求；</li>
<li>卸载后没有遗留定时器和状态更新；</li>
<li>重试间隔不会因错误路径被重复叠加。</li>
</ul>
<p>更容易测试的实现通常是“请求完成后再安排下一次 <code>setTimeout</code>”，而不是固定间隔 <code>setInterval</code>。定时器测试还要检查参数，避免只断言最终文本而漏掉实际等待时间错误。</p>
<h2>Fake Timers 的边界</h2>
<p>Fake Timers 通常会替换 <code>Date</code>、<code>setTimeout</code>、<code>setInterval</code>、<code>requestAnimationFrame</code> 等部分时间 API，但具体覆盖范围取决于框架和配置。<code>performance.now()</code>、<code>queueMicrotask</code>、原生网络、Worker 和浏览器渲染未必被同样控制。代码如果混用多个时钟源，测试中的“经过了 5 秒”可能与业务判断不一致。</p>
<p>不要在同一个测试文件里把 Fake Timers 留到下一个测试。每个测试结束后恢复真实时钟、清除 mock 和未完成的请求；否则后续测试可能在假的系统时间下运行，出现顺序相关的随机失败。</p>
<h2>什么时候应使用真实时间</h2>
<p>Fake Timers 适合验证退避公式、最大次数和状态转换，能让测试快速、稳定。真实时间测试适合验证浏览器集成、实际网络超时、页面可见性、后台限频和动画呈现，但应缩小范围并设置合理上限。端到端测试不应等待很长的真实退避，可以在测试环境注入更短的策略或使用可控的服务端时钟。</p>
<h2>常见误区</h2>
<ul>
<li>推进计时器后马上断言 Promise 结果：微任务可能还没执行。</li>
<li>只测试成功路径：失败、取消和卸载最容易留下泄漏。</li>
<li>用 <code>runAllTimers</code> 测无限轮询：测试会死循环或掩盖缺少停止条件。</li>
<li>不恢复真实时钟：后续测试会受到隐藏状态影响。</li>
<li>把 Fake Timers 通过当作真实浏览器定时精度保证：后台标签页和系统调度仍可能改变实际行为。</li>
</ul>
<p>测试目标应是验证业务状态和停止条件，而不是验证测试框架的时钟实现。把重试策略、计时器和网络任务拆成可注入的边界，再用少量真实浏览器测试补足调度、可见性和取消行为，通常比单纯增加等待时间更可靠。</p>
<h2>参考资料</h2>
<ul>
<li><a href="https://vitest.dev/guide/mocking/timers">Vitest · Mocking Timers</a></li>
<li><a href="https://developer.mozilla.org/en-US/docs/Web/API/HTML_DOM_API/Microtask_guide">MDN · Microtask guide</a></li>
<li><a href="https://developer.mozilla.org/en-US/docs/Web/API/Window/setTimeout">MDN · setTimeout</a></li>
<li><a href="https://html.spec.whatwg.org/multipage/timers-and-user-prompts.html#timers">WHATWG · Timers</a></li>
</ul>`};export{e as default};