var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>业务里的时间其实有三种，要分开存。已经发生的事件，比如订单创建时间，存时间戳；只有日期的值，比如生日，存 <code>YYYY-MM-DD</code> 字符串；未来的当地时间，比如每周一上午九点开会，存本地时间加 IANA 时区。</p>
<p>为什么要分？因为 <code>Date</code> 内部只是一个毫秒数，它不记得时区。同一个瞬间，在上海是 1 月 1 日 08:00，在纽约是 12 月 31 日 19:00。把生日转成 <code>Date</code> 也会出问题：<code>new Date(&#x27;2026-01-01&#x27;)</code> 按 UTC 解析，<code>new Date(&#x27;2026-01-01T00:00&#x27;)</code> 按本地时间解析，在西半球显示出来就成了前一天。</p>
<p>时区也有讲究。<code>+08:00</code> 是固定偏移，<code>America/New_York</code> 是带夏令时和历史规则的时区，二者不能互换。</p>
<p>要特别注意夏令时。切换那天，“加一天”可能只有 23 小时。Temporal 用 <code>Instant</code>、<code>PlainDate</code>、<code>ZonedDateTime</code> 分别表达这几种语义，它已进入 TC39 第 4 阶段。</p>
</blockquote>
<h2>同一个瞬间，显示成不同的时间</h2>
<p>下面把同一个 UTC 时刻，分别按上海和纽约显示。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> instant = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Date</span>(<span class="hljs-string">&#x27;2026-01-01T00:00:00Z&#x27;</span>);

<span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> timeZone <span class="hljs-keyword">of</span> [<span class="hljs-string">&#x27;Asia/Shanghai&#x27;</span>, <span class="hljs-string">&#x27;America/New_York&#x27;</span>]) {
  <span class="hljs-keyword">const</span> text = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">DateTimeFormat</span>(<span class="hljs-string">&#x27;en-GB&#x27;</span>, {
    timeZone,
    <span class="hljs-attr">dateStyle</span>: <span class="hljs-string">&#x27;short&#x27;</span>,
    <span class="hljs-attr">timeStyle</span>: <span class="hljs-string">&#x27;short&#x27;</span>,
  }).<span class="hljs-title function_">format</span>(instant);
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(timeZone, text);
}
<span class="hljs-comment">// Asia/Shanghai 01/01/2026, 08:00</span>
<span class="hljs-comment">// America/New_York 31/12/2025, 19:00</span>
</code></pre></div>
<p><code>instant</code> 只有一个，变的只是显示用的时区。上海已经是新年早上，纽约还是前一天晚上，连年份都不一样。所以时间戳本身没有“几点”，“几点”是时区算出来的。</p>
<p>接口里还要写清楚时间戳的单位是秒还是毫秒。两者混用不会报错，只会得到一个合法但错误的日期，更难发现。</p>
<h2>生日为什么不能转成 Date</h2>
<p>先看一个只有日期的字符串被解析成什么。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">new</span> <span class="hljs-title class_">Date</span>(<span class="hljs-string">&#x27;2026-01-01&#x27;</span>).<span class="hljs-title function_">toISOString</span>(); <span class="hljs-comment">// &#x27;2026-01-01T00:00:00.000Z&#x27;，按 UTC 午夜解析</span>
</code></pre></div>
<p>它被当成了 UTC 的午夜。纽约比 UTC 晚，这个时刻在纽约还是 12 月 31 日晚上，所以用户在西半球看到的生日就早了一天。</p>
<p>生日、账单日这种值本来就没有时区，直接存经过校验的 <code>&#x27;1995-06-10&#x27;</code> 字符串。显示时按年、月、日拆开格式化，不经过时区换算。校验时还要检查日期是否真实存在，比如 2 月 30 日不合法，不能指望 <code>Date</code> 自动进位成 3 月 2 日。</p>
<h2>加一天和加 24 小时为什么不一样</h2>
<p>2026 年 3 月 8 日，纽约进入夏令时，凌晨 2 点直接跳到 3 点，这一天只有 23 小时。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js">process.<span class="hljs-property">env</span>.<span class="hljs-property">TZ</span> = <span class="hljs-string">&#x27;America/New_York&#x27;</span>; <span class="hljs-comment">// 在 Node 中设置，Windows 上命令行 TZ= 前缀可能不生效</span>
<span class="hljs-keyword">const</span> start = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Date</span>(<span class="hljs-number">2026</span>, <span class="hljs-number">2</span>, <span class="hljs-number">7</span>, <span class="hljs-number">12</span>); <span class="hljs-comment">// 3 月 7 日中午</span>

