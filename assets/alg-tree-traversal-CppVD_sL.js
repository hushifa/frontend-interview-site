var e={answerHtml:`<h2>简答</h2>
<ul>
<li>前序遍历的顺序是&quot;当前节点 → 第一棵子树 → 第二棵子树……&quot;，一棵子树走完才轮到下一个兄弟，例如 <code>A、B、D、E、C、F</code>。</li>
<li>递归版本把待返回的位置存在调用栈里，树很深时会抛出 <code>RangeError: Maximum call stack size exceeded</code>；显式栈把待访问节点存在数组里，深度只受内存限制。</li>
<li>栈后进先出，子节点要从最后一个开始入栈，第一个子节点才会最先弹出。</li>
<li>每个节点入栈出栈各一次，时间复杂度 O(n)。这个实现一次压入所有子节点，栈的峰值在宽树上可达 O(n)。</li>
<li>遍历函数假定输入是树。同一个节点被多个父节点引用时会重复访问，有环时会无限循环，图需要用访问集合去重。</li>
</ul>
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
<p>输出 <code>A、B、D、E、C、F</code> 和 <code>[]</code>。函数只读取树，不修改 <code>children</code> 数组；<code>value</code> 是对象时返回的是原对象的引用。</p>
<h2>栈的变化</h2>
<p>栈顶写在右边：</p>
<table><thead><tr><th>弹出</th><th>压入</th><th>弹出后栈的状态</th></tr></thead><tbody><tr><td>A</td><td>C、B</td><td><code>[C, B]</code></td></tr><tr><td>B</td><td>E、D</td><td><code>[C, E, D]</code></td></tr><tr><td>D</td><td>无</td><td><code>[C, E]</code></td></tr><tr><td>E</td><td>无</td><td><code>[C]</code></td></tr><tr><td>C</td><td>F</td><td><code>[F]</code></td></tr><tr><td>F</td><td>无</td><td><code>[]</code></td></tr></tbody></table>
<p>如果按正序压入，C 会比 B 先弹出，结果变成 <code>A、C、F、B、E、D</code>。</p>
<h2>递归写法对比</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">preorderRecursive</span>(<span class="hljs-params">node, values = []</span>) {
  <span class="hljs-keyword">if</span> (node == <span class="hljs-literal">null</span>) <span class="hljs-keyword">return</span> values;
  values.<span class="hljs-title function_">push</span>(node.<span class="hljs-property">value</span>);
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> child <span class="hljs-keyword">of</span> node.<span class="hljs-property">children</span> ?? []) <span class="hljs-title function_">preorderRecursive</span>(child, values);
  <span class="hljs-keyword">return</span> values;
}
</code></pre></div>
<p>递归更直观，适合深度可控的树，例如组件树、菜单。处理用户导入的任意层级数据时，用显式栈更稳妥。递归能支持多深与引擎和每帧的大小有关，没有统一的层数。</p>
<h2>其他遍历顺序</h2>
<table><thead><tr><th>顺序</th><th>访问规则</th><th>典型用途</th></tr></thead><tbody><tr><td>前序</td><td>节点 → 子树</td><td>复制树、序列化、渲染目录</td></tr><tr><td>后序</td><td>子树 → 节点</td><td>计算文件夹总大小、按依赖顺序释放资源</td></tr><tr><td>层序</td><td>按深度一层层访问，用队列</td><td>找最浅的匹配节点、按层展示</td></tr></tbody></table>
<h2>常见追问</h2>
<ul>
<li><strong>树有十万个节点，放在主线程会卡吗？</strong> 遍历本身是同步计算，耗时过长会阻塞交互。可以分批处理并让出主线程，或把数据交给 Worker。</li>
<li><strong>怎样把扁平的 <code>{ id, parentId }</code> 列表转成树？</strong> 先用 Map 按 id 建立索引，再遍历一次把每个节点挂到父节点的 <code>children</code> 上，复杂度 O(n)。</li>
<li><strong>图遍历有什么不同？</strong> 见《前端场景中的图遍历应该怎样建模？》。</li>
</ul>`};export{e as default};