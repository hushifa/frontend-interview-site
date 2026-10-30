var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>贪心就是每一步都挑眼下最划算的选项，挑了就不再改。比如一天里有好几场会议时间冲突，想参加尽量多的场次，就每次挑最早结束的那场，给后面留出最多时间。贪心的代码通常很短，难点在于说清楚为什么这样选不会错过更好的答案。</p>
<p>跳跃游戏是给一个数组，每个数表示从这里最多能往前跳几格，问从第一格能不能到最后一格。贪心的做法是只记一个数：目前能到达的最远下标。从左往右走，每到一格就用 <code>i + nums[i]</code> 更新最远距离；如果当前下标已经超过了最远距离，说明这格根本到不了，返回 <code>false</code>。</p>
<p>无重叠区间是问最少删掉几个区间，剩下的才能两两不重叠，只在端点相接不算重叠。换个说法就是最多能留下几个。按结束位置从小到大排序，依次检查，起点不早于上一个保留区间的终点就留下，否则删掉。删掉的个数就是答案，时间主要花在排序上，O(n log n)。</p>
<p>要注意，贪心不是总对。判断方法是试着论证“换成贪心的选择不会让结果变差”，或者找反例。比如无重叠区间如果按起点排序、每次留下起点最早的，一个起点早但很长的区间会挡住后面好几个短区间，结果就错了。</p>
</blockquote>
<h2>两题的写法</h2>
<p><code>canJump</code> 只维护一个 <code>farthest</code>；<code>eraseOverlapIntervals</code> 排序后只记上一个保留区间的终点 <code>end</code>。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">canJump</span>(<span class="hljs-params">nums</span>) {
  <span class="hljs-keyword">let</span> farthest = <span class="hljs-number">0</span>;
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">let</span> i = <span class="hljs-number">0</span>; i &lt; nums.<span class="hljs-property">length</span>; i++) {
    <span class="hljs-keyword">if</span> (i &gt; farthest) <span class="hljs-keyword">return</span> <span class="hljs-literal">false</span>;
    farthest = <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">max</span>(farthest, i + nums[i]);
  }
  <span class="hljs-keyword">return</span> <span class="hljs-literal">true</span>;
}

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">canJump</span>([<span class="hljs-number">2</span>, <span class="hljs-number">3</span>, <span class="hljs-number">1</span>, <span class="hljs-number">1</span>, <span class="hljs-number">4</span>])); <span class="hljs-comment">// true</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">canJump</span>([<span class="hljs-number">3</span>, <span class="hljs-number">2</span>, <span class="hljs-number">1</span>, <span class="hljs-number">0</span>, <span class="hljs-number">4</span>])); <span class="hljs-comment">// false</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">canJump</span>([<span class="hljs-number">0</span>])); <span class="hljs-comment">// true</span>

