var e={answerHtml:`<p>“订单在什么时候创建”“用户生日是哪天”“每周一上午九点开会”是三种不同问题。都用 Date 和时间戳保存，可能把业务里原本没有的时区含义强行加进去。</p>
<h3>时间戳表示确定瞬间，时区决定如何显示</h3>
<p>JavaScript Date 保存的是自 Unix 纪元起的毫秒时间值，不保存创建它时使用的时区名称。同一个瞬间在上海和纽约会显示成不同的当地时间，甚至不同日期，但 getTime 不会因此改变。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> instant = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Date</span>(<span class="hljs-string">&#x27;2026-01-01T00:00:00Z&#x27;</span>);

<span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> timeZone <span class="hljs-keyword">of</span> [<span class="hljs-string">&#x27;Asia/Shanghai&#x27;</span>, <span class="hljs-string">&#x27;America/New_York&#x27;</span>]) {
  <span class="hljs-keyword">const</span> formatter = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">DateTimeFormat</span>(<span class="hljs-string">&#x27;en-GB&#x27;</span>, {
    timeZone,
    <span class="hljs-attr">dateStyle</span>: <span class="hljs-string">&#x27;short&#x27;</span>,
    <span class="hljs-attr">timeStyle</span>: <span class="hljs-string">&#x27;short&#x27;</span>,
    <span class="hljs-attr">hourCycle</span>: <span class="hljs-string">&#x27;h23&#x27;</span>,
  });
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(timeZone, formatter.<span class="hljs-title function_">format</span>(instant));
}
<span class="hljs-comment">// Asia/Shanghai 01/01/2026, 08:00</span>
<span class="hljs-comment">// America/New_York 31/12/2025, 19:00</span>
</code></pre></div>
<p>订单创建、支付完成等事件通常适合保存确定瞬间，显示时再选择用户或业务时区。接口还要明确时间戳单位，秒和毫秒混用会产生看似合法但完全错误的日期。</p>
<h3>只有日期的值不应随用户位置漂移</h3>
<p>生日 <code>1995-06-10</code> 通常只表示年月日，不表示 UTC 午夜发生的某个事件。若把它解析成 Date，再按美洲时区格式化，可能显示为前一天。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> date = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Date</span>(<span class="hljs-string">&#x27;2026-01-01&#x27;</span>);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(date.<span class="hljs-title function_">toISOString</span>()); <span class="hljs-comment">// 2026-01-01T00:00:00.000Z</span>
</code></pre></div>
<p>标准的 YYYY-MM-DD 无时区形式会按 UTC 解析，而带时间但不含偏移的 <code>2026-01-01T00:00:00</code> 则按本地时间解析。这是 Date 的历史兼容规则，两个字符串不是同一种语义。</p>
<p>对于生日、账期日期或表单中的纯日期，可以保存经过校验的年月日字符串或专门的日期类型。校验还要确认真实日历合法性，不能只匹配四位年两位月两位日，也不能依赖 Date 自动进位来发现输入错误。</p>
<h3>固定偏移不是完整时区规则</h3>
<p><code>+08:00</code> 表示一个偏移；<code>America/New_York</code> 是带历史和夏令时规则的时区标识。纽约冬季和夏季的 UTC 偏移不同，所以不能给所有日期固定减五小时。</p>
<p>未来的“当地上午九点”安排通常应保留当地日期时间与 IANA 时区，并明确夏令时冲突策略；每周重复日程还需要重复规则。只保存第一次的 UTC 时间再每隔 24 小时或七天相加，可能让之后的当地开会时间变化。</p>
<h3>加一天与加 24 小时有什么区别</h3>
<p>在纽约进入夏令时的那一天，钟表会跳过一段本地时间。下面示例应在 <code>TZ=America/New_York</code> 的 Node 环境中运行：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> start = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Date</span>(<span class="hljs-number">2026</span>, <span class="hljs-number">2</span>, <span class="hljs-number">7</span>, <span class="hljs-number">12</span>);
<span class="hljs-keyword">const</span> calendarNext = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Date</span>(start);
calendarNext.<span class="hljs-title function_">setDate</span>(calendarNext.<span class="hljs-title function_">getDate</span>() + <span class="hljs-number">1</span>);
<span class="hljs-keyword">const</span> durationNext = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Date</span>(start.<span class="hljs-title function_">getTime</span>() + <span class="hljs-number">24</span> * <span class="hljs-number">60</span> * <span class="hljs-number">60</span> * <span class="hljs-number">1000</span>);

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(calendarNext.<span class="hljs-title function_">getHours</span>()); <span class="hljs-comment">// 12</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(durationNext.<span class="hljs-title function_">getHours</span>()); <span class="hljs-comment">// 13</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>((calendarNext - start) / <span class="hljs-number">3600000</span>); <span class="hljs-comment">// 23</span>
</code></pre></div>
<p>按日历走到下一天的中午，只经过 23 小时；按固定时长走 24 小时，则到了下一天 13 点。秋季切换还可能出现重复时间，所以“一天永远是 86400000 毫秒”只适合固定时长运算，不适合所有日历运算。</p>
<p>对于不存在或重复的当地时间，日期时间库或 API 需要采用某种消歧规则。预订、排班等业务应明确要拒绝、向后调整还是选择某一个偏移，不能让运行库默认行为悄悄决定业务结果。</p>
<h3>把语义写进接口和测试</h3>
<p>可以分别约定：事件时间使用带 Z/偏移的标准字符串或毫秒时间戳；纯日期使用 YYYY-MM-DD；未来日程包含本地时间、时区和必要的重复规则。不要传 <code>01/02/2026</code> 这种需要猜地区的输入。</p>
<p>测试至少覆盖跨日显示、夏令时前后、服务器与浏览器不同时区，以及无效日期。格式化只负责显示，不会替你修正上游已经选错的数据类型。</p>`};export{e as default};