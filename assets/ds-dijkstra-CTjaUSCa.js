var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>地铁换乘问“从 A 站到 B 站最少坐几站”，每一站算一步，这是边权都相同的最短路径，用 BFS。如果问“最少花多少分钟”，每段路耗时不同，就是带权最短路径，用 Dijkstra。图在代码里通常存成邻接表：每个点对应一个数组，列出它能直接到达的点和边的长度。</p>
<p>BFS 用队列从起点出发一层层往外走：先走到所有距离 1 的点，再走到距离 2 的点。因为是按层推进的，某个点第一次被访问时，走过的步数一定最少，所以 O(V + E) 就能求出所有点的最短步数，V 是点数，E 是边数。</p>
<p>边长不一样时，少走几步不代表路程短，BFS 就不对了。Dijkstra 的做法是：每次从还没确定的点里，挑出当前已知距离最小的那个，它的距离就不会再变小，因为其他路线都得先绕到一个更远的点，边权又不为负，只会更长。确定它以后，用它去更新邻居的距离，这一步叫松弛。用最小堆来挑最小值，复杂度是 O((V + E) log V)。</p>
<p>要注意，Dijkstra 要求边权非负，有负权边时“当前最小就已确定”的推理不成立，要换成 Bellman-Ford。另外用堆实现时，同一个点可能被多次放进堆，取出时要跳过已经过期的记录。</p>
</blockquote>
<h2>边权相同：BFS</h2>
<p>先看 BFS 怎样同时记录距离和“从哪里来”，后者用来还原整条路径。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">shortestPathBFS</span>(<span class="hljs-params">graph, start, target</span>) {
  <span class="hljs-keyword">const</span> prev = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Map</span>([[start, <span class="hljs-literal">null</span>]]);
  <span class="hljs-keyword">const</span> queue = [start];
  <span class="hljs-keyword">let</span> head = <span class="hljs-number">0</span>; <span class="hljs-comment">// 用下标出队，避免 shift 挪动整个数组</span>
  <span class="hljs-keyword">while</span> (head &lt; queue.<span class="hljs-property">length</span>) {
    <span class="hljs-keyword">const</span> node = queue[head++];
    <span class="hljs-keyword">if</span> (node === target) <span class="hljs-keyword">break</span>;
    <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> next <span class="hljs-keyword">of</span> graph[node] ?? []) {
      <span class="hljs-keyword">if</span> (prev.<span class="hljs-title function_">has</span>(next)) <span class="hljs-keyword">continue</span>; <span class="hljs-comment">// 已经访问过，第一次到达时就是最短</span>
      prev.<span class="hljs-title function_">set</span>(next, node);
      queue.<span class="hljs-title function_">push</span>(next);
    }
  }
  <span class="hljs-keyword">if</span> (!prev.<span class="hljs-title function_">has</span>(target)) <span class="hljs-keyword">return</span> <span class="hljs-literal">null</span>;
  <span class="hljs-keyword">const</span> path = [];
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">let</span> node = target; node !== <span class="hljs-literal">null</span>; node = prev.<span class="hljs-title function_">get</span>(node)) path.<span class="hljs-title function_">push</span>(node);
  <span class="hljs-keyword">return</span> path.<span class="hljs-title function_">reverse</span>();
}

