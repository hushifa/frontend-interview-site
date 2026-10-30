var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>路径总和 I（LeetCode 112）问二叉树里有没有一条从根到叶子的路径，节点值加起来等于 <code>targetSum</code>。做法是 DFS：每往下走一个节点，就把目标值减去这个节点的值，走到叶子时看剩下的是不是 0。叶子指左右孩子都为空的节点，空树直接返回 <code>false</code>。</p>
<p>路径总和 II（LeetCode 113）要把所有满足条件的根到叶子路径都列出来。DFS 时用一个数组记录当前走过的节点，到叶子且和对上了，就把数组复制一份放进结果；从一个节点返回时把它从数组里弹出，这就是回溯。</p>
<p>路径总和 III（LeetCode 437）放宽了起点和终点，路径可以从任意节点开始、在任意节点结束，但必须一路向下。对每个节点都往下暴力枚举是 O(n²)。更好的办法是把根到当前节点这条链看成一个数组，套用“和为 K 的子数组”的前缀和思路：用 Map 记录这条链上每个前缀和出现了几次，当前前缀和减去 <code>targetSum</code> 出现过几次，就有几条以当前节点结尾的路径，整体 O(n)。</p>
<p>III 最容易错的是回溯：离开一个节点时，要把它的前缀和计数减 1，因为它不在兄弟子树的那条链上。另外 Map 里要先放 <code>0 → 1</code>，表示从根开始的路径。</p>
</blockquote>
<h2>I 和 II：从根到叶子</h2>
<p>下面先用 LeetCode 的层序数组建树，<code>null</code> 表示空位。示例树来自 LeetCode 113 的示例 1。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">fromLevelOrder</span>(<span class="hljs-params">values</span>) {
  <span class="hljs-keyword">if</span> (values.<span class="hljs-property">length</span> === <span class="hljs-number">0</span> || values[<span class="hljs-number">0</span>] === <span class="hljs-literal">null</span>) <span class="hljs-keyword">return</span> <span class="hljs-literal">null</span>;
  <span class="hljs-keyword">const</span> root = { <span class="hljs-attr">val</span>: values[<span class="hljs-number">0</span>], <span class="hljs-attr">left</span>: <span class="hljs-literal">null</span>, <span class="hljs-attr">right</span>: <span class="hljs-literal">null</span> };
  <span class="hljs-keyword">const</span> queue = [root];
  <span class="hljs-keyword">let</span> i = <span class="hljs-number">1</span>;
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">let</span> head = <span class="hljs-number">0</span>; i &lt; values.<span class="hljs-property">length</span>; head++) {
    <span class="hljs-keyword">const</span> node = queue[head];
    <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> side <span class="hljs-keyword">of</span> [<span class="hljs-string">&#x27;left&#x27;</span>, <span class="hljs-string">&#x27;right&#x27;</span>]) {
      <span class="hljs-keyword">if</span> (i &lt; values.<span class="hljs-property">length</span> &amp;&amp; values[i] !== <span class="hljs-literal">null</span>) {
        node[side] = { <span class="hljs-attr">val</span>: values[i], <span class="hljs-attr">left</span>: <span class="hljs-literal">null</span>, <span class="hljs-attr">right</span>: <span class="hljs-literal">null</span> };
        queue.<span class="hljs-title function_">push</span>(node[side]);
      }
      i++;
    }
  }
  <span class="hljs-keyword">return</span> root;
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">hasPathSum</span>(<span class="hljs-params">root, target</span>) {
  <span class="hljs-keyword">if</span> (!root) <span class="hljs-keyword">return</span> <span class="hljs-literal">false</span>;
  <span class="hljs-keyword">if</span> (!root.<span class="hljs-property">left</span> &amp;&amp; !root.<span class="hljs-property">right</span>) <span class="hljs-keyword">return</span> target === root.<span class="hljs-property">val</span>;
  <span class="hljs-keyword">const</span> rest = target - root.<span class="hljs-property">val</span>;
  <span class="hljs-keyword">return</span> <span class="hljs-title function_">hasPathSum</span>(root.<span class="hljs-property">left</span>, rest) || <span class="hljs-title function_">hasPathSum</span>(root.<span class="hljs-property">right</span>, rest);
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">pathSum</span>(<span class="hljs-params">root, target</span>) {
  <span class="hljs-keyword">const</span> result = [];
  <span class="hljs-keyword">const</span> path = [];
  <span class="hljs-keyword">function</span> <span class="hljs-title function_">dfs</span>(<span class="hljs-params">node, rest</span>) {
    <span class="hljs-keyword">if</span> (!node) <span class="hljs-keyword">return</span>;
    path.<span class="hljs-title function_">push</span>(node.<span class="hljs-property">val</span>);
    rest -= node.<span class="hljs-property">val</span>;
    <span class="hljs-keyword">if</span> (!node.<span class="hljs-property">left</span> &amp;&amp; !node.<span class="hljs-property">right</span> &amp;&amp; rest === <span class="hljs-number">0</span>) result.<span class="hljs-title function_">push</span>([...path]);
    <span class="hljs-title function_">dfs</span>(node.<span class="hljs-property">left</span>, rest);
    <span class="hljs-title function_">dfs</span>(node.<span class="hljs-property">right</span>, rest);
    <span class="hljs-comment">// 回到父节点前，把自己从路径里拿掉</span>
    path.<span class="hljs-title function_">pop</span>();
  }
  <span class="hljs-title function_">dfs</span>(root, target);
  <span class="hljs-keyword">return</span> result;
}

