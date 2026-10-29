var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>有些工作不急，比如预取下一页、上报统计、提前算好一些数据。<code>requestIdleCallback</code> 就是让浏览器在一帧的工作做完、还有空余时间时，再调用你的回调。回调里用 <code>deadline.timeRemaining()</code> 能知道这次还剩多少毫秒，最多 50 毫秒。</p>
<p>可是“空闲”不是一定会有的。主线程一直很忙时，回调可能一直不执行。传了 <code>timeout</code> 的话，超时后会强制执行，这时 <code>deadline.didTimeout</code> 是 <code>true</code>。</p>
<p>兼容性上，MDN 标为 Limited availability，Safari 不支持，需要降级。</p>
<p>还有一点，回调里不要改 DOM，否则布局变化会在空闲期之后带来额外工作。要改 DOM，放进 <code>requestAnimationFrame</code>。</p>
</blockquote>
<h2>先看一个分块处理队列的例子</h2>
<p>下面把一组任务交给空闲时间去跑，每次空闲能跑多少跑多少：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">runWhenIdle</span>(<span class="hljs-params">tasks, { timeout = <span class="hljs-number">2000</span> } = {}</span>) {
  <span class="hljs-keyword">let</span> handle;
  <span class="hljs-keyword">let</span> cancelled = <span class="hljs-literal">false</span>;

  <span class="hljs-keyword">const</span> <span class="hljs-title function_">schedule</span> = (<span class="hljs-params">callback</span>) =&gt;
    <span class="hljs-string">&#x27;requestIdleCallback&#x27;</span> <span class="hljs-keyword">in</span> <span class="hljs-variable language_">window</span>
      ? <span class="hljs-title function_">requestIdleCallback</span>(callback, { timeout })
      : <span class="hljs-built_in">setTimeout</span>(<span class="hljs-function">() =&gt;</span> {
          <span class="hljs-keyword">const</span> end = performance.<span class="hljs-title function_">now</span>() + <span class="hljs-number">8</span>;
          <span class="hljs-title function_">callback</span>({ <span class="hljs-attr">didTimeout</span>: <span class="hljs-literal">false</span>, <span class="hljs-attr">timeRemaining</span>: <span class="hljs-function">() =&gt;</span> <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">max</span>(<span class="hljs-number">0</span>, end - performance.<span class="hljs-title function_">now</span>()) });
        }, <span class="hljs-number">1</span>);

  <span class="hljs-keyword">const</span> <span class="hljs-title function_">step</span> = (<span class="hljs-params">deadline</span>) =&gt; {
    <span class="hljs-keyword">if</span> (cancelled) <span class="hljs-keyword">return</span>;
    <span class="hljs-keyword">do</span> {
      tasks.<span class="hljs-title function_">shift</span>()?.();
    } <span class="hljs-keyword">while</span> (tasks.<span class="hljs-property">length</span> &gt; <span class="hljs-number">0</span> &amp;&amp; deadline.<span class="hljs-title function_">timeRemaining</span>() &gt; <span class="hljs-number">1</span> &amp;&amp; !deadline.<span class="hljs-property">didTimeout</span>);

    <span class="hljs-keyword">if</span> (tasks.<span class="hljs-property">length</span> &gt; <span class="hljs-number">0</span>) handle = <span class="hljs-title function_">schedule</span>(step);
  };

  handle = <span class="hljs-title function_">schedule</span>(step);
  <span class="hljs-keyword">return</span> <span class="hljs-function">() =&gt;</span> {
    cancelled = <span class="hljs-literal">true</span>;
    <span class="hljs-keyword">if</span> (<span class="hljs-string">&#x27;cancelIdleCallback&#x27;</span> <span class="hljs-keyword">in</span> <span class="hljs-variable language_">window</span>) <span class="hljs-title function_">cancelIdleCallback</span>(handle);
    <span class="hljs-keyword">else</span> <span class="hljs-built_in">clearTimeout</span>(handle);
  };
}
</code></pre></div>
<p><code>step</code> 每次被调用时，只要还有剩余时间就一直取任务来跑。时间用完了还没跑完，就再调度下一轮，直到队列清空。</p>
<p>为什么用 <code>do...while</code>，不用普通的 <code>while</code>？如果是超时强制触发的，<code>didTimeout</code> 是 <code>true</code>，普通 <code>while</code> 一个任务都不会跑，队列就永远不动了。<code>do...while</code> 保证每次至少处理一个，队列一定会往前走。</p>
<p>不支持的浏览器走 <code>setTimeout</code> 分支，模拟出一个 8 毫秒的预算，每次至少推进一块就让出主线程。</p>
<p>返回的取消函数会把 <code>cancelled</code> 设成 <code>true</code>，并取消已经排上的那一轮，之后所有轮次都停下。</p>
<h2>为什么不能指望它一定执行</h2>
<p>页面在后台、用户一直在滚动、或者动画把每一帧都占满了，空闲期可能很少，甚至完全没有。</p>
<p>更要紧的是，用户关闭页面时，还没执行的回调直接就丢了。所以必须完成的上报不能交给它，而应该在 <code>visibilitychange</code> 变成 hidden 时，用 <code>sendBeacon</code> 或者 <code>fetch(..., { keepalive: true })</code> 发出去。</p>
<h2>常见追问</h2>
<p><strong>它和 <code>scheduler.postTask(fn, { priority: &#x27;background&#x27; })</code> 有什么区别？</strong></p>
<blockquote>
<p><code>postTask</code> 能设置优先级，还能用 <code>AbortSignal</code> 取消任务，但它同样不是所有浏览器都支持。详见<a href="/questions/browser-scheduler-post-task/">《scheduler.postTask 怎样表达前端任务优先级？》</a>。</p>
</blockquote>
<p><strong>React 为什么不用 requestIdleCallback 做调度？</strong></p>
<blockquote>
<p>因为它的触发频率不稳定，什么时候有空闲说不准。React 用 <code>MessageChannel</code> 实现了自己的调度器。</p>
</blockquote>`};export{e as default};