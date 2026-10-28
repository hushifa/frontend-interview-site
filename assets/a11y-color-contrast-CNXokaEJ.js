var e={answerHtml:`<h2>简答</h2>
<ul>
<li>WCAG 1.4.3（AA）要求普通文本对比度至少 4.5:1，大文本至少 3:1。</li>
<li>WCAG 1.4.11 要求界面组件和有意义图形与相邻颜色至少 3:1。</li>
<li>对比度按相对亮度计算，不是比较 RGB 数值差；判断是否达标要用未舍入的结果。</li>
<li>颜色不能是唯一的信息通道，错误和状态还需要文字、图标或形状提示，并检查强制颜色模式。</li>
</ul>
<p>把错误文字改成红色、把“已完成”改成绿色，看起来很直观，但色觉差异、低亮度屏幕、强制颜色模式和环境光都会让一部分用户无法仅靠颜色区分状态。无障碍的目标不是让所有颜色都变成黑白，而是让信息在颜色改变或不可见时仍然可理解。</p>
<h2>对比度不是只看两个十六进制颜色</h2>
<p>WCAG 2.2 的 1.4.3（AA）要求普通文本通常至少 4.5:1，大文本至少 3:1。大文本的定义包含至少 18pt 的普通字体或至少 14pt 的粗体，按 96dpi 换算约为 24 CSS px 和 18.67 CSS px，不能仅因为设计稿把它叫“标题”就采用较低阈值。非文本内容另有适用条件，不能把普通文字规则直接套用所有图形。</p>
<p>对比度计算基于相对亮度，不是简单比较 RGB 三个数字的差值。文字还可能叠在渐变、图片、半透明层或动态背景上，不能只用设计稿中的单一背景色判断。</p>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-pseudo">:root</span> {
  <span class="hljs-attr">--text</span>: <span class="hljs-number">#172033</span>;
  <span class="hljs-attr">--surface</span>: <span class="hljs-number">#ffffff</span>;
  <span class="hljs-attr">--danger</span>: <span class="hljs-number">#b42318</span>;
  <span class="hljs-attr">--focus</span>: <span class="hljs-number">#005fcc</span>;
}

<span class="hljs-selector-tag">body</span> {
  <span class="hljs-attribute">color</span>: <span class="hljs-built_in">var</span>(--text);
  <span class="hljs-attribute">background</span>: <span class="hljs-built_in">var</span>(--surface);
}

<span class="hljs-selector-class">.error-message</span> {
  <span class="hljs-attribute">color</span>: <span class="hljs-built_in">var</span>(--danger);
}

<span class="hljs-selector-tag">button</span><span class="hljs-selector-pseudo">:focus-visible</span>,
<span class="hljs-selector-tag">input</span><span class="hljs-selector-pseudo">:focus-visible</span> {
  <span class="hljs-attribute">outline</span>: <span class="hljs-number">3px</span> solid <span class="hljs-built_in">var</span>(--focus);
  <span class="hljs-attribute">outline-offset</span>: <span class="hljs-number">2px</span>;
}
</code></pre></div>
<p>工具可以帮助检查候选颜色，但不能代替真实页面检查。字体抗锯齿、文字大小、背景图片和透明度都会影响实际可读性；一个颜色对比工具通过，不代表所有状态和主题都通过。</p>
<h2>一个可运行的对比度计算示例</h2>
<p>以下只接受 #RRGGBB 格式的不透明 sRGB 颜色，不解析透明度、渐变或 CSS Color 4 色域。先把 sRGB 分量线性化，再按相对亮度权重计算，最后用较亮与较暗的亮度求比值：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">luminance</span>(<span class="hljs-params">hex</span>) {
  <span class="hljs-keyword">if</span> (<span class="hljs-keyword">typeof</span> hex !== <span class="hljs-string">&#x27;string&#x27;</span> || !<span class="hljs-regexp">/^#[0-9a-f]{6}$/i</span>.<span class="hljs-title function_">test</span>(hex)) {
    <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">TypeError</span>(<span class="hljs-string">&#x27;只接受不透明的 #RRGGBB 颜色&#x27;</span>);
  }
  <span class="hljs-keyword">const</span> channels = [<span class="hljs-number">1</span>, <span class="hljs-number">3</span>, <span class="hljs-number">5</span>].<span class="hljs-title function_">map</span>(<span class="hljs-function">(<span class="hljs-params">start</span>) =&gt;</span> {
    <span class="hljs-keyword">const</span> value = <span class="hljs-built_in">parseInt</span>(hex.<span class="hljs-title function_">slice</span>(start, start + <span class="hljs-number">2</span>), <span class="hljs-number">16</span>) / <span class="hljs-number">255</span>;
    <span class="hljs-keyword">return</span> value &lt;= <span class="hljs-number">0.04045</span> ? value / <span class="hljs-number">12.92</span> : ((value + <span class="hljs-number">0.055</span>) / <span class="hljs-number">1.055</span>) ** <span class="hljs-number">2.4</span>;
  });
  <span class="hljs-keyword">return</span> <span class="hljs-number">0.2126</span> * channels[<span class="hljs-number">0</span>] + <span class="hljs-number">0.7152</span> * channels[<span class="hljs-number">1</span>] + <span class="hljs-number">0.0722</span> * channels[<span class="hljs-number">2</span>];
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">contrastRatio</span>(<span class="hljs-params">first, second</span>) {
  <span class="hljs-keyword">const</span> a = <span class="hljs-title function_">luminance</span>(first);
  <span class="hljs-keyword">const</span> b = <span class="hljs-title function_">luminance</span>(second);
  <span class="hljs-keyword">return</span> (<span class="hljs-title class_">Math</span>.<span class="hljs-title function_">max</span>(a, b) + <span class="hljs-number">0.05</span>) / (<span class="hljs-title class_">Math</span>.<span class="hljs-title function_">min</span>(a, b) + <span class="hljs-number">0.05</span>);
}

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">contrastRatio</span>(<span class="hljs-string">&#x27;#000000&#x27;</span>, <span class="hljs-string">&#x27;#ffffff&#x27;</span>)); <span class="hljs-comment">// 21</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">contrastRatio</span>(<span class="hljs-string">&#x27;#ffffff&#x27;</span>, <span class="hljs-string">&#x27;#ffffff&#x27;</span>)); <span class="hljs-comment">// 1</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">contrastRatio</span>(<span class="hljs-string">&#x27;#b42318&#x27;</span>, <span class="hljs-string">&#x27;#ffffff&#x27;</span>) &gt;= <span class="hljs-number">4.5</span>); <span class="hljs-comment">// true</span>
</code></pre></div>
<p>展示时可以保留两位小数，是否达标则应使用未舍入的结果。半透明前景需要先按实际背景合成，图片背景需要考虑文字覆盖区域的变化；这个函数没有这些能力。它也不能判断字号、字重、例外条件或实际阅读体验，只计算两个已知颜色的比值。</p>
<h2>颜色不能是唯一的信息通道</h2>
<p>下面的提示同时使用图标、文字和语义属性，而不是只依赖红色边框：</p>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">label</span> <span class="hljs-attr">for</span>=<span class="hljs-string">&quot;email&quot;</span>&gt;</span>邮箱<span class="hljs-tag">&lt;/<span class="hljs-name">label</span>&gt;</span>
<span class="hljs-tag">&lt;<span class="hljs-name">input</span>
  <span class="hljs-attr">id</span>=<span class="hljs-string">&quot;email&quot;</span>
  <span class="hljs-attr">type</span>=<span class="hljs-string">&quot;email&quot;</span>
  <span class="hljs-attr">aria-invalid</span>=<span class="hljs-string">&quot;true&quot;</span>
  <span class="hljs-attr">aria-describedby</span>=<span class="hljs-string">&quot;email-error&quot;</span>
  <span class="hljs-attr">value</span>=<span class="hljs-string">&quot;wrong&quot;</span>
  <span class="hljs-attr">class</span>=<span class="hljs-string">&quot;field field--error&quot;</span>
&gt;</span>
<span class="hljs-tag">&lt;<span class="hljs-name">p</span> <span class="hljs-attr">id</span>=<span class="hljs-string">&quot;email-error&quot;</span> <span class="hljs-attr">class</span>=<span class="hljs-string">&quot;error-message&quot;</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">span</span> <span class="hljs-attr">aria-hidden</span>=<span class="hljs-string">&quot;true&quot;</span>&gt;</span>!<span class="hljs-tag">&lt;/<span class="hljs-name">span</span>&gt;</span>
  请输入有效的邮箱地址。
<span class="hljs-tag">&lt;/<span class="hljs-name">p</span>&gt;</span>
</code></pre></div>
<p><code>aria-invalid</code> 表达字段状态，错误文字说明如何修复，图标只是辅助提示。CSS 可以再加边框或背景，但即使用户看不出红色，也应能通过文字、结构和读屏信息理解问题。</p>
<p>图表同样不能只用红绿区分两条线。可以加入不同线型、点形、直接标注和可访问数据表；地图热力图要考虑色盲用户、灰度显示和极端值，不要把彩虹渐变当成默认科学可视化方案。</p>
<h2>文本、图标和控件边界要分别判断</h2>
<p>禁用状态、占位文本和辅助说明经常被设计成低对比度，但“次要”或“不重要”不是任意降低文本对比度的理由。不可用控件中的文字、纯装饰等在标准中有特定例外；仍用于传达信息的帮助文字和 placeholder 通常要满足相应对比要求。placeholder 也不应承担字段名称或唯一提示。比例是阈值，不应将低于要求的结果四舍五入后判为通过。</p>
<p>WCAG 1.4.11 非文本对比度（AA）要求：识别控件及其状态所需的视觉信息（如输入框边框、复选框、焦点指示器），以及理解内容所需的图形部分，与相邻颜色的对比度至少 3:1。未激活的控件和未修改的浏览器默认样式不在此列。</p>
<p>图标按钮需要可访问名称，图标本身的颜色不应是唯一状态。选中、未选中、连接中和错误可以同时使用文字、形状、边框、<code>aria-pressed</code>、<code>aria-selected</code> 或状态区域表达。装饰图标则应避免重复朗读。</p>
<p>焦点指示器是控件可用性的必要部分。不要用 <code>outline: none</code> 后只留下颜色很接近背景的阴影；焦点应在相邻状态和不同主题中都清楚可见，并且不能被 <code>overflow: hidden</code> 裁掉。键盘用户需要知道当前操作位置，而不只是看到页面颜色改变。</p>
<h2>主题、图片和透明度会改变实际结果</h2>
<p>深色主题不能只把背景改黑，却保留一套在白底上设计的灰色文字。每个主题都要检查正文、次要文字、链接、边框、图标、焦点和错误状态。用户放大字体后，换行和控件尺寸也可能改变，不能只在默认字号下验收。</p>
<p>文字叠在图片或渐变上时，应增加稳定的背景层、文字阴影或单独的内容区域。阴影不能当作提高对比度的唯一修复；背景变化后它可能仍然不够清晰。半透明文字和半透明背景要按照合成后的实际颜色评估，不能只拿 CSS 源值送进工具。</p>
<p>还要考虑 <code>prefers-contrast</code>、<code>forced-colors: active</code> 和高对比系统设置。强制颜色模式可能替换背景、边框和文字颜色，依赖背景图或纯色装饰来表达状态的设计会失效：</p>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-keyword">@media</span> (<span class="hljs-attribute">forced-colors</span>: active) {
  <span class="hljs-selector-class">.status-dot</span> {
    <span class="hljs-attribute">border</span>: <span class="hljs-number">1px</span> solid CanvasText;
    <span class="hljs-attribute">background</span>: Canvas;
  }

  <span class="hljs-selector-class">.status-dot</span><span class="hljs-selector-attr">[data-state=<span class="hljs-string">&quot;error&quot;</span>]</span> {
    <span class="hljs-attribute">border-color</span>: CanvasText;
    <span class="hljs-attribute">border-style</span>: double;
    <span class="hljs-attribute">border-width</span>: <span class="hljs-number">3px</span>;
  }
}
</code></pre></div>
<p>这个样式使用系统颜色并保留默认的强制颜色调整，同时用边框形态辅助区分。状态点旁仍应有“错误”等文字，不依赖系统颜色恰好不同来表达唯一信息。forced-color-adjust: none 会退出部分自动颜色调整，只有确实需要保留特殊图形且验证过系统配色时才局部使用，不能把它当成恢复原设计的默认开关。</p>
<h2>自动检查和人工检查各自能证明什么</h2>
<p>自动化工具可以发现部分文本对比度、缺少焦点样式或颜色规则问题，但无法判断文案是否清楚、图表是否可理解、焦点是否被遮挡，也不能覆盖所有浏览器和系统颜色模式。截图测试同样可能在默认主题下通过，却在高对比模式下完全失效。</p>
<p>验收至少包括：</p>
<ul>
<li>普通文本、链接、错误、禁用、悬停、聚焦和选中状态；</li>
<li>浅色、深色、系统高对比和强制颜色模式；</li>
<li>灰度显示、低亮度屏幕、文字放大和窄视口；</li>
<li>不看颜色时能否通过文字、形状、位置或语义理解状态；</li>
<li>键盘焦点是否清晰，读屏用户是否能获得同样的状态信息。</li>
</ul>
<p>对比度只是可访问性的一部分。一个颜色数字满足最低比例，不代表页面的层级、焦点、文案和操作路径已经可用；把视觉检查、自动规则和真实用户流程结合起来，才能知道设计是否真的帮助用户完成任务。</p>`};export{e as default};