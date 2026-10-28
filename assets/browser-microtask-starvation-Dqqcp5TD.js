var e={answerHtml:`<h2>简答</h2>
<ul>
<li>微任务检查点会持续排空队列，执行期间新加入的微任务也会在下一个任务之前执行。</li>
<li>不断追加微任务会让渲染和输入处理一直得不到机会。</li>
<li>await 一个已兑现的 Promise 仍停留在微任务链中，不等于让出主线程。</li>
<li>分片需要通过宏任务或 scheduler.yield 真正跨出微任务链；让出也不保证一定画了一帧。</li>
</ul>
<p>把工作写成异步，并不一定让页面更容易响应。微任务有一个很重要的处理规则：浏览器到达微任务检查点后，会继续执行队列中的微任务，期间新增的微任务也会被处理，直到队列清空。</p>
<p>如果每个微任务都不断排入下一个，浏览器可能一直停留在这轮处理里，后面的输入任务、计时器和正常渲染更新就没有合适机会。这种情况通常叫微任务饥饿。</p>
<h2>后加入的微任务也会赶在下一项任务前执行</h2>
<p>下面只创建三步，便于观察，不会制造无限循环：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> order = [];
<span class="hljs-keyword">let</span> step = <span class="hljs-number">0</span>;

<span class="hljs-built_in">setTimeout</span>(<span class="hljs-function">() =&gt;</span> {
  order.<span class="hljs-title function_">push</span>(<span class="hljs-string">&#x27;定时器&#x27;</span>);
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(order.<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27; → &#x27;</span>));
}, <span class="hljs-number">0</span>);

<span class="hljs-keyword">function</span> <span class="hljs-title function_">nextMicrotask</span>(<span class="hljs-params"></span>) {
  step += <span class="hljs-number">1</span>;
  order.<span class="hljs-title function_">push</span>(<span class="hljs-string">\`微任务<span class="hljs-subst">\${step}</span>\`</span>);
  <span class="hljs-keyword">if</span> (step &lt; <span class="hljs-number">3</span>) <span class="hljs-title function_">queueMicrotask</span>(nextMicrotask);
}

<span class="hljs-title function_">queueMicrotask</span>(nextMicrotask);
order.<span class="hljs-title function_">push</span>(<span class="hljs-string">&#x27;同步代码&#x27;</span>);
</code></pre></div>
<p>输出是：</p>
<div class="not-prose code-block"><div class="code-language">text</div><pre><code class="hljs language-text">同步代码 → 微任务1 → 微任务2 → 微任务3 → 定时器
</code></pre></div>
<p>定时器虽然更早注册，但每个微任务又排入的下一个微任务仍会在这轮检查点里继续执行。若没有停止条件，队列可能一直无法清空。即使最终能清空，十万次微任务加上每次的实际计算，也足以让页面明显卡住。</p>
<p>微任务检查点不只简单存在于“每个宏任务结束”这一处口号中，宿主在适当的脚本执行边界也会处理它们。理解本题最重要的是：一旦进入需要排空队列的检查点，新排入的微任务不会自动推迟到下一帧。</p>
<h2>为什么循环中的 await 不一定有帮助</h2>
<p>对已经兑现的 Promise 使用 await，会把后续执行安排为 Promise 的微任务。例如一个循环每一步都 <code>await Promise.resolve()</code>，只是把下一步不断接在微任务链上，不意味着浏览器可以在每一步之间绘制画面。</p>
<p>如果 await 的是确实尚未完成的网络或计时器工作，等待期间可能给事件循环留下机会。但不能仅凭代码出现 async/await，就认定它一定发生了这种等待。Promise 构造函数中的同步计算同样立即执行，并没有因为外面包着 Promise 就移到后台。</p>
<p>多个小函数、多个 Promise、较短的调用栈，都不等于已经把执行机会交还给浏览器。</p>
<h2>分片需要真正跨出当前微任务链</h2>
<p>对于可拆分、每项处理较短的工作，可以按时间预算处理一批，再通过任务调度让下一批稍后继续。下面用 setTimeout 演示这种分片，传入稳定的数组和同步 transform 函数：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">mapInChunks</span>(<span class="hljs-params">items, transform, { budgetMs = <span class="hljs-number">8</span>, signal } = {}</span>) {
  <span class="hljs-keyword">if</span> (!<span class="hljs-title class_">Number</span>.<span class="hljs-built_in">isFinite</span>(budgetMs) || budgetMs &lt;= <span class="hljs-number">0</span>) {
    <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">RangeError</span>(<span class="hljs-string">&#x27;每批时间预算必须为正数&#x27;</span>);
  }

  <span class="hljs-keyword">const</span> results = [];
  <span class="hljs-keyword">let</span> startedAt = performance.<span class="hljs-title function_">now</span>();

  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">let</span> index = <span class="hljs-number">0</span>; index &lt; items.<span class="hljs-property">length</span>; index += <span class="hljs-number">1</span>) {
    signal?.<span class="hljs-title function_">throwIfAborted</span>();
    results.<span class="hljs-title function_">push</span>(<span class="hljs-title function_">transform</span>(items[index], index));

    <span class="hljs-keyword">if</span> (index + <span class="hljs-number">1</span> &lt; items.<span class="hljs-property">length</span> &amp;&amp; performance.<span class="hljs-title function_">now</span>() - startedAt &gt;= budgetMs) {
      <span class="hljs-keyword">await</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Promise</span>(<span class="hljs-function">(<span class="hljs-params">resolve</span>) =&gt;</span> <span class="hljs-built_in">setTimeout</span>(resolve, <span class="hljs-number">0</span>));
      startedAt = performance.<span class="hljs-title function_">now</span>();
    }
  }

  signal?.<span class="hljs-title function_">throwIfAborted</span>();
  <span class="hljs-keyword">return</span> results;
}
</code></pre></div>
<p>调用者 await 最终数组，并处理异常或取消。运行期间不要修改输入数组的结构，否则遍历语义会随外部变化。transform 应是同步、单次成本可控的转换；这个示例不负责调度一批异步请求，也不自动撤销 transform 已经造成的副作用。</p>
<p>时间预算 8ms 只是示例值，不是所有设备通用的安全帧预算。单次 transform 如果需要 200ms，函数只能在它返回后检查时间，不能中途抢占。此时需要拆分单项算法，或者把适合的计算放入 Worker。</p>
<p>取消信号在处理边界检查；等待定时器期间它不会立即删除那个计时器，但恢复后会停止继续处理并拒绝 Promise。它也不会回滚已经生成的部分结果或已修改的 DOM，因此最好先计算局部结果，再决定何时提交到界面。</p>
<h2>让出任务机会不等于保证画了一帧</h2>
<p><code>setTimeout(..., 0)</code> 的 0 不是立刻执行承诺。嵌套计时器、后台节流、系统负载和浏览器策略都会影响实际延迟。它的作用是把继续执行安排到后续任务机会，而不是让应用精确控制屏幕刷新。</p>
<p>支持时可以使用 <code>scheduler.yield()</code> 等更适合任务协作的能力，但它们仍需特性检测和错误处理。<code>requestAnimationFrame()</code> 适合协调视觉更新，却仍可能因为回调太重拖慢绘制，不能作为任意大计算的自动加速器。</p>
<p>如果计算本身适合独立线程，Worker 能减少对页面主线程的占用，但需要考虑数据传输、结果合并和取消。算法是否做了不必要的工作，也往往比选择哪种排队接口更重要。</p>
<h2>微任务本来适合什么</h2>
<p>微任务适合小而有界的收尾，例如在一组同步修改后合并一次状态通知，让观察者看到较一致的结果。这里的“小”和“有界”很重要：如果通知又触发修改、修改又触发通知，同样可能形成不断延长的链。</p>
<p><code>queueMicrotask()</code> 与 <code>Promise.then()</code> 还存在异常报告差异：前者回调抛错会按普通异常报告，后者回调抛错会使相应 Promise 拒绝，需要处理拒绝。选择哪种写法都不改变它们可能持续占用微任务检查点这一事实。</p>
<p>排查卡顿时，应看 Performance 中主线程实际连续忙了多久、输入与帧更新是否被延后，而不是只统计每个回调自身看起来有多短。很多短微任务串起来，用户感受到的仍然可能是一次长时间无响应。</p>`};export{e as default};