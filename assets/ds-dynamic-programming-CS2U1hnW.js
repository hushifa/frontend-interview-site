var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>爬楼梯：每次能上 1 级或 2 级，上到第 n 级有几种走法？到第 n 级的最后一步，要么从第 n-1 级跨 1 级上来，要么从第 n-2 级跨 2 级上来，所以走法数等于这两者之和。大问题的答案由更小问题的答案组成，这就是动态规划能用的前提。</p>
<p>直接写递归 <code>f(n) = f(n-1) + f(n-2)</code> 会很慢，因为 <code>f(n-2)</code> 在算 <code>f(n-1)</code> 时又会被算一遍，越往下重复越多，是指数级。动态规划的做法是把算过的结果存起来，从小到大依次算，每个只算一次，变成 O(n)。</p>
<p>解题分三步：先定义状态，<code>dp[i]</code> 代表什么；再找转移方程，<code>dp[i]</code> 怎样由前面的值算出来；最后定初始值，最小的几个答案是多少。想清楚 <code>dp[i]</code> 的含义是最关键的一步。</p>
<p>最长递增子序列是个更典型的例子：<code>dp[i]</code> 表示以第 i 个数结尾的最长递增子序列长度，它等于前面所有比它小的数的 <code>dp</code> 最大值加 1，整体 O(n²)。要注意，答案是所有 <code>dp[i]</code> 的最大值，不是 <code>dp</code> 的最后一项。Vue 3 的 diff 用到了这个算法的 O(n log n) 版本。</p>
</blockquote>
<h2>爬楼梯</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">climbStairs</span>(<span class="hljs-params">n</span>) {
  <span class="hljs-keyword">if</span> (n &lt;= <span class="hljs-number">2</span>) <span class="hljs-keyword">return</span> n;
  <span class="hljs-keyword">let</span> prev = <span class="hljs-number">1</span>; <span class="hljs-comment">// dp[i-2]</span>
  <span class="hljs-keyword">let</span> current = <span class="hljs-number">2</span>; <span class="hljs-comment">// dp[i-1]</span>
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">let</span> i = <span class="hljs-number">3</span>; i &lt;= n; i++) {
    [prev, current] = [current, prev + current];
  }
  <span class="hljs-keyword">return</span> current;
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">lengthOfLIS</span>(<span class="hljs-params">nums</span>) {
  <span class="hljs-keyword">const</span> dp = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Array</span>(nums.<span class="hljs-property">length</span>).<span class="hljs-title function_">fill</span>(<span class="hljs-number">1</span>);
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">let</span> i = <span class="hljs-number">1</span>; i &lt; nums.<span class="hljs-property">length</span>; i++) {
    <span class="hljs-keyword">for</span> (<span class="hljs-keyword">let</span> j = <span class="hljs-number">0</span>; j &lt; i; j++) {
      <span class="hljs-keyword">if</span> (nums[j] &lt; nums[i]) dp[i] = <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">max</span>(dp[i], dp[j] + <span class="hljs-number">1</span>);
    }
  }
  <span class="hljs-keyword">return</span> nums.<span class="hljs-property">length</span> === <span class="hljs-number">0</span> ? <span class="hljs-number">0</span> : <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">max</span>(...dp);
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">lengthOfLISFast</span>(<span class="hljs-params">nums</span>) {
  <span class="hljs-keyword">const</span> tails = [];
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> num <span class="hljs-keyword">of</span> nums) {
    <span class="hljs-keyword">let</span> left = <span class="hljs-number">0</span>;
    <span class="hljs-keyword">let</span> right = tails.<span class="hljs-property">length</span>;
    <span class="hljs-keyword">while</span> (left &lt; right) {
      <span class="hljs-keyword">const</span> mid = (left + right) &gt;&gt; <span class="hljs-number">1</span>;
      <span class="hljs-keyword">if</span> (tails[mid] &lt; num) left = mid + <span class="hljs-number">1</span>;
      <span class="hljs-keyword">else</span> right = mid;
    }
    tails[left] = num;
  }
  <span class="hljs-keyword">return</span> tails.<span class="hljs-property">length</span>;
}

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">climbStairs</span>(<span class="hljs-number">5</span>)); <span class="hljs-comment">// 8</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">lengthOfLIS</span>([<span class="hljs-number">10</span>, <span class="hljs-number">9</span>, <span class="hljs-number">2</span>, <span class="hljs-number">5</span>, <span class="hljs-number">3</span>, <span class="hljs-number">7</span>, <span class="hljs-number">101</span>, <span class="hljs-number">18</span>])); <span class="hljs-comment">// 4</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">lengthOfLISFast</span>([<span class="hljs-number">10</span>, <span class="hljs-number">9</span>, <span class="hljs-number">2</span>, <span class="hljs-number">5</span>, <span class="hljs-number">3</span>, <span class="hljs-number">7</span>, <span class="hljs-number">101</span>, <span class="hljs-number">18</span>])); <span class="hljs-comment">// 4</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">lengthOfLIS</span>([])); <span class="hljs-comment">// 0</span>
</code></pre></div>
<p><code>climbStairs</code> 为什么只用两个变量，没有开数组？因为 <code>dp[i]</code> 只依赖前两项，更早的值算完就用不到了。只保留需要的两项，空间从 O(n) 降到 O(1)，这是动态规划常见的空间优化。</p>
<p><code>lengthOfLIS</code> 里，以 <code>7</code> 结尾的最长递增子序列，是在前面比 7 小的 <code>2、5、3</code> 里找 <code>dp</code> 最大的，<code>5</code> 和 <code>3</code> 的 <code>dp</code> 都是 2，所以 <code>dp</code> 为 3，比如 <code>2, 3, 7</code>。最后的 101 和 18 都能接在 7 后面，长度是 4。</p>
<p><code>lengthOfLISFast</code> 换了思路：<code>tails[k]</code> 记录长度为 k+1 的递增子序列中，结尾最小的那个数。结尾越小，后面越容易接上新数。每来一个数，用二分查找它在 <code>tails</code> 里的位置，替换或追加。<code>tails</code> 的长度就是答案，但要注意它本身不一定是一个真实的子序列。</p>
<h2>怎样判断能不能用动态规划</h2>
<p>题目问“最多”“最少”“有几种”，而且大问题可以由规模更小的同类问题推出来，就可以考虑动态规划。比如零钱兑换问最少几枚硬币、编辑距离问最少改几次、背包问题问最大价值。</p>
<p>如果每一步的选择只需看眼前、不会影响以后，比如找零时硬币面额是 1、5、10 这样的倍数关系，贪心就够了；面额不规则时贪心会出错，比如面额是 1、3、4，凑 6 时贪心先拿 4，再拿两个 1，一共 3 枚，而最优是两个 3，这时就得用动态规划。</p>
<h2>常见追问</h2>
<p><strong>记忆化递归和动态规划有什么区别？</strong></p>
<blockquote>
<p>本质一样，都是把子问题的答案存起来。记忆化递归从大问题往下拆，用到哪个子问题才算哪个，写法接近原始思路；动态规划从小问题往上推，用循环填表，没有递归栈溢出的风险。</p>
</blockquote>
<p><strong>Vue 3 为什么要用最长递增子序列？</strong></p>
<blockquote>
<p>列表中间乱序的部分，把新节点在旧列表里的位置排出来，最长递增子序列里的节点相对顺序没变，可以不动，只移动其他节点，移动次数最少。见<a href="/questions/vue2-diff/">《Vue 2 的 diff 算法是怎样比较子节点的？》</a>。</p>
</blockquote>`};export{e as default};