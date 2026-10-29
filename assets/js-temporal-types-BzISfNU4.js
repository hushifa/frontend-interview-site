var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p><code>Date</code> 里其实只存了一个毫秒时间戳，可它同时提供 UTC 和本地时间两套读写方法，于是“日期”和“时刻”经常被混在一起，生日存进去换个时区就差一天。Temporal 把不同意思的时间分成不同类型。</p>
<p><code>Instant</code> 是时间线上一个确定的瞬间，不带时区和日历，适合日志、事件时间戳。<code>PlainDate</code> 只有年月日，不对应任何具体时刻，适合生日、账期；同类的还有 <code>PlainTime</code>、<code>PlainDateTime</code>、<code>PlainMonthDay</code>。<code>ZonedDateTime</code> 是一个瞬间加上 IANA 时区名，比如 <code>Asia/Shanghai</code>，适合会议和当地日程。</p>
<p>分开的好处在计算上最明显。跨夏令时那天，“加 1 天”和“加 24 小时”结果不一样，<code>ZonedDateTime</code> 会按时区规则算对。另外 Temporal 对象都不可变，<code>add</code> 返回新对象；月份从 1 开始，而 <code>Date</code> 从 0 开始。</p>
<p>兼容性要注意。Temporal 已进入 TC39 Stage 4，部分浏览器已经内置，但 MDN 仍标注为非 Baseline（Limited availability），其他环境要用 <code>@js-temporal/polyfill</code> 或 <code>temporal-polyfill</code>。</p>
</blockquote>
<h2>Date 哪里容易出错</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">new</span> <span class="hljs-title class_">Date</span>(<span class="hljs-string">&#x27;2024-01-01&#x27;</span>);       <span class="hljs-comment">// 按 UTC 午夜解析</span>
<span class="hljs-keyword">new</span> <span class="hljs-title class_">Date</span>(<span class="hljs-string">&#x27;2024-01-01T00:00&#x27;</span>); <span class="hljs-comment">// 按本地时间解析</span>
</code></pre></div>
<p>两个字符串只差一个时间部分，解析出来却是不同的时刻。只写日期时按 UTC 午夜解析，带上时间就按本地时间解析。</p>
<p>所以把生日存成 <code>Date(&#x27;2024-01-01&#x27;)</code>，在 UTC-8 时区的用户那里显示，UTC 午夜对应当地的前一天下午，生日就变成了 12 月 31 日。问题在于生日本来就不是一个“时刻”，硬塞进时间戳里就会出这种错。</p>
<h2>三种类型分别怎么用</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> date = <span class="hljs-title class_">Temporal</span>.<span class="hljs-property">PlainDate</span>.<span class="hljs-title function_">from</span>(<span class="hljs-string">&#x27;2024-02-28&#x27;</span>);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(date.<span class="hljs-title function_">add</span>({ <span class="hljs-attr">days</span>: <span class="hljs-number">1</span> }).<span class="hljs-title function_">toString</span>()); <span class="hljs-comment">// 2024-02-29</span>

<span class="hljs-keyword">const</span> instant = <span class="hljs-title class_">Temporal</span>.<span class="hljs-property">Instant</span>.<span class="hljs-title function_">from</span>(<span class="hljs-string">&#x27;2024-01-01T00:00:00Z&#x27;</span>);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(instant.<span class="hljs-title function_">toZonedDateTimeISO</span>(<span class="hljs-string">&#x27;Asia/Shanghai&#x27;</span>).<span class="hljs-property">hour</span>); <span class="hljs-comment">// 8</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(
  instant.<span class="hljs-title function_">toZonedDateTimeISO</span>(<span class="hljs-string">&#x27;America/Los_Angeles&#x27;</span>).<span class="hljs-title function_">toPlainDate</span>().<span class="hljs-title function_">toString</span>(),
); <span class="hljs-comment">// 2023-12-31</span>
</code></pre></div>
<p><code>PlainDate</code> 只管日历，2024 年是闰年，2 月 28 日加一天就是 29 日，跟时区没有关系。</p>
<p><code>Instant</code> 是一个确定的瞬间。同一个瞬间放到上海是 1 月 1 日早上 8 点，放到洛杉矶还是 12 月 31 日。要显示成当地时间，就转成对应时区的 <code>ZonedDateTime</code>。</p>
<p>存时区时也要注意。<code>+08:00</code> 这种固定偏移只能还原出某一个瞬间，里面没有夏令时规则。安排未来的当地日程，要存 <code>Asia/Shanghai</code> 这样的时区名，规则变了也能算对。</p>
<h2>跨夏令时为什么加一天不等于加 24 小时</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> start = <span class="hljs-title class_">Temporal</span>.<span class="hljs-property">ZonedDateTime</span>.<span class="hljs-title function_">from</span>(
  <span class="hljs-string">&#x27;2024-03-09T12:00:00-05:00[America/New_York]&#x27;</span>,
);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(start.<span class="hljs-title function_">add</span>({ <span class="hljs-attr">days</span>: <span class="hljs-number">1</span> }).<span class="hljs-property">hour</span>);  <span class="hljs-comment">// 12</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(start.<span class="hljs-title function_">add</span>({ <span class="hljs-attr">hours</span>: <span class="hljs-number">24</span> }).<span class="hljs-property">hour</span>); <span class="hljs-comment">// 13</span>
</code></pre></div>
<p>从中午 12 点开始，加 1 天还是 12 点，加 24 小时却变成了 13 点。</p>
<p>因为 2024 年 3 月 10 日纽约开始夏令时，时钟拨快了一小时，那一天只有 23 小时。“明天中午”离现在只有 23 小时，再过 24 小时就到了下午 1 点。</p>
<p>所以要按业务意思选单位。每天固定时间的提醒用 <code>days</code>，有效期 24 小时的令牌用 <code>hours</code>，或者直接用 <code>Instant</code>。</p>
<p>秋天回拨时，又会有一个本地时刻出现两次，比如凌晨 1 点半出现两遍。这时 <code>from</code> 的 <code>disambiguation</code> 选项决定选哪一个，可选 <code>&#x27;compatible&#x27;</code>、<code>&#x27;earlier&#x27;</code>、<code>&#x27;later&#x27;</code>、<code>&#x27;reject&#x27;</code>。</p>
<h2>还有哪些常用规则</h2>
<p>比较两个日期，用 <code>Temporal.PlainDate.compare(a, b)</code> 或者 <code>a.equals(b)</code>，不能用 <code>&lt;</code> 或 <code>===</code>。</p>
<p>月份加法会处理月末。<code>Temporal.PlainDate.from(&#x27;2024-01-31&#x27;).add({ months: 1 })</code> 得到 <code>2024-02-29</code>，因为默认的 <code>overflow: &#x27;constrain&#x27;</code> 会把不存在的 2 月 31 日压到当月最后一天。</p>
<p>取当前时间用 <code>Temporal.Now.instant()</code>、<code>Temporal.Now.plainDateISO()</code>。<code>toString()</code> 输出 ISO 8601 格式，<code>ZonedDateTime</code> 还会带上 <code>[时区]</code> 后缀，这是 RFC 9557 定义的格式。判断环境支不支持，可以写 <code>typeof globalThis.Temporal === &#x27;object&#x27;</code>。</p>
<h2>常见追问</h2>
<p><strong>Temporal 和 <code>Intl.DateTimeFormat</code> 是什么关系？</strong></p>
<blockquote>
<p>Temporal 负责计算，格式化显示交给 <code>toLocaleString</code> 或 <code>Intl.DateTimeFormat</code>，后者也能直接接收 Temporal 对象。</p>
</blockquote>
<p><strong>已有的 <code>Date</code> 怎样转成 Temporal？</strong></p>
<blockquote>
<p>用 <code>Temporal.Instant.fromEpochMilliseconds(date.getTime())</code>，或者直接调用 <code>date.toTemporalInstant()</code>。<code>Date</code> 本来就只是一个瞬间，所以先转成 <code>Instant</code>，再按需要转成其他类型。</p>
</blockquote>`};export{e as default};