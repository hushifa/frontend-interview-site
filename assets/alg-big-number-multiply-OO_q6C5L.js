var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>两个很长的数字字符串相乘，比如 <code>&#x27;9007199254740993&#x27;</code> 乘以 3，直接转成 Number 去乘，结果末尾会出错，因为超过 <code>Number.MAX_SAFE_INTEGER</code> 的整数已经不能精确表示。手写的办法是照着小学竖式乘法，一位一位地乘。</p>
<p>具体做法是准备一个长度为 <code>a.length + b.length</code> 的数组，全部填 0。两层循环从末位开始，<code>a[i]</code> 乘 <code>b[j]</code> 的结果落在第 <code>i + j + 1</code> 位，加上这一位原来的值，对 10 取余留在这一位，商作为进位加到第 <code>i + j</code> 位。最后把数组拼成字符串，去掉开头的 0。</p>
<p>为什么数组长度是两数位数之和？因为 m 位数乘 n 位数，结果最多 m + n 位，比如 99 × 99 = 9801，两位乘两位得四位。</p>
<p>现代浏览器和 Node 都支持 <code>BigInt</code>，写成 <code>BigInt(a) * BigInt(b)</code> 就能精确相乘。要注意 <code>BigInt</code> 不能和 Number 混合运算，不能用 <code>Math</code> 的方法，也只能表示整数；手写版本主要用来考察对竖式和进位的理解。</p>
</blockquote>
<h2>按竖式逐位相乘</h2>
<p>下面的 <code>multiply</code> 接收两个非负整数字符串，返回乘积字符串。最后两行用 <code>BigInt</code> 对比结果。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">multiply</span>(<span class="hljs-params">a, b</span>) {
  <span class="hljs-keyword">if</span> (a === <span class="hljs-string">&#x27;0&#x27;</span> || b === <span class="hljs-string">&#x27;0&#x27;</span>) <span class="hljs-keyword">return</span> <span class="hljs-string">&#x27;0&#x27;</span>;
  <span class="hljs-keyword">const</span> result = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Array</span>(a.<span class="hljs-property">length</span> + b.<span class="hljs-property">length</span>).<span class="hljs-title function_">fill</span>(<span class="hljs-number">0</span>);

  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">let</span> i = a.<span class="hljs-property">length</span> - <span class="hljs-number">1</span>; i &gt;= <span class="hljs-number">0</span>; i--) {
    <span class="hljs-keyword">for</span> (<span class="hljs-keyword">let</span> j = b.<span class="hljs-property">length</span> - <span class="hljs-number">1</span>; j &gt;= <span class="hljs-number">0</span>; j--) {
      <span class="hljs-comment">// a[i] 和 b[j] 的乘积落在 i + j + 1 这一位，进位加到 i + j。</span>
      <span class="hljs-keyword">const</span> sum = <span class="hljs-title class_">Number</span>(a[i]) * <span class="hljs-title class_">Number</span>(b[j]) + result[i + j + <span class="hljs-number">1</span>];
      result[i + j + <span class="hljs-number">1</span>] = sum % <span class="hljs-number">10</span>;
      result[i + j] += <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">floor</span>(sum / <span class="hljs-number">10</span>);
    }
  }

  <span class="hljs-keyword">return</span> result.<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;&#x27;</span>).<span class="hljs-title function_">replace</span>(<span class="hljs-regexp">/^0+/</span>, <span class="hljs-string">&#x27;&#x27;</span>);
}

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">multiply</span>(<span class="hljs-string">&#x27;123&#x27;</span>, <span class="hljs-string">&#x27;45&#x27;</span>)); <span class="hljs-comment">// 5535</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">multiply</span>(<span class="hljs-string">&#x27;99&#x27;</span>, <span class="hljs-string">&#x27;99&#x27;</span>)); <span class="hljs-comment">// 9801</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">multiply</span>(<span class="hljs-string">&#x27;9007199254740993&#x27;</span>, <span class="hljs-string">&#x27;3&#x27;</span>)); <span class="hljs-comment">// 27021597764222979</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-number">9007199254740993</span> * <span class="hljs-number">3</span>); <span class="hljs-comment">// 27021597764222976</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>((<span class="hljs-number">9007199254740993n</span> * <span class="hljs-number">3n</span>).<span class="hljs-title function_">toString</span>()); <span class="hljs-comment">// 27021597764222979</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(
  <span class="hljs-title function_">multiply</span>(<span class="hljs-string">&#x27;12345678901234567890&#x27;</span>, <span class="hljs-string">&#x27;98765432109876543210&#x27;</span>) ===
    (<span class="hljs-number">12345678901234567890n</span> * <span class="hljs-number">98765432109876543210n</span>).<span class="hljs-title function_">toString</span>(),
); <span class="hljs-comment">// true</span>
</code></pre></div>
<p>第四行直接用 Number 计算，得到 <code>27021597764222976</code>，末尾错了。原因是字面量 <code>9007199254740993</code> 已经超过 <code>Number.MAX_SAFE_INTEGER</code>（9007199254740991），写进代码时就被舍入成了 <code>9007199254740992</code>，再乘 3 自然不对。字符串版本和 <code>BigInt</code> 版本都得到正确的 <code>27021597764222979</code>。</p>
<p>为什么乘积放在 <code>i + j + 1</code> 位？把结果数组想成从左到右的位：<code>a</code> 的第 <code>i</code> 位从右数是第 <code>a.length - 1 - i</code> 位，<code>b</code> 的第 <code>j</code> 位从右数是第 <code>b.length - 1 - j</code> 位，两者相乘落在从右数第 <code>a.length + b.length - 2 - i - j</code> 位，换算成从左数的下标，正好是 <code>i + j + 1</code>。它的进位比它高一位，就是 <code>i + j</code>。</p>
<p>内层循环里 <code>result[i + j]</code> 只加了进位，没有马上对 10 取余，会不会超过 9？会，但没关系。这个位置之后还会作为某一次的 <code>i + j + 1</code> 被访问到（同一轮里 <code>j</code> 减 1 时，或者 <code>j</code> 到 0 以后的下一轮外层循环），那时会重新取余，把进位继续往左推。最高位 <code>result[0]</code> 只接收进位，而乘积最多 m + n 位，所以它不会超过 9。最终每一位都在 0 到 9 之间。</p>
<p>两层循环各跑一遍，时间复杂度是 O(m × n)，m 和 n 是两个数的位数。</p>
<h2>结果为什么要去掉前导零</h2>
<p>数组长度按最多的 m + n 位准备，可是很多时候乘积没那么长。比如 123 × 45 = 5535，只有 4 位，数组却有 5 位，第一位是 0，所以用 <code>replace(/^0+/, &#x27;&#x27;)</code> 去掉。开头先判断有一个数是 <code>&#x27;0&#x27;</code> 就直接返回，否则结果全是 0，去掉以后会变成空字符串。</p>
<h2>有了 BigInt 还要手写吗</h2>
<p>MDN 写明，<code>BigInt</code> 用来表示超出 Number 安全范围的整数，可以在整数字面量后面加 <code>n</code>，也可以用 <code>BigInt(&#x27;9007199254740993&#x27;)</code> 从字符串创建。所以实际项目里，后端以字符串返回长整数时，直接转成 <code>BigInt</code> 计算最省事。</p>
<p>可是它有几个限制。<code>BigInt</code> 不能和 Number 混合运算，<code>1n + 1</code> 会抛出 <code>TypeError</code>，要先转成同一种类型；也不能用 <code>Math</code> 对象上的方法。字符串里如果有小数点，<code>BigInt()</code> 会抛出 <code>SyntaxError</code>，所以金额这类带小数的数据，要先换算成最小单位的整数，比如“分”。另外 <code>JSON.stringify</code> 遇到 <code>BigInt</code> 会报错，传给后端前要先转成字符串。</p>
<p>手写竖式主要考察的是逐位计算和进位处理，和<a href="/questions/alg-big-number-add/">《怎样手写大数相加？为什么 JS 的大整数会算错？》</a>是同一类题。</p>
<h2>常见追问</h2>
<p><strong>怎样支持负数？</strong></p>
<blockquote>
<p>先看两个字符串开头有没有负号，记下结果的符号，去掉负号后按非负数相乘。两个数里恰好有一个负数时，结果前面加负号；结果是 0 时不加。</p>
</blockquote>
<p><strong>乘积要以 Number 交给图表库怎么办？</strong></p>
<blockquote>
<p>先判断结果是否在安全范围内。比较运算允许 BigInt 和 Number 混用，可以直接写 <code>product &lt;= Number.MAX_SAFE_INTEGER</code>。在范围内才用 <code>Number()</code> 转换；超出范围时转换会丢精度，只能保留字符串显示。</p>
</blockquote>`};export{e as default};