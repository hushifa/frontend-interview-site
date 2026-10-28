var e={answerHtml:`<h2>简答</h2>
<ul>
<li>先按起点排序，再依次与结果中最后一个区间比较。</li>
<li>当前起点不超过上一个区间的终点时就合并，终点取两者的较大值。</li>
<li>左闭右开区间下，[1,3) 和 [3,5) 是否合并要按业务决定。</li>
<li>时间复杂度 O(n log n)，排序前先复制数组，避免修改输入。</li>
</ul>
<p>视频播放器记录用户已经看过的片段：0～10 秒、8～15 秒、20～25 秒。直接累加长度会把 8～10 秒重复计算。需要先求这些片段的覆盖并集，再计算总长度，才能得到 20 秒而不是 22 秒。</p>
<p>合并区间前先定义端点语义。本文使用左闭右开 <code>[start, end)</code>，例如 <code>[0,10)</code> 包含起点但不包含第 10 秒这个端点。它便于计算长度 <code>end - start</code>，也便于把相邻片段无重叠地拼接。</p>
<h2>重叠和连续覆盖不是同一个判断</h2>
<p><code>[0,10)</code> 与 <code>[10,20)</code> 没有交集，但覆盖范围连续，可以压缩成 <code>[0,20)</code>。如果题目问日程是否冲突，这两项通常不冲突；如果问时间轴覆盖的最简表示，则通常可以合并。</p>
<p>下面用 mergeTouching 参数明确这个选择。默认只合并有正长度交集的区间，设为 true 时也合并相邻区间。零长度 <code>[x,x)</code> 是空集合，本例忽略它；若业务需要表示时间点事件，应使用不同的数据模型。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">mergeIntervals</span>(<span class="hljs-params">intervals, mergeTouching = <span class="hljs-literal">false</span></span>) {
  <span class="hljs-keyword">if</span> (!<span class="hljs-title class_">Array</span>.<span class="hljs-title function_">isArray</span>(intervals) || <span class="hljs-keyword">typeof</span> mergeTouching !== <span class="hljs-string">&#x27;boolean&#x27;</span>) {
    <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">TypeError</span>(<span class="hljs-string">&#x27;需要区间数组和布尔选项&#x27;</span>);
  }
  <span class="hljs-keyword">const</span> sorted = [];
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> interval <span class="hljs-keyword">of</span> intervals) {
    <span class="hljs-keyword">if</span> (!<span class="hljs-title class_">Array</span>.<span class="hljs-title function_">isArray</span>(interval) || interval.<span class="hljs-property">length</span> !== <span class="hljs-number">2</span>) {
      <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">TypeError</span>(<span class="hljs-string">&#x27;每个区间必须有两个端点&#x27;</span>);
    }
    <span class="hljs-keyword">const</span> [start, end] = interval;
    <span class="hljs-keyword">if</span> (!<span class="hljs-title class_">Number</span>.<span class="hljs-built_in">isFinite</span>(start) || !<span class="hljs-title class_">Number</span>.<span class="hljs-built_in">isFinite</span>(end) || start &gt; end) {
      <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">RangeError</span>(<span class="hljs-string">&#x27;端点必须为有限数值，且起点不能大于终点&#x27;</span>);
    }
    <span class="hljs-keyword">if</span> (start &lt; end) sorted.<span class="hljs-title function_">push</span>([start, end]);
  }
  sorted.<span class="hljs-title function_">sort</span>(<span class="hljs-function">(<span class="hljs-params">a, b</span>) =&gt;</span> a[<span class="hljs-number">0</span>] - b[<span class="hljs-number">0</span>]);

  <span class="hljs-keyword">const</span> result = [];
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> [start, end] <span class="hljs-keyword">of</span> sorted) {
    <span class="hljs-keyword">const</span> previous = result[result.<span class="hljs-property">length</span> - <span class="hljs-number">1</span>];
    <span class="hljs-keyword">const</span> canMerge = previous &amp;&amp;
      (mergeTouching ? start &lt;= previous[<span class="hljs-number">1</span>] : start &lt; previous[<span class="hljs-number">1</span>]);
    <span class="hljs-keyword">if</span> (canMerge) previous[<span class="hljs-number">1</span>] = <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">max</span>(previous[<span class="hljs-number">1</span>], end);
    <span class="hljs-keyword">else</span> result.<span class="hljs-title function_">push</span>([start, end]);
  }
  <span class="hljs-keyword">return</span> result;
}

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">mergeIntervals</span>([[<span class="hljs-number">20</span>, <span class="hljs-number">25</span>], [<span class="hljs-number">0</span>, <span class="hljs-number">10</span>], [<span class="hljs-number">8</span>, <span class="hljs-number">15</span>]]));
<span class="hljs-comment">// [[0, 15], [20, 25]]</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">mergeIntervals</span>([[<span class="hljs-number">0</span>, <span class="hljs-number">10</span>], [<span class="hljs-number">10</span>, <span class="hljs-number">20</span>]], <span class="hljs-literal">true</span>));
<span class="hljs-comment">// [[0, 20]]</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">mergeIntervals</span>([[<span class="hljs-number">0</span>, <span class="hljs-number">10</span>], [<span class="hljs-number">10</span>, <span class="hljs-number">20</span>]]));
<span class="hljs-comment">// [[0, 10], [10, 20]]</span>
</code></pre></div>
<p>这是本题的教学实现，MDN 参考用于核对数组排序 API，不代表它是 MDN 官方提供的合并算法。</p>
<h2>为什么只需要比较结果中的最后一个区间</h2>
<p>排序后，新区间的起点不会早于前面已经处理的起点。若它与最后一个结果区间都不相交，就不可能越过最后一个区间再与更早的区间相交；因此可以直接追加。</p>
<p>若相交，则扩展最后一个区间的终点。这里必须使用 Math.max：例如先处理 <code>[0,100)</code>，再处理 <code>[20,30)</code>，如果直接把终点改成 30，反而丢失了原本覆盖的 30～100。</p>
<p>排序只比较起点就足够，起点相同的嵌套区间也会由 Math.max 合并。不能用默认 sort，因为它按字符串规则排序，不是按数值端点排序。</p>
<h2>不修改输入是接口契约</h2>
<p>sort 会修改被排序的数组。本例先复制端点到 sorted，再生成新的 result，不改变传入数组和内部区间。否则前端组件共享一份原始片段数据时，调用合并函数可能悄悄改变其他列表顺序或终点。</p>
<p>这里还主动检查稀疏输入：外层数组的空位在 for…of 中得到 undefined，会被拒绝；内层缺失端点也不会通过有限数值检查。类型声明不能替代外部 JSON 的运行时验证。</p>
<h2>性能、单位和业务边界</h2>
<p>按常见比较排序模型，排序耗时 O(n log n)，扫描 O(n)，额外空间 O(n)。JavaScript 标准没有给 sort 规定特定算法复杂度；若输入已经保证有序，可省略排序但仍应保留该前置条件说明。</p>
<p>几百个视频片段通常适合这种方案；每秒不断插入大量区间时，可以批量合并或采用有序结构，避免每次重新处理全量数据。外部输入要限制规模，不能因为算法简单就接受无限数组。</p>
<p>所有端点应使用统一单位和时间基准。毫秒时间戳与视频秒数不能混用；跨时区日程应先转换为同一瞬间表示。浮点误差是否允许把两个很接近的片段合并属于业务规则，不应偷偷加入任意 epsilon。需要精确统计时可使用业务约定的整数刻度，并限制在安全整数范围内。</p>
<p>合并会丢失原始片段的身份与数量。求总覆盖时这是优点；判断哪两位用户的日程冲突、统计同时在线数量或恢复原始事件时，单靠合并结果不够，需要保留来源或使用扫描线等方法。</p>
<h2>验证哪些性质</h2>
<p>检查乱序、重复、嵌套、相邻、空数组和非法端点。输出应有序，并且不存在符合当前合并规则的相邻结果；再次合并输出应保持不变。对小整数区间，还可以逐格标记输入和输出的覆盖集合并比较，避免测试只是照着实现再写一遍。</p>`};export{e as default};