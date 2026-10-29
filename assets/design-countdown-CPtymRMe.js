var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>定时器设成 1000 毫秒，并不是说正好 1000 毫秒后执行，而是“至少等 1000 毫秒”。主线程忙的时候回调会被推迟；定时器嵌套超过 5 层，最小延迟会被限制成 4 毫秒；标签页切到后台，浏览器还会节流，最多每秒执行一次，甚至更少。</p>
<p>所以“每秒回调一次、计数减一”的写法会越走越慢，因为每次的延迟都被累加进去了。正确做法是记住结束的时间点，每次回调都用“结束时间减当前时间”重新算剩余时间，这样某一次晚了，下一次也会自动纠正。</p>
<p>计算经过的时间最好用 <code>performance.now()</code>。<code>Date.now()</code> 依赖系统时钟，用户一改系统时间，倒计时就跳了；<code>performance.now()</code> 是单调时钟，只会往前走，不受系统时钟调整影响。</p>
<p>还要注意，结束时间要以服务端为准。可以通过一次接口往返，估算本地和服务端差了多少，页面切回前台时再校准一次。但像“现在能不能下单”这种关键判断，仍然要服务端在收到请求时自己校验。</p>
</blockquote>
<h2>每秒减一为什么会越走越慢</h2>
<p>很多人第一版会这样写：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// 错误写法：每秒减一，误差随时间累积</span>
<span class="hljs-keyword">let</span> left = <span class="hljs-number">60</span>;
<span class="hljs-built_in">setInterval</span>(<span class="hljs-function">() =&gt;</span> {
  left -= <span class="hljs-number">1</span>;
  <span class="hljs-title function_">render</span>(left);
}, <span class="hljs-number">1000</span>);
</code></pre></div>
<p>这段代码假设回调正好每 1000 毫秒执行一次。可实际上，每次回调都可能晚几毫秒到几百毫秒，碰上长任务或者页面卡顿会晚得更多。</p>
<p>标签页切到后台以后更明显。Chrome 会把定时器限制成每秒最多检查一次，页面隐藏超过 5 分钟、并且满足其他条件时，还会降到每分钟一次。</p>
<p>这些延迟每一次都被算进了 <code>left</code>。<code>left</code> 减了 60 次，真实时间可能已经过去了 65 秒、70 秒，几分钟以后差距就能看出来了。</p>
<h2>改成按目标时间计算</h2>
<p>先写一个函数，给定结束时间和当前时间，算出要显示的文字：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> <span class="hljs-title function_">formatRemain</span> = (<span class="hljs-params">endAt, now</span>) =&gt; {
  <span class="hljs-keyword">const</span> seconds = <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">ceil</span>(<span class="hljs-title class_">Math</span>.<span class="hljs-title function_">max</span>(<span class="hljs-number">0</span>, endAt - now) / <span class="hljs-number">1000</span>);
  <span class="hljs-keyword">const</span> mm = <span class="hljs-title class_">String</span>(<span class="hljs-title class_">Math</span>.<span class="hljs-title function_">floor</span>(seconds / <span class="hljs-number">60</span>)).<span class="hljs-title function_">padStart</span>(<span class="hljs-number">2</span>, <span class="hljs-string">&#x27;0&#x27;</span>);
  <span class="hljs-keyword">const</span> ss = <span class="hljs-title class_">String</span>(seconds % <span class="hljs-number">60</span>).<span class="hljs-title function_">padStart</span>(<span class="hljs-number">2</span>, <span class="hljs-string">&#x27;0&#x27;</span>);
  <span class="hljs-keyword">return</span> <span class="hljs-string">\`<span class="hljs-subst">\${mm}</span>:<span class="hljs-subst">\${ss}</span>\`</span>;
};

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">formatRemain</span>(<span class="hljs-number">125000</span>, <span class="hljs-number">0</span>)); <span class="hljs-comment">// 02:05</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">formatRemain</span>(<span class="hljs-number">1000</span>, <span class="hljs-number">1500</span>)); <span class="hljs-comment">// 00:00</span>
</code></pre></div>
<p>剩余 125000 毫秒，显示 <code>02:05</code>。已经过了结束时间，<code>Math.max(0, ...)</code> 让它停在 <code>00:00</code>，不会出现负数。</p>
<p>然后用它驱动倒计时：</p>
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
<p>关键在于每次 <code>tick</code> 都重新读当前时间，用结束时间减它。哪怕某一次回调晚了，下一次显示的剩余时间照样是对的，误差不会累积。</p>
<p>下一次的延迟用 <code>remain % 1000</code>，是为了让回调正好落在剩余时间跨过整秒的时候，减少显示上的跳秒。</p>
<p>页面从后台切回来，也就是 <code>visibilitychange</code> 变回 <code>visible</code> 时，调用返回的 <code>refresh()</code> 立刻刷新一次。它会先清掉旧的定时器，所以不会出现两条计时链同时在跑。</p>
<h2>怎样用服务端时间校准</h2>
<p>本地时钟可能不准，用户也可能改过，所以结束时间要以服务端为准。思路是请求一次服务端时间，同时记下请求前后的本地时刻：</p>
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
<p>服务端返回的时间，是它生成响应那一刻的时间。这里假设请求去和回花的时间一样长，那响应大约生成在往返的中点，所以收到响应时，服务端的时间大约是 <code>serverTime</code> 加上往返时间的一半。</p>
<p>之后要知道服务端“现在”几点，就拿收到响应时的估算值，加上从那以后本地过去了多久。本地经过的时间用 <code>performance.now()</code> 计算，用户改系统时间也不影响。</p>
<p>这个估算有误差，网络去回不对称时尤其明显。可以多请求几次，取往返时间最短的那次，它的误差上限最小。</p>
<p>页面从后台恢复、电脑从休眠唤醒时，要重新校准。MDN 指出，只有 Windows 上的浏览器在系统休眠期间仍然让 <code>performance.now()</code> 继续计时，其他平台休眠时它会停住。</p>
<p>最后，把 <code>serverNow</code> 当成上面 <code>startCountdown</code> 的 <code>now</code> 参数传进去就行。</p>
<h2>倒计时管不了的业务边界</h2>
<p>前端倒计时只是展示。“到点就能抢购”必须由服务端在请求到达时判断，提前发来的请求应该被拒绝。</p>
<p>大量用户同一时刻点按钮，会形成请求尖峰。可以在开始前几秒随机错开预热请求，或者由服务端排队。</p>
<p>倒计时结束以后，应该从服务端重新拉取状态，而不是想当然地认为状态已经切换了。</p>
<p>定时器相关的测试方法见<a href="/questions/testing-time-and-fake-timers/">《前端怎样测试定时器、重试和超时，避免 Fake Timers 造成假通过？》</a>。</p>
<h2>常见追问</h2>
<p><strong><code>requestAnimationFrame</code> 会更准吗？</strong></p>
<blockquote>
<p>它跟着屏幕刷新执行，后台标签页会暂停，所以不适合做倒计时的时间来源，只适合拿来刷新动画显示。</p>
</blockquote>
<p><strong>把定时器放进 Web Worker，能避免节流吗？</strong></p>
<blockquote>
<p>不能保证，各浏览器的策略不一样。还是要按目标时间重新计算。</p>
</blockquote>
<p><strong>毫秒级的倒计时怎么做？</strong></p>
<blockquote>
<p>用 <code>requestAnimationFrame</code> 刷新显示，剩余时间仍然用目标时间去算。</p>
</blockquote>`};export{e as default};