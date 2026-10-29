var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>最直接的写法是对每个节点，都去整个列表里找它的子节点，这样是 O(n²)。改进办法是先用一个 <code>Map</code> 按 id 建索引，找父节点就变成了 O(1)，总共是 O(n)。</p>
<p>顺序上，要先把所有节点都建好，再去连父子关系。这样就算子节点在列表里排在父节点前面，也能正确挂上去。<code>parentId</code> 是根标记，或者指向一个不存在的节点时，都把它放进根数组，不然这些孤儿节点就丢了。另外要复制一份节点再加 <code>children</code>，不要改调用方传进来的数据。</p>
<p>树转回列表，用一个栈做前序遍历，入栈时把父 id 一起带上。用显式的栈而不是递归，层级很深时也不会栈溢出。</p>
</blockquote>
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
<p>为什么一定要分两遍？如果只遍历一遍、边建节点边挂，那子节点排在父节点前面时，去 <code>Map</code> 里找父节点，父节点还没建出来，就挂不上了。分两遍，第二遍时所有节点都已经在 <code>Map</code> 里了，顺序就无所谓了。</p>
<p><code>{ ...item, children: [] }</code> 是复制了一个新对象，所以调用方传进来的原数据不会被加上 <code>children</code>。</p>
<p>同一个父节点下的子节点，顺序和它们在原列表里一样，因为 <code>Map</code> 是按插入顺序遍历的。还要注意，如果 id 有重复，后出现的会覆盖前面的，要在调用前自己校验数据。</p>
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
<p>栈里存的不只是节点，而是 <code>[节点, 父 id]</code> 这样一对。为什么要一起存？因为节点出栈的时候，我们需要知道它的父亲是谁，而这个信息是在父节点把它压进栈时才知道的。</p>
<p>子节点为什么倒着压栈？因为栈是后进先出，倒着压，第一个子节点就会最先弹出来，输出顺序和原来的兄弟顺序一致。</p>
<p>每个节点进栈、出栈各一次，所以是 O(n)。</p>
<p>要注意一点：这里的父 id 来自遍历时的位置，不是节点上原来的 <code>parentId</code>。所以孤儿节点转回来以后，<code>parentId</code> 会变成 <code>null</code>。</p>
<h2>验证一下</h2>
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
<p>列表里 c 排在 a 前面，照样挂到了 a 下面。orphan 的父 id 是 9，列表里没有 9，所以它成了第二个根。转回列表时，它的 <code>parentId</code> 从 9 变成了 <code>null</code>，原因就是上面说的那一点。</p>
<h2>常见追问</h2>
<p><strong>数据里有环怎么办？</strong></p>
<blockquote>
<p>比如 A 的父是 B、B 的父是 A。它俩都能找到父节点，所以都不会进根数组，结果转出来的树里就没有它们了。要在连接之前检测环，或者转换完以后检查一下节点总数对不对得上。</p>
</blockquote>
<p><strong>要按 <code>sort</code> 字段排序怎么办？</strong></p>
<blockquote>
<p>树建好以后，对每个节点的 <code>children</code> 排一次序。复杂度会变成 O(n log n)。</p>
</blockquote>
<p><strong>树的遍历还有哪些方式？</strong></p>
<blockquote>
<p>见<a href="/questions/alg-tree-traversal/">《怎样用显式栈实现树的前序遍历？》</a>。</p>
</blockquote>`};export{e as default};