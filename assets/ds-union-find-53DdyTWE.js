var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>有 5 个人，告诉你“0 和 1 是朋友”“1 和 2 是朋友”“3 和 4 是朋友”，朋友的朋友也算一个圈子，问一共有几个圈子、0 和 2 是不是一个圈子。并查集就是专门回答这类“谁和谁属于同一组”问题的结构，名字来自它的两个操作：查找（find）和合并（union）。</p>
<p>实现只要一个 <code>parent</code> 数组。一开始每个人的 <code>parent</code> 指向自己，各自是一组。每组组织成一棵树，树根当作这一组的代表；<code>find(x)</code> 顺着 <code>parent</code> 一路往上找到根，两个元素的根相同就在同一组；<code>union(a, b)</code> 找到两边的根，把一个根挂到另一个根下面，两组就合成一组。</p>
<p>只这样写，树可能退化成一条长链，<code>find</code> 变成 O(n)。两个优化：路径压缩，<code>find</code> 时把路过的节点直接挂到根上，下次一步就到；按大小合并，总是把小树挂到大树下，让树保持矮。两个一起用，每次操作的均摊时间是 O(α(n))，α 是反阿克曼函数，增长极慢，实际可以当成常数。</p>
<p>适合的场景是连通关系只增不减、需要反复查询的问题：朋友圈或岛屿数量、无向图里有没有环、Kruskal 最小生成树。要注意它不支持“拆开”一组，也不能直接回答两点之间的路径是什么，需要路径时还是要用 BFS 或 DFS。</p>
</blockquote>
<h2>实现和用法</h2>
<p>先看 <code>find</code> 里的路径压缩：递归找到根以后，回来的路上把每个节点的 <code>parent</code> 都改成根。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">class</span> <span class="hljs-title class_">UnionFind</span> {
  <span class="hljs-title function_">constructor</span>(<span class="hljs-params">n</span>) {
    <span class="hljs-variable language_">this</span>.<span class="hljs-property">parent</span> = <span class="hljs-title class_">Array</span>.<span class="hljs-title function_">from</span>({ <span class="hljs-attr">length</span>: n }, <span class="hljs-function">(<span class="hljs-params">_, i</span>) =&gt;</span> i);
    <span class="hljs-variable language_">this</span>.<span class="hljs-property">size</span> = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Array</span>(n).<span class="hljs-title function_">fill</span>(<span class="hljs-number">1</span>);
    <span class="hljs-variable language_">this</span>.<span class="hljs-property">count</span> = n; <span class="hljs-comment">// 当前有几个集合</span>
  }
  <span class="hljs-title function_">find</span>(<span class="hljs-params">x</span>) {
    <span class="hljs-keyword">if</span> (<span class="hljs-variable language_">this</span>.<span class="hljs-property">parent</span>[x] !== x) {
      <span class="hljs-variable language_">this</span>.<span class="hljs-property">parent</span>[x] = <span class="hljs-variable language_">this</span>.<span class="hljs-title function_">find</span>(<span class="hljs-variable language_">this</span>.<span class="hljs-property">parent</span>[x]); <span class="hljs-comment">// 路径压缩</span>
    }
    <span class="hljs-keyword">return</span> <span class="hljs-variable language_">this</span>.<span class="hljs-property">parent</span>[x];
  }
  <span class="hljs-title function_">union</span>(<span class="hljs-params">a, b</span>) {
    <span class="hljs-keyword">let</span> rootA = <span class="hljs-variable language_">this</span>.<span class="hljs-title function_">find</span>(a);
    <span class="hljs-keyword">let</span> rootB = <span class="hljs-variable language_">this</span>.<span class="hljs-title function_">find</span>(b);
    <span class="hljs-keyword">if</span> (rootA === rootB) <span class="hljs-keyword">return</span> <span class="hljs-literal">false</span>; <span class="hljs-comment">// 本来就在一组，没有合并</span>
    <span class="hljs-keyword">if</span> (<span class="hljs-variable language_">this</span>.<span class="hljs-property">size</span>[rootA] &lt; <span class="hljs-variable language_">this</span>.<span class="hljs-property">size</span>[rootB]) [rootA, rootB] = [rootB, rootA];
    <span class="hljs-variable language_">this</span>.<span class="hljs-property">parent</span>[rootB] = rootA; <span class="hljs-comment">// 小树挂到大树下</span>
    <span class="hljs-variable language_">this</span>.<span class="hljs-property">size</span>[rootA] += <span class="hljs-variable language_">this</span>.<span class="hljs-property">size</span>[rootB];
    <span class="hljs-variable language_">this</span>.<span class="hljs-property">count</span>--;
    <span class="hljs-keyword">return</span> <span class="hljs-literal">true</span>;
  }
  <span class="hljs-title function_">connected</span>(<span class="hljs-params">a, b</span>) {
    <span class="hljs-keyword">return</span> <span class="hljs-variable language_">this</span>.<span class="hljs-title function_">find</span>(a) === <span class="hljs-variable language_">this</span>.<span class="hljs-title function_">find</span>(b);
  }
}

