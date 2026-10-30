var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>LFU 是“最不经常使用”：每个键记一个使用次数，缓存满了就淘汰次数最少的那个。LeetCode 460 还规定，次数相同时淘汰其中最久没被用过的，而且新插入的键次数从 1 开始，<code>get</code> 和 <code>put</code> 命中都让次数加 1。</p>
<p>难点在 O(1)。如果每次淘汰都去扫一遍找最小次数，就是 O(n)。常用的办法是按次数分组：一个 Map 记每个键的值和次数，另一个 Map 把次数映射到“这个次数下的所有键”，组内按使用先后排好；再用一个变量 <code>minFreq</code> 记住当前最小次数。淘汰时直接去 <code>minFreq</code> 那一组拿最早的键。</p>
<p>每次访问一个键，就把它从次数为 f 的组挪到 f+1 的组。如果 f 那组空了，而 f 正好是 <code>minFreq</code>，<code>minFreq</code> 就加 1。插入新键时 <code>minFreq</code> 直接重置为 1。在 JavaScript 里，组可以用 Set 表示，因为 Set 按插入顺序遍历，取第一个元素就是组里最久没用的。</p>
<p>和 LRU 比，LRU 只看“最近一次什么时候用的”，LFU 看“一共用了多少次”。LFU 更能保住长期热门的数据，但一个键曾经被访问很多次，后来不再用了，它的高次数也会让它一直留在缓存里，这是 LFU 的主要缺点。</p>
</blockquote>
<h2>先看 LRU 和 LFU 淘汰谁</h2>
<p>LRU 的写法见<a href="/questions/alg-map-lru/">《如何利用 Map 实现固定容量的 LRU 缓存？》</a>，它只需要一条按最近使用排序的队列。LFU 要多记一个维度：使用次数。比如容量为 2，先放入 a、b，然后读 a 两次，再读 b 一次，最后放入 c。LRU 会淘汰 a，因为 b 是更近被用到的；LFU 会淘汰 b，因为 a 用了 3 次，b 只用了 2 次。</p>
<p>所以 LFU 需要两层排序：先按次数，次数一样再按最近使用。直接用一个大数组排序做不到 O(1)，下面按次数分组来做。</p>
<h2>用 Map 和 Set 实现</h2>
<p><code>entries</code> 记每个键的值和次数，<code>groups</code> 把次数映射到一个 Set，Set 里按使用先后存放这个次数下的键。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">class</span> <span class="hljs-title class_">LFUCache</span> {
  <span class="hljs-title function_">constructor</span>(<span class="hljs-params">capacity</span>) {
    <span class="hljs-variable language_">this</span>.<span class="hljs-property">capacity</span> = capacity;
    <span class="hljs-variable language_">this</span>.<span class="hljs-property">entries</span> = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Map</span>();
    <span class="hljs-variable language_">this</span>.<span class="hljs-property">groups</span> = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Map</span>();
    <span class="hljs-variable language_">this</span>.<span class="hljs-property">minFreq</span> = <span class="hljs-number">0</span>;
  }

  <span class="hljs-title function_">touch</span>(<span class="hljs-params">key</span>) {
    <span class="hljs-keyword">const</span> entry = <span class="hljs-variable language_">this</span>.<span class="hljs-property">entries</span>.<span class="hljs-title function_">get</span>(key);
    <span class="hljs-keyword">const</span> group = <span class="hljs-variable language_">this</span>.<span class="hljs-property">groups</span>.<span class="hljs-title function_">get</span>(entry.<span class="hljs-property">freq</span>);
    group.<span class="hljs-title function_">delete</span>(key);
    <span class="hljs-keyword">if</span> (group.<span class="hljs-property">size</span> === <span class="hljs-number">0</span>) {
      <span class="hljs-variable language_">this</span>.<span class="hljs-property">groups</span>.<span class="hljs-title function_">delete</span>(entry.<span class="hljs-property">freq</span>);
      <span class="hljs-comment">// 只有最小次数那一组空了，最小次数才会变</span>
      <span class="hljs-keyword">if</span> (<span class="hljs-variable language_">this</span>.<span class="hljs-property">minFreq</span> === entry.<span class="hljs-property">freq</span>) <span class="hljs-variable language_">this</span>.<span class="hljs-property">minFreq</span> += <span class="hljs-number">1</span>;
    }
    entry.<span class="hljs-property">freq</span> += <span class="hljs-number">1</span>;
    <span class="hljs-keyword">if</span> (!<span class="hljs-variable language_">this</span>.<span class="hljs-property">groups</span>.<span class="hljs-title function_">has</span>(entry.<span class="hljs-property">freq</span>)) <span class="hljs-variable language_">this</span>.<span class="hljs-property">groups</span>.<span class="hljs-title function_">set</span>(entry.<span class="hljs-property">freq</span>, <span class="hljs-keyword">new</span> <span class="hljs-title class_">Set</span>());
    <span class="hljs-variable language_">this</span>.<span class="hljs-property">groups</span>.<span class="hljs-title function_">get</span>(entry.<span class="hljs-property">freq</span>).<span class="hljs-title function_">add</span>(key);
  }

  <span class="hljs-title function_">get</span>(<span class="hljs-params">key</span>) {
    <span class="hljs-keyword">if</span> (!<span class="hljs-variable language_">this</span>.<span class="hljs-property">entries</span>.<span class="hljs-title function_">has</span>(key)) <span class="hljs-keyword">return</span> -<span class="hljs-number">1</span>;
    <span class="hljs-variable language_">this</span>.<span class="hljs-title function_">touch</span>(key);
    <span class="hljs-keyword">return</span> <span class="hljs-variable language_">this</span>.<span class="hljs-property">entries</span>.<span class="hljs-title function_">get</span>(key).<span class="hljs-property">value</span>;
  }

  <span class="hljs-title function_">put</span>(<span class="hljs-params">key, value</span>) {
    <span class="hljs-keyword">if</span> (<span class="hljs-variable language_">this</span>.<span class="hljs-property">capacity</span> === <span class="hljs-number">0</span>) <span class="hljs-keyword">return</span>;
    <span class="hljs-keyword">if</span> (<span class="hljs-variable language_">this</span>.<span class="hljs-property">entries</span>.<span class="hljs-title function_">has</span>(key)) {
      <span class="hljs-variable language_">this</span>.<span class="hljs-property">entries</span>.<span class="hljs-title function_">get</span>(key).<span class="hljs-property">value</span> = value;
      <span class="hljs-variable language_">this</span>.<span class="hljs-title function_">touch</span>(key);
      <span class="hljs-keyword">return</span>;
    }
    <span class="hljs-keyword">if</span> (<span class="hljs-variable language_">this</span>.<span class="hljs-property">entries</span>.<span class="hljs-property">size</span> === <span class="hljs-variable language_">this</span>.<span class="hljs-property">capacity</span>) {
      <span class="hljs-keyword">const</span> group = <span class="hljs-variable language_">this</span>.<span class="hljs-property">groups</span>.<span class="hljs-title function_">get</span>(<span class="hljs-variable language_">this</span>.<span class="hljs-property">minFreq</span>);
      <span class="hljs-comment">// Set 按插入顺序遍历，第一个就是这组里最久没用的</span>
      <span class="hljs-keyword">const</span> oldest = group.<span class="hljs-title function_">values</span>().<span class="hljs-title function_">next</span>().<span class="hljs-property">value</span>;
      group.<span class="hljs-title function_">delete</span>(oldest);
      <span class="hljs-keyword">if</span> (group.<span class="hljs-property">size</span> === <span class="hljs-number">0</span>) <span class="hljs-variable language_">this</span>.<span class="hljs-property">groups</span>.<span class="hljs-title function_">delete</span>(<span class="hljs-variable language_">this</span>.<span class="hljs-property">minFreq</span>);
      <span class="hljs-variable language_">this</span>.<span class="hljs-property">entries</span>.<span class="hljs-title function_">delete</span>(oldest);
    }
    <span class="hljs-variable language_">this</span>.<span class="hljs-property">entries</span>.<span class="hljs-title function_">set</span>(key, { value, <span class="hljs-attr">freq</span>: <span class="hljs-number">1</span> });
    <span class="hljs-keyword">if</span> (!<span class="hljs-variable language_">this</span>.<span class="hljs-property">groups</span>.<span class="hljs-title function_">has</span>(<span class="hljs-number">1</span>)) <span class="hljs-variable language_">this</span>.<span class="hljs-property">groups</span>.<span class="hljs-title function_">set</span>(<span class="hljs-number">1</span>, <span class="hljs-keyword">new</span> <span class="hljs-title class_">Set</span>());
    <span class="hljs-variable language_">this</span>.<span class="hljs-property">groups</span>.<span class="hljs-title function_">get</span>(<span class="hljs-number">1</span>).<span class="hljs-title function_">add</span>(key);
    <span class="hljs-variable language_">this</span>.<span class="hljs-property">minFreq</span> = <span class="hljs-number">1</span>;
  }
}

