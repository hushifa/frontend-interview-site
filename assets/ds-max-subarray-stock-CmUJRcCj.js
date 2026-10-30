var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>最大子数组和：在 <code>[-2, 1, -3, 4, -1, 2, 1, -5, 4]</code> 里找一段连续的数，让和最大，答案是 <code>[4, -1, 2, 1]</code>，和为 6。暴力枚举所有区间是 O(n²)。</p>
<p>线性做法叫 Kadane 算法，思路来自动态规划：设 <code>current</code> 是“以当前元素结尾”的最大子数组和。走到下一个数 x 时只有两种选择，接在前面那段后面，和是 <code>current + x</code>；或者从 x 自己重新开始。前面那段的和如果是负数，接上只会拖后腿，所以 <code>current = Math.max(x, current + x)</code>。答案是遍历过程中 <code>current</code> 出现过的最大值。</p>
<p>买卖股票（只买卖一次）：给每天的价格，求先买后卖的最大利润。如果今天卖出，最好的买入点一定是今天之前的最低价，所以一边走一边记最低价 <code>minPrice</code>，每天算一次 <code>price - minPrice</code>，取最大值。价格一路下跌时利润是 0，表示不交易。</p>
<p>两题都是一次遍历、O(n) 时间、O(1) 空间。要注意最大子数组和的初始值：数组全是负数时，答案是最大的那个负数，所以要用第一个元素初始化，不能从 0 开始。</p>
</blockquote>
<h2>最大子数组和</h2>
<p>看代码时注意 <code>current</code> 和 <code>best</code> 的区别：<code>current</code> 必须以当前元素结尾，<code>best</code> 是到目前为止见过的最好结果。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">maxSubArray</span>(<span class="hljs-params">nums</span>) {
  <span class="hljs-keyword">let</span> current = nums[<span class="hljs-number">0</span>];
  <span class="hljs-keyword">let</span> best = nums[<span class="hljs-number">0</span>];
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">let</span> i = <span class="hljs-number">1</span>; i &lt; nums.<span class="hljs-property">length</span>; i++) {
    <span class="hljs-comment">// 前面那段的和是负数时，接上只会更小，不如从自己重新开始</span>
    current = <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">max</span>(nums[i], current + nums[i]);
    best = <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">max</span>(best, current);
  }
  <span class="hljs-keyword">return</span> best;
}

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">maxSubArray</span>([-<span class="hljs-number">2</span>, <span class="hljs-number">1</span>, -<span class="hljs-number">3</span>, <span class="hljs-number">4</span>, -<span class="hljs-number">1</span>, <span class="hljs-number">2</span>, <span class="hljs-number">1</span>, -<span class="hljs-number">5</span>, <span class="hljs-number">4</span>])); <span class="hljs-comment">// 6</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">maxSubArray</span>([<span class="hljs-number">5</span>, <span class="hljs-number">4</span>, -<span class="hljs-number">1</span>, <span class="hljs-number">7</span>, <span class="hljs-number">8</span>])); <span class="hljs-comment">// 23</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">maxSubArray</span>([-<span class="hljs-number">3</span>, -<span class="hljs-number">1</span>, -<span class="hljs-number">2</span>])); <span class="hljs-comment">// -1</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">maxSubArray</span>([<span class="hljs-number">7</span>])); <span class="hljs-comment">// 7</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">maxSubArray</span>([])); <span class="hljs-comment">// undefined</span>
</code></pre></div>
<p>为什么要单独记一个 <code>best</code>？因为 <code>current</code> 只代表“必须以当前元素结尾”的最优值，最好的那一段可能早就结束了。第一个例子里，走到下标 6 时 <code>current</code> 是 6，再遇到 -5 就降到 1，如果最后只返回 <code>current</code>，就丢掉了 6。</p>
<p>全是负数时为什么不能从 0 开始？如果 <code>best</code> 初始化为 0，<code>[-3, -1, -2]</code> 会返回 0，相当于选了一个空数组，可题目要求子数组至少包含一个元素。用 <code>nums[0]</code> 初始化，答案就是 -1。</p>
<p>空数组返回 <code>undefined</code>，因为 <code>nums[0]</code> 不存在，循环也不执行。题目一般保证至少有一个元素；真要处理空输入，应该在开头显式判断，按业务约定返回 0 或抛错。</p>
<h2>买卖股票的最佳时机</h2>
<p><code>maxProfit</code> 只允许买卖一次，看 <code>minPrice</code> 的更新顺序：代码先更新最低价再算利润，相当于允许同一天买入卖出，利润为 0，不影响结果。<code>maxProfitMultiple</code> 是可以买卖任意多次的版本。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">maxProfit</span>(<span class="hljs-params">prices</span>) {
  <span class="hljs-keyword">let</span> minPrice = <span class="hljs-title class_">Infinity</span>;
  <span class="hljs-keyword">let</span> profit = <span class="hljs-number">0</span>;
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> price <span class="hljs-keyword">of</span> prices) {
    minPrice = <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">min</span>(minPrice, price);
    profit = <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">max</span>(profit, price - minPrice);
  }
  <span class="hljs-keyword">return</span> profit;
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">maxProfitMultiple</span>(<span class="hljs-params">prices</span>) {
  <span class="hljs-keyword">let</span> profit = <span class="hljs-number">0</span>;
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">let</span> i = <span class="hljs-number">1</span>; i &lt; prices.<span class="hljs-property">length</span>; i++) {
    <span class="hljs-comment">// 可以买卖任意多次：把每一段上涨都吃下来</span>
    <span class="hljs-keyword">if</span> (prices[i] &gt; prices[i - <span class="hljs-number">1</span>]) profit += prices[i] - prices[i - <span class="hljs-number">1</span>];
  }
  <span class="hljs-keyword">return</span> profit;
}

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">maxProfit</span>([<span class="hljs-number">7</span>, <span class="hljs-number">1</span>, <span class="hljs-number">5</span>, <span class="hljs-number">3</span>, <span class="hljs-number">6</span>, <span class="hljs-number">4</span>])); <span class="hljs-comment">// 5</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">maxProfit</span>([<span class="hljs-number">7</span>, <span class="hljs-number">6</span>, <span class="hljs-number">4</span>, <span class="hljs-number">3</span>, <span class="hljs-number">1</span>])); <span class="hljs-comment">// 0</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">maxProfit</span>([])); <span class="hljs-comment">// 0</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">maxProfit</span>([<span class="hljs-number">3</span>, <span class="hljs-number">3</span>, <span class="hljs-number">3</span>])); <span class="hljs-comment">// 0</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">maxProfitMultiple</span>([<span class="hljs-number">7</span>, <span class="hljs-number">1</span>, <span class="hljs-number">5</span>, <span class="hljs-number">3</span>, <span class="hljs-number">6</span>, <span class="hljs-number">4</span>])); <span class="hljs-comment">// 7</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">maxProfitMultiple</span>([<span class="hljs-number">1</span>, <span class="hljs-number">2</span>, <span class="hljs-number">3</span>, <span class="hljs-number">4</span>, <span class="hljs-number">5</span>])); <span class="hljs-comment">// 4</span>
</code></pre></div>
<p><code>[7, 1, 5, 3, 6, 4]</code> 为什么是 5 而不是 6？最大值 7 出现在最低价 1 之前，不能先卖后买。代码只用“今天之前或今天”的最低价算利润，所以第 1 天买入 1、第 4 天卖出 6，利润 5。</p>
<p><code>minPrice</code> 为什么初始化成 <code>Infinity</code>？<code>Infinity</code> 比任何有限数都大，第一天的价格一定会把它替换掉，不用单独处理第一个元素。空数组时循环不执行，返回 0。</p>
<p>可以买卖多次时为什么只要把上涨相加？任何一段从低到高的交易，利润都等于中间每天涨幅的和，比如 1 买 5 卖等于 1→5 这一天的涨幅；把所有上涨的日子都算上、下跌的日子都跳过，就是能拿到的最大利润。<code>[1, 2, 3, 4, 5]</code> 一次买卖是 4，每天买卖加起来也是 4。</p>
<h2>两题和动态规划的关系</h2>
<p>Kadane 算法本来就是动态规划：状态 <code>dp[i]</code> 是以第 i 个元素结尾的最大和，转移是 <code>dp[i] = max(nums[i], dp[i-1] + nums[i])</code>。因为 <code>dp[i]</code> 只依赖 <code>dp[i-1]</code>，数组压缩成一个变量，空间从 O(n) 变成 O(1)。这种写法在<a href="/questions/ds-dynamic-programming/">《动态规划怎么入门？爬楼梯和最小路径和怎样做？》</a>里的爬楼梯也出现过。</p>
<p>股票题加上“最多交易 k 次”“卖出后要冷冻一天”“每笔交易有手续费”等条件后，就需要显式的状态，比如“今天结束时手里有股票 / 没有股票”两种状态分别的最大收益。</p>
<h2>常见追问</h2>
<p><strong>最大子数组和还要返回区间的起止位置怎么办？</strong></p>
<blockquote>
<p>在 <code>current</code> 选择“从自己重新开始”时，记下当前下标作为临时起点；每次 <code>best</code> 被更新时，把临时起点和当前下标保存为答案区间。时间复杂度不变。</p>
</blockquote>
<p><strong>有没有分治的做法？</strong></p>
<blockquote>
<p>有。把数组从中间切开，最大子数组要么完全在左半边，要么完全在右半边，要么跨过中点。前两种递归求，跨中点的从中点往两边扫一遍就能求出，整体 O(n log n)，比 Kadane 慢，面试里一般作为思路补充。</p>
</blockquote>`};export{e as default};