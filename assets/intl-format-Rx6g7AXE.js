var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>同一个 1234.5，美国写作 <code>1,234.5</code>，德国写作 <code>1.234,5</code>；印度写小数字时和美国一样，大数却会写成 <code>12,34,567</code>。手动拼逗号和小数点，只能照顾到其中一种习惯。所以日期、数字、金额和排序都交给 <code>Intl</code> 按 locale 处理。</p>
<p>金额要同时给出 locale 和货币代码。locale 决定怎么写，货币决定用什么符号、默认几位小数。格式化不会做汇率换算。</p>
<p>日期的写法由 locale 决定，时区要另外指定，中文 locale 不会自动用中国时区。排序用 <code>Intl.Collator</code>，加上 <code>numeric: true</code>，<code>item2</code> 才会排在 <code>item10</code> 前面。</p>
<p>要注意，存储和接口里传的是数值、货币代码和语义明确的时间。格式化后的字符串只用来显示，不要再解析回来。</p>
</blockquote>
<h2>金额怎样格式化</h2>
<p>下面三种货币，写法各不相同。结果是 Node 22 实测的。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">NumberFormat</span>(<span class="hljs-string">&#x27;en-US&#x27;</span>, { <span class="hljs-attr">style</span>: <span class="hljs-string">&#x27;currency&#x27;</span>, <span class="hljs-attr">currency</span>: <span class="hljs-string">&#x27;USD&#x27;</span> }).<span class="hljs-title function_">format</span>(<span class="hljs-number">1234.5</span>); <span class="hljs-comment">// &#x27;$1,234.50&#x27;</span>
<span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">NumberFormat</span>(<span class="hljs-string">&#x27;de-DE&#x27;</span>, { <span class="hljs-attr">style</span>: <span class="hljs-string">&#x27;currency&#x27;</span>, <span class="hljs-attr">currency</span>: <span class="hljs-string">&#x27;EUR&#x27;</span> }).<span class="hljs-title function_">format</span>(<span class="hljs-number">1234.5</span>); <span class="hljs-comment">// &#x27;1.234,50 €&#x27;</span>
<span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">NumberFormat</span>(<span class="hljs-string">&#x27;zh-CN&#x27;</span>, { <span class="hljs-attr">style</span>: <span class="hljs-string">&#x27;currency&#x27;</span>, <span class="hljs-attr">currency</span>: <span class="hljs-string">&#x27;CNY&#x27;</span> }).<span class="hljs-title function_">format</span>(<span class="hljs-number">1234.5</span>); <span class="hljs-comment">// &#x27;¥1,234.50&#x27;</span>
<span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">NumberFormat</span>(<span class="hljs-string">&#x27;zh-CN&#x27;</span>, { <span class="hljs-attr">notation</span>: <span class="hljs-string">&#x27;compact&#x27;</span> }).<span class="hljs-title function_">format</span>(<span class="hljs-number">12345678</span>); <span class="hljs-comment">// &#x27;1235万&#x27;</span>
</code></pre></div>
<p>德国把符号放在后面，分隔符也和美国反过来。三种货币都自动补成了两位小数，这是货币默认的小数位。最后一行的紧凑写法，中文会用“万”作单位。</p>
<p>写测试时容易在欧元这一行栽跟头。<code>€</code> 前面那个空格是不换行空格，不是普通空格，直接拿普通空格比较会失败。</p>
<p>还有两件事 <code>NumberFormat</code> 不管。一是汇率：<code>currency</code> 只决定符号和小数位，金额要先按业务汇率换算好再格式化。二是计算精度：它只做显示时的舍入，金额计算要用最小货币单位的整数，或者十进制库，避免浮点误差。</p>
<h2>日期为什么要指定时区</h2>
<p>同一个瞬间，换个时区显示出来的日期可能都不一样。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> instant = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Date</span>(<span class="hljs-string">&#x27;2026-01-01T00:00:00Z&#x27;</span>);
<span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">DateTimeFormat</span>(<span class="hljs-string">&#x27;en-GB&#x27;</span>, {
  <span class="hljs-attr">dateStyle</span>: <span class="hljs-string">&#x27;short&#x27;</span>,
  <span class="hljs-attr">timeStyle</span>: <span class="hljs-string">&#x27;short&#x27;</span>,
  <span class="hljs-attr">timeZone</span>: <span class="hljs-string">&#x27;Asia/Shanghai&#x27;</span>,
}).<span class="hljs-title function_">format</span>(instant); <span class="hljs-comment">// &#x27;01/01/2026, 08:00&#x27;</span>

