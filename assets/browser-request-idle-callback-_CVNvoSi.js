var e={answerHtml:`<p>页面首屏已经可用，但还想在不影响用户输入的情况下准备低频搜索索引、预热非关键组件或发送一次诊断摘要。把工作直接放进 setTimeout 只能推迟时间点，不能表达“浏览器现在有空”。requestIdleCallback 允许浏览器在预计空闲时调用任务，但它是机会调度，不是执行保证。</p>
<h2>deadline 表示这次机会还有多少时间</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">scheduleIdle</span>(<span class="hljs-params">work, timeout = <span class="hljs-number">2000</span></span>) {
  <span class="hljs-keyword">if</span> (<span class="hljs-keyword">typeof</span> <span class="hljs-variable language_">window</span>.<span class="hljs-property">requestIdleCallback</span> !== <span class="hljs-string">&#x27;function&#x27;</span>) {
    <span class="hljs-keyword">const</span> timer = <span class="hljs-variable language_">window</span>.<span class="hljs-built_in">setTimeout</span>(<span class="hljs-function">() =&gt;</span> <span class="hljs-title function_">work</span>({ <span class="hljs-attr">timeRemaining</span>: <span class="hljs-function">() =&gt;</span> <span class="hljs-number">0</span>, <span class="hljs-attr">didTimeout</span>: <span class="hljs-literal">true</span> }), <span class="hljs-number">0</span>);
    <span class="hljs-keyword">return</span> <span class="hljs-function">() =&gt;</span> <span class="hljs-variable language_">window</span>.<span class="hljs-built_in">clearTimeout</span>(timer);
  }

  <span class="hljs-keyword">const</span> id = <span class="hljs-variable language_">window</span>.<span class="hljs-title function_">requestIdleCallback</span>(work, { timeout });
  <span class="hljs-keyword">return</span> <span class="hljs-function">() =&gt;</span> <span class="hljs-variable language_">window</span>.<span class="hljs-title function_">cancelIdleCallback</span>(id);
}

<span class="hljs-keyword">const</span> cancel = <span class="hljs-title function_">scheduleIdle</span>(<span class="hljs-function">(<span class="hljs-params">deadline</span>) =&gt;</span> {
  <span class="hljs-keyword">while</span> (deadline.<span class="hljs-title function_">timeRemaining</span>() &gt; <span class="hljs-number">2</span> &amp;&amp; <span class="hljs-title function_">hasMoreIndexWork</span>()) {
    <span class="hljs-title function_">buildNextIndexChunk</span>();
  }
  <span class="hljs-keyword">if</span> (<span class="hljs-title function_">hasMoreIndexWork</span>()) <span class="hljs-title function_">scheduleIdle</span>(<span class="hljs-function">() =&gt;</span> <span class="hljs-title function_">buildNextIndexChunk</span>());
});
</code></pre></div>
<p>这里的 hasMoreIndexWork 和分块函数是业务实现；示例只表达调度边界。<code>timeRemaining()</code> 是本次回调剩余时间的估算，不能当作精确计时器。didTimeout 为 true 表示 timeout 到期触发，应该处理少量必要工作或再次分块，不能因此在一个回调里突然执行完整大任务。</p>
<p>代码中的降级 setTimeout 也没有空闲保证，只是让不支持 API 的浏览器保留功能。取消函数只取消尚未开始的回调；已经进入执行的函数不能被 cancelIdleCallback 中断，工作函数自己要按块返回。</p>
<h2>timeout 是最长等待提示，不是硬实时保证</h2>
<p>不设置 timeout 时，持续动画、滚动或不断到达的用户任务可能让低优先级回调延迟很久。设置 timeout 允许浏览器在等待过久后安排它，但 callback 仍会占用主线程，且 timeout 到期不代表可以忽略输入响应。高优先级用户操作、支付提交和数据保存不适合依赖空闲回调。</p>
<p>requestIdleCallback 运行在主线程。它不能替代 Worker，也不会让 CPU 密集计算脱离页面脚本；大任务应切块、交给 Worker 或采用服务端处理。一个 idle 回调中排队大量微任务也可能阻塞后续渲染，不能只看外层函数名字。</p>
<h2>页面隐藏、后台和资源竞争</h2>
<p>浏览器可能对后台页面限频或延迟定时器，空闲回调也不应作为页面关闭前最后一次保存的唯一机会。关键草稿要在编辑时持续持久化，统计可考虑 visibilitychange 与 Beacon，但两者都不等于服务器已确认。图片解码、第三方脚本、GC 和扩展也会改变空闲窗口。</p>
<p>如果任务与当前页面交互无关，可以在页面重新可见、用户主动触发或下一次启动时继续。任务要有版本、幂等标识和进度，避免回调被多次安排后重复建立索引或发送事件。</p>
<h2>实际选型与测试</h2>
<p>空闲调度适合非关键、可暂停、可重复的主线程小任务；setTimeout 适合明确的延迟；scheduler.postTask（若目标浏览器支持）可以表达优先级，但仍需核对版本；Worker 适合独立 CPU 计算。不要因为某个调度 API 看起来“更现代”就跳过性能录制。</p>
<p>测试应使用 fake timers 之外的真实浏览器录制，因为空闲机会依赖渲染、输入、设备和后台策略。至少验证持续动画、连续输入、timeout 触发、取消、页面隐藏和 API 不支持的降级。任务结果还要验证没有覆盖用户最新状态。</p>
<h2>补充参考</h2>
<ul>
<li><a href="https://developer.mozilla.org/en-US/docs/Web/API/Window/requestIdleCallback">MDN · requestIdleCallback</a></li>
<li><a href="https://developer.mozilla.org/en-US/docs/Web/API/PerformanceLongAnimationFrameTiming">MDN · PerformanceLongAnimationFrameTiming</a></li>
<li><a href="https://wicg.github.io/scheduling-apis/">WICG · Scheduling APIs</a></li>
</ul>`};export{e as default};