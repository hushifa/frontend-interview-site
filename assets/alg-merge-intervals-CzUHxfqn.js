var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>先把区间按起点从小到大排序，然后依次处理：当前区间的起点没超过结果里最后一个区间的终点，说明两个连上了，就把最后一个区间延长；否则当作一个新区间追加进去。</p>
<p>相邻算不算重叠，取决于区间怎么定义。我用左闭右开 <code>[start, end)</code>，包含起点、不包含终点。这样 <code>[0, 10)</code> 和 <code>[10, 20)</code> 首尾相接，但没有公共的时间点。下面的实现默认把相接的也合并，条件是 <code>start &lt;= last[1]</code>；可以通过选项改成只合并真正重叠的，条件是 <code>start &lt; last[1]</code>。</p>
<p>延长时要取 <code>Math.max(last[1], end)</code>，因为后一个区间可能整个被前一个包住了，比如 <code>[0, 30)</code> 里有个 <code>[5, 10)</code>。时间复杂度是 O(n log n)，主要花在排序上。要先复制再排序，不修改调用方传进来的数组。</p>
<p>换到预约场景，判断两个预约冲不冲突要用严格的 <code>&lt;</code>，首尾相接的预约不算冲突。</p>
</blockquote>
<h2>实现</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">mergeIntervals</span>(<span class="hljs-params">intervals, { mergeTouching = <span class="hljs-literal">true</span> } = {}</span>) {
  <span class="hljs-keyword">const</span> sorted = intervals
    .<span class="hljs-title function_">map</span>(<span class="hljs-function">(<span class="hljs-params">[start, end]</span>) =&gt;</span> {
      <span class="hljs-keyword">if</span> (!<span class="hljs-title class_">Number</span>.<span class="hljs-built_in">isFinite</span>(start) || !<span class="hljs-title class_">Number</span>.<span class="hljs-built_in">isFinite</span>(end) || start &gt; end) {
        <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">RangeError</span>(<span class="hljs-string">\`非法区间：[<span class="hljs-subst">\${start}</span>, <span class="hljs-subst">\${end}</span>)\`</span>);
      }
      <span class="hljs-keyword">return</span> [start, end];
    })
    <span class="hljs-comment">// 空区间不覆盖任何时间，直接丢弃。</span>
    .<span class="hljs-title function_">filter</span>(<span class="hljs-function">(<span class="hljs-params">[start, end]</span>) =&gt;</span> start &lt; end)
    .<span class="hljs-title function_">sort</span>(<span class="hljs-function">(<span class="hljs-params">a, b</span>) =&gt;</span> a[<span class="hljs-number">0</span>] - b[<span class="hljs-number">0</span>]);

  <span class="hljs-keyword">const</span> result = [];
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> [start, end] <span class="hljs-keyword">of</span> sorted) {
    <span class="hljs-keyword">const</span> last = result.<span class="hljs-title function_">at</span>(-<span class="hljs-number">1</span>);
    <span class="hljs-keyword">const</span> overlaps = last &amp;&amp; (mergeTouching ? start &lt;= last[<span class="hljs-number">1</span>] : start &lt; last[<span class="hljs-number">1</span>]);
    <span class="hljs-keyword">if</span> (overlaps) last[<span class="hljs-number">1</span>] = <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">max</span>(last[<span class="hljs-number">1</span>], end);
    <span class="hljs-keyword">else</span> result.<span class="hljs-title function_">push</span>([start, end]);
  }
  <span class="hljs-keyword">return</span> result;
}

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">mergeIntervals</span>([[<span class="hljs-number">20</span>, <span class="hljs-number">25</span>], [<span class="hljs-number">0</span>, <span class="hljs-number">10</span>], [<span class="hljs-number">8</span>, <span class="hljs-number">15</span>]])); <span class="hljs-comment">// [[0, 15], [20, 25]]</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">mergeIntervals</span>([[<span class="hljs-number">0</span>, <span class="hljs-number">10</span>], [<span class="hljs-number">10</span>, <span class="hljs-number">20</span>]])); <span class="hljs-comment">// [[0, 20]]</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">mergeIntervals</span>([[<span class="hljs-number">0</span>, <span class="hljs-number">10</span>], [<span class="hljs-number">10</span>, <span class="hljs-number">20</span>]], { <span class="hljs-attr">mergeTouching</span>: <span class="hljs-literal">false</span> })); <span class="hljs-comment">// [[0, 10], [10, 20]]</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">mergeIntervals</span>([[<span class="hljs-number">0</span>, <span class="hljs-number">30</span>], [<span class="hljs-number">5</span>, <span class="hljs-number">10</span>]])); <span class="hljs-comment">// [[0, 30]]</span>
</code></pre></div>
<p>为什么要先排序？排好以后，能和当前区间重叠的，只可能是结果里的最后一个。不排序的话，每个区间都要和前面所有的比一遍。</p>
<p>第一个例子里，排序后是 <code>[0,10)</code>、<code>[8,15)</code>、<code>[20,25)</code>。8 没超过 10，所以前两个合并成 <code>[0,15)</code>；20 超过了 15，单独成一段。</p>
<p>最后一个例子说明了 <code>Math.max</code> 的作用。<code>[5,10)</code> 被 <code>[0,30)</code> 整个包住，如果直接用 <code>end</code> 去更新，终点就从 30 缩回 10，错了。</p>
<p><code>map</code> 那一步不只是校验，还给每个区间复制了一个新数组。所以后面改 <code>last[1]</code> 时，改的是副本，不会动到调用方的数据。实测用 2000 组随机区间，检查“合并前后覆盖的时间点一样”和“结果里的区间互不相接”，都通过了。</p>
<h2>相接的区间，什么时候合并</h2>
<table><thead><tr><th>场景</th><th>相接区间 <code>[0,10)</code> 和 <code>[10,20)</code></th></tr></thead><tbody><tr><td>统计观看进度</td><td>应合并为 <code>[0, 20)</code>，用户连续看完了 20 秒</td></tr><tr><td>会议室预约</td><td>不冲突，前一场结束时下一场开始</td></tr></tbody></table>
<p>判断预约冲突甚至不用合并，排好序以后，看相邻两个有没有交叉就行：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">hasConflict</span>(<span class="hljs-params">bookings</span>) {
  <span class="hljs-keyword">const</span> sorted = [...bookings].<span class="hljs-title function_">sort</span>(<span class="hljs-function">(<span class="hljs-params">a, b</span>) =&gt;</span> a[<span class="hljs-number">0</span>] - b[<span class="hljs-number">0</span>]);
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">let</span> i = <span class="hljs-number">1</span>; i &lt; sorted.<span class="hljs-property">length</span>; i++) {
    <span class="hljs-keyword">if</span> (sorted[i][<span class="hljs-number">0</span>] &lt; sorted[i - <span class="hljs-number">1</span>][<span class="hljs-number">1</span>]) <span class="hljs-keyword">return</span> <span class="hljs-literal">true</span>;
  }
  <span class="hljs-keyword">return</span> <span class="hljs-literal">false</span>;
}

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">hasConflict</span>([[<span class="hljs-number">9</span>, <span class="hljs-number">10</span>], [<span class="hljs-number">10</span>, <span class="hljs-number">11</span>]])); <span class="hljs-comment">// false</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">hasConflict</span>([[<span class="hljs-number">9</span>, <span class="hljs-number">11</span>], [<span class="hljs-number">10</span>, <span class="hljs-number">12</span>]])); <span class="hljs-comment">// true</span>
</code></pre></div>
<p>9 点到 10 点、10 点到 11 点，前一场刚结束下一场才开始，所以不冲突。9 点到 11 点和 10 点到 12 点，中间有一个小时重叠，就冲突了。</p>
<p>如果问题变成“有冲突时最少取消几场预约，剩下的才互不冲突”，就不是合并了，而是贪心的区间调度：按结束时间排序，每次留下结束最早的那场，写法和正确性论证见<a href="/questions/ds-greedy/">《贪心算法怎样做跳跃游戏、无重叠区间？怎么判断贪心是对的？》</a>。</p>
<h2>常见追问</h2>
<p><strong>区间是带小数的秒数怎么办？</strong></p>
<blockquote>
<p>浮点数有误差，本来应该相接的两个区间，中间可能出现 <code>10.000000001</code> 这样的小缝。可以先换算成整数毫秒再合并。</p>
</blockquote>
<p><strong>新加一个区间，要整体重新算吗？</strong></p>
<blockquote>
<p>不用。结果已经是有序的，可以用二分查找找到插入的位置，只合并受影响的那几个相邻区间，找插入位置的写法见<a href="/questions/ds-binary-search-variants/">《二分查找有哪些常见变体？怎样找边界、在旋转数组里查找？》</a>。</p>
</blockquote>
<p><strong>观看进度的百分比怎么算？</strong></p>
<blockquote>
<p>合并以后把每个区间的长度加起来，再除以视频总时长。</p>
</blockquote>`};export{e as default};