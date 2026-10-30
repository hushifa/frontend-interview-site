var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>后端返回一个 19 位的订单 ID，前端拿到后末几位变了，这就是撞上了安全整数的上限。</p>
<p>JavaScript 的 <code>Number</code> 是 64 位双精度浮点数，用来存有效数字的只有 53 位。所以能精确表示的整数范围是正负 <code>2^53 - 1</code>，也就是 <code>Number.MAX_SAFE_INTEGER</code>（9007199254740991）。超过以后，相邻的两个整数可能变成同一个值。可以用 <code>Number.isSafeInteger</code> 检查一个数是否在范围内。</p>
<p>需要更大的整数时用 <code>BigInt</code>，写成 <code>123n</code> 或 <code>BigInt(&#x27;123&#x27;)</code>，它能精确表示任意大的整数。但它不能和 <code>Number</code> 混在一起算，会抛 <code>TypeError</code>；除法会把小数部分直接去掉；<code>JSON.stringify</code> 遇到它也会报错。</p>
<p>所以接口里超出安全范围的 ID 应该用字符串传。小数为什么算不准是另一个问题，见<a href="/questions/js-float-precision/">《0.1 + 0.2 为什么不等于 0.3？怎么解决？》</a>。</p>
</blockquote>
<h2>超出安全范围会发生什么</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">Number</span>.<span class="hljs-title function_">isSafeInteger</span>(<span class="hljs-number">2</span> ** <span class="hljs-number">53</span>)); <span class="hljs-comment">// false</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-number">9007199254740991n</span> + <span class="hljs-number">2n</span>); <span class="hljs-comment">// 9007199254740993n</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-number">5n</span> / <span class="hljs-number">2n</span>); <span class="hljs-comment">// 2n</span>
</code></pre></div>
<p>第一行说明 <code>2 ** 53</code> 已经不是安全整数了。超过这个值以后，浮点数没有足够的位来区分相邻的整数，<code>2 ** 53 === 2 ** 53 + 1</code> 会得到 <code>true</code>。</p>
<p>第二行用 BigInt 从最大安全整数再加 2，精确得到 <code>9007199254740993n</code>。同样的运算换成 Number，结果会落到相邻的可表示值上，算不准。</p>
<p>第三行是 BigInt 的除法，结果向零截断，<code>5n / 2n</code> 是 <code>2n</code>，不会得到 2.5。</p>
<h2>BigInt 有哪些规则</h2>
<table><thead><tr><th>操作</th><th>结果</th></tr></thead><tbody><tr><td><code>1n + 1</code></td><td><code>TypeError</code></td></tr><tr><td><code>5n / 2n</code></td><td><code>2n</code>，向零截断</td></tr><tr><td><code>1n == 1</code> / <code>1n === 1</code></td><td><code>true</code> / <code>false</code></td></tr><tr><td><code>typeof 1n</code></td><td><code>&#x27;bigint&#x27;</code></td></tr><tr><td><code>Math.max(1n)</code></td><td><code>TypeError</code></td></tr><tr><td><code>JSON.stringify({ a: 1n })</code></td><td><code>TypeError</code></td></tr></tbody></table>
<p>BigInt 和 Number 不能混算，是为了避免偷偷丢精度，必须由你明确转换。<code>Math</code> 上的方法也不接受 BigInt。</p>
<p>转换时也要小心。<code>BigInt(&#x27;9007199254740993&#x27;)</code> 从字符串解析，能拿到精确值；<code>BigInt(9007199254740993)</code> 先写成了 Number 字面量，精度在进入 BigInt 之前就丢了；<code>BigInt(1.5)</code> 不是整数，会抛 <code>RangeError</code>；<code>Number(big)</code> 把 BigInt 转回数字，可能会丢精度。</p>
<h2>接口返回的大整数 ID 为什么变了</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-title class_">JSON</span>.<span class="hljs-title function_">parse</span>(<span class="hljs-string">&#x27;{&quot;id&quot;:9007199254740993}&#x27;</span>).<span class="hljs-property">id</span>; <span class="hljs-comment">// 9007199254740992</span>
</code></pre></div>
<p>后端返回的 ID 是 <code>9007199254740993</code>，解析出来却是 <code>9007199254740992</code>。因为 <code>JSON.parse</code> 会把数字直接转成 Number，超出安全范围的那一刻精度就丢了，之后再怎么处理都找不回来。</p>
<p>解决办法是让后端把 ID 用字符串返回，前端只把它当字符串比较和传递，需要运算时再 <code>BigInt(id)</code>。另外 ES2026 给 <code>JSON.parse</code> 加了读取原始文本的能力，reviver 函数的第三个参数 <code>context.source</code> 能拿到数字的原始文本，用之前要确认目标运行环境支持。</p>
<p>反过来，要把 BigInt 发给后端，<code>JSON.stringify</code> 会抛错。可以在 replacer 里把 BigInt 转成字符串，或者给 <code>BigInt.prototype</code> 定义 <code>toJSON</code>，前者影响范围更小。</p>
<h2>常见追问</h2>
<p><strong><code>Number.MAX_SAFE_INTEGER</code> 和 <code>Number.MAX_VALUE</code> 有什么区别？</strong></p>
<blockquote>
<p><code>MAX_SAFE_INTEGER</code> 是能精确表示每一个整数的上限，约 9 × 10^15。<code>MAX_VALUE</code> 是 Number 能表示的最大值，约 1.8 × 10^308，但在那么大的范围里，相邻可表示数之间隔得很远，大部分整数都存不准。</p>
</blockquote>
<p><strong>BigInt 能用来算金额吗？</strong></p>
<blockquote>
<p>可以把金额换成“分”这样的最小单位整数后用 BigInt 算，适合超出安全范围的大金额。但它只表示整数，除不尽的部分会被截掉，舍入和分摊规则要自己定。</p>
</blockquote>`};export{e as default};