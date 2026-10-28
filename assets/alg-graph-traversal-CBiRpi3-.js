var e={answerHtml:`<p>前端工程里的依赖关系、页面跳转、权限继承和节点连接都可以表示成图：节点是模块或页面，边是“依赖”“可以跳转到”或“引用”。一旦图中存在共享节点、回路或多个入口，单纯递归一个数组就容易重复处理、死循环或无法解释访问顺序。</p>
<h2>先确定图的方向和数据结构</h2>
<p>有向图的边有方向，例如模块 A 导入模块 B；无向图的边表示双方关系，例如两个节点直接相连。遍历前要明确“从哪里出发”和“沿什么边走”，否则“找到所有相关页面”可能有多种不同答案。</p>
<p>前端接口常用邻接表表示：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> dependencies = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Map</span>([
  [<span class="hljs-string">&#x27;app&#x27;</span>, [<span class="hljs-string">&#x27;router&#x27;</span>, <span class="hljs-string">&#x27;ui&#x27;</span>]],
  [<span class="hljs-string">&#x27;router&#x27;</span>, [<span class="hljs-string">&#x27;url&#x27;</span>]],
  [<span class="hljs-string">&#x27;ui&#x27;</span>, [<span class="hljs-string">&#x27;button&#x27;</span>]],
  [<span class="hljs-string">&#x27;button&#x27;</span>, []],
  [<span class="hljs-string">&#x27;url&#x27;</span>, []],
]);
</code></pre></div>
<p><code>Map</code> 的键是节点 ID，值是直接邻居。真实数据应校验节点 ID、邻居数组和缺失节点策略；不能把服务器返回的任意对象直接当作可遍历图，还要限制节点数量和边数量，避免输入造成资源耗尽。</p>
<h2>DFS 适合沿一条路径深入</h2>
<p>深度优先搜索先沿当前邻居继续向下，走不通后再回退。它适合依赖分析、路径存在性和拓扑相关检查，但递归实现的调用深度受 JavaScript 栈限制。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">depthFirst</span>(<span class="hljs-params">start, graph, visit</span>) {
  <span class="hljs-keyword">if</span> (!graph.<span class="hljs-title function_">has</span>(start)) <span class="hljs-keyword">return</span>;
  <span class="hljs-keyword">const</span> visited = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Set</span>();
  <span class="hljs-keyword">const</span> stack = [start];

  <span class="hljs-keyword">while</span> (stack.<span class="hljs-property">length</span> &gt; <span class="hljs-number">0</span>) {
    <span class="hljs-keyword">const</span> node = stack.<span class="hljs-title function_">pop</span>();
    <span class="hljs-keyword">if</span> (visited.<span class="hljs-title function_">has</span>(node)) <span class="hljs-keyword">continue</span>;
    visited.<span class="hljs-title function_">add</span>(node);
    <span class="hljs-title function_">visit</span>(node);

    <span class="hljs-keyword">const</span> neighbors = graph.<span class="hljs-title function_">get</span>(node) ?? [];
    <span class="hljs-keyword">for</span> (<span class="hljs-keyword">let</span> index = neighbors.<span class="hljs-property">length</span> - <span class="hljs-number">1</span>; index &gt;= <span class="hljs-number">0</span>; index -= <span class="hljs-number">1</span>) {
      <span class="hljs-keyword">if</span> (!visited.<span class="hljs-title function_">has</span>(neighbors[index])) stack.<span class="hljs-title function_">push</span>(neighbors[index]);
    }
  }
  <span class="hljs-keyword">return</span> visited;
}
</code></pre></div>
<p>这里用显式栈避免深图递归溢出。逆序压栈只是为了让访问顺序更接近邻接表从左到右；如果业务只关心可达集合，顺序不应被实现细节当成契约。</p>
<h2>BFS 适合按层寻找最短边数</h2>
<p>如果每条边成本相同，BFS 按距离一层层扩展，第一次到达目标时得到的是边数最少的路径。它适合查找页面跳转的最少步骤、组件依赖层级或最近的可达节点。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">shortestPath</span>(<span class="hljs-params">start, target, graph</span>) {
  <span class="hljs-keyword">if</span> (!graph.<span class="hljs-title function_">has</span>(start)) <span class="hljs-keyword">return</span> <span class="hljs-literal">null</span>;
  <span class="hljs-keyword">const</span> queue = [start];
  <span class="hljs-keyword">let</span> head = <span class="hljs-number">0</span>;
  <span class="hljs-keyword">const</span> previous = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Map</span>([[start, <span class="hljs-literal">null</span>]]);

  <span class="hljs-keyword">while</span> (head &lt; queue.<span class="hljs-property">length</span>) {
    <span class="hljs-keyword">const</span> node = queue[head++];
    <span class="hljs-keyword">if</span> (node === target) <span class="hljs-keyword">break</span>;

    <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> neighbor <span class="hljs-keyword">of</span> graph.<span class="hljs-title function_">get</span>(node) ?? []) {
      <span class="hljs-keyword">if</span> (previous.<span class="hljs-title function_">has</span>(neighbor)) <span class="hljs-keyword">continue</span>;
      previous.<span class="hljs-title function_">set</span>(neighbor, node);
      queue.<span class="hljs-title function_">push</span>(neighbor);
    }
  }

  <span class="hljs-keyword">if</span> (!previous.<span class="hljs-title function_">has</span>(target)) <span class="hljs-keyword">return</span> <span class="hljs-literal">null</span>;
  <span class="hljs-keyword">const</span> path = [];
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">let</span> node = target; node !== <span class="hljs-literal">null</span>; node = previous.<span class="hljs-title function_">get</span>(node)) {
    path.<span class="hljs-title function_">push</span>(node);
  }
  path.<span class="hljs-title function_">reverse</span>();
  <span class="hljs-keyword">return</span> path;
}
</code></pre></div>
<p><code>head</code> 指针避免每次 <code>shift()</code> 搬移整个数组。<code>previous</code> 同时承担访问集合和回溯路径的职责：第一次写入一个节点时记录它从哪里到达，后续遇到同一节点就跳过。</p>
<p>这只保证边数最少，不保证真实页面加载时间最短。如果边有权重，例如网络延迟或费用，就要使用 Dijkstra、A* 或其他适合权重的算法；不能把 BFS 的结果叫作所有场景的“最优路径”。</p>
<h2>访问集合是防止重复和环的关键</h2>
<p>有向图可以包含 A → B → C → A。没有 visited 集合，DFS 或 BFS 会无限循环；即使没有环，共享依赖也会被重复处理，导致计算和副作用执行多次。</p>
<p>“已发现”和“已完成”有时需要分开。拓扑排序和循环检测通常使用三种状态：未访问、正在访问、已完成。遍历一条边时如果遇到正在访问的节点，说明当前依赖链上存在环；遇到已完成节点则可以复用结果。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">topologicalOrder</span>(<span class="hljs-params">graph</span>) {
  <span class="hljs-keyword">const</span> state = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Map</span>();
  <span class="hljs-keyword">const</span> order = [];

  <span class="hljs-keyword">function</span> <span class="hljs-title function_">visit</span>(<span class="hljs-params">node</span>) {
    <span class="hljs-keyword">const</span> current = state.<span class="hljs-title function_">get</span>(node) ?? <span class="hljs-number">0</span>;
    <span class="hljs-keyword">if</span> (current === <span class="hljs-number">1</span>) <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">\`发现循环依赖：<span class="hljs-subst">\${node}</span>\`</span>);
    <span class="hljs-keyword">if</span> (current === <span class="hljs-number">2</span>) <span class="hljs-keyword">return</span>;
    state.<span class="hljs-title function_">set</span>(node, <span class="hljs-number">1</span>);
    <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> neighbor <span class="hljs-keyword">of</span> graph.<span class="hljs-title function_">get</span>(node) ?? []) <span class="hljs-title function_">visit</span>(neighbor);
    state.<span class="hljs-title function_">set</span>(node, <span class="hljs-number">2</span>);
    order.<span class="hljs-title function_">push</span>(node);
  }

  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> node <span class="hljs-keyword">of</span> graph.<span class="hljs-title function_">keys</span>()) <span class="hljs-title function_">visit</span>(node);
  <span class="hljs-keyword">return</span> order;
}
</code></pre></div>
<p>这里沿用开头的语义：graph.get(A) 是 A 依赖的节点。后序加入 order 已经让依赖先于使用者，所以不能再 reverse；若把边改定义为“必须先于”，才需要相反的输出方向。与独立拓扑排序题比较时，先统一输入语义，不要只比较函数名。</p>
<p>这个实现使用递归，适合示例规模；依赖图可能非常深时应改成显式栈，并在输入阶段限制规模。拓扑排序只适用于有向无环图，示例报出遇到回边的节点，但未构造完整环路径；生产诊断可增加当前路径记录。</p>
<h2>复杂度和内存要按图的规模算</h2>
<p>在常见 Map/Set 查询近似常数时间的实现假设下，邻接表 BFS/DFS 遍历耗时 O(V + E)，其中 V 是节点数，E 是边数。BFS 在入队时标记，每个节点最多入队一次，额外空间 O(V)。本例 DFS 则在出栈时标记：尚未访问的共享邻居可能被重复压栈，因此待处理栈最坏可达到 O(E)，不能无条件声称它只需 O(V) 空间。需要严格控制栈大小时，可改为保存遍历帧和邻居下标的实现。</p>
<p>示例假定节点 ID 是非空字符串、邻接表完整且遍历期间不修改。缺失起点的 DFS 返回 undefined，BFS 返回 null；缺失邻居不应默默当作合法外部节点，需在入口校验阶段拒绝或明确定义。邻接矩阵空间 O(V²)，不适合稀疏的大型依赖图。</p>
<p>实际前端还要计算解析后的节点对象、路径和缓存结果，不能只看算法复杂度就认为内存一定可接受。对用户上传的图、服务端返回的关系和可编辑流程，要限制深度、节点数、边数和单个 ID 大小。</p>
<h2>异步图遍历不是把回调改成 async</h2>
<p>如果遍历每个节点都要请求接口，直接在 DFS 中 <code>await</code> 会让执行顺序变成串行；把所有邻居都 <code>Promise.all</code> 又可能一次启动数千个请求。应明确并发上限、取消信号、失败策略和结果过期检查。</p>
<p>遍历依赖图时，某个节点失败是否阻止整个图、是否允许部分结果、重复节点是否共用进行中的 Promise，都属于业务协议。普通 BFS/DFS 只决定访问顺序，不自动提供网络重试、并发池或事务。</p>
<p>图遍历的实现质量不在于写出最短的递归函数，而在于边的方向、访问身份、环和失败语义都清楚。把这些约束写进数据结构和测试，才能让它服务于真实的路由、依赖和权限场景。</p>`};export{e as default};