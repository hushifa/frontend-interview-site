var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>给你 <code>[1, 2, 3]</code>，要列出所有排列：第一位有 3 种选法，选定后第二位剩 2 种，第三位剩 1 种。把这些选择画出来就是一棵树，每条从根到叶子的路径就是一个排列。回溯就是用递归把这棵树走一遍。</p>
<p>写法固定成三步：做选择，把元素放进当前路径 <code>path</code>；递归，去做下一步选择；撤销选择，把刚放进去的元素弹出来，好让同一层试下一个元素。之所以要撤销，是因为整个搜索共用一个 <code>path</code> 数组，不撤销就会把上一条分支的选择带到下一条分支。</p>
<p>三类题的区别只在“下一步能选哪些”。全排列每一步可以选任何还没用过的元素，用 <code>used</code> 数组标记；子集和组合不关心顺序，<code>[1, 2]</code> 和 <code>[2, 1]</code> 算一个，所以用 <code>start</code> 下标规定只能往后选；组合总和允许同一个数重复用，递归时 <code>start</code> 传 <code>i</code> 而不是 <code>i + 1</code>。</p>
<p>要注意两点：收集结果时要存 <code>path</code> 的拷贝，比如 <code>path.slice()</code>，否则存进去的是同一个数组，最后会被撤销成空的；回溯本质上是穷举，全排列有 n! 个结果、子集有 2ⁿ 个，所以只能用在规模很小的输入上，能做的优化是剪枝，提前放弃不可能有解的分支。</p>
</blockquote>
<h2>全排列和子集</h2>
<p>下面两个函数结构几乎一样，看它们在“下一步能选谁”上的不同：<code>permute</code> 每层都从 0 开始扫、靠 <code>used</code> 跳过已选的，<code>subsets</code> 从 <code>start</code> 开始往后扫。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">permute</span>(<span class="hljs-params">nums</span>) {
  <span class="hljs-keyword">const</span> result = [];
  <span class="hljs-keyword">const</span> path = [];
  <span class="hljs-keyword">const</span> used = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Array</span>(nums.<span class="hljs-property">length</span>).<span class="hljs-title function_">fill</span>(<span class="hljs-literal">false</span>);

  <span class="hljs-keyword">function</span> <span class="hljs-title function_">backtrack</span>(<span class="hljs-params"></span>) {
    <span class="hljs-keyword">if</span> (path.<span class="hljs-property">length</span> === nums.<span class="hljs-property">length</span>) {
      result.<span class="hljs-title function_">push</span>(path.<span class="hljs-title function_">slice</span>());
      <span class="hljs-keyword">return</span>;
    }
    <span class="hljs-keyword">for</span> (<span class="hljs-keyword">let</span> i = <span class="hljs-number">0</span>; i &lt; nums.<span class="hljs-property">length</span>; i++) {
      <span class="hljs-keyword">if</span> (used[i]) <span class="hljs-keyword">continue</span>;
      used[i] = <span class="hljs-literal">true</span>;
      path.<span class="hljs-title function_">push</span>(nums[i]); <span class="hljs-comment">// 做选择</span>
      <span class="hljs-title function_">backtrack</span>(); <span class="hljs-comment">// 递归</span>
      path.<span class="hljs-title function_">pop</span>(); <span class="hljs-comment">// 撤销选择</span>
      used[i] = <span class="hljs-literal">false</span>;
    }
  }

  <span class="hljs-title function_">backtrack</span>();
  <span class="hljs-keyword">return</span> result;
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">subsets</span>(<span class="hljs-params">nums</span>) {
  <span class="hljs-keyword">const</span> result = [];
  <span class="hljs-keyword">const</span> path = [];

  <span class="hljs-keyword">function</span> <span class="hljs-title function_">backtrack</span>(<span class="hljs-params">start</span>) {
    result.<span class="hljs-title function_">push</span>(path.<span class="hljs-title function_">slice</span>()); <span class="hljs-comment">// 每个节点都是一个子集，包括空集</span>
    <span class="hljs-keyword">for</span> (<span class="hljs-keyword">let</span> i = start; i &lt; nums.<span class="hljs-property">length</span>; i++) {
      path.<span class="hljs-title function_">push</span>(nums[i]);
      <span class="hljs-title function_">backtrack</span>(i + <span class="hljs-number">1</span>);
      path.<span class="hljs-title function_">pop</span>();
    }
  }

  <span class="hljs-title function_">backtrack</span>(<span class="hljs-number">0</span>);
  <span class="hljs-keyword">return</span> result;
}

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">JSON</span>.<span class="hljs-title function_">stringify</span>(<span class="hljs-title function_">permute</span>([<span class="hljs-number">1</span>, <span class="hljs-number">2</span>, <span class="hljs-number">3</span>])));
<span class="hljs-comment">// [[1,2,3],[1,3,2],[2,1,3],[2,3,1],[3,1,2],[3,2,1]]</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">JSON</span>.<span class="hljs-title function_">stringify</span>(<span class="hljs-title function_">subsets</span>([<span class="hljs-number">1</span>, <span class="hljs-number">2</span>, <span class="hljs-number">3</span>])));
<span class="hljs-comment">// [[],[1],[1,2],[1,2,3],[1,3],[2],[2,3],[3]]</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">permute</span>([]).<span class="hljs-property">length</span>); <span class="hljs-comment">// 1</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">subsets</span>([]).<span class="hljs-property">length</span>); <span class="hljs-comment">// 1</span>
</code></pre></div>
<p>为什么空数组的全排列和子集都是 1 个？空数组只有一种排列，就是什么都不放；子集里也只有空集。代码里 <code>path.length</code> 和 <code>nums.length</code> 一开始都是 0，<code>permute</code> 的终止条件立刻成立，收集一个 <code>[]</code> 后返回，所以结果是 <code>[[]]</code>，长度 1。</p>
<p>为什么一定要 <code>path.slice()</code>？<code>result.push(path)</code> 存进去的是同一个数组的引用。搜索结束时所有选择都被撤销了，<code>path</code> 变回空数组，<code>result</code> 里每一项都指向它，打印出来全是 <code>[]</code>。<code>slice()</code> 不带参数时返回整个数组的浅拷贝，存下的是那一刻的快照。</p>
<p>子集为什么在函数一开头就收集，而不是在叶子收集？因为子集不要求长度固定，树上每个节点对应的路径都是一个合法子集：根节点是空集，往下一层是只有一个元素的子集，依此类推。全排列要求每个元素都用上，所以只在 <code>path</code> 满长时收集。</p>
<h2>组合总和：同一个数可以重复选</h2>
<p>题目是：给一组互不相同的正整数 <code>candidates</code> 和目标值 <code>target</code>，找出所有和为 <code>target</code> 的组合，同一个数可以选多次。看代码里两处和子集不同的地方：递归传的是 <code>i</code>，以及排序后的提前 <code>break</code>。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">combinationSum</span>(<span class="hljs-params">candidates, target</span>) {
  <span class="hljs-keyword">const</span> sorted = candidates.<span class="hljs-title function_">slice</span>().<span class="hljs-title function_">sort</span>(<span class="hljs-function">(<span class="hljs-params">a, b</span>) =&gt;</span> a - b);
  <span class="hljs-keyword">const</span> result = [];
  <span class="hljs-keyword">const</span> path = [];

  <span class="hljs-keyword">function</span> <span class="hljs-title function_">backtrack</span>(<span class="hljs-params">start, remain</span>) {
    <span class="hljs-keyword">if</span> (remain === <span class="hljs-number">0</span>) {
      result.<span class="hljs-title function_">push</span>(path.<span class="hljs-title function_">slice</span>());
      <span class="hljs-keyword">return</span>;
    }
    <span class="hljs-keyword">for</span> (<span class="hljs-keyword">let</span> i = start; i &lt; sorted.<span class="hljs-property">length</span>; i++) {
      <span class="hljs-comment">// 已经升序，当前数放不下，后面更大的数也放不下，整层剪掉</span>
      <span class="hljs-keyword">if</span> (sorted[i] &gt; remain) <span class="hljs-keyword">break</span>;
      path.<span class="hljs-title function_">push</span>(sorted[i]);
      <span class="hljs-title function_">backtrack</span>(i, remain - sorted[i]); <span class="hljs-comment">// 传 i：下一步还能选自己</span>
      path.<span class="hljs-title function_">pop</span>();
    }
  }

  <span class="hljs-title function_">backtrack</span>(<span class="hljs-number">0</span>, target);
  <span class="hljs-keyword">return</span> result;
}

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">JSON</span>.<span class="hljs-title function_">stringify</span>(<span class="hljs-title function_">combinationSum</span>([<span class="hljs-number">2</span>, <span class="hljs-number">3</span>, <span class="hljs-number">6</span>, <span class="hljs-number">7</span>], <span class="hljs-number">7</span>))); <span class="hljs-comment">// [[2,2,3],[7]]</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">JSON</span>.<span class="hljs-title function_">stringify</span>(<span class="hljs-title function_">combinationSum</span>([<span class="hljs-number">2</span>, <span class="hljs-number">3</span>, <span class="hljs-number">5</span>], <span class="hljs-number">8</span>))); <span class="hljs-comment">// [[2,2,2,2],[2,3,3],[3,5]]</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">JSON</span>.<span class="hljs-title function_">stringify</span>(<span class="hljs-title function_">combinationSum</span>([<span class="hljs-number">2</span>], <span class="hljs-number">1</span>))); <span class="hljs-comment">// []</span>
</code></pre></div>
<p>递归传 <code>i</code> 和传 <code>i + 1</code> 差在哪？传 <code>i + 1</code> 表示选过的数不能再选，这就是普通组合；传 <code>i</code> 表示下一步还能从自己开始选，于是能出现 <code>[2, 2, 3]</code>。但无论哪种，都不会回头选下标更小的数，所以 <code>[3, 2, 2]</code> 不会再出现一次。</p>
<p><code>break</code> 为什么是安全的？数组已经升序，<code>sorted[i]</code> 比剩余值大，后面的数只会更大，这一层剩下的分支都不可能凑出解。这就是剪枝：不改变结果，只是少走没有希望的分支。没排序时只能写 <code>continue</code>，省下的工作就少很多。</p>
<p><code>[2]</code> 凑 1 为什么返回空数组？2 一上来就比 1 大，被剪掉，没有任何路径能走到 <code>remain === 0</code>，所以一个结果也没有。</p>
<h2>复杂度为什么这么高</h2>
<p>全排列一共有 n! 个结果，每个结果拷贝一次要 O(n)，所以时间是 O(n × n!)；子集有 2ⁿ 个，时间是 O(n × 2ⁿ)。递归深度最多 n，额外空间是 <code>path</code>、<code>used</code> 和调用栈的 O(n)，不算存结果的部分。组合总和的结果数量取决于具体数字，没有简单的公式，剪枝能省多少也看数据。</p>
<p>所以回溯题的输入通常很小，比如 n 不超过 10 左右。题目只问“有多少种”而不需要列出每一种时，往往可以改用动态规划计数，见<a href="/questions/ds-dynamic-programming/">《动态规划怎么入门？爬楼梯和最小路径和怎样做？》</a>。</p>
<h2>常见追问</h2>
<p><strong>输入里有重复数字，全排列怎样去重？</strong></p>
<blockquote>
<p>先排序，让相同的数挨在一起。然后在循环里加一条：<code>if (i &gt; 0 &amp;&amp; nums[i] === nums[i - 1] &amp;&amp; !used[i - 1]) continue</code>。意思是相同的几个数必须按从左到右的顺序使用，前一个还没用时不能先用后一个，这样同一层就不会把相同的数各选一次，产生重复的排列。</p>
</blockquote>
<p><strong>回溯和深度优先搜索是什么关系？</strong></p>
<blockquote>
<p>回溯就是在选择树上做深度优先搜索，多出来的是“撤销选择”这一步。普通的 DFS 遍历一棵已有的树，节点状态不用恢复；回溯的树是边走边构造的，所有分支共用一份 <code>path</code>，所以离开一个节点时必须把状态还原。</p>
</blockquote>
<p><strong>递归太深会不会爆栈？</strong></p>
<blockquote>
<p>回溯的递归深度等于路径长度，也就是最多 n 层，而 n 本来就很小，一般不会爆栈。真正的瓶颈是结果数量带来的时间，不是栈深度。</p>
</blockquote>`};export{e as default};