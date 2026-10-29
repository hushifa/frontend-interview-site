var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>评论列表里显示“5分钟前”“昨天”，用的就是 <code>Intl.RelativeTimeFormat</code>。可它只管格式化：<code>format(-5, &#x27;minute&#x27;)</code> 在中文下输出“5分钟前”，至于两个时间到底差了多少，它不会算。</p>
<p>所以应用要先自己算出时间差，再决定用秒、分、小时还是天，以及怎么取整，最后才交给它显示。</p>
<p>想说得更自然，就加 <code>numeric: &#x27;auto&#x27;</code>，-1 天、0 天、1 天会变成“昨天”“今天”“明天”。默认的 <code>&#x27;always&#x27;</code> 一律用数字。</p>
<p>要注意两点。列表排序、刷新判断都要基于原始时间戳，不要用显示出来的字符串。SSR 时服务端和客户端的“现在”不一样，相对时间会对不上，常见做法是服务端先输出绝对时间，客户端水合后再替换。</p>
</blockquote>
<h2>先看输出</h2>
<p>下面是几种常见写法的结果，都是 Node 22 实测的。</p>
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
<p>负数表示过去，正数表示将来。<code>numeric: &#x27;auto&#x27;</code> 只在有现成说法时才替换，所以 2 天后没有专门的词，仍然是“in 2 days”。<code>style: &#x27;short&#x27;</code> 会把单位缩写成“mo.”。</p>
<h2>时间差和单位要自己算</h2>
<p>下面这个函数先算出相差多少秒，再从大到小挑一个合适的单位。</p>
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
<p>这里的“月”和“年”用固定秒数近似，适合“大约多久以前”这种展示。</p>
<p>可是“昨天”如果要严格按日历算，这个办法就不够了。比如昨晚 23 点到今早 1 点只差 2 小时，按秒数算是“2小时前”，按日历却应该是“昨天”。这种情况要先按用户时区比较日期，再算相差几天。</p>
<h2>显示、刷新和 SSR</h2>
<p>相对时间不够精确，所以旁边最好附上绝对时间，例如 <code>&lt;time datetime=&quot;2026-10-28T09:00:00Z&quot; title=&quot;2026年10月28日 17:00&quot;&gt;</code>。</p>
<p>刷新频率按时间差定：一分钟以内每 10 秒刷新一次，一小时以内每分钟刷新一次，更早的不必自动刷新。这些刷新不需要读屏器每次都播报，所以不要把相对时间放进 live region。</p>
<p>列表排序、是否需要刷新，都用原始时间戳判断。显示出来的字符串随语言变化，不能再解析回去。</p>
<p>SSR 时还有一个坑。服务端渲染时的“现在”和客户端水合时的“现在”不同，“3分钟前”可能变成“4分钟前”，文字对不上就会水合不一致。常见做法是服务端只输出绝对时间，客户端水合后再换成相对时间。</p>
<h2>和 Temporal 是什么关系</h2>
<p>Temporal 已进入 TC39 第 4 阶段。它负责带时区和日历的日期计算，例如按日历日相减；算出来的结果，仍然交给 <code>Intl.RelativeTimeFormat</code> 显示。Node 22 还没有 Temporal，用之前要做能力检测，或者引入 polyfill。</p>
<h2>常见追问</h2>
<p><strong>想单独高亮数字部分怎么办？</strong></p>
<blockquote>
<p>用 <code>formatToParts()</code>。它会把结果拆成几段，数字那一段的 <code>type</code> 是 <code>&#x27;integer&#x27;</code>，其余是普通文字，可以分别加样式。</p>
</blockquote>
<p><strong>为什么不用 moment 的 <code>fromNow()</code>？</strong></p>
<blockquote>
<p>用现成的库也可以。只是 Intl 是运行时内置的，不增加包体积，语言数据也由运行时维护，不用自己跟着更新。</p>
</blockquote>`};export{e as default};