<span class="hljs-keyword">const</span> nextDay = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Date</span>(start);
nextDay.<span class="hljs-title function_">setDate</span>(nextDay.<span class="hljs-title function_">getDate</span>() + <span class="hljs-number">1</span>);
<span class="hljs-keyword">const</span> plus24h = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Date</span>(start.<span class="hljs-title function_">getTime</span>() + <span class="hljs-number">24</span> * <span class="hljs-number">3600</span> * <span class="hljs-number">1000</span>);

nextDay.<span class="hljs-title function_">getHours</span>(); <span class="hljs-comment">// 12</span>
plus24h.<span class="hljs-title function_">getHours</span>(); <span class="hljs-comment">// 13</span>
(nextDay - start) / <span class="hljs-number">3600000</span>; <span class="hljs-comment">// 23</span>
</code></pre></div>
<p><code>setDate</code> 加的是日历上的一天，所以第二天还是中午 12 点，但实际只过了 23 小时。直接加 24 小时的毫秒数，时钟就跑到了下午 1 点。两种都没错，只是语义不同：订闹钟要前者，算时长要后者。</p>
<p>秋季切换时反过来，同一个当地时间会出现两次。排班和预约系统要提前定好规则：碰到不存在的时间是报错还是顺延，碰到重复的时间选哪一个。</p>
<h2>Temporal 怎样表达这些语义</h2>
<p>Temporal 给每种语义一个独立的类型，不用再拿 <code>Date</code> 硬凑。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// 需要支持 Temporal 的运行时或 polyfill</span>
<span class="hljs-keyword">const</span> birthday = <span class="hljs-title class_">Temporal</span>.<span class="hljs-property">PlainDate</span>.<span class="hljs-title function_">from</span>(<span class="hljs-string">&#x27;1995-06-10&#x27;</span>); <span class="hljs-comment">// 没有时区</span>
<span class="hljs-keyword">const</span> meeting = <span class="hljs-title class_">Temporal</span>.<span class="hljs-property">ZonedDateTime</span>.<span class="hljs-title function_">from</span>(<span class="hljs-string">&#x27;2026-03-09T09:00[America/New_York]&#x27;</span>);
meeting.<span class="hljs-title function_">add</span>({ <span class="hljs-attr">days</span>: <span class="hljs-number">1</span> }); <span class="hljs-comment">// 按日历加一天，仍是当地 09:00</span>
meeting.<span class="hljs-title function_">add</span>({ <span class="hljs-attr">hours</span>: <span class="hljs-number">24</span> }); <span class="hljs-comment">// 按时长加 24 小时</span>
</code></pre></div>
<p><code>PlainDate</code> 没有时区，正好对应生日。<code>ZonedDateTime</code> 带着 IANA 时区，加一天还是加 24 小时，写法上就区分开了。</p>
<p>Node 22 还没有内置 <code>Temporal</code>，用之前要做能力检测。</p>
<h2>接口怎样约定</h2>
<p>事件时间用带 <code>Z</code> 或偏移的 ISO 字符串，或者毫秒时间戳。纯日期用 <code>YYYY-MM-DD</code>。未来日程用本地日期时间加 IANA 时区，重复的日程另外存重复规则。不要传 <code>01/02/2026</code> 这种要猜地区才知道是 1 月 2 日还是 2 月 1 日的格式。</p>
<p>测试要覆盖跨日显示、夏令时前后、服务端和浏览器时区不同，以及无效日期。</p>
<h2>常见追问</h2>
<p><strong>只存 UTC 时间戳不行吗？</strong></p>
<blockquote>
<p>过去的事件可以。未来的当地时间不行，因为时区规则可能被政府修改。如果只存了 UTC，规则一改，会议的当地时间就漂移了。</p>
</blockquote>
<p><strong>怎样显示时区名称？</strong></p>
<blockquote>
<p>用 <code>Intl.DateTimeFormat</code> 的 <code>timeZoneName: &#x27;short&#x27;</code>，会输出 <code>EDT</code> 这样的缩写。</p>
</blockquote>`};export{e as default};