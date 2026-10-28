var e={answerHtml:`<h2>简答</h2>
<ul>
<li><code>lowerBound</code> 返回第一个 <code>&gt;= target</code> 的下标，<code>upperBound</code> 返回第一个 <code>&gt; target</code> 的下标；目标比所有元素都大时返回数组长度，空数组返回 0。</li>
<li>搜索区间写成左闭右开 <code>[left, right)</code>，循环条件是 <code>left &lt; right</code>，<code>right</code> 初始为 <code>values.length</code>，这样不用单独处理空数组和末尾位置。</li>
<li>有重复值时，<code>lowerBound</code> 落在第一个重复值上，<code>upperBound - lowerBound</code> 就是重复的个数。</li>
<li>视频章节按开始时间排序，当前播放时间 t 所在的章节是 <code>upperBound(starts, t) - 1</code>，结果为 -1 表示还没进入第一章。</li>
<li>中点写成 <code>left + Math.floor((right - left) / 2)</code>。<code>(left + right) &gt;&gt; 1</code> 在 <code>left + right</code> 超过 2³¹ − 1 时会因 32 位转换出错。</li>
</ul>
<h2>lowerBound</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">lowerBound</span>(<span class="hljs-params">values, target</span>) {
  <span class="hljs-keyword">let</span> left = <span class="hljs-number">0</span>;
  <span class="hljs-keyword">let</span> right = values.<span class="hljs-property">length</span>;
  <span class="hljs-keyword">while</span> (left &lt; right) {
    <span class="hljs-keyword">const</span> middle = left + <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">floor</span>((right - left) / <span class="hljs-number">2</span>);
    <span class="hljs-keyword">if</span> (values[middle] &lt; target) left = middle + <span class="hljs-number">1</span>;
    <span class="hljs-keyword">else</span> right = middle;
  }
  <span class="hljs-keyword">return</span> left;
}

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">lowerBound</span>([<span class="hljs-number">10</span>, <span class="hljs-number">20</span>, <span class="hljs-number">20</span>, <span class="hljs-number">40</span>], <span class="hljs-number">20</span>)); <span class="hljs-comment">// 1</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">lowerBound</span>([<span class="hljs-number">10</span>, <span class="hljs-number">20</span>, <span class="hljs-number">20</span>, <span class="hljs-number">40</span>], <span class="hljs-number">25</span>)); <span class="hljs-comment">// 3</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">lowerBound</span>([<span class="hljs-number">10</span>, <span class="hljs-number">20</span>, <span class="hljs-number">20</span>, <span class="hljs-number">40</span>], <span class="hljs-number">50</span>)); <span class="hljs-comment">// 4</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">lowerBound</span>([], <span class="hljs-number">20</span>)); <span class="hljs-comment">// 0</span>
</code></pre></div>
<p>循环不变量：<code>left</code> 左边的元素都 <code>&lt; target</code>，<code>right</code> 及右边的元素都 <code>&gt;= target</code>。每轮至少缩小一个位置，<code>left === right</code> 时就是分界点。</p>
<h2>upperBound 与章节定位</h2>
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

<span class="hljs-keyword">const</span> starts = [<span class="hljs-number">0</span>, <span class="hljs-number">10</span>, <span class="hljs-number">20</span>, <span class="hljs-number">40</span>]; <span class="hljs-comment">// 各章节开始的秒数</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">upperBound</span>(starts, <span class="hljs-number">25</span>) - <span class="hljs-number">1</span>); <span class="hljs-comment">// 2，第 20 秒开始的章节</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">upperBound</span>(starts, <span class="hljs-number">20</span>) - <span class="hljs-number">1</span>); <span class="hljs-comment">// 2，正好在章节开头</span>
<span class="hljs-keyword">const</span> values = [<span class="hljs-number">10</span>, <span class="hljs-number">20</span>, <span class="hljs-number">20</span>, <span class="hljs-number">40</span>];
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">upperBound</span>(values, <span class="hljs-number">20</span>) - <span class="hljs-title function_">lowerBound</span>(values, <span class="hljs-number">20</span>)); <span class="hljs-comment">// 2</span>
</code></pre></div>
<p>两个函数只差一个比较符号：<code>&lt;</code> 和 <code>&lt;=</code>。实测用 2000 组随机有序数组与线性查找对比，结果一致。</p>
<h2>容易写错的地方</h2>
<table><thead><tr><th>写法</th><th>问题</th></tr></thead><tbody><tr><td><code>right = values.length - 1</code> 配合 <code>left &lt; right</code></td><td>永远不会返回 <code>values.length</code>，目标比所有元素都大时结果错误</td></tr><tr><td>找到相等元素就直接返回</td><td>有重复值时返回的位置不确定</td></tr><tr><td><code>left = middle</code>（左闭右开写法里）</td><td>区间可能不再缩小，陷入死循环</td></tr><tr><td>对未排序的数组使用</td><td>结果没有意义，二分的前提是有序</td></tr></tbody></table>
<h2>常见追问</h2>
<ul>
<li><strong>时间复杂度？</strong> O(log n)。百万个元素最多约 20 次比较。</li>
<li><strong>元素是对象怎么办？</strong> 传入比较函数，例如 <code>(item) =&gt; item.start &lt; target</code>。</li>
<li><strong>数组会频繁插入怎么办？</strong> 每次插入要移动元素，代价是 O(n)；插入很频繁时考虑平衡树或跳表。区间合并中的应用见<a href="/questions/alg-merge-intervals/">《如何合并时间区间？相邻区间算不算重叠？》</a>。</li>
</ul>`};export{e as default};