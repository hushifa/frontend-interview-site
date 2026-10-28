var e={answerHtml:`<h2>简答</h2>
<ul>
<li>先按起点升序排序，然后遍历：当前区间的起点不超过结果中最后一个区间的终点，就延长最后一个区间，否则追加为新区间。</li>
<li>采用左闭右开区间 <code>[start, end)</code>：<code>[0, 10)</code> 与 <code>[10, 20)</code> 首尾相接但没有公共点。下面的实现默认合并相接区间（<code>start &lt;= last[1]</code>），可以通过选项改为只合并真正重叠的区间（<code>start &lt; last[1]</code>）。</li>
<li>延长时取 <code>Math.max(last[1], end)</code>，处理 <code>[0, 30)</code> 包含 <code>[5, 10)</code> 这类嵌套区间。</li>
<li>时间复杂度 O(n log n)，主要来自排序；先复制再排序，不修改调用方传入的数组。</li>
<li>判断两个预约是否冲突时用严格的 <code>&lt;</code>，首尾相接的预约不算冲突。</li>
</ul>
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
<p><code>map</code> 先复制每个区间，后续修改 <code>last[1]</code> 不会影响输入数组。实测用 2000 组随机区间对比&quot;合并前后覆盖的时间点集合相同&quot;以及&quot;结果区间互不相接&quot;，均通过。</p>
<h2>两种语义</h2>
<table><thead><tr><th>场景</th><th>相接区间 <code>[0,10)</code> 和 <code>[10,20)</code></th></tr></thead><tbody><tr><td>统计观看进度</td><td>应合并为 <code>[0, 20)</code>，用户连续看完了 20 秒</td></tr><tr><td>会议室预约</td><td>不冲突，前一场结束时下一场开始</td></tr></tbody></table>
<p>预约冲突判断不需要合并，排序后检查相邻两项即可：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">hasConflict</span>(<span class="hljs-params">bookings</span>) {
  <span class="hljs-keyword">const</span> sorted = [...bookings].<span class="hljs-title function_">sort</span>(<span class="hljs-function">(<span class="hljs-params">a, b</span>) =&gt;</span> a[<span class="hljs-number">0</span>] - b[<span class="hljs-number">0</span>]);
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">let</span> i = <span class="hljs-number">1</span>; i &lt; sorted.<span class="hljs-property">length</span>; i++) {
    <span class="hljs-keyword">if</span> (sorted[i][<span class="hljs-number">0</span>] &lt; sorted[i - <span class="hljs-number">1</span>][<span class="hljs-number">1</span>]) <span class="hljs-keyword">return</span> <span class="hljs-literal">true</span>;
  }
  <span class="hljs-keyword">return</span> <span class="hljs-literal">false</span>;
}

<span class="hljs-title function_">hasConflict</span>([[<span class="hljs-number">9</span>, <span class="hljs-number">10</span>], [<span class="hljs-number">10</span>, <span class="hljs-number">11</span>]]); <span class="hljs-comment">// false</span>
<span class="hljs-title function_">hasConflict</span>([[<span class="hljs-number">9</span>, <span class="hljs-number">11</span>], [<span class="hljs-number">10</span>, <span class="hljs-number">12</span>]]); <span class="hljs-comment">// true</span>
</code></pre></div>
<h2>常见追问</h2>
<ul>
<li><strong>区间是秒级浮点数怎么办？</strong> 浮点误差会让本应相接的区间出现 <code>10.000000001</code> 这样的缝隙。可以先换算成整数毫秒再合并。</li>
<li><strong>新增一个区间时要整体重算吗？</strong> 结果已经有序，可以用二分查找定位插入位置，只合并受影响的相邻区间，见《二分查找怎样定位时间轴边界？为什么重复值和空数组容易写错？》。</li>
<li><strong>观看进度怎么算百分比？</strong> 合并后累加每个区间的长度，再除以视频总时长。</li>
</ul>`};export{e as default};