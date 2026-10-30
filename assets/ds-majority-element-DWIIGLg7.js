var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>LeetCode 169 给一个长度为 n 的数组，找出出现次数超过 ⌊n/2⌋ 的元素，并保证它一定存在。比如 <code>[2,2,1,1,1,2,2]</code> 的答案是 2。</p>
<p>最直接的做法是用 Map 数每个数出现几次，O(n) 时间但要 O(n) 空间。也可以排序，多数元素超过一半，排好后一定会占据中间位置，取 <code>nums[Math.floor(n / 2)]</code> 就行，复杂度是排序的 O(n log n)。题目的进阶要求是 O(n) 时间、O(1) 空间，这就要用摩尔投票。</p>
<p>摩尔投票只维护一个候选值和一个计数。遍历时，计数为 0 就把当前数设为候选；当前数和候选相同，计数加 1，不同就减 1。可以理解成每次拿两个不同的数互相抵消，多数元素的个数比其他所有数加起来还多，所以抵消到最后剩下的一定是它。</p>
<p>要注意，摩尔投票只在多数元素一定存在时直接成立。如果题目不保证存在，比如 <code>[1,2,3]</code>，它也会留下一个候选，这时必须再遍历一遍，数一下候选是否真的超过一半。</p>
</blockquote>
<h2>摩尔投票</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">majorityElement</span>(<span class="hljs-params">nums</span>) {
  <span class="hljs-keyword">let</span> candidate = <span class="hljs-literal">null</span>;
  <span class="hljs-keyword">let</span> count = <span class="hljs-number">0</span>;
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> num <span class="hljs-keyword">of</span> nums) {
    <span class="hljs-keyword">if</span> (count === <span class="hljs-number">0</span>) candidate = num;
    count += num === candidate ? <span class="hljs-number">1</span> : -<span class="hljs-number">1</span>;
  }
  <span class="hljs-keyword">return</span> candidate;
}

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">majorityElement</span>([<span class="hljs-number">3</span>, <span class="hljs-number">2</span>, <span class="hljs-number">3</span>])); <span class="hljs-comment">// 3</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">majorityElement</span>([<span class="hljs-number">2</span>, <span class="hljs-number">2</span>, <span class="hljs-number">1</span>, <span class="hljs-number">1</span>, <span class="hljs-number">1</span>, <span class="hljs-number">2</span>, <span class="hljs-number">2</span>])); <span class="hljs-comment">// 2</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">majorityElement</span>([<span class="hljs-number">1</span>, <span class="hljs-number">2</span>, <span class="hljs-number">3</span>])); <span class="hljs-comment">// 3</span>
</code></pre></div>
<p>前两组是 LeetCode 169 的示例。第三组没有多数元素，函数照样返回了 3，它只是最后剩下的候选，所以不保证存在时不能直接用这个结果。</p>
<p>拿 <code>[2,2,1,1,1,2,2]</code> 走一遍：前两个 2 让计数到 2，接着三个 1 把计数减到 0 后又让 1 当上候选，计数是 1；后面两个 2 先把计数减到 0，再让 2 重新当上候选。最后候选是 2。</p>
<p>为什么中途换了候选也不会出错？计数归零时，前面那一段里候选和非候选正好一样多，等于两两抵消掉了。多数元素在这一段里最多占一半，所以在剩下的部分里它仍然超过一半。对剩下的部分继续投票，结论不变。</p>
<h2>不保证存在时怎样验证</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">findMajority</span>(<span class="hljs-params">nums</span>) {
  <span class="hljs-keyword">let</span> candidate = <span class="hljs-literal">null</span>;
  <span class="hljs-keyword">let</span> count = <span class="hljs-number">0</span>;
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> num <span class="hljs-keyword">of</span> nums) {
    <span class="hljs-keyword">if</span> (count === <span class="hljs-number">0</span>) candidate = num;
    count += num === candidate ? <span class="hljs-number">1</span> : -<span class="hljs-number">1</span>;
  }
  <span class="hljs-comment">// 第二遍数一下，确认候选真的超过一半</span>
  <span class="hljs-keyword">const</span> times = nums.<span class="hljs-title function_">filter</span>(<span class="hljs-function">(<span class="hljs-params">num</span>) =&gt;</span> num === candidate).<span class="hljs-property">length</span>;
  <span class="hljs-keyword">return</span> times &gt; <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">floor</span>(nums.<span class="hljs-property">length</span> / <span class="hljs-number">2</span>) ? candidate : <span class="hljs-string">&#x27;none&#x27;</span>;
}

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">findMajority</span>([<span class="hljs-number">1</span>, <span class="hljs-number">2</span>, <span class="hljs-number">3</span>])); <span class="hljs-comment">// none</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">findMajority</span>([<span class="hljs-number">1</span>, <span class="hljs-number">1</span>, <span class="hljs-number">2</span>])); <span class="hljs-comment">// 1</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">findMajority</span>([<span class="hljs-number">1</span>, <span class="hljs-number">2</span>, <span class="hljs-number">1</span>, <span class="hljs-number">2</span>])); <span class="hljs-comment">// none</span>
</code></pre></div>
<p><code>[1,2,1,2]</code> 里 1 和 2 各出现 2 次，都没有超过 ⌊4/2⌋ = 2，所以没有多数元素。“超过一半”是严格大于，正好一半不算。验证多遍历了一次，时间仍然是 O(n)，空间仍是 O(1)。</p>
<h2>常见追问</h2>
<p><strong>找出所有出现次数超过 ⌊n/3⌋ 的元素怎么做？</strong></p>
<blockquote>
<p>这是 LeetCode 229。超过三分之一的元素最多只有两个，所以同时维护两个候选和两个计数：和某个候选相同就给它加 1；某个计数为 0 就让当前数当候选；都不是就两个计数同时减 1，相当于三个不同的数一起抵消。最后必须再数一遍，确认两个候选是否真的超过 ⌊n/3⌋。</p>
</blockquote>
<p><strong>排序取中间为什么一定对？</strong></p>
<blockquote>
<p>多数元素超过一半，排好序后它是一段连续的区间，长度超过 n/2。不管这段从哪里开始，都会盖住下标 <code>Math.floor(n / 2)</code> 这个位置。注意 JavaScript 的 <code>sort</code> 默认按字符串比较，数字要传 <code>(a, b) =&gt; a - b</code>。</p>
</blockquote>`};export{e as default};