var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>V8 把堆分成新生代和老生代，依据是“分代假说”：大多数对象刚分配不久就变得不可达了。新对象先分配在新生代，活得久的才搬进老生代，两边用不同的回收器。</p>
<p>新生代由 Scavenger（副垃圾回收器）回收。新生代分成两半，一半用来分配，另一半一直空着。回收时把活着的对象复制到空的那一半，再交换两半的角色。因为活下来的对象很少，复制的成本只和存活对象的数量有关，和分配了多少无关。已经活过一次回收的对象，再活一次就晋升到老生代。</p>
<p>老生代由主垃圾回收器（Mark-Compact）负责，它回收整个堆：先标记可达对象，再把死对象留下的空隙记进空闲列表，这是清除；对碎片多的页，把活对象复制到别的页，这是整理。整理要复制对象，代价高，所以只对一部分页做。</p>
<p>要注意两点。Scavenge 只扫新生代，老生代指向新生代的引用靠写屏障记录下来当作根。另外 V8 用并行、增量、并发三种方式缩短主线程的停顿，短命对象对垃圾回收来说很便宜。</p>
</blockquote>
<h2>为什么要分代</h2>
<p>可达性和标记清除的基本思路见<a href="/questions/js-garbage-collection/">《垃圾回收为什么无法自动解决所有内存泄漏？》</a>，这里讲 V8 怎样把它落到不同区域。</p>
<p>V8 的博客把“分代假说”概括为：大多数对象死得早，分配后几乎立刻就变得不可达，而且这一点对大多数动态语言都成立。如果每次回收都扫一遍整个堆，就会为那些早就没用的临时对象反复付出代价。</p>
<p>所以 V8 把堆分成代。新生代内部还分成 nursery 和 intermediate 两个子代：对象先分配到 nursery，活过一次回收后变成 intermediate，再活过一次就搬进老生代。新对象最可能变成垃圾，就让专门的回收器频繁地只回收新生代。</p>
<h2>Scavenge 怎样回收新生代</h2>
<p>新生代采用 semi-space（半空间）设计，总空间的一半始终空着。回收时，空着的那一半叫 To-Space，正在用的叫 From-Space。</p>
<p>Scavenger 的根除了调用栈和全局对象，还有老生代指向新生代的引用。它从这些根出发，把可达的活对象复制到 To-Space，整齐地挨在一起，死对象留下的空隙就全部消失了。复制完交换两半的角色，之后新分配从新的 From-Space 下一个空闲地址开始。每个被搬走的对象会留下转发地址，用来把指向旧位置的指针改到新位置。标记、搬移、更新指针这三步是交错进行的。</p>
<p>只靠来回复制，新生代很快就会装满。所以活过第二次回收的对象不再复制进 To-Space，而是晋升到老生代。</p>
<p>下面的模拟只演示“复制存活对象、第二次存活就晋升”这条规则，不代表 V8 的真实数据结构。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">createHeap</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">return</span> { <span class="hljs-attr">fromSpace</span>: [], <span class="hljs-attr">old</span>: [] };
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">allocate</span>(<span class="hljs-params">heap, name, refs = []</span>) {
  <span class="hljs-keyword">const</span> obj = { name, refs, <span class="hljs-attr">survived</span>: <span class="hljs-number">0</span> };
  heap.<span class="hljs-property">fromSpace</span>.<span class="hljs-title function_">push</span>(obj);
  <span class="hljs-keyword">return</span> obj;
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">scavenge</span>(<span class="hljs-params">heap, roots</span>) {
  <span class="hljs-keyword">const</span> toSpace = [];
  <span class="hljs-keyword">const</span> seen = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Set</span>();
  <span class="hljs-keyword">const</span> stack = [...roots];
  <span class="hljs-keyword">while</span> (stack.<span class="hljs-property">length</span> &gt; <span class="hljs-number">0</span>) {
    <span class="hljs-keyword">const</span> obj = stack.<span class="hljs-title function_">pop</span>();
    <span class="hljs-keyword">if</span> (seen.<span class="hljs-title function_">has</span>(obj) || heap.<span class="hljs-property">old</span>.<span class="hljs-title function_">includes</span>(obj)) <span class="hljs-keyword">continue</span>;
    seen.<span class="hljs-title function_">add</span>(obj);
    <span class="hljs-keyword">if</span> (obj.<span class="hljs-property">survived</span> &gt;= <span class="hljs-number">1</span>) {
      heap.<span class="hljs-property">old</span>.<span class="hljs-title function_">push</span>(obj);
    } <span class="hljs-keyword">else</span> {
      obj.<span class="hljs-property">survived</span> += <span class="hljs-number">1</span>;
      toSpace.<span class="hljs-title function_">push</span>(obj);
    }
    stack.<span class="hljs-title function_">push</span>(...obj.<span class="hljs-property">refs</span>);
  }
  heap.<span class="hljs-property">fromSpace</span> = toSpace;
}

