var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>比如客户端要判断当前版本 <code>1.2</code> 是不是低于最低要求 <code>1.10</code>，低了就提示升级。直接用字符串比较会出错，因为字符串是一个字符一个字符比的，<code>&#x27;2&#x27;</code> 比 <code>&#x27;1&#x27;</code> 大，于是 <code>&#x27;1.2&#x27; &gt; &#x27;1.10&#x27;</code>。</p>
<p>正确做法是按点号拆成几段，每段转成数字，从左往右比。哪一段先分出大小，结果就定了。LeetCode 165 题的规定是，段数少的一方，缺的段当作 0，每段的值忽略前导零，所以 <code>1.01</code> 和 <code>1.001</code> 相等，<code>1.0</code> 和 <code>1.0.0</code> 也相等。</p>
<p>返回值习惯用 -1、0、1，这样可以直接传给 <code>sort</code> 给一组版本号排序。</p>
<p>要注意，实际项目里的版本号可能带预发布标签，比如 <code>1.0.0-alpha</code>。按 SemVer 规范，主次修订号相同时，带预发布标签的版本更小，<code>1.0.0-alpha &lt; 1.0.0</code>。简单的拆段比较处理不了这种情况，要么按规范补上，要么直接用 <code>semver</code> 这类库。</p>
</blockquote>
<h2>按段比较</h2>
<p>下面的写法对应 LeetCode 165 的题意：段数不同时补 0，每段按整数比较。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">compareVersion</span>(<span class="hljs-params">a, b</span>) {
  <span class="hljs-keyword">const</span> left = a.<span class="hljs-title function_">split</span>(<span class="hljs-string">&#x27;.&#x27;</span>);
  <span class="hljs-keyword">const</span> right = b.<span class="hljs-title function_">split</span>(<span class="hljs-string">&#x27;.&#x27;</span>);
  <span class="hljs-keyword">const</span> length = <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">max</span>(left.<span class="hljs-property">length</span>, right.<span class="hljs-property">length</span>);

  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">let</span> i = <span class="hljs-number">0</span>; i &lt; length; i += <span class="hljs-number">1</span>) {
    <span class="hljs-comment">// 缺的段按 0 算；Number 会自动忽略前导零。</span>
    <span class="hljs-keyword">const</span> x = <span class="hljs-title class_">Number</span>(left[i] ?? <span class="hljs-number">0</span>);
    <span class="hljs-keyword">const</span> y = <span class="hljs-title class_">Number</span>(right[i] ?? <span class="hljs-number">0</span>);
    <span class="hljs-keyword">if</span> (x &gt; y) <span class="hljs-keyword">return</span> <span class="hljs-number">1</span>;
    <span class="hljs-keyword">if</span> (x &lt; y) <span class="hljs-keyword">return</span> -<span class="hljs-number">1</span>;
  }
  <span class="hljs-keyword">return</span> <span class="hljs-number">0</span>;
}

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;1.2&#x27;</span> &gt; <span class="hljs-string">&#x27;1.10&#x27;</span>); <span class="hljs-comment">// true</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">compareVersion</span>(<span class="hljs-string">&#x27;1.2&#x27;</span>, <span class="hljs-string">&#x27;1.10&#x27;</span>)); <span class="hljs-comment">// -1</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">compareVersion</span>(<span class="hljs-string">&#x27;1.01&#x27;</span>, <span class="hljs-string">&#x27;1.001&#x27;</span>)); <span class="hljs-comment">// 0</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">compareVersion</span>(<span class="hljs-string">&#x27;1.0&#x27;</span>, <span class="hljs-string">&#x27;1.0.0&#x27;</span>)); <span class="hljs-comment">// 0</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>([<span class="hljs-string">&#x27;1.10&#x27;</span>, <span class="hljs-string">&#x27;1.2&#x27;</span>, <span class="hljs-string">&#x27;0.9&#x27;</span>, <span class="hljs-string">&#x27;1.2.1&#x27;</span>].<span class="hljs-title function_">sort</span>(compareVersion).<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27; &#x27;</span>)); <span class="hljs-comment">// 0.9 1.2 1.2.1 1.10</span>
</code></pre></div>
<p>第一行就是直接比字符串的结果：<code>&#x27;1.2&#x27; &gt; &#x27;1.10&#x27;</code> 是 <code>true</code>。比较到第三个字符时，<code>&#x27;2&#x27;</code> 和 <code>&#x27;1&#x27;</code> 比，<code>&#x27;2&#x27;</code> 大，后面的就不看了。拆段转成数字以后，比的是 2 和 10，结果才对。</p>
<p>为什么要补 0，而不是认为段多的版本更大？因为 <code>1.0</code> 和 <code>1.0.0</code> 指的是同一个版本，多出来的 <code>.0</code> 不该改变大小。所以循环次数取两边段数的较大值，取不到的那一段当作 0。</p>
<h2>带预发布标签怎么办</h2>
<p>SemVer 规定版本号是 <code>主.次.修订</code>，后面可以用 <code>-</code> 接预发布标签。比较规则是：主次修订号相同时，有预发布标签的更小；两个都有标签时，按点号拆开逐段比，纯数字的段按数字比，并且比非数字的段小。规范给的顺序是：</p>
<div class="not-prose code-block"><div class="code-language">代码</div><pre><code>1.0.0-alpha &lt; 1.0.0-alpha.1 &lt; 1.0.0-alpha.beta &lt; 1.0.0-beta &lt; 1.0.0-beta.2 &lt; 1.0.0-beta.11 &lt; 1.0.0-rc.1 &lt; 1.0.0
</code></pre></div>
<p>面试时能说出“先比主体，主体相同时有标签的更小”，再说明工程里用 <code>semver</code> 库处理，一般就够了。</p>
<h2>常见追问</h2>
<p><strong>为什么不把版本号去掉点号转成一个数字再比？</strong></p>
<blockquote>
<p>因为每段位数不固定。<code>1.10</code> 去点号是 110，<code>11.0</code> 去点号也是 110，结果就分不出来了。除非先把每段补齐成固定位数，但那样还得假设每段的最大值，不如直接逐段比。</p>
</blockquote>
<p><strong>时间复杂度是多少？</strong></p>
<blockquote>
<p>拆分和比较都只扫一遍字符串，是 O(n + m)，n、m 是两个版本号的长度。</p>
</blockquote>`};export{e as default};