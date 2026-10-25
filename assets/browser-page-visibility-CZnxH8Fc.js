var e={answerHtml:`<p>用户把标签页切到后台时，页面可能仍然存在，脚本和请求也可能继续运行。如果仪表盘还在频繁刷新图表、轮播图继续翻页，就会花费资源做用户暂时看不到的工作。Page Visibility API 让应用知道文档何时可见或隐藏，从而主动调整这些行为。</p>
<p>读取 <code>document.visibilityState</code> 可以获得当前状态，常用的值是 <code>visible</code> 与 <code>hidden</code>；<code>document.hidden</code> 则提供布尔形式。状态变化时，浏览器在 <code>document</code> 上触发 <code>visibilitychange</code>，监听器里再读取当前状态。</p>
<h3>“不可见”和“没有焦点”不是同一件事</h3>
<p>切换到其他标签页、最小化浏览器等操作通常会让文档进入隐藏状态。但窗口失去焦点时，页面仍可能显示在屏幕上，例如用户在旁边的记事本里输入内容。因此 <code>window.blur</code> 不能替代 <code>visibilitychange</code>。</p>
<p>文档可见也不等于用户正在看某个组件：图表可能在滚动区域下面，弹窗也可能盖住它。需要知道元素是否进入视口，应考虑 Intersection Observer；即便元素进入视口，也不能据此证明人真的注意到了它。</p>
<p>对 iframe，文档可见性通常随父文档变化；仅用 CSS 把 iframe 设为 <code>display: none</code>，不会因此触发该 iframe 文档的可见性事件。嵌入组件不能把这个 API 当成所有隐藏方式的统一通知。</p>
<h3>暂停显示时钟，恢复时直接显示真实时间</h3>
<p>下面的函数用于已经存在的 <code>&lt;time id=&quot;clock&quot;&gt;&lt;/time&gt;</code>。隐藏时取消定时刷新，恢复时立即读取当前时间，然后继续定期更新。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">startVisibleClock</span>(<span class="hljs-params">element</span>) {
  <span class="hljs-keyword">const</span> formatter = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">DateTimeFormat</span>(<span class="hljs-string">&#x27;zh-CN&#x27;</span>, {
    <span class="hljs-attr">hour</span>: <span class="hljs-string">&#x27;2-digit&#x27;</span>,
    <span class="hljs-attr">minute</span>: <span class="hljs-string">&#x27;2-digit&#x27;</span>,
    <span class="hljs-attr">second</span>: <span class="hljs-string">&#x27;2-digit&#x27;</span>,
    <span class="hljs-attr">hour12</span>: <span class="hljs-literal">false</span>,
  });
  <span class="hljs-keyword">let</span> timer;

  <span class="hljs-keyword">function</span> <span class="hljs-title function_">render</span>(<span class="hljs-params"></span>) {
    <span class="hljs-keyword">const</span> now = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Date</span>();
    element.<span class="hljs-property">dateTime</span> = now.<span class="hljs-title function_">toISOString</span>();
    element.<span class="hljs-property">textContent</span> = formatter.<span class="hljs-title function_">format</span>(now);
  }

  <span class="hljs-keyword">function</span> <span class="hljs-title function_">syncVisibility</span>(<span class="hljs-params"></span>) {
    <span class="hljs-built_in">clearInterval</span>(timer);
    timer = <span class="hljs-literal">undefined</span>;
    <span class="hljs-keyword">if</span> (<span class="hljs-variable language_">document</span>.<span class="hljs-property">visibilityState</span> !== <span class="hljs-string">&#x27;visible&#x27;</span>) <span class="hljs-keyword">return</span>;

    <span class="hljs-title function_">render</span>();
    timer = <span class="hljs-built_in">setInterval</span>(render, <span class="hljs-number">1000</span>);
  }

  <span class="hljs-variable language_">document</span>.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;visibilitychange&#x27;</span>, syncVisibility);
  <span class="hljs-comment">// 组件可能在后台首次创建，注册事件后还要处理当前状态。</span>
  <span class="hljs-title function_">syncVisibility</span>();

  <span class="hljs-keyword">return</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">dispose</span>(<span class="hljs-params"></span>) {
    <span class="hljs-variable language_">document</span>.<span class="hljs-title function_">removeEventListener</span>(<span class="hljs-string">&#x27;visibilitychange&#x27;</span>, syncVisibility);
    <span class="hljs-built_in">clearInterval</span>(timer);
  };
}
</code></pre></div>
<p>在 DOM 就绪后，把实际的 <code>&lt;time&gt;</code> 元素传给函数；组件卸载时调用返回的 <code>dispose</code>。首次执行时就读取状态，是因为事件只通知变化，不会自动补发“你现在已经处于后台”的通知。</p>
<p>这里每次读取 <code>new Date()</code>，而不是简单地给旧时间加一秒。浏览器可能延迟计时器回调，隐藏期间也没有执行更新，但恢复时仍然显示真实时间，不必补跑错过的每个 tick。这个例子用于界面时钟，不承诺整秒精确触发，也不适合承担权威计费计时。</p>
<h3>请求、媒体和动画需要分别决定策略</h3>
<p>后台暂停轮询时，要区分“取消下次定时器”和“取消已经发出的请求”。清除计时器不会停止在途请求；若需要取消，还要传递 <code>AbortSignal</code>，并防止已过期结果在恢复后覆盖新数据。恢复时通常主动刷新一次，再恢复轮询，不要立即补发后台错过的几十次请求。</p>
<p>媒体也不能简单写成“隐藏就暂停，显示就播放”。后台听音乐可能正是用户需要的功能；如果暂停的是视频，还要记录是否由此次隐藏操作暂停，避免返回页面时把用户主动暂停的视频也重新播放。调用 <code>play()</code> 还可能受自动播放策略限制，需要处理返回 Promise 的拒绝。</p>
<p>浏览器通常也会自行节流后台计时器、暂停后台 <code>requestAnimationFrame</code>，但这与应用决定“哪些业务工作值得继续”是两层事情。可见性事件不会自动关闭 WebSocket、停止服务端任务或取消已有的网络请求。</p>
<h3>隐藏时保存有价值，但不能等到最后一刻</h3>
<p>进入 <code>hidden</code> 常常是移动端应用还来得及观察到的重要时机，可以用来尽早保存小规模的草稿状态、上报一段会话统计。不过用户切换标签页也会进入 <code>hidden</code>，所以它不是“用户关闭网站”的确定信号。</p>
<p>进程可能被操作系统直接终止，不能保证总有事件、也不能保证事件处理器中的异步写入全部完成。重要草稿应在编辑过程中持续或适度防抖保存，恢复时从持久化状态重新加载。统计上报可以按需求考虑 <code>sendBeacon</code>，但成功入队不等于服务端已经收到，更不能把它当成关键业务提交的事务保障。</p>
<p>对于前进后退缓存恢复，还要结合 <code>pageshow</code> 等事件检查状态是否过期。页面重新显示后，不要只恢复动画，还应按业务需求确认数据、登录状态与连接是否仍然有效。</p>`};export{e as default};