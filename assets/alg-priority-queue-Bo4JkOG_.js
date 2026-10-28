var e={answerHtml:`<h2>简答</h2>
<ul>
<li>二叉堆是用数组表示的完全二叉树，堆顶是优先级最高的元素。</li>
<li>插入时向上调整，取出时把最后一个元素移到堆顶再向下调整，都是 O(log n)。</li>
<li>不需要每次都完整排序，查看堆顶是 O(1)。</li>
<li>堆本身不稳定，同优先级需要先进先出时，可以额外记录递增序号作为次级比较键。</li>
</ul>
<p>图片预加载队列同时收到“当前视口图片”和“下一页图片”。FIFO 只看进入顺序，可能让用户正需要的任务排在许多预取任务后面；每插入一次就重新排序整个数组又会做很多重复工作。优先队列希望随时取出当前最重要的一项，二叉堆是常见实现。</p>
<p>这里规定数值越小越优先，同优先级按提交顺序取出。优先级只决定等待任务的选择，不会抢占已经执行的 JavaScript 或自动取消网络请求。</p>
<h2>堆只保持局部次序</h2>
<p>最小堆要求每个父节点不大于它的孩子，根节点因此是全局最小值；兄弟节点之间不要求排序。数组索引 i 的孩子位于 2i+1 与 2i+2，父节点位于 floor((i-1)/2)。</p>
<p>插入先放到数组末尾，与父节点比较并向上交换；取出根节点后，用末尾节点补到根部，再与更小的孩子交换直到恢复约束。每次只沿树高移动，不需要重新整理所有节点。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">class</span> <span class="hljs-title class_">PriorityQueue</span> {
  #heap = [];
  #sequence = <span class="hljs-number">0</span>;

  <span class="hljs-keyword">get</span> <span class="hljs-title function_">size</span>() { <span class="hljs-keyword">return</span> <span class="hljs-variable language_">this</span>.#heap.<span class="hljs-property">length</span>; }

  #<span class="hljs-title function_">before</span>(<span class="hljs-params">a, b</span>) {
    <span class="hljs-keyword">return</span> a.<span class="hljs-property">priority</span> &lt; b.<span class="hljs-property">priority</span> ||
      (a.<span class="hljs-property">priority</span> === b.<span class="hljs-property">priority</span> &amp;&amp; a.<span class="hljs-property">sequence</span> &lt; b.<span class="hljs-property">sequence</span>);
  }

  <span class="hljs-title function_">push</span>(<span class="hljs-params">value, priority</span>) {
    <span class="hljs-keyword">if</span> (!<span class="hljs-title class_">Number</span>.<span class="hljs-built_in">isFinite</span>(priority)) <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">TypeError</span>(<span class="hljs-string">&#x27;优先级必须为有限数值&#x27;</span>);
    <span class="hljs-keyword">if</span> (!<span class="hljs-title class_">Number</span>.<span class="hljs-title function_">isSafeInteger</span>(<span class="hljs-variable language_">this</span>.#sequence)) <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">RangeError</span>(<span class="hljs-string">&#x27;序号已超出安全范围&#x27;</span>);
    <span class="hljs-keyword">const</span> item = { value, priority, <span class="hljs-attr">sequence</span>: <span class="hljs-variable language_">this</span>.#sequence++ };
    <span class="hljs-keyword">const</span> heap = <span class="hljs-variable language_">this</span>.#heap;
    heap.<span class="hljs-title function_">push</span>(item);
    <span class="hljs-keyword">let</span> index = heap.<span class="hljs-property">length</span> - <span class="hljs-number">1</span>;
    <span class="hljs-keyword">while</span> (index &gt; <span class="hljs-number">0</span>) {
      <span class="hljs-keyword">const</span> parent = <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">floor</span>((index - <span class="hljs-number">1</span>) / <span class="hljs-number">2</span>);
      <span class="hljs-keyword">if</span> (!<span class="hljs-variable language_">this</span>.#<span class="hljs-title function_">before</span>(heap[index], heap[parent])) <span class="hljs-keyword">break</span>;
      [heap[index], heap[parent]] = [heap[parent], heap[index]];
      index = parent;
    }
  }

  <span class="hljs-title function_">pop</span>(<span class="hljs-params"></span>) {
    <span class="hljs-keyword">const</span> heap = <span class="hljs-variable language_">this</span>.#heap;
    <span class="hljs-keyword">if</span> (heap.<span class="hljs-property">length</span> === <span class="hljs-number">0</span>) <span class="hljs-keyword">return</span> <span class="hljs-literal">undefined</span>;
    <span class="hljs-keyword">const</span> first = heap[<span class="hljs-number">0</span>];
    <span class="hljs-keyword">const</span> last = heap.<span class="hljs-title function_">pop</span>();
    <span class="hljs-keyword">if</span> (heap.<span class="hljs-property">length</span> &gt; <span class="hljs-number">0</span>) {
      heap[<span class="hljs-number">0</span>] = last;
      <span class="hljs-keyword">let</span> index = <span class="hljs-number">0</span>;
      <span class="hljs-keyword">while</span> (<span class="hljs-literal">true</span>) {
        <span class="hljs-keyword">const</span> left = index * <span class="hljs-number">2</span> + <span class="hljs-number">1</span>;
        <span class="hljs-keyword">if</span> (left &gt;= heap.<span class="hljs-property">length</span>) <span class="hljs-keyword">break</span>;
        <span class="hljs-keyword">const</span> right = left + <span class="hljs-number">1</span>;
        <span class="hljs-keyword">let</span> smaller = left;
        <span class="hljs-keyword">if</span> (right &lt; heap.<span class="hljs-property">length</span> &amp;&amp; <span class="hljs-variable language_">this</span>.#<span class="hljs-title function_">before</span>(heap[right], heap[left])) smaller = right;
        <span class="hljs-keyword">if</span> (!<span class="hljs-variable language_">this</span>.#<span class="hljs-title function_">before</span>(heap[smaller], heap[index])) <span class="hljs-keyword">break</span>;
        [heap[index], heap[smaller]] = [heap[smaller], heap[index]];
        index = smaller;
      }
    }
    <span class="hljs-keyword">return</span> { <span class="hljs-attr">value</span>: first.<span class="hljs-property">value</span>, <span class="hljs-attr">priority</span>: first.<span class="hljs-property">priority</span> };
  }
}

<span class="hljs-keyword">const</span> queue = <span class="hljs-keyword">new</span> <span class="hljs-title class_">PriorityQueue</span>();
queue.<span class="hljs-title function_">push</span>(<span class="hljs-string">&#x27;下一页图片&#x27;</span>, <span class="hljs-number">5</span>);
queue.<span class="hljs-title function_">push</span>(<span class="hljs-string">&#x27;视口图片 A&#x27;</span>, <span class="hljs-number">1</span>);
queue.<span class="hljs-title function_">push</span>(<span class="hljs-string">&#x27;视口图片 B&#x27;</span>, <span class="hljs-number">1</span>);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(queue.<span class="hljs-title function_">pop</span>().<span class="hljs-property">value</span>); <span class="hljs-comment">// 视口图片 A</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(queue.<span class="hljs-title function_">pop</span>().<span class="hljs-property">value</span>); <span class="hljs-comment">// 视口图片 B</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(queue.<span class="hljs-title function_">pop</span>().<span class="hljs-property">value</span>); <span class="hljs-comment">// 下一页图片</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(queue.<span class="hljs-title function_">pop</span>()); <span class="hljs-comment">// undefined</span>
</code></pre></div>
<p>pop 返回包装对象，所以即使 value 本身是 undefined，也能与空队列返回 undefined 区分。sequence 是独立的插入序号：只比较 priority 的堆不保证同优先级稳定顺序。</p>
<h2>为什么下沉要选更小的孩子</h2>
<p>根被较大的末尾值替换后，必须让两个孩子中更小的那个上来。若随便选左孩子，而右孩子更小，交换后的父节点仍会违反堆序。边界还包括只有左孩子、队列原来只有一个元素以及空队列；示例逐一处理，而不是假定节点总有两个孩子。</p>
<p>在常见数组访问模型下，push 和 pop 沿树高移动，时间 O(log n)，读取 size 是 O(1)，保存 n 个节点需要 O(n) 空间。若一次性装入大量初始数据，自底向上的建堆可以做到 O(n)，不必反复 push；本例没有实现该批量入口。</p>
<h2>优先级变化不能直接改节点字段</h2>
<p>任务从预取变成可见资源时，可能需要提高优先级。本例不暴露内部节点，避免外部直接改 priority 后破坏堆序。若要支持修改，可以维护任务 ID 到索引的映射，每次交换同步更新，再决定上浮或下沉；另一种方案是插入新版本，弹出时丢弃过期版本，但要控制旧条目堆积。</p>
<p>取消等待任务也需要额外协议。惰性取消可把任务 ID 标记失效，pop 时跳过；大量失效条目需定期整理，不能无限增长。已经运行的 fetch 或 Worker 则通过其自己的取消机制处理，删除堆节点不能撤销已发生的副作用。</p>
<h2>与并发池组合时要避免饥饿</h2>
<p>优先队列只选择下一个任务，执行器另行限制并发数。不要把所有 pop 出来的任务立即 Promise.all，否则优先级只影响启动的瞬间，后续仍会全部占用资源。</p>
<p>高优先级任务源源不断时，低优先级任务可能长期得不到执行。可以按业务设置等待时间提升、不同队列配额或最大延迟。时间老化若影响比较规则，不能让比较器悄悄依赖 Date.now 后期待旧堆自动重新有序，应明确重建或更新策略。</p>
<p>用户可控制优先级时要限制取值与权限，不允许普通任务无限宣称最高优先级。队列还需限制数量、载荷和等待时间，避免内存耗尽。小规模列表直接排序可能更容易维护；频繁插入并取最小任务时，堆才更有价值。</p>
<p>本题为教学实现，不是完整浏览器调度器。浏览器资源优先级、事件循环任务优先级与应用的这个数值队列是不同层次，不能相互等同。</p>`};export{e as default};