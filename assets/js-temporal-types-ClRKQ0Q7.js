var e={answerHtml:`<h2>简答</h2>
<ul>
<li><code>Instant</code>：时间线上的一个确定瞬间，没有时区和日历，适合日志和事件时间戳。</li>
<li><code>PlainDate</code>：只有年月日，不对应任何时刻，适合生日、账期；同类还有 <code>PlainTime</code>、<code>PlainDateTime</code>、<code>PlainMonthDay</code>。</li>
<li><code>ZonedDateTime</code>：瞬间 + IANA 时区，适合会议和当地日程；跨夏令时加 1 天和加 24 小时的结果不同。</li>
<li>Temporal 对象不可变，<code>add</code> 返回新对象；月份从 1 开始，而 <code>Date</code> 从 0 开始。</li>
<li>Temporal 已进入 TC39 Stage 4，Firefox 139、Chrome 144、Node.js 26 已内置；MDN 仍标注为非 Baseline，其他环境用 <code>@js-temporal/polyfill</code> 或 <code>temporal-polyfill</code>。</li>
</ul>
<h2>Date 的问题</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">new</span> <span class="hljs-title class_">Date</span>(<span class="hljs-string">&#x27;2024-01-01&#x27;</span>);       <span class="hljs-comment">// 按 UTC 午夜解析</span>
<span class="hljs-keyword">new</span> <span class="hljs-title class_">Date</span>(<span class="hljs-string">&#x27;2024-01-01T00:00&#x27;</span>); <span class="hljs-comment">// 按本地时间解析</span>
</code></pre></div>
<p>同一个日期字符串少了时间部分就换了时区。生日存成 <code>Date</code> 后，在 UTC-8 时区显示会变成前一天。</p>
<h2>三种类型</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> date = <span class="hljs-title class_">Temporal</span>.<span class="hljs-property">PlainDate</span>.<span class="hljs-title function_">from</span>(<span class="hljs-string">&#x27;2024-02-28&#x27;</span>);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(date.<span class="hljs-title function_">add</span>({ <span class="hljs-attr">days</span>: <span class="hljs-number">1</span> }).<span class="hljs-title function_">toString</span>()); <span class="hljs-comment">// 2024-02-29</span>

<span class="hljs-keyword">const</span> instant = <span class="hljs-title class_">Temporal</span>.<span class="hljs-property">Instant</span>.<span class="hljs-title function_">from</span>(<span class="hljs-string">&#x27;2024-01-01T00:00:00Z&#x27;</span>);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(instant.<span class="hljs-title function_">toZonedDateTimeISO</span>(<span class="hljs-string">&#x27;Asia/Shanghai&#x27;</span>).<span class="hljs-property">hour</span>); <span class="hljs-comment">// 8</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(
  instant.<span class="hljs-title function_">toZonedDateTimeISO</span>(<span class="hljs-string">&#x27;America/Los_Angeles&#x27;</span>).<span class="hljs-title function_">toPlainDate</span>().<span class="hljs-title function_">toString</span>(),
); <span class="hljs-comment">// 2023-12-31</span>
</code></pre></div>
<p>同一个瞬间在上海是 1 月 1 日早上 8 点，在洛杉矶还是 12 月 31 日。</p>
<p><code>+08:00</code> 这样的固定偏移只能还原某个瞬间，不包含夏令时规则；安排未来的当地日程要存 <code>Asia/Shanghai</code> 这类时区名。</p>
<h2>跨夏令时</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> start = <span class="hljs-title class_">Temporal</span>.<span class="hljs-property">ZonedDateTime</span>.<span class="hljs-title function_">from</span>(
  <span class="hljs-string">&#x27;2024-03-09T12:00:00-05:00[America/New_York]&#x27;</span>,
);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(start.<span class="hljs-title function_">add</span>({ <span class="hljs-attr">days</span>: <span class="hljs-number">1</span> }).<span class="hljs-property">hour</span>);  <span class="hljs-comment">// 12</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(start.<span class="hljs-title function_">add</span>({ <span class="hljs-attr">hours</span>: <span class="hljs-number">24</span> }).<span class="hljs-property">hour</span>); <span class="hljs-comment">// 13</span>
</code></pre></div>
<p>3 月 10 日纽约时钟拨快一小时，所以&quot;明天中午&quot;距今只有 23 小时。每日重复的提醒用 <code>days</code>，有效期 24 小时的令牌用 <code>hours</code> 或直接用 <code>Instant</code>。</p>
<p>秋季回拨时一个本地时刻会出现两次，<code>from</code> 的 <code>disambiguation</code> 选项（<code>&#x27;compatible&#x27;</code>、<code>&#x27;earlier&#x27;</code>、<code>&#x27;later&#x27;</code>、<code>&#x27;reject&#x27;</code>）决定选哪一个。</p>
<h2>其他要点</h2>
<ul>
<li>比较用 <code>Temporal.PlainDate.compare(a, b)</code> 或 <code>a.equals(b)</code>，不能用 <code>&lt;</code> 或 <code>===</code>。</li>
<li><code>Temporal.PlainDate.from(&#x27;2024-01-31&#x27;).add({ months: 1 })</code> 得到 <code>2024-02-29</code>，默认 <code>overflow: &#x27;constrain&#x27;</code> 把超出的日期压到月末。</li>
<li>当前时间：<code>Temporal.Now.instant()</code>、<code>Temporal.Now.plainDateISO()</code>。</li>
<li>序列化：<code>toString()</code> 输出 ISO 8601，<code>ZonedDateTime</code> 带 <code>[时区]</code> 后缀（RFC 9557）。</li>
<li>能力检测：<code>typeof globalThis.Temporal === &#x27;object&#x27;</code>。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li>和 <code>Intl.DateTimeFormat</code> 什么关系？Temporal 负责计算，格式化用 <code>toLocaleString</code> 或 <code>Intl.DateTimeFormat</code>，后者也接受 Temporal 对象。</li>
<li>已有的 <code>Date</code> 怎样转换？<code>Temporal.Instant.fromEpochMilliseconds(date.getTime())</code>，或 <code>date.toTemporalInstant()</code>。</li>
</ul>`};export{e as default};