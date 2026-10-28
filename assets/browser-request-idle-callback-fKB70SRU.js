var e={answerHtml:`<h2>简答</h2>
<ul>
<li>requestIdleCallback 在浏览器空闲时执行低优先级工作，比如延迟统计和非关键初始化。</li>
<li>deadline.timeRemaining() 表示本次空闲还剩多少时间，任务应分块执行并递归调度剩余部分。</li>
<li>timeout 只是最长等待提示，不是硬实时保证；页面隐藏或繁忙时回调可能迟迟不执行。</li>
<li>不支持时要有降级方案；重计算应交给 Worker，而不是空闲回调。</li>
</ul>
<p>页面首屏已经可用，但还想在不影响用户输入的情况下准备低频搜索索引、预热非关键组件或发送一次诊断摘要。把工作直接放进 setTimeout 只能推迟时间点，不能表达“浏览器现在有空”。requestIdleCallback 允许浏览器在预计空闲时调用任务，但它是机会调度，不是执行保证。</p>
<h2>deadline 表示这次机会还有多少时间</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">runInIdle</span>(<span class="hljs-params">hasMore, runChunk, timeout = <span class="hljs-number">2000</span></span>) {
  <span class="hljs-keyword">let</span> <span class="hljs-title function_">cancelCurrent</span> = (<span class="hljs-params"></span>) =&gt; {};
  <span class="hljs-keyword">let</span> cancelled = <span class="hljs-literal">false</span>;

  <span class="hljs-keyword">function</span> <span class="hljs-title function_">schedule</span>(<span class="hljs-params"></span>) {
    <span class="hljs-keyword">if</span> (<span class="hljs-keyword">typeof</span> <span class="hljs-variable language_">window</span>.<span class="hljs-property">requestIdleCallback</span> === <span class="hljs-string">&#x27;function&#x27;</span>) {
      <span class="hljs-keyword">const</span> id = <span class="hljs-variable language_">window</span>.<span class="hljs-title function_">requestIdleCallback</span>(step, { timeout });
      cancelCurrent = <span class="hljs-function">() =&gt;</span> <span class="hljs-variable language_">window</span>.<span class="hljs-title function_">cancelIdleCallback</span>(id);
    } <span class="hljs-keyword">else</span> {
      <span class="hljs-comment">// 降级时给一个固定的小预算，避免循环一次都不执行</span>
      <span class="hljs-keyword">const</span> timer = <span class="hljs-variable language_">window</span>.<span class="hljs-built_in">setTimeout</span>(<span class="hljs-function">() =&gt;</span> {
        <span class="hljs-keyword">const</span> start = performance.<span class="hljs-title function_">now</span>();
        <span class="hljs-title function_">step</span>({ <span class="hljs-attr">didTimeout</span>: <span class="hljs-literal">false</span>, <span class="hljs-attr">timeRemaining</span>: <span class="hljs-function">() =&gt;</span> <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">max</span>(<span class="hljs-number">0</span>, <span class="hljs-number">8</span> - (performance.<span class="hljs-title function_">now</span>() - start)) });
      }, <span class="hljs-number">0</span>);
      cancelCurrent = <span class="hljs-function">() =&gt;</span> <span class="hljs-variable language_">window</span>.<span class="hljs-built_in">clearTimeout</span>(timer);
    }
  }

  <span class="hljs-keyword">function</span> <span class="hljs-title function_">step</span>(<span class="hljs-params">deadline</span>) {
    <span class="hljs-keyword">if</span> (cancelled) <span class="hljs-keyword">return</span>;
    <span class="hljs-comment">// 超时触发时至少推进一块，保证任务最终能完成</span>
    <span class="hljs-keyword">if</span> (deadline.<span class="hljs-property">didTimeout</span> &amp;&amp; <span class="hljs-title function_">hasMore</span>()) <span class="hljs-title function_">runChunk</span>();
    <span class="hljs-keyword">while</span> (deadline.<span class="hljs-title function_">timeRemaining</span>() &gt; <span class="hljs-number">2</span> &amp;&amp; <span class="hljs-title function_">hasMore</span>()) <span class="hljs-title function_">runChunk</span>();
    <span class="hljs-keyword">if</span> (<span class="hljs-title function_">hasMore</span>()) <span class="hljs-title function_">schedule</span>();
  }

  <span class="hljs-title function_">schedule</span>();
  <span class="hljs-keyword">return</span> <span class="hljs-function">() =&gt;</span> {
    cancelled = <span class="hljs-literal">true</span>;
    <span class="hljs-title function_">cancelCurrent</span>();
  };
}

<span class="hljs-keyword">const</span> cancel = <span class="hljs-title function_">runInIdle</span>(hasMoreIndexWork, buildNextIndexChunk);
</code></pre></div>
<p>这里的 hasMoreIndexWork 和分块函数是业务实现；示例只表达调度边界。剩余工作由 step 递归调度自身，返回的 cancel 对后续每一轮都有效。<code>timeRemaining()</code> 是本次回调剩余时间的估算，不能当作精确计时器。didTimeout 为 true 表示 timeout 到期触发，应只处理少量必要工作再继续分块，不能在一个回调里执行完整大任务。</p>
<p>代码中的降级 setTimeout 没有空闲保证，只是让不支持 API 的浏览器（如部分 Safari 版本）保留功能。取消只阻止尚未开始的回调；已经进入执行的块不能被中断，工作函数自己要按块返回。</p>
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