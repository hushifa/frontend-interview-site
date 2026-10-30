var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>打家劫舍 I（LeetCode 198）是一排房子，每间有一些钱，相邻两间不能在同一晚都偷，问最多能偷多少。比如 <code>[2,7,9,3,1]</code>，偷第 1、3、5 间，得到 2 + 9 + 1 = 12。</p>
<p>每间房只有偷和不偷两种选择。设 <code>dp[i]</code> 是考虑前 i 间房能偷到的最多钱：不偷第 i 间，结果就是 <code>dp[i-1]</code>；偷第 i 间，第 i-1 间就不能偷，结果是 <code>dp[i-2] + nums[i]</code>。两者取大的，就是状态转移方程。因为每一步只用到前两个值，用两个变量滚动就够了，时间 O(n)，空间 O(1)。</p>
<p>打家劫舍 II（LeetCode 213）把房子围成一圈，第一间和最后一间也算相邻。首尾不能同时偷，那么答案要么不含最后一间，要么不含第一间。把数组拆成这两段，每段都是一排房子，用 I 的方法各算一次，取较大的。</p>
<p>要注意只有一间房的情况：拆成两段后两段都是空的，结果会变成 0，所以要单独返回这一间的钱。</p>
</blockquote>
<h2>打家劫舍 I</h2>
<p><code>prev</code> 表示前 i-2 间的最优结果，<code>curr</code> 表示前 i-1 间的最优结果，每读一间房就往前滚一格。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">rob</span>(<span class="hljs-params">nums</span>) {
  <span class="hljs-keyword">let</span> prev = <span class="hljs-number">0</span>;
  <span class="hljs-keyword">let</span> curr = <span class="hljs-number">0</span>;
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> money <span class="hljs-keyword">of</span> nums) {
    <span class="hljs-comment">// 偷这一间就只能接 prev，不偷就沿用 curr</span>
    <span class="hljs-keyword">const</span> next = <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">max</span>(curr, prev + money);
    prev = curr;
    curr = next;
  }
  <span class="hljs-keyword">return</span> curr;
}

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">rob</span>([<span class="hljs-number">1</span>, <span class="hljs-number">2</span>, <span class="hljs-number">3</span>, <span class="hljs-number">1</span>])); <span class="hljs-comment">// 4</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">rob</span>([<span class="hljs-number">2</span>, <span class="hljs-number">7</span>, <span class="hljs-number">9</span>, <span class="hljs-number">3</span>, <span class="hljs-number">1</span>])); <span class="hljs-comment">// 12</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">rob</span>([<span class="hljs-number">2</span>, <span class="hljs-number">1</span>, <span class="hljs-number">1</span>, <span class="hljs-number">2</span>])); <span class="hljs-comment">// 4</span>
</code></pre></div>
<p><code>[2,1,1,2]</code> 这组容易出错。有人以为“隔一间偷一间”就行，可是偷第 1、3 间得 3，偷第 2、4 间也得 3，真正的最优是偷第 1 和第 4 间，得 4。中间可以连着跳过两间，所以不能简单地按奇偶位置选，要靠状态转移来比较。</p>
<p>为什么初始值都是 0？还没有房子时偷到的就是 0。第一间房进来时，<code>Math.max(0, 0 + nums[0])</code> 正好等于 <code>nums[0]</code>，不用单独处理。动态规划的一般思路见<a href="/questions/ds-dynamic-programming/">《动态规划怎么入门？爬楼梯和最长递增子序列怎样做？》</a>。</p>
<h2>打家劫舍 II：房子围成一圈</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">robLine</span>(<span class="hljs-params">nums, start, end</span>) {
  <span class="hljs-keyword">let</span> prev = <span class="hljs-number">0</span>;
  <span class="hljs-keyword">let</span> curr = <span class="hljs-number">0</span>;
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">let</span> i = start; i &lt;= end; i += <span class="hljs-number">1</span>) {
    <span class="hljs-keyword">const</span> next = <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">max</span>(curr, prev + nums[i]);
    prev = curr;
    curr = next;
  }
  <span class="hljs-keyword">return</span> curr;
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">robCircle</span>(<span class="hljs-params">nums</span>) {
  <span class="hljs-keyword">if</span> (nums.<span class="hljs-property">length</span> === <span class="hljs-number">1</span>) <span class="hljs-keyword">return</span> nums[<span class="hljs-number">0</span>];
  <span class="hljs-comment">// 首尾相邻，所以要么不偷最后一间，要么不偷第一间</span>
  <span class="hljs-keyword">return</span> <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">max</span>(<span class="hljs-title function_">robLine</span>(nums, <span class="hljs-number">0</span>, nums.<span class="hljs-property">length</span> - <span class="hljs-number">2</span>), <span class="hljs-title function_">robLine</span>(nums, <span class="hljs-number">1</span>, nums.<span class="hljs-property">length</span> - <span class="hljs-number">1</span>));
}

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">robCircle</span>([<span class="hljs-number">2</span>, <span class="hljs-number">3</span>, <span class="hljs-number">2</span>])); <span class="hljs-comment">// 3</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">robCircle</span>([<span class="hljs-number">1</span>, <span class="hljs-number">2</span>, <span class="hljs-number">3</span>, <span class="hljs-number">1</span>])); <span class="hljs-comment">// 4</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">robCircle</span>([<span class="hljs-number">1</span>, <span class="hljs-number">2</span>, <span class="hljs-number">3</span>])); <span class="hljs-comment">// 3</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">robCircle</span>([<span class="hljs-number">5</span>])); <span class="hljs-comment">// 5</span>
</code></pre></div>
<p><code>[2,3,2]</code> 如果当成一排，偷第 1 和第 3 间得 4。可是围成一圈后这两间相邻，不能都偷，所以只能偷中间那间，得 3。</p>
<p>拆成两段为什么不会漏掉答案？任何一种合法偷法，第一间和最后一间至少有一间没偷。没偷最后一间的偷法都落在第一段里，没偷第一间的都落在第二段里，所以两段的最大值合起来覆盖了所有情况。</p>
<h2>常见追问</h2>
<p><strong>如果还要输出偷了哪几间房，怎么办？</strong></p>
<blockquote>
<p>滚动变量只留下了最大值，所以要保留完整的 <code>dp</code> 数组，再从后往前回溯：如果 <code>dp[i]</code> 等于 <code>dp[i-1]</code>，说明第 i 间没偷，往前看一间；否则第 i 间偷了，跳到 i-2 继续。</p>
</blockquote>
<p><strong>房子排成二叉树（打家劫舍 III）怎么做？</strong></p>
<blockquote>
<p>对每个节点返回两个值：偷这个节点时的最大值和不偷时的最大值。偷当前节点，两个孩子都不能偷；不偷当前节点，每个孩子各自取偷或不偷中较大的。后序遍历一次就能算出来。</p>
</blockquote>`};export{e as default};