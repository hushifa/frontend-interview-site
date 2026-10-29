var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>拓扑排序就是给有依赖关系的任务排个先后：每个任务都要排在它依赖的任务后面。比如 <code>build</code> 依赖 <code>lint</code>，<code>lint</code> 就得先跑。它只适用于没有环的有向图，结果通常不唯一。</p>
<p>常用的是 Kahn 算法。每个节点有一个入度，表示它还有几个依赖没完成。入度为 0 的节点可以开始了，放进队列；每输出一个节点，就把依赖它的那些节点的入度减 1，减到 0 的也放进队列。用下标读队列而不是 <code>shift()</code>，时间复杂度是 O(V + E)，V 是节点数，E 是依赖关系的条数。</p>
<p>怎么发现循环依赖？全部处理完以后，如果输出的数量比节点总数少，剩下那些入度还大于 0 的节点，要么在环上，要么依赖了环上的节点。</p>
<p>还有一个实际用处：同一批入度为 0 的节点之间没有依赖，可以并行跑。Turborepo、Nx 这类工具调度构建，就是基于这一点。</p>
</blockquote>
<h2>先把依赖写成图</h2>
<p>输入写成“节点 → 它依赖哪些节点”：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> tasks = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Map</span>([
  [<span class="hljs-string">&#x27;build&#x27;</span>, [<span class="hljs-string">&#x27;lint&#x27;</span>, <span class="hljs-string">&#x27;types&#x27;</span>]],
  [<span class="hljs-string">&#x27;lint&#x27;</span>, [<span class="hljs-string">&#x27;install&#x27;</span>]],
  [<span class="hljs-string">&#x27;types&#x27;</span>, [<span class="hljs-string">&#x27;install&#x27;</span>]],
  [<span class="hljs-string">&#x27;install&#x27;</span>, []],
  [<span class="hljs-string">&#x27;deploy&#x27;</span>, [<span class="hljs-string">&#x27;build&#x27;</span>]],
]);
</code></pre></div>
<p><code>build</code> 依赖 <code>lint</code> 和 <code>types</code>，所以它俩要排在 <code>build</code> 前面。</p>
<p>可是算法运行时，需要的是反过来的信息。某个节点做完了，我们要马上知道“谁在等它”，好把它们的入度减 1。所以算法内部会再建一张反向的表：“节点 → 依赖它的节点”。</p>
<h2>Kahn 算法</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">orderByPrerequisites</span>(<span class="hljs-params">dependencies</span>) {
  <span class="hljs-keyword">const</span> indegree = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Map</span>();
  <span class="hljs-keyword">const</span> dependents = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Map</span>();
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> name <span class="hljs-keyword">of</span> dependencies.<span class="hljs-title function_">keys</span>()) {
    indegree.<span class="hljs-title function_">set</span>(name, <span class="hljs-number">0</span>);
    dependents.<span class="hljs-title function_">set</span>(name, []);
  }

  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> [name, required] <span class="hljs-keyword">of</span> dependencies) {
    <span class="hljs-comment">// 去重，避免同一依赖写两次导致入度多算。</span>
    <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> dependency <span class="hljs-keyword">of</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Set</span>(required)) {
      <span class="hljs-keyword">if</span> (!dependencies.<span class="hljs-title function_">has</span>(dependency)) {
        <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">\`缺少依赖：<span class="hljs-subst">\${name}</span> 需要 <span class="hljs-subst">\${dependency}</span>\`</span>);
      }
      indegree.<span class="hljs-title function_">set</span>(name, indegree.<span class="hljs-title function_">get</span>(name) + <span class="hljs-number">1</span>);
      dependents.<span class="hljs-title function_">get</span>(dependency).<span class="hljs-title function_">push</span>(name);
    }
  }

  <span class="hljs-keyword">const</span> queue = [...indegree].<span class="hljs-title function_">filter</span>(<span class="hljs-function">(<span class="hljs-params">[, count]</span>) =&gt;</span> count === <span class="hljs-number">0</span>).<span class="hljs-title function_">map</span>(<span class="hljs-function">(<span class="hljs-params">[name]</span>) =&gt;</span> name);
  <span class="hljs-keyword">const</span> order = [];
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">let</span> head = <span class="hljs-number">0</span>; head &lt; queue.<span class="hljs-property">length</span>; head++) {
    <span class="hljs-keyword">const</span> current = queue[head];
    order.<span class="hljs-title function_">push</span>(current);
    <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> next <span class="hljs-keyword">of</span> dependents.<span class="hljs-title function_">get</span>(current)) {
      <span class="hljs-keyword">const</span> count = indegree.<span class="hljs-title function_">get</span>(next) - <span class="hljs-number">1</span>;
      indegree.<span class="hljs-title function_">set</span>(next, count);
      <span class="hljs-keyword">if</span> (count === <span class="hljs-number">0</span>) queue.<span class="hljs-title function_">push</span>(next);
    }
  }

  <span class="hljs-keyword">if</span> (order.<span class="hljs-property">length</span> !== dependencies.<span class="hljs-property">size</span>) {
    <span class="hljs-keyword">const</span> blocked = [...indegree].<span class="hljs-title function_">filter</span>(<span class="hljs-function">(<span class="hljs-params">[, count]</span>) =&gt;</span> count &gt; <span class="hljs-number">0</span>).<span class="hljs-title function_">map</span>(<span class="hljs-function">(<span class="hljs-params">[name]</span>) =&gt;</span> name);
    <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">\`存在循环依赖：<span class="hljs-subst">\${blocked.join(<span class="hljs-string">&#x27;, &#x27;</span>)}</span>\`</span>);
  }
  <span class="hljs-keyword">return</span> order;
}

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">orderByPrerequisites</span>(tasks));
<span class="hljs-comment">// [&#x27;install&#x27;, &#x27;lint&#x27;, &#x27;types&#x27;, &#x27;build&#x27;, &#x27;deploy&#x27;]</span>
</code></pre></div>
<p>跟着例子走一遍。一开始只有 <code>install</code> 入度是 0，先输出它。<code>lint</code> 和 <code>types</code> 都只依赖 <code>install</code>，入度从 1 减到 0，进队列。输出 <code>lint</code>，<code>build</code> 的入度从 2 减到 1，还不能开始；再输出 <code>types</code>，<code>build</code> 减到 0，进队列。最后是 <code>build</code> 和 <code>deploy</code>。</p>
<p>建图时为什么要 <code>new Set(required)</code> 去重？如果有人把同一个依赖写了两遍，入度就会多算 1，而这个依赖完成时只会减一次，这个节点就永远等不到 0，被误报成循环依赖。</p>
<p>实测覆盖了空图、重复依赖、缺失依赖、<code>a ↔ b</code> 这样的环，并用 500 个随机生成的无环图检查“每个依赖都排在使用者前面”，都通过了。</p>
<p>复杂度方面，建图时每条边处理一次；出队循环里每个节点出队一次，每条边减一次入度，加起来是 O(V + E)。如果用 <code>queue.shift()</code>，每次出队都要挪动整个数组，最坏会变成 O(V²)。另外，如果要求输出顺序固定，还要对就绪的节点排序，又会多出排序的开销。</p>
<h2>发现环以后，报告的是什么</h2>
<p>假设有 <code>a → b → a</code> 这个环，另外还有一个独立的 <code>c</code>。算法会正常输出 <code>c</code>，然后报告 <code>a, b</code> 排不出来。</p>
<p>要注意，<code>blocked</code> 里的节点不一定都在环上。一个节点如果依赖了环上的节点，它的入度也永远降不到 0，也会出现在 <code>blocked</code> 里。如果需要准确地报出环的路径，可以用 DFS 的“访问中”状态去找绕回来的那条边，见<a href="/questions/alg-graph-traversal/">《前端场景中的图遍历应该怎样建模？》</a>。</p>
<h2>怎么并行调度</h2>
<p>按“层”来看，就是一份并行计划：第一层是 <code>install</code>，第二层是 <code>lint</code> 和 <code>types</code>，它俩可以同时跑。</p>
<p>实际的调度器还能做得更好：不必等整层结束，某个任务一完成，就马上把新变成入度 0 的任务放进执行池，同时限制同时运行的数量。</p>
<h2>常见追问</h2>
<p><strong>为什么结果不唯一？</strong></p>
<blockquote>
<p>同时就绪的几个节点之间没有先后要求，先处理哪个都对。如果需要每次结果都一样，比如要生成稳定的构建日志，就对就绪队列按名称排个序。</p>
</blockquote>
<p><strong>npm 安装依赖也是拓扑排序吗？</strong></p>
<blockquote>
<p>包的安装顺序和生命周期脚本的执行要满足依赖关系，这点是一样的。但 npm 允许循环依赖，它要先把环打破再排序，不能像上面那样直接报错。</p>
</blockquote>`};export{e as default};