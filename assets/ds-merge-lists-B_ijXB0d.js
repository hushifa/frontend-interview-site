var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>合并两个有序链表，就是把 <code>[1,2,4]</code> 和 <code>[1,3,4]</code> 拼成 <code>[1,1,2,3,4,4]</code>，而且要复用原来的节点。做法像两队人按身高合并成一队：每次比较两队排头，矮的先出列接到结果后面，某一队走完了，就把另一队剩下的整个接上。</p>
<p>删除倒数第 N 个节点，难在单向链表不知道总长度。用两个指针，快指针先走 N 步，然后两个一起走，快指针走到最后一个节点时，慢指针正好停在要删节点的前一个，把它的 <code>next</code> 跳过去就行，只遍历一遍。</p>
<p>两题都会在头节点前放一个不存数据的节点，叫哨兵节点或虚拟头节点。合并时结果链表一开始是空的，删除时要删的可能就是头节点，有了哨兵，这些情况都变成“改某个节点的 <code>next</code>”，不用单独判断。最后返回 <code>dummy.next</code>。</p>
<p>要注意，合并是 O(m + n) 时间、O(1) 额外空间。删除时快指针走 N 步的起点要从哨兵算起，否则删头节点时会差一步；题目保证 N 不超过链表长度，不保证时要先检查快指针有没有走到 <code>null</code>。</p>
</blockquote>
<h2>两题的写法</h2>
<p>先看 <code>mergeTwoLists</code> 里 <code>tail</code> 怎样往后接，再看 <code>removeNthFromEnd</code> 里快指针先走了几步。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">fromArray</span>(<span class="hljs-params">values</span>) {
  <span class="hljs-keyword">let</span> head = <span class="hljs-literal">null</span>;
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">let</span> i = values.<span class="hljs-property">length</span> - <span class="hljs-number">1</span>; i &gt;= <span class="hljs-number">0</span>; i--) head = { <span class="hljs-attr">val</span>: values[i], <span class="hljs-attr">next</span>: head };
  <span class="hljs-keyword">return</span> head;
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">toArray</span>(<span class="hljs-params">head</span>) {
  <span class="hljs-keyword">const</span> values = [];
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">let</span> node = head; node; node = node.<span class="hljs-property">next</span>) values.<span class="hljs-title function_">push</span>(node.<span class="hljs-property">val</span>);
  <span class="hljs-keyword">return</span> <span class="hljs-title class_">JSON</span>.<span class="hljs-title function_">stringify</span>(values);
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">mergeTwoLists</span>(<span class="hljs-params">a, b</span>) {
  <span class="hljs-keyword">const</span> dummy = { <span class="hljs-attr">val</span>: <span class="hljs-number">0</span>, <span class="hljs-attr">next</span>: <span class="hljs-literal">null</span> };
  <span class="hljs-keyword">let</span> tail = dummy;
  <span class="hljs-keyword">while</span> (a &amp;&amp; b) {
    <span class="hljs-keyword">if</span> (a.<span class="hljs-property">val</span> &lt;= b.<span class="hljs-property">val</span>) {
      tail.<span class="hljs-property">next</span> = a;
      a = a.<span class="hljs-property">next</span>;
    } <span class="hljs-keyword">else</span> {
      tail.<span class="hljs-property">next</span> = b;
      b = b.<span class="hljs-property">next</span>;
    }
    tail = tail.<span class="hljs-property">next</span>;
  }
  tail.<span class="hljs-property">next</span> = a ?? b;
  <span class="hljs-keyword">return</span> dummy.<span class="hljs-property">next</span>;
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">removeNthFromEnd</span>(<span class="hljs-params">head, n</span>) {
  <span class="hljs-keyword">const</span> dummy = { <span class="hljs-attr">val</span>: <span class="hljs-number">0</span>, <span class="hljs-attr">next</span>: head };
  <span class="hljs-keyword">let</span> fast = dummy;
  <span class="hljs-keyword">let</span> slow = dummy;
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">let</span> i = <span class="hljs-number">0</span>; i &lt; n; i++) fast = fast.<span class="hljs-property">next</span>;
  <span class="hljs-keyword">while</span> (fast.<span class="hljs-property">next</span>) {
    fast = fast.<span class="hljs-property">next</span>;
    slow = slow.<span class="hljs-property">next</span>;
  }
  slow.<span class="hljs-property">next</span> = slow.<span class="hljs-property">next</span>.<span class="hljs-property">next</span>;
  <span class="hljs-keyword">return</span> dummy.<span class="hljs-property">next</span>;
}

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">toArray</span>(<span class="hljs-title function_">mergeTwoLists</span>(<span class="hljs-title function_">fromArray</span>([<span class="hljs-number">1</span>, <span class="hljs-number">2</span>, <span class="hljs-number">4</span>]), <span class="hljs-title function_">fromArray</span>([<span class="hljs-number">1</span>, <span class="hljs-number">3</span>, <span class="hljs-number">4</span>])))); <span class="hljs-comment">// [1,1,2,3,4,4]</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">toArray</span>(<span class="hljs-title function_">mergeTwoLists</span>(<span class="hljs-title function_">fromArray</span>([]), <span class="hljs-title function_">fromArray</span>([])))); <span class="hljs-comment">// []</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">toArray</span>(<span class="hljs-title function_">mergeTwoLists</span>(<span class="hljs-title function_">fromArray</span>([]), <span class="hljs-title function_">fromArray</span>([<span class="hljs-number">0</span>])))); <span class="hljs-comment">// [0]</span>

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">toArray</span>(<span class="hljs-title function_">removeNthFromEnd</span>(<span class="hljs-title function_">fromArray</span>([<span class="hljs-number">1</span>, <span class="hljs-number">2</span>, <span class="hljs-number">3</span>, <span class="hljs-number">4</span>, <span class="hljs-number">5</span>]), <span class="hljs-number">2</span>))); <span class="hljs-comment">// [1,2,3,5]</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">toArray</span>(<span class="hljs-title function_">removeNthFromEnd</span>(<span class="hljs-title function_">fromArray</span>([<span class="hljs-number">1</span>]), <span class="hljs-number">1</span>))); <span class="hljs-comment">// []</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">toArray</span>(<span class="hljs-title function_">removeNthFromEnd</span>(<span class="hljs-title function_">fromArray</span>([<span class="hljs-number">1</span>, <span class="hljs-number">2</span>]), <span class="hljs-number">1</span>))); <span class="hljs-comment">// [1]</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">toArray</span>(<span class="hljs-title function_">removeNthFromEnd</span>(<span class="hljs-title function_">fromArray</span>([<span class="hljs-number">1</span>, <span class="hljs-number">2</span>]), <span class="hljs-number">2</span>))); <span class="hljs-comment">// [2]</span>
</code></pre></div>
<p>合并时为什么最后一行直接接上剩下的链表？循环结束说明有一条已经走完，另一条剩下的部分本身有序，而且都不小于已经接上的节点，所以整段接过去就行，不用再一个个比较。比较用的是 <code>&lt;=</code>，值相等时先取 <code>a</code> 的节点，两条链表里相等的值保持原来的先后。</p>
<p>删除时快慢指针之间始终隔 N 步。快指针停在最后一个节点（<code>fast.next</code> 为 <code>null</code>）时，慢指针后面正好还有 N 个节点，下一个就是倒数第 N 个。最后一个例子删的是倒数第 2 个，也就是头节点，这时快指针走两步就到了尾部，慢指针还停在哨兵上，<code>dummy.next</code> 改成指向 2。没有哨兵的话，这种情况就得单独写 <code>return head.next</code>。</p>
<h2>哨兵节点还能用在哪</h2>
<p>凡是“头节点可能变”的链表操作都可以先放一个哨兵：删除所有值等于某个数的节点、分隔链表、在有序链表里插入。代价只是多建一个对象，换来的是不再写 <code>if (!head)</code>、<code>if (要删的是头)</code> 这类分支。</p>
<h2>常见追问</h2>
<p><strong>合并两个有序链表能用递归写吗？</strong></p>
<blockquote>
<p>能。比较两个头，较小的那个的 <code>next</code> 等于“它剩下的部分和另一条链表合并的结果”，任一条为空就返回另一条。代码更短，但递归深度等于两条链表的总长度，链表很长时可能栈溢出，迭代写法只要 O(1) 额外空间。</p>
</blockquote>
<p><strong>合并 K 个有序链表怎么做？</strong></p>
<blockquote>
<p>把每条链表的头放进最小堆，每次取出最小的接到结果后面，再把它的下一个节点放进堆，时间 O(N log k)，N 是节点总数。最小堆的写法见<a href="/questions/alg-priority-queue/">《前端任务怎样按优先级排队？二叉堆为什么不需要每次完整排序？》</a>。也可以两两合并，像归并排序那样分治。</p>
</blockquote>
<p><strong>不用快慢指针，先求长度再删可以吗？</strong></p>
<blockquote>
<p>可以。先遍历一遍求出长度 L，再从哨兵走 L − N 步，就停在要删节点的前一个。时间同样 O(L)，只是遍历了两遍，题目的进阶要求是一遍完成，所以面试一般期待快慢指针。</p>
</blockquote>`};export{e as default};