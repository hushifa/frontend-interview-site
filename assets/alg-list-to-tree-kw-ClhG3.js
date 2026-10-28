var e={answerHtml:`<h2>简答</h2>
<ul>
<li>对每个节点在列表里查找子节点是 O(n²)。先用 <code>Map</code> 按 id 建立索引，查找父节点变成 O(1)，总复杂度 O(n)。</li>
<li>先建全部节点再连接父子关系，子节点排在父节点前面也能正确挂载。</li>
<li><code>parentId</code> 等于根标记，或者指向不存在的节点时，把节点放进根数组，避免孤儿节点丢失。</li>
<li>复制节点再添加 <code>children</code>，不修改调用方传入的数据。</li>
<li>树转列表用栈做前序遍历，入栈时带上父 id。用显式栈而不是递归，层级很深时不会栈溢出。</li>
</ul>
<h2>列表转树</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">listToTree</span>(<span class="hljs-params">list, { rootId = <span class="hljs-literal">null</span> } = {}</span>) {
  <span class="hljs-keyword">const</span> nodes = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Map</span>();
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> item <span class="hljs-keyword">of</span> list) nodes.<span class="hljs-title function_">set</span>(item.<span class="hljs-property">id</span>, { ...item, <span class="hljs-attr">children</span>: [] });

  <span class="hljs-keyword">const</span> roots = [];
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> node <span class="hljs-keyword">of</span> nodes.<span class="hljs-title function_">values</span>()) {
    <span class="hljs-keyword">const</span> parent = node.<span class="hljs-property">parentId</span> === rootId ? <span class="hljs-literal">undefined</span> : nodes.<span class="hljs-title function_">get</span>(node.<span class="hljs-property">parentId</span>);
    <span class="hljs-comment">// 根节点和父节点不存在的孤儿节点都放在第一层</span>
    <span class="hljs-keyword">if</span> (parent) parent.<span class="hljs-property">children</span>.<span class="hljs-title function_">push</span>(node);
    <span class="hljs-keyword">else</span> roots.<span class="hljs-title function_">push</span>(node);
  }
  <span class="hljs-keyword">return</span> roots;
}
</code></pre></div>
<p><code>Map</code> 按插入顺序遍历，同一父节点下的子节点保持它们在原列表中的顺序。id 重复时后出现的节点会覆盖前一个，需要在调用前校验数据。</p>
<h2>树转列表</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">treeToList</span>(<span class="hljs-params">roots</span>) {
  <span class="hljs-keyword">const</span> result = [];
  <span class="hljs-comment">// 反向入栈，保证出栈顺序与原来的兄弟顺序一致</span>
  <span class="hljs-keyword">const</span> stack = [...roots].<span class="hljs-title function_">reverse</span>().<span class="hljs-title function_">map</span>(<span class="hljs-function">(<span class="hljs-params">node</span>) =&gt;</span> [node, <span class="hljs-literal">null</span>]);
  <span class="hljs-keyword">while</span> (stack.<span class="hljs-property">length</span>) {
    <span class="hljs-keyword">const</span> [node, parentId] = stack.<span class="hljs-title function_">pop</span>();
    <span class="hljs-keyword">const</span> { children = [], ...rest } = node;
    result.<span class="hljs-title function_">push</span>({ ...rest, parentId });
    <span class="hljs-keyword">for</span> (<span class="hljs-keyword">let</span> i = children.<span class="hljs-property">length</span> - <span class="hljs-number">1</span>; i &gt;= <span class="hljs-number">0</span>; i--) stack.<span class="hljs-title function_">push</span>([children[i], node.<span class="hljs-property">id</span>]);
  }
  <span class="hljs-keyword">return</span> result;
}
</code></pre></div>
<p>每个节点入栈、出栈各一次，复杂度 O(n)。父 id 来自遍历时所在的位置，而不是节点上原有的 <code>parentId</code>，所以孤儿节点转回后 <code>parentId</code> 为 <code>null</code>。</p>
<h2>验证</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> list = [
  { <span class="hljs-attr">id</span>: <span class="hljs-number">3</span>, <span class="hljs-attr">parentId</span>: <span class="hljs-number">1</span>, <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;c&#x27;</span> },
  { <span class="hljs-attr">id</span>: <span class="hljs-number">1</span>, <span class="hljs-attr">parentId</span>: <span class="hljs-literal">null</span>, <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;a&#x27;</span> },
  { <span class="hljs-attr">id</span>: <span class="hljs-number">2</span>, <span class="hljs-attr">parentId</span>: <span class="hljs-number">1</span>, <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;b&#x27;</span> },
  { <span class="hljs-attr">id</span>: <span class="hljs-number">4</span>, <span class="hljs-attr">parentId</span>: <span class="hljs-number">9</span>, <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;orphan&#x27;</span> },
  { <span class="hljs-attr">id</span>: <span class="hljs-number">5</span>, <span class="hljs-attr">parentId</span>: <span class="hljs-number">3</span>, <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;e&#x27;</span> },
];

<span class="hljs-keyword">const</span> tree = <span class="hljs-title function_">listToTree</span>(list);
<span class="hljs-comment">// a 的 children 为 [c, b]，c 的 children 为 [e]，orphan 是第二个根</span>

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">treeToList</span>(tree).<span class="hljs-title function_">map</span>(<span class="hljs-function">(<span class="hljs-params">n</span>) =&gt;</span> <span class="hljs-string">\`<span class="hljs-subst">\${n.id}</span>:<span class="hljs-subst">\${n.parentId}</span>\`</span>).<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27; &#x27;</span>));
<span class="hljs-comment">// 1:null 3:1 5:3 2:1 4:null</span>
</code></pre></div>
<h2>常见追问</h2>
<ul>
<li>数据里有环怎么办？例如 A 的父是 B、B 的父是 A，两者都不会出现在根数组里，转出的树会丢掉它们。需要在连接前检测，或在转换后检查节点总数是否一致。</li>
<li>如果要按 <code>sort</code> 字段排序？构建完成后对每个 <code>children</code> 排序，复杂度变为 O(n log n)。</li>
<li>树的遍历方式还有哪些？见<a href="/questions/alg-tree-traversal/">《怎样用显式栈实现树的前序遍历？》</a>。</li>
</ul>`};export{e as default};