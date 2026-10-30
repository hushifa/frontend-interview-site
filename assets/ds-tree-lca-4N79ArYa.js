var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>最近公共祖先就是树里离 p、q 最近、同时把它们都包含在自己子树里的那个节点，节点也算自己的后代。比如组织架构图里，两个员工的最近公共祖先就是同时管着他俩的、级别最低的那位领导；如果其中一个人就是另一个人的上级，答案就是这个上级本人。</p>
<p>普通二叉树用后序递归。函数的意思是“在这棵子树里找 p 或 q”：遇到空节点、p 或 q 就直接返回当前节点。否则先问左子树、再问右子树，两边都带回了结果，说明 p、q 分在当前节点两侧，当前节点就是答案；只有一边有结果，就把那一边的结果原样往上交。</p>
<p>二叉搜索树每个节点左边都比它小、右边都比它大，所以从根往下走就行：p、q 都比当前值小，答案在左子树；都比它大就在右子树；一个不大于、一个不小于，说明它们在这里分叉，当前节点就是答案。</p>
<p>要注意，普通二叉树的写法依赖题目保证 p、q 都在树里，如果 q 不存在，函数会直接返回 p，不能当成“找到了公共祖先”。普通二叉树是 O(n)，二叉搜索树是 O(h)，h 是树高，树退化成一条链时也是 O(n)。</p>
</blockquote>
<h2>两种写法</h2>
<p><code>fromLevelOrder</code> 按 LeetCode 的层序数组建树，<code>null</code> 表示空位。看 <code>lowestCommonAncestor</code> 里什么时候返回 <code>root</code>，什么时候返回某一边的结果。</p>
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

<span class="hljs-keyword">function</span> <span class="hljs-title function_">find</span>(<span class="hljs-params">root, val</span>) {
  <span class="hljs-keyword">if</span> (!root || root.<span class="hljs-property">val</span> === val) <span class="hljs-keyword">return</span> root;
  <span class="hljs-keyword">return</span> <span class="hljs-title function_">find</span>(root.<span class="hljs-property">left</span>, val) ?? <span class="hljs-title function_">find</span>(root.<span class="hljs-property">right</span>, val);
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">lowestCommonAncestor</span>(<span class="hljs-params">root, p, q</span>) {
  <span class="hljs-keyword">if</span> (!root || root === p || root === q) <span class="hljs-keyword">return</span> root;
  <span class="hljs-keyword">const</span> left = <span class="hljs-title function_">lowestCommonAncestor</span>(root.<span class="hljs-property">left</span>, p, q);
  <span class="hljs-keyword">const</span> right = <span class="hljs-title function_">lowestCommonAncestor</span>(root.<span class="hljs-property">right</span>, p, q);
  <span class="hljs-keyword">if</span> (left &amp;&amp; right) <span class="hljs-keyword">return</span> root;
  <span class="hljs-keyword">return</span> left ?? right;
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">lowestCommonAncestorBST</span>(<span class="hljs-params">root, p, q</span>) {
  <span class="hljs-keyword">let</span> node = root;
  <span class="hljs-keyword">while</span> (node) {
    <span class="hljs-keyword">if</span> (p.<span class="hljs-property">val</span> &lt; node.<span class="hljs-property">val</span> &amp;&amp; q.<span class="hljs-property">val</span> &lt; node.<span class="hljs-property">val</span>) node = node.<span class="hljs-property">left</span>;
    <span class="hljs-keyword">else</span> <span class="hljs-keyword">if</span> (p.<span class="hljs-property">val</span> &gt; node.<span class="hljs-property">val</span> &amp;&amp; q.<span class="hljs-property">val</span> &gt; node.<span class="hljs-property">val</span>) node = node.<span class="hljs-property">right</span>;
    <span class="hljs-keyword">else</span> <span class="hljs-keyword">return</span> node;
  }
  <span class="hljs-keyword">return</span> <span class="hljs-literal">null</span>;
}

