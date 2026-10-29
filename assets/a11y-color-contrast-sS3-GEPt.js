var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>设计稿上常见的浅灰字配白底，视力不好的人或者在阳光下看手机的人，很可能看不清。WCAG 用对比度来量化这件事。按 1.4.3（AA 级），普通文字和背景的对比度至少 4.5:1，大号文字至少 3:1。大号指 18pt，或者 14pt 加粗，大约是 24px 或 18.66px 加粗。</p>
<p>不只是文字。按 1.4.11（AA 级），理解界面要用到的图形和控件边界，比如输入框边框、图标、焦点环、图表线条，也要至少 3:1。按 1.4.1（A 级），颜色不能是传达信息的唯一方式，错误字段除了变红，还要有文字或图标。</p>
<p>有个例外：WCAG 不要求禁用的控件满足对比度。不过产品上通常还是要让用户看得出它不可用。</p>
<p>要注意，深色模式、悬停、聚焦这些状态都会换颜色，每一种都要单独检查。Windows 的高对比度模式，也就是 <code>forced-colors</code>，也要看一遍。</p>
</blockquote>
<h2>对比度怎么算</h2>
<p>公式是：对比度 = (L1 + 0.05) / (L2 + 0.05)。L1 是较亮颜色的相对亮度，L2 是较暗颜色的相对亮度。相对亮度可以理解为“这个颜色在人眼里有多亮”，绿色占的权重最大。</p>
<p>下面把公式写成代码，算两组常见的颜色。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">luminance</span>(<span class="hljs-params">hex</span>) {
  <span class="hljs-keyword">const</span> [r, g, b] = hex.<span class="hljs-title function_">match</span>(<span class="hljs-regexp">/\\w\\w/g</span>).<span class="hljs-title function_">map</span>(<span class="hljs-function">(<span class="hljs-params">c</span>) =&gt;</span> {
    <span class="hljs-keyword">const</span> v = <span class="hljs-built_in">parseInt</span>(c, <span class="hljs-number">16</span>) / <span class="hljs-number">255</span>;
    <span class="hljs-keyword">return</span> v &lt;= <span class="hljs-number">0.04045</span> ? v / <span class="hljs-number">12.92</span> : ((v + <span class="hljs-number">0.055</span>) / <span class="hljs-number">1.055</span>) ** <span class="hljs-number">2.4</span>;
  });
  <span class="hljs-keyword">return</span> <span class="hljs-number">0.2126</span> * r + <span class="hljs-number">0.7152</span> * g + <span class="hljs-number">0.0722</span> * b;
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">contrast</span>(<span class="hljs-params">a, b</span>) {
  <span class="hljs-keyword">const</span> [hi, lo] = [<span class="hljs-title function_">luminance</span>(a), <span class="hljs-title function_">luminance</span>(b)].<span class="hljs-title function_">sort</span>(<span class="hljs-function">(<span class="hljs-params">x, y</span>) =&gt;</span> y - x);
  <span class="hljs-keyword">return</span> (hi + <span class="hljs-number">0.05</span>) / (lo + <span class="hljs-number">0.05</span>);
}

<span class="hljs-title function_">contrast</span>(<span class="hljs-string">&#x27;#767676&#x27;</span>, <span class="hljs-string">&#x27;#ffffff&#x27;</span>); <span class="hljs-comment">// 约 4.54，正文刚好达标</span>
<span class="hljs-title function_">contrast</span>(<span class="hljs-string">&#x27;#000000&#x27;</span>, <span class="hljs-string">&#x27;#ffffff&#x27;</span>); <span class="hljs-comment">// 21</span>
</code></pre></div>
<p>黑配白是最大值 21。<code>#767676</code> 这种灰配白底是 4.54，刚好过 4.5。再浅一点，正文就不达标了。</p>
<p>实际工作中不用自己算，开发者工具的取色器或设计工具插件会直接显示是否达到 AA 和 AAA。</p>
<p>关键是每一种实际出现的颜色组合都要算。悬停、聚焦、选中和深色模式都会换颜色，所以要分别检查。WCAG 1.4.3 对禁用控件不作要求，但禁用状态完全看不出来，同样会让用户困惑。</p>
<h2>状态为什么不能只靠颜色</h2>
<p>色盲用户分不清红和绿。如果错误只靠边框变红来表示，他们根本发现不了。下面的写法在颜色之外还给了图标和文字。</p>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">label</span> <span class="hljs-attr">for</span>=<span class="hljs-string">&quot;email&quot;</span>&gt;</span>邮箱<span class="hljs-tag">&lt;/<span class="hljs-name">label</span>&gt;</span>
<span class="hljs-tag">&lt;<span class="hljs-name">input</span> <span class="hljs-attr">id</span>=<span class="hljs-string">&quot;email&quot;</span> <span class="hljs-attr">aria-invalid</span>=<span class="hljs-string">&quot;true&quot;</span> <span class="hljs-attr">aria-describedby</span>=<span class="hljs-string">&quot;email-error&quot;</span>&gt;</span>
<span class="hljs-tag">&lt;<span class="hljs-name">p</span> <span class="hljs-attr">id</span>=<span class="hljs-string">&quot;email-error&quot;</span> <span class="hljs-attr">class</span>=<span class="hljs-string">&quot;error&quot;</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">svg</span> <span class="hljs-attr">aria-hidden</span>=<span class="hljs-string">&quot;true&quot;</span>&gt;</span>…<span class="hljs-tag">&lt;/<span class="hljs-name">svg</span>&gt;</span>
  请输入有效的邮箱地址
<span class="hljs-tag">&lt;/<span class="hljs-name">p</span>&gt;</span>
</code></pre></div>
<p><code>aria-invalid</code> 告诉读屏这个字段有错，<code>aria-describedby</code> 把错误文字关联到输入框上，聚焦时会一起读出来。</p>
<p>正文里的链接也是一样。如果只靠颜色和周围文字区分，链接颜色和周围文字的对比度要至少 3:1，并且在悬停和聚焦时加上下划线。最简单的做法是一直保留下划线。</p>
<h2>高对比度模式下会发生什么</h2>
<p>Windows 的高对比度模式会把背景色和阴影换成系统颜色。所以只靠背景色表示的选中状态，在这种模式下会直接消失。</p>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-keyword">@media</span> (<span class="hljs-attribute">forced-colors</span>: active) {
  <span class="hljs-selector-class">.chip</span><span class="hljs-selector-attr">[aria-pressed=<span class="hljs-string">&#x27;true&#x27;</span>]</span> {
    <span class="hljs-attribute">outline</span>: <span class="hljs-number">2px</span> solid CanvasText;
  }
}
</code></pre></div>
<p>改法是在这种模式下补上边框或轮廓，并使用 <code>CanvasText</code>、<code>Highlight</code> 这类系统颜色关键字，它们会跟着用户选的配色走。</p>
<h2>常见追问</h2>
<p><strong>APCA 能代替 WCAG 的公式吗？</strong></p>
<blockquote>
<p>不能。APCA 是社区提出的一种新对比度算法，常被拿来讨论 WCAG 3 该怎么算对比度。可是 WCAG 3 目前还是工作草案，草案里写明对比度算法还没有确定，也没有说要采用 APCA。所以现在做合规，仍然按 WCAG 2.2 的比例来。</p>
</blockquote>`};export{e as default};