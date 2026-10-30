var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>视频有几个章节，开始时间分别是 0、10、20、40 秒，进度条拖到第 25 秒，要高亮“第 3 章”。章节可能有几百个，播放时每秒都要算，所以不逐个比较，而是在开始时间数组上做二分。</p>
<p>当前章节是“开始时间小于等于 t 的最后一个章节”。换个说法，先找第一个开始时间大于 t 的章节，也就是 <code>upperBound(starts, t)</code>，它前面那一个就是答案，所以结果是 <code>upperBound(starts, t) - 1</code>。</p>
<p>几个业务边界都能直接从这个式子读出来。正好播到某章开头，这一章算进来；t 小于第一章的开始时间，或者章节列表是空的，结果是 -1，界面上就不高亮任何章节；t 超过最后一章的开始时间，结果是最后一章。</p>
<p>要注意数据里可能有两个章节开始时间相同，比如编辑器里误加了一个空章节。这时减 1 落在靠后的那一章，前一章长度为 0，永远不会被高亮。二分边界的通用写法和左闭右开模板见<a href="/questions/ds-binary-search-variants/">《二分查找有哪些常见变体？怎样找边界、在旋转数组里查找？》</a>。</p>
</blockquote>
<h2>定位当前章节</h2>
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

<span class="hljs-keyword">function</span> <span class="hljs-title function_">currentChapter</span>(<span class="hljs-params">starts, seconds</span>) {
  <span class="hljs-keyword">return</span> <span class="hljs-title function_">upperBound</span>(starts, seconds) - <span class="hljs-number">1</span>;
}

<span class="hljs-keyword">const</span> starts = [<span class="hljs-number">0</span>, <span class="hljs-number">10</span>, <span class="hljs-number">20</span>, <span class="hljs-number">40</span>]; <span class="hljs-comment">// 各章节开始的秒数</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">currentChapter</span>(starts, <span class="hljs-number">25</span>)); <span class="hljs-comment">// 2，第 20 秒开始的章节</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">currentChapter</span>(starts, <span class="hljs-number">20</span>)); <span class="hljs-comment">// 2，正好在章节开头</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">currentChapter</span>(starts, <span class="hljs-number">99</span>)); <span class="hljs-comment">// 3，最后一章</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">currentChapter</span>([<span class="hljs-number">5</span>, <span class="hljs-number">10</span>], <span class="hljs-number">3</span>)); <span class="hljs-comment">// -1，还没进第一章</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">currentChapter</span>([], <span class="hljs-number">3</span>)); <span class="hljs-comment">// -1，没有章节</span>
</code></pre></div>
<p><code>upperBound</code> 返回第一个大于目标的位置，等于目标的元素被归到左边，所以“正好在第 20 秒”也会越过下标 2，停在下标 3，减 1 后仍然是第 20 秒开始的那一章。如果换成找第一个大于等于目标的位置，会停在下标 2，减 1 变成 1，正好在开头时就会显示成上一章。</p>
<p>为什么空数组不用特殊判断？<code>right</code> 一开始就是 0，不进循环，返回 0，减 1 得到 -1，和“还没进第一章”是同一个结果。界面只要处理 -1 一种情况。</p>
<h2>开始时间重复时会怎样</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> withEmpty = [<span class="hljs-number">0</span>, <span class="hljs-number">10</span>, <span class="hljs-number">10</span>, <span class="hljs-number">30</span>]; <span class="hljs-comment">// 下标 1 是一个误加的空章节</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">currentChapter</span>(withEmpty, <span class="hljs-number">10</span>)); <span class="hljs-comment">// 2</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">currentChapter</span>(withEmpty, <span class="hljs-number">15</span>)); <span class="hljs-comment">// 2</span>
</code></pre></div>
<p>两个章节都从第 10 秒开始，<code>upperBound</code> 会越过所有等于 10 的元素，所以减 1 总是落在靠后的下标 2。下标 1 那一章的时长是 0，任何进度都不会选中它。</p>
<p>这通常符合预期，但要和产品确认。如果希望显示的是靠前那一章，或者希望在保存时就提示“章节开始时间重复”，应该在录入章节时校验，而不是在播放时改二分的写法。</p>
<p>开始时间没排序的话，二分的结果没有意义。章节数据从接口来时，最好在拿到后先按开始时间排序一次，之后每次定位都是 O(log n)。</p>
<h2>常见追问</h2>
<p><strong>拖动进度条时每帧都算一次，会不会太慢？</strong></p>
<blockquote>
<p>不会。O(log n) 意味着一千个章节最多比较 10 次左右。正常播放时，还可以先检查 t 是否仍在当前章节范围内，在的话直接复用上次的结果，只有跳出范围才重新二分。</p>
</blockquote>
<p><strong>章节是对象数组怎么办？</strong></p>
<blockquote>
<p>把比较换成读字段，比如 <code>chapters[middle].start &lt;= target</code>，其他逻辑不变。</p>
</blockquote>
<p><strong>章节要频繁插入怎么办？</strong></p>
<blockquote>
<p>有序数组每插一个，后面的元素都要往后挪，代价是 O(n)。章节数量通常只有几十个，直接插入再排序就够了。区间合并里的应用见<a href="/questions/alg-merge-intervals/">《如何合并时间区间？相邻区间算不算重叠？》</a>。</p>
</blockquote>`};export{e as default};