<span class="hljs-keyword">const</span> tree = <span class="hljs-title function_">fromLevelOrder</span>([<span class="hljs-number">3</span>, <span class="hljs-number">5</span>, <span class="hljs-number">1</span>, <span class="hljs-number">6</span>, <span class="hljs-number">2</span>, <span class="hljs-number">0</span>, <span class="hljs-number">8</span>, <span class="hljs-literal">null</span>, <span class="hljs-literal">null</span>, <span class="hljs-number">7</span>, <span class="hljs-number">4</span>]);
<span class="hljs-keyword">const</span> <span class="hljs-title function_">lca</span> = (<span class="hljs-params">a, b</span>) =&gt; <span class="hljs-title function_">lowestCommonAncestor</span>(tree, <span class="hljs-title function_">find</span>(tree, a), <span class="hljs-title function_">find</span>(tree, b)).<span class="hljs-property">val</span>;
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">lca</span>(<span class="hljs-number">5</span>, <span class="hljs-number">1</span>)); <span class="hljs-comment">// 3</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">lca</span>(<span class="hljs-number">5</span>, <span class="hljs-number">4</span>)); <span class="hljs-comment">// 5</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">lca</span>(<span class="hljs-number">7</span>, <span class="hljs-number">8</span>)); <span class="hljs-comment">// 3</span>

<span class="hljs-keyword">const</span> bst = <span class="hljs-title function_">fromLevelOrder</span>([<span class="hljs-number">6</span>, <span class="hljs-number">2</span>, <span class="hljs-number">8</span>, <span class="hljs-number">0</span>, <span class="hljs-number">4</span>, <span class="hljs-number">7</span>, <span class="hljs-number">9</span>, <span class="hljs-literal">null</span>, <span class="hljs-literal">null</span>, <span class="hljs-number">3</span>, <span class="hljs-number">5</span>]);
<span class="hljs-keyword">const</span> <span class="hljs-title function_">lcaBST</span> = (<span class="hljs-params">a, b</span>) =&gt; <span class="hljs-title function_">lowestCommonAncestorBST</span>(bst, <span class="hljs-title function_">find</span>(bst, a), <span class="hljs-title function_">find</span>(bst, b)).<span class="hljs-property">val</span>;
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">lcaBST</span>(<span class="hljs-number">2</span>, <span class="hljs-number">8</span>)); <span class="hljs-comment">// 6</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">lcaBST</span>(<span class="hljs-number">2</span>, <span class="hljs-number">4</span>)); <span class="hljs-comment">// 2</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">lcaBST</span>(<span class="hljs-number">3</span>, <span class="hljs-number">5</span>)); <span class="hljs-comment">// 4</span>
</code></pre></div>
<p>第二个例子里 4 在 5 的子树中。递归走到 5 时直接返回 5，不再往下找 4，可是答案仍然对：3 的右子树里没有 p 也没有 q，返回 <code>null</code>，于是 3 把左边带回的 5 往上交，最后结果就是 5。这里能省掉往下找，正是因为题目保证 p、q 都在树里，找到其中一个、另一个又不在别的分支，那它只能在这个节点下面。</p>
<p>为什么两边都有结果时当前节点就是“最近”的？递归是后序的，先处理完子树才轮到当前节点。p、q 分在左右两边时，再往下走任何一边都只能包含其中一个，所以当前节点是满足条件的最深节点；往上的祖先收到的只有一边结果，会把它原样传上去，不会覆盖。</p>
<h2>二叉搜索树为什么能直接往下走</h2>
<p>二叉搜索树的规则是左子树所有值都比节点小，右子树所有值都比节点大。p、q 都比当前值小，它们只可能在左子树里，当前节点和右子树都可以排除。一旦 p、q 落在当前值的两侧，或者其中一个就等于当前值，它们就从这个节点开始分开了，再往下任何一边都装不下两者。所以每层只走一步，时间是 O(h)，额外空间 O(1)。这个写法假设节点值互不相同，LeetCode 235 的约束里写明了这一点。</p>
<h2>常见追问</h2>
<p><strong>如果 p 或 q 可能不在树里怎么办？</strong></p>
<blockquote>
<p>递归时额外记下 p、q 各自有没有真的遇到过，并且遇到 p 或 q 以后还要继续搜它的子树，不能提前返回。最后两个都遇到过才返回结果，否则返回 <code>null</code>。</p>
</blockquote>
<p><strong>节点有指向父节点的指针时怎么做？</strong></p>
<blockquote>
<p>这就变成了两条链表求第一个交点。从 p 往上把祖先都放进 Set，再从 q 往上走，第一个在 Set 里的节点就是答案。也可以用两个指针轮流走两条路径，不用额外空间。</p>
</blockquote>
<p><strong>前端里哪里会遇到这个问题？</strong></p>
<blockquote>
<p>DOM 树就是一个例子。浏览器的 <code>Range</code> 有 <code>commonAncestorContainer</code> 属性，返回包含选区起点和终点的最深节点。DOM 节点有 <code>parentNode</code>，自己实现时可以用上一问的父指针做法。</p>
</blockquote>`};export{e as default};