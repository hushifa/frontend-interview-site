var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>环形链表就是链表尾部的 <code>next</code> 没有指向 <code>null</code>，而是指回了前面某个节点，一直往后走永远走不完。题目要返回环开始的那个节点，也就是入环点，没有环就返回 <code>null</code>，而且不能修改链表。</p>
<p>做法分两步。第一步用快慢指针判环：慢指针每次走一步，快指针每次走两步，有环时快指针进了环就在里面绕，每走一轮都比慢指针多走一步，迟早追上。第二步，相遇后把一个指针放回头节点，两个指针都改成每次走一步，再次相遇的节点就是入环点。</p>
<p>第二步成立是因为一个等式。设头到入环点距离为 a，入环点到相遇点为 b，环长为 c。快指针走的路是慢指针的两倍，推出 a 等于相遇点再往前走 c − b 步回到入环点，再加上若干整圈。所以两个指针同速走 a 步，正好在入环点碰头。</p>
<p>这样只要 O(n) 时间和 O(1) 额外空间。用 Set 记录走过的节点也能做，第一个重复出现的节点就是入环点，但要 O(n) 额外空间。要注意循环条件写 <code>fast &amp;&amp; fast.next</code>，比较的是节点引用，不是节点的值。</p>
</blockquote>
<h2>先判环，再找入环点</h2>
<p><code>detectCycle</code> 前半段就是判环，后半段把 <code>slow</code> 放回头节点。看第二个循环里两个指针都只走一步。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">fromArray</span>(<span class="hljs-params">values, pos</span>) {
  <span class="hljs-keyword">const</span> nodes = values.<span class="hljs-title function_">map</span>(<span class="hljs-function">(<span class="hljs-params">value</span>) =&gt;</span> ({ value, <span class="hljs-attr">next</span>: <span class="hljs-literal">null</span> }));
  nodes.<span class="hljs-title function_">forEach</span>(<span class="hljs-function">(<span class="hljs-params">node, i</span>) =&gt;</span> (node.<span class="hljs-property">next</span> = nodes[i + <span class="hljs-number">1</span>] ?? <span class="hljs-literal">null</span>));
  <span class="hljs-comment">// pos 和 LeetCode 一样表示尾节点连回的下标，-1 表示无环</span>
  <span class="hljs-keyword">if</span> (pos &gt;= <span class="hljs-number">0</span>) nodes[nodes.<span class="hljs-property">length</span> - <span class="hljs-number">1</span>].<span class="hljs-property">next</span> = nodes[pos];
  <span class="hljs-keyword">return</span> nodes[<span class="hljs-number">0</span>] ?? <span class="hljs-literal">null</span>;
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">detectCycle</span>(<span class="hljs-params">head</span>) {
  <span class="hljs-keyword">let</span> slow = head;
  <span class="hljs-keyword">let</span> fast = head;
  <span class="hljs-keyword">while</span> (fast &amp;&amp; fast.<span class="hljs-property">next</span>) {
    slow = slow.<span class="hljs-property">next</span>;
    fast = fast.<span class="hljs-property">next</span>.<span class="hljs-property">next</span>;
    <span class="hljs-keyword">if</span> (slow === fast) {
      slow = head;
      <span class="hljs-keyword">while</span> (slow !== fast) {
        slow = slow.<span class="hljs-property">next</span>;
        fast = fast.<span class="hljs-property">next</span>;
      }
      <span class="hljs-keyword">return</span> slow;
    }
  }
  <span class="hljs-keyword">return</span> <span class="hljs-literal">null</span>;
}

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">detectCycle</span>(<span class="hljs-title function_">fromArray</span>([<span class="hljs-number">3</span>, <span class="hljs-number">2</span>, <span class="hljs-number">0</span>, -<span class="hljs-number">4</span>], <span class="hljs-number">1</span>)).<span class="hljs-property">value</span>); <span class="hljs-comment">// 2</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">detectCycle</span>(<span class="hljs-title function_">fromArray</span>([<span class="hljs-number">1</span>, <span class="hljs-number">2</span>], <span class="hljs-number">0</span>)).<span class="hljs-property">value</span>); <span class="hljs-comment">// 1</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">detectCycle</span>(<span class="hljs-title function_">fromArray</span>([<span class="hljs-number">1</span>], -<span class="hljs-number">1</span>))); <span class="hljs-comment">// null</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">detectCycle</span>(<span class="hljs-title function_">fromArray</span>([], -<span class="hljs-number">1</span>))); <span class="hljs-comment">// null</span>

<span class="hljs-keyword">const</span> sameValues = <span class="hljs-title function_">fromArray</span>([<span class="hljs-number">7</span>, <span class="hljs-number">7</span>, <span class="hljs-number">7</span>, <span class="hljs-number">7</span>], <span class="hljs-number">2</span>);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">detectCycle</span>(sameValues) === sameValues.<span class="hljs-property">next</span>.<span class="hljs-property">next</span>); <span class="hljs-comment">// true</span>
</code></pre></div>
<p>第一个例子里尾节点 -4 连回下标 1，所以入环点是值为 2 的节点。最后一个例子所有节点的值都是 7，看值分不出是哪个节点，所以用 <code>===</code> 比较返回的引用是不是第三个节点。</p>
<p>为什么一定会相遇，快指针不会跳过慢指针吗？两个指针都进环以后，每走一轮，快指针和慢指针之间的距离就缩短 1。距离一步步减到 0，中间不会跳过，所以必然相遇。而且慢指针进环后走不满一圈就会被追上，因为快指针追它最多要追一圈的距离。</p>
<h2>为什么相遇后从头走能到入环点</h2>
<p>设头节点到入环点要走 a 步，入环点到相遇点要走 b 步，环一共 c 个节点。相遇时慢指针走了 a + b 步。快指针在环里多绕了 k 圈（k ≥ 1），走了 a + b + kc 步。快指针的步数是慢指针的两倍：</p>
<div class="not-prose code-block"><div class="code-language">text</div><pre><code class="hljs language-text">2(a + b) = a + b + kc
a + b = kc
a = kc - b = (k - 1)c + (c - b)
</code></pre></div>
<p>最后一行要这样读：从相遇点再往前走 c − b 步，正好回到入环点；再多绕 k − 1 圈，还是停在入环点。所以一个指针从头走 a 步到达入环点时，另一个从相遇点同样走 a 步，也恰好在入环点。两者第一次相同的位置就是入环点，因为在此之前一个还在环外，另一个在环里，不可能重合。</p>
<p><code>a = 0</code> 的情况也成立，比如第二个例子尾节点连回头节点，相遇后 <code>slow</code> 回到头，它本来就是入环点，第二个循环一次都不执行。</p>
<h2>常见追问</h2>
<p><strong>用 Set 做有什么不同？</strong></p>
<blockquote>
<p>一路往后走，把每个节点放进 Set，第一次碰到已经在 Set 里的节点就是入环点，走到 <code>null</code> 就说明无环。写法更直白，时间也是 O(n)，但额外空间是 O(n)。Set 按引用区分对象，所以值重复的节点不会误判。</p>
</blockquote>
<p><strong>怎么求环的长度？</strong></p>
<blockquote>
<p>快慢指针相遇后，让其中一个继续走，同时计数，再回到相遇点时走过的步数就是环长 c。</p>
</blockquote>
<p><strong>只判断有没有环怎么写？</strong></p>
<blockquote>
<p>只保留 <code>detectCycle</code> 的第一个循环，<code>slow === fast</code> 时返回 <code>true</code>，循环结束返回 <code>false</code>。</p>
</blockquote>`};export{e as default};