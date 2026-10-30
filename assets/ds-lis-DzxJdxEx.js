var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>给一个数组 <code>[10, 9, 2, 5, 3, 7, 101, 18]</code>，从里面挑出一些数，顺序不变，而且严格递增，最多能挑几个？答案是 4，比如 <code>2, 3, 7, 101</code>。这就是最长递增子序列，LeetCode 300 题。</p>
<p>动态规划写法是 O(n²)。更快的做法用一个 <code>tails</code> 数组，<code>tails[k]</code> 记录“长度为 k+1 的递增子序列里，最小的结尾是多少”。结尾越小，后面越容易接上新的数。每来一个数，如果比 <code>tails</code> 里所有数都大，就追加到末尾，最长长度加 1；否则用二分找到第一个大于等于它的位置，把那里换成它。<code>tails</code> 始终是递增的，所以能二分，总共 O(n log n)。</p>
<p>要注意，<code>tails</code> 的长度是答案，但 <code>tails</code> 本身不一定是一个真实存在的子序列，因为替换会把后来的数放到前面。要还原出具体的子序列，得额外记一个数组，保存每个数接在谁后面，最后从末尾往回找。</p>
<p>Vue 3 的 diff 用的就是带还原的版本。列表中间乱序的部分，它把新节点在旧列表里的位置排成一个数组，求出最长递增子序列。这些节点之间的先后顺序没变，可以不动，只移动其余的节点，这样移动的次数最少。</p>
</blockquote>
<h2>只求长度</h2>
<p>下面的 <code>lengthOfLIS</code> 只返回长度，二分用的是左闭右开区间。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">lengthOfLIS</span>(<span class="hljs-params">nums</span>) {
  <span class="hljs-keyword">const</span> tails = [];
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> num <span class="hljs-keyword">of</span> nums) {
    <span class="hljs-keyword">let</span> left = <span class="hljs-number">0</span>;
    <span class="hljs-keyword">let</span> right = tails.<span class="hljs-property">length</span>;
    <span class="hljs-comment">// 找第一个 &gt;= num 的位置；用 &gt;= 而不是 &gt;，保证序列严格递增。</span>
    <span class="hljs-keyword">while</span> (left &lt; right) {
      <span class="hljs-keyword">const</span> mid = left + <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">floor</span>((right - left) / <span class="hljs-number">2</span>);
      <span class="hljs-keyword">if</span> (tails[mid] &lt; num) left = mid + <span class="hljs-number">1</span>;
      <span class="hljs-keyword">else</span> right = mid;
    }
    tails[left] = num;
  }
  <span class="hljs-keyword">return</span> tails.<span class="hljs-property">length</span>;
}

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">lengthOfLIS</span>([<span class="hljs-number">10</span>, <span class="hljs-number">9</span>, <span class="hljs-number">2</span>, <span class="hljs-number">5</span>, <span class="hljs-number">3</span>, <span class="hljs-number">7</span>, <span class="hljs-number">101</span>, <span class="hljs-number">18</span>])); <span class="hljs-comment">// 4</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">lengthOfLIS</span>([<span class="hljs-number">0</span>, <span class="hljs-number">1</span>, <span class="hljs-number">0</span>, <span class="hljs-number">3</span>, <span class="hljs-number">2</span>, <span class="hljs-number">3</span>])); <span class="hljs-comment">// 4</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">lengthOfLIS</span>([<span class="hljs-number">7</span>, <span class="hljs-number">7</span>, <span class="hljs-number">7</span>, <span class="hljs-number">7</span>])); <span class="hljs-comment">// 1</span>
</code></pre></div>
<p>拿第一组数据走一遍。<code>10</code> 进来，<code>tails</code> 是 <code>[10]</code>；<code>9</code> 比 10 小，替换，变成 <code>[9]</code>；<code>2</code> 替换，变成 <code>[2]</code>；<code>5</code> 追加，<code>[2, 5]</code>；<code>3</code> 替换 5，<code>[2, 3]</code>；<code>7</code> 追加，<code>[2, 3, 7]</code>；<code>101</code> 追加，<code>[2, 3, 7, 101]</code>；<code>18</code> 替换 101，<code>[2, 3, 7, 18]</code>。长度是 4。</p>
<p>为什么把 5 换成 3 不会出错？<code>tails[1]</code> 的意思是“长度为 2 的递增子序列，最小的结尾”。<code>2, 5</code> 和 <code>2, 3</code> 都是长度 2，但结尾 3 更小，后面来个 4 也能接上，所以留 3 更好。替换只是更新了“某个长度的最小结尾”，不会让已有的长度变短。</p>
<p><code>[7, 7, 7, 7]</code> 为什么是 1？题目要求严格递增，相等的数不能接在一起。二分找的是第一个 <code>&gt;= num</code> 的位置，第二个 7 会替换掉第一个 7，而不是追加。如果题目允许相等，要改成找第一个 <code>&gt; num</code> 的位置，两种边界的写法见<a href="/questions/ds-binary-search-variants/">《二分查找有哪些常见变体？怎样找边界、在旋转数组里查找？》</a>。</p>
<h2>还原出具体的子序列</h2>
<p><code>tails</code> 存的是值，不能直接当答案。还原时改成存下标，同时用 <code>prev[i]</code> 记录第 <code>i</code> 个数接在哪个下标后面。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">getSequenceIndexes</span>(<span class="hljs-params">nums</span>) {
  <span class="hljs-keyword">const</span> tails = []; <span class="hljs-comment">// 存下标，tails[k] 是长度为 k+1 时结尾元素的下标</span>
  <span class="hljs-keyword">const</span> prev = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Array</span>(nums.<span class="hljs-property">length</span>).<span class="hljs-title function_">fill</span>(-<span class="hljs-number">1</span>);
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">let</span> i = <span class="hljs-number">0</span>; i &lt; nums.<span class="hljs-property">length</span>; i += <span class="hljs-number">1</span>) {
    <span class="hljs-keyword">let</span> left = <span class="hljs-number">0</span>;
    <span class="hljs-keyword">let</span> right = tails.<span class="hljs-property">length</span>;
    <span class="hljs-keyword">while</span> (left &lt; right) {
      <span class="hljs-keyword">const</span> mid = left + <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">floor</span>((right - left) / <span class="hljs-number">2</span>);
      <span class="hljs-keyword">if</span> (nums[tails[mid]] &lt; nums[i]) left = mid + <span class="hljs-number">1</span>;
      <span class="hljs-keyword">else</span> right = mid;
    }
    <span class="hljs-keyword">if</span> (left &gt; <span class="hljs-number">0</span>) prev[i] = tails[left - <span class="hljs-number">1</span>];
    tails[left] = i;
  }
  <span class="hljs-comment">// 从最长序列的结尾往回找前驱。</span>
  <span class="hljs-keyword">const</span> result = [];
  <span class="hljs-keyword">let</span> index = tails.<span class="hljs-property">length</span> ? tails[tails.<span class="hljs-property">length</span> - <span class="hljs-number">1</span>] : -<span class="hljs-number">1</span>;
  <span class="hljs-keyword">while</span> (index !== -<span class="hljs-number">1</span>) {
    result.<span class="hljs-title function_">unshift</span>(index);
    index = prev[index];
  }
  <span class="hljs-keyword">return</span> result;
}

