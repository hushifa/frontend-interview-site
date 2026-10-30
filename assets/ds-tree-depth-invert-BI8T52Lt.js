var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>这三题是二叉树递归的入门题。最大深度是从根走到最远叶子经过的节点数；翻转二叉树是把整棵树左右镜像过来；对称二叉树是判断一棵树和它自己的镜像是不是一样。</p>
<p>写递归的思路都一样：先想清楚空树返回什么，再假设子树的结果已经算好，看当前节点怎么用这两个结果。最大深度是 <code>max(左深度, 右深度) + 1</code>；翻转是交换左右子节点，再各自翻转；对称要写一个同时接收两个节点的辅助函数，比较两边的值，再递归比较“左的左和右的右”“左的右和右的左”。</p>
<p>这类分解很常见，比如计算组件树的嵌套层数、把左右布局镜像过来、判断两份树形配置是不是一样，都是同样的递归。</p>
<p>要注意，对称不是“左子树等于右子树”，而是左子树等于右子树的镜像，比较时外侧对外侧、内侧对内侧。三题都是 O(n) 时间，递归深度等于树高，树退化成链时可能很深，这时可以改用队列或栈迭代。</p>
</blockquote>
<h2>三题的写法</h2>
<p><code>fromLevelOrder</code> 按 LeetCode 的层序数组建树，<code>toLevelOrder</code> 把树转回数组方便打印。重点看 <code>isMirror</code> 两次递归传的是哪两个节点。</p>
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

