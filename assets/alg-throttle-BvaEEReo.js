var e={answerHtml:`<p>用户持续拖动或滚动时，页面可能每秒收到很多事件。如果每次都执行同样的昂贵更新，主线程容易忙不过来。节流允许持续活动期间仍有间歇更新，但限制执行频率。</p>
<p>首沿节流的规则可以说得很明确：第一次立即执行，随后进入等待窗口；窗口内的调用丢弃，不重新计时，也不在窗口结束时补发最后一次。</p>
<p>这与尾沿防抖不同：防抖不断把等待推到“最后一次调用之后”，而这里的窗口由已经接受的调用启动。</p>
<h2>同一轮连续输入，不同策略会保留不同调用</h2>
<p>假设等待时间为 100ms，短时间内依次收到 A、B、C，此后停止：</p>
<table><thead><tr><th>策略</th><th>这轮调用的典型结果</th></tr></thead><tbody><tr><td>本题的首沿节流</td><td>立即执行 A，B 和 C 被丢弃</td></tr><tr><td>以首个调用开启窗口的尾沿节流</td><td>先等待，在窗口尾部执行保存的最新调用 C</td></tr><tr><td>支持首尾两端的节流</td><td>可先执行 A，必要时在尾部再处理 C，具体间隔规则要明确</td></tr><tr><td>尾沿防抖</td><td>等最后一次 C 之后安静满等待时间，再执行 C</td></tr></tbody></table>
<p>不同库对首尾组合、单次调用是否补发、下一窗口从哪里计算可能有不同约定。面试或设计接口时，先说清规则，比只写一个名叫 throttle 的函数更重要。</p>
<h2>首沿实现需要两份状态</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">throttle</span>(<span class="hljs-params">fn, wait</span>) {
  <span class="hljs-keyword">if</span> (<span class="hljs-keyword">typeof</span> fn !== <span class="hljs-string">&#x27;function&#x27;</span>) <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">TypeError</span>(<span class="hljs-string">&#x27;需要传入函数&#x27;</span>);
  <span class="hljs-keyword">if</span> (!<span class="hljs-title class_">Number</span>.<span class="hljs-title function_">isInteger</span>(wait) || wait &lt; <span class="hljs-number">0</span> || wait &gt; <span class="hljs-number">2_147_483_647</span>) {
    <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">RangeError</span>(<span class="hljs-string">&#x27;等待时间必须是计时器范围内的非负整数毫秒&#x27;</span>);
  }

  <span class="hljs-keyword">let</span> blocked = <span class="hljs-literal">false</span>;
  <span class="hljs-keyword">let</span> timer;

  <span class="hljs-keyword">function</span> <span class="hljs-title function_">wrapped</span>(<span class="hljs-params">...args</span>) {
    <span class="hljs-keyword">if</span> (blocked) <span class="hljs-keyword">return</span>;

    blocked = <span class="hljs-literal">true</span>;
    timer = <span class="hljs-built_in">setTimeout</span>(<span class="hljs-function">() =&gt;</span> {
      blocked = <span class="hljs-literal">false</span>;
      timer = <span class="hljs-literal">undefined</span>;
    }, wait);

    <span class="hljs-keyword">return</span> fn.<span class="hljs-title function_">apply</span>(<span class="hljs-variable language_">this</span>, args);
  }

  wrapped.<span class="hljs-property">cancel</span> = <span class="hljs-function">() =&gt;</span> {
    <span class="hljs-built_in">clearTimeout</span>(timer);
    blocked = <span class="hljs-literal">false</span>;
    timer = <span class="hljs-literal">undefined</span>;
  };

  <span class="hljs-keyword">return</span> wrapped;
}
</code></pre></div>
<p>blocked 表示当前窗口是否还在限制调用，timer 用于之后解除限制。窗口中来的新调用直接返回，不会重置 timer，也没有保存它的参数。</p>
<p>例如在 0ms 调用 A、20ms 调用 B、60ms 调用 C，等待为 100ms。正常调度下只执行 A；计时器解除限制后，如果 150ms 又调用 D，就立即执行 D。窗口结束时没有新调用，不会凭空再执行一次 A 或 C。</p>
<p>这里的毫秒数字说明逻辑，不是精确计时承诺。主线程忙或页面在后台时，解除限制的计时器可能延后，因此实际执行频率还可能低于期望值。</p>
<h2>为什么先设置 blocked，再调用 fn</h2>
<p>如果 fn 内部同步调用了 wrapped，而 blocked 尚未设好，就可能重复进入甚至无限递归。先标记窗口并建立解除计时器，可以让重入调用也受到同一规则约束。</p>
<p>这也明确了同步异常的语义：fn 抛错会直接传播给本次调用者，但已经建立的限制窗口仍然存在。下一次调用是否允许执行，仍取决于窗口是否解除或调用者是否主动 cancel，不会因为业务函数失败就自动改变节流策略。</p>
<p>原函数通过 apply 接收本次执行时的 this 和参数。被丢弃调用的参数不会覆盖当前任务，更不会在之后变成尾沿任务。</p>
<h2>返回值和 cancel 的含义要写清楚</h2>
<p>真正执行 fn 的那次调用会返回它的结果；窗口内被忽略的调用返回 undefined。如果 fn 返回 Promise，也只是那次实际执行对应的 Promise，不是所有后续调用共享的 Promise。</p>
<p>cancel 在这个版本中取消的是限制窗口的计时器，并立即恢复可执行状态。它不是在取消某个排队的业务回调，因为本实现没有排队的尾沿调用。cancel 后马上再调用，会立即执行，哪怕距离上一次还没经过 wait。</p>
<p>如果 fn 已经发起网络请求，cancel 不会停止请求；如果 fn 正在同步执行，也不会在中途被打断。</p>
<p>wait 为 0 仍然使用一个后续计时器任务解除 blocked，所以同一同步代码段里连续调用多次，并不等于每次都执行。若业务需要完全不节流，应该直接调用原函数，而不是依赖 0 具有另一套未说明的语义。</p>
<h2>尾沿节流为什么不能简单照抄防抖</h2>
<p>尾沿节流通常在第一轮调用时安排一个窗口结束任务，之后的调用只更新要处理的最新参数与 this，不不断把结束时间往后推。这样持续输入时仍能定期执行。</p>
<p>如果每次新调用都清理定时器、重新等待完整 wait，就变成了尾沿防抖。持续滚动时可能一直没有更新，而不是按固定节奏更新。</p>
<p>需要首沿和尾沿一起支持时，还要避免只有一次输入却无意义执行两遍，并规定尾沿执行之后的下一次首沿何时允许。生产项目可以使用成熟库并核对其选项，不能仅凭“支持 leading/trailing”猜所有边界一致。</p>
<h2>限制频率不等于限制并发</h2>
<p>如果每 100ms 允许启动一次请求，但一个请求需要 800ms 才完成，多次请求仍可能同时在途。节流没有等待前一个 Promise 结束，因此它不是互斥锁，也不是并发池。</p>
<p>按钮防重复提交、写入去重或请求并发控制，应有对应的进行中状态、幂等键或任务调度方案。不能只加 throttle，就宣称业务不会重复执行。</p>
<p>滚动场景中，即使减少了回调次数，单次回调也仍可能强制布局或做大量 DOM 操作。需要与画面更新协调时可以考虑 rAF，但它与固定毫秒节流不是同一语义，后台行为也不同。</p>
<p>选择首沿还是尾沿，应看能否丢掉最终状态。统计滚动过程中的粗略进度可以接受部分中间值；如果必须展示用户停止时的精确位置，只有首沿的版本可能一直停留在稍早状态，需要尾沿或结束事件补齐。</p>`};export{e as default};