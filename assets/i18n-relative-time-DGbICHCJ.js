var e={answerHtml:`<h2>简答</h2>
<ul>
<li>Intl.RelativeTimeFormat 只负责本地化表达，不计算时间差。</li>
<li>先用同一个“现在”和明确的时间语义计算差值，再选择单位。</li>
<li>numeric: &#x27;auto&#x27; 会输出“昨天”这类自然说法，&#x27;always&#x27; 总是输出数值。</li>
<li>排序用原始时间戳；SSR 和水合之间时间文本可能不一致，要按产品需求取舍。</li>
</ul>
<p>消息列表里常见“刚刚”“5 分钟前”“明天”这样的文案。直接拼接 <code>value + &#x27;分钟前&#x27;</code> 看起来简单，却很快遇到英文前后顺序、阿拉伯语复数、负数方向、<code>yesterday</code> 等特殊词，以及不同语言对单位和标点的差异。<code>Intl.RelativeTimeFormat</code> 专门负责把“数值 + 单位 + 过去/未来方向”格式化成用户语言，但它不会替你计算两个时间戳相差多少。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> zh = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">RelativeTimeFormat</span>(<span class="hljs-string">&#x27;zh-CN&#x27;</span>, { <span class="hljs-attr">numeric</span>: <span class="hljs-string">&#x27;auto&#x27;</span> });
<span class="hljs-keyword">const</span> en = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">RelativeTimeFormat</span>(<span class="hljs-string">&#x27;en-US&#x27;</span>, { <span class="hljs-attr">numeric</span>: <span class="hljs-string">&#x27;auto&#x27;</span> });

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(zh.<span class="hljs-title function_">format</span>(-<span class="hljs-number">5</span>, <span class="hljs-string">&#x27;minute&#x27;</span>)); <span class="hljs-comment">// 约 5 分钟前</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(en.<span class="hljs-title function_">format</span>(-<span class="hljs-number">5</span>, <span class="hljs-string">&#x27;minute&#x27;</span>)); <span class="hljs-comment">// 5 minutes ago</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(en.<span class="hljs-title function_">format</span>(-<span class="hljs-number">1</span>, <span class="hljs-string">&#x27;day&#x27;</span>));    <span class="hljs-comment">// yesterday</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(en.<span class="hljs-title function_">format</span>(<span class="hljs-number">2</span>, <span class="hljs-string">&#x27;day&#x27;</span>));     <span class="hljs-comment">// in 2 days</span>
</code></pre></div>
<p>负值通常表示过去，正值表示未来；真正的语义由调用方约定。<code>format()</code> 的结果是展示字符串，不应写回数据库、用来排序或作为通知去重键。</p>
<h2>先确定时间基准，再计算数值和单位</h2>
<p>一个可靠的相对时间函数需要先明确服务端时间语义。服务端应传递 UTC 时间戳或带偏移的标准时间，客户端再用同一个“现在”计算差值：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> units = [
  [<span class="hljs-string">&#x27;year&#x27;</span>, <span class="hljs-number">365</span> * <span class="hljs-number">24</span> * <span class="hljs-number">60</span> * <span class="hljs-number">60</span>],
  [<span class="hljs-string">&#x27;month&#x27;</span>, <span class="hljs-number">30</span> * <span class="hljs-number">24</span> * <span class="hljs-number">60</span> * <span class="hljs-number">60</span>],
  [<span class="hljs-string">&#x27;week&#x27;</span>, <span class="hljs-number">7</span> * <span class="hljs-number">24</span> * <span class="hljs-number">60</span> * <span class="hljs-number">60</span>],
  [<span class="hljs-string">&#x27;day&#x27;</span>, <span class="hljs-number">24</span> * <span class="hljs-number">60</span> * <span class="hljs-number">60</span>],
  [<span class="hljs-string">&#x27;hour&#x27;</span>, <span class="hljs-number">60</span> * <span class="hljs-number">60</span>],
  [<span class="hljs-string">&#x27;minute&#x27;</span>, <span class="hljs-number">60</span>],
  [<span class="hljs-string">&#x27;second&#x27;</span>, <span class="hljs-number">1</span>],
];

<span class="hljs-keyword">function</span> <span class="hljs-title function_">relativeParts</span>(<span class="hljs-params">timestamp, now = <span class="hljs-built_in">Date</span>.now()</span>) {
  <span class="hljs-keyword">const</span> seconds = (timestamp - now) / <span class="hljs-number">1000</span>;
  <span class="hljs-keyword">const</span> absolute = <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">abs</span>(seconds);
  <span class="hljs-keyword">const</span> [unit, size] = units.<span class="hljs-title function_">find</span>(<span class="hljs-function">(<span class="hljs-params">[, unitSeconds]</span>) =&gt;</span> absolute &gt;= unitSeconds)
    ?? units.<span class="hljs-title function_">at</span>(-<span class="hljs-number">1</span>);
  <span class="hljs-keyword">const</span> value = <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">round</span>(seconds / size);
  <span class="hljs-keyword">return</span> { value, unit };
}

<span class="hljs-keyword">const</span> formatter = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">RelativeTimeFormat</span>(<span class="hljs-string">&#x27;zh-CN&#x27;</span>, {
  <span class="hljs-attr">numeric</span>: <span class="hljs-string">&#x27;auto&#x27;</span>,
});
<span class="hljs-keyword">const</span> { value, unit } = <span class="hljs-title function_">relativeParts</span>(<span class="hljs-title class_">Date</span>.<span class="hljs-title function_">now</span>() - <span class="hljs-number">5</span> * <span class="hljs-number">60</span> * <span class="hljs-number">1000</span>);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(formatter.<span class="hljs-title function_">format</span>(value, unit));
</code></pre></div>
<p>这个示例只是一个展示策略，不是时间计算标准。它使用固定的 365 天和 30 天近似年/月，适合“多久前”的粗略列表，不适合账单、合同、年龄或严格日历计算。涉及日历日期时，应根据产品语义和时区使用明确的日期时间库或 Temporal 等适用能力，不能把所有“月”都换算成 30 天。</p>
<p><code>Math.round</code>、<code>Math.floor</code> 和 <code>Math.trunc</code> 会产生不同边界：59.6 秒是显示“60 秒前”还是“1 分钟前”，应由产品定义。未来时间、客户端时钟错误和服务端时间漂移也要有策略；不能把负数差值默认为“数据损坏”。</p>
<h2>numeric auto 不是翻译字典</h2>
<p><code>numeric: &#x27;auto&#x27;</code> 允许运行时使用自然词，例如“昨天”“明天”或“上周”；<code>numeric: &#x27;always&#x27;</code> 则倾向于始终输出数值：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> always = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">RelativeTimeFormat</span>(<span class="hljs-string">&#x27;en&#x27;</span>, { <span class="hljs-attr">numeric</span>: <span class="hljs-string">&#x27;always&#x27;</span> });
<span class="hljs-keyword">const</span> natural = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">RelativeTimeFormat</span>(<span class="hljs-string">&#x27;en&#x27;</span>, { <span class="hljs-attr">numeric</span>: <span class="hljs-string">&#x27;auto&#x27;</span> });

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(always.<span class="hljs-title function_">format</span>(-<span class="hljs-number">1</span>, <span class="hljs-string">&#x27;day&#x27;</span>));  <span class="hljs-comment">// 1 day ago</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(natural.<span class="hljs-title function_">format</span>(-<span class="hljs-number">1</span>, <span class="hljs-string">&#x27;day&#x27;</span>)); <span class="hljs-comment">// yesterday</span>
</code></pre></div>
<p>自然词集合和具体文字由 locale 数据决定，不能假设所有语言都对每个单位有同样的特殊词。产品如果需要“昨天 15:30”这样的组合，应分别格式化日期和时间，再按语言规则组织，而不是对相对时间字符串做 <code>split(&#x27; &#x27;)</code>。</p>
<p><code>style</code> 可以选择 <code>long</code>、<code>short</code> 或 <code>narrow</code>，但窄样式不一定适合无障碍或没有上下文的列表。屏幕阅读器可能把“1h”读成难以理解的缩写；重要信息可以同时提供完整的绝对时间或通过可访问名称补充。</p>
<h2>不要用显示字符串做排序和刷新依据</h2>
<p>两个时间相差几秒时，它们可能都显示成“刚刚”；不同 locale 的字符串顺序也不代表时间顺序。列表应使用原始时间戳排序，formatter 只用于渲染：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> messages = [
  { <span class="hljs-attr">id</span>: <span class="hljs-string">&#x27;a&#x27;</span>, <span class="hljs-attr">createdAt</span>: <span class="hljs-string">&#x27;2026-10-28T00:00:00Z&#x27;</span> },
  { <span class="hljs-attr">id</span>: <span class="hljs-string">&#x27;b&#x27;</span>, <span class="hljs-attr">createdAt</span>: <span class="hljs-string">&#x27;2026-10-28T00:01:00Z&#x27;</span> },
];

messages.<span class="hljs-title function_">sort</span>(<span class="hljs-function">(<span class="hljs-params">a, b</span>) =&gt;</span> <span class="hljs-title class_">Date</span>.<span class="hljs-title function_">parse</span>(b.<span class="hljs-property">createdAt</span>) - <span class="hljs-title class_">Date</span>.<span class="hljs-title function_">parse</span>(a.<span class="hljs-property">createdAt</span>));
</code></pre></div>
<p>相对时间需要定时更新，但不应每秒重新渲染整个消息列表。可以根据下一个显示边界安排定时器，例如“59 秒前”即将变成“1 分钟前”时再更新；页面隐藏时暂停或降低频率，重新可见时立即根据新的 <code>now</code> 重算。定时器必须在组件卸载时清理，避免保留列表和 locale 闭包。</p>
<p>更新频率也要考虑用户感知：通知列表通常一分钟级别就够，实时监控可能需要秒级或直接显示绝对时间。过于频繁的更新会造成布局变化、读屏重复播报和不必要的 CPU 消耗。对于辅助技术，可让动态区域保持稳定，必要时通过明确的 <code>aria-label</code> 或详情信息表达精确时间，而不是每次刷新都触发 live region。</p>
<h2>SSR、水合和客户端时钟会制造不一致</h2>
<p>服务端生成“刚刚”，浏览器几秒后再水合，可能得到“1 分钟前”；服务端和客户端时区、当前时间或 locale 不同，也会出现文本不一致。处理方式需要按产品取舍：</p>
<ul>
<li>首屏使用服务端确定的 <code>now</code> 和 locale，并把它们传给客户端；</li>
<li>将相对时间延迟到客户端渲染，首屏先提供稳定的绝对时间；</li>
<li>服务端输出 <code>&lt;time datetime=&quot;...&quot;&gt;</code>，客户端增强可读的相对文案；</li>
<li>对搜索和 SEO 重要内容保留机器可读的绝对时间，不让相对词成为唯一信息。</li>
</ul>
<p><code>datetime</code> 属性应保存标准时间值，不能把“昨天”写进其中。用户切换语言或时区时，重新创建 formatter 并按新的显示策略更新文字，但原始时间戳不应改变。</p>
<h2>与时间库和 Temporal 的边界</h2>
<p><code>Intl.RelativeTimeFormat</code> 只做本地化格式化；它不处理时区转换、夏令时、日历月长度、业务工作日和复杂舍入。时间库可以帮助计算差值、解析时区和定义日历操作，但仍应把最终显示交给 Intl 或经过审校的本地化层。不能因为某个库返回了“5 minutes ago”，就把那串文本当成跨语言稳定结果。</p>
<p>如果使用 Temporal 或其他较新的时间 API，要区分 <code>Instant</code>、带时区的 <code>ZonedDateTime</code> 和纯日期的 <code>PlainDate</code>。消息创建时刻通常是一个瞬间；“下周一”是用户时区中的日历概念。把两者混成一个 JavaScript <code>Date</code> 再用固定秒数计算，容易在夏令时和跨午夜时出错。</p>
<h2>兼容性和验收</h2>
<p><code>Intl.RelativeTimeFormat</code> 在现代浏览器和 Node.js 中普遍可用，但项目仍应按目标 WebView、运行时版本和 ICU 数据验证。能力检测可以作为旧环境降级入口：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">createRelativeFormatter</span>(<span class="hljs-params">locale</span>) {
  <span class="hljs-keyword">if</span> (<span class="hljs-keyword">typeof</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-property">RelativeTimeFormat</span> === <span class="hljs-string">&#x27;function&#x27;</span>) {
    <span class="hljs-keyword">return</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">RelativeTimeFormat</span>(locale, { <span class="hljs-attr">numeric</span>: <span class="hljs-string">&#x27;auto&#x27;</span> });
  }

  <span class="hljs-keyword">return</span> {
    <span class="hljs-title function_">format</span>(<span class="hljs-params">value, unit</span>) {
      <span class="hljs-keyword">return</span> <span class="hljs-string">\`<span class="hljs-subst">\${value}</span> <span class="hljs-subst">\${unit}</span>\`</span>; <span class="hljs-comment">// 应替换为经过审校的有限降级文案</span>
    },
  };
}
</code></pre></div>
<p>示例中的降级文字只是占位，不能直接用于生产多语言页面。验收至少包括：</p>
<ul>
<li>过去、现在、未来和客户端时钟偏差；</li>
<li>秒/分/时/日/周/月/年的边界和舍入策略；</li>
<li><code>numeric: auto</code>、不同 style、长文本和 RTL locale；</li>
<li>SSR 首屏、水合、语言切换、页面隐藏和组件卸载；</li>
<li>排序仍使用原始时间，绝对时间和辅助技术信息可获得；</li>
<li>不支持 Intl 的旧环境不会把相对时间变成不可理解的混合文案。</li>
</ul>
<p>相对时间的难点不在调用 <code>format()</code>，而在确定“相差多少”的业务语义、使用哪个时区和现在、何时刷新以及怎样让用户获得精确时间。把计算、格式化、排序和生命周期分开，才能避免看似自然却不准确的时间体验。</p>`};export{e as default};