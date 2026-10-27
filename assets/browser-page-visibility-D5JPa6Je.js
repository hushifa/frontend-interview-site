var e={answerHtml:`<h2>后台页面仍可能在消耗资源</h2>
<p>用户切到另一个标签页时，当前页面可能仍保留定时器、轮询、动画和图表刷新。浏览器会对后台任务节流，但不会自动理解哪些工作对业务已经没有价值。Page Visibility API 让应用知道文档进入 <code>visible</code> 或 <code>hidden</code>，从而主动调整非必要工作。</p>
<p>它描述的是整个文档的可见状态，不是某个元素是否在视口中，也不是用户是否真的在看。元素曝光要考虑 IntersectionObserver；窗口失焦也不能直接当作页面隐藏，因为页面可能仍显示在屏幕上。</p>
<h2>监听变化时立即同步当前状态</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">startVisibleClock</span>(<span class="hljs-params">element</span>) {
  <span class="hljs-keyword">let</span> timer;

  <span class="hljs-keyword">const</span> <span class="hljs-title function_">render</span> = (<span class="hljs-params"></span>) =&gt; {
    <span class="hljs-keyword">const</span> now = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Date</span>();
    element.<span class="hljs-property">dateTime</span> = now.<span class="hljs-title function_">toISOString</span>();
    element.<span class="hljs-property">textContent</span> = now.<span class="hljs-title function_">toLocaleTimeString</span>(<span class="hljs-string">&#x27;zh-CN&#x27;</span>, { <span class="hljs-attr">hour12</span>: <span class="hljs-literal">false</span> });
  };

  <span class="hljs-keyword">const</span> <span class="hljs-title function_">sync</span> = (<span class="hljs-params"></span>) =&gt; {
    <span class="hljs-built_in">clearInterval</span>(timer);
    timer = <span class="hljs-literal">undefined</span>;
    <span class="hljs-keyword">if</span> (<span class="hljs-variable language_">document</span>.<span class="hljs-property">visibilityState</span> !== <span class="hljs-string">&#x27;visible&#x27;</span>) <span class="hljs-keyword">return</span>;

    <span class="hljs-title function_">render</span>();
    timer = <span class="hljs-built_in">setInterval</span>(render, <span class="hljs-number">1000</span>);
  };

  <span class="hljs-variable language_">document</span>.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;visibilitychange&#x27;</span>, sync);
  <span class="hljs-title function_">sync</span>();
  <span class="hljs-keyword">return</span> <span class="hljs-function">() =&gt;</span> {
    <span class="hljs-variable language_">document</span>.<span class="hljs-title function_">removeEventListener</span>(<span class="hljs-string">&#x27;visibilitychange&#x27;</span>, sync);
    <span class="hljs-built_in">clearInterval</span>(timer);
  };
}
</code></pre></div>
<p>注册监听后要主动调用一次 <code>sync</code>，因为事件只在状态变化时触发，页面首次创建时可能已经处于后台。恢复时直接读取真实时间，而不是补跑隐藏期间错过的每个计时器回调；浏览器会延迟后台计时器，计时器本身也不适合做权威计费时钟。</p>
<h2>暂停什么要按业务决定</h2>
<p>后台轮询通常可以暂停，恢复时刷新一次再重新安排下一次请求。清除定时器不会取消已经发出的 fetch；需要停止在途请求时还要传递 AbortSignal，并防止旧响应覆盖恢复后的新数据。</p>
<p>动画和轮播通常可以暂停，但后台播放音乐可能是用户主动需要的功能。视频暂停时要记录“是否由页面隐藏导致”，这样返回时只恢复应用自己暂停的媒体，不会把用户主动暂停的视频重新播放。<code>play()</code> 仍可能因自动播放策略拒绝，必须处理返回 Promise。</p>
<p>可见性事件不会自动关闭 WebSocket、取消服务端任务或停止摄像头。每一种资源都要有自己的生命周期协议。浏览器对后台 <code>requestAnimationFrame</code> 和计时器的节流也不等于业务已经正确暂停。</p>
<h2>隐藏时可以保存，但不能把它当最后机会</h2>
<p>进入 <code>hidden</code> 是移动端可能来得及观察到的节点，可以保存小规模草稿、暂停非关键同步或用 <code>sendBeacon</code> 尽力上报统计。但切换标签页也会触发它，不能把它当成“用户关闭网站”的确定信号。</p>
<p>操作系统可能直接终止进程，事件处理器里的异步写入不一定完成。重要草稿应在编辑过程中持续或防抖保存，恢复时从持久化状态重新加载。关键提交必须由用户明确触发并等待服务端确认，不能依赖页面隐藏事件。</p>
<h2>与页面恢复事件配合</h2>
<p>页面可能从前进后退缓存中恢复，重新可见后不只是恢复动画，还要检查数据、登录状态和连接是否过期。<code>pageshow</code>、网络在线状态和业务版本可以共同决定是否重新请求。</p>
<p>对 iframe，文档可见性通常受父文档影响；父页面用 CSS 把 iframe <code>display:none</code>，不一定会触发 iframe 内部的可见性事件。嵌入组件不能把 Page Visibility 当成所有隐藏方式的统一通知。</p>
<p>测试应覆盖切换标签页、最小化、移动端后台恢复、轮询中断、请求迟到、媒体主动暂停、前进后退缓存和进程被终止后的数据恢复。核心目标是减少无意义工作，同时不丢用户状态和不改变用户原本的播放选择。</p>`};export{e as default};