var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>在控制台输入 <code>0.1 + 0.2</code>，得到的是 <code>0.30000000000000004</code>，所以它和 <code>0.3</code> 不相等。</p>
<p>原因是 JavaScript 的 <code>Number</code> 是 IEEE 754 双精度二进制浮点数。十进制的 0.1 换成二进制是无限循环小数，只能存一个最接近的近似值，0.2、0.3 也一样。两个近似值相加，结果恰好不是 0.3 的那个近似值。这不是 JavaScript 独有的问题，用同样格式的语言都会这样。</p>
<p>解决办法看场景。判断相等时比较差值是否在一个很小的范围内，比如 <code>Number.EPSILON</code>；金额这类要求精确的，换成“分”这样的整数来算；只是显示时，用 <code>toFixed</code> 或 <code>Intl.NumberFormat</code> 格式化。</p>
<p>要注意 <code>toFixed</code> 只是按存储的真实值格式化，结果是字符串，也不能保证按十进制四舍五入。要做大量精确的十进制运算，用专门的十进制库更稳妥。</p>
</blockquote>
<h2>存进去的 0.1 到底是多少</h2>
<p><code>toPrecision</code> 可以让数字多显示几位，看到它真实存储的值。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-number">0.1</span> + <span class="hljs-number">0.2</span>); <span class="hljs-comment">// 0.30000000000000004</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>((<span class="hljs-number">0.1</span>).<span class="hljs-title function_">toPrecision</span>(<span class="hljs-number">21</span>)); <span class="hljs-comment">// 0.100000000000000005551</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">Math</span>.<span class="hljs-title function_">abs</span>(<span class="hljs-number">0.1</span> + <span class="hljs-number">0.2</span> - <span class="hljs-number">0.3</span>) &lt; <span class="hljs-title class_">Number</span>.<span class="hljs-property">EPSILON</span>); <span class="hljs-comment">// true</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>((<span class="hljs-number">10</span> + <span class="hljs-number">20</span>) / <span class="hljs-number">100</span> === <span class="hljs-number">0.3</span>); <span class="hljs-comment">// true</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">Number</span>((<span class="hljs-number">0.1</span> + <span class="hljs-number">0.2</span>).<span class="hljs-title function_">toFixed</span>(<span class="hljs-number">10</span>)) === <span class="hljs-number">0.3</span>); <span class="hljs-comment">// true</span>
</code></pre></div>
<p>平时打印 <code>0.1</code> 显示的是 <code>0.1</code>，为什么第二行多出一串尾巴？因为数字转字符串时，引擎会输出“能唯一还原这个值的最短十进制”，0.1 的近似值最短就写成 <code>0.1</code>。可是多要几位，就能看到它实际比 0.1 大一点点。</p>
<p>0.1 和 0.2 都偏大一点，加起来的误差比 0.3 自己的近似值误差更大，最终落在了另一个可表示的数上，最短写法就是 <code>0.30000000000000004</code>。</p>
<h2>比较时怎样容忍误差</h2>
<p>第三行用差值和 <code>Number.EPSILON</code> 比较。MDN 对它的定义是 1 和大于 1 的最小浮点数之间的差。它适合比较 1 附近的数，数值很大时误差也会变大，要按比例放大容差：<code>Math.abs(a - b) &lt;= Number.EPSILON * Math.max(Math.abs(a), Math.abs(b))</code>。</p>
<h2>计算金额怎样避免误差</h2>
<p>第四行先把元换成分，用整数 10 和 20 相加，最后才除以 100。整数在安全范围内可以精确表示和相加，所以不会有误差，安全范围见<a href="/questions/js-number-bigint/">《安全整数是什么？什么时候要用 BigInt？》</a>。实际项目里，价格从接口拿到时就用“分”这样的整数，所有加减乘都在整数上做，只在展示时转成元。</p>
<p>第五行是另一种常见的补救：先用 <code>toFixed(10)</code> 截到 10 位小数再转回数字，把末尾的误差抹掉。它能应付展示和简单比较，但 <code>toFixed</code> 返回的是字符串，舍入也是按存储值做的，比如 <code>(1.005).toFixed(2)</code> 得到 <code>&#x27;1.00&#x27;</code>，所以不能当作精确计算方案。</p>
<h2>常见追问</h2>
<p><strong>为什么 0.1 + 0.3 等于 0.4，没有出问题？</strong></p>
<blockquote>
<p>因为它们的近似值误差相加后，正好落在 0.4 的那个近似值上，打印出来就是 <code>0.4</code>。是否“看起来正确”取决于具体数字，不能因为某次结果对了就认为浮点运算是精确的。</p>
</blockquote>
<p><strong>BigInt 能解决小数精度问题吗？</strong></p>
<blockquote>
<p>不能。BigInt 只表示整数。可以把金额放大成整数后用 BigInt 计算，处理超过安全整数范围的大金额，但小数部分的换算规则要自己定好。</p>
</blockquote>`};export{e as default};