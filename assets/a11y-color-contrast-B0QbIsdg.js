var e={answerHtml:`<h2>简答</h2>
<ul>
<li>WCAG 1.4.3（AA）：普通文字对比度至少 4.5:1，大号文字（18pt 或 14pt 加粗，约 24px 或 18.66px 加粗）至少 3:1。</li>
<li>WCAG 1.4.11（AA）：理解界面所需的图形和控件边界（输入框边框、图标、焦点环、图表线条）至少 3:1。</li>
<li>WCAG 1.4.1（A）：颜色不能是传达信息的唯一方式，例如错误字段除了变红还要有文字或图标。</li>
<li>WCAG 不要求禁用控件满足对比度；产品上通常仍让用户能看出它不可用。</li>
<li>深色模式、悬停、聚焦等每种状态都要单独检查，Windows 高对比度模式（<code>forced-colors</code>）也要检查。</li>
</ul>
<h2>对比度计算</h2>
<p>对比度 = (L1 + 0.05) / (L2 + 0.05)，L1 是较亮颜色的相对亮度，L2 是较暗颜色的相对亮度。</p>
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
<p>实际工作中用开发者工具的取色器或设计工具插件即可，它们会直接显示是否达到 AA 和 AAA。</p>
<p>对比度按每种实际出现的颜色组合计算，悬停、聚焦、选中和深色模式会换颜色，要分别检查。WCAG 1.4.3 对禁用控件不作要求，但禁用状态完全看不出来同样会让用户困惑。</p>
<h2>状态不只靠颜色</h2>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">label</span> <span class="hljs-attr">for</span>=<span class="hljs-string">&quot;email&quot;</span>&gt;</span>邮箱<span class="hljs-tag">&lt;/<span class="hljs-name">label</span>&gt;</span>
<span class="hljs-tag">&lt;<span class="hljs-name">input</span> <span class="hljs-attr">id</span>=<span class="hljs-string">&quot;email&quot;</span> <span class="hljs-attr">aria-invalid</span>=<span class="hljs-string">&quot;true&quot;</span> <span class="hljs-attr">aria-describedby</span>=<span class="hljs-string">&quot;email-error&quot;</span>&gt;</span>
<span class="hljs-tag">&lt;<span class="hljs-name">p</span> <span class="hljs-attr">id</span>=<span class="hljs-string">&quot;email-error&quot;</span> <span class="hljs-attr">class</span>=<span class="hljs-string">&quot;error&quot;</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">svg</span> <span class="hljs-attr">aria-hidden</span>=<span class="hljs-string">&quot;true&quot;</span>&gt;</span>…<span class="hljs-tag">&lt;/<span class="hljs-name">svg</span>&gt;</span>
  请输入有效的邮箱地址
<span class="hljs-tag">&lt;/<span class="hljs-name">p</span>&gt;</span>
</code></pre></div>
<p>链接在正文里如果只靠颜色区分，颜色与周围文字的对比度要至少 3:1，并在悬停和聚焦时加下划线；最简单的做法是一直保留下划线。</p>
<h2>强制颜色模式</h2>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-keyword">@media</span> (<span class="hljs-attribute">forced-colors</span>: active) {
  <span class="hljs-selector-class">.chip</span><span class="hljs-selector-attr">[aria-pressed=<span class="hljs-string">&#x27;true&#x27;</span>]</span> {
    <span class="hljs-attribute">outline</span>: <span class="hljs-number">2px</span> solid CanvasText;
  }
}
</code></pre></div>
<p>在 Windows 高对比度模式下，背景色和阴影会被系统颜色替换，只靠背景色表示的选中状态会消失。用边框或轮廓，并使用 <code>CanvasText</code>、<code>Highlight</code> 等系统颜色关键字。</p>
<h2>常见追问</h2>
<ul>
<li>APCA 能代替 WCAG 公式吗？APCA 是 WCAG 3 草案中研究的对比度算法，对深色模式更准确，但目前合规仍以 WCAG 2.2 的比例为准。</li>
</ul>`};export{e as default};