<span class="hljs-keyword">const</span> tree = <span class="hljs-title function_">fromLevelOrder</span>([<span class="hljs-number">5</span>, <span class="hljs-number">4</span>, <span class="hljs-number">8</span>, <span class="hljs-number">11</span>, <span class="hljs-literal">null</span>, <span class="hljs-number">13</span>, <span class="hljs-number">4</span>, <span class="hljs-number">7</span>, <span class="hljs-number">2</span>, <span class="hljs-literal">null</span>, <span class="hljs-literal">null</span>, <span class="hljs-number">5</span>, <span class="hljs-number">1</span>]);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">String</span>(<span class="hljs-title function_">hasPathSum</span>(tree, <span class="hljs-number">22</span>))); <span class="hljs-comment">// true</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">String</span>(<span class="hljs-title function_">hasPathSum</span>(<span class="hljs-title function_">fromLevelOrder</span>([<span class="hljs-number">1</span>, <span class="hljs-number">2</span>, <span class="hljs-number">3</span>]), <span class="hljs-number">5</span>))); <span class="hljs-comment">// false</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">JSON</span>.<span class="hljs-title function_">stringify</span>(<span class="hljs-title function_">pathSum</span>(tree, <span class="hljs-number">22</span>))); <span class="hljs-comment">// [[5,4,11,2],[5,8,4,5]]</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">String</span>(<span class="hljs-title function_">hasPathSum</span>(<span class="hljs-literal">null</span>, <span class="hljs-number">0</span>))); <span class="hljs-comment">// false</span>
</code></pre></div>
<p>为什么判断要放在叶子上，而不是“剩余为 0 就返回”？因为题目要的是根到叶子的路径。如果走到一个中间节点时剩余刚好为 0，下面还有孩子，这条路径并没有走完，不算数。</p>
<p>II 里为什么要 <code>[...path]</code> 复制一份？因为 <code>path</code> 是整个 DFS 共用的数组，后面还会被 <code>push</code> 和 <code>pop</code>。直接把它放进结果，最后结果里所有路径都会指向同一个已经被弹空的数组。</p>
<h2>III：路径可以从中间开始</h2>
<p>先看为什么前缀和能用上。从根到当前节点是一条链，设这条链上的前缀和是 <code>sum</code>。如果链上某个祖先位置的前缀和是 <code>sum - targetSum</code>，那么从它下一个节点到当前节点这一段的和正好是 <code>targetSum</code>。所以只要知道链上有几个前缀和等于 <code>sum - targetSum</code>，就知道有几条以当前节点结尾的路径。这和数组里的做法一样，见<a href="/questions/ds-prefix-sum/">《前缀和与差分怎样用？和为 K 的子数组为什么要配哈希表？》</a>。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">fromLevelOrder</span>(<span class="hljs-params">values</span>) {
  <span class="hljs-keyword">if</span> (values.<span class="hljs-property">length</span> === <span class="hljs-number">0</span> || values[<span class="hljs-number">0</span>] === <span class="hljs-literal">null</span>) <span class="hljs-keyword">return</span> <span class="hljs-literal">null</span>;
  <span class="hljs-keyword">const</span> root = { <span class="hljs-attr">val</span>: values[<span class="hljs-number">0</span>], <span class="hljs-attr">left</span>: <span class="hljs-literal">null</span>, <span class="hljs-attr">right</span>: <span class="hljs-literal">null</span> };
  <span class="hljs-keyword">const</span> queue = [root];
  <span class="hljs-keyword">let</span> i = <span class="hljs-number">1</span>;
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">let</span> head = <span class="hljs-number">0</span>; i &lt; values.<span class="hljs-property">length</span>; head++) {
    <span class="hljs-keyword">const</span> node = queue[head];
    <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> side <span class="hljs-keyword">of</span> [<span class="hljs-string">&#x27;left&#x27;</span>, <span class="hljs-string">&#x27;right&#x27;</span>]) {
      <span class="hljs-keyword">if</span> (i &lt; values.<span class="hljs-property">length</span> &amp;&amp; values[i] !== <span class="hljs-literal">null</span>) {
        node[side] = { <span class="hljs-attr">val</span>: values[i], <span class="hljs-attr">left</span>: <span class="hljs-literal">null</span>, <span class="hljs-attr">right</span>: <span class="hljs-literal">null</span> };
        queue.<span class="hljs-title function_">push</span>(node[side]);
      }
      i++;
    }
  }
  <span class="hljs-keyword">return</span> root;
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">pathSumIII</span>(<span class="hljs-params">root, target</span>) {
  <span class="hljs-comment">// 0 出现 1 次，表示从根节点开始的路径</span>
  <span class="hljs-keyword">const</span> counts = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Map</span>([[<span class="hljs-number">0</span>, <span class="hljs-number">1</span>]]);
  <span class="hljs-keyword">function</span> <span class="hljs-title function_">dfs</span>(<span class="hljs-params">node, sum</span>) {
    <span class="hljs-keyword">if</span> (!node) <span class="hljs-keyword">return</span> <span class="hljs-number">0</span>;
    sum += node.<span class="hljs-property">val</span>;
    <span class="hljs-keyword">let</span> found = counts.<span class="hljs-title function_">get</span>(sum - target) ?? <span class="hljs-number">0</span>;
    counts.<span class="hljs-title function_">set</span>(sum, (counts.<span class="hljs-title function_">get</span>(sum) ?? <span class="hljs-number">0</span>) + <span class="hljs-number">1</span>);
    found += <span class="hljs-title function_">dfs</span>(node.<span class="hljs-property">left</span>, sum) + <span class="hljs-title function_">dfs</span>(node.<span class="hljs-property">right</span>, sum);
    <span class="hljs-comment">// 离开这个节点，它的前缀和不属于兄弟子树那条链</span>
    counts.<span class="hljs-title function_">set</span>(sum, counts.<span class="hljs-title function_">get</span>(sum) - <span class="hljs-number">1</span>);
    <span class="hljs-keyword">return</span> found;
  }
  <span class="hljs-keyword">return</span> <span class="hljs-title function_">dfs</span>(root, <span class="hljs-number">0</span>);
}

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">pathSumIII</span>(<span class="hljs-title function_">fromLevelOrder</span>([<span class="hljs-number">10</span>, <span class="hljs-number">5</span>, -<span class="hljs-number">3</span>, <span class="hljs-number">3</span>, <span class="hljs-number">2</span>, <span class="hljs-literal">null</span>, <span class="hljs-number">11</span>, <span class="hljs-number">3</span>, -<span class="hljs-number">2</span>, <span class="hljs-literal">null</span>, <span class="hljs-number">1</span>]), <span class="hljs-number">8</span>)); <span class="hljs-comment">// 3</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">pathSumIII</span>(<span class="hljs-title function_">fromLevelOrder</span>([<span class="hljs-number">5</span>, <span class="hljs-number">4</span>, <span class="hljs-number">8</span>, <span class="hljs-number">11</span>, <span class="hljs-literal">null</span>, <span class="hljs-number">13</span>, <span class="hljs-number">4</span>, <span class="hljs-number">7</span>, <span class="hljs-number">2</span>, <span class="hljs-literal">null</span>, <span class="hljs-literal">null</span>, <span class="hljs-number">5</span>, <span class="hljs-number">1</span>]), <span class="hljs-number">22</span>)); <span class="hljs-comment">// 3</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">pathSumIII</span>(<span class="hljs-title function_">fromLevelOrder</span>([<span class="hljs-number">1</span>, -<span class="hljs-number">1</span>]), <span class="hljs-number">0</span>)); <span class="hljs-comment">// 1</span>
</code></pre></div>
<p>第一组是 LeetCode 437 的示例 1，和为 8 的路径有 <code>5 → 3</code>、<code>5 → 2 → 1</code>、<code>-3 → 11</code> 三条。</p>
<p>为什么要先查 <code>sum - target</code> 再把 <code>sum</code> 加进 Map？因为路径至少包含一个节点。先加再查，当 <code>target</code> 为 0 时，当前节点会和自己配对，多数出一条长度为 0 的“路径”。最后一组 <code>[1,-1]</code> 中，和为 0 的路径只有 <code>1 → -1</code> 一条，结果是 1；顺序写反的话，每个节点都会和自己配对，结果变成 3。</p>
<p>为什么离开节点时要减回去？Map 里应该只有根到当前节点这条链上的前缀和。左子树遍历完转到右子树时，左子树里的节点已经不在链上了，如果不减掉，右子树的节点会和左子树的节点配对，可它们之间根本没有向下的路径。</p>
<p>时间上每个节点只访问一次，Map 操作平均常数时间，整体 O(n)；空间是 O(h)，h 是树高，来自递归深度和 Map 里的链。LeetCode 437 的节点值范围是 -10⁹ 到 10⁹，最多 1000 个节点，前缀和最大约 10¹²，在 JavaScript 的安全整数范围内。</p>
<h2>常见追问</h2>
<p><strong>III 的暴力解法是什么？</strong></p>
<blockquote>
<p>对每个节点，把它当起点往下 DFS，统计和等于目标值的路径数；再对所有节点重复。每个节点作为起点要往下走一遍，平衡树时约 O(n log n)，退化成链时是 O(n²)。</p>
</blockquote>
<p><strong>II 为什么不在 dfs 里传 <code>[...path, node.val]</code> 的新数组？</strong></p>
<blockquote>
<p>也能写对，而且不用手动 <code>pop</code>。但每层都复制一次数组，额外开销和路径长度成正比。共用一个数组加回溯，只在找到答案时复制。</p>
</blockquote>`};export{e as default};