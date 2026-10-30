var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>双指针就是用两个下标在同一个数组上一起移动。比如“把数组里的 0 都挪到末尾，其他数保持原来的顺序”，用一个指针往前扫，另一个指针记住下一个非零数该放的位置，扫一遍就完成，不用每遇到一个 0 就把后面的元素整体挪一格。</p>
<p>它能省时间，是因为每一步都能根据当前的情况排除掉一批不用再看的组合，两个指针都只往一个方向走、不回头，总共只走 O(n) 步。</p>
<p>常见题型分两种。快慢指针同向走，用来原地整理数组，比如移动零、有序数组去重。左右指针从两头往中间走，用来在有序数组或首尾之间找答案，比如盛水最多的容器、有序数组的两数之和、三数之和、判断回文串。</p>
<p>要注意，左右指针往往依赖数组有序，三数之和就得先排序。排序本身是 O(n log n)，JavaScript 的 <code>sort</code> 默认按字符串比较，排数字一定要传比较函数。三数之和还要在固定的数和左右指针三处都跳过重复值，否则结果里会有重复的三元组。</p>
</blockquote>
<h2>快慢指针：移动零</h2>
<p><code>fast</code> 往前扫每一个元素，<code>slow</code> 指向下一个非零数该放的位置。看循环里只在遇到非零数时才交换、才让 <code>slow</code> 前进。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">moveZeroes</span>(<span class="hljs-params">nums</span>) {
  <span class="hljs-keyword">let</span> slow = <span class="hljs-number">0</span>;
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">let</span> fast = <span class="hljs-number">0</span>; fast &lt; nums.<span class="hljs-property">length</span>; fast++) {
    <span class="hljs-keyword">if</span> (nums[fast] !== <span class="hljs-number">0</span>) {
      [nums[slow], nums[fast]] = [nums[fast], nums[slow]];
      slow++;
    }
  }
  <span class="hljs-keyword">return</span> nums;
}

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">moveZeroes</span>([<span class="hljs-number">0</span>, <span class="hljs-number">1</span>, <span class="hljs-number">0</span>, <span class="hljs-number">3</span>, <span class="hljs-number">12</span>]).<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;,&#x27;</span>)); <span class="hljs-comment">// 1,3,12,0,0</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">moveZeroes</span>([<span class="hljs-number">0</span>, <span class="hljs-number">0</span>, <span class="hljs-number">1</span>]).<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;,&#x27;</span>)); <span class="hljs-comment">// 1,0,0</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">moveZeroes</span>([<span class="hljs-number">1</span>, <span class="hljs-number">2</span>]).<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;,&#x27;</span>)); <span class="hljs-comment">// 1,2</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">moveZeroes</span>([]).<span class="hljs-property">length</span>); <span class="hljs-comment">// 0</span>
</code></pre></div>
<p>为什么非零数的相对顺序不会乱？<code>slow</code> 左边始终是已经按原顺序排好的非零数，<code>fast</code> 每遇到一个非零数，就把它换到 <code>slow</code> 的位置。<code>slow</code> 和 <code>fast</code> 之间的都是 0，所以交换只是把一个 0 换到后面去。没有 0 的时候 <code>slow</code> 和 <code>fast</code> 一直相等，交换的是元素自己，结果不变。</p>
<p>交换用的是解构赋值 <code>[a, b] = [b, a]</code>，不需要临时变量。</p>
<h2>左右指针：盛水最多的容器</h2>
<p>题目给一组高度，任选两根柱子和 x 轴围成容器，求最多能装多少水。容量等于矮的那根乘以两根之间的距离。看指针每次移动的是哪一边。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">maxArea</span>(<span class="hljs-params">height</span>) {
  <span class="hljs-keyword">let</span> left = <span class="hljs-number">0</span>;
  <span class="hljs-keyword">let</span> right = height.<span class="hljs-property">length</span> - <span class="hljs-number">1</span>;
  <span class="hljs-keyword">let</span> best = <span class="hljs-number">0</span>;
  <span class="hljs-keyword">while</span> (left &lt; right) {
    <span class="hljs-keyword">const</span> area = <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">min</span>(height[left], height[right]) * (right - left);
    best = <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">max</span>(best, area);
    <span class="hljs-keyword">if</span> (height[left] &lt; height[right]) left++;
    <span class="hljs-keyword">else</span> right--;
  }
  <span class="hljs-keyword">return</span> best;
}

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">maxArea</span>([<span class="hljs-number">1</span>, <span class="hljs-number">8</span>, <span class="hljs-number">6</span>, <span class="hljs-number">2</span>, <span class="hljs-number">5</span>, <span class="hljs-number">4</span>, <span class="hljs-number">8</span>, <span class="hljs-number">3</span>, <span class="hljs-number">7</span>])); <span class="hljs-comment">// 49</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">maxArea</span>([<span class="hljs-number">1</span>, <span class="hljs-number">1</span>])); <span class="hljs-comment">// 1</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">maxArea</span>([<span class="hljs-number">4</span>, <span class="hljs-number">3</span>, <span class="hljs-number">2</span>, <span class="hljs-number">1</span>, <span class="hljs-number">4</span>])); <span class="hljs-comment">// 16</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">maxArea</span>([<span class="hljs-number">5</span>])); <span class="hljs-comment">// 0</span>
</code></pre></div>
<p>为什么每次移动矮的那一边就够了？假设左边比右边矮。左边这根柱子跟右边任何一根更靠里的柱子配对，距离都更短，高度又不会超过左边这根，所以容量不可能超过当前值。这些组合全都可以排除，左指针放心右移。移动高的那一边则没有这个保证，可能错过答案。</p>
<p>第一个例子里，下标 1（高 8）和下标 8（高 7）之间距离 7，容量 <code>7 × 7 = 49</code>。<code>[4, 3, 2, 1, 4]</code> 的答案来自首尾两根，<code>4 × 4 = 16</code>。只有一根柱子时循环不执行，结果是 0。</p>
<h2>三数之和：排序后固定一个，再用左右指针</h2>
<p>题目要找出所有和为 0 且不重复的三元组。先排序，然后固定第一个数 <code>sorted[i]</code>，在它右边用左右指针找另外两个数。重点看三处跳过重复值的地方。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">threeSum</span>(<span class="hljs-params">nums</span>) {
  <span class="hljs-keyword">const</span> sorted = [...nums].<span class="hljs-title function_">sort</span>(<span class="hljs-function">(<span class="hljs-params">a, b</span>) =&gt;</span> a - b);
  <span class="hljs-keyword">const</span> result = [];
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">let</span> i = <span class="hljs-number">0</span>; i &lt; sorted.<span class="hljs-property">length</span> - <span class="hljs-number">2</span>; i++) {
    <span class="hljs-keyword">if</span> (sorted[i] &gt; <span class="hljs-number">0</span>) <span class="hljs-keyword">break</span>;
    <span class="hljs-keyword">if</span> (i &gt; <span class="hljs-number">0</span> &amp;&amp; sorted[i] === sorted[i - <span class="hljs-number">1</span>]) <span class="hljs-keyword">continue</span>;
    <span class="hljs-keyword">let</span> left = i + <span class="hljs-number">1</span>;
    <span class="hljs-keyword">let</span> right = sorted.<span class="hljs-property">length</span> - <span class="hljs-number">1</span>;
    <span class="hljs-keyword">while</span> (left &lt; right) {
      <span class="hljs-keyword">const</span> sum = sorted[i] + sorted[left] + sorted[right];
      <span class="hljs-keyword">if</span> (sum &lt; <span class="hljs-number">0</span>) left++;
      <span class="hljs-keyword">else</span> <span class="hljs-keyword">if</span> (sum &gt; <span class="hljs-number">0</span>) right--;
      <span class="hljs-keyword">else</span> {
        result.<span class="hljs-title function_">push</span>([sorted[i], sorted[left], sorted[right]]);
        <span class="hljs-keyword">while</span> (left &lt; right &amp;&amp; sorted[left] === sorted[left + <span class="hljs-number">1</span>]) left++;
        <span class="hljs-keyword">while</span> (left &lt; right &amp;&amp; sorted[right] === sorted[right - <span class="hljs-number">1</span>]) right--;
        left++;
        right--;
      }
    }
  }
  <span class="hljs-keyword">return</span> result;
}

