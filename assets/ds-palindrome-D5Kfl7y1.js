var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>回文就是正着读和倒着读一样的字符串，比如 <code>level</code>、<code>abba</code>。最直接的判断是 <code>s === s.split(&#x27;&#x27;).reverse().join(&#x27;&#x27;)</code>，但它要额外建数组和新字符串。更省的做法是两个指针，一个从头、一个从尾往中间走，每一步比较两个字符，有一处不同就不是回文，O(n) 时间、O(1) 空间。</p>
<p>面试常见的变体是忽略大小写和标点，比如 <code>A man, a plan, a canal: Panama</code> 算回文。做法是指针遇到非字母数字字符就跳过，比较时都转成小写。</p>
<p>最长回文子串要找出字符串里最长的回文片段。思路是中心扩展：回文一定关于中心对称，所以枚举每个可能的中心，向两边扩到不相等为止。中心有两种，奇数长度的回文中心是一个字符，比如 <code>aba</code> 的 <code>b</code>；偶数长度的中心在两个字符之间，比如 <code>abba</code> 的两个 <code>b</code> 中间。长度为 n 的字符串共有 2n-1 个中心，每个最多扩 O(n)，总共 O(n²)。</p>
<p>要注意两点：只枚举单字符中心会漏掉所有偶数长度的回文；按下标比较的是 UTF-16 编码单元，emoji 这类字符会被拆成两半，要按用户看到的字符处理时先用 <code>Array.from</code> 拆分。</p>
</blockquote>
<h2>判断回文</h2>
<p>先看基础版本，再看忽略标点的版本里指针怎样跳过不相干的字符。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">isPalindrome</span>(<span class="hljs-params">s</span>) {
  <span class="hljs-keyword">let</span> left = <span class="hljs-number">0</span>;
  <span class="hljs-keyword">let</span> right = s.<span class="hljs-property">length</span> - <span class="hljs-number">1</span>;
  <span class="hljs-keyword">while</span> (left &lt; right) {
    <span class="hljs-keyword">if</span> (s[left] !== s[right]) <span class="hljs-keyword">return</span> <span class="hljs-literal">false</span>;
    left++;
    right--;
  }
  <span class="hljs-keyword">return</span> <span class="hljs-literal">true</span>;
}

<span class="hljs-keyword">const</span> <span class="hljs-title function_">isAlphanumeric</span> = (<span class="hljs-params">char</span>) =&gt; <span class="hljs-regexp">/[a-z0-9]/i</span>.<span class="hljs-title function_">test</span>(char);

