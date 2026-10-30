var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>两个单链表从某个节点开始共用后面的部分，就像两条小路汇进同一条大路，汇合的那个节点就是相交节点。题目要返回它，不相交就返回 <code>null</code>，而且不能改动链表的结构。</p>
<p>最好记的做法是双指针换头。指针 <code>a</code> 从 A 的头出发，<code>b</code> 从 B 的头出发，每次各走一步；<code>a</code> 走到尾就跳到 B 的头，<code>b</code> 走到尾就跳到 A 的头。两个指针第一次相等时，指向的就是相交节点。</p>
<p>它一定会相遇，是因为两个指针走的路程被拉平了。设 A 独有部分长 x，B 独有部分长 y，公共部分长 z。<code>a</code> 走完 x + z 再走 y 到达交点，<code>b</code> 走完 y + z 再走 x 也到达交点，两者都走了 x + y + z 步。不相交时 z 是 0，两个指针都走 m + n 步后同时变成 <code>null</code>，循环也会结束。</p>
<p>这个做法时间 O(m + n)，额外空间 O(1)，正好满足题目的进阶要求。要注意，判断相交比的是节点引用，不是节点的值，值相同的两个节点不一定是同一个节点。</p>
</blockquote>
<h2>先看代码</h2>
<p><code>getIntersectionNode</code> 只有一个循环，关键是走到 <code>null</code> 后换到另一个链表的头。<code>build</code> 用来把数组建成链表，第二个参数是接在后面的公共部分。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">build</span>(<span class="hljs-params">values, tail = <span class="hljs-literal">null</span></span>) {
  <span class="hljs-keyword">let</span> head = tail;
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">let</span> i = values.<span class="hljs-property">length</span> - <span class="hljs-number">1</span>; i &gt;= <span class="hljs-number">0</span>; i -= <span class="hljs-number">1</span>) {
    head = { <span class="hljs-attr">value</span>: values[i], <span class="hljs-attr">next</span>: head };
  }
  <span class="hljs-keyword">return</span> head;
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">getIntersectionNode</span>(<span class="hljs-params">headA, headB</span>) {
  <span class="hljs-keyword">let</span> a = headA;
  <span class="hljs-keyword">let</span> b = headB;
  <span class="hljs-keyword">while</span> (a !== b) {
    a = a ? a.<span class="hljs-property">next</span> : headB;
    b = b ? b.<span class="hljs-property">next</span> : headA;
  }
  <span class="hljs-keyword">return</span> a;
}

<span class="hljs-keyword">const</span> common = <span class="hljs-title function_">build</span>([<span class="hljs-number">8</span>, <span class="hljs-number">4</span>, <span class="hljs-number">5</span>]);
<span class="hljs-keyword">const</span> listA = <span class="hljs-title function_">build</span>([<span class="hljs-number">4</span>, <span class="hljs-number">1</span>], common);
<span class="hljs-keyword">const</span> listB = <span class="hljs-title function_">build</span>([<span class="hljs-number">5</span>, <span class="hljs-number">6</span>, <span class="hljs-number">1</span>], common);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">getIntersectionNode</span>(listA, listB).<span class="hljs-property">value</span>); <span class="hljs-comment">// 8</span>

<span class="hljs-keyword">const</span> shared = <span class="hljs-title function_">build</span>([<span class="hljs-number">2</span>, <span class="hljs-number">4</span>]);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">getIntersectionNode</span>(<span class="hljs-title function_">build</span>([<span class="hljs-number">1</span>, <span class="hljs-number">9</span>, <span class="hljs-number">1</span>], shared), <span class="hljs-title function_">build</span>([<span class="hljs-number">3</span>], shared)).<span class="hljs-property">value</span>); <span class="hljs-comment">// 2</span>

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">String</span>(<span class="hljs-title function_">getIntersectionNode</span>(<span class="hljs-title function_">build</span>([<span class="hljs-number">2</span>, <span class="hljs-number">6</span>, <span class="hljs-number">4</span>]), <span class="hljs-title function_">build</span>([<span class="hljs-number">1</span>, <span class="hljs-number">5</span>])))); <span class="hljs-comment">// null</span>
</code></pre></div>
<p>前两组对应 LeetCode 的示例 1 和示例 2，第三组是示例 3 的不相交情况。示例 1 里 A 和 B 都有值为 1 的节点，但它们是两个不同的对象，所以交点不是 1，而是值为 8 的那个共用节点。题目也特别说明了这一点，所以循环条件用的是 <code>a !== b</code>，比较引用。</p>
<h2>为什么换头以后一定会相遇</h2>
<p>两个链表长度不同，同时出发的指针不会同时到达交点。换头的作用就是让两个指针补上对方多出来的那段路。</p>
<p>用示例 1 算一下。A 独有部分 <code>4 → 1</code> 长 2，B 独有部分 <code>5 → 6 → 1</code> 长 3，公共部分 <code>8 → 4 → 5</code> 长 3。指针 <code>a</code> 先走完 A 的 5 个节点，跳到 B 的头，再走 3 步到达 8，一共走了 2 + 3 + 3 = 8 步。指针 <code>b</code> 走完 B 的 6 个节点，跳到 A 的头，再走 2 步到达 8，一共是 3 + 3 + 2 = 8 步。步数相同，所以它们在 8 这里同时到达。</p>
<p>不相交时公共部分长度是 0。示例 3 里 A 长 3、B 长 2，两个指针都走 5 步后同时停在 <code>null</code>，<code>null === null</code> 成立，循环结束并返回 <code>null</code>。所以不需要额外判断不相交的情况，也不会死循环。</p>
<p>要注意代码里是“走到 <code>null</code> 再换头”，不是“走到最后一个节点就换头”。<code>null</code> 被当作一步，正是它保证了不相交时两个指针能同时到达 <code>null</code>。如果跳过 <code>null</code> 直接换头，不相交时两个指针永远不会相等。</p>
<h2>其他做法</h2>
<p>用 <code>Set</code> 也能做：先把 A 的所有节点放进 <code>Set</code>，再遍历 B，第一个出现在 <code>Set</code> 里的节点就是交点。思路直接，但要 O(m) 的额外空间。</p>
<p>还可以先求两个链表的长度，让长的那个先走长度差那么多步，再一起走，第一次相等就是交点。它也是 O(1) 空间，本质上和换头一样，都是把两个指针对齐到离交点相同距离的位置。</p>
<p>同样用双指针处理链表的题，还有找环的入口，见<a href="/questions/ds-linked-list-cycle/">《环形链表怎样找到入环点？为什么相遇后从头再走就能找到？》</a>。</p>
<h2>常见追问</h2>
<p><strong>如果链表里有环，这个方法还能用吗？</strong></p>
<blockquote>
<p>题目保证整个链表结构里没有环，所以不用考虑。如果有环，指针可能一直在环里绕，换头的步数计算也不再成立，要先用快慢指针判环再分情况处理。</p>
</blockquote>
<p><strong>为什么不能修改链表来做标记？</strong></p>
<blockquote>
<p>题目要求函数返回后链表保持原来的结构。比如把走过的节点的 <code>next</code> 改掉做标记，虽然能找到交点，但破坏了输入，也会影响共用这两个链表的其他代码。</p>
</blockquote>
<p><strong>两个链表在交点之后还会分开吗？</strong></p>
<blockquote>
<p>不会。单链表每个节点只有一个 <code>next</code>，两个链表从交点开始，后面的节点都是同一批，所以相交的形状一定是 Y 形，不会是 X 形。</p>
</blockquote>`};export{e as default};