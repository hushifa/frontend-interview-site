var e={answerHtml:`<h2>简答</h2>
<ul>
<li>拓扑排序为有向无环图给出一个满足所有依赖的顺序。</li>
<li>Kahn 算法先统计入度，反复取出入度为 0 的节点并减少其后继节点的入度。</li>
<li>结果节点数少于总数时说明存在环。</li>
<li>时间复杂度 O(V + E)，同一层节点可以并行执行。</li>
</ul>
<p>构建工具需要先编译共享类型，再打包业务模块；插件系统需要先加载依赖插件，任务编排需要先完成数据库迁移再启动服务。依赖关系可以表示成有向图：<code>A -&gt; B</code> 表示 A 必须在 B 之前完成。只要图没有环，就可以用拓扑排序得到一个满足约束的执行顺序；如果排序结果不包含全部节点，就说明存在循环依赖或输入引用了不存在的节点。</p>
<h2>用入度逐步移除“没有前置依赖”的节点</h2>
<p>下面约定 <code>dependencies.get(name)</code> 返回当前节点必须先完成的节点：</p>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">export</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">orderByPrerequisites</span>(<span class="hljs-params">
  <span class="hljs-attr">dependencies</span>: <span class="hljs-title class_">ReadonlyMap</span>&lt;<span class="hljs-built_in">string</span>, <span class="hljs-keyword">readonly</span> <span class="hljs-built_in">string</span>[]&gt;,
</span>): <span class="hljs-built_in">string</span>[] {
  <span class="hljs-keyword">const</span> indegree = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Map</span>&lt;<span class="hljs-built_in">string</span>, <span class="hljs-built_in">number</span>&gt;();
  <span class="hljs-keyword">const</span> dependents = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Map</span>&lt;<span class="hljs-built_in">string</span>, <span class="hljs-built_in">string</span>[]&gt;();

  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> [name, required] <span class="hljs-keyword">of</span> dependencies) {
    <span class="hljs-keyword">if</span> (!indegree.<span class="hljs-title function_">has</span>(name)) indegree.<span class="hljs-title function_">set</span>(name, <span class="hljs-number">0</span>);
    <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> dependency <span class="hljs-keyword">of</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Set</span>(required)) {
      <span class="hljs-keyword">if</span> (!dependencies.<span class="hljs-title function_">has</span>(dependency)) {
        <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">\`缺少依赖：<span class="hljs-subst">\${name}</span> -&gt; <span class="hljs-subst">\${dependency}</span>\`</span>);
      }
      indegree.<span class="hljs-title function_">set</span>(name, (indegree.<span class="hljs-title function_">get</span>(name) ?? <span class="hljs-number">0</span>) + <span class="hljs-number">1</span>);
      <span class="hljs-keyword">const</span> list = dependents.<span class="hljs-title function_">get</span>(dependency) ?? [];
      list.<span class="hljs-title function_">push</span>(name);
      dependents.<span class="hljs-title function_">set</span>(dependency, list);
    }
  }

  <span class="hljs-keyword">const</span> ready = [...indegree]
    .<span class="hljs-title function_">filter</span>(<span class="hljs-function">(<span class="hljs-params">[, count]</span>) =&gt;</span> count === <span class="hljs-number">0</span>)
    .<span class="hljs-title function_">map</span>(<span class="hljs-function">(<span class="hljs-params">[name]</span>) =&gt;</span> name)
    .<span class="hljs-title function_">sort</span>();
  <span class="hljs-keyword">const</span> <span class="hljs-attr">result</span>: <span class="hljs-built_in">string</span>[] = [];

  <span class="hljs-keyword">while</span> (ready.<span class="hljs-property">length</span> &gt; <span class="hljs-number">0</span>) {
    <span class="hljs-keyword">const</span> current = ready.<span class="hljs-title function_">shift</span>();
    <span class="hljs-keyword">if</span> (current === <span class="hljs-literal">undefined</span>) <span class="hljs-keyword">break</span>;
    result.<span class="hljs-title function_">push</span>(current);

    <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> next <span class="hljs-keyword">of</span> dependents.<span class="hljs-title function_">get</span>(current) ?? []) {
      <span class="hljs-keyword">const</span> count = (indegree.<span class="hljs-title function_">get</span>(next) ?? <span class="hljs-number">0</span>) - <span class="hljs-number">1</span>;
      indegree.<span class="hljs-title function_">set</span>(next, count);
      <span class="hljs-keyword">if</span> (count === <span class="hljs-number">0</span>) {
        ready.<span class="hljs-title function_">push</span>(next);
        ready.<span class="hljs-title function_">sort</span>();
      }
    }
  }

  <span class="hljs-keyword">if</span> (result.<span class="hljs-property">length</span> !== indegree.<span class="hljs-property">size</span>) {
    <span class="hljs-keyword">const</span> blockedNodes = [...indegree]
      .<span class="hljs-title function_">filter</span>(<span class="hljs-function">(<span class="hljs-params">[, count]</span>) =&gt;</span> count &gt; <span class="hljs-number">0</span>)
      .<span class="hljs-title function_">map</span>(<span class="hljs-function">(<span class="hljs-params">[name]</span>) =&gt;</span> name);
    <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">\`存在循环依赖，未能排入顺序的节点：<span class="hljs-subst">\${blockedNodes.join(<span class="hljs-string">&#x27;, &#x27;</span>)}</span>\`</span>);
  }
  <span class="hljs-keyword">return</span> result;
}
</code></pre></div>
<p>例如 <code>types</code> 被 <code>app</code> 依赖、<code>vendor</code> 被 <code>app</code> 依赖时，结果可以是 <code>types, vendor, app</code> 或 <code>vendor, types, app</code>。代码对可执行节点按名称排序，使相同输入得到稳定结果，便于缓存、日志和测试；稳定顺序不代表业务上唯一正确的顺序。</p>
<h2>复杂度和输入边界</h2>
<p>使用邻接表和带读取下标的 FIFO 队列时，Kahn 算法可以达到 <code>O(V + E)</code> 时间和 <code>O(V + E)</code> 空间。这里的实现并不是线性时间：每加入一个就绪节点就重新排序，还使用了会移动数组元素的 <code>shift()</code>。按常见比较排序模型估算，反复排序可产生 <code>O(V² log V)</code> 成本，另有遍历边的 <code>O(E)</code> 成本；JavaScript 规范本身不承诺 sort 的具体复杂度。</p>
<p>如果需要每一步都选取名称最小的可用节点，可用最小堆，将队列操作控制在 <code>O(V log V)</code>，连同邻接表遍历合计 <code>O(E + V log V)</code>。如果只要求相同输入得到相同输出，而不要求字典序最小，Map 的插入顺序配合 FIFO 下标队列也可以保持确定性，无须牺牲稳定性来换取线性遍历。E 计入输入的依赖条目数量，本例先用 Set 合并每个节点的重复依赖。</p>
<p>输入校验不能省略：依赖名称应唯一且经过规范化，重复依赖不能让入度被多算，节点数量和边数量应设上限。用户可配置的插件图还要限制深度和内存，避免恶意输入构造巨大图或大量重复边。空图应返回空数组，只有自依赖时应明确报告环。</p>
<h2>环检测不能只说“排序失败”</h2>
<p>Kahn 算法发现结果长度不足时，可以确定剩余节点属于某个环或依赖于环，但不能直接给出完整环路径。构建工具和依赖安装器通常需要更友好的错误，例如 <code>a -&gt; b -&gt; c -&gt; a</code>。可以在剩余子图上运行 DFS，记录三种颜色（未访问、访问中、已完成）并在遇到访问中的节点时回溯路径。</p>
<p>错误信息还应区分“缺少依赖”和“循环依赖”。前者是输入引用问题，后者是约束无法同时满足；把两种错误都显示成“排序失败”会增加排查成本。</p>
<h2>拓扑顺序不等于可以无脑并行执行</h2>
<p>拓扑排序只给出依赖满足的顺序。如果两个节点没有依赖关系，它们可以并行，但还要考虑 CPU、网络、文件锁和任务副作用。可以在每轮把所有入度为零的节点组成批次，再用并发池执行；任一任务失败后，要定义是否取消同批任务、是否继续无关任务以及如何回滚已完成副作用。</p>
<p>增量构建也不能只比较拓扑序列。某个节点的输入、环境变量或工具版本变化，可能使所有传递依赖失效；需要结合内容哈希和缓存键判断哪些任务真正需要重新运行。缓存命中结果必须绑定依赖版本，不能只按任务名称复用。</p>
<h2>真实工程中的稳定性和安全</h2>
<p>模块解析应规范化路径和包名，防止 <code>../</code>、大小写差异或符号链接让同一资源被当成多个节点。插件名称和配置来自不可信来源时，拓扑排序只解决顺序，不解决插件代码执行权限；安装和运行仍需审查来源、沙箱和最小权限。</p>
<h2>常见误区</h2>
<ul>
<li>把边方向写反：先明确 <code>A -&gt; B</code> 是 A 依赖 B 还是 A 必须先于 B。</li>
<li>只按数组顺序执行：输入顺序不一定满足依赖，也无法发现环。</li>
<li>发现排序结果不足就静默跳过剩余节点：会生成不完整产物。</li>
<li>认为有拓扑序就能并行：任务仍可能争抢资源或有不可逆副作用。</li>
<li>只按名称做缓存：依赖内容和环境变化后可能复用错误结果。</li>
</ul>
<h2>参考资料</h2>
<ul>
<li><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map">MDN · Map</a></li>
<li><a href="https://en.wikipedia.org/wiki/Topological_sorting">Wikipedia · Topological sorting</a></li>
<li><a href="https://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes.html">TypeScript · TypeScript for JavaScript Programmers</a></li>
</ul>`};export{e as default};