var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>比如点“回到顶部”按钮，页面在 300 毫秒内从当前位置滑到顶部，先快后慢。做法是调用 <code>requestAnimationFrame(step)</code>，浏览器在下一次绘制前调用 <code>step</code>，<code>step</code> 里算出这一帧的位置，没结束就再调用一次 <code>requestAnimationFrame</code>，一帧接一帧。</p>
<p>关键是按时间算进度，不按帧数。回调会收到一个时间戳，用它减去开始时间、除以总时长，得到 0 到 1 的进度。如果每帧固定移动 10 像素，60Hz 和 120Hz 的屏幕上速度会差一倍，MDN 也专门提醒了这一点。</p>
<p>进度再交给缓动函数，比如 <code>1 - (1 - t) ** 3</code>，得到“先快后慢”的效果，位置等于起点加上距离乘以缓动后的值。</p>
<p>要注意取消和边界。<code>requestAnimationFrame</code> 返回一个 ID，每一帧都是新的，所以要保存最新的 ID，用户中途滚动或组件卸载时调用 <code>cancelAnimationFrame</code>。另外后台标签页里大多数浏览器会暂停这些回调；只是想平滑滚动的话，<code>window.scrollTo({ top: 0, behavior: &#x27;smooth&#x27; })</code> 就够了。</p>
</blockquote>
<h2>手写一个通用的 animate</h2>
<p>下面的 <code>animate</code> 不直接依赖浏览器，<code>raf</code> 和 <code>caf</code> 作为参数传进来。在浏览器里传 <code>requestAnimationFrame</code> 和 <code>cancelAnimationFrame</code>；示例在 Node 里用一个假的帧队列手动推进时间，这样能看清每一帧算出的值。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">easeOutCubic</span>(<span class="hljs-params">t</span>) {
  <span class="hljs-keyword">return</span> <span class="hljs-number">1</span> - <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">pow</span>(<span class="hljs-number">1</span> - t, <span class="hljs-number">3</span>);
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">animate</span>(<span class="hljs-params">{ <span class="hljs-keyword">from</span>, to, duration, easing, onUpdate, raf, caf }</span>) {
  <span class="hljs-keyword">let</span> start = <span class="hljs-literal">null</span>;
  <span class="hljs-keyword">let</span> id = <span class="hljs-literal">null</span>;

  <span class="hljs-keyword">function</span> <span class="hljs-title function_">step</span>(<span class="hljs-params">timestamp</span>) {
    <span class="hljs-keyword">if</span> (start === <span class="hljs-literal">null</span>) start = timestamp;
    <span class="hljs-comment">// 按经过的时间算进度，帧率高低只影响画得多细，不影响总时长。</span>
    <span class="hljs-keyword">const</span> progress = <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">min</span>((timestamp - start) / duration, <span class="hljs-number">1</span>);
    <span class="hljs-title function_">onUpdate</span>(<span class="hljs-keyword">from</span> + (to - <span class="hljs-keyword">from</span>) * <span class="hljs-title function_">easing</span>(progress));
    id = progress &lt; <span class="hljs-number">1</span> ? <span class="hljs-title function_">raf</span>(step) : <span class="hljs-literal">null</span>;
  }

  id = <span class="hljs-title function_">raf</span>(step);
  <span class="hljs-keyword">return</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">cancel</span>(<span class="hljs-params"></span>) {
    <span class="hljs-keyword">if</span> (id !== <span class="hljs-literal">null</span>) <span class="hljs-title function_">caf</span>(id);
    id = <span class="hljs-literal">null</span>;
  };
}

<span class="hljs-comment">// 在 Node 里用一个假的帧队列代替浏览器，手动推进时间。</span>
<span class="hljs-keyword">function</span> <span class="hljs-title function_">createFakeFrames</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">const</span> callbacks = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Map</span>();
  <span class="hljs-keyword">let</span> nextId = <span class="hljs-number">1</span>;
  <span class="hljs-keyword">return</span> {
    <span class="hljs-title function_">raf</span>(<span class="hljs-params">callback</span>) {
      callbacks.<span class="hljs-title function_">set</span>(nextId, callback);
      <span class="hljs-keyword">return</span> nextId++;
    },
    <span class="hljs-title function_">caf</span>(<span class="hljs-params">id</span>) {
      callbacks.<span class="hljs-title function_">delete</span>(id);
    },
    <span class="hljs-title function_">tick</span>(<span class="hljs-params">time</span>) {
      <span class="hljs-keyword">const</span> pending = [...callbacks.<span class="hljs-title function_">values</span>()];
      callbacks.<span class="hljs-title function_">clear</span>();
      pending.<span class="hljs-title function_">forEach</span>(<span class="hljs-function">(<span class="hljs-params">callback</span>) =&gt;</span> <span class="hljs-title function_">callback</span>(time));
    },
  };
}

