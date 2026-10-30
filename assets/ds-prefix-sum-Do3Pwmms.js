var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>前缀和就是提前算好“从开头加到第 i 个数一共是多少”。有了它，任意一段区间的和都能用两个前缀和相减得到，比如 <code>[i, j]</code> 的和等于 <code>prefix[j + 1] - prefix[i]</code>，不用每次重新加一遍。像商品列表里反复问“第 3 到第 8 天的销量合计”，预处理一次 O(n)，之后每次查询 O(1)。</p>
<p>和为 K 的子数组是问有多少段连续子数组的和等于 k。暴力枚举所有区间是 O(n²)。用前缀和换个角度看：以当前位置结尾、和为 k 的区间，就是前面某个前缀和恰好等于“当前前缀和减 k”。所以遍历时用 Map 记录每个前缀和出现了几次，每到一个位置就查一下 <code>sum - k</code> 出现过几次，累加起来，一遍 O(n)。</p>
<p>差分是反过来的操作。要把区间 <code>[l, r]</code> 里的数都加上 v，在差分数组的 <code>l</code> 位置加 v、<code>r + 1</code> 位置减 v，所有修改做完以后求一次前缀和，就得到最终数组。多次区间修改、最后统一查询时很省事。</p>
<p>要注意，Map 要先放一个 <code>0 → 1</code>，代表“一个数都不选”的空前缀，否则从下标 0 开始的区间会漏掉。这题数组里有负数，窗口右扩时和不一定变大，所以不能用滑动窗口。</p>
</blockquote>
<h2>和为 K 的子数组</h2>
<p>先看 <code>prefixSums</code> 怎样求区间和，再看 <code>subarraySum</code> 里先查后存的顺序。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">prefixSums</span>(<span class="hljs-params">nums</span>) {
  <span class="hljs-keyword">const</span> prefix = [<span class="hljs-number">0</span>];
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> num <span class="hljs-keyword">of</span> nums) prefix.<span class="hljs-title function_">push</span>(prefix[prefix.<span class="hljs-property">length</span> - <span class="hljs-number">1</span>] + num);
  <span class="hljs-keyword">return</span> prefix;
}