<span class="hljs-keyword">function</span> <span class="hljs-title function_">toLevelOrder</span>(<span class="hljs-params">root</span>) {
  <span class="hljs-keyword">const</span> result = [];
  <span class="hljs-keyword">const</span> queue = [root];
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">let</span> head = <span class="hljs-number">0</span>; head &lt; queue.<span class="hljs-property">length</span>; head++) {
    <span class="hljs-keyword">const</span> node = queue[head];
    result.<span class="hljs-title function_">push</span>(node ? node.<span class="hljs-property">val</span> : <span class="hljs-literal">null</span>);
    <span class="hljs-keyword">if</span> (node) queue.<span class="hljs-title function_">push</span>(node.<span class="hljs-property">left</span>, node.<span class="hljs-property">right</span>);
  }
  <span class="hljs-keyword">while</span> (result.<span class="hljs-property">length</span> &amp;&amp; result[result.<span class="hljs-property">length</span> - <span class="hljs-number">1</span>] === <span class="hljs-literal">null</span>) result.<span class="hljs-title function_">pop</span>();
  <span class="hljs-keyword">return</span> <span class="hljs-title class_">JSON</span>.<span class="hljs-title function_">stringify</span>(result);
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">maxDepth</span>(<span class="hljs-params">root</span>) {
  <span class="hljs-keyword">if</span> (!root) <span class="hljs-keyword">return</span> <span class="hljs-number">0</span>;
  <span class="hljs-keyword">return</span> <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">max</span>(<span class="hljs-title function_">maxDepth</span>(root.<span class="hljs-property">left</span>), <span class="hljs-title function_">maxDepth</span>(root.<span class="hljs-property">right</span>)) + <span class="hljs-number">1</span>;
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">invertTree</span>(<span class="hljs-params">root</span>) {
  <span class="hljs-keyword">if</span> (!root) <span class="hljs-keyword">return</span> <span class="hljs-literal">null</span>;
  [root.<span class="hljs-property">left</span>, root.<span class="hljs-property">right</span>] = [<span class="hljs-title function_">invertTree</span>(root.<span class="hljs-property">right</span>), <span class="hljs-title function_">invertTree</span>(root.<span class="hljs-property">left</span>)];
  <span class="hljs-keyword">return</span> root;
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">isSymmetric</span>(<span class="hljs-params">root</span>) {
  <span class="hljs-keyword">return</span> <span class="hljs-title function_">isMirror</span>(root?.<span class="hljs-property">left</span> ?? <span class="hljs-literal">null</span>, root?.<span class="hljs-property">right</span> ?? <span class="hljs-literal">null</span>);
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">isMirror</span>(<span class="hljs-params">a, b</span>) {
  <span class="hljs-keyword">if</span> (!a || !b) <span class="hljs-keyword">return</span> a === b;
  <span class="hljs-keyword">return</span> a.<span class="hljs-property">val</span> === b.<span class="hljs-property">val</span> &amp;&amp; <span class="hljs-title function_">isMirror</span>(a.<span class="hljs-property">left</span>, b.<span class="hljs-property">right</span>) &amp;&amp; <span class="hljs-title function_">isMirror</span>(a.<span class="hljs-property">right</span>, b.<span class="hljs-property">left</span>);
}

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">maxDepth</span>(<span class="hljs-title function_">fromLevelOrder</span>([<span class="hljs-number">3</span>, <span class="hljs-number">9</span>, <span class="hljs-number">20</span>, <span class="hljs-literal">null</span>, <span class="hljs-literal">null</span>, <span class="hljs-number">15</span>, <span class="hljs-number">7</span>]))); <span class="hljs-comment">// 3</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">maxDepth</span>(<span class="hljs-title function_">fromLevelOrder</span>([<span class="hljs-number">1</span>, <span class="hljs-literal">null</span>, <span class="hljs-number">2</span>]))); <span class="hljs-comment">// 2</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">maxDepth</span>(<span class="hljs-title function_">fromLevelOrder</span>([]))); <span class="hljs-comment">// 0</span>

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">toLevelOrder</span>(<span class="hljs-title function_">invertTree</span>(<span class="hljs-title function_">fromLevelOrder</span>([<span class="hljs-number">4</span>, <span class="hljs-number">2</span>, <span class="hljs-number">7</span>, <span class="hljs-number">1</span>, <span class="hljs-number">3</span>, <span class="hljs-number">6</span>, <span class="hljs-number">9</span>])))); <span class="hljs-comment">// [4,7,2,9,6,3,1]</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">toLevelOrder</span>(<span class="hljs-title function_">invertTree</span>(<span class="hljs-title function_">fromLevelOrder</span>([<span class="hljs-number">2</span>, <span class="hljs-number">1</span>, <span class="hljs-number">3</span>])))); <span class="hljs-comment">// [2,3,1]</span>

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">isSymmetric</span>(<span class="hljs-title function_">fromLevelOrder</span>([<span class="hljs-number">1</span>, <span class="hljs-number">2</span>, <span class="hljs-number">2</span>, <span class="hljs-number">3</span>, <span class="hljs-number">4</span>, <span class="hljs-number">4</span>, <span class="hljs-number">3</span>]))); <span class="hljs-comment">// true</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">isSymmetric</span>(<span class="hljs-title function_">fromLevelOrder</span>([<span class="hljs-number">1</span>, <span class="hljs-number">2</span>, <span class="hljs-number">2</span>, <span class="hljs-literal">null</span>, <span class="hljs-number">3</span>, <span class="hljs-literal">null</span>, <span class="hljs-number">3</span>]))); <span class="hljs-comment">// false</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">isSymmetric</span>(<span class="hljs-title function_">fromLevelOrder</span>([<span class="hljs-number">1</span>, <span class="hljs-number">2</span>, <span class="hljs-number">2</span>, <span class="hljs-number">3</span>, <span class="hljs-number">4</span>, <span class="hljs-number">3</span>, <span class="hljs-number">4</span>]))); <span class="hljs-comment">// false</span>
</code></pre></div>
<p><code>maxDepth</code> 为什么空树返回 0？深度按节点数算，空树没有节点。叶子节点左右都是 0，加 1 得到 1，正好是它自己这一个节点，往上每层再加 1。</p>
<p><code>invertTree</code> 里交换和递归写在一行，右边的数组先算完两次递归，再整体赋值给左右两边，所以不会出现“先改了 <code>root.left</code> 再去翻转它”的问题。拆成几行写时，要先用临时变量存住一边。</p>
<p>最后一个对称的例子说明了为什么不能简单比较左右子树。<code>[1,2,2,3,4,3,4]</code> 的左子树是 2 下面挂 3、4，右子树也是 2 下面挂 3、4，两边完全一样，但镜像要求左边的 3 对着右边的 4，所以不对称。<code>isMirror</code> 第一行处理了空节点：两个都空算对称，只有一个空就不对称，<code>a === b</code> 正好同时表达这两种情况。</p>
<h2>不用递归怎么写</h2>
<p>最大深度可以用层序遍历数层数，见<a href="/questions/ds-binary-tree-bfs/">《二叉树怎样按层输出层序遍历结果？》</a>。对称二叉树可以用队列，每次成对放入 <code>(a.left, b.right)</code> 和 <code>(a.right, b.left)</code>，成对取出比较。翻转二叉树用栈或队列都行，取出一个节点就交换它的左右子节点，再把子节点放进去，访问顺序不影响结果，因为每个节点只需要交换一次。</p>
<h2>常见追问</h2>
<p><strong>最小深度能不能把 <code>max</code> 换成 <code>min</code>？</strong></p>
<blockquote>
<p>不能直接换。最小深度是到最近的叶子节点，如果一个节点只有右子树，左边是空的，<code>min</code> 会取到 0，把它算成叶子。要单独处理：一边为空时用另一边的深度加 1，两边都有时才取较小值。</p>
</blockquote>
<p><strong>怎么判断两棵树完全相同？</strong></p>
<blockquote>
<p>和 <code>isMirror</code> 几乎一样，只是递归改成比较 <code>a.left</code> 和 <code>b.left</code>、<code>a.right</code> 和 <code>b.right</code>。</p>
</blockquote>
<p><strong>翻转二叉树会创建新节点吗？</strong></p>
<blockquote>
<p>上面的写法是原地修改，返回的还是原来的根节点，只是每个节点的左右指针交换了。如果需要保留原树，就在递归里新建节点，左子节点取翻转后的右子树，右子节点取翻转后的左子树。</p>
</blockquote>`};export{e as default};