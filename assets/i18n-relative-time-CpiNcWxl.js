var e={answerHtml:`<h2>简答</h2>
<ul>
<li><code>format(value, unit)</code> 只做格式化：<code>format(-5, &#x27;minute&#x27;)</code> 在中文下输出&quot;5分钟前&quot;。它不会计算两个时间相差多少。</li>
<li>应用先算出时间差，再选单位（秒、分、小时、天……）并决定取整方式。</li>
<li><code>numeric: &#x27;auto&#x27;</code> 会把 -1 天、0 天、1 天说成&quot;昨天&quot;&quot;今天&quot;&quot;明天&quot;；默认的 <code>&#x27;always&#x27;</code> 一律用数字。</li>
<li>列表排序、刷新判断都基于原始时间戳，不要用显示出来的字符串。</li>
<li>SSR 时服务端和客户端的&quot;现在&quot;不同，相对时间会对不上，常见做法是服务端输出绝对时间，客户端水合后再替换。</li>
</ul>
<h2>输出示例（Node 22 实测）</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> zh = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">RelativeTimeFormat</span>(<span class="hljs-string">&#x27;zh-CN&#x27;</span>);
zh.<span class="hljs-title function_">format</span>(-<span class="hljs-number">5</span>, <span class="hljs-string">&#x27;minute&#x27;</span>); <span class="hljs-comment">// &#x27;5分钟前&#x27;</span>
zh.<span class="hljs-title function_">format</span>(-<span class="hljs-number">3</span>, <span class="hljs-string">&#x27;hour&#x27;</span>); <span class="hljs-comment">// &#x27;3小时前&#x27;</span>

<span class="hljs-keyword">const</span> zhAuto = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">RelativeTimeFormat</span>(<span class="hljs-string">&#x27;zh-CN&#x27;</span>, { <span class="hljs-attr">numeric</span>: <span class="hljs-string">&#x27;auto&#x27;</span> });
zhAuto.<span class="hljs-title function_">format</span>(-<span class="hljs-number">1</span>, <span class="hljs-string">&#x27;day&#x27;</span>); <span class="hljs-comment">// &#x27;昨天&#x27;</span>
zhAuto.<span class="hljs-title function_">format</span>(<span class="hljs-number">0</span>, <span class="hljs-string">&#x27;day&#x27;</span>); <span class="hljs-comment">// &#x27;今天&#x27;</span>

<span class="hljs-keyword">const</span> en = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">RelativeTimeFormat</span>(<span class="hljs-string">&#x27;en&#x27;</span>);
en.<span class="hljs-title function_">format</span>(-<span class="hljs-number">1</span>, <span class="hljs-string">&#x27;day&#x27;</span>); <span class="hljs-comment">// &#x27;1 day ago&#x27;</span>
<span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">RelativeTimeFormat</span>(<span class="hljs-string">&#x27;en&#x27;</span>, { <span class="hljs-attr">numeric</span>: <span class="hljs-string">&#x27;auto&#x27;</span> }).<span class="hljs-title function_">format</span>(<span class="hljs-number">2</span>, <span class="hljs-string">&#x27;day&#x27;</span>); <span class="hljs-comment">// &#x27;in 2 days&#x27;</span>
<span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">RelativeTimeFormat</span>(<span class="hljs-string">&#x27;en&#x27;</span>, { <span class="hljs-attr">style</span>: <span class="hljs-string">&#x27;short&#x27;</span> }).<span class="hljs-title function_">format</span>(-<span class="hljs-number">3</span>, <span class="hljs-string">&#x27;month&#x27;</span>); <span class="hljs-comment">// &#x27;3 mo. ago&#x27;</span>
</code></pre></div>
<h2>计算时间差并选单位</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> <span class="hljs-variable constant_">UNITS</span> = [
  [<span class="hljs-string">&#x27;year&#x27;</span>, <span class="hljs-number">365</span> * <span class="hljs-number">24</span> * <span class="hljs-number">3600</span>],
  [<span class="hljs-string">&#x27;month&#x27;</span>, <span class="hljs-number">30</span> * <span class="hljs-number">24</span> * <span class="hljs-number">3600</span>],
  [<span class="hljs-string">&#x27;day&#x27;</span>, <span class="hljs-number">24</span> * <span class="hljs-number">3600</span>],
  [<span class="hljs-string">&#x27;hour&#x27;</span>, <span class="hljs-number">3600</span>],
  [<span class="hljs-string">&#x27;minute&#x27;</span>, <span class="hljs-number">60</span>],
  [<span class="hljs-string">&#x27;second&#x27;</span>, <span class="hljs-number">1</span>],
];

<span class="hljs-keyword">function</span> <span class="hljs-title function_">formatRelative</span>(<span class="hljs-params">timestamp, now, locale</span>) {
  <span class="hljs-keyword">const</span> seconds = <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">round</span>((timestamp - now) / <span class="hljs-number">1000</span>);
  <span class="hljs-keyword">const</span> rtf = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">RelativeTimeFormat</span>(locale, { <span class="hljs-attr">numeric</span>: <span class="hljs-string">&#x27;auto&#x27;</span> });
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> [unit, size] <span class="hljs-keyword">of</span> <span class="hljs-variable constant_">UNITS</span>) {
    <span class="hljs-keyword">if</span> (<span class="hljs-title class_">Math</span>.<span class="hljs-title function_">abs</span>(seconds) &gt;= size || unit === <span class="hljs-string">&#x27;second&#x27;</span>) {
      <span class="hljs-keyword">return</span> rtf.<span class="hljs-title function_">format</span>(<span class="hljs-title class_">Math</span>.<span class="hljs-title function_">round</span>(seconds / size), unit);
    }
  }
}
</code></pre></div>
<p>这里的&quot;月&quot;&quot;年&quot;用固定秒数近似，适合&quot;大约多久以前&quot;的展示。&quot;昨天&quot;如果要严格按日历日计算（比如昨晚 23 点到今早 1 点只差 2 小时，也应显示&quot;昨天&quot;），要先按用户时区比较日期，再算天数差。</p>
<h2>显示与刷新</h2>
<ul>
<li>在相对时间旁边提供绝对时间，例如 <code>&lt;time datetime=&quot;2026-10-28T09:00:00Z&quot; title=&quot;2026年10月28日 17:00&quot;&gt;</code>。</li>
<li>按时间差决定刷新频率：一分钟内每 10 秒刷新，一小时内每分钟刷新，更早的不必自动刷新。</li>
<li>读屏器不需要每次刷新都播报，不要把相对时间放进 live region。</li>
</ul>
<h2>与 Temporal 的关系</h2>
<p>Temporal 已于 2026 年 3 月进入 TC39 第 4 阶段，预计收入 ES2027。它提供带时区和日历的日期计算（例如按日历日相减），计算结果仍然交给 <code>Intl.RelativeTimeFormat</code> 显示。Node 22 还没有 Temporal，使用前要做能力检测或引入 polyfill。</p>
<h2>常见追问</h2>
<ul>
<li><strong>要按词高亮数字部分怎么办？</strong> 用 <code>formatToParts()</code>，返回结果里数字部分的 <code>type</code> 是 <code>&#x27;integer&#x27;</code>。</li>
<li><strong>为什么不用 moment 的 <code>fromNow()</code>？</strong> 可以用现成库，但 Intl 内置在运行时里，不增加包体积，语言数据也由运行时维护。</li>
</ul>`};export{e as default};