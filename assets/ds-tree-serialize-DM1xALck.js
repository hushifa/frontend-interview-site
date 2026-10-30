var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>比如要把一棵二叉树存进 localStorage 或者通过接口发给别人，就得先把它变成字符串，这叫序列化；拿到字符串再把原来的树建回来，叫反序列化。LeetCode 297 就是这道题，它不限定格式，只要求能还原成原来的结构。</p>
<p>难点在空节点。只记录节点值的话，同一串值可以对应好几棵形状不同的树，所以空的位置也要记下来。前序写法遇到空节点写一个 <code>#</code>，层序写法写 <code>null</code>，有了这些标记，结构就唯一确定了。</p>
<p>两种写法各有用处。前序写法代码短，序列化和反序列化都是同一个递归顺序，读一个标记建一个节点；层序写法和 LeetCode 题面的 <code>[1,2,3,null,null,4,5]</code> 格式一样，用队列一层层处理，树很深时也不会递归太深。</p>
<p>要注意两点。第一，反序列化必须严格按序列化时的顺序读，前序就前序、层序就层序。第二，层序写法末尾的 <code>null</code> 可以省掉，但还原时要处理右孩子标记读不到的情况。</p>
</blockquote>
<h2>为什么空节点必须记下来</h2>
<p>只记录前序遍历的值，<code>1,2</code> 既可以是“2 是 1 的左孩子”，也可以是“2 是 1 的右孩子”，两棵树的前序结果一样，所以无法唯一还原。前序遍历的写法见<a href="/questions/ds-tree-iterative-traversal/">《二叉树的前序、中序、后序遍历怎样用递归和迭代写？》</a>。</p>
<p>把空节点也写出来就不一样了。左孩子的情况写成 <code>1,2,#,#,#</code>，右孩子的情况写成 <code>1,#,2,#,#</code>。每个节点后面紧跟着它的左子树和右子树，空子树也占一个位置，读的时候每一步该建哪个节点就确定了。</p>
<h2>前序加空标记的写法</h2>
<p>下面用 LeetCode 题面示例里的树：根是 1，左孩子 2，右孩子 3，3 下面挂着 4 和 5。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">TreeNode</span>(<span class="hljs-params">val, left = <span class="hljs-literal">null</span>, right = <span class="hljs-literal">null</span></span>) {
  <span class="hljs-variable language_">this</span>.<span class="hljs-property">val</span> = val;
  <span class="hljs-variable language_">this</span>.<span class="hljs-property">left</span> = left;
  <span class="hljs-variable language_">this</span>.<span class="hljs-property">right</span> = right;
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">serialize</span>(<span class="hljs-params">root</span>) {
  <span class="hljs-keyword">const</span> out = [];
  <span class="hljs-keyword">function</span> <span class="hljs-title function_">walk</span>(<span class="hljs-params">node</span>) {
    <span class="hljs-keyword">if</span> (node === <span class="hljs-literal">null</span>) {
      out.<span class="hljs-title function_">push</span>(<span class="hljs-string">&#x27;#&#x27;</span>);
      <span class="hljs-keyword">return</span>;
    }
    out.<span class="hljs-title function_">push</span>(<span class="hljs-title class_">String</span>(node.<span class="hljs-property">val</span>));
    <span class="hljs-title function_">walk</span>(node.<span class="hljs-property">left</span>);
    <span class="hljs-title function_">walk</span>(node.<span class="hljs-property">right</span>);
  }
  <span class="hljs-title function_">walk</span>(root);
  <span class="hljs-keyword">return</span> out.<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;,&#x27;</span>);
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">deserialize</span>(<span class="hljs-params">data</span>) {
  <span class="hljs-keyword">const</span> tokens = data.<span class="hljs-title function_">split</span>(<span class="hljs-string">&#x27;,&#x27;</span>);
  <span class="hljs-keyword">let</span> i = <span class="hljs-number">0</span>;
  <span class="hljs-keyword">function</span> <span class="hljs-title function_">build</span>(<span class="hljs-params"></span>) {
    <span class="hljs-keyword">const</span> token = tokens[i++];
    <span class="hljs-keyword">if</span> (token === <span class="hljs-string">&#x27;#&#x27;</span>) <span class="hljs-keyword">return</span> <span class="hljs-literal">null</span>;
    <span class="hljs-keyword">const</span> node = <span class="hljs-keyword">new</span> <span class="hljs-title class_">TreeNode</span>(<span class="hljs-title class_">Number</span>(token));
    node.<span class="hljs-property">left</span> = <span class="hljs-title function_">build</span>();
    node.<span class="hljs-property">right</span> = <span class="hljs-title function_">build</span>();
    <span class="hljs-keyword">return</span> node;
  }
  <span class="hljs-keyword">return</span> <span class="hljs-title function_">build</span>();
}

<span class="hljs-keyword">const</span> root = <span class="hljs-keyword">new</span> <span class="hljs-title class_">TreeNode</span>(<span class="hljs-number">1</span>, <span class="hljs-keyword">new</span> <span class="hljs-title class_">TreeNode</span>(<span class="hljs-number">2</span>), <span class="hljs-keyword">new</span> <span class="hljs-title class_">TreeNode</span>(<span class="hljs-number">3</span>, <span class="hljs-keyword">new</span> <span class="hljs-title class_">TreeNode</span>(<span class="hljs-number">4</span>), <span class="hljs-keyword">new</span> <span class="hljs-title class_">TreeNode</span>(<span class="hljs-number">5</span>)));
<span class="hljs-keyword">const</span> text = <span class="hljs-title function_">serialize</span>(root);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(text); <span class="hljs-comment">// 1,2,#,#,3,4,#,#,5,#,#</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">serialize</span>(<span class="hljs-title function_">deserialize</span>(text)) === text ? <span class="hljs-string">&#x27;一致&#x27;</span> : <span class="hljs-string">&#x27;不一致&#x27;</span>); <span class="hljs-comment">// 一致</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">serialize</span>(<span class="hljs-literal">null</span>)); <span class="hljs-comment">// #</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">deserialize</span>(<span class="hljs-string">&#x27;#&#x27;</span>) === <span class="hljs-literal">null</span> ? <span class="hljs-string">&#x27;空树&#x27;</span> : <span class="hljs-string">&#x27;非空&#x27;</span>); <span class="hljs-comment">// 空树</span>
</code></pre></div>
<p>序列化结果是 <code>1,2,#,#,3,4,#,#,5,#,#</code>。2 是叶子，所以后面跟着两个 <code>#</code>，分别代表它的空左孩子和空右孩子。</p>
<p>为什么反序列化只用一个下标 <code>i</code> 就够了？因为 <code>build</code> 的顺序和 <code>walk</code> 完全一样：先读当前节点，再递归建左子树，再递归建右子树。左子树建完时，<code>i</code> 正好停在右子树的第一个标记上。读到 <code>#</code> 就返回 <code>null</code>，递归自然在这里停下。</p>
<p>空树序列化成 <code>#</code>，还原回来是 <code>null</code>，不需要额外判断。这种写法的缺点是递归深度等于树高，题目约束节点数最多 10⁴，如果树退化成一条链，递归就有一万层，可以按需改成用栈的迭代写法。</p>
<h2>层序写法</h2>
<p>层序写法就是 LeetCode 题面用的格式。序列化时用队列按层取节点，空孩子也放进队列，取到空的写 <code>null</code>；层序遍历本身见<a href="/questions/ds-binary-tree-bfs/">《二叉树怎样按层输出层序遍历结果？》</a>。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">TreeNode</span>(<span class="hljs-params">val, left = <span class="hljs-literal">null</span>, right = <span class="hljs-literal">null</span></span>) {
  <span class="hljs-variable language_">this</span>.<span class="hljs-property">val</span> = val;
  <span class="hljs-variable language_">this</span>.<span class="hljs-property">left</span> = left;
  <span class="hljs-variable language_">this</span>.<span class="hljs-property">right</span> = right;
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">serialize</span>(<span class="hljs-params">root</span>) {
  <span class="hljs-keyword">if</span> (root === <span class="hljs-literal">null</span>) <span class="hljs-keyword">return</span> <span class="hljs-string">&#x27;&#x27;</span>;
  <span class="hljs-keyword">const</span> out = [];
  <span class="hljs-keyword">const</span> queue = [root];
  <span class="hljs-keyword">let</span> head = <span class="hljs-number">0</span>;
  <span class="hljs-keyword">while</span> (head &lt; queue.<span class="hljs-property">length</span>) {
    <span class="hljs-keyword">const</span> node = queue[head++];
    <span class="hljs-keyword">if</span> (node === <span class="hljs-literal">null</span>) {
      out.<span class="hljs-title function_">push</span>(<span class="hljs-string">&#x27;null&#x27;</span>);
      <span class="hljs-keyword">continue</span>;
    }
    out.<span class="hljs-title function_">push</span>(<span class="hljs-title class_">String</span>(node.<span class="hljs-property">val</span>));
    queue.<span class="hljs-title function_">push</span>(node.<span class="hljs-property">left</span>, node.<span class="hljs-property">right</span>);
  }
  <span class="hljs-comment">// 末尾的 null 不影响还原，去掉后和 LeetCode 的写法一致。</span>
  <span class="hljs-keyword">while</span> (out[out.<span class="hljs-property">length</span> - <span class="hljs-number">1</span>] === <span class="hljs-string">&#x27;null&#x27;</span>) out.<span class="hljs-title function_">pop</span>();
  <span class="hljs-keyword">return</span> out.<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;,&#x27;</span>);
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">deserialize</span>(<span class="hljs-params">data</span>) {
  <span class="hljs-keyword">if</span> (data === <span class="hljs-string">&#x27;&#x27;</span>) <span class="hljs-keyword">return</span> <span class="hljs-literal">null</span>;
  <span class="hljs-keyword">const</span> tokens = data.<span class="hljs-title function_">split</span>(<span class="hljs-string">&#x27;,&#x27;</span>);
  <span class="hljs-keyword">const</span> root = <span class="hljs-keyword">new</span> <span class="hljs-title class_">TreeNode</span>(<span class="hljs-title class_">Number</span>(tokens[<span class="hljs-number">0</span>]));
  <span class="hljs-keyword">const</span> queue = [root];
  <span class="hljs-keyword">let</span> head = <span class="hljs-number">0</span>;
  <span class="hljs-keyword">let</span> i = <span class="hljs-number">1</span>;
  <span class="hljs-keyword">while</span> (i &lt; tokens.<span class="hljs-property">length</span>) {
    <span class="hljs-keyword">const</span> parent = queue[head++];
    <span class="hljs-keyword">const</span> leftToken = tokens[i++];
    <span class="hljs-keyword">if</span> (leftToken !== <span class="hljs-string">&#x27;null&#x27;</span>) {
      parent.<span class="hljs-property">left</span> = <span class="hljs-keyword">new</span> <span class="hljs-title class_">TreeNode</span>(<span class="hljs-title class_">Number</span>(leftToken));
      queue.<span class="hljs-title function_">push</span>(parent.<span class="hljs-property">left</span>);
    }
    <span class="hljs-keyword">const</span> rightToken = tokens[i++];
    <span class="hljs-keyword">if</span> (rightToken !== <span class="hljs-literal">undefined</span> &amp;&amp; rightToken !== <span class="hljs-string">&#x27;null&#x27;</span>) {
      parent.<span class="hljs-property">right</span> = <span class="hljs-keyword">new</span> <span class="hljs-title class_">TreeNode</span>(<span class="hljs-title class_">Number</span>(rightToken));
      queue.<span class="hljs-title function_">push</span>(parent.<span class="hljs-property">right</span>);
    }
  }
  <span class="hljs-keyword">return</span> root;
}

<span class="hljs-keyword">const</span> root = <span class="hljs-keyword">new</span> <span class="hljs-title class_">TreeNode</span>(<span class="hljs-number">1</span>, <span class="hljs-keyword">new</span> <span class="hljs-title class_">TreeNode</span>(<span class="hljs-number">2</span>), <span class="hljs-keyword">new</span> <span class="hljs-title class_">TreeNode</span>(<span class="hljs-number">3</span>, <span class="hljs-keyword">new</span> <span class="hljs-title class_">TreeNode</span>(<span class="hljs-number">4</span>), <span class="hljs-keyword">new</span> <span class="hljs-title class_">TreeNode</span>(<span class="hljs-number">5</span>)));
<span class="hljs-keyword">const</span> text = <span class="hljs-title function_">serialize</span>(root);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(text); <span class="hljs-comment">// 1,2,3,null,null,4,5</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">serialize</span>(<span class="hljs-title function_">deserialize</span>(text)) === text ? <span class="hljs-string">&#x27;一致&#x27;</span> : <span class="hljs-string">&#x27;不一致&#x27;</span>); <span class="hljs-comment">// 一致</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">deserialize</span>(<span class="hljs-string">&#x27;1,2,3,null,null,4,5&#x27;</span>).<span class="hljs-property">right</span>.<span class="hljs-property">left</span>.<span class="hljs-property">val</span>); <span class="hljs-comment">// 4</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">serialize</span>(<span class="hljs-literal">null</span>) === <span class="hljs-string">&#x27;&#x27;</span> ? <span class="hljs-string">&#x27;空字符串&#x27;</span> : <span class="hljs-string">&#x27;非空&#x27;</span>); <span class="hljs-comment">// 空字符串</span>
</code></pre></div>
<p>结果是 <code>1,2,3,null,null,4,5</code>，和题面示例的输入一样。2 的两个孩子是空的，写成两个 <code>null</code>；4 和 5 的孩子也是空的，但都在末尾，被去掉了。</p>
<p>反序列化为什么能把值挂到正确的父节点上？因为字符串里非空节点出现的顺序，就是它们进队列的顺序。队列里每取出一个父节点，就从字符串里往后读两个标记，分别作为它的左孩子和右孩子，非空的孩子再进队列，等着之后挂它们自己的孩子。</p>
<p>末尾的 <code>null</code> 被去掉了，所以最后一个父节点的右孩子标记可能读不到，<code>tokens[i++]</code> 会得到 <code>undefined</code>，代码里要把它当成空孩子。题面示例 2 的空树，这里序列化成空字符串，反序列化时先判断空字符串直接返回 <code>null</code>。</p>
<p>这两种写法时间复杂度都是 O(n)，每个节点和空标记各处理一次。层序写法用循环加队列，不会因为树深导致递归过深；前序写法代码更短，面试时手写更不容易出错。</p>
<h2>常见追问</h2>
<p><strong>只用前序和中序遍历结果能还原二叉树吗？</strong></p>
<blockquote>
<p>节点值互不相同时可以。前序的第一个是根，在中序里找到根，左边是左子树、右边是右子树，再递归处理。但 297 题没有说节点值不重复，值在 -1000 到 1000 之间，节点却可以有 10⁴ 个，必然有重复，所以这道题要用带空标记的写法。</p>
</blockquote>
<p><strong>为什么队列用下标 head 往后走，而不是 shift？</strong></p>
<blockquote>
<p><code>shift</code> 每次要把后面的元素往前挪，数组很长时会变慢。用一个 <code>head</code> 下标记录读到哪里，取元素是 O(1)，整体就是 O(n)。</p>
</blockquote>
<p><strong>节点值本身含有逗号或者 # 怎么办？</strong></p>
<blockquote>
<p>这道题的节点值都是整数，不会冲突。如果值是任意字符串，就要对值做转义，或者改成先写长度再写内容的格式，也可以直接用 <code>JSON.stringify</code> 处理值，保证分隔符不会和值混在一起。</p>
</blockquote>`};export{e as default};