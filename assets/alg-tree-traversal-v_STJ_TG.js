var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>前序遍历的顺序是：先访问当前节点，再走第一棵子树，再走第二棵子树。一棵子树全部走完，才轮到下一个兄弟。比如结果是 <code>A、B、D、E、C、F</code>。</p>
<p>为什么不用递归？递归要靠函数调用栈记住“走完这棵子树要回到哪里”，树很深时会抛出 <code>RangeError: Maximum call stack size exceeded</code>。显式栈是自己用一个数组存待访问的节点，深度只受内存限制。</p>
<p>写的时候要注意，栈是后进先出的，所以子节点要从最后一个开始压，第一个子节点才会最先弹出来。每个节点进栈出栈各一次，时间复杂度是 O(n)。这个实现一次把所有子节点都压进去，所以在很宽的树上，栈最多可能放 O(n) 个节点。</p>
<p>还有一个前提：输入必须是树。同一个节点如果被好几个父节点引用，会被重复访问；有环的话会无限循环。遍历图要用一个访问集合去重。</p>
</blockquote>
<h2>实现</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">preorder</span>(<span class="hljs-params">root</span>) {
  <span class="hljs-keyword">if</span> (root == <span class="hljs-literal">null</span>) <span class="hljs-keyword">return</span> [];
  <span class="hljs-keyword">const</span> stack = [root];
  <span class="hljs-keyword">const</span> values = [];

  <span class="hljs-keyword">while</span> (stack.<span class="hljs-property">length</span> &gt; <span class="hljs-number">0</span>) {
    <span class="hljs-keyword">const</span> node = stack.<span class="hljs-title function_">pop</span>();
    <span class="hljs-keyword">if</span> (node === <span class="hljs-literal">null</span> || <span class="hljs-keyword">typeof</span> node !== <span class="hljs-string">&#x27;object&#x27;</span>) {
      <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">TypeError</span>(<span class="hljs-string">&#x27;树节点必须是对象&#x27;</span>);
    }

    <span class="hljs-keyword">const</span> children = node.<span class="hljs-property">children</span> ?? [];
    <span class="hljs-keyword">if</span> (!<span class="hljs-title class_">Array</span>.<span class="hljs-title function_">isArray</span>(children)) {
      <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">TypeError</span>(<span class="hljs-string">&#x27;children 必须是数组&#x27;</span>);
    }

    values.<span class="hljs-title function_">push</span>(node.<span class="hljs-property">value</span>);
    <span class="hljs-keyword">for</span> (<span class="hljs-keyword">let</span> index = children.<span class="hljs-property">length</span> - <span class="hljs-number">1</span>; index &gt;= <span class="hljs-number">0</span>; index--) {
      stack.<span class="hljs-title function_">push</span>(children[index]);
    }
  }

  <span class="hljs-keyword">return</span> values;
}
</code></pre></div>
<p>逻辑很短：弹出一个节点，记下它的值，再把它的子节点倒着压进栈。下面用一棵小树试一下：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> tree = {
  <span class="hljs-attr">value</span>: <span class="hljs-string">&#x27;A&#x27;</span>,
  <span class="hljs-attr">children</span>: [
    { <span class="hljs-attr">value</span>: <span class="hljs-string">&#x27;B&#x27;</span>, <span class="hljs-attr">children</span>: [{ <span class="hljs-attr">value</span>: <span class="hljs-string">&#x27;D&#x27;</span> }, { <span class="hljs-attr">value</span>: <span class="hljs-string">&#x27;E&#x27;</span> }] },
    { <span class="hljs-attr">value</span>: <span class="hljs-string">&#x27;C&#x27;</span>, <span class="hljs-attr">children</span>: [{ <span class="hljs-attr">value</span>: <span class="hljs-string">&#x27;F&#x27;</span> }] },
  ],
};

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">preorder</span>(tree).<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;、&#x27;</span>));
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">preorder</span>(<span class="hljs-literal">null</span>));
</code></pre></div>
<p>输出是 <code>A、B、D、E、C、F</code> 和 <code>[]</code>。这个函数只读树，不会修改 <code>children</code> 数组；如果 <code>value</code> 是对象，返回的是原对象的引用，不是副本。</p>
<h2>栈里到底发生了什么</h2>
<p>把每一步栈的状态列出来，栈顶写在右边：</p>
<table><thead><tr><th>弹出</th><th>压入</th><th>弹出后栈的状态</th></tr></thead><tbody><tr><td>A</td><td>C、B</td><td><code>[C, B]</code></td></tr><tr><td>B</td><td>E、D</td><td><code>[C, E, D]</code></td></tr><tr><td>D</td><td>无</td><td><code>[C, E]</code></td></tr><tr><td>E</td><td>无</td><td><code>[C]</code></td></tr><tr><td>C</td><td>F</td><td><code>[F]</code></td></tr><tr><td>F</td><td>无</td><td><code>[]</code></td></tr></tbody></table>
<p>可以看到，B 的两个孩子压进来以后，它们在 C 的上面，所以会先于 C 弹出。这就保证了“B 这棵子树走完，才轮到 C”。</p>
<p>如果按正序压，先压 B 再压 C，C 就在栈顶，会比 B 先弹出来，结果就变成 <code>A、C、F、B、E、D</code>，顺序反了。</p>
<h2>和递归写法比一比</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">preorderRecursive</span>(<span class="hljs-params">node, values = []</span>) {
  <span class="hljs-keyword">if</span> (node == <span class="hljs-literal">null</span>) <span class="hljs-keyword">return</span> values;
  values.<span class="hljs-title function_">push</span>(node.<span class="hljs-property">value</span>);
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> child <span class="hljs-keyword">of</span> node.<span class="hljs-property">children</span> ?? []) <span class="hljs-title function_">preorderRecursive</span>(child, values);
  <span class="hljs-keyword">return</span> values;
}
</code></pre></div>
<p>递归更直观，适合深度可控的树，比如组件树、菜单。处理用户导入的、层级不确定的数据时，用显式栈更稳。递归最多能支持多深，跟引擎、每一层调用占多少空间有关，没有一个统一的层数。</p>
<h2>其他遍历顺序</h2>
<table><thead><tr><th>顺序</th><th>访问规则</th><th>典型用途</th></tr></thead><tbody><tr><td>前序</td><td>节点 → 子树</td><td>复制树、序列化、渲染目录</td></tr><tr><td>后序</td><td>子树 → 节点</td><td>计算文件夹总大小、按依赖顺序释放资源</td></tr><tr><td>层序</td><td>按深度一层层访问，用队列</td><td>找最浅的匹配节点、按层展示</td></tr></tbody></table>
<h2>常见追问</h2>
<p><strong>树有十万个节点，放在主线程遍历会卡吗？</strong></p>
<blockquote>
<p>遍历本身是同步计算，时间太长就会挡住用户交互。可以分批处理，中间让出主线程，或者把数据交给 Worker 去算。</p>
</blockquote>
<p><strong>怎么把扁平的 <code>{ id, parentId }</code> 列表转成树？</strong></p>
<blockquote>
<p>先用 Map 按 id 建索引，再遍历一次，把每个节点挂到父节点的 <code>children</code> 上，复杂度是 O(n)。详细写法见<a href="/questions/alg-list-to-tree/">《怎样在 O(n) 时间内把扁平列表转成树，再把树转回列表？》</a>。</p>
</blockquote>
<p><strong>图的遍历有什么不同？</strong></p>
<blockquote>
<p>见<a href="/questions/alg-graph-traversal/">《前端场景中的图遍历应该怎样建模？》</a>。</p>
</blockquote>`};export{e as default};