<span class="hljs-keyword">function</span> <span class="hljs-title function_">isPalindromeLoose</span>(<span class="hljs-params">s</span>) {
  <span class="hljs-keyword">let</span> left = <span class="hljs-number">0</span>;
  <span class="hljs-keyword">let</span> right = s.<span class="hljs-property">length</span> - <span class="hljs-number">1</span>;
  <span class="hljs-keyword">while</span> (left &lt; right) {
    <span class="hljs-keyword">if</span> (!<span class="hljs-title function_">isAlphanumeric</span>(s[left])) {
      left++;
    } <span class="hljs-keyword">else</span> <span class="hljs-keyword">if</span> (!<span class="hljs-title function_">isAlphanumeric</span>(s[right])) {
      right--;
    } <span class="hljs-keyword">else</span> <span class="hljs-keyword">if</span> (s[left].<span class="hljs-title function_">toLowerCase</span>() !== s[right].<span class="hljs-title function_">toLowerCase</span>()) {
      <span class="hljs-keyword">return</span> <span class="hljs-literal">false</span>;
    } <span class="hljs-keyword">else</span> {
      left++;
      right--;
    }
  }
  <span class="hljs-keyword">return</span> <span class="hljs-literal">true</span>;
}

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">isPalindrome</span>(<span class="hljs-string">&#x27;level&#x27;</span>)); <span class="hljs-comment">// true</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">isPalindrome</span>(<span class="hljs-string">&#x27;abba&#x27;</span>)); <span class="hljs-comment">// true</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">isPalindrome</span>(<span class="hljs-string">&#x27;abc&#x27;</span>)); <span class="hljs-comment">// false</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">isPalindrome</span>(<span class="hljs-string">&#x27;&#x27;</span>)); <span class="hljs-comment">// true</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">isPalindrome</span>(<span class="hljs-string">&#x27;a&#x27;</span>)); <span class="hljs-comment">// true</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">isPalindromeLoose</span>(<span class="hljs-string">&#x27;A man, a plan, a canal: Panama&#x27;</span>)); <span class="hljs-comment">// true</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">isPalindromeLoose</span>(<span class="hljs-string">&#x27;race a car&#x27;</span>)); <span class="hljs-comment">// false</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">isPalindromeLoose</span>(<span class="hljs-string">&#x27;,.&#x27;</span>)); <span class="hljs-comment">// true</span>
</code></pre></div>
<p>循环条件为什么是 <code>left &lt; right</code> 而不是 <code>&lt;=</code>？两个指针相遇时指向同一个字符，自己和自己一定相等，不用比。奇数长度时它们停在正中间，偶数长度时交错而过，两种情况都正好比完所有对称位置。空字符串和单个字符一次都不比较，直接返回 true。</p>
<p><code>,.</code> 为什么是 true？两个字符都不是字母数字，全部被跳过，剩下的是空串，按约定算回文。这里用的正则 <code>/[a-z0-9]/i</code> 只认 ASCII 字母和数字；题目要支持中文等其他文字时，可以改成带 <code>u</code> 标志的 Unicode 属性类 <code>/[\\p{L}\\p{N}]/u</code>。</p>
<h2>最长回文子串</h2>
<p><code>expand</code> 从给定的左右下标出发往外扩，返回扩到的回文长度。主循环对每个 <code>i</code> 调用两次，分别对应奇数中心和偶数中心。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">longestPalindrome</span>(<span class="hljs-params">s</span>) {
  <span class="hljs-keyword">if</span> (s.<span class="hljs-property">length</span> &lt; <span class="hljs-number">2</span>) <span class="hljs-keyword">return</span> s;
  <span class="hljs-keyword">let</span> start = <span class="hljs-number">0</span>;
  <span class="hljs-keyword">let</span> maxLength = <span class="hljs-number">1</span>;

  <span class="hljs-keyword">function</span> <span class="hljs-title function_">expand</span>(<span class="hljs-params">left, right</span>) {
    <span class="hljs-keyword">while</span> (left &gt;= <span class="hljs-number">0</span> &amp;&amp; right &lt; s.<span class="hljs-property">length</span> &amp;&amp; s[left] === s[right]) {
      left--;
      right++;
    }
    <span class="hljs-comment">// 循环停下时两端已经多走了一步，真正的回文是 left+1 到 right-1</span>
    <span class="hljs-keyword">return</span> right - left - <span class="hljs-number">1</span>;
  }

  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">let</span> i = <span class="hljs-number">0</span>; i &lt; s.<span class="hljs-property">length</span>; i++) {
    <span class="hljs-keyword">const</span> length = <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">max</span>(<span class="hljs-title function_">expand</span>(i, i), <span class="hljs-title function_">expand</span>(i, i + <span class="hljs-number">1</span>));
    <span class="hljs-keyword">if</span> (length &gt; maxLength) {
      maxLength = length;
      start = i - <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">floor</span>((length - <span class="hljs-number">1</span>) / <span class="hljs-number">2</span>);
    }
  }
  <span class="hljs-keyword">return</span> s.<span class="hljs-title function_">slice</span>(start, start + maxLength);
}

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">longestPalindrome</span>(<span class="hljs-string">&#x27;babad&#x27;</span>)); <span class="hljs-comment">// bab</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">longestPalindrome</span>(<span class="hljs-string">&#x27;cbbd&#x27;</span>)); <span class="hljs-comment">// bb</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">longestPalindrome</span>(<span class="hljs-string">&#x27;forgeeksskeegfor&#x27;</span>)); <span class="hljs-comment">// geeksskeeg</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">longestPalindrome</span>(<span class="hljs-string">&#x27;a&#x27;</span>)); <span class="hljs-comment">// a</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">longestPalindrome</span>(<span class="hljs-string">&#x27;ac&#x27;</span>)); <span class="hljs-comment">// a</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">longestPalindrome</span>(<span class="hljs-string">&#x27;aaaa&#x27;</span>)); <span class="hljs-comment">// aaaa</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">JSON</span>.<span class="hljs-title function_">stringify</span>(<span class="hljs-title function_">longestPalindrome</span>(<span class="hljs-string">&#x27;&#x27;</span>))); <span class="hljs-comment">// &quot;&quot;</span>
</code></pre></div>
<p><code>babad</code> 为什么返回 <code>bab</code> 而不是 <code>aba</code>？两个都是长度 3 的回文。代码只在长度严格变大时更新，<code>bab</code> 以下标 1 为中心，先被找到，后来的 <code>aba</code> 长度相同，不会覆盖。题目一般接受任意一个。</p>
<p>起点 <code>i - Math.floor((length - 1) / 2)</code> 怎么来的？回文的中心在 <code>i</code>（奇数）或 <code>i</code> 与 <code>i + 1</code> 之间（偶数），左半边的长度是 <code>(length - 1) / 2</code> 向下取整。比如 <code>cbbd</code> 里 <code>bb</code> 的中心在下标 1 和 2 之间，<code>length</code> 是 2，起点是 <code>1 - 0 = 1</code>；<code>aaaa</code> 在 <code>i = 1</code> 时偶数中心扩出长度 4，起点是 <code>1 - 1 = 0</code>。</p>
<p>为什么要两种中心？<code>cbbd</code> 的答案 <code>bb</code> 是偶数长度，只用 <code>expand(i, i)</code> 的话，每个中心都只能扩出长度 1，结果会错成 <code>c</code>。</p>
<h2>复杂度和更快的做法</h2>
<p>中心扩展有 2n-1 个中心，每次扩展最多走 O(n) 步，最坏情况是 <code>aaaa…</code> 这种全相同的字符串，总时间 O(n²)，只用几个变量，空间 O(1)。</p>
<p>另一种常见写法是动态规划：<code>dp[i][j]</code> 表示 <code>s[i..j]</code> 是不是回文，它成立当且仅当两端字符相等且 <code>dp[i+1][j-1]</code> 成立。时间同样 O(n²)，但要 O(n²) 的表格，所以面试里中心扩展更常用。存在 O(n) 的 Manacher 算法，它利用已经找到的回文的对称性跳过重复扩展，实现细节多，一般知道名字和思路就够了。</p>
<h2>常见追问</h2>
<p><strong>最多删除一个字符后能不能成为回文？</strong></p>
<blockquote>
<p>还是两个指针从两头比。遇到第一处不相等时，有两种删法：删左边字符，检查 <code>left + 1</code> 到 <code>right</code> 是不是回文；或者删右边，检查 <code>left</code> 到 <code>right - 1</code>。两种有一种成立就返回 true。整体仍是 O(n)。</p>
</blockquote>
<p><strong>为什么 <code>split(&#x27;&#x27;).reverse().join(&#x27;&#x27;)</code> 处理 emoji 会出错？</strong></p>
<blockquote>
<p><code>split(&#x27;&#x27;)</code> 按 UTF-16 编码单元拆分，一个 emoji 通常占两个编码单元，反转后两半的顺序颠倒，得到的就不是原来的字符了。改成 <code>Array.from(s)</code> 或展开 <code>[...s]</code>，会按码点拆分，常见 emoji 就不会被拆开；带肤色或组合的 emoji 由多个码点组成，还需要 <code>Intl.Segmenter</code> 按字素拆分，见<a href="/questions/intl-unicode/">《为什么字符串 length 不一定等于用户看到的字符数？》</a>。</p>
</blockquote>`};export{e as default};