<span class="hljs-keyword">function</span> <span class="hljs-title function_">eraseOverlapIntervals</span>(<span class="hljs-params">intervals</span>) {
  <span class="hljs-keyword">const</span> sorted = [...intervals].<span class="hljs-title function_">sort</span>(<span class="hljs-function">(<span class="hljs-params">a, b</span>) =&gt;</span> a[<span class="hljs-number">1</span>] - b[<span class="hljs-number">1</span>]);
  <span class="hljs-keyword">let</span> removed = <span class="hljs-number">0</span>;
  <span class="hljs-keyword">let</span> end = -<span class="hljs-title class_">Infinity</span>;
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> [start, finish] <span class="hljs-keyword">of</span> sorted) {
    <span class="hljs-keyword">if</span> (start &gt;= end) end = finish;
    <span class="hljs-keyword">else</span> removed++;
  }
  <span class="hljs-keyword">return</span> removed;
}

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">eraseOverlapIntervals</span>([[<span class="hljs-number">1</span>, <span class="hljs-number">2</span>], [<span class="hljs-number">2</span>, <span class="hljs-number">3</span>], [<span class="hljs-number">3</span>, <span class="hljs-number">4</span>], [<span class="hljs-number">1</span>, <span class="hljs-number">3</span>]])); <span class="hljs-comment">// 1</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">eraseOverlapIntervals</span>([[<span class="hljs-number">1</span>, <span class="hljs-number">2</span>], [<span class="hljs-number">1</span>, <span class="hljs-number">2</span>], [<span class="hljs-number">1</span>, <span class="hljs-number">2</span>]])); <span class="hljs-comment">// 2</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">eraseOverlapIntervals</span>([[<span class="hljs-number">1</span>, <span class="hljs-number">2</span>], [<span class="hljs-number">2</span>, <span class="hljs-number">3</span>]])); <span class="hljs-comment">// 0</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">eraseOverlapIntervals</span>([[<span class="hljs-number">1</span>, <span class="hljs-number">100</span>], [<span class="hljs-number">2</span>, <span class="hljs-number">3</span>], [<span class="hljs-number">3</span>, <span class="hljs-number">4</span>], [<span class="hljs-number">4</span>, <span class="hljs-number">5</span>]])); <span class="hljs-comment">// 1</span>
</code></pre></div>
<p><code>[3, 2, 1, 0, 4]</code> 为什么到不了？从下标 0、1、2 出发，最远都只能到下标 3，<code>farthest</code> 一直是 3。下标 3 的值是 0，走不动，到下标 4 时 <code>4 &gt; 3</code>，返回 <code>false</code>。<code>[0]</code> 只有一格，起点就是终点，返回 <code>true</code>。</p>
<p>跳跃游戏为什么不用考虑具体跳几步？只要能到达下标 i，就能到达 i 之前的所有下标，因为可以少跳几格。所以能到达的位置一定是从 0 开始连续的一段，用一个最远下标就能完整描述，具体怎么跳的不影响能不能到终点。</p>
<p>无重叠区间里 <code>start &gt;= end</code> 用的是 <code>&gt;=</code>，因为题目说明只在端点相接的 <code>[1, 2]</code> 和 <code>[2, 3]</code> 不算重叠。最后一个例子说明了为什么按结束位置排：<code>[1, 100]</code> 起点最早，但如果留下它，后面三个都要删。按终点排序后它排在最后，前三个都能留下，只删它一个。</p>
<h2>为什么按结束位置排是对的</h2>
<p>可以这样论证。假设某个最优方案留下的第一个区间不是结束最早的那个，把它换成结束最早的区间：新区间结束得更早，不会和最优方案里后面的区间产生新的冲突，留下的个数不变，所以仍然是最优的。对剩下的区间重复这个论证，就说明每一步都选结束最早的不会比最优方案差。这种论证叫“交换论证”，是证明贪心正确性的常用方法。</p>
<p>排序要传比较函数 <code>(a, b) =&gt; a[1] - b[1]</code>。MDN 说明不传时元素会转成字符串比较，二维数组会被转成 <code>&quot;1,2&quot;</code> 这样的字符串，数字大小就比不对了。<code>[...intervals]</code> 先复制，避免修改调用方的数组。</p>
<h2>常见追问</h2>
<p><strong>跳跃游戏 II 要求最少跳几次怎么做？</strong></p>
<blockquote>
<p>还是贪心，按“层”来算。记下这一跳能覆盖的范围 <code>[start, end]</code>，在这个范围里找出下一跳能到的最远位置，作为下一层的 <code>end</code>，每换一层次数加 1，直到 <code>end</code> 覆盖最后一格。整体还是 O(n)。</p>
</blockquote>
<p><strong>合并区间和无重叠区间有什么区别？</strong></p>
<blockquote>
<p>合并区间是把重叠的区间并成一个，按起点排序；无重叠区间是删掉最少的区间，按终点排序。合并区间的写法和端点相接算不算重叠的讨论见<a href="/questions/alg-merge-intervals/">《如何合并时间区间？相邻区间算不算重叠？》</a>。</p>
</blockquote>
<p><strong>贪心和动态规划怎么选？</strong></p>
<blockquote>
<p>如果能用交换论证说明“每一步选局部最优不会错过全局最优”，就用贪心，通常更快更省空间。说明不了或者能找到反例，比如硬币面额是 1、3、4，凑 6 时贪心先拿 4 得到 4+1+1 三枚，而最优是 3+3 两枚，就要用动态规划，见<a href="/questions/ds-dynamic-programming/">《动态规划怎么入门？爬楼梯和最小路径和怎样做？》</a>。</p>
</blockquote>`};export{e as default};