<span class="hljs-keyword">const</span> <span class="hljs-title function_">show</span> = (<span class="hljs-params">triples</span>) =&gt; <span class="hljs-title class_">JSON</span>.<span class="hljs-title function_">stringify</span>(triples);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">show</span>(<span class="hljs-title function_">threeSum</span>([-<span class="hljs-number">1</span>, <span class="hljs-number">0</span>, <span class="hljs-number">1</span>, <span class="hljs-number">2</span>, -<span class="hljs-number">1</span>, -<span class="hljs-number">4</span>]))); <span class="hljs-comment">// [[-1,-1,2],[-1,0,1]]</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">show</span>(<span class="hljs-title function_">threeSum</span>([<span class="hljs-number">0</span>, <span class="hljs-number">0</span>, <span class="hljs-number">0</span>, <span class="hljs-number">0</span>]))); <span class="hljs-comment">// [[0,0,0]]</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">show</span>(<span class="hljs-title function_">threeSum</span>([-<span class="hljs-number">2</span>, <span class="hljs-number">0</span>, <span class="hljs-number">0</span>, <span class="hljs-number">2</span>, <span class="hljs-number">2</span>]))); <span class="hljs-comment">// [[-2,0,2]]</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">show</span>(<span class="hljs-title function_">threeSum</span>([<span class="hljs-number">0</span>, <span class="hljs-number">1</span>, <span class="hljs-number">1</span>]))); <span class="hljs-comment">// []</span>
</code></pre></div>
<p>为什么要先排序？排好序以后，和太小就让左指针右移换一个更大的数，和太大就让右指针左移换一个更小的数，每一步都知道往哪边走。固定一个数以后内层只要 O(n)，外层循环 n 次，整体 O(n²)，比暴力枚举三层循环的 O(n³) 快。</p>
<p>为什么比较函数不能省？MDN 说明，不传比较函数时，<code>sort</code> 会把元素转成字符串、按 UTF-16 编码单元排序，在 Node.js 22.23 里 <code>[-1, -4, 2].sort()</code> 的结果还是 <code>[-1, -4, 2]</code>，因为字符串“-1”排在“-4”前面。这里还用 <code>[...nums]</code> 复制了一份，因为 <code>sort</code> 会原地修改数组。</p>
<p>去重分三处。外层 <code>sorted[i] === sorted[i - 1]</code> 时跳过，因为同一个值作为第一个数已经找过了。找到一组答案后，左右指针各自跳过和当前值相同的数，否则 <code>[-2, 0, 0, 2, 2]</code> 会把 <code>[-2, 0, 2]</code> 记两次。<code>sorted[i] &gt; 0</code> 时直接结束，因为后面的数都不小于它，三个正数加起来不可能是 0。</p>
<h2>边界用例怎么验证</h2>
<p>上面三段代码另外用随机数组跟暴力解法做了对比：在 Node.js 22.23 里跑了一遍：生成 3000 组长度 0 到 8、元素在 -4 到 4 之间的数组，移动零对比“过滤非零数再补 0”的结果，盛水容器对比两层循环，三数之和对比三层循环加 Set 去重，结果全部一致。空数组、全是 0、只有一个元素、全是重复值这些情况都在随机范围里覆盖到了。</p>
<h2>常见追问</h2>
<p><strong>双指针和滑动窗口是什么关系？</strong></p>
<blockquote>
<p>滑动窗口是同向双指针的一种，两个指针之间夹着一段连续区间，右指针扩张、左指针收缩。见<a href="/questions/ds-sliding-window/">《滑动窗口怎样求无重复字符的最长子串？》</a>。</p>
</blockquote>
<p><strong>两数之和为什么一般用哈希表，不用双指针？</strong></p>
<blockquote>
<p>原题要返回下标，数组又是无序的。排序会打乱下标，要额外记录原始位置，还多出 O(n log n)。用 Map 一次遍历就是 O(n)，见<a href="/questions/ds-two-sum-hash/">《两数之和怎样从 O(n²) 优化到 O(n)？哈希表在算法题里怎么用？》</a>。如果题目给的就是有序数组，左右指针不需要额外空间，更合适。</p>
</blockquote>
<p><strong>有序数组怎么原地去重？</strong></p>
<blockquote>
<p>还是快慢指针。<code>slow</code> 指向最后一个保留的元素，<code>fast</code> 往前扫，遇到和 <code>nums[slow]</code> 不同的数，就让 <code>slow</code> 前进一格并把这个数写过去。最后前 <code>slow + 1</code> 个元素就是去重后的结果。</p>
</blockquote>`};export{e as default};