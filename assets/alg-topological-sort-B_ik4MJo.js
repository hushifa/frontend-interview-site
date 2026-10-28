var e={answerHtml:`<h2>简答</h2>
<ul>
<li>拓扑排序适用于有向无环图，输出中每个节点都排在它依赖的节点之后，结果通常不唯一。</li>
<li>Kahn 算法：入度表示一个节点还有几个依赖没完成，入度为 0 的节点进入队列；每输出一个节点，就把依赖它的节点入度减 1。</li>
<li>用队列下标代替 <code>shift()</code>，时间复杂度是 O(V + E)，V 是节点数，E 是依赖边数。</li>
<li>所有节点处理完后，输出数量少于节点数，剩下入度大于 0 的节点就处在环上或依赖环上的节点。</li>
<li>同一批入度为 0 的节点之间没有依赖，可以并行执行，这是 Turborepo、Nx 这类工具调度构建的基础。</li>
</ul>
<h2>建模</h2>
<p>输入写成&quot;节点 → 它依赖的节点&quot;：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> tasks = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Map</span>([
  [<span class="hljs-string">&#x27;build&#x27;</span>, [<span class="hljs-string">&#x27;lint&#x27;</span>, <span class="hljs-string">&#x27;types&#x27;</span>]],
  [<span class="hljs-string">&#x27;lint&#x27;</span>, [<span class="hljs-string">&#x27;install&#x27;</span>]],
  [<span class="hljs-string">&#x27;types&#x27;</span>, [<span class="hljs-string">&#x27;install&#x27;</span>]],
  [<span class="hljs-string">&#x27;install&#x27;</span>, []],
  [<span class="hljs-string">&#x27;deploy&#x27;</span>, [<span class="hljs-string">&#x27;build&#x27;</span>]],
]);
</code></pre></div>
<p><code>build</code> 依赖 <code>lint</code> 和 <code>types</code>，所以它们必须排在 <code>build</code> 前面。算法内部需要反向的映射&quot;节点 → 依赖它的节点&quot;，在某个节点完成时找到下一批可以开始的节点。</p>
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
<p>实测覆盖了空图、重复依赖、缺失依赖、<code>a ↔ b</code> 环，并用 500 个随机生成的无环图校验&quot;每个依赖都排在使用者之前&quot;。</p>
<p>复杂度：建图时每条边处理一次，出队循环中每个节点出队一次、每条边减一次入度，合计 O(V + E)。如果用 <code>queue.shift()</code>，每次出队要移动数组元素，最坏会退化成 O(V²)；需要输出顺序稳定时对就绪节点排序，又会多出排序成本。</p>
<h2>环检测的结果</h2>
<p><code>a → b → a</code> 之外还有一个独立的 <code>c</code> 时，算法会输出 <code>c</code>，然后报告 <code>a, b</code> 无法排序。<code>blocked</code> 里的节点不一定都在环上：依赖了环上节点的节点同样入度无法归零。需要准确报告环的路径时，可以用 DFS 的&quot;访问中&quot;状态找出回边，见<a href="/questions/alg-graph-traversal/">《前端场景中的图遍历应该怎样建模？》</a>。</p>
<h2>并行调度</h2>
<p>按&quot;层&quot;处理就能得到并行计划：第一层是 <code>install</code>，第二层是 <code>lint</code> 和 <code>types</code>，它们可以同时运行。实际调度器在某个任务完成时立即把新变为 0 入度的任务放进执行池，并限制同时运行的数量，不必等整层结束。</p>
<h2>常见追问</h2>
<ul>
<li><strong>为什么结果不唯一？</strong> 同时就绪的多个节点之间没有先后要求，先处理哪个都正确。需要可复现的顺序（例如生成稳定的构建日志）时，对就绪队列按名称排序。</li>
<li><strong>npm 安装依赖也是拓扑排序吗？</strong> 包的安装顺序和生命周期脚本的执行要满足依赖关系；但 npm 允许循环依赖，需要先打破环再排序，不能直接报错。</li>
</ul>`};export{e as default};