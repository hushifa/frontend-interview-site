var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>链表是一串节点，每个节点存一个值和一个指向下一个节点的 <code>next</code>。它和数组不同，不能按下标直接访问第几个，只能从头一个个往后走；可是在已知节点后面插入或删除，只要改指针，不用像数组那样挪动后面的元素。</p>
<p>反转链表就是让每个节点的 <code>next</code> 改为指向它前面的节点。遍历时用三个变量：<code>prev</code> 是已经反转好的部分的头，<code>current</code> 是当前节点，<code>next</code> 先把下一个节点记下来，免得改了指针以后找不到后面的节点。每一步把 <code>current.next</code> 指向 <code>prev</code>，然后三个指针一起往后挪。走完以后 <code>prev</code> 就是新的头。</p>
<p>判断有没有环用快慢指针。两个指针都从头出发，慢的每次走一步，快的每次走两步。没有环时快指针会先走到 <code>null</code>；有环时两个指针最终都会进入环里一直转，快指针每轮比慢指针多走一步，迟早追上，所以两者相遇就说明有环。</p>
<p>要注意，用一个 Set 记录走过的节点也能判断有环，写法更直观，但要 O(n) 的额外空间，面试中常被追问能不能做到 O(1)，答案就是快慢指针。</p>
</blockquote>
<h2>代码实现</h2>
<p>先用数组构造一个链表，再反转并检查有没有环：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">fromArray</span>(<span class="hljs-params">values</span>) {
  <span class="hljs-keyword">let</span> head = <span class="hljs-literal">null</span>;
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">let</span> i = values.<span class="hljs-property">length</span> - <span class="hljs-number">1</span>; i &gt;= <span class="hljs-number">0</span>; i--) {
    head = { <span class="hljs-attr">value</span>: values[i], <span class="hljs-attr">next</span>: head };
  }
  <span class="hljs-keyword">return</span> head;
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">toArray</span>(<span class="hljs-params">head</span>) {
  <span class="hljs-keyword">const</span> values = [];
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">let</span> node = head; node; node = node.<span class="hljs-property">next</span>) values.<span class="hljs-title function_">push</span>(node.<span class="hljs-property">value</span>);
  <span class="hljs-keyword">return</span> values;
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">reverse</span>(<span class="hljs-params">head</span>) {
  <span class="hljs-keyword">let</span> prev = <span class="hljs-literal">null</span>;
  <span class="hljs-keyword">let</span> current = head;
  <span class="hljs-keyword">while</span> (current) {
    <span class="hljs-keyword">const</span> next = current.<span class="hljs-property">next</span>;
    current.<span class="hljs-property">next</span> = prev;
    prev = current;
    current = next;
  }
  <span class="hljs-keyword">return</span> prev;
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">hasCycle</span>(<span class="hljs-params">head</span>) {
  <span class="hljs-keyword">let</span> slow = head;
  <span class="hljs-keyword">let</span> fast = head;
  <span class="hljs-keyword">while</span> (fast &amp;&amp; fast.<span class="hljs-property">next</span>) {
    slow = slow.<span class="hljs-property">next</span>;
    fast = fast.<span class="hljs-property">next</span>.<span class="hljs-property">next</span>;
    <span class="hljs-keyword">if</span> (slow === fast) <span class="hljs-keyword">return</span> <span class="hljs-literal">true</span>;
  }
  <span class="hljs-keyword">return</span> <span class="hljs-literal">false</span>;
}

<span class="hljs-keyword">const</span> list = <span class="hljs-title function_">fromArray</span>([<span class="hljs-number">1</span>, <span class="hljs-number">2</span>, <span class="hljs-number">3</span>, <span class="hljs-number">4</span>]);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">toArray</span>(<span class="hljs-title function_">reverse</span>(list)).<span class="hljs-title function_">join</span>()); <span class="hljs-comment">// 4,3,2,1</span>

<span class="hljs-keyword">const</span> cyclic = <span class="hljs-title function_">fromArray</span>([<span class="hljs-number">1</span>, <span class="hljs-number">2</span>, <span class="hljs-number">3</span>]);
cyclic.<span class="hljs-property">next</span>.<span class="hljs-property">next</span>.<span class="hljs-property">next</span> = cyclic.<span class="hljs-property">next</span>; <span class="hljs-comment">// 3 指回 2，形成环</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">hasCycle</span>(cyclic)); <span class="hljs-comment">// true</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">hasCycle</span>(<span class="hljs-title function_">fromArray</span>([<span class="hljs-number">1</span>, <span class="hljs-number">2</span>, <span class="hljs-number">3</span>]))); <span class="hljs-comment">// false</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">reverse</span>(<span class="hljs-literal">null</span>)); <span class="hljs-comment">// null</span>
</code></pre></div>
<p><code>reverse</code> 里为什么要先存 <code>next</code>？因为下一行 <code>current.next = prev</code> 会把指向后面的指针改掉，如果没提前存起来，就再也找不到后面的节点，链表就断了。</p>
<p><code>hasCycle</code> 的循环条件为什么是 <code>fast &amp;&amp; fast.next</code>？快指针一次要走两步，必须保证它和它的下一个都存在，否则 <code>fast.next.next</code> 会读 <code>null</code> 的属性而报错。空链表和只有一个节点的链表也被这个条件直接处理了，返回 <code>false</code>。</p>
<h2>前端哪里会用到链表</h2>
<p>React 的 Fiber 节点就用 <code>child</code>、<code>sibling</code>、<code>return</code> 指针连起来，遍历组件树时不用递归，见<a href="/questions/react-virtual-dom-fiber/">《React 的虚拟 DOM 和 diff 是怎样工作的？Fiber 解决了什么问题？》</a>。LRU 缓存的经典实现是哈希表加双向链表，JS 里用 Map 的插入顺序可以代替，见<a href="/questions/alg-map-lru/">《如何利用 Map 实现固定容量的 LRU 缓存？》</a>。</p>
<h2>常见追问</h2>
<p><strong>怎样找到环的入口？</strong></p>
<blockquote>
<p>快慢指针相遇后，把其中一个放回链表头，然后两个指针都改成每次走一步，再次相遇的节点就是环的入口。原因是从头到入口的距离，等于从相遇点继续走到入口的距离加上若干整圈。</p>
</blockquote>
<p><strong>怎样找链表的中间节点？</strong></p>
<blockquote>
<p>同样用快慢指针，快指针走两步、慢指针走一步，快指针走到末尾时，慢指针正好在中间。</p>
</blockquote>
<p><strong>递归能反转链表吗？</strong></p>
<blockquote>
<p>能。先递归反转 <code>head.next</code> 之后的部分，再让 <code>head.next.next = head</code>、<code>head.next = null</code>。写法短，但链表很长时递归层数太多可能栈溢出，循环写法更稳妥。</p>
</blockquote>`};export{e as default};