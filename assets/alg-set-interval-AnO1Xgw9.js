var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>比如每 5 秒轮询一次订单状态。可以用 <code>setInterval(poll, 5000)</code>，也可以在 <code>setTimeout</code> 的回调里执行完 <code>poll</code> 再安排下一次 <code>setTimeout</code>，一次接一次，效果也是循环执行。</p>
<p>手写时要注意取消。每一轮都会产生新的定时器 ID，所以要用一个变量保存最新的 ID，取消时清掉它，再加一个标志，防止正在执行的这一轮又安排下一轮。</p>
<p>两者的区别主要体现在异步任务上。<code>setInterval</code> 只管按间隔触发回调，回调里发出的请求还没回来，下一次照样触发，请求就会堆在一起。链式 <code>setTimeout</code> 可以等请求完成以后再安排下一次，所以同一时间只有一个请求，还能根据结果调整间隔或者停止。MDN 也建议，逻辑执行时间可能超过间隔时，用链式 <code>setTimeout</code>。</p>
<p>要注意，两者都不保证准时。主线程忙、页面在后台标签页时，实际间隔都会比设定的长；HTML 规范还规定，定时器嵌套超过 5 层后，小于 4 毫秒的延迟会被提高到 4 毫秒。</p>
</blockquote>
<h2>手写 mySetInterval</h2>
<p>下面的 <code>mySetInterval</code> 返回一个取消函数。示例让回调执行 3 次后取消，延迟写成 10 毫秒只是为了运行得快。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">mySetInterval</span>(<span class="hljs-params">callback, delay</span>) {
  <span class="hljs-keyword">let</span> timer = <span class="hljs-literal">null</span>;
  <span class="hljs-keyword">let</span> stopped = <span class="hljs-literal">false</span>;

  <span class="hljs-keyword">function</span> <span class="hljs-title function_">tick</span>(<span class="hljs-params"></span>) {
    <span class="hljs-title function_">callback</span>();
    <span class="hljs-comment">// 回调里可能已经调用了取消函数，这时不再安排下一轮。</span>
    <span class="hljs-keyword">if</span> (!stopped) timer = <span class="hljs-built_in">setTimeout</span>(tick, delay);
  }

  timer = <span class="hljs-built_in">setTimeout</span>(tick, delay);
  <span class="hljs-keyword">return</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">cancel</span>(<span class="hljs-params"></span>) {
    stopped = <span class="hljs-literal">true</span>;
    <span class="hljs-built_in">clearTimeout</span>(timer);
  };
}

<span class="hljs-keyword">const</span> calls = [];
<span class="hljs-keyword">const</span> cancel = <span class="hljs-title function_">mySetInterval</span>(<span class="hljs-function">() =&gt;</span> {
  calls.<span class="hljs-title function_">push</span>(calls.<span class="hljs-property">length</span> + <span class="hljs-number">1</span>);
  <span class="hljs-keyword">if</span> (calls.<span class="hljs-property">length</span> === <span class="hljs-number">3</span>) <span class="hljs-title function_">cancel</span>();
}, <span class="hljs-number">10</span>);

<span class="hljs-built_in">setTimeout</span>(<span class="hljs-function">() =&gt;</span> {
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(calls.<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;,&#x27;</span>)); <span class="hljs-comment">// 1,2,3</span>
}, <span class="hljs-number">100</span>);
</code></pre></div>
<p>100 毫秒后打印 <code>1,2,3</code>。按 10 毫秒一轮，这段时间足够跑好几轮，结果只有 3 次，说明取消以后没有再执行。</p>
<p>为什么除了 <code>clearTimeout</code> 还要一个 <code>stopped</code> 标志？因为第 3 次是在回调里面调用 <code>cancel()</code> 的。这时 <code>timer</code> 指向的是已经触发的那个定时器，清掉它没有作用；<code>callback()</code> 返回后，<code>tick</code> 还会接着安排下一轮。有了 <code>stopped</code>，<code>tick</code> 就知道已经取消了，不再安排。</p>
<p>为什么不能直接返回定时器 ID？因为每一轮的 ID 都不一样，返回第一个 ID，之后调用 <code>clearTimeout</code> 清掉的只是第一轮，循环还会继续。所以把最新的 ID 放在闭包里，通过返回的函数来取消。</p>
<h2>异步任务为什么更适合链式 setTimeout</h2>
<p>回调是同步代码时，两种写法差别不大。按 HTML 规范的定时器算法，<code>setInterval</code> 也是在回调运行完以后才重新开始计时的。差别出在异步任务上：回调只是发出请求就返回了，对定时器来说这一轮已经结束。</p>
<p>如果回调发出一个请求，请求要 3 秒，用 <code>setInterval(poll, 1000)</code> 会每秒发一个新请求，前面的还没回来，后面的又发出去了。链式 <code>setTimeout</code> 可以在请求完成以后再安排下一次：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">poll</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">try</span> {
    <span class="hljs-keyword">await</span> <span class="hljs-title function_">fetchStatus</span>();
  } <span class="hljs-keyword">finally</span> {
    timer = <span class="hljs-built_in">setTimeout</span>(poll, <span class="hljs-number">1000</span>);
  }
}
</code></pre></div>
<p>这样同一时间只有一个请求，还能根据返回结果决定下一次的间隔，比如失败了就把间隔加长，状态完成了就不再安排。</p>
<h2>为什么定时器不准时</h2>
<p>定时器到期后，回调只是被放进任务队列，要等主线程把当前的同步代码和微任务执行完才会运行，见<a href="/questions/js-event-loop/">《事件循环中，任务和微任务按什么顺序执行？》</a>。所以延迟是“至少等这么久”，不是“正好这么久”。</p>
<p>另外 MDN 写明，为了省电，浏览器会对后台标签页的定时器限制最小间隔。HTML 规范规定，定时器嵌套层数超过 5 层以后，小于 4 毫秒的延迟会被提高到 4 毫秒，这一条对 <code>setTimeout</code> 链和 <code>setInterval</code> 都适用。需要准确计时的场景，比如倒计时，应该每次用 <code>Date.now()</code> 算出剩余时间，而不是靠累加次数。</p>
<h2>常见追问</h2>
<p><strong>组件卸载时忘了清除定时器会怎样？</strong></p>
<blockquote>
<p>回调会继续执行，它通过闭包引用的数据也释放不掉。在 React 里应该在 <code>useEffect</code> 的清理函数中调用 <code>clearInterval</code>，或者调用手写版本返回的取消函数。</p>
</blockquote>
<p><strong><code>setInterval</code> 的回调执行时间超过间隔，会不会叠在一起执行？</strong></p>
<blockquote>
<p>不会同时执行，JavaScript 主线程一次只能跑一个回调，HTML 规范里 <code>setInterval</code> 也是在回调运行完以后才安排下一次。真正会叠起来的是回调里发出的异步请求，因为请求不占主线程，定时器照样按间隔触发，新请求会不停地发出去。</p>
</blockquote>`};export{e as default};