var e={answerHtml:`<h2>简答</h2>
<ul>
<li><code>Number</code> 是 64 位双精度浮点数，<code>0.1</code>、<code>0.2</code> 等十进制小数无法精确表示，所以 <code>0.1 + 0.2 !== 0.3</code>。</li>
<li>安全整数范围是 <code>±(2^53 - 1)</code>，即 <code>Number.MAX_SAFE_INTEGER</code>；超出后相邻整数可能变成同一个值，用 <code>Number.isSafeInteger</code> 检查。</li>
<li><code>BigInt</code> 精确表示任意大小整数，写作 <code>123n</code>；与 <code>Number</code> 混合算术抛 <code>TypeError</code>，除法向零截断。</li>
<li><code>JSON.stringify</code> 遇到 BigInt 抛错，后端返回的大整数 ID 应以字符串传输。</li>
<li>金额用&quot;分&quot;等最小单位整数计算，或使用十进制库；显示时再格式化。</li>
</ul>
<h2>示例</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-number">0.1</span> + <span class="hljs-number">0.2</span> === <span class="hljs-number">0.3</span>); <span class="hljs-comment">// false</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-number">9007199254740991n</span> + <span class="hljs-number">2n</span>); <span class="hljs-comment">// 9007199254740993n</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-number">5n</span> / <span class="hljs-number">2n</span>); <span class="hljs-comment">// 2n</span>
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-number">0.1</span> + <span class="hljs-number">0.2</span>); <span class="hljs-comment">// 0.30000000000000004</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-number">2</span> ** <span class="hljs-number">53</span> === <span class="hljs-number">2</span> ** <span class="hljs-number">53</span> + <span class="hljs-number">1</span>); <span class="hljs-comment">// true</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">Math</span>.<span class="hljs-title function_">abs</span>(<span class="hljs-number">0.1</span> + <span class="hljs-number">0.2</span> - <span class="hljs-number">0.3</span>) &lt; <span class="hljs-title class_">Number</span>.<span class="hljs-property">EPSILON</span>); <span class="hljs-comment">// true</span>
</code></pre></div>
<p><code>Number.EPSILON</code> 是 1 与下一个可表示数的差，只适合比较接近 1 的数。数值较大时应使用相对误差：<code>Math.abs(a - b) &lt;= Number.EPSILON * Math.max(Math.abs(a), Math.abs(b))</code>。</p>
<h2>toFixed 不是四舍五入工具</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>((<span class="hljs-number">1.005</span>).<span class="hljs-title function_">toFixed</span>(<span class="hljs-number">2</span>)); <span class="hljs-comment">// 1.00</span>
</code></pre></div>
<p><code>1.005</code> 实际存储的值略小于 1.005，所以结果是 <code>1.00</code>。界面显示用 <code>Intl.NumberFormat</code>，计算用整数单位。</p>
<h2>BigInt 的规则</h2>
<table><thead><tr><th>操作</th><th>结果</th></tr></thead><tbody><tr><td><code>1n + 1</code></td><td><code>TypeError</code></td></tr><tr><td><code>5n / 2n</code></td><td><code>2n</code>，向零截断</td></tr><tr><td><code>1n == 1</code> / <code>1n === 1</code></td><td><code>true</code> / <code>false</code></td></tr><tr><td><code>typeof 1n</code></td><td><code>&#x27;bigint&#x27;</code></td></tr><tr><td><code>Math.max(1n)</code></td><td><code>TypeError</code></td></tr><tr><td><code>JSON.stringify({ a: 1n })</code></td><td><code>TypeError</code></td></tr></tbody></table>
<p>转换时 <code>BigInt(&#x27;9007199254740993&#x27;)</code> 可以精确解析字符串；<code>BigInt(1.5)</code> 抛 <code>RangeError</code>；<code>Number(big)</code> 可能丢精度。</p>
<h2>接口里的大整数 ID</h2>
<p><code>JSON.parse(&#x27;{&quot;id&quot;:9007199254740993}&#x27;)</code> 得到的 <code>id</code> 已经是 <code>9007199254740992</code>。解决方式是让后端以字符串返回 ID。ES2026 的 <code>JSON.parse</code> 源文本访问（reviver 的第三个参数 <code>context.source</code>）可以读取原始数字文本，使用前需确认目标运行时支持。</p>
<h2>金额计算</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> cents = [<span class="hljs-number">1999</span>, <span class="hljs-number">1</span>].<span class="hljs-title function_">reduce</span>(<span class="hljs-function">(<span class="hljs-params">sum, value</span>) =&gt;</span> sum + value, <span class="hljs-number">0</span>); <span class="hljs-comment">// 2000</span>
<span class="hljs-keyword">const</span> text = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">NumberFormat</span>(<span class="hljs-string">&#x27;zh-CN&#x27;</span>, {
  <span class="hljs-attr">style</span>: <span class="hljs-string">&#x27;currency&#x27;</span>,
  <span class="hljs-attr">currency</span>: <span class="hljs-string">&#x27;CNY&#x27;</span>,
}).<span class="hljs-title function_">format</span>(cents / <span class="hljs-number">100</span>); <span class="hljs-comment">// ¥20.00</span>
</code></pre></div>
<p>涉及汇率、税率等小数乘除时，需要明确舍入规则，使用 decimal.js 等十进制库，或用 BigInt 按最小单位计算并自行处理余数分摊。</p>
<h2>常见追问</h2>
<ul>
<li>为什么 <code>0.5 + 0.25</code> 是精确的？它们是 2 的负幂，二进制能精确表示。</li>
<li><code>-0</code> 有什么用？<code>Object.is(-0, 0)</code> 为 false，<code>1 / -0</code> 为 <code>-Infinity</code>，用于保留方向信息。</li>
</ul>`};export{e as default};