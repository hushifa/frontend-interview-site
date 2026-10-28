var e={answerHtml:`<h2>简答</h2>
<ul>
<li>浏览器在一帧的工作完成、还有空余时间时调用回调，<code>deadline.timeRemaining()</code> 返回本次可用的毫秒数，最多 50ms。</li>
<li>适合预取、上报统计、预计算等不影响当前交互的工作。</li>
<li>主线程一直繁忙时回调可能一直不执行；传入 <code>timeout</code> 后，超时会强制执行，此时 <code>deadline.didTimeout</code> 为 <code>true</code>。</li>
<li>MDN 标为 Limited availability，Safari 不支持，需要降级。</li>
<li>回调里不要修改 DOM，布局变化会在空闲期之后造成额外的工作；DOM 修改放进 <code>requestAnimationFrame</code>。</li>
</ul>
<h2>分块处理队列</h2>
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
<ul>
<li>用 <code>do...while</code> 保证每次回调至少处理一个任务，即使是超时触发，队列也会向前推进。</li>
<li>剩余任务通过 <code>step</code> 递归调度，直到队列清空。</li>
<li>返回的取消函数会停止之后所有轮次。</li>
<li>降级分支用 <code>setTimeout</code> 并给一个 8ms 的预算，每次至少推进一块后让出主线程。</li>
</ul>
<h2>为什么不能依赖它</h2>
<ul>
<li>页面在后台、用户持续滚动或动画占满每一帧时，空闲期可能很少甚至没有。</li>
<li>用户关闭页面时，没执行的回调直接丢失。必须完成的上报应在 <code>visibilitychange</code> 变为 hidden 时用 <code>sendBeacon</code> 或 <code>fetch(..., { keepalive: true })</code> 发送。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li>和 <code>scheduler.postTask(fn, { priority: &#x27;background&#x27; })</code> 的区别：后者能设置优先级、用 <code>AbortSignal</code> 取消，但同样不是所有浏览器都支持，见<a href="/questions/browser-scheduler-post-task/">《scheduler.postTask 怎样表达前端任务优先级？》</a>。</li>
<li>React 为什么不用它做调度：触发频率不稳定，React 用 <code>MessageChannel</code> 实现了自己的调度器。</li>
</ul>`};export{e as default};