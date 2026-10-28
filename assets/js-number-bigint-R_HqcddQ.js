var e={answerHtml:`<p>JavaScript 的 Number 采用 IEEE 754 双精度二进制浮点表示。它能覆盖很大的数值范围，但可用于表示有效数字的位数有限；许多十进制小数在二进制中无法有限展开，只能保存一个邻近值。</p>
<p>因此问题不只是“计算很大的数会出错”，普通的小数计算也可能在精确比较时出现差异：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-number">0.1</span> + <span class="hljs-number">0.2</span> === <span class="hljs-number">0.3</span>); <span class="hljs-comment">// false</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-number">9007199254740991n</span> + <span class="hljs-number">2n</span>); <span class="hljs-comment">// 9007199254740993n</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-number">5n</span> / <span class="hljs-number">2n</span>); <span class="hljs-comment">// 2n</span>
</code></pre></div>
<p>第一行是浮点舍入导致的可观察结果；后两行使用 BigInt 精确处理整数，但除法结果截断为整数，并不会自动得到 2.5。这是两种数值模型的取舍，不是给 Number 加一个 n 就能解决全部数学问题。</p>
<h3>0.1 + 0.2 为什么不能直接精确等于 0.3</h3>
<p>0.1、0.2 与 0.3 都需要按二进制浮点规则表示。操作数各自的近似，再经过加法与舍入，得到的数值与字面量 0.3 所对应的近似值并不相同。</p>
<p>这种差异不意味着所有小数都无法精确表示，例如 0.5、0.25 这类以二的幂为分母的数可以精确表示。也不意味着每一次计算都会产生可见的误差，具体取决于数值与运算过程。</p>
<p><code>toFixed(2)</code> 可以把结果格式化成两位小数的字符串，适合展示，但不能把底层数值模型变成十进制精确计算。把格式化结果再 Number 一次，也只是重新得到一个 Number。</p>
<h3>Number.EPSILON 不是万能比较阈值</h3>
<p>Number.EPSILON 表示 1 与大于 1 的最小可表示 Number 之间的间隔。数值越大，相邻可表示值之间的绝对距离通常也越大，所以不能要求所有数量级都用同一个 EPSILON 判断误差。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> actual = <span class="hljs-number">0.1</span> + <span class="hljs-number">0.2</span>;
<span class="hljs-keyword">const</span> expected = <span class="hljs-number">0.3</span>;
<span class="hljs-keyword">const</span> absoluteTolerance = <span class="hljs-number">1e-12</span>;
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">Math</span>.<span class="hljs-title function_">abs</span>(actual - expected) &lt;= absoluteTolerance); <span class="hljs-comment">// true</span>
</code></pre></div>
<p>这个阈值只是本例明确接受的绝对误差，不是所有业务的标准。接近零的量常需要绝对误差限制，不同数量级的量也可能需要相对误差，常见思路是结合“绝对阈值”和“相对阈值乘数值尺度”。</p>
<p>真实选择还取决于单位：地理距离、动画坐标和账户金额不能使用同一套随意设定的容差。NaN、Infinity、极大数差值溢出等情况也要单独处理，不能把一个简单比较函数宣传为适用于所有数值的通用正确性判断。</p>
<h3>安全整数不是最大能表示的数</h3>
<p>Number.MAX_SAFE_INTEGER 是 2 的 53 次方减 1，也就是 9007199254740991。安全整数范围内的整数可以被精确表示，并能与相邻整数保持可靠区分。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> limit = <span class="hljs-title class_">Number</span>.<span class="hljs-property">MAX_SAFE_INTEGER</span>;
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(limit + <span class="hljs-number">1</span> === limit + <span class="hljs-number">2</span>); <span class="hljs-comment">// true</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">Number</span>.<span class="hljs-title function_">isSafeInteger</span>(limit + <span class="hljs-number">1</span>)); <span class="hljs-comment">// false</span>
</code></pre></div>
<p>超过安全范围后，并不是每个整数都立即无法表示。某些值仍能表示，但相邻整数可能落到同一个 Number 上，作为 ID、计数或金额时就可能发生碰撞。</p>
<p>Number.MAX_VALUE 描述的是更大的有限数值范围，不能替代 MAX_SAFE_INTEGER；Number.isInteger 也只判断当前 Number 是否具有整数值，不能保证原输入在转换过程中没有丢失精度。需要安全整数时使用 Number.isSafeInteger，并确保输入进入 Number 之前也符合要求。</p>
<h3>BigInt 要从没有丢失精度的数据创建</h3>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">BigInt</span>(<span class="hljs-number">9007199254740993</span>)); <span class="hljs-comment">// 9007199254740992n</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">BigInt</span>(<span class="hljs-string">&#x27;9007199254740993&#x27;</span>)); <span class="hljs-comment">// 9007199254740993n</span>
</code></pre></div>
<p>第一行的数字字面量先变成 Number，已经无法准确表示原本想写的整数；之后转成 BigInt，只能精确保存那个已经舍入的值，不能恢复丢掉的信息。</p>
<p>大整数 ID 从接口进入前端时，通常应直接以字符串传输并保留，确需整数运算时再转 BigInt。若普通 JSON 数字先被解析为 Number，再转字符串或 BigInt，一般已经错过了保留精度的时机。ID 不需要算术时，保持字符串也更简单。</p>
<p>BigInt 可以处理很大的整数，但仍受内存、计算资源和实现限制。它不能存储小数，也不能直接与 Number 混用相应算术，例如 <code>1n + 1</code> 会抛 TypeError；Math 的多数 Number 运算接口也不接受 BigInt。需要跨类型转换时，应主动检查是否会截断或超出安全范围。</p>
<h3>金额可以用整数最小单位，但解析也必须准确</h3>
<p>如果业务明确只接受两位以内小数，可以从字符串直接构造整数分，而不是先把原字符串变成浮点元再乘 100：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">parseCents</span>(<span class="hljs-params">text</span>) {
  <span class="hljs-keyword">if</span> (<span class="hljs-keyword">typeof</span> text !== <span class="hljs-string">&#x27;string&#x27;</span>) {
    <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">TypeError</span>(<span class="hljs-string">&#x27;金额必须以十进制字符串提供&#x27;</span>);
  }
  <span class="hljs-keyword">const</span> match = <span class="hljs-regexp">/^(0|[1-9][0-9]*)(?:\\.([0-9]{1,2}))?$/</span>.<span class="hljs-title function_">exec</span>(text);
  <span class="hljs-keyword">if</span> (!match) <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">RangeError</span>(<span class="hljs-string">&#x27;请输入非负金额，最多两位小数&#x27;</span>);

  <span class="hljs-keyword">const</span> fraction = (match[<span class="hljs-number">2</span>] ?? <span class="hljs-string">&#x27;&#x27;</span>).<span class="hljs-title function_">padEnd</span>(<span class="hljs-number">2</span>, <span class="hljs-string">&#x27;0&#x27;</span>);
  <span class="hljs-keyword">return</span> <span class="hljs-title class_">BigInt</span>(match[<span class="hljs-number">1</span>]) * <span class="hljs-number">100n</span> + <span class="hljs-title class_">BigInt</span>(fraction);
}

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">parseCents</span>(<span class="hljs-string">&#x27;12.30&#x27;</span>)); <span class="hljs-comment">// 1230n</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">parseCents</span>(<span class="hljs-string">&#x27;0.05&#x27;</span>)); <span class="hljs-comment">// 5n</span>
</code></pre></div>
<p>这段示例的契约很窄：非负十进制，不带千位分隔符、空白或多余前导零，最多两位小数，不执行四舍五入。它不负责货币格式化，也不代表所有币种都有两位最小单位。输入长度与金额上限还应根据真实业务限制。</p>
<p>涉及税率、汇率、分摊或中间小数时，还要定义何时舍入、采用哪种舍入规则以及怎样处理尾差。可以使用适当的整数策略或可靠的十进制库，但不能只在最后补一个 EPSILON 就认为满足财务规则。</p>
<h3>整数分也要处理分摊余数</h3>
<p>100 分分给三份，不能每份都舍成 33 分后丢掉剩余 1 分。下面约定非负整数分，平均分配，余数按固定顺序加给前几份；这是一个明确的业务规则，不是所有结算场景通用的规则。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">splitCents</span>(<span class="hljs-params">total, count</span>) {
  <span class="hljs-keyword">if</span> (<span class="hljs-keyword">typeof</span> total !== <span class="hljs-string">&#x27;bigint&#x27;</span> || total &lt; <span class="hljs-number">0n</span>) <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">TypeError</span>(<span class="hljs-string">&#x27;总额必须为非负 BigInt 分&#x27;</span>);
  <span class="hljs-keyword">if</span> (!<span class="hljs-title class_">Number</span>.<span class="hljs-title function_">isSafeInteger</span>(count) || count &lt; <span class="hljs-number">1</span> || count &gt; <span class="hljs-number">10000</span>) {
    <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">RangeError</span>(<span class="hljs-string">&#x27;份数须为 1～10000 的整数&#x27;</span>);
  }
  <span class="hljs-keyword">const</span> parts = <span class="hljs-title class_">BigInt</span>(count);
  <span class="hljs-keyword">const</span> base = total / parts;
  <span class="hljs-keyword">const</span> remainder = total % parts;
  <span class="hljs-keyword">return</span> <span class="hljs-title class_">Array</span>.<span class="hljs-title function_">from</span>({ <span class="hljs-attr">length</span>: count }, <span class="hljs-function">(<span class="hljs-params">_, index</span>) =&gt;</span>
    base + (<span class="hljs-title class_">BigInt</span>(index) &lt; remainder ? <span class="hljs-number">1n</span> : <span class="hljs-number">0n</span>));
}

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">splitCents</span>(<span class="hljs-number">100n</span>, <span class="hljs-number">3</span>)); <span class="hljs-comment">// [34n, 33n, 33n]</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">splitCents</span>(<span class="hljs-number">2n</span>, <span class="hljs-number">3</span>)); <span class="hljs-comment">// [1n, 1n, 0n]</span>
</code></pre></div>
<p>输出之和严格等于原总额，各份最多相差 1 分。接收者顺序必须稳定，否则重试可能把余数分给另一个人；按比例分摊、负数退款、税费逐项舍入则需要另外定义规则。前端计算可用于预览，最终结算仍由服务端权威流程验证。</p>
<h3>序列化必须与服务端约定一致</h3>
<p>默认 JSON.stringify 不能直接序列化 BigInt，会抛出 TypeError。可以把明确的大整数或最小单位字段转成十进制字符串，再按接口约定还原；不要把所有看起来像数字的字符串无条件变成 BigInt，否则邮编、验证码等标识会被误处理。</p>
<p>使用 replacer、reviver 或库时，同样需要明确字段和类型协议。最重要的是从输入、存储、计算直到传输，都不要中途偷偷经过一个不能表达所需精度的 Number。</p>`};export{e as default};