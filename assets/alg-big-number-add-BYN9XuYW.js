var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>后端返回一个订单 ID <code>9007199254740993</code>，前端拿到后变成了 <code>9007199254740992</code>，这就是大数精度问题。JS 的数字用 64 位双精度浮点数表示，能精确表示的整数最大是 <code>Number.MAX_SAFE_INTEGER</code>，也就是 2^53 - 1，即 <code>9007199254740991</code>。超过这个值，相邻的整数有些无法区分，就会被舍入到最近的能表示的值。</p>
<p>所以长 ID 这类数据应该由后端以字符串返回。需要计算时，一种做法是手写字符串加法，像小学列竖式一样：两个字符串从最后一位开始，逐位相加，再加上上一位的进位，结果对 10 取余是这一位，除以 10 取整是新的进位；全部加完如果还有进位，前面再补一个 1。</p>
<p>现代浏览器和 Node 都支持 <code>BigInt</code>，写 <code>9007199254740993n</code> 或者 <code>BigInt(&#x27;9007199254740993&#x27;)</code>，可以精确表示任意大的整数，直接相加即可。</p>
<p>要注意，<code>BigInt</code> 不能和普通数字混着算，<code>1n + 1</code> 会抛 <code>TypeError</code>，必须先统一类型。<code>JSON.parse</code> 遇到大数字也会先按 Number 解析，精度在进入你的代码之前就已经丢了，所以光有 BigInt 还不够，传输时仍要用字符串。</p>
</blockquote>
<h2>手写字符串相加</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">addStrings</span>(<span class="hljs-params">a, b</span>) {
  <span class="hljs-keyword">let</span> i = a.<span class="hljs-property">length</span> - <span class="hljs-number">1</span>;
  <span class="hljs-keyword">let</span> j = b.<span class="hljs-property">length</span> - <span class="hljs-number">1</span>;
  <span class="hljs-keyword">let</span> carry = <span class="hljs-number">0</span>;
  <span class="hljs-keyword">const</span> digits = [];
  <span class="hljs-keyword">while</span> (i &gt;= <span class="hljs-number">0</span> || j &gt;= <span class="hljs-number">0</span> || carry &gt; <span class="hljs-number">0</span>) {
    <span class="hljs-keyword">const</span> sum = (i &gt;= <span class="hljs-number">0</span> ? <span class="hljs-title class_">Number</span>(a[i]) : <span class="hljs-number">0</span>) + (j &gt;= <span class="hljs-number">0</span> ? <span class="hljs-title class_">Number</span>(b[j]) : <span class="hljs-number">0</span>) + carry;
    digits.<span class="hljs-title function_">push</span>(sum % <span class="hljs-number">10</span>);
    carry = <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">floor</span>(sum / <span class="hljs-number">10</span>);
    i--;
    j--;
  }
  <span class="hljs-keyword">return</span> digits.<span class="hljs-title function_">reverse</span>().<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;&#x27;</span>);
}

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-number">9007199254740993</span>); <span class="hljs-comment">// 9007199254740992</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">addStrings</span>(<span class="hljs-string">&#x27;9007199254740991&#x27;</span>, <span class="hljs-string">&#x27;2&#x27;</span>)); <span class="hljs-comment">// 9007199254740993</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">addStrings</span>(<span class="hljs-string">&#x27;999&#x27;</span>, <span class="hljs-string">&#x27;1&#x27;</span>)); <span class="hljs-comment">// 1000</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">addStrings</span>(<span class="hljs-string">&#x27;0&#x27;</span>, <span class="hljs-string">&#x27;0&#x27;</span>)); <span class="hljs-comment">// 0</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>((<span class="hljs-title class_">BigInt</span>(<span class="hljs-string">&#x27;9007199254740991&#x27;</span>) + <span class="hljs-number">2n</span>).<span class="hljs-title function_">toString</span>()); <span class="hljs-comment">// 9007199254740993</span>
</code></pre></div>
<p>第一行直接写数字字面量 <code>9007199254740993</code>，打印出来却是 <code>...992</code>。这说明精度不是在计算时丢的，而是在把它变成 Number 的那一刻就丢了。</p>
<p>循环条件为什么要包含 <code>carry &gt; 0</code>？看 <code>999 + 1</code>：三位都加完以后，进位还是 1，如果只判断 <code>i</code>、<code>j</code>，最前面那个 1 就丢了，结果会变成 <code>000</code>。</p>
<p>两个字符串长度不同时，短的那个读完以后按 0 处理，所以 <code>i &gt;= 0 ? ... : 0</code> 不能省。结果是从低位往高位 <code>push</code> 的，最后要 <code>reverse</code> 一次。</p>
<h2>小数为什么也会算错</h2>
<p><code>0.1 + 0.2</code> 得到 <code>0.30000000000000004</code>，原因类似：0.1 在二进制里是无限循环小数，只能存一个近似值，两个近似值相加，误差就显露出来了。金额计算一般换算成“分”这样的整数来算，或者用专门的十进制库；比较两个小数是否相等时，用差值小于 <code>Number.EPSILON</code> 这类容差来判断。更多边界见<a href="/questions/js-number-bigint/">《浮点精度、安全整数和 BigInt 有哪些边界？》</a>。</p>
<h2>常见追问</h2>
<p><strong>接口返回的大数字已经是 Number 了，前端还能救回来吗？</strong></p>
<blockquote>
<p>如果用的是默认的 <code>JSON.parse</code>，解析完就已经丢了，救不回来。可以让后端改成字符串，或者用支持大数的 JSON 解析库，比如 json-bigint，在解析时直接读取原始文本。</p>
</blockquote>
<p><strong>大数相乘怎么写？</strong></p>
<blockquote>
<p>同样模拟竖式：开一个长度为两个数位数之和的数组，第 i 位乘第 j 位的结果累加到第 i + j + 1 位上，最后统一处理进位，再去掉开头多余的 0。</p>
</blockquote>`};export{e as default};