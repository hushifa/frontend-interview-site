var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>题目是：给一个字符串，找出不含重复字符的最长子串的长度，比如 <code>abcabcbb</code> 的答案是 3，对应 <code>abc</code>。暴力做法是枚举所有子串再逐个检查，至少 O(n²)。</p>
<p>滑动窗口的思路是：用 <code>left</code> 和 <code>right</code> 两个下标围出一段子串，保证这段里始终没有重复字符。<code>right</code> 每次往右走一格，把新字符纳入窗口；如果这个字符在窗口里已经出现过，就把 <code>left</code> 跳到它上次出现位置的后一位，把重复的那个踢出去。每一步都更新一次最长长度。</p>
<p>怎么快速知道字符上次出现在哪？用 Map 记录“字符 → 最后出现的下标”。因为 <code>left</code> 和 <code>right</code> 都只往右走、不回头，每个字符最多被处理两次，整体 O(n)。</p>
<p>要注意，Map 里记录的位置可能已经在窗口左边了。比如 <code>abba</code> 走到最后的 <code>a</code> 时，<code>a</code> 上次出现在下标 0，可窗口左边界早就是 2 了，这时 <code>left</code> 不能往回跳，所以要取 <code>Math.max(left, 上次位置 + 1)</code>。</p>
</blockquote>
<h2>代码实现</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">lengthOfLongestSubstring</span>(<span class="hljs-params">s</span>) {
  <span class="hljs-keyword">const</span> lastIndex = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Map</span>();
  <span class="hljs-keyword">let</span> left = <span class="hljs-number">0</span>;
  <span class="hljs-keyword">let</span> best = <span class="hljs-number">0</span>;
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">let</span> right = <span class="hljs-number">0</span>; right &lt; s.<span class="hljs-property">length</span>; right++) {
    <span class="hljs-keyword">const</span> char = s[right];
    <span class="hljs-keyword">if</span> (lastIndex.<span class="hljs-title function_">has</span>(char)) {
      left = <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">max</span>(left, lastIndex.<span class="hljs-title function_">get</span>(char) + <span class="hljs-number">1</span>);
    }
    lastIndex.<span class="hljs-title function_">set</span>(char, right);
    best = <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">max</span>(best, right - left + <span class="hljs-number">1</span>);
  }
  <span class="hljs-keyword">return</span> best;
}

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">lengthOfLongestSubstring</span>(<span class="hljs-string">&#x27;abcabcbb&#x27;</span>)); <span class="hljs-comment">// 3</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">lengthOfLongestSubstring</span>(<span class="hljs-string">&#x27;bbbbb&#x27;</span>)); <span class="hljs-comment">// 1</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">lengthOfLongestSubstring</span>(<span class="hljs-string">&#x27;pwwkew&#x27;</span>)); <span class="hljs-comment">// 3</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">lengthOfLongestSubstring</span>(<span class="hljs-string">&#x27;abba&#x27;</span>)); <span class="hljs-comment">// 2</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">lengthOfLongestSubstring</span>(<span class="hljs-string">&#x27;&#x27;</span>)); <span class="hljs-comment">// 0</span>
</code></pre></div>
<p><code>pwwkew</code> 为什么是 3？走到第二个 <code>w</code>（下标 2）时，窗口 <code>pw</code> 里已经有 <code>w</code>，在下标 1，于是 <code>left</code> 跳到 2，窗口变成 <code>w</code>。之后加入 <code>k</code>、<code>e</code>，窗口是 <code>wke</code>，长度 3。再遇到 <code>w</code> 时，上次的 <code>w</code> 在下标 2，<code>left</code> 跳到 3，窗口变成 <code>kew</code>，长度还是 3。</p>
<p><code>abba</code> 就是简答里说的情况。走到第二个 <code>b</code> 时 <code>left</code> 跳到 2；再走到最后的 <code>a</code>，Map 里 <code>a</code> 在下标 0，<code>0 + 1 = 1</code> 比当前的 <code>left</code> 小，如果不取较大值，<code>left</code> 就退回到 1，窗口变成 <code>bba</code>，里面有重复，结果错成 3。</p>
<p>这里按 <code>s[right]</code> 逐个取的是 UTF-16 编码单元，emoji 这类字符会被拆成两半。要按用户看到的字符处理，可以先用 <code>Array.from(s)</code> 拆分，见<a href="/questions/intl-unicode/">《为什么字符串 length 不一定等于用户看到的字符数？》</a>。</p>
<h2>滑动窗口适合哪些题</h2>
<p>题目要找“满足某个条件的最长或最短连续子串、子数组”，而且窗口扩大、缩小时条件能增量更新，就适合滑动窗口。比如和大于等于目标值的最短子数组、包含所有指定字符的最小覆盖子串、长度为 k 的子数组最大平均值。</p>
<p>套路是固定的：右指针扩张，把新元素加入窗口状态；窗口不满足条件时，左指针收缩，把元素移出状态；在合适的时机更新答案。</p>
<h2>常见追问</h2>
<p><strong>滑动窗口和双指针是什么关系？</strong></p>
<blockquote>
<p>滑动窗口是双指针的一种，两个指针同向移动，中间夹着一个窗口。另一种常见的双指针是两头往中间走，比如有序数组找两数之和、判断回文串。</p>
</blockquote>
<p><strong>前端开发里用得到吗？</strong></p>
<blockquote>
<p>思路很常见。比如统计最近一分钟内的请求次数做限流，就是在时间轴上维护一个窗口，新请求进来，过期的请求移出去。</p>
</blockquote>`};export{e as default};