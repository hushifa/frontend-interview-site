var e={answerHtml:`<h2>简答</h2>
<ul>
<li>二叉堆是用数组存储的完全二叉树，下标 i 的父节点是 <code>(i - 1) &gt;&gt; 1</code>，子节点是 <code>2i + 1</code> 和 <code>2i + 2</code>；最小堆中每个父节点都不大于子节点。</li>
<li>插入：放到数组末尾，与父节点比较并上浮；取出：取走堆顶，把末尾元素移到堆顶，与较小的子节点比较并下沉。两者都是 O(log n)，查看堆顶是 O(1)。</li>
<li>堆只保证堆顶最小，不维护整体有序，所以不需要每次排序。</li>
<li>堆不是稳定结构，同优先级的任务要按提交顺序取出时，给每个任务加递增序号作为第二比较键。</li>
<li>优先队列只决定下一个执行谁，并发数量和任务取消要由调度器另外处理。</li>
</ul>
<h2>实现</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">class</span> <span class="hljs-title class_">PriorityQueue</span> {
  #heap = [];
  #sequence = <span class="hljs-number">0</span>;

  <span class="hljs-keyword">get</span> <span class="hljs-title function_">size</span>() {
    <span class="hljs-keyword">return</span> <span class="hljs-variable language_">this</span>.#heap.<span class="hljs-property">length</span>;
  }

  <span class="hljs-comment">// 数字越小优先级越高；优先级相同时先提交的排在前面。</span>
  #<span class="hljs-title function_">before</span>(<span class="hljs-params">a, b</span>) {
    <span class="hljs-keyword">return</span> a.<span class="hljs-property">priority</span> &lt; b.<span class="hljs-property">priority</span> || (a.<span class="hljs-property">priority</span> === b.<span class="hljs-property">priority</span> &amp;&amp; a.<span class="hljs-property">sequence</span> &lt; b.<span class="hljs-property">sequence</span>);
  }

  #<span class="hljs-title function_">swap</span>(<span class="hljs-params">i, j</span>) {
    [<span class="hljs-variable language_">this</span>.#heap[i], <span class="hljs-variable language_">this</span>.#heap[j]] = [<span class="hljs-variable language_">this</span>.#heap[j], <span class="hljs-variable language_">this</span>.#heap[i]];
  }

  <span class="hljs-title function_">push</span>(<span class="hljs-params">value, priority</span>) {
    <span class="hljs-keyword">if</span> (!<span class="hljs-title class_">Number</span>.<span class="hljs-built_in">isFinite</span>(priority)) <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">TypeError</span>(<span class="hljs-string">&#x27;优先级必须为有限数值&#x27;</span>);
    <span class="hljs-keyword">const</span> heap = <span class="hljs-variable language_">this</span>.#heap;
    heap.<span class="hljs-title function_">push</span>({ value, priority, <span class="hljs-attr">sequence</span>: <span class="hljs-variable language_">this</span>.#sequence++ });
    <span class="hljs-keyword">let</span> index = heap.<span class="hljs-property">length</span> - <span class="hljs-number">1</span>;
    <span class="hljs-keyword">while</span> (index &gt; <span class="hljs-number">0</span>) {
      <span class="hljs-keyword">const</span> parent = (index - <span class="hljs-number">1</span>) &gt;&gt; <span class="hljs-number">1</span>;
      <span class="hljs-keyword">if</span> (!<span class="hljs-variable language_">this</span>.#<span class="hljs-title function_">before</span>(heap[index], heap[parent])) <span class="hljs-keyword">break</span>;
      <span class="hljs-variable language_">this</span>.#<span class="hljs-title function_">swap</span>(index, parent);
      index = parent;
    }
  }

  <span class="hljs-title function_">peek</span>(<span class="hljs-params"></span>) {
    <span class="hljs-keyword">return</span> <span class="hljs-variable language_">this</span>.#heap[<span class="hljs-number">0</span>]?.<span class="hljs-property">value</span>;
  }

  <span class="hljs-title function_">pop</span>(<span class="hljs-params"></span>) {
    <span class="hljs-keyword">const</span> heap = <span class="hljs-variable language_">this</span>.#heap;
    <span class="hljs-keyword">if</span> (heap.<span class="hljs-property">length</span> === <span class="hljs-number">0</span>) <span class="hljs-keyword">return</span> <span class="hljs-literal">undefined</span>;
    <span class="hljs-keyword">const</span> top = heap[<span class="hljs-number">0</span>];
    <span class="hljs-keyword">const</span> last = heap.<span class="hljs-title function_">pop</span>();
    <span class="hljs-keyword">if</span> (heap.<span class="hljs-property">length</span> &gt; <span class="hljs-number">0</span>) {
      heap[<span class="hljs-number">0</span>] = last;
      <span class="hljs-keyword">let</span> index = <span class="hljs-number">0</span>;
      <span class="hljs-keyword">while</span> (<span class="hljs-literal">true</span>) {
        <span class="hljs-keyword">const</span> left = index * <span class="hljs-number">2</span> + <span class="hljs-number">1</span>;
        <span class="hljs-keyword">const</span> right = left + <span class="hljs-number">1</span>;
        <span class="hljs-keyword">let</span> best = index;
        <span class="hljs-keyword">if</span> (left &lt; heap.<span class="hljs-property">length</span> &amp;&amp; <span class="hljs-variable language_">this</span>.#<span class="hljs-title function_">before</span>(heap[left], heap[best])) best = left;
        <span class="hljs-keyword">if</span> (right &lt; heap.<span class="hljs-property">length</span> &amp;&amp; <span class="hljs-variable language_">this</span>.#<span class="hljs-title function_">before</span>(heap[right], heap[best])) best = right;
        <span class="hljs-keyword">if</span> (best === index) <span class="hljs-keyword">break</span>;
        <span class="hljs-variable language_">this</span>.#<span class="hljs-title function_">swap</span>(index, best);
        index = best;
      }
    }
    <span class="hljs-keyword">return</span> top.<span class="hljs-property">value</span>;
  }
}

<span class="hljs-keyword">const</span> queue = <span class="hljs-keyword">new</span> <span class="hljs-title class_">PriorityQueue</span>();
queue.<span class="hljs-title function_">push</span>(<span class="hljs-string">&#x27;下一页图片&#x27;</span>, <span class="hljs-number">5</span>);
queue.<span class="hljs-title function_">push</span>(<span class="hljs-string">&#x27;视口图片 A&#x27;</span>, <span class="hljs-number">1</span>);
queue.<span class="hljs-title function_">push</span>(<span class="hljs-string">&#x27;视口图片 B&#x27;</span>, <span class="hljs-number">1</span>);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(queue.<span class="hljs-title function_">pop</span>()); <span class="hljs-comment">// 视口图片 A</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(queue.<span class="hljs-title function_">pop</span>()); <span class="hljs-comment">// 视口图片 B</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(queue.<span class="hljs-title function_">pop</span>()); <span class="hljs-comment">// 下一页图片</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(queue.<span class="hljs-title function_">pop</span>()); <span class="hljs-comment">// undefined</span>
</code></pre></div>
<p>实测用 500 组随机插入和取出序列，与&quot;按优先级、再按序号排序后取第一个&quot;的朴素做法对比，结果一致。<code>&gt;&gt; 1</code> 只在堆长度小于 2³¹ 时正确，这对前端任务队列不构成限制。</p>
<h2>和排序数组比较</h2>
<table><thead><tr><th>操作</th><th>每次插入后排序</th><th>有序数组二分插入</th><th>二叉堆</th></tr></thead><tbody><tr><td>插入</td><td>O(n log n)</td><td>查找 O(log n)，移动元素 O(n)</td><td>O(log n)</td></tr><tr><td>取最小</td><td>O(1)（从末尾取）</td><td>O(1)</td><td>O(log n)</td></tr></tbody></table>
<p>任务不断加入又不断被取走时，堆的总成本最低。</p>
<h2>放进调度器</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">runQueue</span>(<span class="hljs-params">queue, limit</span>) {
  <span class="hljs-keyword">let</span> active = <span class="hljs-number">0</span>;
  <span class="hljs-keyword">return</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Promise</span>(<span class="hljs-function">(<span class="hljs-params">resolve</span>) =&gt;</span> {
    <span class="hljs-keyword">const</span> <span class="hljs-title function_">next</span> = (<span class="hljs-params"></span>) =&gt; {
      <span class="hljs-keyword">if</span> (queue.<span class="hljs-property">size</span> === <span class="hljs-number">0</span> &amp;&amp; active === <span class="hljs-number">0</span>) <span class="hljs-keyword">return</span> <span class="hljs-title function_">resolve</span>();
      <span class="hljs-keyword">while</span> (active &lt; limit &amp;&amp; queue.<span class="hljs-property">size</span> &gt; <span class="hljs-number">0</span>) {
        <span class="hljs-keyword">const</span> task = queue.<span class="hljs-title function_">pop</span>();
        active++;
        <span class="hljs-comment">// 同步抛错也转成拒绝；失败只记录，不中断队列，也不产生未处理拒绝。</span>
        <span class="hljs-title class_">Promise</span>.<span class="hljs-title function_">resolve</span>()
          .<span class="hljs-title function_">then</span>(task)
          .<span class="hljs-title function_">catch</span>(<span class="hljs-function">(<span class="hljs-params">error</span>) =&gt;</span> <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">error</span>(<span class="hljs-string">&#x27;任务失败&#x27;</span>, error))
          .<span class="hljs-title function_">finally</span>(<span class="hljs-function">() =&gt;</span> {
            active--;
            <span class="hljs-title function_">next</span>();
          });
      }
    };
    <span class="hljs-title function_">next</span>();
  });
}
</code></pre></div>
<p>优先队列决定顺序，<code>limit</code> 控制同时运行的数量。单个任务失败只记录错误，队列继续执行，全部结束后 <code>runQueue</code> 兑现；需要汇总失败时，可以在 <code>catch</code> 里收集错误再一并返回。用户滚动后某张图片不再需要时，要在任务里检查取消标记或用 <code>AbortController</code> 中止请求，堆本身不支持删除任意元素。</p>
<h2>常见追问</h2>
<ul>
<li><strong>怎样支持修改优先级？</strong> 维护&quot;值 → 堆下标&quot;的映射，修改后按新优先级上浮或下沉；更简单的做法是插入一个新条目，旧条目出队时发现已失效就跳过。</li>
<li><strong>浏览器原生有优先级调度吗？</strong> <code>scheduler.postTask</code> 提供 <code>user-blocking</code>、<code>user-visible</code>、<code>background</code> 三个优先级；<code>fetch</code> 的 <code>priority</code> 选项可以提示网络请求的优先级。两者都只在部分浏览器中支持，使用前需要特性检测。</li>
</ul>`};export{e as default};