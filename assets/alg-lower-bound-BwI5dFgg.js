var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>我会写两个函数。<code>lowerBound</code> 返回第一个 <code>&gt;= target</code> 的下标，<code>upperBound</code> 返回第一个 <code>&gt; target</code> 的下标。目标比所有元素都大，就返回数组长度；空数组返回 0。</p>
<p>搜索区间用左闭右开 <code>[left, right)</code>，<code>right</code> 一开始是 <code>values.length</code>，循环条件是 <code>left &lt; right</code>。这样写，空数组和“插在最后面”这两种情况都不用单独处理。</p>
<p>有重复值时，<code>lowerBound</code> 正好落在第一个重复值上，<code>upperBound - lowerBound</code> 就是重复了几个。放到视频章节上，章节按开始时间排好序，当前播放到第 t 秒，所在章节就是 <code>upperBound(starts, t) - 1</code>，结果是 -1 说明还没进第一章。</p>
<p>中点要写成 <code>left + Math.floor((right - left) / 2)</code>。<code>(left + right) &gt;&gt; 1</code> 看起来更短，但 <code>left + right</code> 超过 2³¹ − 1 时，位运算会先转成 32 位整数，结果就错了。</p>
</blockquote>
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
<p>找 20，有两个 20，返回的是第一个的下标 1。找 25，没有，返回的是它应该插入的位置 3。找 50，比所有都大，返回长度 4。空数组根本不进循环，直接返回 0。</p>
<p>怎么确信它是对的？抓住一句话：<code>left</code> 左边的元素都 <code>&lt; target</code>，<code>right</code> 和它右边的元素都 <code>&gt;= target</code>。这叫循环不变量，也就是每一轮循环前后都成立的条件。</p>
<p>一开始 <code>left</code> 左边什么都没有，<code>right</code> 右边也什么都没有，条件自然成立。每一轮，如果 <code>values[middle] &lt; target</code>，说明 <code>middle</code> 也属于左边，<code>left</code> 移到 <code>middle + 1</code>；否则 <code>middle</code> 属于右边，<code>right</code> 移到 <code>middle</code>。两种情况条件都还成立，而且区间至少缩小一格。等到 <code>left === right</code>，它就是左右两边的分界点，也就是第一个 <code>&gt;= target</code> 的位置。</p>
<h2>upperBound 和章节定位</h2>
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
<p>和 <code>lowerBound</code> 比，只差了一个符号：<code>&lt;</code> 换成了 <code>&lt;=</code>。等于目标的元素也被归到左边了，所以停下来的位置是第一个大于目标的。</p>
<p>为什么章节定位用 <code>upperBound</code> 再减 1？播放到第 25 秒，第一个开始时间大于 25 的章节是下标 3（第 40 秒），往前一个就是当前章节，下标 2。正好播到第 20 秒时，用 <code>upperBound</code> 能把“刚好开始”的那一章算进来，结果还是 2。如果换成 <code>lowerBound</code>，会找到下标 2 再减 1 变成 1，就错了。</p>
<p>实测用 2000 组随机的有序数组，和线性查找的结果对比，全部一致。</p>
<h2>容易写错的地方</h2>
<table><thead><tr><th>写法</th><th>问题</th></tr></thead><tbody><tr><td><code>right = values.length - 1</code> 配合 <code>left &lt; right</code></td><td>永远不会返回 <code>values.length</code>，目标比所有元素都大时结果错误</td></tr><tr><td>找到相等元素就直接返回</td><td>有重复值时返回的位置不确定</td></tr><tr><td><code>left = middle</code>（左闭右开写法里）</td><td>区间可能不再缩小，陷入死循环</td></tr><tr><td>对未排序的数组使用</td><td>结果没有意义，二分的前提是有序</td></tr></tbody></table>
<h2>常见追问</h2>
<p><strong>时间复杂度是多少？</strong></p>
<blockquote>
<p>O(log n)。一百万个元素，最多比较 20 次左右。</p>
</blockquote>
<p><strong>数组里是对象怎么办？</strong></p>
<blockquote>
<p>把比较换成一个函数传进来，比如 <code>(item) =&gt; item.start &lt; target</code>，其他逻辑不变。</p>
</blockquote>
<p><strong>数组要频繁插入怎么办？</strong></p>
<blockquote>
<p>有序数组每插一个，后面的元素都要往后挪，代价是 O(n)。插入很频繁的话，考虑平衡树或者跳表。区间合并里的应用见<a href="/questions/alg-merge-intervals/">《如何合并时间区间？相邻区间算不算重叠？》</a>。</p>
</blockquote>`};export{e as default};