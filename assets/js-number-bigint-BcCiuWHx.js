var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>JavaScript 的 <code>Number</code> 是 64 位双精度浮点数，用二进制存小数。<code>0.1</code>、<code>0.2</code> 这样的十进制小数，在二进制里是无限循环的，只能存个近似值，所以 <code>0.1 + 0.2 !== 0.3</code>。</p>
<p>整数也有上限。能精确表示的范围是正负 <code>2^53 - 1</code>，也就是 <code>Number.MAX_SAFE_INTEGER</code>，超过以后，相邻的两个整数可能变成同一个值。可以用 <code>Number.isSafeInteger</code> 检查。</p>
<p>需要更大的整数时用 <code>BigInt</code>，写成 <code>123n</code>，它能精确表示任意大的整数。但它不能和 <code>Number</code> 混在一起算，会抛 <code>TypeError</code>；除法会把小数部分直接去掉；<code>JSON.stringify</code> 遇到它也会报错，所以后端返回的大整数 ID 应该用字符串传。</p>
<p>金额计算最好用“分”这类最小单位的整数来算，或者用十进制库，显示的时候再格式化。</p>
</blockquote>
<h2>为什么 0.1 + 0.2 不等于 0.3</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-number">0.1</span> + <span class="hljs-number">0.2</span> === <span class="hljs-number">0.3</span>); <span class="hljs-comment">// false</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-number">9007199254740991n</span> + <span class="hljs-number">2n</span>); <span class="hljs-comment">// 9007199254740993n</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-number">5n</span> / <span class="hljs-number">2n</span>); <span class="hljs-comment">// 2n</span>
</code></pre></div>
<p>第一行是 <code>false</code>，因为 <code>0.1</code> 和 <code>0.2</code> 存进去时都有一点点误差，加起来误差也加上了。打印出来就能看到：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-number">0.1</span> + <span class="hljs-number">0.2</span>); <span class="hljs-comment">// 0.30000000000000004</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-number">2</span> ** <span class="hljs-number">53</span> === <span class="hljs-number">2</span> ** <span class="hljs-number">53</span> + <span class="hljs-number">1</span>); <span class="hljs-comment">// true</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">Math</span>.<span class="hljs-title function_">abs</span>(<span class="hljs-number">0.1</span> + <span class="hljs-number">0.2</span> - <span class="hljs-number">0.3</span>) &lt; <span class="hljs-title class_">Number</span>.<span class="hljs-property">EPSILON</span>); <span class="hljs-comment">// true</span>
</code></pre></div>
<p>第二行说明整数也会出问题。<code>2 ** 53</code> 和 <code>2 ** 53 + 1</code> 居然相等，因为超过安全范围以后，浮点数已经没有足够的位来区分相邻的整数了。上面例子里的 BigInt <code>9007199254740991n + 2n</code> 就能精确得到 <code>9007199254740993n</code>，换成 Number 就算不准了。</p>
<p>比较小数时，常见做法是看差值是否足够小，比如第三行用 <code>Number.EPSILON</code>。它是 1 和比 1 大的下一个可表示数之间的差，只适合比较大小在 1 附近的数。数值比较大时，误差也跟着变大，要用相对误差：<code>Math.abs(a - b) &lt;= Number.EPSILON * Math.max(Math.abs(a), Math.abs(b))</code>。</p>
<h2>toFixed 为什么没有四舍五入</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>((<span class="hljs-number">1.005</span>).<span class="hljs-title function_">toFixed</span>(<span class="hljs-number">2</span>)); <span class="hljs-comment">// 1.00</span>
</code></pre></div>
<p>按四舍五入应该是 1.01，结果却是 1.00。因为 <code>1.005</code> 实际存储的值比 1.005 略小一点，<code>toFixed</code> 按存储的真实值来舍入，自然得到 1.00。所以不要把 <code>toFixed</code> 当四舍五入工具。界面显示用 <code>Intl.NumberFormat</code>，计算时换成整数单位。</p>
<h2>BigInt 有哪些规则</h2>
<table><thead><tr><th>操作</th><th>结果</th></tr></thead><tbody><tr><td><code>1n + 1</code></td><td><code>TypeError</code></td></tr><tr><td><code>5n / 2n</code></td><td><code>2n</code>，向零截断</td></tr><tr><td><code>1n == 1</code> / <code>1n === 1</code></td><td><code>true</code> / <code>false</code></td></tr><tr><td><code>typeof 1n</code></td><td><code>&#x27;bigint&#x27;</code></td></tr><tr><td><code>Math.max(1n)</code></td><td><code>TypeError</code></td></tr><tr><td><code>JSON.stringify({ a: 1n })</code></td><td><code>TypeError</code></td></tr></tbody></table>
<p>BigInt 和 Number 不能混算，是为了避免偷偷丢精度，必须由你明确转换。除法“向零截断”就是直接去掉小数部分，<code>5n / 2n</code> 是 <code>2n</code>。<code>Math</code> 上的方法也不接受 BigInt。</p>
<p>转换时也要小心。<code>BigInt(&#x27;9007199254740993&#x27;)</code> 从字符串解析，能拿到精确值；<code>BigInt(1.5)</code> 不是整数，会抛 <code>RangeError</code>；<code>Number(big)</code> 把 BigInt 转回数字，可能会丢精度。</p>
<h2>接口返回的大整数 ID 为什么变了</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-title class_">JSON</span>.<span class="hljs-title function_">parse</span>(<span class="hljs-string">&#x27;{&quot;id&quot;:9007199254740993}&#x27;</span>).<span class="hljs-property">id</span>; <span class="hljs-comment">// 9007199254740992</span>
</code></pre></div>
<p>后端返回的 ID 是 <code>9007199254740993</code>，解析出来却是 <code>9007199254740992</code>。因为 <code>JSON.parse</code> 会把数字直接转成 Number，超出安全范围的那一刻精度就丢了，之后再怎么处理都找不回来。</p>
<p>解决办法是让后端把 ID 用字符串返回。另外 ES2026 给 <code>JSON.parse</code> 加了读取原始文本的能力，reviver 函数的第三个参数 <code>context.source</code> 能拿到数字的原始文本，用之前要确认目标运行环境支持。</p>
<h2>金额怎样算才准</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> cents = [<span class="hljs-number">1999</span>, <span class="hljs-number">1</span>].<span class="hljs-title function_">reduce</span>(<span class="hljs-function">(<span class="hljs-params">sum, value</span>) =&gt;</span> sum + value, <span class="hljs-number">0</span>); <span class="hljs-comment">// 2000</span>
<span class="hljs-keyword">const</span> text = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">NumberFormat</span>(<span class="hljs-string">&#x27;zh-CN&#x27;</span>, {
  <span class="hljs-attr">style</span>: <span class="hljs-string">&#x27;currency&#x27;</span>,
  <span class="hljs-attr">currency</span>: <span class="hljs-string">&#x27;CNY&#x27;</span>,
}).<span class="hljs-title function_">format</span>(cents / <span class="hljs-number">100</span>); <span class="hljs-comment">// ¥20.00</span>
</code></pre></div>
<p>19.99 元加 0.01 元，存成 1999 分和 1 分，整数相加不会有误差。只在最后显示时除以 100，交给 <code>Intl.NumberFormat</code> 格式化。</p>
<p>如果涉及汇率、税率这类小数乘除，要先定好舍入规则，再用 decimal.js 这样的十进制库，或者用 BigInt 按最小单位计算，自己处理除不尽的余数怎么分摊。</p>
<h2>常见追问</h2>
<p><strong>为什么 <code>0.5 + 0.25</code> 是精确的？</strong></p>
<blockquote>
<p>因为 0.5 是 2 的负一次方，0.25 是 2 的负二次方，二进制能精确表示，存进去没有误差。</p>
</blockquote>
<p><strong><code>-0</code> 有什么用？</strong></p>
<blockquote>
<p><code>-0 === 0</code> 是 <code>true</code>，但 <code>Object.is(-0, 0)</code> 是 <code>false</code>，<code>1 / -0</code> 是 <code>-Infinity</code>。它保留了方向信息，比如一个数从负方向趋近 0。</p>
</blockquote>`};export{e as default};