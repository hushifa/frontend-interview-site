var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>订单金额 <code>1234567.89</code> 要显示成 <code>1,234,567.89</code>，实际项目里最好直接用浏览器内置的 <code>Intl.NumberFormat</code>，或者 <code>num.toLocaleString(&#x27;en-US&#x27;)</code>。它们按地区规则分组，还能顺便控制小数位、加货币符号，不同语言环境下分隔符也会变，比如德语用点号分组、逗号做小数点。</p>
<p>面试让手写，常见有两种思路。一种是正则：先把数字拆成整数和小数两部分，只对整数部分执行 <code>replace(/\\B(?=(\\d{3})+(?!\\d))/g, &#x27;,&#x27;)</code>。意思是在这样的位置插入逗号：它不是单词边界，也就是前面还有数字，而且它后面跟着若干组正好三位的数字，一直到整数部分结束。另一种是循环：从整数部分的末尾往前，每三位截一段，最后用逗号拼起来。</p>
<p>不管哪种写法，都要先处理三个边界：负号要先拿掉，最后再加回去；小数部分不能被分组，<code>0.12345</code> 的小数不能变成 <code>0.12,345</code>；超过 <code>Number.MAX_SAFE_INTEGER</code> 的数字传进来时可能已经丢了精度，要以字符串的形式处理。</p>
<p>要注意，<code>toLocaleString()</code> 不传参数时用的是用户系统的地区设置，不同用户看到的格式可能不一样，需要固定格式时要显式传地区。</p>
</blockquote>
<h2>用 Intl.NumberFormat</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> format = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">NumberFormat</span>(<span class="hljs-string">&#x27;en-US&#x27;</span>, { <span class="hljs-attr">maximumFractionDigits</span>: <span class="hljs-number">2</span> });
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(format.<span class="hljs-title function_">format</span>(<span class="hljs-number">1234567.891</span>)); <span class="hljs-comment">// 1,234,567.89</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">NumberFormat</span>(<span class="hljs-string">&#x27;de-DE&#x27;</span>).<span class="hljs-title function_">format</span>(<span class="hljs-number">1234567.5</span>)); <span class="hljs-comment">// 1.234.567,5</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">NumberFormat</span>(<span class="hljs-string">&#x27;zh-CN&#x27;</span>, { <span class="hljs-attr">style</span>: <span class="hljs-string">&#x27;currency&#x27;</span>, <span class="hljs-attr">currency</span>: <span class="hljs-string">&#x27;CNY&#x27;</span> }).<span class="hljs-title function_">format</span>(<span class="hljs-number">1234.5</span>)); <span class="hljs-comment">// ¥1,234.50</span>
</code></pre></div>
<p>为什么德语环境输出的是 <code>1.234.567,5</code>？因为分组和小数点用什么符号，本来就是地区习惯。<code>Intl.NumberFormat</code> 内置了这些规则，自己手写很难覆盖全。货币格式还会自动补齐两位小数、加上货币符号。日期、金额等格式为什么不该手拼，见<a href="/questions/intl-format/">《为什么日期、金额和排序不应该手动拼接格式？》</a>。</p>
<h2>手写正则版本</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">formatThousands</span>(<span class="hljs-params">value</span>) {
  <span class="hljs-keyword">const</span> text = <span class="hljs-title class_">String</span>(value);
  <span class="hljs-keyword">const</span> sign = text.<span class="hljs-title function_">startsWith</span>(<span class="hljs-string">&#x27;-&#x27;</span>) ? <span class="hljs-string">&#x27;-&#x27;</span> : <span class="hljs-string">&#x27;&#x27;</span>;
  <span class="hljs-keyword">const</span> [integer, decimal] = text.<span class="hljs-title function_">replace</span>(<span class="hljs-string">&#x27;-&#x27;</span>, <span class="hljs-string">&#x27;&#x27;</span>).<span class="hljs-title function_">split</span>(<span class="hljs-string">&#x27;.&#x27;</span>);
  <span class="hljs-keyword">const</span> grouped = integer.<span class="hljs-title function_">replace</span>(<span class="hljs-regexp">/\\B(?=(\\d{3})+(?!\\d))/g</span>, <span class="hljs-string">&#x27;,&#x27;</span>);
  <span class="hljs-keyword">return</span> sign + grouped + (decimal === <span class="hljs-literal">undefined</span> ? <span class="hljs-string">&#x27;&#x27;</span> : <span class="hljs-string">\`.<span class="hljs-subst">\${decimal}</span>\`</span>);
}

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">formatThousands</span>(<span class="hljs-number">1234567.89</span>)); <span class="hljs-comment">// 1,234,567.89</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">formatThousands</span>(-<span class="hljs-number">1234</span>)); <span class="hljs-comment">// -1,234</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">formatThousands</span>(<span class="hljs-number">123</span>)); <span class="hljs-comment">// 123</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">formatThousands</span>(<span class="hljs-number">0.12345</span>)); <span class="hljs-comment">// 0.12345</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">formatThousands</span>(<span class="hljs-string">&#x27;12345678901234567890&#x27;</span>)); <span class="hljs-comment">// 12,345,678,901,234,567,890</span>
</code></pre></div>
<p>正则 <code>\\B(?=(\\d{3})+(?!\\d))</code> 怎么理解？它匹配的不是字符，而是字符之间的位置。<code>(?=...)</code> 是先行断言，表示“后面要满足某个条件”但不吃掉字符。条件是 <code>(\\d{3})+(?!\\d)</code>：后面紧跟一组或多组三位数字，并且再往后不能还有数字，也就是正好到整数结尾。<code>\\B</code> 要求这个位置不在数字串的开头，否则 <code>123456</code> 会在最前面多出一个逗号，变成 <code>,123,456</code>。</p>
<p>为什么要先拆出小数部分？如果对 <code>1234.5678</code> 整体执行替换，小数点后的 <code>5678</code> 也是数字串，它前面会被插入逗号，变成 <code>1,234.5,678</code>。所以只对整数部分处理。</p>
<p>最后一个例子传的是字符串。如果写成数字 <code>12345678901234567890</code>，它早就超出了安全整数范围，变成 <code>String</code> 后是 <code>12345678901234567000</code>，精度在进入函数前已经丢了。原因见<a href="/questions/alg-big-number-add/">《怎样手写大数相加？为什么 JS 的大整数会算错？》</a>。</p>
<h2>常见追问</h2>
<p><strong>不用正则怎么写？</strong></p>
<blockquote>
<p>从整数部分的末尾开始，每次 <code>slice</code> 出三位放进数组的开头，直到剩下不足三位，再把剩下的部分也放进去，最后 <code>join(&#x27;,&#x27;)</code>。思路和列竖式一样，从低位往高位处理。</p>
</blockquote>
<p><strong><code>toFixed</code> 和 <code>Intl.NumberFormat</code> 的小数舍入一样吗？</strong></p>
<blockquote>
<p>不完全一样。<code>toFixed</code> 基于数字的二进制近似值舍入，<code>(1.005).toFixed(2)</code> 得到 <code>&#x27;1.00&#x27;</code>，因为 1.005 实际存的值略小于 1.005。金额计算最好先换成以分为单位的整数，展示时再格式化。</p>
</blockquote>`};export{e as default};