<span class="hljs-keyword">const</span> subway = {
  <span class="hljs-attr">A</span>: [<span class="hljs-string">&#x27;B&#x27;</span>, <span class="hljs-string">&#x27;C&#x27;</span>],
  <span class="hljs-attr">B</span>: [<span class="hljs-string">&#x27;A&#x27;</span>, <span class="hljs-string">&#x27;D&#x27;</span>],
  <span class="hljs-attr">C</span>: [<span class="hljs-string">&#x27;A&#x27;</span>, <span class="hljs-string">&#x27;D&#x27;</span>, <span class="hljs-string">&#x27;E&#x27;</span>],
  <span class="hljs-attr">D</span>: [<span class="hljs-string">&#x27;B&#x27;</span>, <span class="hljs-string">&#x27;C&#x27;</span>, <span class="hljs-string">&#x27;F&#x27;</span>],
  <span class="hljs-attr">E</span>: [<span class="hljs-string">&#x27;C&#x27;</span>, <span class="hljs-string">&#x27;F&#x27;</span>],
  <span class="hljs-attr">F</span>: [<span class="hljs-string">&#x27;D&#x27;</span>, <span class="hljs-string">&#x27;E&#x27;</span>],
  <span class="hljs-attr">G</span>: [],
};

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">shortestPathBFS</span>(subway, <span class="hljs-string">&#x27;A&#x27;</span>, <span class="hljs-string">&#x27;F&#x27;</span>).<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;→&#x27;</span>)); <span class="hljs-comment">// A→B→D→F</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">shortestPathBFS</span>(subway, <span class="hljs-string">&#x27;A&#x27;</span>, <span class="hljs-string">&#x27;A&#x27;</span>).<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;→&#x27;</span>)); <span class="hljs-comment">// A</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">shortestPathBFS</span>(subway, <span class="hljs-string">&#x27;A&#x27;</span>, <span class="hljs-string">&#x27;G&#x27;</span>)); <span class="hljs-comment">// null</span>
</code></pre></div>
<p>为什么一访问过就跳过，不担心后面有更短的路？BFS 先处理完所有距离为 k 的点，才开始处理距离为 k + 1 的点。一个点第一次被发现时，它的距离就是发现它的那一层加 1，之后再发现它的路线只会在同一层或更深的层，不会更短。</p>
<p><code>A→C→D→F</code> 和 <code>A→C→E→F</code> 也是 3 步，为什么输出的是经过 B 的那条？A 的邻居里 B 排在前面，B 先入队，所以 D 是从 B 发现的。最短路径有多条时，BFS 返回哪一条取决于邻居的顺序。</p>
<p>二叉树的层序遍历也是 BFS，只是树里不会重复访问节点，不用 <code>prev</code> 判重，见<a href="/questions/ds-binary-tree-bfs/">《二叉树怎样层序遍历、求最大深度？》</a>。</p>
<h2>边权不同：Dijkstra</h2>
<p>下面先写一个最小堆，按距离取出点，再看主循环里的“过期记录”判断。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">class</span> <span class="hljs-title class_">MinHeap</span> {
  <span class="hljs-title function_">constructor</span>(<span class="hljs-params"></span>) {
    <span class="hljs-variable language_">this</span>.<span class="hljs-property">items</span> = [];
  }
  <span class="hljs-keyword">get</span> <span class="hljs-title function_">size</span>() {
    <span class="hljs-keyword">return</span> <span class="hljs-variable language_">this</span>.<span class="hljs-property">items</span>.<span class="hljs-property">length</span>;
  }
  <span class="hljs-title function_">push</span>(<span class="hljs-params">item</span>) {
    <span class="hljs-keyword">const</span> a = <span class="hljs-variable language_">this</span>.<span class="hljs-property">items</span>;
    a.<span class="hljs-title function_">push</span>(item);
    <span class="hljs-keyword">let</span> i = a.<span class="hljs-property">length</span> - <span class="hljs-number">1</span>;
    <span class="hljs-keyword">while</span> (i &gt; <span class="hljs-number">0</span>) {
      <span class="hljs-keyword">const</span> p = (i - <span class="hljs-number">1</span>) &gt;&gt; <span class="hljs-number">1</span>;
      <span class="hljs-keyword">if</span> (a[p][<span class="hljs-number">0</span>] &lt;= a[i][<span class="hljs-number">0</span>]) <span class="hljs-keyword">break</span>;
      [a[p], a[i]] = [a[i], a[p]];
      i = p;
    }
  }
  <span class="hljs-title function_">pop</span>(<span class="hljs-params"></span>) {
    <span class="hljs-keyword">const</span> a = <span class="hljs-variable language_">this</span>.<span class="hljs-property">items</span>;
    <span class="hljs-keyword">const</span> top = a[<span class="hljs-number">0</span>];
    <span class="hljs-keyword">const</span> last = a.<span class="hljs-title function_">pop</span>();
    <span class="hljs-keyword">if</span> (a.<span class="hljs-property">length</span> &gt; <span class="hljs-number">0</span>) {
      a[<span class="hljs-number">0</span>] = last;
      <span class="hljs-keyword">let</span> i = <span class="hljs-number">0</span>;
      <span class="hljs-keyword">while</span> (<span class="hljs-literal">true</span>) {
        <span class="hljs-keyword">const</span> l = <span class="hljs-number">2</span> * i + <span class="hljs-number">1</span>;
        <span class="hljs-keyword">const</span> r = l + <span class="hljs-number">1</span>;
        <span class="hljs-keyword">let</span> m = i;
        <span class="hljs-keyword">if</span> (l &lt; a.<span class="hljs-property">length</span> &amp;&amp; a[l][<span class="hljs-number">0</span>] &lt; a[m][<span class="hljs-number">0</span>]) m = l;
        <span class="hljs-keyword">if</span> (r &lt; a.<span class="hljs-property">length</span> &amp;&amp; a[r][<span class="hljs-number">0</span>] &lt; a[m][<span class="hljs-number">0</span>]) m = r;
        <span class="hljs-keyword">if</span> (m === i) <span class="hljs-keyword">break</span>;
        [a[m], a[i]] = [a[i], a[m]];
        i = m;
      }
    }
    <span class="hljs-keyword">return</span> top;
  }
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">dijkstra</span>(<span class="hljs-params">graph, start</span>) {
  <span class="hljs-keyword">const</span> dist = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Map</span>([[start, <span class="hljs-number">0</span>]]);
  <span class="hljs-keyword">const</span> heap = <span class="hljs-keyword">new</span> <span class="hljs-title class_">MinHeap</span>();
  heap.<span class="hljs-title function_">push</span>([<span class="hljs-number">0</span>, start]);
  <span class="hljs-keyword">while</span> (heap.<span class="hljs-property">size</span> &gt; <span class="hljs-number">0</span>) {
    <span class="hljs-keyword">const</span> [d, node] = heap.<span class="hljs-title function_">pop</span>();
    <span class="hljs-keyword">if</span> (d &gt; dist.<span class="hljs-title function_">get</span>(node)) <span class="hljs-keyword">continue</span>; <span class="hljs-comment">// 过期记录：这个点已经用更短的距离处理过</span>
    <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> [next, weight] <span class="hljs-keyword">of</span> graph[node] ?? []) {
      <span class="hljs-keyword">const</span> candidate = d + weight;
      <span class="hljs-keyword">if</span> (candidate &lt; (dist.<span class="hljs-title function_">get</span>(next) ?? <span class="hljs-title class_">Infinity</span>)) {
        dist.<span class="hljs-title function_">set</span>(next, candidate); <span class="hljs-comment">// 松弛：找到了更短的路线</span>
        heap.<span class="hljs-title function_">push</span>([candidate, next]);
      }
    }
  }
  <span class="hljs-keyword">return</span> dist;
}

<span class="hljs-keyword">const</span> roads = {
  <span class="hljs-attr">A</span>: [[<span class="hljs-string">&#x27;B&#x27;</span>, <span class="hljs-number">4</span>], [<span class="hljs-string">&#x27;C&#x27;</span>, <span class="hljs-number">1</span>]],
  <span class="hljs-attr">B</span>: [[<span class="hljs-string">&#x27;D&#x27;</span>, <span class="hljs-number">1</span>]],
  <span class="hljs-attr">C</span>: [[<span class="hljs-string">&#x27;B&#x27;</span>, <span class="hljs-number">2</span>], [<span class="hljs-string">&#x27;D&#x27;</span>, <span class="hljs-number">5</span>]],
  <span class="hljs-attr">D</span>: [[<span class="hljs-string">&#x27;E&#x27;</span>, <span class="hljs-number">3</span>]],
  <span class="hljs-attr">E</span>: [],
  <span class="hljs-attr">F</span>: [[<span class="hljs-string">&#x27;A&#x27;</span>, <span class="hljs-number">1</span>]],
};

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">JSON</span>.<span class="hljs-title function_">stringify</span>(<span class="hljs-title class_">Object</span>.<span class="hljs-title function_">fromEntries</span>(<span class="hljs-title function_">dijkstra</span>(roads, <span class="hljs-string">&#x27;A&#x27;</span>))));
<span class="hljs-comment">// {&quot;A&quot;:0,&quot;B&quot;:3,&quot;C&quot;:1,&quot;D&quot;:4,&quot;E&quot;:7}</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">JSON</span>.<span class="hljs-title function_">stringify</span>(<span class="hljs-title class_">Object</span>.<span class="hljs-title function_">fromEntries</span>(<span class="hljs-title function_">dijkstra</span>(roads, <span class="hljs-string">&#x27;E&#x27;</span>)))); <span class="hljs-comment">// {&quot;E&quot;:0}</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">dijkstra</span>({ <span class="hljs-attr">X</span>: [[<span class="hljs-string">&#x27;Y&#x27;</span>, <span class="hljs-number">0</span>]], <span class="hljs-attr">Y</span>: [] }, <span class="hljs-string">&#x27;X&#x27;</span>).<span class="hljs-title function_">get</span>(<span class="hljs-string">&#x27;Y&#x27;</span>)); <span class="hljs-comment">// 0</span>
</code></pre></div>
<p>A 到 B 为什么是 3 而不是 4？直接走 A→B 长度是 4，但先到 C（1）再到 B（2）只要 3。BFS 只看步数，会选一步就到的 A→B；Dijkstra 先取出距离最小的 C，用它把 B 的距离从 4 松弛成 3。D 也一样，A→C→B→D 是 4，比 A→C→D 的 6 短。</p>
<p><code>d &gt; dist.get(node)</code> 在过滤什么？B 先以距离 4 进堆，后来又以 3 进堆，堆里同时有两条 B 的记录。距离 3 的那条先被取出并处理；距离 4 的那条之后取出时已经过期，直接跳过。这种写法叫懒删除，因为 JS 没有内置的堆，也没有现成的“减小某个元素的键”操作，多放几条记录再跳过最简单。</p>
<p>F 为什么不在结果里？F 有一条到 A 的边，但从 A 出发没有路能到 F，所以 <code>dist</code> 里没有它。查询时 <code>dist.get(&#x27;F&#x27;)</code> 是 <code>undefined</code>，可以按需要当成 <code>Infinity</code>，表示不可达。</p>
<p>复杂度怎么算？每条边最多触发一次成功的松弛，所以堆里最多有 E + 1 条记录，每次进出堆 O(log E)。E 不超过 V²，log E 不超过 2 log V，所以通常写成 O((V + E) log V)。不用堆、每次线性扫描找最小值时是 O(V²)，点很少但边很密时反而更简单。</p>
<h2>负权边为什么不行</h2>
<p>Dijkstra 的正确性建立在一个推理上：取出的点距离最小，别的路线都要先经过一个距离更大的点，再加上非负的边，只会更长。有负权边时，绕一段远路再走一条负边，可能反而更短，已经“确定”的距离就是错的。</p>
<p>比如 A→B 长 2，A→C 长 3，C→B 长 -2。用 <code>visited</code> 集合标记“已确定”的经典写法，会先确定 B 的距离是 2，之后不再处理 B，可实际上 A→C→B 只要 1。上面的懒删除写法没有 <code>visited</code>，B 被松弛成 1 后会再次进堆、重新处理，这个小例子碰巧算对了；但这样一个点可能被反复处理，O((V + E) log V) 的保证就没了，最坏情况会是指数级。所以有负权边时应当换成 Bellman-Ford：把所有边松弛 V - 1 轮，复杂度 O(V × E)，还能检测负权环。</p>
<h2>常见追问</h2>
<p><strong>前端哪里会用到最短路径？</strong></p>
<blockquote>
<p>地图和导航的路线规划、流程图编辑器里自动连线避开节点、游戏里角色寻路。网格寻路常用 A*，它是 Dijkstra 加上一个“离终点还有多远”的估计值，让搜索优先朝终点方向展开。</p>
</blockquote>
<p><strong>边权只有 0 和 1 时有更快的办法吗？</strong></p>
<blockquote>
<p>有，叫 0-1 BFS。用双端队列代替堆：走权重 0 的边时把新点放到队头，走权重 1 的边时放到队尾，这样队列始终按距离有序，复杂度是 O(V + E)。</p>
</blockquote>`};export{e as default};