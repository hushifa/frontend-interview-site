var e={answerHtml:`<h2>简答</h2>
<ul>
<li>图用 <code>Map&lt;节点, 邻居数组&gt;</code> 的邻接表表示，<code>app → router</code> 表示 app 依赖 router。</li>
<li>DFS 用栈，先沿一条路径深入；BFS 用队列，按距离逐层扩展，第一次到达目标时得到的就是边数最少的路径。</li>
<li>两者都用 <code>Set</code> 记录访问过的节点，否则遇到环会无限循环；时间复杂度都是 O(V + E)。</li>
<li>检测循环依赖用 DFS 的三种状态：未访问、访问中、已完成。遇到&quot;访问中&quot;的节点说明存在环。</li>
<li>用显式栈或队列代替递归，可以避免深度很大的图导致调用栈溢出；起点不在图中时，下面的实现统一返回 <code>null</code>。</li>
</ul>
<h2>邻接表</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> dependencies = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Map</span>([
  [<span class="hljs-string">&#x27;app&#x27;</span>, [<span class="hljs-string">&#x27;router&#x27;</span>, <span class="hljs-string">&#x27;ui&#x27;</span>]],
  [<span class="hljs-string">&#x27;router&#x27;</span>, [<span class="hljs-string">&#x27;url&#x27;</span>]],
  [<span class="hljs-string">&#x27;ui&#x27;</span>, [<span class="hljs-string">&#x27;button&#x27;</span>]],
  [<span class="hljs-string">&#x27;button&#x27;</span>, []],
  [<span class="hljs-string">&#x27;url&#x27;</span>, []],
]);
</code></pre></div>
<p>图和树的区别在于一个节点可以有多个父节点，也可以有环，因此遍历时必须记录访问过的节点。</p>
<h2>DFS：所有可达节点</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">depthFirst</span>(<span class="hljs-params">start, graph</span>) {
  <span class="hljs-keyword">if</span> (!graph.<span class="hljs-title function_">has</span>(start)) <span class="hljs-keyword">return</span> <span class="hljs-literal">null</span>;
  <span class="hljs-keyword">const</span> visited = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Set</span>();
  <span class="hljs-keyword">const</span> stack = [start];

  <span class="hljs-keyword">while</span> (stack.<span class="hljs-property">length</span> &gt; <span class="hljs-number">0</span>) {
    <span class="hljs-keyword">const</span> node = stack.<span class="hljs-title function_">pop</span>();
    <span class="hljs-keyword">if</span> (visited.<span class="hljs-title function_">has</span>(node)) <span class="hljs-keyword">continue</span>;
    visited.<span class="hljs-title function_">add</span>(node);
    <span class="hljs-keyword">const</span> neighbors = graph.<span class="hljs-title function_">get</span>(node) ?? [];
    <span class="hljs-comment">// 反向入栈，让第一个邻居先出栈，与递归 DFS 的访问顺序一致。</span>
    <span class="hljs-keyword">for</span> (<span class="hljs-keyword">let</span> index = neighbors.<span class="hljs-property">length</span> - <span class="hljs-number">1</span>; index &gt;= <span class="hljs-number">0</span>; index--) {
      <span class="hljs-keyword">if</span> (!visited.<span class="hljs-title function_">has</span>(neighbors[index])) stack.<span class="hljs-title function_">push</span>(neighbors[index]);
    }
  }
  <span class="hljs-keyword">return</span> [...visited];
}

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">depthFirst</span>(<span class="hljs-string">&#x27;app&#x27;</span>, dependencies));
<span class="hljs-comment">// [&#x27;app&#x27;, &#x27;router&#x27;, &#x27;url&#x27;, &#x27;ui&#x27;, &#x27;button&#x27;]</span>
</code></pre></div>
<p>用途：分析一个入口文件会打包进哪些模块、删除某个包会影响哪些页面。</p>
<h2>BFS：最短路径</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">shortestPath</span>(<span class="hljs-params">start, target, graph</span>) {
  <span class="hljs-keyword">if</span> (!graph.<span class="hljs-title function_">has</span>(start)) <span class="hljs-keyword">return</span> <span class="hljs-literal">null</span>;
  <span class="hljs-keyword">const</span> queue = [start];
  <span class="hljs-keyword">const</span> previous = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Map</span>([[start, <span class="hljs-literal">null</span>]]);

  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">let</span> head = <span class="hljs-number">0</span>; head &lt; queue.<span class="hljs-property">length</span>; head++) {
    <span class="hljs-keyword">const</span> node = queue[head];
    <span class="hljs-keyword">if</span> (node === target) <span class="hljs-keyword">break</span>;
    <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> neighbor <span class="hljs-keyword">of</span> graph.<span class="hljs-title function_">get</span>(node) ?? []) {
      <span class="hljs-keyword">if</span> (previous.<span class="hljs-title function_">has</span>(neighbor)) <span class="hljs-keyword">continue</span>;
      previous.<span class="hljs-title function_">set</span>(neighbor, node);
      queue.<span class="hljs-title function_">push</span>(neighbor);
    }
  }

  <span class="hljs-keyword">if</span> (!previous.<span class="hljs-title function_">has</span>(target)) <span class="hljs-keyword">return</span> <span class="hljs-literal">null</span>;
  <span class="hljs-keyword">const</span> path = [];
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">let</span> node = target; node !== <span class="hljs-literal">null</span>; node = previous.<span class="hljs-title function_">get</span>(node)) path.<span class="hljs-title function_">push</span>(node);
  <span class="hljs-keyword">return</span> path.<span class="hljs-title function_">reverse</span>();
}

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">shortestPath</span>(<span class="hljs-string">&#x27;app&#x27;</span>, <span class="hljs-string">&#x27;button&#x27;</span>, dependencies)); <span class="hljs-comment">// [&#x27;app&#x27;, &#x27;ui&#x27;, &#x27;button&#x27;]</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">shortestPath</span>(<span class="hljs-string">&#x27;url&#x27;</span>, <span class="hljs-string">&#x27;app&#x27;</span>, dependencies)); <span class="hljs-comment">// null，边是有向的</span>
</code></pre></div>
<p><code>previous</code> 同时充当访问集合，并记录每个节点是从哪里来的，用来回溯出路径。用下标遍历队列，避免 <code>shift()</code> 每次移动整个数组。</p>
<h2>循环依赖检测与依赖优先顺序</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">dependencyFirstOrder</span>(<span class="hljs-params">graph</span>) {
  <span class="hljs-keyword">const</span> state = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Map</span>();
  <span class="hljs-keyword">const</span> order = [];

  <span class="hljs-keyword">function</span> <span class="hljs-title function_">visit</span>(<span class="hljs-params">node</span>) {
    <span class="hljs-keyword">const</span> current = state.<span class="hljs-title function_">get</span>(node);
    <span class="hljs-keyword">if</span> (current === <span class="hljs-string">&#x27;visiting&#x27;</span>) <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">\`发现循环依赖：<span class="hljs-subst">\${node}</span>\`</span>);
    <span class="hljs-keyword">if</span> (current === <span class="hljs-string">&#x27;done&#x27;</span>) <span class="hljs-keyword">return</span>;
    state.<span class="hljs-title function_">set</span>(node, <span class="hljs-string">&#x27;visiting&#x27;</span>);
    <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> neighbor <span class="hljs-keyword">of</span> graph.<span class="hljs-title function_">get</span>(node) ?? []) <span class="hljs-title function_">visit</span>(neighbor);
    state.<span class="hljs-title function_">set</span>(node, <span class="hljs-string">&#x27;done&#x27;</span>);
    order.<span class="hljs-title function_">push</span>(node);
  }

  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> node <span class="hljs-keyword">of</span> graph.<span class="hljs-title function_">keys</span>()) <span class="hljs-title function_">visit</span>(node);
  <span class="hljs-keyword">return</span> order;
}
</code></pre></div>
<p>节点在所有依赖处理完后才加入 <code>order</code>（后序），所以结果中依赖总排在使用者之前，这就是一种拓扑排序。示例为了展示三种状态使用了递归，依赖链很长时要改成显式栈。基于入度的写法见《如何用拓扑排序解析前端任务和模块依赖？》。</p>
<h2>常见追问</h2>
<ul>
<li><strong>DFS 和 BFS 的空间复杂度？</strong> 都是 O(V)。BFS 的队列在图很宽时会很大，DFS 的栈在路径很长时会很深。</li>
<li><strong>边有权重时还能用 BFS 找最短路径吗？</strong> 不能。BFS 只保证边数最少，带权重要用 Dijkstra。</li>
<li><strong>依赖要异步加载时怎么遍历？</strong> 先把节点标记为访问过再发起请求，避免同一个节点被重复加载；同时限制并发请求数。</li>
</ul>`};export{e as default};