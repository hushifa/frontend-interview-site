var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>看视频时，评论从屏幕右边飘到左边，这就是弹幕。前端要解决三件事：每条弹幕放在哪一行、怎样不叠在一起、几百条同时飘动时页面怎样不卡。</p>
<p>常见做法是把画面横向分成若干条轨道，每条轨道记住最后放进去的那条弹幕。新弹幕要找一条满足两个条件的轨道：上一条的尾部已经完全进入屏幕，而且新弹幕即使更快，也要在上一条离开屏幕之前追不上它。找不到合适的轨道，就先排队或者直接丢弃。</p>
<p>渲染可以用 DOM 元素加 CSS <code>transform</code> 动画，也可以画在 Canvas 上，用 <code>requestAnimationFrame</code> 每帧重绘。位置要按经过的时间计算，不能按帧数累加，否则在高刷新率屏幕上会飘得更快。</p>
<p>性能上要控制同屏数量，DOM 方案复用元素、动画结束后回收；视频暂停时弹幕也要暂停，页面切到后台时 <code>requestAnimationFrame</code> 在大多数浏览器里会暂停，回来时要按视频时间重新对齐。</p>
</blockquote>
<h2>弹幕从哪里来</h2>
<p>弹幕数据一般有两类：点播视频按视频时间戳预先加载的历史弹幕，和直播或用户刚发出的实时弹幕。前端按视频当前播放时间，把到点的弹幕取出来放进待显示队列，再交给轨道分配。</p>
<p>所以弹幕的时间基准是视频的 <code>currentTime</code>，不是页面打开了多久。用户拖动进度条、暂停、倍速播放时，弹幕都要跟着视频时间走。</p>
<h2>轨道怎样分配才不会重叠</h2>
<p>弹幕从右往左匀速移动，同一条轨道里只要保证后一条不撞上前一条就行。这里有两种撞法：一是前一条刚出现、尾巴还没完全进屏，后一条就从同一个位置出来，两条直接叠在一起；二是后一条比前一条快，跑着跑着追上了。</p>
<p>下面的 <code>createTracks</code> 只记录每条轨道最后一条弹幕的宽度、速度和进入时间，用这两个条件判断。示例里屏幕宽 300 像素，速度单位是像素每毫秒。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// 每条轨道记录上一条弹幕的进入时间和速度，用来判断新弹幕会不会追尾。</span>
<span class="hljs-keyword">function</span> <span class="hljs-title function_">createTracks</span>(<span class="hljs-params">count, screenWidth</span>) {
  <span class="hljs-keyword">const</span> tracks = <span class="hljs-title class_">Array</span>.<span class="hljs-title function_">from</span>({ <span class="hljs-attr">length</span>: count }, <span class="hljs-function">() =&gt;</span> <span class="hljs-literal">null</span>);

  <span class="hljs-keyword">function</span> <span class="hljs-title function_">canPlace</span>(<span class="hljs-params">last, item, now</span>) {
    <span class="hljs-keyword">if</span> (!last) <span class="hljs-keyword">return</span> <span class="hljs-literal">true</span>;
    <span class="hljs-keyword">const</span> elapsed = now - last.<span class="hljs-property">start</span>;
    <span class="hljs-comment">// 上一条的尾部必须已经完全进入屏幕。</span>
    <span class="hljs-keyword">const</span> tailIn = last.<span class="hljs-property">speed</span> * elapsed &gt;= last.<span class="hljs-property">width</span>;
    <span class="hljs-comment">// 新弹幕更快时，要保证它在上一条离开屏幕前追不上。</span>
    <span class="hljs-keyword">const</span> lastLeaveTime = (screenWidth + last.<span class="hljs-property">width</span>) / last.<span class="hljs-property">speed</span> - elapsed;
    <span class="hljs-keyword">const</span> gap = last.<span class="hljs-property">speed</span> * elapsed - last.<span class="hljs-property">width</span>;
    <span class="hljs-keyword">const</span> catchUp = item.<span class="hljs-property">speed</span> &gt; last.<span class="hljs-property">speed</span> ? gap / (item.<span class="hljs-property">speed</span> - last.<span class="hljs-property">speed</span>) : <span class="hljs-title class_">Infinity</span>;
    <span class="hljs-keyword">return</span> tailIn &amp;&amp; catchUp &gt;= lastLeaveTime;
  }

  <span class="hljs-keyword">return</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">place</span>(<span class="hljs-params">item, now</span>) {
    <span class="hljs-keyword">const</span> index = tracks.<span class="hljs-title function_">findIndex</span>(<span class="hljs-function">(<span class="hljs-params">last</span>) =&gt;</span> <span class="hljs-title function_">canPlace</span>(last, item, now));
    <span class="hljs-keyword">if</span> (index === -<span class="hljs-number">1</span>) <span class="hljs-keyword">return</span> -<span class="hljs-number">1</span>;
    tracks[index] = { ...item, <span class="hljs-attr">start</span>: now };
    <span class="hljs-keyword">return</span> index;
  };
}

