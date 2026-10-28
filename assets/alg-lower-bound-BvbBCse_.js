var e={answerHtml:`<p>视频播放器保存了已排序的章节起点。用户跳到第 25 秒时，需要找到下一个章节，或者找到当前所属章节。此时搜索“是否存在 25”通常不够：即使没有恰好相等的时间，也需要返回一个边界位置。</p>
<p>lower bound 返回第一个大于或等于目标值的索引。如果所有值都小于目标，返回数组长度。这个约定同时覆盖插入位置、重复值的左边界和不存在相等元素的情况。</p>
<h2>用一条不变量解释整个循环</h2>
<p>下面约定输入为升序排列的有限数值数组，允许重复值。区间采用 <code>[left, right)</code>，right 初始值等于 length，不是最后一个下标。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">lowerBound</span>(<span class="hljs-params">values, target</span>) {
  <span class="hljs-keyword">let</span> left = <span class="hljs-number">0</span>;
  <span class="hljs-keyword">let</span> right = values.<span class="hljs-property">length</span>;
  <span class="hljs-keyword">while</span> (left &lt; right) {
    <span class="hljs-keyword">const</span> middle = left + <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">floor</span>((right - left) / <span class="hljs-number">2</span>);
    <span class="hljs-keyword">if</span> (values[middle] &lt; target) {
      left = middle + <span class="hljs-number">1</span>;
    } <span class="hljs-keyword">else</span> {
      right = middle;
    }
  }
  <span class="hljs-keyword">return</span> left;
}

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">lowerBound</span>([<span class="hljs-number">10</span>, <span class="hljs-number">20</span>, <span class="hljs-number">20</span>, <span class="hljs-number">40</span>], <span class="hljs-number">20</span>)); <span class="hljs-comment">// 1</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">lowerBound</span>([<span class="hljs-number">10</span>, <span class="hljs-number">20</span>, <span class="hljs-number">20</span>, <span class="hljs-number">40</span>], <span class="hljs-number">25</span>)); <span class="hljs-comment">// 3</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">lowerBound</span>([<span class="hljs-number">10</span>, <span class="hljs-number">20</span>, <span class="hljs-number">20</span>, <span class="hljs-number">40</span>], <span class="hljs-number">50</span>)); <span class="hljs-comment">// 4</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">lowerBound</span>([], <span class="hljs-number">20</span>)); <span class="hljs-comment">// 0</span>
</code></pre></div>
<p>每轮循环保持：left 左边的值都小于 target，right 及其右边的值都大于或等于 target，尚未排除的候选位于两者之间。</p>
<p>当中点小于目标，中点也不可能是答案，所以 left 跳到 middle + 1；否则中点仍可能是第一个满足条件的位置，保留它作为新的右边界。每轮都缩小区间，直到 left 等于 right，此时边界唯一。</p>
<p>在 <code>[10,20,20,40]</code> 中查 20，第一次中点为 2，值等于目标，于是 right 变为 2。继续向左缩小，最终落在索引 1。若一遇到相等就返回，就只能找到某一个 20，无法保证是第一个。</p>
<h2>查找下一个章节和当前章节不是同一个问题</h2>
<p>lowerBound 可以找“不早于当前时间”的章节，但当前正在播放的章节通常需要“最后一个不大于当前时间”的起点。可以先求 upper bound，即第一个严格大于目标的位置，再减一。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">upperBound</span>(<span class="hljs-params">values, target</span>) {
  <span class="hljs-keyword">let</span> left = <span class="hljs-number">0</span>;
  <span class="hljs-keyword">let</span> right = values.<span class="hljs-property">length</span>;
  <span class="hljs-keyword">while</span> (left &lt; right) {
    <span class="hljs-keyword">const</span> middle = left + <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">floor</span>((right - left) / <span class="hljs-number">2</span>);
    <span class="hljs-keyword">if</span> (values[middle] &lt;= target) left = middle + <span class="hljs-number">1</span>;
    <span class="hljs-keyword">else</span> right = middle;
  }
  <span class="hljs-keyword">return</span> left;
}

<span class="hljs-keyword">const</span> starts = [<span class="hljs-number">0</span>, <span class="hljs-number">10</span>, <span class="hljs-number">20</span>, <span class="hljs-number">40</span>];
<span class="hljs-keyword">const</span> current = <span class="hljs-title function_">upperBound</span>(starts, <span class="hljs-number">25</span>) - <span class="hljs-number">1</span>;
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(current); <span class="hljs-comment">// 2，对应第 20 秒开始的章节</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">upperBound</span>([<span class="hljs-number">10</span>, <span class="hljs-number">20</span>, <span class="hljs-number">20</span>, <span class="hljs-number">40</span>], <span class="hljs-number">20</span>) - <span class="hljs-title function_">lowerBound</span>([<span class="hljs-number">10</span>, <span class="hljs-number">20</span>, <span class="hljs-number">20</span>, <span class="hljs-number">40</span>], <span class="hljs-number">20</span>)); <span class="hljs-comment">// 2</span>
</code></pre></div>
<p>如果播放时间早于第一个起点，current 为 -1，调用方应显示“尚未开始”，不能直接访问数组。若下一章节索引等于 length，表示后面没有章节。两个边界相减还能得到重复值数量，不需要逐项扫描这段重复区间。</p>
<h2>O(log n) 有前提</h2>
<p>输入必须已经有序，并且比较规则在查询期间保持一致。算法不会自动修复乱序，遇到 NaN 时比较也不再符合预期。外部数据应在进入索引时检查类型、有限性和排序；每次查询前都扫描校验或重新排序，总成本就不再只是 O(log n)。</p>
<p>JavaScript 的默认 sort 按字符串比较，数值排序需要明确比较函数，例如 <code>[...values].sort((a, b) =&gt; a - b)</code>。不要在每次指针移动时重建排序数组；可以在数据版本变化时重建索引，然后多次查询。若搜索时数据被异步替换，结果必须与对应数据快照一起使用。</p>
<p>不要直接用 <code>(left + right) &gt;&gt; 1</code> 求中点。JavaScript 位运算会转为 32 位整数，大索引下可能截断或变负。Math.floor 不依赖这类 32 位转换。示例假定正常数组索引和有限数值，不是适用于任意超大 BigInt 索引的通用实现。</p>
<h2>性能收益与业务边界</h2>
<p>二分定位是 O(log n) 时间、O(1) 额外空间，但向普通数组中间插入仍可能移动大量元素。它只加速寻找位置，不会让更新整个结构也变成对数复杂度。小数组上直接遍历可能更简单，应结合查询频率和数据量选择。</p>
<p>用户输入的大数组应在入口限制容量；算法快不代表接收、复制和排序任意数据都便宜。时间戳还应统一单位，不能把毫秒数组与秒级 target 比较。音视频浮点时间是否允许误差，需要业务明确规则，不能随意在比较中加一个 epsilon 改变边界语义。</p>
<h2>如何验证</h2>
<p>除了几个固定输出，可以用线性扫描作为独立参照：随机生成有序数组，比较 lowerBound 与第一个满足 <code>value &gt;= target</code> 的位置；未命中时使用 length。覆盖空数组、全部相等、目标小于最小值、大于最大值、负数和重复区间。再验证返回位置左侧严格小于目标、右侧大于或等于目标，这比只测一个命中例子更能发现边界错误。</p>
<p>本题是教学实现，参考资料用于理解二分算法和 JavaScript 数值语义，并非某个库的官方代码。</p>
<h2>补充参考</h2>
<ul>
<li><a href="https://cp-algorithms.com/num_methods/binary_search.html">CP-Algorithms · Binary Search</a></li>
<li><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort">MDN · Array.sort</a></li>
<li><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/isSafeInteger">MDN · Number.isSafeInteger</a></li>
</ul>`};export{e as default};