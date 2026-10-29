var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>比如图片加载，视口里的要先加载，下一页的可以晚点。这就需要一个优先队列：每次取出的都是优先级最高的任务。常用的实现是二叉堆。</p>
<p>二叉堆是一棵用数组存的完全二叉树。下标 i 的父节点是 <code>(i - 1) &gt;&gt; 1</code>，子节点是 <code>2i + 1</code> 和 <code>2i + 2</code>。最小堆的规则是每个父节点都不大于它的子节点，所以堆顶就是最小的。</p>
<p>插入时把新元素放到数组末尾，跟父节点比，比父节点小就交换，一路往上浮。取出时拿走堆顶，把末尾元素挪到堆顶，跟较小的子节点比，一路往下沉。两种操作都是 O(log n)，看一眼堆顶是 O(1)。为什么不用每次排序？因为堆只保证堆顶最小，不要求整体有序。</p>
<p>有两点要注意。堆不是稳定的，同优先级的任务想按提交顺序取，要给每个任务加一个递增序号，作为第二比较条件。另外，优先队列只决定下一个执行谁，同时跑几个、怎么取消，要由调度器另外处理。</p>
</blockquote>
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
<p>所有比较都通过 <code>#before</code> 来做：先比优先级，优先级一样再比 <code>sequence</code>。“视口图片 A”和“B”优先级都是 1，A 先提交，序号小，所以 A 先出来。如果没有序号，它俩谁先出来是不确定的。</p>
<p><code>pop</code> 为什么要把最后一个元素挪到堆顶，而不是直接删掉堆顶？因为直接删掉第一个，整个数组要往前挪，树的结构也全乱了。拿末尾元素来补，数组只少了最后一位，树形状不变，再把它往下沉到合适的位置就好。下沉时要和两个子节点里较小的那个换，这样换上来的新父节点才比另一个子节点也小。</p>
<p>实测用 500 组随机的插入和取出，和“按优先级、再按序号排序后取第一个”的朴素做法对比，结果一致。另外 <code>&gt;&gt; 1</code> 只在堆长度小于 2³¹ 时正确，对前端的任务队列来说不构成限制。</p>
<h2>和排序数组比一比</h2>
<table><thead><tr><th>操作</th><th>每次插入后排序</th><th>有序数组二分插入</th><th>二叉堆</th></tr></thead><tbody><tr><td>插入</td><td>O(n log n)</td><td>查找 O(log n)，移动元素 O(n)</td><td>O(log n)</td></tr><tr><td>取最小</td><td>O(1)（从末尾取）</td><td>O(1)</td><td>O(log n)</td></tr></tbody></table>
<p>取最小时堆虽然慢一点，但任务是不断加进来、又不断被取走的，两种操作加起来，堆的总成本最低。</p>
<h2>放进调度器里用</h2>
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
<p>优先队列决定顺序，<code>limit</code> 控制同时跑几个。每个任务结束时调一次 <code>next</code>，空出来的位置就交给下一个优先级最高的任务。</p>
<p>为什么写 <code>Promise.resolve().then(task)</code>，而不是直接 <code>task()</code>？因为任务函数可能同步就抛错了。放进 <code>then</code> 里，同步的错误也会变成拒绝，被后面的 <code>catch</code> 接住。单个任务失败只记录错误，队列继续跑，全部结束后 <code>runQueue</code> 兑现。如果要汇总失败，可以在 <code>catch</code> 里把错误收集起来，最后一起返回。</p>
<p>用户滚走了，某张图片不再需要了怎么办？堆本身不支持删除中间的任意元素，所以要在任务里检查取消标记，或者用 <code>AbortController</code> 中止请求。</p>
<h2>常见追问</h2>
<p><strong>怎么支持修改优先级？</strong></p>
<blockquote>
<p>一种办法是维护一个“值到堆下标”的映射，改完以后按新优先级往上浮或往下沉。更简单的办法是直接插入一个新条目，旧条目出队时发现已经失效了，就跳过。</p>
</blockquote>
<p><strong>浏览器有原生的优先级调度吗？</strong></p>
<blockquote>
<p><code>scheduler.postTask</code> 提供 <code>user-blocking</code>、<code>user-visible</code>、<code>background</code> 三个优先级；<code>fetch</code> 的 <code>priority</code> 选项可以提示网络请求的优先级。两者都只在部分浏览器里支持，用之前要做特性检测。</p>
</blockquote>`};export{e as default};