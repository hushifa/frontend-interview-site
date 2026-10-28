var e={answerHtml:`<h2>简答</h2>
<ul>
<li>定时器只保证不早于指定延迟执行：主线程繁忙会推迟回调，嵌套超过 5 层后最小延迟被钳制为 4ms，后台标签页会被节流到至少每秒一次甚至更低频率。</li>
<li>每次回调把计数减一的写法会累积误差；正确做法是记住结束时间点，每次用&quot;结束时间 - 当前时间&quot;重新计算剩余时间。</li>
<li><code>Date.now()</code> 依赖系统时钟，用户改时间会让倒计时跳变；<code>performance.now()</code> 是单调时钟，不受系统时钟调整影响，适合计算经过的时间。</li>
<li>结束时间以服务端为准：通过一次接口往返估算本地与服务端的时间差，切回前台时重新校准；关键判断（如能否下单）仍由服务端在请求时校验。</li>
</ul>
<h2>误差从哪里来</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// 错误写法：每秒减一，误差随时间累积</span>
<span class="hljs-keyword">let</span> left = <span class="hljs-number">60</span>;
<span class="hljs-built_in">setInterval</span>(<span class="hljs-function">() =&gt;</span> {
  left -= <span class="hljs-number">1</span>;
  <span class="hljs-title function_">render</span>(left);
}, <span class="hljs-number">1000</span>);
</code></pre></div>
<p>每次回调都可能比预期晚几毫秒到几百毫秒，长任务或页面卡顿时更多；标签页切到后台后，Chrome 会把定时器限制为每秒检查一次，隐藏超过 5 分钟且满足其他条件时降到每分钟一次。累加计数会把这些延迟全部计入，几分钟后就能看出偏差。</p>
<h2>以目标时间计算</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> <span class="hljs-title function_">formatRemain</span> = (<span class="hljs-params">endAt, now</span>) =&gt; {
  <span class="hljs-keyword">const</span> seconds = <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">ceil</span>(<span class="hljs-title class_">Math</span>.<span class="hljs-title function_">max</span>(<span class="hljs-number">0</span>, endAt - now) / <span class="hljs-number">1000</span>);
  <span class="hljs-keyword">const</span> mm = <span class="hljs-title class_">String</span>(<span class="hljs-title class_">Math</span>.<span class="hljs-title function_">floor</span>(seconds / <span class="hljs-number">60</span>)).<span class="hljs-title function_">padStart</span>(<span class="hljs-number">2</span>, <span class="hljs-string">&#x27;0&#x27;</span>);
  <span class="hljs-keyword">const</span> ss = <span class="hljs-title class_">String</span>(seconds % <span class="hljs-number">60</span>).<span class="hljs-title function_">padStart</span>(<span class="hljs-number">2</span>, <span class="hljs-string">&#x27;0&#x27;</span>);
  <span class="hljs-keyword">return</span> <span class="hljs-string">\`<span class="hljs-subst">\${mm}</span>:<span class="hljs-subst">\${ss}</span>\`</span>;
};

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">formatRemain</span>(<span class="hljs-number">125000</span>, <span class="hljs-number">0</span>)); <span class="hljs-comment">// 02:05</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">formatRemain</span>(<span class="hljs-number">1000</span>, <span class="hljs-number">1500</span>)); <span class="hljs-comment">// 00:00</span>
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">startCountdown</span>(<span class="hljs-params">endAt, now, onTick</span>) {
  <span class="hljs-keyword">let</span> timer;
  <span class="hljs-keyword">const</span> <span class="hljs-title function_">tick</span> = (<span class="hljs-params"></span>) =&gt; {
    <span class="hljs-built_in">clearTimeout</span>(timer);
    <span class="hljs-keyword">const</span> current = <span class="hljs-title function_">now</span>(); <span class="hljs-comment">// 只取一次，显示与调度用同一时刻</span>
    <span class="hljs-keyword">const</span> remain = endAt - current;
    <span class="hljs-title function_">onTick</span>(<span class="hljs-title function_">formatRemain</span>(endAt, current));
    <span class="hljs-keyword">if</span> (remain &lt;= <span class="hljs-number">0</span>) <span class="hljs-keyword">return</span>;
    <span class="hljs-comment">// 对齐到下一个整秒，减少显示跳秒</span>
    timer = <span class="hljs-built_in">setTimeout</span>(tick, remain % <span class="hljs-number">1000</span> || <span class="hljs-number">1000</span>);
  };
  <span class="hljs-title function_">tick</span>();
  <span class="hljs-keyword">return</span> { <span class="hljs-attr">stop</span>: <span class="hljs-function">() =&gt;</span> <span class="hljs-built_in">clearTimeout</span>(timer), <span class="hljs-attr">refresh</span>: tick };
}
</code></pre></div>
<p>即使某次回调延迟了，下一次也会显示正确的剩余时间，误差不会累积。后台恢复时（<code>visibilitychange</code> 变回 <code>visible</code>）调用返回的 <code>refresh()</code> 立即刷新，它会先清掉旧定时器，不会出现两条计时链。</p>
<h2>服务端时间校准</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">syncOffset</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">const</span> t0 = performance.<span class="hljs-title function_">now</span>();
  <span class="hljs-keyword">const</span> res = <span class="hljs-keyword">await</span> <span class="hljs-title function_">fetch</span>(<span class="hljs-string">&#x27;/api/time&#x27;</span>);
  <span class="hljs-keyword">const</span> t1 = performance.<span class="hljs-title function_">now</span>();
  <span class="hljs-keyword">const</span> { serverTime } = <span class="hljs-keyword">await</span> res.<span class="hljs-title function_">json</span>(); <span class="hljs-comment">// 服务端毫秒时间戳</span>
  <span class="hljs-comment">// 假设往返延迟对称，响应生成于往返中点</span>
  <span class="hljs-keyword">const</span> serverAtT1 = serverTime + (t1 - t0) / <span class="hljs-number">2</span>;
  <span class="hljs-keyword">return</span> { serverAtT1, <span class="hljs-attr">perfAtT1</span>: t1 };
}

<span class="hljs-comment">// 之后任意时刻的服务端时间估算</span>
<span class="hljs-keyword">const</span> <span class="hljs-title function_">serverNow</span> = (<span class="hljs-params">{ serverAtT1, perfAtT1 }</span>) =&gt; serverAtT1 + (performance.<span class="hljs-title function_">now</span>() - perfAtT1);
</code></pre></div>
<p>以 <code>performance.now()</code> 作为本地流逝时间，用户修改系统时间不影响结果。网络往返不对称时估算会有误差，可以多次请求取往返时间最短的那次。页面从后台恢复或从休眠唤醒时重新校准：MDN 指出只有 Windows 上的浏览器在系统休眠期间仍让 <code>performance.now()</code> 继续计时。</p>
<p>把 <code>serverNow</code> 作为上面 <code>startCountdown</code> 的 <code>now</code> 参数传入即可。</p>
<h2>业务边界</h2>
<ul>
<li>前端倒计时只是展示，&quot;到点可抢购&quot;必须由服务端在请求到达时判断，提前发出的请求应被拒绝。</li>
<li>大量用户同时到点请求会形成尖峰，可以在开始前几秒随机错开预热请求，或由服务端排队。</li>
<li>倒计时结束后应从服务端重新拉取状态，而不是假定状态已切换。</li>
</ul>
<p>定时器的测试方法见<a href="/questions/testing-time-and-fake-timers/">《前端怎样测试定时器、重试和超时，避免 Fake Timers 造成假通过？》</a>。</p>
<h2>常见追问</h2>
<ul>
<li><code>requestAnimationFrame</code> 更准吗？它随屏幕刷新执行，后台标签页会暂停，不适合作为倒计时的时间来源，只适合做动画显示。</li>
<li>Web Worker 里的定时器能避免节流吗？不能保证，各浏览器策略不同，仍需按目标时间重新计算。</li>
<li>毫秒级倒计时怎么做？用 <code>requestAnimationFrame</code> 刷新显示，剩余时间依然用目标时间计算。</li>
</ul>`};export{e as default};