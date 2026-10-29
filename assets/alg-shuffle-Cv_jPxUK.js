var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>抽奖页要把候选人顺序打乱，很多人会写 <code>arr.sort(() =&gt; Math.random() - 0.5)</code>，看起来每次都不一样，但这样打乱并不均匀，有的顺序出现得多，有的出现得少。</p>
<p>原因是 <code>sort</code> 要求比较函数是一致的：同样两个元素，每次比较结果要相同，<code>a</code> 小于 <code>b</code> 时 <code>b</code> 就要大于 <code>a</code>。随机的比较函数每次都给出不同答案，违反了这个要求，MDN 说这种比较函数没法可靠地排序。排序算法拿到前后矛盾的比较结果，最后的排列会偏向某些顺序，而且具体怎么偏，取决于引擎用的是哪种排序算法。</p>
<p>正确的做法是 Fisher-Yates 洗牌。从数组最后一位开始往前走，每到一个位置 <code>i</code>，就在 <code>0</code> 到 <code>i</code> 之间随机选一个下标 <code>j</code>，交换 <code>i</code> 和 <code>j</code> 两个位置。这样每个元素落到每个位置的机会都一样，所有排列出现的概率相同，而且只遍历一遍，是 O(n)。</p>
<p>要注意，<code>Math.random()</code> 生成的随机数不能用于安全相关的场景。真正涉及奖金、安全的抽奖，应该在服务端做，或者在浏览器里用 <code>crypto.getRandomValues()</code>。</p>
</blockquote>
<h2>Fisher-Yates 洗牌</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">shuffle</span>(<span class="hljs-params">items</span>) {
  <span class="hljs-keyword">const</span> result = [...items];
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">let</span> i = result.<span class="hljs-property">length</span> - <span class="hljs-number">1</span>; i &gt; <span class="hljs-number">0</span>; i--) {
    <span class="hljs-keyword">const</span> j = <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">floor</span>(<span class="hljs-title class_">Math</span>.<span class="hljs-title function_">random</span>() * (i + <span class="hljs-number">1</span>));
    [result[i], result[j]] = [result[j], result[i]];
  }
  <span class="hljs-keyword">return</span> result;
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">countOrders</span>(<span class="hljs-params">shuffleFn, times</span>) {
  <span class="hljs-keyword">const</span> counts = {};
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">let</span> k = <span class="hljs-number">0</span>; k &lt; times; k++) {
    <span class="hljs-keyword">const</span> key = <span class="hljs-title function_">shuffleFn</span>([<span class="hljs-string">&#x27;a&#x27;</span>, <span class="hljs-string">&#x27;b&#x27;</span>, <span class="hljs-string">&#x27;c&#x27;</span>]).<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;&#x27;</span>);
    counts[key] = (counts[key] ?? <span class="hljs-number">0</span>) + <span class="hljs-number">1</span>;
  }
  <span class="hljs-keyword">return</span> counts;
}

<span class="hljs-keyword">const</span> fair = <span class="hljs-title function_">countOrders</span>(shuffle, <span class="hljs-number">60000</span>);
<span class="hljs-keyword">const</span> biased = <span class="hljs-title function_">countOrders</span>(<span class="hljs-function">(<span class="hljs-params">arr</span>) =&gt;</span> [...arr].<span class="hljs-title function_">sort</span>(<span class="hljs-function">() =&gt;</span> <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">random</span>() - <span class="hljs-number">0.5</span>), <span class="hljs-number">60000</span>);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">Object</span>.<span class="hljs-title function_">keys</span>(fair).<span class="hljs-property">length</span>); <span class="hljs-comment">// 6</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">Object</span>.<span class="hljs-title function_">values</span>(fair).<span class="hljs-title function_">every</span>(<span class="hljs-function">(<span class="hljs-params">n</span>) =&gt;</span> n &gt; <span class="hljs-number">9000</span> &amp;&amp; n &lt; <span class="hljs-number">11000</span>)); <span class="hljs-comment">// true</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">Object</span>.<span class="hljs-title function_">values</span>(biased).<span class="hljs-title function_">every</span>(<span class="hljs-function">(<span class="hljs-params">n</span>) =&gt;</span> n &gt; <span class="hljs-number">9000</span> &amp;&amp; n &lt; <span class="hljs-number">11000</span>)); <span class="hljs-comment">// false</span>
</code></pre></div>
<p><code>a、b、c</code> 三个元素一共有 6 种排列，打乱 60000 次，理想情况下每种大约出现 10000 次。<code>shuffle</code> 的结果每种都落在 9000 到 11000 之间。随机比较的 <code>sort</code> 却不是：在 Node 22 里实测，<code>abc</code> 约 22500 次、<code>cba</code> 约 18800 次、<code>bac</code> 约 7500 次，<code>acb</code>、<code>bca</code>、<code>cab</code> 各只有约 3700 次，最多和最少差了 6 倍，原本的顺序 <code>abc</code> 出现得最多。</p>
<p>为什么 <code>j</code> 的范围是 <code>0</code> 到 <code>i</code>，包含 <code>i</code> 自己？因为当前元素也可能留在原地，不包含的话，每个元素都被迫离开原位，有些排列就永远不会出现。为什么从后往前？每一轮确定位置 <code>i</code> 上的元素，<code>i</code> 后面的位置都已经定好了，只在前面没处理过的元素里选，每个元素被选中的机会才相等。</p>
<p>这里先复制了一份 <code>result</code>，不修改传入的数组。需要原地打乱时，直接在原数组上交换即可。</p>
<h2>为什么随机比较函数会偏</h2>
<p><code>sort</code> 的结果依赖比较函数，规范对比较函数的要求包括：相同的输入总是返回相同的结果；<code>compare(a, b)</code> 和 <code>compare(b, a)</code> 的符号相反。MDN 举例说，只返回 <code>1</code> 和 <code>0</code>、或只返回 <code>0</code> 和 <code>-1</code> 的比较函数破坏了反对称性，没法可靠地排序。随机比较函数连“同样输入同样结果”都做不到。</p>
<p>排序算法会假设比较结果可信，比如“已经确认 a 在 b 前面，就不用再比了”。有了矛盾的结果，有的元素被比较的次数多，有的少，留在原位或被交换的概率就不一样。不同引擎、不同数组长度用的排序策略不同，偏差的方向也不同，没法通过调参修正。</p>
<h2>常见追问</h2>
<p><strong>怎样随机抽取 k 个不重复的元素？</strong></p>
<blockquote>
<p>只做 Fisher-Yates 的前 k 轮，然后取最后 k 个位置的元素，不需要把整个数组都打乱，时间是 O(k)。</p>
</blockquote>
<p><strong>需要安全的随机数时怎样生成 0 到 n-1 的整数？</strong></p>
<blockquote>
<p>用 <code>crypto.getRandomValues(new Uint32Array(1))[0]</code> 拿到一个随机整数。直接对 n 取余会有轻微偏差，因为 2^32 不一定能被 n 整除；严格的做法是丢弃落在最后不完整区间里的值重新取。</p>
</blockquote>`};export{e as default};