<span class="hljs-keyword">const</span> heap = <span class="hljs-title function_">createHeap</span>();
<span class="hljs-keyword">const</span> user = <span class="hljs-title function_">allocate</span>(heap, <span class="hljs-string">&#x27;user&#x27;</span>);
<span class="hljs-title function_">allocate</span>(heap, <span class="hljs-string">&#x27;temp1&#x27;</span>);
<span class="hljs-title function_">allocate</span>(heap, <span class="hljs-string">&#x27;temp2&#x27;</span>);
<span class="hljs-title function_">scavenge</span>(heap, [user]);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(heap.<span class="hljs-property">fromSpace</span>.<span class="hljs-title function_">map</span>(<span class="hljs-function">(<span class="hljs-params">o</span>) =&gt;</span> o.<span class="hljs-property">name</span>).<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;,&#x27;</span>)); <span class="hljs-comment">// user</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(heap.<span class="hljs-property">old</span>.<span class="hljs-property">length</span>); <span class="hljs-comment">// 0</span>

<span class="hljs-title function_">allocate</span>(heap, <span class="hljs-string">&#x27;temp3&#x27;</span>);
<span class="hljs-title function_">scavenge</span>(heap, [user]);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(heap.<span class="hljs-property">fromSpace</span>.<span class="hljs-property">length</span>); <span class="hljs-comment">// 0</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(heap.<span class="hljs-property">old</span>.<span class="hljs-title function_">map</span>(<span class="hljs-function">(<span class="hljs-params">o</span>) =&gt;</span> o.<span class="hljs-property">name</span>).<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;,&#x27;</span>)); <span class="hljs-comment">// user</span>
</code></pre></div>
<p>第一次回收后，<code>temp1</code>、<code>temp2</code> 从根走不到，没有被复制，<code>user</code> 被复制进新的半空间。回收器根本没有逐个处理那两个临时对象，它们随旧的半空间一起被丢弃，这就是成本只和存活对象有关的原因。第二次回收时 <code>user</code> 已经活过一次，所以直接晋升到老生代。</p>
<h2>老生代为什么不也用复制</h2>
<p>复制式回收的弱点是：长寿对象很多时，每次都要复制它们，代价很高。老生代里恰恰都是活得久的对象，所以主垃圾回收器换了做法。</p>
<p>它先标记。V8 用两个标记位给每个对象编码三种颜色：白色是还没发现，灰色是发现了但字段还没处理，黑色是字段都处理完了。没有灰色对象时标记结束，剩下的白色对象不可达。</p>
<p>接着是清除：把死对象留下的连续空隙加入按大小分开的空闲列表，之后分配内存时直接从里面找合适大小的块。</p>
<p>整理只针对一部分页。主垃圾回收器根据碎片情况挑出碎片多的页，把上面的活对象复制到其他页，让零散的小空隙能被重新利用；其余的页只做清除，不复制对象。</p>
<h2>写屏障解决什么问题</h2>
<p>写屏障是 V8 在对象字段写入后插入的一小段代码，用来把引用变化告诉垃圾回收器。它在这里出现在两处。</p>
<p>第一处是 Scavenge。为了不在每次回收新生代时都遍历整个老生代，V8 用写屏障维护一份老生代指向新生代的引用列表，加上调用栈和全局对象，就知道了所有指向新生代的引用。</p>
<p>第二处是增量和并发标记。标记进行时 JavaScript 还在运行，可能把一个白色对象挂到已经标记完的黑色对象上，回收器就会漏掉它。V8 采用 Dijkstra 风格的写屏障：执行 <code>object.field = value</code> 后，如果 <code>object</code> 是黑色、<code>value</code> 是白色，就把 <code>value</code> 标成灰色放进待处理列表。这保证了黑色对象不会指向白色对象，活对象不会被误回收。</p>
<h2>并行、增量、并发有什么区别</h2>
<p>Orinoco 是 V8 垃圾回收项目的代号，目标是减少主线程停顿，用到三种技术。</p>
<p>并行是主线程和辅助线程同时做差不多的垃圾回收工作，JavaScript 仍然暂停，但停顿时间按线程数分摊。增量是主线程每次只做一小段垃圾回收，中间让 JavaScript 运行，总时间不减少，甚至略增，但停顿被拆散，页面能及时响应输入。并发是 JavaScript 在主线程上一直运行，辅助线程在后台做垃圾回收，最难实现，因为堆随时在变，还要处理读写竞争。</p>
<p>V8 现在用并行 Scavenge 回收新生代，多个线程一起搬移对象，用原子操作避免同一个对象被搬两次。主垃圾回收器在堆接近动态计算的上限时开始并发标记；标记完成后主线程短暂暂停做标记收尾，重新扫描根，再和辅助线程一起并行整理、更新指针；清除则并发进行，JavaScript 恢复运行后还能继续。</p>
<h2>常见追问</h2>
<p><strong>分代对写代码有什么启发？</strong></p>
<blockquote>
<p>V8 的博客明确说，因为分代结构，短命对象对垃圾回收来说其实很便宜，回收只为存活下来的对象付出代价。所以不必为了“少创建临时对象”而把代码写得别扭，真正要关心的是别让本该短命的对象被长期引用、拖进老生代。</p>
</blockquote>
<p><strong>能在 JavaScript 里手动触发垃圾回收吗？</strong></p>
<blockquote>
<p>不能。JavaScript 程序不能直接访问垃圾回收器，行为完全由实现决定。V8 提供了让嵌入方触发回收的机制，比如 Chrome 可以在一帧的渲染工作提前做完时，利用剩下的空闲时间执行垃圾回收发出的空闲任务。</p>
</blockquote>`};export{e as default};