var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>在 <code>aaaaaaab</code> 里找 <code>aaab</code>：暴力做法从每个位置开始逐个比，比到第 4 个字符失配，就把起点往后挪一位、模式串从头再比。可前面已经比过的 <code>aaa</code> 明明知道是什么，却全部重比。主串长 n、模式串长 m 时，最坏要比 O(n × m) 次。</p>
<p>KMP 的想法是：失配时，已经匹配上的那一段就是模式串的一个前缀，内容完全已知。如果这段的结尾和模式串的开头有重叠，就可以把模式串直接挪过去，让重叠部分对齐，从重叠之后接着比，主串指针一步也不用回退。</p>
<p>重叠多长，只和模式串有关，所以预先算好一个 <code>next</code> 数组：<code>next[i]</code> 表示模式串前 i + 1 个字符组成的子串里，最长的“相等的真前缀和真后缀”有多长。比如 <code>abab</code> 的真前缀 <code>ab</code> 和真后缀 <code>ab</code> 相等，<code>next[3]</code> 就是 2。算 <code>next</code> 用 O(m)，匹配用 O(n)，总共 O(n + m)。</p>
<p>要注意，<code>next</code> 的定义有好几种写法，有的整体右移一位、首项写 -1，看别人的代码时先确认含义。实际开发里查找子串直接用 <code>indexOf</code> 或 <code>includes</code>，引擎有自己优化过的实现；KMP 的价值在于面试考查对前缀函数的理解，以及它在流式匹配这类主串不能回退的场景里的用法。</p>
</blockquote>
<h2>先算 next 数组</h2>
<p><code>buildNext</code> 里的 <code>length</code> 是“当前已知的最长相等前后缀长度”。看失配时它怎样往回退：不是退到 0，而是退到 <code>next[length - 1]</code>，也就是在更短的前缀里继续找重叠。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">buildNext</span>(<span class="hljs-params">pattern</span>) {
  <span class="hljs-keyword">const</span> next = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Array</span>(pattern.<span class="hljs-property">length</span>).<span class="hljs-title function_">fill</span>(<span class="hljs-number">0</span>);
  <span class="hljs-keyword">let</span> length = <span class="hljs-number">0</span>;
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">let</span> i = <span class="hljs-number">1</span>; i &lt; pattern.<span class="hljs-property">length</span>; i++) {
    <span class="hljs-keyword">while</span> (length &gt; <span class="hljs-number">0</span> &amp;&amp; pattern[i] !== pattern[length]) {
      length = next[length - <span class="hljs-number">1</span>];
    }
    <span class="hljs-keyword">if</span> (pattern[i] === pattern[length]) length++;
    next[i] = length;
  }
  <span class="hljs-keyword">return</span> next;
}

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">JSON</span>.<span class="hljs-title function_">stringify</span>(<span class="hljs-title function_">buildNext</span>(<span class="hljs-string">&#x27;abab&#x27;</span>))); <span class="hljs-comment">// [0,0,1,2]</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">JSON</span>.<span class="hljs-title function_">stringify</span>(<span class="hljs-title function_">buildNext</span>(<span class="hljs-string">&#x27;aabaaab&#x27;</span>))); <span class="hljs-comment">// [0,1,0,1,2,2,3]</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">JSON</span>.<span class="hljs-title function_">stringify</span>(<span class="hljs-title function_">buildNext</span>(<span class="hljs-string">&#x27;aaaa&#x27;</span>))); <span class="hljs-comment">// [0,1,2,3]</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">JSON</span>.<span class="hljs-title function_">stringify</span>(<span class="hljs-title function_">buildNext</span>(<span class="hljs-string">&#x27;abc&#x27;</span>))); <span class="hljs-comment">// [0,0,0]</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">JSON</span>.<span class="hljs-title function_">stringify</span>(<span class="hljs-title function_">buildNext</span>(<span class="hljs-string">&#x27;&#x27;</span>))); <span class="hljs-comment">// []</span>
</code></pre></div>
<p><code>aabaaab</code> 的 <code>next[5]</code> 为什么是 2？前 6 个字符是 <code>aabaaa</code>。到 <code>i = 4</code> 时，<code>aabaa</code> 的最长相等前后缀是 <code>aa</code>，<code>length</code> 是 2；<code>i = 5</code> 的字符 <code>a</code> 要和 <code>pattern[2]</code> 也就是 <code>b</code> 比，不相等，于是 <code>length</code> 退到 <code>next[1]</code> 即 1，再拿 <code>a</code> 和 <code>pattern[1]</code> 的 <code>a</code> 比，相等，<code>length</code> 变成 2。对应的前后缀是 <code>aa</code>。</p>
<p>为什么退到 <code>next[length - 1]</code> 就够了，不会漏掉更长的？当前长度为 <code>length</code> 的前缀和后缀相等，所以“后缀的后缀”就等于“前缀的后缀”。比 <code>length</code> 短、还能对上的候选，只能是这个前缀自己的相等前后缀，最长的一个正是 <code>next[length - 1]</code>。</p>
<p>为什么 <code>i</code> 从 1 开始？真前缀和真后缀不能是整个串本身，单个字符没有真前后缀，所以 <code>next[0]</code> 总是 0。</p>
<h2>用 next 做匹配</h2>
<p>匹配和建表几乎是同一段代码，只是拿主串的字符和模式串比。<code>j</code> 是模式串已经匹配上的长度，等于 m 时就找到一处。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">buildNext</span>(<span class="hljs-params">pattern</span>) {
  <span class="hljs-keyword">const</span> next = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Array</span>(pattern.<span class="hljs-property">length</span>).<span class="hljs-title function_">fill</span>(<span class="hljs-number">0</span>);
  <span class="hljs-keyword">let</span> length = <span class="hljs-number">0</span>;
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">let</span> i = <span class="hljs-number">1</span>; i &lt; pattern.<span class="hljs-property">length</span>; i++) {
    <span class="hljs-keyword">while</span> (length &gt; <span class="hljs-number">0</span> &amp;&amp; pattern[i] !== pattern[length]) length = next[length - <span class="hljs-number">1</span>];
    <span class="hljs-keyword">if</span> (pattern[i] === pattern[length]) length++;
    next[i] = length;
  }
  <span class="hljs-keyword">return</span> next;
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">kmpSearchAll</span>(<span class="hljs-params">text, pattern</span>) {
  <span class="hljs-keyword">if</span> (pattern.<span class="hljs-property">length</span> === <span class="hljs-number">0</span>) <span class="hljs-keyword">return</span> [<span class="hljs-number">0</span>]; <span class="hljs-comment">// 与 indexOf 的约定一致：空串出现在开头</span>
  <span class="hljs-keyword">const</span> next = <span class="hljs-title function_">buildNext</span>(pattern);
  <span class="hljs-keyword">const</span> result = [];
  <span class="hljs-keyword">let</span> j = <span class="hljs-number">0</span>;
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">let</span> i = <span class="hljs-number">0</span>; i &lt; text.<span class="hljs-property">length</span>; i++) {
    <span class="hljs-keyword">while</span> (j &gt; <span class="hljs-number">0</span> &amp;&amp; text[i] !== pattern[j]) j = next[j - <span class="hljs-number">1</span>]; <span class="hljs-comment">// 主串指针 i 不回退</span>
    <span class="hljs-keyword">if</span> (text[i] === pattern[j]) j++;
    <span class="hljs-keyword">if</span> (j === pattern.<span class="hljs-property">length</span>) {
      result.<span class="hljs-title function_">push</span>(i - j + <span class="hljs-number">1</span>);
      j = next[j - <span class="hljs-number">1</span>]; <span class="hljs-comment">// 继续找下一处，允许重叠</span>
    }
  }
  <span class="hljs-keyword">return</span> result;
}

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">JSON</span>.<span class="hljs-title function_">stringify</span>(<span class="hljs-title function_">kmpSearchAll</span>(<span class="hljs-string">&#x27;aaaaaaab&#x27;</span>, <span class="hljs-string">&#x27;aaab&#x27;</span>))); <span class="hljs-comment">// [4]</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">JSON</span>.<span class="hljs-title function_">stringify</span>(<span class="hljs-title function_">kmpSearchAll</span>(<span class="hljs-string">&#x27;abababab&#x27;</span>, <span class="hljs-string">&#x27;abab&#x27;</span>))); <span class="hljs-comment">// [0,2,4]</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">JSON</span>.<span class="hljs-title function_">stringify</span>(<span class="hljs-title function_">kmpSearchAll</span>(<span class="hljs-string">&#x27;hello&#x27;</span>, <span class="hljs-string">&#x27;xyz&#x27;</span>))); <span class="hljs-comment">// []</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">JSON</span>.<span class="hljs-title function_">stringify</span>(<span class="hljs-title function_">kmpSearchAll</span>(<span class="hljs-string">&#x27;&#x27;</span>, <span class="hljs-string">&#x27;a&#x27;</span>))); <span class="hljs-comment">// []</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">JSON</span>.<span class="hljs-title function_">stringify</span>(<span class="hljs-title function_">kmpSearchAll</span>(<span class="hljs-string">&#x27;abc&#x27;</span>, <span class="hljs-string">&#x27;&#x27;</span>))); <span class="hljs-comment">// [0]</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;aaaaaaab&#x27;</span>.<span class="hljs-title function_">indexOf</span>(<span class="hljs-string">&#x27;aaab&#x27;</span>), <span class="hljs-string">&#x27;abc&#x27;</span>.<span class="hljs-title function_">indexOf</span>(<span class="hljs-string">&#x27;&#x27;</span>)); <span class="hljs-comment">// 4 0</span>
</code></pre></div>
<p>为什么说 O(n + m)？<code>i</code> 只往前走，共 n 步。<code>j</code> 每步最多加 1，<code>while</code> 里每次回退都让 <code>j</code> 至少减 1，而 <code>j</code> 不会小于 0，所以整个匹配过程中回退的总次数不超过 <code>j</code> 增加的总次数，也就是不超过 n。建表同理是 O(m)。</p>
<p><code>abababab</code> 里为什么能找到重叠的三处？找到第一处以后，<code>j</code> 不是清零，而是退到 <code>next[3]</code> 即 2，相当于承认结尾的 <code>ab</code> 可以当作下一次匹配的开头，所以下标 2 和 4 也能找到。只要不重叠的结果时，把这里改成 <code>j = 0</code> 即可。</p>
<p>空模式串返回 <code>[0]</code> 是按 <code>indexOf</code> 的约定：MDN 说明，查找空字符串时，<code>indexOf</code> 返回的是起始位置，没有指定起始位置时就是 0。</p>
<h2>常见追问</h2>
<p><strong>JS 的 indexOf 用的是 KMP 吗？</strong></p>
<blockquote>
<p>规范只规定了 <code>indexOf</code> 的结果，没有规定用什么算法，各引擎可以自己选。实际开发直接用 <code>indexOf</code>、<code>includes</code> 或正则就行，不需要自己写 KMP。</p>
</blockquote>
<p><strong>next 数组还能用来做什么？</strong></p>
<blockquote>
<p>判断一个字符串能否由某个子串重复多次构成：设长度为 n，<code>p = n - next[n - 1]</code>，如果 <code>next[n - 1] &gt; 0</code> 且 n 能被 p 整除，它就由长度为 p 的前缀重复而成。比如 <code>abcabc</code> 的 <code>next</code> 最后一项是 3，p 是 3，6 能被 3 整除，答案是 <code>abc</code> 重复两次。</p>
</blockquote>`};export{e as default};