<span class="hljs-keyword">const</span> frames = <span class="hljs-title function_">createFakeFrames</span>();
<span class="hljs-keyword">const</span> positions = [];
<span class="hljs-title function_">animate</span>({
  <span class="hljs-attr">from</span>: <span class="hljs-number">1000</span>,
  <span class="hljs-attr">to</span>: <span class="hljs-number">0</span>,
  <span class="hljs-attr">duration</span>: <span class="hljs-number">300</span>,
  <span class="hljs-attr">easing</span>: easeOutCubic,
  <span class="hljs-attr">onUpdate</span>: <span class="hljs-function">(<span class="hljs-params">y</span>) =&gt;</span> positions.<span class="hljs-title function_">push</span>(<span class="hljs-title class_">Math</span>.<span class="hljs-title function_">round</span>(y)),
  <span class="hljs-attr">raf</span>: frames.<span class="hljs-property">raf</span>,
  <span class="hljs-attr">caf</span>: frames.<span class="hljs-property">caf</span>,
});
[<span class="hljs-number">0</span>, <span class="hljs-number">100</span>, <span class="hljs-number">200</span>, <span class="hljs-number">300</span>, <span class="hljs-number">400</span>].<span class="hljs-title function_">forEach</span>(<span class="hljs-function">(<span class="hljs-params">time</span>) =&gt;</span> frames.<span class="hljs-title function_">tick</span>(time));
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(positions.<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;,&#x27;</span>)); <span class="hljs-comment">// 1000,296,37,0</span>

<span class="hljs-keyword">const</span> slow = <span class="hljs-title function_">createFakeFrames</span>();
<span class="hljs-keyword">const</span> halfway = [];
<span class="hljs-keyword">const</span> cancel = <span class="hljs-title function_">animate</span>({
  <span class="hljs-attr">from</span>: <span class="hljs-number">0</span>,
  <span class="hljs-attr">to</span>: <span class="hljs-number">100</span>,
  <span class="hljs-attr">duration</span>: <span class="hljs-number">1000</span>,
  <span class="hljs-attr">easing</span>: <span class="hljs-function">(<span class="hljs-params">t</span>) =&gt;</span> t,
  <span class="hljs-attr">onUpdate</span>: <span class="hljs-function">(<span class="hljs-params">x</span>) =&gt;</span> halfway.<span class="hljs-title function_">push</span>(x),
  <span class="hljs-attr">raf</span>: slow.<span class="hljs-property">raf</span>,
  <span class="hljs-attr">caf</span>: slow.<span class="hljs-property">caf</span>,
});
slow.<span class="hljs-title function_">tick</span>(<span class="hljs-number">0</span>);
slow.<span class="hljs-title function_">tick</span>(<span class="hljs-number">500</span>);
<span class="hljs-title function_">cancel</span>();
slow.<span class="hljs-title function_">tick</span>(<span class="hljs-number">1000</span>);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(halfway.<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;,&#x27;</span>)); <span class="hljs-comment">// 0,50</span>
</code></pre></div>
<p>第一段从 1000 滚到 0，时长 300 毫秒。时间推进了 5 帧，却只输出 4 个值，因为第 300 毫秒那一帧进度已经到 1，<code>step</code> 不再安排下一帧，第 400 毫秒时队列是空的。</p>
<p>为什么 100 毫秒时就已经到了 296，走完了七成？因为用了缓动函数 <code>easeOutCubic</code>。进度 <code>t</code> 是匀速增长的，经过 <code>1 - (1 - t)^3</code> 变换以后，前期增长快、后期增长慢，画面上就是先快后慢地停下。换成 <code>(t) =&gt; t</code> 就是匀速。</p>
<p>第二段在 500 毫秒时调用了 <code>cancel()</code>，所以只输出 <code>0,50</code>。取消时清掉的是最新的 ID：<code>step</code> 每一帧都会把 <code>id</code> 更新成新申请的那一个，如果只记住第一次的 ID，取消就不起作用。MDN 还建议不要把 0 当作“没有 ID”的标记，所以这里用 <code>null</code>。</p>
<h2>为什么要按时间算，而不是每帧走固定距离</h2>
<p>MDN 写明，回调的调用频率通常和屏幕刷新率一致，常见的是 60Hz，也有 75Hz、120Hz 和 144Hz。如果每帧固定移动 10 像素，120Hz 屏幕一秒调用 120 次，动画就比 60Hz 屏幕快一倍。主线程忙的时候掉了几帧，动画又会变慢。</p>
<p>按时间算就没有这个问题。回调的第一个参数是一个毫秒时间戳，在窗口里等于 <code>document.timeline.currentTime</code>。用它减去第一帧的时间戳得到经过的时间，除以总时长就是进度。帧多帧少只影响画得细不细，到了 300 毫秒一定在终点。MDN 特意提醒，要用这个参数（或者别的取当前时间的办法）计算每帧的进展，否则动画在高刷新率屏幕上会跑得更快。</p>
<h2>用在回到顶部</h2>
<p>在浏览器里把 <code>animate</code> 接到滚动上就行。用户在动画过程中自己滚动滚轮时，应该停止动画，不然会和用户抢滚动条。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">let</span> cancelScroll = <span class="hljs-literal">null</span>;

<span class="hljs-keyword">function</span> <span class="hljs-title function_">scrollToTop</span>(<span class="hljs-params"></span>) {
  cancelScroll?.();
  cancelScroll = <span class="hljs-title function_">animate</span>({
    <span class="hljs-attr">from</span>: <span class="hljs-variable language_">window</span>.<span class="hljs-property">scrollY</span>,
    <span class="hljs-attr">to</span>: <span class="hljs-number">0</span>,
    <span class="hljs-attr">duration</span>: <span class="hljs-number">300</span>,
    <span class="hljs-attr">easing</span>: easeOutCubic,
    <span class="hljs-attr">onUpdate</span>: <span class="hljs-function">(<span class="hljs-params">y</span>) =&gt;</span> <span class="hljs-variable language_">window</span>.<span class="hljs-title function_">scrollTo</span>(<span class="hljs-number">0</span>, y),
    <span class="hljs-attr">raf</span>: requestAnimationFrame,
    <span class="hljs-attr">caf</span>: cancelAnimationFrame,
  });
}

<span class="hljs-variable language_">window</span>.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;wheel&#x27;</span>, <span class="hljs-function">() =&gt;</span> cancelScroll?.(), { <span class="hljs-attr">passive</span>: <span class="hljs-literal">true</span> });
</code></pre></div>
<p>为什么不直接用 CSS 的 <code>scroll-behavior: smooth</code> 或者 <code>scrollTo</code> 的 <code>behavior: &#x27;smooth&#x27;</code>？只要求平滑滚动的话，它们更简单。可是 MDN 说明，<code>smooth</code> 的缓动函数和时长都由浏览器决定，浏览器也可以忽略这个属性。需要指定时长、缓动曲线，或者动画的不是滚动位置而是数字、进度条时，才需要自己用 <code>requestAnimationFrame</code> 写。</p>
<h2>和 setTimeout 写动画有什么区别</h2>
<p>用 <code>setTimeout(step, 16)</code> 也能一帧帧地动，可是它的时机和屏幕刷新没有关系，16 毫秒也只是“至少等这么久”，和绘制对不齐时画面就会卡顿。<code>requestAnimationFrame</code> 的回调由浏览器安排在下一次重绘之前，更新和绘制的节奏是一致的。</p>
<p>另外，MDN 写明大多数浏览器在后台标签页和隐藏的 <code>&lt;iframe&gt;</code> 里会暂停 <code>requestAnimationFrame</code> 的回调，以节省性能和电量。切回来时，下一帧的时间戳已经过了很久，按时间算进度的动画会直接跳到终点，不会从中间慢慢补。定时器的精度问题见<a href="/questions/alg-set-interval/">《怎样用 setTimeout 实现 setInterval？两者有什么区别？》</a>。</p>
<h2>常见追问</h2>
<p><strong><code>requestAnimationFrame</code> 为什么每帧都要重新调用？</strong></p>
<blockquote>
<p>因为它是一次性的，MDN 原话是“one-shot”，调用一次只安排下一帧的一次回调。想继续动，就要在回调里再调用一次。这也是为什么每帧的 ID 都不一样，取消时要用最新的那个。</p>
</blockquote>
<p><strong>React 组件里用它要注意什么？</strong></p>
<blockquote>
<p>在 <code>useEffect</code> 里启动动画，把取消函数作为清理函数返回。组件卸载或依赖变化时，React 会调用清理函数，动画就不会在已经卸载的组件上继续跑。</p>
</blockquote>
<p><strong>动画要考虑用户关闭了动效吗？</strong></p>
<blockquote>
<p>要。系统里开启了“减少动态效果”时，媒体查询 <code>prefers-reduced-motion: reduce</code> 会匹配，这时可以把时长设成 0，直接跳到终点。</p>
</blockquote>`};export{e as default};