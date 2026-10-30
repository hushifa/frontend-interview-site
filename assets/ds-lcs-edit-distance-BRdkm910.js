var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>文本对比工具要找出两段文字里没变的部分，搜索框要判断用户输入的 <code>horse</code> 离 <code>ros</code> 有多远。前一个是最长公共子序列：两个字符串里按相同顺序都出现过的字符，最多能有几个，不要求连续。后一个是编辑距离：通过插入、删除、替换一个字符，最少几步能把一个变成另一个。</p>
<p>两题都用二维的动态规划。<code>dp[i][j]</code> 表示第一个字符串的前 <code>i</code> 个字符和第二个字符串的前 <code>j</code> 个字符之间的答案，每次只看两个前缀的最后一个字符。</p>
<p>最长公共子序列：最后一个字符相同，它一定可以放进公共子序列，答案是 <code>dp[i-1][j-1] + 1</code>；不同，就去掉其中一个字符再比，取 <code>dp[i-1][j]</code> 和 <code>dp[i][j-1]</code> 的较大值。编辑距离：最后一个字符相同，不用操作，等于 <code>dp[i-1][j-1]</code>；不同，就在删除、插入、替换三种操作里选步数最少的，再加 1。</p>
<p>两题的初始值不一样，最容易写错。最长公共子序列里，空串和任何字符串的公共子序列长度都是 0；编辑距离里，空串变成长度为 <code>j</code> 的字符串要插入 <code>j</code> 次，所以第一行是 0、1、2……第一列也一样。时间复杂度都是 O(mn)。</p>
</blockquote>
<h2>两题的写法</h2>
<p>下面两个函数结构几乎一样，表格多开一行一列，用来放空串的情况。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">longestCommonSubsequence</span>(<span class="hljs-params">a, b</span>) {
  <span class="hljs-keyword">const</span> dp = <span class="hljs-title class_">Array</span>.<span class="hljs-title function_">from</span>({ <span class="hljs-attr">length</span>: a.<span class="hljs-property">length</span> + <span class="hljs-number">1</span> }, <span class="hljs-function">() =&gt;</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Array</span>(b.<span class="hljs-property">length</span> + <span class="hljs-number">1</span>).<span class="hljs-title function_">fill</span>(<span class="hljs-number">0</span>));
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">let</span> i = <span class="hljs-number">1</span>; i &lt;= a.<span class="hljs-property">length</span>; i += <span class="hljs-number">1</span>) {
    <span class="hljs-keyword">for</span> (<span class="hljs-keyword">let</span> j = <span class="hljs-number">1</span>; j &lt;= b.<span class="hljs-property">length</span>; j += <span class="hljs-number">1</span>) {
      dp[i][j] =
        a[i - <span class="hljs-number">1</span>] === b[j - <span class="hljs-number">1</span>] ? dp[i - <span class="hljs-number">1</span>][j - <span class="hljs-number">1</span>] + <span class="hljs-number">1</span> : <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">max</span>(dp[i - <span class="hljs-number">1</span>][j], dp[i][j - <span class="hljs-number">1</span>]);
    }
  }
  <span class="hljs-keyword">return</span> dp[a.<span class="hljs-property">length</span>][b.<span class="hljs-property">length</span>];
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">minDistance</span>(<span class="hljs-params">a, b</span>) {
  <span class="hljs-keyword">const</span> dp = <span class="hljs-title class_">Array</span>.<span class="hljs-title function_">from</span>({ <span class="hljs-attr">length</span>: a.<span class="hljs-property">length</span> + <span class="hljs-number">1</span> }, <span class="hljs-function">(<span class="hljs-params">_, i</span>) =&gt;</span>
    <span class="hljs-title class_">Array</span>.<span class="hljs-title function_">from</span>({ <span class="hljs-attr">length</span>: b.<span class="hljs-property">length</span> + <span class="hljs-number">1</span> }, <span class="hljs-function">(<span class="hljs-params">_, j</span>) =&gt;</span> (i === <span class="hljs-number">0</span> ? j : j === <span class="hljs-number">0</span> ? i : <span class="hljs-number">0</span>)),
  );
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">let</span> i = <span class="hljs-number">1</span>; i &lt;= a.<span class="hljs-property">length</span>; i += <span class="hljs-number">1</span>) {
    <span class="hljs-keyword">for</span> (<span class="hljs-keyword">let</span> j = <span class="hljs-number">1</span>; j &lt;= b.<span class="hljs-property">length</span>; j += <span class="hljs-number">1</span>) {
      <span class="hljs-keyword">if</span> (a[i - <span class="hljs-number">1</span>] === b[j - <span class="hljs-number">1</span>]) {
        dp[i][j] = dp[i - <span class="hljs-number">1</span>][j - <span class="hljs-number">1</span>];
      } <span class="hljs-keyword">else</span> {
        <span class="hljs-comment">// 删除 a 的末尾、在 a 末尾插入 b[j-1]、把 a 的末尾替换成 b[j-1]</span>
        dp[i][j] = <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">min</span>(dp[i - <span class="hljs-number">1</span>][j], dp[i][j - <span class="hljs-number">1</span>], dp[i - <span class="hljs-number">1</span>][j - <span class="hljs-number">1</span>]) + <span class="hljs-number">1</span>;
      }
    }
  }
  <span class="hljs-keyword">return</span> dp[a.<span class="hljs-property">length</span>][b.<span class="hljs-property">length</span>];
}

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">longestCommonSubsequence</span>(<span class="hljs-string">&#x27;abcde&#x27;</span>, <span class="hljs-string">&#x27;ace&#x27;</span>)); <span class="hljs-comment">// 3</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">longestCommonSubsequence</span>(<span class="hljs-string">&#x27;abc&#x27;</span>, <span class="hljs-string">&#x27;def&#x27;</span>)); <span class="hljs-comment">// 0</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">minDistance</span>(<span class="hljs-string">&#x27;horse&#x27;</span>, <span class="hljs-string">&#x27;ros&#x27;</span>)); <span class="hljs-comment">// 3</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">minDistance</span>(<span class="hljs-string">&#x27;intention&#x27;</span>, <span class="hljs-string">&#x27;execution&#x27;</span>)); <span class="hljs-comment">// 5</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">minDistance</span>(<span class="hljs-string">&#x27;&#x27;</span>, <span class="hljs-string">&#x27;abc&#x27;</span>)); <span class="hljs-comment">// 3</span>
</code></pre></div>
<p>前四个输入都是 LeetCode 题面里的例子。<code>&#x27;abcde&#x27;</code> 和 <code>&#x27;ace&#x27;</code> 的公共子序列是 <code>ace</code>，长度 3；<code>horse</code> 变成 <code>ros</code> 要三步：<code>h</code> 换成 <code>r</code>，删掉 <code>r</code>，删掉 <code>e</code>。</p>
<p>为什么 <code>a[i - 1]</code> 要减 1？因为 <code>dp</code> 多开了一行一列，<code>dp[i]</code> 对应的是前 <code>i</code> 个字符，最后一个字符的下标是 <code>i - 1</code>。多开这一行一列的好处是，空串的情况直接写在第 0 行和第 0 列，循环里不用判断越界。</p>
<h2>编辑距离的三种操作怎样对应三个格子</h2>
<p><code>dp[i][j]</code> 是把 <code>a</code> 的前 <code>i</code> 个字符变成 <code>b</code> 的前 <code>j</code> 个字符的最少步数。最后一个字符不同时，最后一步只可能是三种操作之一。</p>
<p>删除：把 <code>a</code> 的第 <code>i</code> 个字符删掉，剩下的问题是把 <code>a</code> 的前 <code>i-1</code> 个变成 <code>b</code> 的前 <code>j</code> 个，就是 <code>dp[i-1][j]</code>。插入：在 <code>a</code> 后面插入 <code>b[j-1]</code>，这样 <code>b</code> 的最后一个字符就对上了，剩下的问题是把 <code>a</code> 的前 <code>i</code> 个变成 <code>b</code> 的前 <code>j-1</code> 个，就是 <code>dp[i][j-1]</code>。替换：把 <code>a</code> 的最后一个字符换成 <code>b</code> 的最后一个字符，两边都对上了，剩下 <code>dp[i-1][j-1]</code>。</p>
<p>所以取三者的最小值加 1。最长公共子序列只有两个方向，是因为它没有“替换”这个选项：末尾不同时，只能放弃其中一个字符。</p>
<h2>怎样省空间</h2>
<p><code>dp[i][j]</code> 只用到上一行和当前行，所以可以只保留一行，空间从 O(mn) 降到 O(n)。要注意，从左往右覆盖时，<code>dp[i-1][j-1]</code> 会在算 <code>dp[i][j-1]</code> 时被覆盖掉，所以要先用一个变量把它存下来。面试时先写出二维版本，再说明可以这样压缩，一般就够了。</p>
<p>动态规划的基本思路，比如怎样定义状态、怎样找转移方程，见<a href="/questions/ds-dynamic-programming/">《动态规划怎么入门？爬楼梯和最长递增子序列怎样做？》</a>。</p>
<h2>常见追问</h2>
<p><strong>怎样把最长公共子序列本身找出来，而不只是长度？</strong></p>
<blockquote>
<p>填完表以后从右下角往回走。两个字符相同，说明这个字符在子序列里，记下来，往左上角走；不同，就往 <code>dp</code> 值较大的那一边走。走到第 0 行或第 0 列为止，把记下的字符反过来，就是一个最长公共子序列。</p>
</blockquote>
<p><strong>子序列和子串有什么区别？</strong></p>
<blockquote>
<p>子序列只要求顺序不变，中间可以跳过字符，<code>ace</code> 是 <code>abcde</code> 的子序列；子串必须连续，<code>ace</code> 就不是 <code>abcde</code> 的子串。求最长公共子串时，末尾不同的格子要直接设为 0，因为连续的串在这里断了。</p>
</blockquote>`};export{e as default};