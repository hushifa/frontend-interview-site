var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>题目是：给一个数组和一个目标值，找出和等于目标值的两个数的下标。最直接的做法是两层循环，把每一对数都加一遍，n 个数要比较大约 n²/2 次，是 O(n²)。</p>
<p>换个角度想：遍历到数字 <code>x</code> 时，我需要的另一个数一定是 <code>target - x</code>。只要能很快知道“之前有没有见过 <code>target - x</code>”，一次遍历就能找到答案。Map 正好能做到，查找和插入平均都是常数时间。所以边遍历边把“数字 → 下标”存进 Map，每一步先查差值，查到就返回，没查到就把当前数存进去。</p>
<p>这样时间降到 O(n)，代价是 Map 要额外占 O(n) 的空间，这叫用空间换时间。很多算法题都是这个思路：把“在前面找某个东西”从一次遍历变成一次查表。</p>
<p>要注意，必须先查再存。如果先把当前数存进去再查，遇到 <code>target</code> 正好是当前数两倍的情况，比如 <code>[3]</code> 找 6，会把同一个元素用两次。</p>
</blockquote>
<h2>代码实现</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">twoSum</span>(<span class="hljs-params">nums, target</span>) {
  <span class="hljs-keyword">const</span> seen = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Map</span>();
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">let</span> i = <span class="hljs-number">0</span>; i &lt; nums.<span class="hljs-property">length</span>; i++) {
    <span class="hljs-keyword">const</span> need = target - nums[i];
    <span class="hljs-keyword">if</span> (seen.<span class="hljs-title function_">has</span>(need)) <span class="hljs-keyword">return</span> [seen.<span class="hljs-title function_">get</span>(need), i];
    seen.<span class="hljs-title function_">set</span>(nums[i], i);
  }
  <span class="hljs-keyword">return</span> <span class="hljs-literal">null</span>;
}

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">twoSum</span>([<span class="hljs-number">2</span>, <span class="hljs-number">7</span>, <span class="hljs-number">11</span>, <span class="hljs-number">15</span>], <span class="hljs-number">9</span>).<span class="hljs-title function_">join</span>()); <span class="hljs-comment">// 0,1</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">twoSum</span>([<span class="hljs-number">3</span>, <span class="hljs-number">2</span>, <span class="hljs-number">4</span>], <span class="hljs-number">6</span>).<span class="hljs-title function_">join</span>()); <span class="hljs-comment">// 1,2</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">twoSum</span>([<span class="hljs-number">3</span>, <span class="hljs-number">3</span>], <span class="hljs-number">6</span>).<span class="hljs-title function_">join</span>()); <span class="hljs-comment">// 0,1</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">twoSum</span>([<span class="hljs-number">1</span>, <span class="hljs-number">2</span>], <span class="hljs-number">10</span>)); <span class="hljs-comment">// null</span>
</code></pre></div>
<p>第二个例子 <code>[3, 2, 4]</code> 找 6，为什么不是 <code>0,0</code>？遍历到下标 0 的 3 时，需要另一个 3，可 Map 还是空的，查不到，于是存进 <code>3 → 0</code>。之后遇到 2，需要 4，没有；存进 <code>2 → 1</code>。遇到 4，需要 2，查到下标 1，返回 <code>[1, 2]</code>。因为先查后存，下标 0 的 3 永远不会和自己配对。</p>
<p>第三个例子 <code>[3, 3]</code> 能找到 <code>0,1</code>，说明重复值也能处理：第一个 3 存进去，第二个 3 来查时正好找到它。</p>
<h2>为什么用 Map 而不是普通对象</h2>
<p>普通对象的键会被转成字符串，数字 <code>1</code> 和字符串 <code>&#x27;1&#x27;</code> 会被当成同一个键，还可能和原型上的属性名冲突，比如 <code>&#x27;constructor&#x27;</code>。Map 的键可以是任何值，按 SameValueZero 规则比较，也没有原型属性干扰。只需要判断“有没有出现过”时，用 Set 就够了。</p>
<h2>常见追问</h2>
<p><strong>如果数组是有序的，有没有不用额外空间的做法？</strong></p>
<blockquote>
<p>有，用左右双指针。左指针从头、右指针从尾，两数之和小于目标就左指针右移，大于目标就右指针左移，相等就找到了。时间 O(n)，空间 O(1)。</p>
</blockquote>
<p><strong>哈希表还能解哪些常见题？</strong></p>
<blockquote>
<p>判断字符串是不是字母异位词，就是统计每个字符出现的次数再比较；找数组里第一个不重复的元素、统计出现频率最高的元素，也都是先用 Map 计数。</p>
</blockquote>`};export{e as default};