<span class="hljs-keyword">const</span> nums = [<span class="hljs-number">10</span>, <span class="hljs-number">9</span>, <span class="hljs-number">2</span>, <span class="hljs-number">5</span>, <span class="hljs-number">3</span>, <span class="hljs-number">7</span>, <span class="hljs-number">101</span>, <span class="hljs-number">18</span>];
<span class="hljs-keyword">const</span> indexes = <span class="hljs-title function_">getSequenceIndexes</span>(nums);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(indexes.<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;,&#x27;</span>)); <span class="hljs-comment">// 2,4,5,7</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(indexes.<span class="hljs-title function_">map</span>(<span class="hljs-function">(<span class="hljs-params">i</span>) =&gt;</span> nums[i]).<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;,&#x27;</span>)); <span class="hljs-comment">// 2,3,7,18</span>
</code></pre></div>
<p>每个数放进 <code>tails[left]</code> 时，它前面那一格 <code>tails[left - 1]</code> 就是它在递增序列里的前一个数，记到 <code>prev</code> 里。最后从 <code>tails</code> 的最后一项出发，沿着 <code>prev</code> 往回走，就得到一条真实的递增子序列 <code>2, 3, 7, 18</code>。</p>
<h2>Vue 3 的 diff 怎样用它</h2>
<p>Vue 3 比较新旧两组子节点时，先跳过开头和结尾相同的部分，剩下中间乱序的一段。它为这一段建一个数组 <code>newIndexToOldIndexMap</code>，每一项是这个新节点在旧列表里的位置加 1，填 0 表示这是新增的节点。</p>
<p>比如旧列表是 <code>A B C D</code>，新列表是 <code>D A B C</code>。按新顺序排，它们在旧列表里的位置是 3、0、1、2，其中 0、1、2 是递增的，说明 <code>A B C</code> 之间的先后顺序没变。所以 <code>A B C</code> 不用动，只把 <code>D</code> 移到最前面，一次移动就够了。</p>
<p>Vue 源码 <code>packages/runtime-core/src/renderer.ts</code> 里的 <code>getSequence</code> 就是上面这种“贪心加二分，再用前驱数组还原”的写法，返回的是下标；它会跳过值为 0 的项，因为新增的节点要新挂载，不参与移动。源码里还写着，只有检测到节点发生了移动，才计算最长递增子序列。双端比较和这种做法的对比见<a href="/questions/vue2-diff/">《Vue 2 的 diff 算法是怎样比较子节点的？》</a>。</p>
<h2>常见追问</h2>
<p><strong>为什么最长递增子序列能让移动次数最少？</strong></p>
<blockquote>
<p>不在子序列里的节点都要移动，在子序列里的可以不动。子序列越长，不用动的节点越多，要移动的就越少。所以找最长的那一条。</p>
</blockquote>
<p><strong>O(n²) 的动态规划写法还用掌握吗？</strong></p>
<blockquote>
<p>要能讲出来，它是理解这道题的基础：<code>dp[i]</code> 是以第 <code>i</code> 个数结尾的最长长度，等于前面所有比它小的数的 <code>dp</code> 最大值加 1，答案是所有 <code>dp[i]</code> 的最大值。动态规划的基本解题步骤见<a href="/questions/ds-dynamic-programming/">《动态规划怎么入门？爬楼梯和最小路径和怎样做？》</a>。</p>
</blockquote>`};export{e as default};