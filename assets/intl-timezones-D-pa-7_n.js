var e={answerHtml:`<h2>简答</h2>
<ul>
<li>三类值要分开建模：已发生的事件（订单创建时间）存时间戳；只有日期的值（生日）存 <code>YYYY-MM-DD</code> 字符串；未来的当地时间（每周一上午九点开会）存本地时间加 IANA 时区。</li>
<li><code>Date</code> 内部只是一个毫秒数，不记得时区。同一个瞬间在上海是 1 月 1 日 08:00，在纽约是 12 月 31 日 19:00。</li>
<li><code>new Date(&#x27;2026-01-01&#x27;)</code> 按 UTC 解析，<code>new Date(&#x27;2026-01-01T00:00&#x27;)</code> 按本地时间解析，把生日转成 <code>Date</code> 在西半球会显示成前一天。</li>
<li><code>+08:00</code> 是固定偏移，<code>America/New_York</code> 是带夏令时和历史规则的时区，二者不能互换。</li>
<li>夏令时切换日，&quot;加一天&quot;可能只有 23 小时。Temporal 用 <code>Instant</code>、<code>PlainDate</code>、<code>ZonedDateTime</code> 分别表达这些语义，它已进入 TC39 第 4 阶段，预计收入 ES2027。</li>
</ul>
<h2>同一瞬间，不同显示</h2>
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
<p>接口里要写清楚时间戳单位是秒还是毫秒，混用会得到合法但错误的日期。</p>
<h2>纯日期</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">new</span> <span class="hljs-title class_">Date</span>(<span class="hljs-string">&#x27;2026-01-01&#x27;</span>).<span class="hljs-title function_">toISOString</span>(); <span class="hljs-comment">// &#x27;2026-01-01T00:00:00.000Z&#x27;，按 UTC 午夜解析</span>
</code></pre></div>
<p>生日、账单日这类值直接保存经过校验的 <code>&#x27;1995-06-10&#x27;</code> 字符串，显示时按年月日拆开格式化，不经过时区换算。校验时还要检查日期真实存在（2 月 30 日不合法），不能依赖 <code>Date</code> 自动进位。</p>
<h2>加一天与加 24 小时</h2>
<p>2026 年 3 月 8 日纽约进入夏令时，凌晨 2 点直接跳到 3 点：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js">process.<span class="hljs-property">env</span>.<span class="hljs-property">TZ</span> = <span class="hljs-string">&#x27;America/New_York&#x27;</span>; <span class="hljs-comment">// 在 Node 中设置，Windows 上命令行 TZ= 前缀可能不生效</span>
<span class="hljs-keyword">const</span> start = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Date</span>(<span class="hljs-number">2026</span>, <span class="hljs-number">2</span>, <span class="hljs-number">7</span>, <span class="hljs-number">12</span>); <span class="hljs-comment">// 3 月 7 日中午</span>

<span class="hljs-keyword">const</span> nextDay = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Date</span>(start);
nextDay.<span class="hljs-title function_">setDate</span>(nextDay.<span class="hljs-title function_">getDate</span>() + <span class="hljs-number">1</span>);
<span class="hljs-keyword">const</span> plus24h = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Date</span>(start.<span class="hljs-title function_">getTime</span>() + <span class="hljs-number">24</span> * <span class="hljs-number">3600</span> * <span class="hljs-number">1000</span>);

nextDay.<span class="hljs-title function_">getHours</span>(); <span class="hljs-comment">// 12</span>
plus24h.<span class="hljs-title function_">getHours</span>(); <span class="hljs-comment">// 13</span>
(nextDay - start) / <span class="hljs-number">3600000</span>; <span class="hljs-comment">// 23</span>
</code></pre></div>
<p>秋季切换时同一个当地时间会出现两次。排班和预约系统要定好规则：遇到不存在的时间是报错还是顺延，遇到重复的时间选哪一个。</p>
<h2>用 Temporal 表达语义</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// 需要支持 Temporal 的运行时或 polyfill</span>
<span class="hljs-keyword">const</span> birthday = <span class="hljs-title class_">Temporal</span>.<span class="hljs-property">PlainDate</span>.<span class="hljs-title function_">from</span>(<span class="hljs-string">&#x27;1995-06-10&#x27;</span>); <span class="hljs-comment">// 没有时区</span>
<span class="hljs-keyword">const</span> meeting = <span class="hljs-title class_">Temporal</span>.<span class="hljs-property">ZonedDateTime</span>.<span class="hljs-title function_">from</span>(<span class="hljs-string">&#x27;2026-03-09T09:00[America/New_York]&#x27;</span>);
meeting.<span class="hljs-title function_">add</span>({ <span class="hljs-attr">days</span>: <span class="hljs-number">1</span> }); <span class="hljs-comment">// 按日历加一天，仍是当地 09:00</span>
meeting.<span class="hljs-title function_">add</span>({ <span class="hljs-attr">hours</span>: <span class="hljs-number">24</span> }); <span class="hljs-comment">// 按时长加 24 小时</span>
</code></pre></div>
<p>Node 22 还没有内置 <code>Temporal</code>，使用前做能力检测。</p>
<h2>接口约定</h2>
<ul>
<li>事件时间：带 <code>Z</code> 或偏移的 ISO 字符串，或者毫秒时间戳。</li>
<li>纯日期：<code>YYYY-MM-DD</code>。</li>
<li>未来日程：本地日期时间加 IANA 时区，重复日程另存重复规则。</li>
<li>不要传 <code>01/02/2026</code> 这种需要猜地区才能理解的格式。</li>
</ul>
<p>测试覆盖跨日显示、夏令时前后、服务端和浏览器时区不同、无效日期。</p>
<h2>常见追问</h2>
<ul>
<li><strong>只存 UTC 时间戳不行吗？</strong> 过去的事件可以。未来的当地时间不行：时区规则可能被政府修改，只存 UTC 会让会议时间漂移。</li>
<li><strong>怎样显示时区名称？</strong> <code>Intl.DateTimeFormat</code> 的 <code>timeZoneName: &#x27;short&#x27;</code> 会输出 <code>EDT</code> 之类的缩写。</li>
</ul>`};export{e as default};