<span class="hljs-keyword">const</span> uf = <span class="hljs-keyword">new</span> <span class="hljs-title class_">UnionFind</span>(<span class="hljs-number">5</span>);
uf.<span class="hljs-title function_">union</span>(<span class="hljs-number">0</span>, <span class="hljs-number">1</span>);
uf.<span class="hljs-title function_">union</span>(<span class="hljs-number">1</span>, <span class="hljs-number">2</span>);
uf.<span class="hljs-title function_">union</span>(<span class="hljs-number">3</span>, <span class="hljs-number">4</span>);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(uf.<span class="hljs-property">count</span>); <span class="hljs-comment">// 2</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(uf.<span class="hljs-title function_">connected</span>(<span class="hljs-number">0</span>, <span class="hljs-number">2</span>), uf.<span class="hljs-title function_">connected</span>(<span class="hljs-number">0</span>, <span class="hljs-number">3</span>)); <span class="hljs-comment">// true false</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(uf.<span class="hljs-title function_">union</span>(<span class="hljs-number">2</span>, <span class="hljs-number">0</span>)); <span class="hljs-comment">// false</span>
uf.<span class="hljs-title function_">union</span>(<span class="hljs-number">2</span>, <span class="hljs-number">4</span>);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(uf.<span class="hljs-property">count</span>, uf.<span class="hljs-title function_">connected</span>(<span class="hljs-number">0</span>, <span class="hljs-number">4</span>)); <span class="hljs-comment">// 1 true</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-keyword">new</span> <span class="hljs-title class_">UnionFind</span>(<span class="hljs-number">0</span>).<span class="hljs-property">count</span>); <span class="hljs-comment">// 0</span>
</code></pre></div>
<p><code>union(2, 0)</code> 为什么返回 false？0、1、2 已经通过前两次合并成为一组，两边的根相同，没有发生合并，<code>count</code> 也不减。这个返回值很有用：在无向图里逐条加边时，如果某条边两端已经连通，再加这条边就形成了环。</p>
<p><code>count</code> 为什么只在真正合并时减 1？一开始 n 个元素是 n 组，每次成功合并两组变一组，所以合并成功的次数就是减少的组数。查询“有几个朋友圈”直接读 <code>count</code>，不用再遍历。</p>
<p><code>find</code> 用了递归，链很长时会不会爆栈？加了按大小合并以后，树高最多是 log₂n，即使 n 是一百万也只有 20 层左右，不会爆栈。只做路径压缩、不做按大小合并时，第一次 <code>find</code> 之前的链可能很长，这时可以改成循环写法。</p>
<h2>用并查集检测环、数岛屿</h2>
<p>下面这段用上面的 <code>union</code> 返回值找出无向图中第一条造成环的边。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">class</span> <span class="hljs-title class_">UnionFind</span> {
  <span class="hljs-title function_">constructor</span>(<span class="hljs-params">n</span>) {
    <span class="hljs-variable language_">this</span>.<span class="hljs-property">parent</span> = <span class="hljs-title class_">Array</span>.<span class="hljs-title function_">from</span>({ <span class="hljs-attr">length</span>: n }, <span class="hljs-function">(<span class="hljs-params">_, i</span>) =&gt;</span> i);
  }
  <span class="hljs-title function_">find</span>(<span class="hljs-params">x</span>) {
    <span class="hljs-keyword">while</span> (<span class="hljs-variable language_">this</span>.<span class="hljs-property">parent</span>[x] !== x) {
      <span class="hljs-variable language_">this</span>.<span class="hljs-property">parent</span>[x] = <span class="hljs-variable language_">this</span>.<span class="hljs-property">parent</span>[<span class="hljs-variable language_">this</span>.<span class="hljs-property">parent</span>[x]]; <span class="hljs-comment">// 隔一层压缩，循环写法不怕深链</span>
      x = <span class="hljs-variable language_">this</span>.<span class="hljs-property">parent</span>[x];
    }
    <span class="hljs-keyword">return</span> x;
  }
  <span class="hljs-title function_">union</span>(<span class="hljs-params">a, b</span>) {
    <span class="hljs-keyword">const</span> rootA = <span class="hljs-variable language_">this</span>.<span class="hljs-title function_">find</span>(a);
    <span class="hljs-keyword">const</span> rootB = <span class="hljs-variable language_">this</span>.<span class="hljs-title function_">find</span>(b);
    <span class="hljs-keyword">if</span> (rootA === rootB) <span class="hljs-keyword">return</span> <span class="hljs-literal">false</span>;
    <span class="hljs-variable language_">this</span>.<span class="hljs-property">parent</span>[rootB] = rootA;
    <span class="hljs-keyword">return</span> <span class="hljs-literal">true</span>;
  }
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">findRedundantEdge</span>(<span class="hljs-params">n, edges</span>) {
  <span class="hljs-keyword">const</span> uf = <span class="hljs-keyword">new</span> <span class="hljs-title class_">UnionFind</span>(n);
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> [a, b] <span class="hljs-keyword">of</span> edges) {
    <span class="hljs-keyword">if</span> (!uf.<span class="hljs-title function_">union</span>(a, b)) <span class="hljs-keyword">return</span> [a, b];
  }
  <span class="hljs-keyword">return</span> <span class="hljs-literal">null</span>;
}

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">JSON</span>.<span class="hljs-title function_">stringify</span>(<span class="hljs-title function_">findRedundantEdge</span>(<span class="hljs-number">3</span>, [[<span class="hljs-number">0</span>, <span class="hljs-number">1</span>], [<span class="hljs-number">0</span>, <span class="hljs-number">2</span>], [<span class="hljs-number">1</span>, <span class="hljs-number">2</span>]]))); <span class="hljs-comment">// [1,2]</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">JSON</span>.<span class="hljs-title function_">stringify</span>(<span class="hljs-title function_">findRedundantEdge</span>(<span class="hljs-number">4</span>, [[<span class="hljs-number">0</span>, <span class="hljs-number">1</span>], [<span class="hljs-number">1</span>, <span class="hljs-number">2</span>], [<span class="hljs-number">2</span>, <span class="hljs-number">3</span>]]))); <span class="hljs-comment">// null</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">JSON</span>.<span class="hljs-title function_">stringify</span>(<span class="hljs-title function_">findRedundantEdge</span>(<span class="hljs-number">2</span>, [[<span class="hljs-number">0</span>, <span class="hljs-number">1</span>], [<span class="hljs-number">1</span>, <span class="hljs-number">0</span>]]))); <span class="hljs-comment">// [1,0]</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">JSON</span>.<span class="hljs-title function_">stringify</span>(<span class="hljs-title function_">findRedundantEdge</span>(<span class="hljs-number">1</span>, []))); <span class="hljs-comment">// null</span>
</code></pre></div>
<p><code>[[0, 1], [0, 2], [1, 2]]</code> 为什么是 <code>[1, 2]</code>？前两条边把 0、1、2 连成一组。第三条边的两端 1 和 2 已经连通，再加就绕成一个圈，<code>union</code> 返回 false。</p>
<p>循环版的 <code>find</code> 叫路径减半：每走一步，把当前节点的 <code>parent</code> 改成祖父节点，效果和递归的完全压缩接近，不需要递归栈。</p>
<p>岛屿数量也是同样的套路：把网格里每个格子编号为 <code>行 × 列数 + 列</code>，每块陆地先算一组，再和右边、下边相邻的陆地合并，最后陆地组数就是岛屿数。这题用 DFS 也能做，并查集的优势在于陆地是一块块动态加进来、每加一块都要回答当前岛屿数的场景。</p>
<h2>常见追问</h2>
<p><strong>路径压缩和按大小合并只用一个行不行？</strong></p>
<blockquote>
<p>行，只是保证不同。只用按大小合并，树高不超过 log n，每次 O(log n)；只用路径压缩，均摊也是对数级别。两个一起用才能达到 O(α(n))。面试里写路径压缩通常就够了，被问到时再补上按大小或按秩合并。</p>
</blockquote>
<p><strong>并查集能删除元素或拆分集合吗？</strong></p>
<blockquote>
<p>标准并查集不支持。合并以后树的结构已经被压缩改写，无法知道原来是哪些边连起来的。需要拆分时，常见做法是把操作反过来：先把最终状态建好，倒着处理“删除”，就变成了“添加”。</p>
</blockquote>`};export{e as default};