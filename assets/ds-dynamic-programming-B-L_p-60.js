var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>爬楼梯：每次能上 1 级或 2 级，上到第 n 级有几种走法？到第 n 级的最后一步，要么从第 n-1 级跨 1 级上来，要么从第 n-2 级跨 2 级上来，所以走法数等于这两者之和。大问题的答案由更小问题的答案组成，这就是动态规划能用的前提。</p>
<p>直接写递归 <code>f(n) = f(n-1) + f(n-2)</code> 会很慢，因为 <code>f(n-2)</code> 在算 <code>f(n-1)</code> 时又会被算一遍，越往下重复越多，是指数级。动态规划的做法是把算过的结果存起来，从小到大依次算，每个只算一次，变成 O(n)。</p>
<p>解题分三步：先定义状态，<code>dp[i]</code> 代表什么；再找转移方程，<code>dp[i]</code> 怎样由前面的值算出来；最后定初始值，最小的几个答案是多少。想清楚 <code>dp[i]</code> 的含义是最关键的一步。</p>
<p>状态也可以是二维的。LeetCode 64 最小路径和：在一个非负整数网格里，从左上角走到右下角，每次只能向右或向下，求路径上数字之和的最小值。<code>dp[i][j]</code> 表示走到格子 <code>(i, j)</code> 的最小和，它只能从上方或左方过来，所以等于 <code>grid[i][j]</code> 加上这两者的较小值。时间 O(mn)，空间可以压到一行。</p>
</blockquote>
<h2>爬楼梯和最小路径和</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">climbStairs</span>(<span class="hljs-params">n</span>) {
  <span class="hljs-keyword">if</span> (n &lt;= <span class="hljs-number">2</span>) <span class="hljs-keyword">return</span> n;
  <span class="hljs-keyword">let</span> prev = <span class="hljs-number">1</span>; <span class="hljs-comment">// dp[i-2]</span>
  <span class="hljs-keyword">let</span> current = <span class="hljs-number">2</span>; <span class="hljs-comment">// dp[i-1]</span>
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">let</span> i = <span class="hljs-number">3</span>; i &lt;= n; i++) {
    [prev, current] = [current, prev + current];
  }
  <span class="hljs-keyword">return</span> current;
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">minPathSum</span>(<span class="hljs-params">grid</span>) {
  <span class="hljs-keyword">const</span> cols = grid[<span class="hljs-number">0</span>].<span class="hljs-property">length</span>;
  <span class="hljs-keyword">const</span> dp = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Array</span>(cols).<span class="hljs-title function_">fill</span>(<span class="hljs-title class_">Infinity</span>);
  dp[<span class="hljs-number">0</span>] = <span class="hljs-number">0</span>;
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> row <span class="hljs-keyword">of</span> grid) {
    dp[<span class="hljs-number">0</span>] += row[<span class="hljs-number">0</span>];
    <span class="hljs-keyword">for</span> (<span class="hljs-keyword">let</span> j = <span class="hljs-number">1</span>; j &lt; cols; j++) {
      dp[j] = row[j] + <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">min</span>(dp[j], dp[j - <span class="hljs-number">1</span>]);
    }
  }
  <span class="hljs-keyword">return</span> dp[cols - <span class="hljs-number">1</span>];
}

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">climbStairs</span>(<span class="hljs-number">5</span>)); <span class="hljs-comment">// 8</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">minPathSum</span>([[<span class="hljs-number">1</span>, <span class="hljs-number">3</span>, <span class="hljs-number">1</span>], [<span class="hljs-number">1</span>, <span class="hljs-number">5</span>, <span class="hljs-number">1</span>], [<span class="hljs-number">4</span>, <span class="hljs-number">2</span>, <span class="hljs-number">1</span>]])); <span class="hljs-comment">// 7</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">minPathSum</span>([[<span class="hljs-number">1</span>, <span class="hljs-number">2</span>, <span class="hljs-number">3</span>], [<span class="hljs-number">4</span>, <span class="hljs-number">5</span>, <span class="hljs-number">6</span>]])); <span class="hljs-comment">// 12</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">minPathSum</span>([[<span class="hljs-number">0</span>]])); <span class="hljs-comment">// 0</span>
</code></pre></div>
<p><code>climbStairs</code> 为什么只用两个变量，没有开数组？因为 <code>dp[i]</code> 只依赖前两项，更早的值算完就用不到了。只保留需要的两项，空间从 O(n) 降到 O(1)，这是动态规划常见的空间优化。</p>
<p><code>minPathSum</code> 用的是同一个思路，只是压掉的是一维。二维的 <code>dp[i][j]</code> 只依赖上一行的 <code>dp[i-1][j]</code> 和这一行的 <code>dp[i][j-1]</code>，所以一行数组就够了：更新 <code>dp[j]</code> 之前，它里面存的还是上一行的值，也就是“上方”；<code>dp[j - 1]</code> 刚被更新过，是“左方”。</p>
<p>初始值怎么定？第一列的格子只能从上方下来，所以 <code>dp[0]</code> 一路累加 <code>row[0]</code>。第一行的格子只能从左边过来，把 <code>dp</code> 初始化成 <code>Infinity</code>，第一行计算时“上方”取不到，<code>Math.min</code> 自然选左方。第一个例子里，最优路径是 <code>1 → 3 → 1 → 1 → 1</code>，和为 7。</p>
<p>最长递增子序列也是常考的动态规划题，它的 O(n²) 写法和二分优化见<a href="/questions/ds-lis/">《最长递增子序列怎样用贪心加二分做到 O(n log n)？Vue 3 的 diff 为什么用它？》</a>。</p>
<h2>怎样判断能不能用动态规划</h2>
<p>题目问“最多”“最少”“有几种”，而且大问题可以由规模更小的同类问题推出来，就可以考虑动态规划。比如零钱兑换问最少几枚硬币、编辑距离问最少改几次、背包问题问最大价值。</p>
<p>如果每一步的选择只需看眼前、不会影响以后，比如找零时硬币面额是 1、5、10 这样的倍数关系，贪心就够了；面额不规则时贪心会出错，比如面额是 1、3、4，凑 6 时贪心先拿 4，再拿两个 1，一共 3 枚，而最优是两个 3，这时就得用动态规划。</p>
<h2>常见追问</h2>
<p><strong>记忆化递归和动态规划有什么区别？</strong></p>
<blockquote>
<p>本质一样，都是把子问题的答案存起来。记忆化递归从大问题往下拆，用到哪个子问题才算哪个，写法接近原始思路；动态规划从小问题往上推，用循环填表，没有递归栈溢出的风险。</p>
</blockquote>
<p><strong>最小路径和能不能用贪心，每步走较小的那一格？</strong></p>
<blockquote>
<p>不能。每步只看眼前会被后面的大数坑到，比如 <code>[[1, 2, 5], [3, 9, 9], [1, 1, 1]]</code>，第一步贪心选 2，最后走到 9 附近只能付出更大代价；向下走 <code>1 → 3 → 1 → 1 → 1</code> 和为 7，比贪心路线 <code>1 → 2 → 5 → 9 → 1</code> 的 18 小得多。动态规划把每个格子的所有来路都比较过，才能保证最小。</p>
</blockquote>`};export{e as default};