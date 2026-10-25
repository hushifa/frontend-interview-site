var e={answerHtml:`<p>同一个数值 1234.5，在不同地区可能写成 <code>1,234.5</code> 或 <code>1.234,5</code>；同一个日期也可能采用月在前、日在前或不同历法。手动拼接容易把开发者所在地区的习惯误当成统一规则。</p>
<p>Intl 把这些地区规则交给运行时的国际化数据处理。应用仍要提供正确的数据语义：语言地区、货币代码、时区和希望显示的精度，不是调用一次 toLocaleString 就完成了所有国际化。</p>
<h3>金额要同时指定货币和显示地区</h3>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> amount = <span class="hljs-number">1234.5</span>;
<span class="hljs-keyword">const</span> dollars = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">NumberFormat</span>(<span class="hljs-string">&#x27;en-US&#x27;</span>, {
  <span class="hljs-attr">style</span>: <span class="hljs-string">&#x27;currency&#x27;</span>,
  <span class="hljs-attr">currency</span>: <span class="hljs-string">&#x27;USD&#x27;</span>,
});
<span class="hljs-keyword">const</span> euros = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">NumberFormat</span>(<span class="hljs-string">&#x27;de-DE&#x27;</span>, {
  <span class="hljs-attr">style</span>: <span class="hljs-string">&#x27;currency&#x27;</span>,
  <span class="hljs-attr">currency</span>: <span class="hljs-string">&#x27;EUR&#x27;</span>,
});

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(dollars.<span class="hljs-title function_">format</span>(amount)); <span class="hljs-comment">// $1,234.50</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(euros.<span class="hljs-title function_">format</span>(amount)); <span class="hljs-comment">// 1.234,50\xA0€</span>
</code></pre></div>
<p>locale 决定数字分隔、符号位置等展示习惯，currency 决定货币身份及相关默认精度。第二行没有把美元换算成欧元，只是把同一个数值按欧元格式展示；汇率换算必须另行处理。</p>
<p>也不能给所有金额统一保留两位小数。不同货币有不同常用小数位要求，业务舍入策略还可能更严格。NumberFormat 负责展示舍入，不解决浮点算术精度；资金计算应采用明确的最小货币单位、十进制定点或合适的精确计算方案。</p>
<p>示例中的欧元前可能是不可换行空格。不同 ICU/CLDR 版本也可能调整格式细节，不要用普通空格猜测所有输出。</p>
<h3>日期格式与时区分别控制</h3>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> instant = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Date</span>(<span class="hljs-string">&#x27;2026-01-01T00:00:00Z&#x27;</span>);
<span class="hljs-keyword">const</span> format = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">DateTimeFormat</span>(<span class="hljs-string">&#x27;en-GB&#x27;</span>, {
  <span class="hljs-attr">timeZone</span>: <span class="hljs-string">&#x27;Asia/Shanghai&#x27;</span>,
  <span class="hljs-attr">year</span>: <span class="hljs-string">&#x27;numeric&#x27;</span>,
  <span class="hljs-attr">month</span>: <span class="hljs-string">&#x27;2-digit&#x27;</span>,
  <span class="hljs-attr">day</span>: <span class="hljs-string">&#x27;2-digit&#x27;</span>,
  <span class="hljs-attr">hour</span>: <span class="hljs-string">&#x27;2-digit&#x27;</span>,
  <span class="hljs-attr">minute</span>: <span class="hljs-string">&#x27;2-digit&#x27;</span>,
  <span class="hljs-attr">hourCycle</span>: <span class="hljs-string">&#x27;h23&#x27;</span>,
});

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(format.<span class="hljs-title function_">format</span>(instant)); <span class="hljs-comment">// 01/01/2026, 08:00</span>
</code></pre></div>
<p>en-GB 控制显示惯例，Asia/Shanghai 控制这个瞬间对应的当地时间。选了中文 locale 不代表自动切换到中国时区，选了英文也不代表使用 UTC。</p>
<p>服务端渲染时尤其要显式传入约定设置。服务端用 UTC，浏览器用用户本地时区，可能导致首次 HTML 与客户端内容不同。可以统一首屏设置，或明确将用户本地格式化放到客户端阶段，不能依赖部署机器的默认配置。</p>
<h3>排序也不是比较编码值就够了</h3>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> labels = [<span class="hljs-string">&#x27;item10&#x27;</span>, <span class="hljs-string">&#x27;item2&#x27;</span>, <span class="hljs-string">&#x27;item1&#x27;</span>];
<span class="hljs-keyword">const</span> collator = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">Collator</span>(<span class="hljs-string">&#x27;en&#x27;</span>, { <span class="hljs-attr">numeric</span>: <span class="hljs-literal">true</span> });
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>([...labels].<span class="hljs-title function_">sort</span>(collator.<span class="hljs-property">compare</span>));
<span class="hljs-comment">// [&#x27;item1&#x27;, &#x27;item2&#x27;, &#x27;item10&#x27;]</span>
</code></pre></div>
<p>numeric 让数字片段按自然数字顺序比较。其他语言中的重音、大小写和字母顺序也可能与默认 sort 不同，可根据场景选择 locale、sensitivity 等选项。</p>
<p>compare 的结果只保证负数、零或正数，不保证一定为 -1 或 1。适合展示的忽略重音比较，也不应直接用于账号唯一性或权限标识判断；“显示排序相近”不等于业务上是同一个人。</p>
<h3>格式化字符串不要反过来当数据协议</h3>
<p><code>1,234</code> 在不同规则下可能表达不同数值，日期字符串同样存在歧义。存储和接口应传数值、货币代码以及明确语义的日期时间数据，展示时再格式化。Intl 没有提供通用的本地化数字反向解析器。</p>
<p>如果需要单独给货币符号或日期部分加样式，使用 formatToParts 获取带类型的片段，不要靠 split(&#x27;,&#x27;) 或固定下标拆字符串。循环展示大量数据时，可以复用同一组选项的 formatter；切换 locale、时区或精度时，再更新对应实例。</p>`};export{e as default};