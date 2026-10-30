var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>给一组字符串，比如 <code>[&quot;flower&quot;, &quot;flow&quot;, &quot;flight&quot;]</code>，找出它们开头共同的那一段，这里是 <code>&quot;fl&quot;</code>；没有共同开头，比如 <code>[&quot;dog&quot;, &quot;racecar&quot;, &quot;car&quot;]</code>，就返回空字符串。</p>
<p>最直接的做法是逐个缩短。先假设第一个字符串整个都是公共前缀，然后拿它和第二个、第三个字符串比：对方不以它开头，就把它最后一个字符去掉，再比，直到对方以它开头为止。所有字符串比完，剩下的就是答案。</p>
<p>另一种是按列比较。从第 0 个字符开始，检查每个字符串在这个位置上的字符是否和第一个字符串相同，全都相同就看下一列，一旦有不同或者某个字符串已经到头，前面的部分就是答案。按列比较的好处是只要遇到最短的那个字符串，就能提前停下。</p>
<p>要注意空字符串和只有一个字符串的边界。数组里有空字符串时答案一定是空串；只有一个字符串时答案就是它自己。题目保证数组至少有一个元素，所以直接读 <code>strs[0]</code> 不会出错。</p>
</blockquote>
<h2>两种写法</h2>
<p><code>longestCommonPrefix</code> 是逐个缩短的写法，<code>longestCommonPrefixByColumn</code> 是按列比较的写法。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">longestCommonPrefix</span>(<span class="hljs-params">strs</span>) {
  <span class="hljs-keyword">let</span> prefix = strs[<span class="hljs-number">0</span>];
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">let</span> i = <span class="hljs-number">1</span>; i &lt; strs.<span class="hljs-property">length</span>; i += <span class="hljs-number">1</span>) {
    <span class="hljs-keyword">while</span> (!strs[i].<span class="hljs-title function_">startsWith</span>(prefix)) {
      prefix = prefix.<span class="hljs-title function_">slice</span>(<span class="hljs-number">0</span>, -<span class="hljs-number">1</span>);
    }
    <span class="hljs-keyword">if</span> (prefix === <span class="hljs-string">&#x27;&#x27;</span>) <span class="hljs-keyword">return</span> <span class="hljs-string">&#x27;&#x27;</span>;
  }
  <span class="hljs-keyword">return</span> prefix;
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">longestCommonPrefixByColumn</span>(<span class="hljs-params">strs</span>) {
  <span class="hljs-keyword">const</span> first = strs[<span class="hljs-number">0</span>];
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">let</span> i = <span class="hljs-number">0</span>; i &lt; first.<span class="hljs-property">length</span>; i += <span class="hljs-number">1</span>) {
    <span class="hljs-keyword">for</span> (<span class="hljs-keyword">let</span> j = <span class="hljs-number">1</span>; j &lt; strs.<span class="hljs-property">length</span>; j += <span class="hljs-number">1</span>) {
      <span class="hljs-keyword">if</span> (i === strs[j].<span class="hljs-property">length</span> || strs[j][i] !== first[i]) {
        <span class="hljs-keyword">return</span> first.<span class="hljs-title function_">slice</span>(<span class="hljs-number">0</span>, i);
      }
    }
  }
  <span class="hljs-keyword">return</span> first;
}

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">longestCommonPrefix</span>([<span class="hljs-string">&#x27;flower&#x27;</span>, <span class="hljs-string">&#x27;flow&#x27;</span>, <span class="hljs-string">&#x27;flight&#x27;</span>])); <span class="hljs-comment">// fl</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">JSON</span>.<span class="hljs-title function_">stringify</span>(<span class="hljs-title function_">longestCommonPrefix</span>([<span class="hljs-string">&#x27;dog&#x27;</span>, <span class="hljs-string">&#x27;racecar&#x27;</span>, <span class="hljs-string">&#x27;car&#x27;</span>]))); <span class="hljs-comment">// &quot;&quot;</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">longestCommonPrefixByColumn</span>([<span class="hljs-string">&#x27;flower&#x27;</span>, <span class="hljs-string">&#x27;flow&#x27;</span>, <span class="hljs-string">&#x27;flight&#x27;</span>])); <span class="hljs-comment">// fl</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">longestCommonPrefixByColumn</span>([<span class="hljs-string">&#x27;ab&#x27;</span>, <span class="hljs-string">&#x27;a&#x27;</span>])); <span class="hljs-comment">// a</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">JSON</span>.<span class="hljs-title function_">stringify</span>(<span class="hljs-title function_">longestCommonPrefixByColumn</span>([<span class="hljs-string">&#x27;&#x27;</span>, <span class="hljs-string">&#x27;b&#x27;</span>]))); <span class="hljs-comment">// &quot;&quot;</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">longestCommonPrefixByColumn</span>([<span class="hljs-string">&#x27;alone&#x27;</span>])); <span class="hljs-comment">// alone</span>
</code></pre></div>
<p>先看逐个缩短。<code>prefix</code> 一开始是 <code>&quot;flower&quot;</code>，和 <code>&quot;flow&quot;</code> 比时，<code>&quot;flow&quot;</code> 不以 <code>&quot;flower&quot;</code> 开头，于是去掉一个字符变成 <code>&quot;flowe&quot;</code>，还不行，再去掉一个变成 <code>&quot;flow&quot;</code>，满足了。再和 <code>&quot;flight&quot;</code> 比，一路缩到 <code>&quot;fl&quot;</code> 才满足。比完所有字符串，答案就是 <code>&quot;fl&quot;</code>。</p>
<p><code>while</code> 循环会不会停不下来？不会。空字符串是任何字符串的前缀，<code>&quot;任意&quot;.startsWith(&#x27;&#x27;)</code> 一定是 <code>true</code>，所以 <code>prefix</code> 最多缩到空串就会停。循环后面判断 <code>prefix === &#x27;&#x27;</code> 是为了提前结束，后面的字符串不用再比了。</p>
<p>再看按列比较。外层循环走第一个字符串的每个位置 <code>i</code>，内层检查其他字符串的第 <code>i</code> 个字符。<code>i === strs[j].length</code> 表示这个字符串已经到头，比如 <code>[&#x27;ab&#x27;, &#x27;a&#x27;]</code> 在 <code>i = 1</code> 时，<code>&quot;a&quot;</code> 已经没有第 1 个字符，就返回 <code>&quot;a&quot;</code>。第一个字符串走完都没有返回，说明它整个都是公共前缀，比如只有一个元素 <code>[&#x27;alone&#x27;]</code> 时，内层循环一次都不执行，直接返回 <code>&quot;alone&quot;</code>。</p>
<h2>复杂度怎么算</h2>
<p>设 S 是所有字符串的字符数之和。按列比较时，每个字符最多被比较一次，所以时间是 O(S)，最好情况下第一列就不同，马上返回。逐个缩短的写法里，<code>startsWith</code> 和 <code>slice</code> 每次都要扫描和复制字符串，最坏情况下，比如所有字符串都相同，总比较量也是 O(S) 的量级，但缩短过程会多做一些重复比较。两种写法都只用常数个额外变量，除了返回的字符串之外，额外空间是 O(1)。</p>
<p>还有一种办法是先把数组按字典序排序，然后只比较第一个和最后一个字符串的公共前缀，因为排序后差异最大的两个就在两端。但排序本身要 O(n log n) 次字符串比较，比上面两种都慢，面试里说思路就够了。</p>
<p>前缀查询如果要反复进行，比如搜索框的输入提示，就不适合每次都这样扫一遍，可以用前缀树，见<a href="/questions/alg-trie-prefix/">《搜索建议什么时候适合用 Trie？前缀树怎样处理重复词和 Unicode？》</a>。</p>
<h2>常见追问</h2>
<p><strong>为什么按列比较时要判断字符串是否到头？</strong></p>
<blockquote>
<p>因为第一个字符串不一定是最短的。如果不判断，<code>strs[j][i]</code> 越界时会得到 <code>undefined</code>，和 <code>first[i]</code> 不相等，碰巧也会返回正确结果，但这是依赖越界的行为，写出 <code>i === strs[j].length</code> 意图更清楚。</p>
</blockquote>
<p><strong>能用二分查找做吗？</strong></p>
<blockquote>
<p>能。公共前缀的长度在 0 到最短字符串长度之间，可以二分这个长度，每次检查所有字符串在这个长度上的前缀是否相同。时间是 O(S · log m)，m 是最短字符串的长度，比按列比较还多了一个 log，所以一般不用。</p>
</blockquote>
<p><strong>题目里的字符串都是小写字母，有什么影响？</strong></p>
<blockquote>
<p>题目约束非空字符串只包含小写英文字母，所以按下标逐个比较字符是安全的。如果输入里有 emoji 这类由两个 UTF-16 码元组成的字符，按下标截出来的前缀可能把一个字符切成两半，相关原因见<a href="/questions/intl-unicode/">《为什么字符串 length 不一定等于用户看到的字符数？》</a>。</p>
</blockquote>`};export{e as default};