<span class="hljs-keyword">const</span> cache = <span class="hljs-keyword">new</span> <span class="hljs-title class_">LFUCache</span>(<span class="hljs-number">2</span>);
cache.<span class="hljs-title function_">put</span>(<span class="hljs-number">1</span>, <span class="hljs-number">1</span>);
cache.<span class="hljs-title function_">put</span>(<span class="hljs-number">2</span>, <span class="hljs-number">2</span>);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(cache.<span class="hljs-title function_">get</span>(<span class="hljs-number">1</span>)); <span class="hljs-comment">// 1</span>
cache.<span class="hljs-title function_">put</span>(<span class="hljs-number">3</span>, <span class="hljs-number">3</span>);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(cache.<span class="hljs-title function_">get</span>(<span class="hljs-number">2</span>)); <span class="hljs-comment">// -1</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(cache.<span class="hljs-title function_">get</span>(<span class="hljs-number">3</span>)); <span class="hljs-comment">// 3</span>
cache.<span class="hljs-title function_">put</span>(<span class="hljs-number">4</span>, <span class="hljs-number">4</span>);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(cache.<span class="hljs-title function_">get</span>(<span class="hljs-number">1</span>)); <span class="hljs-comment">// -1</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(cache.<span class="hljs-title function_">get</span>(<span class="hljs-number">3</span>)); <span class="hljs-comment">// 3</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(cache.<span class="hljs-title function_">get</span>(<span class="hljs-number">4</span>)); <span class="hljs-comment">// 4</span>
</code></pre></div>
<p>这组操作就是 LeetCode 460 的示例 1。放入 3 时，键 1 被读过一次，次数是 2，键 2 次数是 1，所以淘汰 2。放入 4 时，1 和 3 的次数都是 2，打平了，就看谁更久没用：3 刚被读过，1 更早，所以淘汰 1。</p>
<p><code>minFreq</code> 为什么只在两处改？插入新键时，新键次数是 1，不可能有比它更小的，所以直接设成 1。访问已有的键时，键从 f 挪到 f+1，最小次数只可能在 f 那组被挪空、且 f 就是最小次数时变化，而且一定是变成 f+1，因为刚挪过去的键就在那里。淘汰发生在插入之前，淘汰后紧接着就把 <code>minFreq</code> 设成 1，所以淘汰时也不用重新找最小值。</p>
<p>为什么挪到新组时要先 <code>delete</code> 再 <code>add</code>？因为 Set 对已有元素再 <code>add</code> 不会改变它的位置。每次都放进一个新组的末尾，组内的顺序才能代表“最近一次使用的先后”。</p>
<h2>复杂度</h2>
<p>每个操作只做了常数次 Map 和 Set 的增删查。MDN 说明，规范只要求 Map 和 Set 的平均访问时间比线性快；按哈希表实现时平均是常数时间，所以面试里通常把这个写法算作题目要求的“平均 O(1)”。空间是 O(capacity)。</p>
<p>如果面试官要求不用 Set 的顺序特性，可以把每个组换成一条双向链表，再用一个 Map 从键找到链表节点，挪动时改几个指针，思路完全一样。</p>
<h2>常见追问</h2>
<p><strong>capacity 为 0 时要注意什么？</strong></p>
<blockquote>
<p>这时什么都放不进去。如果不提前返回，<code>put</code> 会去 <code>minFreq</code> 那组淘汰元素，可是缓存是空的，那一组根本不存在，就会报错。所以 <code>put</code> 开头先判断容量为 0 直接返回。</p>
</blockquote>
<p><strong>LFU 的“缓存污染”是什么意思？怎么缓解？</strong></p>
<blockquote>
<p>某个键在一段时间里被访问了很多次，次数很高，后来不再被访问，可它的次数比新来的数据都高，就一直淘汰不掉。常见的缓解办法是让次数随时间衰减，或者给次数设上限。这些都是在 LeetCode 460 的规则之外做的改动。</p>
</blockquote>
<p><strong>为什么更新已有键的值也要让次数加 1？</strong></p>
<blockquote>
<p>这是 LeetCode 460 题面的规定：键被 <code>get</code> 或 <code>put</code> 操作到，使用次数都加 1。实际业务里可以按需要定义，但面试按题面实现。</p>
</blockquote>`};export{e as default};