<span class="hljs-keyword">const</span> prefix = <span class="hljs-title function_">prefixSums</span>([<span class="hljs-number">3</span>, <span class="hljs-number">1</span>, <span class="hljs-number">4</span>, <span class="hljs-number">1</span>, <span class="hljs-number">5</span>]);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(prefix.<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;,&#x27;</span>)); <span class="hljs-comment">// 0,3,4,8,9,14</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(prefix[<span class="hljs-number">4</span>] - prefix[<span class="hljs-number">1</span>]); <span class="hljs-comment">// 6</span>

<span class="hljs-keyword">function</span> <span class="hljs-title function_">subarraySum</span>(<span class="hljs-params">nums, k</span>) {
  <span class="hljs-keyword">const</span> count = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Map</span>([[<span class="hljs-number">0</span>, <span class="hljs-number">1</span>]]);
  <span class="hljs-keyword">let</span> sum = <span class="hljs-number">0</span>;
  <span class="hljs-keyword">let</span> result = <span class="hljs-number">0</span>;
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> num <span class="hljs-keyword">of</span> nums) {
    sum += num;
    result += count.<span class="hljs-title function_">get</span>(sum - k) ?? <span class="hljs-number">0</span>;
    count.<span class="hljs-title function_">set</span>(sum, (count.<span class="hljs-title function_">get</span>(sum) ?? <span class="hljs-number">0</span>) + <span class="hljs-number">1</span>);
  }
  <span class="hljs-keyword">return</span> result;
}

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">subarraySum</span>([<span class="hljs-number">1</span>, <span class="hljs-number">1</span>, <span class="hljs-number">1</span>], <span class="hljs-number">2</span>)); <span class="hljs-comment">// 2</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">subarraySum</span>([<span class="hljs-number">1</span>, <span class="hljs-number">2</span>, <span class="hljs-number">3</span>], <span class="hljs-number">3</span>)); <span class="hljs-comment">// 2</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">subarraySum</span>([<span class="hljs-number">1</span>, -<span class="hljs-number">1</span>, <span class="hljs-number">0</span>], <span class="hljs-number">0</span>)); <span class="hljs-comment">// 3</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">subarraySum</span>([<span class="hljs-number">3</span>, <span class="hljs-number">4</span>, <span class="hljs-number">7</span>, <span class="hljs-number">2</span>, -<span class="hljs-number">3</span>, <span class="hljs-number">1</span>, <span class="hljs-number">4</span>, <span class="hljs-number">2</span>], <span class="hljs-number">7</span>)); <span class="hljs-comment">// 4</span>
</code></pre></div>
<p><code>prefix</code> 比原数组多一位，<code>prefix[0]</code> 是 0，表示前 0 个数的和。<code>prefix[4] - prefix[1]</code> 是下标 1 到 3 的和，<code>1 + 4 + 1 = 6</code>。多放这个 0，求从开头开始的区间时也能用同一个公式。</p>
<p><code>subarraySum</code> 里为什么先查 <code>sum - k</code>，再把 <code>sum</code> 存进去？查的是“当前位置之前”的前缀和，如果先存，k 为 0 时当前前缀和会和自己配对，相当于数进了一个空区间。<code>[1, -1, 0]</code> 找和为 0 的区间，答案是 <code>[1, -1]</code>、<code>[0]</code>、<code>[1, -1, 0]</code> 三段，前缀和依次是 1、0、0，第二个 0 能和空前缀的 0 以及第一个 0 各配一次。</p>
<p>为什么不用滑动窗口？滑动窗口要求窗口扩大时和只增不减，缩小时只减不增，这样和太大就缩左边、太小就扩右边。数组里有负数时，这个规律不成立，窗口怎么动都可能错过答案。滑动窗口的写法见<a href="/questions/ds-sliding-window/">《滑动窗口怎样求无重复字符的最长子串？》</a>。</p>
<h2>差分：区间修改再统一求值</h2>
<p>假设有 5 天的预订记录，每条是“第 l 天到第 r 天，每天多 v 个座位”，最后要求每天一共订了多少。逐天累加是每条 O(区间长度)，用差分每条只改两个位置。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">applyRanges</span>(<span class="hljs-params">length, updates</span>) {
  <span class="hljs-keyword">const</span> diff = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Array</span>(length + <span class="hljs-number">1</span>).<span class="hljs-title function_">fill</span>(<span class="hljs-number">0</span>);
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> [l, r, v] <span class="hljs-keyword">of</span> updates) {
    diff[l] += v;
    diff[r + <span class="hljs-number">1</span>] -= v;
  }
  <span class="hljs-keyword">const</span> result = [];
  <span class="hljs-keyword">let</span> running = <span class="hljs-number">0</span>;
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">let</span> i = <span class="hljs-number">0</span>; i &lt; length; i++) {
    running += diff[i];
    result.<span class="hljs-title function_">push</span>(running);
  }
  <span class="hljs-keyword">return</span> result;
}

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">applyRanges</span>(<span class="hljs-number">5</span>, [[<span class="hljs-number">0</span>, <span class="hljs-number">1</span>, <span class="hljs-number">10</span>], [<span class="hljs-number">1</span>, <span class="hljs-number">2</span>, <span class="hljs-number">20</span>], [<span class="hljs-number">1</span>, <span class="hljs-number">4</span>, <span class="hljs-number">25</span>]]).<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;,&#x27;</span>)); <span class="hljs-comment">// 10,55,45,25,25</span>
</code></pre></div>
<p>差分数组的第 i 位记的是“第 i 天比前一天多了多少”。<code>diff[l] += v</code> 表示从第 l 天开始多出 v，<code>diff[r + 1] -= v</code> 表示从 r + 1 天开始这部分又没了。最后从左往右累加，每天的值就恢复出来了。数组多开一位，是为了 <code>r</code> 等于最后一天时 <code>r + 1</code> 不越界。</p>
<h2>常见追问</h2>
<p><strong>二维矩阵的区域和怎么用前缀和？</strong></p>
<blockquote>
<p>定义 <code>P[i][j]</code> 为左上角到 <code>(i-1, j-1)</code> 这个矩形的和，递推是 <code>P[i][j] = P[i-1][j] + P[i][j-1] - P[i-1][j-1] + matrix[i-1][j-1]</code>。任意子矩形的和用四个前缀和加减得到，同样 O(1)。</p>
</blockquote>
<p><strong>和为 K 的子数组如果要求最长的那一段呢？</strong></p>
<blockquote>
<p>Map 里不再存次数，改存每个前缀和第一次出现的下标。遇到 <code>sum - k</code> 已经出现过，就用当前下标减去它的第一次下标更新答案。只存第一次出现的位置，才能让区间尽量长。</p>
</blockquote>
<p><strong>前缀和数组会不会溢出？</strong></p>
<blockquote>
<p>JavaScript 的数字是双精度浮点数，整数在 <code>Number.MAX_SAFE_INTEGER</code>（2⁵³ − 1）以内都是精确的。这题的数据范围远小于这个值。数据很大时可以改用 <code>BigInt</code>。</p>
</blockquote>`};export{e as default};