<span class="hljs-keyword">const</span> place = <span class="hljs-title function_">createTracks</span>(<span class="hljs-number">2</span>, <span class="hljs-number">300</span>);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">place</span>({ <span class="hljs-attr">width</span>: <span class="hljs-number">100</span>, <span class="hljs-attr">speed</span>: <span class="hljs-number">0.1</span> }, <span class="hljs-number">0</span>)); <span class="hljs-comment">// 0</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">place</span>({ <span class="hljs-attr">width</span>: <span class="hljs-number">100</span>, <span class="hljs-attr">speed</span>: <span class="hljs-number">0.1</span> }, <span class="hljs-number">500</span>)); <span class="hljs-comment">// 1</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">place</span>({ <span class="hljs-attr">width</span>: <span class="hljs-number">50</span>, <span class="hljs-attr">speed</span>: <span class="hljs-number">0.1</span> }, <span class="hljs-number">1500</span>)); <span class="hljs-comment">// 0</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">place</span>({ <span class="hljs-attr">width</span>: <span class="hljs-number">50</span>, <span class="hljs-attr">speed</span>: <span class="hljs-number">0.5</span> }, <span class="hljs-number">1600</span>)); <span class="hljs-comment">// -1</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">place</span>({ <span class="hljs-attr">width</span>: <span class="hljs-number">50</span>, <span class="hljs-attr">speed</span>: <span class="hljs-number">0.5</span> }, <span class="hljs-number">4000</span>)); <span class="hljs-comment">// 1</span>
</code></pre></div>
<p>第一条直接进轨道 0。第二条在 500 毫秒时出现，这时第一条只走了 50 像素，宽 100 像素的尾巴还在屏幕外，轨道 0 不能用，所以放进轨道 1。第三条在 1500 毫秒时出现，轨道 0 的第一条已经走了 150 像素，尾巴已经进屏，两条速度一样，永远追不上，所以回到轨道 0。</p>
<p>第四条速度是 0.5，比前面的快 5 倍。1600 毫秒时，轨道 0 的上一条刚进来 100 毫秒，尾巴还没进屏；轨道 1 的上一条尾巴虽然进屏了，可是两条只隔了 10 像素，新弹幕 25 毫秒就会追上，而上一条还要 2900 毫秒才离开屏幕。两条轨道都不行，返回 -1。等到 4000 毫秒再放，轨道 1 的上一条快要离屏了，追上它需要 625 毫秒，它 500 毫秒后就离开，所以可以放进去。</p>
<p>为什么追不上的判断要和“离屏时间”比？因为上一条离开屏幕以后，追上也看不到了。只要追上的时刻晚于它离屏的时刻，屏幕上就不会重叠。</p>
<p>返回 -1 时怎么处理取决于产品：可以放进队列等下一帧再试，也可以在弹幕太多时直接丢弃。直播高峰时一秒可能有几百条，全部排队只会越积越多，所以通常设置队列上限，超出就丢弃。</p>
<h2>DOM 还是 Canvas</h2>
<p>DOM 方案是每条弹幕一个元素，用 CSS 动画改 <code>transform: translateX(...)</code> 让它移动。优点是写起来简单，文字清晰，点击、悬停这类交互可以直接用事件。动画结束时元素会触发 <code>animationend</code> 事件，在这里把元素放回池子里复用，而不是每条都创建、销毁节点。</p>
<p>Canvas 方案是所有弹幕画在一块画布上，用 <code>requestAnimationFrame</code> 每帧清空、重绘。同屏弹幕很多时，它避免了大量 DOM 节点，但点击某条弹幕要自己做命中判断，见<a href="/questions/graphics-canvas-hit-test/">《Canvas 图形命中测试应该怎样实现？》</a>。</p>
<p>无论哪种方案，位置都要按时间算。MDN 提醒，<code>requestAnimationFrame</code> 的回调频率一般跟屏幕刷新率一致，有 60Hz，也有 120Hz、144Hz，如果每帧固定移动几个像素，高刷新率屏幕上动画就会更快。所以应该用回调参数里的时间戳，算出“从进入到现在过了多久”，再乘以速度得到位置。</p>
<h2>性能要注意哪些地方</h2>
<p>第一是控制同屏数量。轨道数量本身就是一个上限，再配合队列上限和弹幕密度设置，就能防止高峰期把页面压垮。</p>
<p>第二是只改 <code>transform</code> 和 <code>opacity</code>。改 <code>left</code> 会引起布局计算，而 <code>transform</code> 动画浏览器通常能放到合成阶段处理。<code>will-change: transform</code> 可以提示浏览器提前优化，可是 MDN 明确说它应该作为解决已有性能问题的最后手段，不要给太多元素加，滥用反而会让页面变慢、占用更多内存。</p>
<p>第三是跟着视频状态走。视频暂停时，DOM 方案可以把动画的 <code>animation-play-state</code> 设成 <code>paused</code>，Canvas 方案停止重绘。MDN 还写明，<code>requestAnimationFrame</code> 在大多数浏览器的后台标签页和隐藏的 iframe 中会暂停，所以页面切回来时，要按视频的当前时间重新计算每条弹幕的位置，或者清掉已经过时的弹幕。</p>
<p>另外，弹幕会遮挡画面，需要提供关闭开关和透明度、密度设置。对于在系统里开启了减少动态效果的用户，可以用 <code>prefers-reduced-motion</code> 媒体查询检测到，默认减少或关闭滚动弹幕。</p>
<h2>常见追问</h2>
<p><strong>弹幕内容是用户输入的，渲染时要注意什么？</strong></p>
<blockquote>
<p>DOM 方案用 <code>textContent</code> 设置文字，不要用 <code>innerHTML</code> 拼接，否则用户发一段 HTML 就可能执行脚本，原理见<a href="/questions/http-xss/">《XSS 有哪几种？前端怎样防范？》</a>。Canvas 用 <code>fillText</code> 画文字，本身不会解析 HTML。</p>
</blockquote>
<p><strong>用户拖动进度条后弹幕怎么办？</strong></p>
<blockquote>
<p>清空当前屏幕上的弹幕和轨道记录，按新的视频时间重新从数据里取出该显示的弹幕。不能把拖动前的弹幕留在屏幕上继续飘，否则内容和画面就对不上了。</p>
</blockquote>`};export{e as default};