<span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">DateTimeFormat</span>(<span class="hljs-string">&#x27;zh-CN&#x27;</span>, { <span class="hljs-attr">dateStyle</span>: <span class="hljs-string">&#x27;long&#x27;</span>, <span class="hljs-attr">timeZone</span>: <span class="hljs-string">&#x27;UTC&#x27;</span> }).<span class="hljs-title function_">format</span>(instant); <span class="hljs-comment">// &#x27;2026年1月1日&#x27;</span>
</code></pre></div>
<p>locale 管的是“日月年怎么排”，时区管的是“现在是几点”，两者互不影响。所以上面英式写法配上海时区，中文写法配 UTC，都是合法的组合。</p>
<p>SSR 时一定要显式传 <code>timeZone</code>。服务端默认常是 UTC，浏览器用的是本地时区，不指定的话两边渲染出来的文字不同，水合会对不上。时区怎样建模，见<a href="/questions/intl-timezones/">《时间戳、时区和只有日期的业务值应该怎样区分？》</a>。</p>
<h2>排序为什么不能直接 sort</h2>
<p>先看默认的 <code>sort()</code> 和 <code>Collator</code> 的差别。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js">[<span class="hljs-string">&#x27;item10&#x27;</span>, <span class="hljs-string">&#x27;item2&#x27;</span>, <span class="hljs-string">&#x27;item1&#x27;</span>].<span class="hljs-title function_">sort</span>(); <span class="hljs-comment">// [&#x27;item1&#x27;, &#x27;item10&#x27;, &#x27;item2&#x27;]</span>
[<span class="hljs-string">&#x27;item10&#x27;</span>, <span class="hljs-string">&#x27;item2&#x27;</span>, <span class="hljs-string">&#x27;item1&#x27;</span>].<span class="hljs-title function_">sort</span>(<span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">Collator</span>(<span class="hljs-string">&#x27;en&#x27;</span>, { <span class="hljs-attr">numeric</span>: <span class="hljs-literal">true</span> }).<span class="hljs-property">compare</span>);
<span class="hljs-comment">// [&#x27;item1&#x27;, &#x27;item2&#x27;, &#x27;item10&#x27;]</span>

[<span class="hljs-string">&#x27;a&#x27;</span>, <span class="hljs-string">&#x27;B&#x27;</span>, <span class="hljs-string">&#x27;c&#x27;</span>, <span class="hljs-string">&#x27;Ä&#x27;</span>].<span class="hljs-title function_">sort</span>(<span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">Collator</span>(<span class="hljs-string">&#x27;de&#x27;</span>).<span class="hljs-property">compare</span>); <span class="hljs-comment">// [&#x27;a&#x27;, &#x27;Ä&#x27;, &#x27;B&#x27;, &#x27;c&#x27;]</span>
[<span class="hljs-string">&#x27;张三&#x27;</span>, <span class="hljs-string">&#x27;李四&#x27;</span>, <span class="hljs-string">&#x27;王五&#x27;</span>, <span class="hljs-string">&#x27;阿明&#x27;</span>].<span class="hljs-title function_">sort</span>(<span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">Collator</span>(<span class="hljs-string">&#x27;zh-CN&#x27;</span>).<span class="hljs-property">compare</span>);
<span class="hljs-comment">// [&#x27;阿明&#x27;, &#x27;李四&#x27;, &#x27;王五&#x27;, &#x27;张三&#x27;]，按拼音</span>
</code></pre></div>
<p>默认的 <code>sort()</code> 把 <code>item10</code> 排在 <code>item2</code> 前面，因为它按 UTF-16 码元一个字符一个字符地比，<code>1</code> 比 <code>2</code> 小就排前面了。按同样的道理，大写字母会排在所有小写字母前面。<code>Collator</code> 按语言习惯比较，加了 <code>numeric: true</code> 还会把数字当数值看。</p>
<p><code>Collator</code> 还有个 <code>sensitivity</code> 选项。设成 <code>&#x27;base&#x27;</code> 时，<code>a</code> 和 <code>Á</code> 比较结果为 0，被当成同一个字母。这适合做搜索匹配，但不适合判断账号是否重复。</p>
<h2>想给某一部分加样式怎么办</h2>
<p>比如只想把货币符号变小一点，可以用 <code>formatToParts()</code>。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">NumberFormat</span>(<span class="hljs-string">&#x27;en-US&#x27;</span>, { <span class="hljs-attr">style</span>: <span class="hljs-string">&#x27;currency&#x27;</span>, <span class="hljs-attr">currency</span>: <span class="hljs-string">&#x27;USD&#x27;</span> }).<span class="hljs-title function_">formatToParts</span>(<span class="hljs-number">1234.5</span>);
<span class="hljs-comment">// [{ type: &#x27;currency&#x27;, value: &#x27;$&#x27; }, { type: &#x27;integer&#x27;, value: &#x27;1&#x27; }, { type: &#x27;group&#x27;, value: &#x27;,&#x27; }, ...]</span>
</code></pre></div>
<p>它把结果拆成带类型的几段，按 <code>type</code> 找到货币符号单独渲染就行。不要用 <code>split(&#x27;,&#x27;)</code> 去拆字符串，换个 locale 分隔符就变了。</p>
<p>另外，大量格式化时要复用同一个 formatter 实例。创建实例的开销比调用 <code>format()</code> 大得多。</p>
<h2>常见追问</h2>
<p><strong><code>toLocaleString()</code> 和 <code>Intl.NumberFormat</code> 有什么区别？</strong></p>
<blockquote>
<p>结果是一样的。区别在于 <code>toLocaleString()</code> 每次调用都要重新处理选项，循环里格式化大量数据时，复用一个 <code>Intl.NumberFormat</code> 实例会更快。</p>
</blockquote>
<p><strong>用户输入的本地化数字怎样解析？</strong></p>
<blockquote>
<p><code>Intl</code> 没有通用的反向解析器。输入框尽量用 <code>inputmode=&quot;decimal&quot;</code> 并约定格式；或者用 <code>formatToParts</code> 取出当前 locale 的分隔符，再自己解析。</p>
</blockquote>`};export{e as default};