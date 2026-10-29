var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>二叉树的每个节点最多有左右两个子节点。遍历方式分两大类：深度优先是一条路走到底再回头，前序、中序、后序都属于这一类；广度优先是一层一层往下走，也叫层序遍历。</p>
<p>层序遍历靠队列，队列是先进先出的。先把根节点放进去，然后循环：记下当前队列里有几个节点，这些就是同一层的；依次取出它们，记录值，再把它们的左右子节点放到队尾。这一轮处理完，队列里剩下的正好是下一层。所以输出可以按层分组。</p>
<p>最大深度是从根到最远叶子节点经过的节点数。递归写法最短：空节点深度是 0，否则就是左右子树深度的较大值加 1。也可以直接做层序遍历，数一共有几层。</p>
<p>要注意，用数组的 <code>shift()</code> 当队列出队，每次都要把后面的元素往前挪，大数据量时会变慢。节点很多时可以用一个下标记录队头位置，代替 <code>shift()</code>。</p>
</blockquote>
<h2>代码实现</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> tree = {
  <span class="hljs-attr">value</span>: <span class="hljs-number">1</span>,
  <span class="hljs-attr">left</span>: { <span class="hljs-attr">value</span>: <span class="hljs-number">2</span>, <span class="hljs-attr">left</span>: { <span class="hljs-attr">value</span>: <span class="hljs-number">4</span> }, <span class="hljs-attr">right</span>: { <span class="hljs-attr">value</span>: <span class="hljs-number">5</span> } },
  <span class="hljs-attr">right</span>: { <span class="hljs-attr">value</span>: <span class="hljs-number">3</span>, <span class="hljs-attr">right</span>: { <span class="hljs-attr">value</span>: <span class="hljs-number">6</span> } },
};

<span class="hljs-keyword">function</span> <span class="hljs-title function_">levelOrder</span>(<span class="hljs-params">root</span>) {
  <span class="hljs-keyword">if</span> (!root) <span class="hljs-keyword">return</span> [];
  <span class="hljs-keyword">const</span> result = [];
  <span class="hljs-keyword">const</span> queue = [root];
  <span class="hljs-keyword">let</span> head = <span class="hljs-number">0</span>;
  <span class="hljs-keyword">while</span> (head &lt; queue.<span class="hljs-property">length</span>) {
    <span class="hljs-keyword">const</span> size = queue.<span class="hljs-property">length</span> - head;
    <span class="hljs-keyword">const</span> level = [];
    <span class="hljs-keyword">for</span> (<span class="hljs-keyword">let</span> i = <span class="hljs-number">0</span>; i &lt; size; i++) {
      <span class="hljs-keyword">const</span> node = queue[head++];
      level.<span class="hljs-title function_">push</span>(node.<span class="hljs-property">value</span>);
      <span class="hljs-keyword">if</span> (node.<span class="hljs-property">left</span>) queue.<span class="hljs-title function_">push</span>(node.<span class="hljs-property">left</span>);
      <span class="hljs-keyword">if</span> (node.<span class="hljs-property">right</span>) queue.<span class="hljs-title function_">push</span>(node.<span class="hljs-property">right</span>);
    }
    result.<span class="hljs-title function_">push</span>(level);
  }
  <span class="hljs-keyword">return</span> result;
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">maxDepth</span>(<span class="hljs-params">node</span>) {
  <span class="hljs-keyword">if</span> (!node) <span class="hljs-keyword">return</span> <span class="hljs-number">0</span>;
  <span class="hljs-keyword">return</span> <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">max</span>(<span class="hljs-title function_">maxDepth</span>(node.<span class="hljs-property">left</span>), <span class="hljs-title function_">maxDepth</span>(node.<span class="hljs-property">right</span>)) + <span class="hljs-number">1</span>;
}

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">JSON</span>.<span class="hljs-title function_">stringify</span>(<span class="hljs-title function_">levelOrder</span>(tree))); <span class="hljs-comment">// [[1],[2,3],[4,5,6]]</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">maxDepth</span>(tree)); <span class="hljs-comment">// 3</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">maxDepth</span>(<span class="hljs-literal">null</span>)); <span class="hljs-comment">// 0</span>
</code></pre></div>
<p>为什么要在每一轮开始时先算出 <code>size</code>？因为循环里会往队列追加下一层的节点，队列长度一直在变。提前记下这一层有几个，才知道取到哪里为止是同一层，结果才能按层分组。</p>
<p>这里没有用 <code>shift()</code>，而是用 <code>head</code> 记录队头的位置，出队就是 <code>head++</code>。数组前面已经处理过的元素不删，每次出队都是 O(1)，整体遍历是 O(n)。</p>
<p><code>maxDepth</code> 的递归怎么理解？节点 2 的左右子节点 4、5 深度都是 1，所以节点 2 深度是 2；节点 3 只有右子节点 6，深度也是 2；根节点取较大的 2 再加 1，就是 3。</p>
<h2>前端哪里用得到</h2>
<p>DOM 树、组件树、菜单和组织架构树都是树。按层展开、找离某个节点最近的匹配项，用广度优先；渲染嵌套菜单、序列化整棵树，常用深度优先。显式栈写法的深度优先见<a href="/questions/alg-tree-traversal/">《怎样用显式栈实现树的前序遍历？》</a>，把扁平列表转成树见<a href="/questions/alg-list-to-tree/">《怎样在 O(n) 时间内把扁平列表转成树，再把树转回列表？》</a>。</p>
<h2>常见追问</h2>
<p><strong>中序遍历有什么特别的用途？</strong></p>
<blockquote>
<p>二叉搜索树的左子树都比根小、右子树都比根大，中序遍历的顺序是左、根、右，正好得到从小到大的有序序列。所以判断一棵树是不是二叉搜索树，可以看中序遍历结果是不是递增的。</p>
</blockquote>
<p><strong>怎样翻转二叉树？</strong></p>
<blockquote>
<p>对每个节点交换它的左右子节点，再递归处理左右子树。递归、层序遍历都可以，每个节点处理一次，O(n)。</p>
</blockquote>`};export{e as default};