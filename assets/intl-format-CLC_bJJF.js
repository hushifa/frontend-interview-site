var e={answerHtml:`<h2>简答</h2>
<ul>
<li>1234.5 在美国写作 <code>1,234.5</code>，在德国写作 <code>1.234,5</code>，在印度写作 <code>1,234.5</code> 但大数会写成 <code>12,34,567</code>。手动拼接只能照顾到一种习惯。</li>
<li>金额格式化要同时给出 locale 和货币代码：locale 决定写法，货币决定符号和默认小数位。格式化不做汇率换算。</li>
<li>日期格式由 locale 决定，时区要单独指定；中文 locale 不会自动使用中国时区。</li>
<li>排序用 <code>Intl.Collator</code>，<code>numeric: true</code> 让 <code>item2</code> 排在 <code>item10</code> 前面。</li>
<li>存储和接口传数值、货币代码和明确语义的时间，格式化后的字符串不要再解析回来。</li>
</ul>
<h2>金额（Node 22 实测）</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">NumberFormat</span>(<span class="hljs-string">&#x27;en-US&#x27;</span>, { <span class="hljs-attr">style</span>: <span class="hljs-string">&#x27;currency&#x27;</span>, <span class="hljs-attr">currency</span>: <span class="hljs-string">&#x27;USD&#x27;</span> }).<span class="hljs-title function_">format</span>(<span class="hljs-number">1234.5</span>); <span class="hljs-comment">// &#x27;$1,234.50&#x27;</span>
<span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">NumberFormat</span>(<span class="hljs-string">&#x27;de-DE&#x27;</span>, { <span class="hljs-attr">style</span>: <span class="hljs-string">&#x27;currency&#x27;</span>, <span class="hljs-attr">currency</span>: <span class="hljs-string">&#x27;EUR&#x27;</span> }).<span class="hljs-title function_">format</span>(<span class="hljs-number">1234.5</span>); <span class="hljs-comment">// &#x27;1.234,50 €&#x27;</span>
<span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">NumberFormat</span>(<span class="hljs-string">&#x27;zh-CN&#x27;</span>, { <span class="hljs-attr">style</span>: <span class="hljs-string">&#x27;currency&#x27;</span>, <span class="hljs-attr">currency</span>: <span class="hljs-string">&#x27;CNY&#x27;</span> }).<span class="hljs-title function_">format</span>(<span class="hljs-number">1234.5</span>); <span class="hljs-comment">// &#x27;¥1,234.50&#x27;</span>
<span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">NumberFormat</span>(<span class="hljs-string">&#x27;zh-CN&#x27;</span>, { <span class="hljs-attr">notation</span>: <span class="hljs-string">&#x27;compact&#x27;</span> }).<span class="hljs-title function_">format</span>(<span class="hljs-number">12345678</span>); <span class="hljs-comment">// &#x27;1235万&#x27;</span>
</code></pre></div>
<ul>
<li>欧元前面的空格是不换行空格，测试里不要用普通空格比较。</li>
<li><code>NumberFormat</code> 不做汇率换算：<code>currency</code> 只决定符号和小数位，金额要先按业务汇率换算好再格式化。</li>
<li><code>NumberFormat</code> 只做显示舍入。金额计算用最小货币单位的整数或十进制库，避免浮点误差。</li>
</ul>
<h2>日期</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> instant = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Date</span>(<span class="hljs-string">&#x27;2026-01-01T00:00:00Z&#x27;</span>);
<span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">DateTimeFormat</span>(<span class="hljs-string">&#x27;en-GB&#x27;</span>, {
  <span class="hljs-attr">dateStyle</span>: <span class="hljs-string">&#x27;short&#x27;</span>,
  <span class="hljs-attr">timeStyle</span>: <span class="hljs-string">&#x27;short&#x27;</span>,
  <span class="hljs-attr">timeZone</span>: <span class="hljs-string">&#x27;Asia/Shanghai&#x27;</span>,
}).<span class="hljs-title function_">format</span>(instant); <span class="hljs-comment">// &#x27;01/01/2026, 08:00&#x27;</span>

<span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">DateTimeFormat</span>(<span class="hljs-string">&#x27;zh-CN&#x27;</span>, { <span class="hljs-attr">dateStyle</span>: <span class="hljs-string">&#x27;long&#x27;</span>, <span class="hljs-attr">timeZone</span>: <span class="hljs-string">&#x27;UTC&#x27;</span> }).<span class="hljs-title function_">format</span>(instant); <span class="hljs-comment">// &#x27;2026年1月1日&#x27;</span>
</code></pre></div>
<p>SSR 时显式传入 <code>timeZone</code>。服务端默认 UTC、浏览器用本地时区，会导致水合时文本不一致。时区建模见<a href="/questions/intl-timezones/">《时间戳、时区和只有日期的业务值应该怎样区分？》</a>。</p>
<h2>排序</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js">[<span class="hljs-string">&#x27;item10&#x27;</span>, <span class="hljs-string">&#x27;item2&#x27;</span>, <span class="hljs-string">&#x27;item1&#x27;</span>].<span class="hljs-title function_">sort</span>(); <span class="hljs-comment">// [&#x27;item1&#x27;, &#x27;item10&#x27;, &#x27;item2&#x27;]</span>
[<span class="hljs-string">&#x27;item10&#x27;</span>, <span class="hljs-string">&#x27;item2&#x27;</span>, <span class="hljs-string">&#x27;item1&#x27;</span>].<span class="hljs-title function_">sort</span>(<span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">Collator</span>(<span class="hljs-string">&#x27;en&#x27;</span>, { <span class="hljs-attr">numeric</span>: <span class="hljs-literal">true</span> }).<span class="hljs-property">compare</span>);
<span class="hljs-comment">// [&#x27;item1&#x27;, &#x27;item2&#x27;, &#x27;item10&#x27;]</span>

[<span class="hljs-string">&#x27;a&#x27;</span>, <span class="hljs-string">&#x27;B&#x27;</span>, <span class="hljs-string">&#x27;c&#x27;</span>, <span class="hljs-string">&#x27;Ä&#x27;</span>].<span class="hljs-title function_">sort</span>(<span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">Collator</span>(<span class="hljs-string">&#x27;de&#x27;</span>).<span class="hljs-property">compare</span>); <span class="hljs-comment">// [&#x27;a&#x27;, &#x27;Ä&#x27;, &#x27;B&#x27;, &#x27;c&#x27;]</span>
[<span class="hljs-string">&#x27;张三&#x27;</span>, <span class="hljs-string">&#x27;李四&#x27;</span>, <span class="hljs-string">&#x27;王五&#x27;</span>, <span class="hljs-string">&#x27;阿明&#x27;</span>].<span class="hljs-title function_">sort</span>(<span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">Collator</span>(<span class="hljs-string">&#x27;zh-CN&#x27;</span>).<span class="hljs-property">compare</span>);
<span class="hljs-comment">// [&#x27;阿明&#x27;, &#x27;李四&#x27;, &#x27;王五&#x27;, &#x27;张三&#x27;]，按拼音</span>
</code></pre></div>
<p>默认的 <code>sort()</code> 按 UTF-16 码元比较，大写字母排在所有小写字母前面。<code>sensitivity: &#x27;base&#x27;</code> 时 <code>a</code> 和 <code>Á</code> 比较结果为 0，适合搜索匹配，不适合判断账号是否重复。</p>
<h2>分段加样式</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">NumberFormat</span>(<span class="hljs-string">&#x27;en-US&#x27;</span>, { <span class="hljs-attr">style</span>: <span class="hljs-string">&#x27;currency&#x27;</span>, <span class="hljs-attr">currency</span>: <span class="hljs-string">&#x27;USD&#x27;</span> }).<span class="hljs-title function_">formatToParts</span>(<span class="hljs-number">1234.5</span>);
<span class="hljs-comment">// [{ type: &#x27;currency&#x27;, value: &#x27;$&#x27; }, { type: &#x27;integer&#x27;, value: &#x27;1&#x27; }, { type: &#x27;group&#x27;, value: &#x27;,&#x27; }, ...]</span>
</code></pre></div>
<p>要单独给货币符号加样式时用 <code>formatToParts()</code>，不要用 <code>split(&#x27;,&#x27;)</code> 拆字符串。</p>
<p>大量格式化时复用同一个 formatter 实例，创建实例的开销比调用 <code>format()</code> 大。</p>
<h2>常见追问</h2>
<ul>
<li><strong><code>toLocaleString()</code> 和 <code>Intl.NumberFormat</code> 有什么区别？</strong> 结果相同，<code>toLocaleString()</code> 每次调用都要处理选项；循环中格式化大量数据时，复用 <code>Intl.NumberFormat</code> 实例更快。</li>
<li><strong>用户输入的本地化数字怎样解析？</strong> <code>Intl</code> 没有通用的反向解析器。输入框尽量使用 <code>inputmode=&quot;decimal&quot;</code> 并约定格式，或者用 <code>formatToParts</code> 取得当前 locale 的分隔符后自己解析。</li>
</ul>`};export{e as default};