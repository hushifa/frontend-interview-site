var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>做主题时常见的需求是：给一个品牌色，自动得到它的悬停色、按下色、浅色背景和半透明边框。以前要么在设计稿里一个个取色，要么靠 Sass 在构建时算死。现在 CSS 自己就能算，而且能跟着变量在运行时变。</p>
<p><code>oklch()</code> 用三个数描述颜色：感知亮度 L、色度 C（颜色有多“浓”）、色相 H。它的 L 是人眼感觉到的亮度，所以只改 L 就能得到观感上均匀的深浅梯度，<code>hsl()</code> 的亮度不是按人眼感知定义的。</p>
<p>有了基础色，有两种派生办法。<code>color-mix(in oklab, var(--brand) 80%, black)</code> 按比例把两种颜色混在一起，适合悬停色，和 <code>transparent</code> 混还能得到半透明色。相对颜色语法 <code>oklch(from var(--brand) calc(l - 0.1) c h)</code> 先把品牌色拆成 l、c、h 三个通道，再改其中一个，适合精确地调亮度或透明度。</p>
<p>要注意兼容性。按 MDN 兼容性数据，<code>oklch()</code> 和 <code>color-mix()</code> 从 Chrome 111、Firefox 113、Safari 15.4 和 16.2 起支持，相对颜色语法要到 Chrome 122、Firefox 128、Safari 18 才完整支持，需要照顾旧浏览器时要先写一个固定颜色作为回退。</p>
</blockquote>
<h2>为什么用 oklch 而不是 hsl</h2>
<p><code>oklch()</code> 的写法是 <code>oklch(L C H / A)</code>。L 是 0 到 1（或 0% 到 100%），0 是黑、1 是白；C 是色度，最小为 0（灰色），理论上没有上限，实际不会超过 0.5；H 是色相角度；斜杠后面是可选的透明度。</p>
<p>MDN 特别说明，<code>oklch()</code> 的 L 是人眼感知到的亮度，而 <code>hsl()</code> 的 L 只是相对其他颜色而言的亮度，两者不是一回事。MDN 介绍 <code>color-mix()</code> 时也说 Oklab 是按感知均匀设计的。所以做一组“品牌色 100 到 900”的色阶，固定 C 和 H、只改 L，比在 <code>hsl</code> 里调亮度更接近人眼感觉到的均匀梯度。</p>
<p>还有一个容易记错的地方：<code>oklch()</code> 的色相角度和 <code>hsl()</code> 不同。MDN 举的例子是，<code>hsl()</code> 里 0 度是红色，而在 CIELab 色彩空间里 0 度对应品红，红色大约在 41 度。从 <code>hsl</code> 迁移过来时不能直接照搬色相值。</p>
<h2>用 color-mix 派生悬停色和半透明色</h2>
<p><code>color-mix()</code> 接收一个插值方法和若干颜色，返回混合结果：</p>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-pseudo">:root</span> {
  <span class="hljs-attr">--brand</span>: <span class="hljs-built_in">oklch</span>(<span class="hljs-number">0.6</span> <span class="hljs-number">0.15</span> <span class="hljs-number">250</span>);
}

<span class="hljs-selector-class">.button</span> {
  <span class="hljs-attribute">background</span>: <span class="hljs-built_in">var</span>(--brand);
}

<span class="hljs-selector-class">.button</span><span class="hljs-selector-pseudo">:hover</span> {
  <span class="hljs-attribute">background</span>: <span class="hljs-built_in">color-mix</span>(in oklab, <span class="hljs-built_in">var</span>(--brand) <span class="hljs-number">85%</span>, black);
}

<span class="hljs-selector-class">.button</span><span class="hljs-selector-pseudo">:focus-visible</span> {
  <span class="hljs-attribute">outline</span>: <span class="hljs-number">3px</span> solid <span class="hljs-built_in">color-mix</span>(in oklab, <span class="hljs-built_in">var</span>(--brand) <span class="hljs-number">40%</span>, transparent);
}
</code></pre></div>
<p><code>in oklab</code> 是混合所用的色彩空间。MDN 的建议是：要感知上均匀的过渡用 Oklab，想避免混合时颜色发灰用 Oklch，只有需要和某个按 sRGB 工作的设备或软件对齐时才用 sRGB，因为 sRGB 混出来容易偏暗、偏灰。</p>
<p>百分比的规则也要清楚。两个百分比只写一个时，另一个是 100% 减去它；都不写时各占 50%；加起来不等于 100% 时会按比例归一化。如果加起来小于 100%，结果还会乘上这个总和作为透明度，效果相当于和 <code>transparent</code> 混合。上面 <code>outline</code> 的写法就是“品牌色只占 40%，其余是透明”，得到一个半透明的焦点环。</p>
<h2>用相对颜色语法精确改一个通道</h2>
<p>相对颜色语法在颜色函数里加上 <code>from</code> 和一个原色。浏览器先把原色转换成这个函数对应的色彩空间，再把各通道的值作为 <code>l</code>、<code>c</code>、<code>h</code>、<code>alpha</code> 这几个关键字提供给你：</p>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-pseudo">:root</span> {
  <span class="hljs-attr">--brand</span>: <span class="hljs-built_in">oklch</span>(<span class="hljs-number">0.6</span> <span class="hljs-number">0.15</span> <span class="hljs-number">250</span>);
  <span class="hljs-attr">--brand-strong</span>: <span class="hljs-built_in">oklch</span>(from <span class="hljs-built_in">var</span>(--brand) <span class="hljs-built_in">calc</span>(l - <span class="hljs-number">0.1</span>) c h);
  <span class="hljs-attr">--brand-soft</span>: <span class="hljs-built_in">oklch</span>(from <span class="hljs-built_in">var</span>(--brand) <span class="hljs-number">0.95</span> <span class="hljs-built_in">calc</span>(c * <span class="hljs-number">0.3</span>) h);
  <span class="hljs-attr">--brand-ghost</span>: <span class="hljs-built_in">oklch</span>(from <span class="hljs-built_in">var</span>(--brand) l c h / <span class="hljs-number">0.2</span>);
}
</code></pre></div>
<p><code>--brand-strong</code> 只把亮度降了 0.1，色度和色相原样保留。<code>--brand-soft</code> 把亮度定为 0.95、色度降到三成，得到同色系的浅背景。<code>--brand-ghost</code> 只改透明度。原色可以是任何合法颜色，包括自定义属性、<code>currentColor</code>，甚至另一个相对颜色，色彩空间也不需要和输出函数一致。</p>
<p>和 <code>color-mix()</code> 相比，相对颜色语法能指定“只改亮度”“只改透明度”这类具体操作；<code>color-mix()</code> 只能指定混合比例，结果怎样取决于和什么颜色混。两者经常一起用。</p>
<h2>为什么主题切换时这些派生色会跟着变</h2>
<p>派生色写的是 <code>var(--brand)</code>，不是某个固定值，所以它们在浏览器里按元素实际拿到的 <code>--brand</code> 计算。深色主题里只要重新定义 <code>--brand</code> 这一个变量，悬停色、浅背景、焦点环都会跟着重新算出来，不需要为深色主题再写一套派生色。主题变量的组织方式和切换流程见<a href="/questions/design-dark-mode/">《怎样实现网站的暗黑模式和主题切换？》</a>，变量怎样分层命名见<a href="/questions/architecture-design-tokens/">《设计 token 为什么比散落的颜色变量更适合大型前端项目？》</a>。</p>
<p>Sass 的 <code>darken()</code> 是在构建时算出一个固定值，运行时改不了，这也是原生颜色函数的优势，见<a href="/questions/css-preprocessors/">《Sass、Less 这类 CSS 预处理器解决了什么问题？原生 CSS 现在能替代它们吗？》</a>。</p>
<h2>兼容性怎样处理</h2>
<p>下面的版本号来自 MDN browser-compat-data 8.1.7（2026 年 10 月）。</p>
<table><thead><tr><th>特性</th><th>Chrome</th><th>Firefox</th><th>Safari</th></tr></thead><tbody><tr><td><code>oklch()</code></td><td>111</td><td>113</td><td>15.4</td></tr><tr><td><code>color-mix()</code></td><td>111</td><td>113</td><td>16.2</td></tr><tr><td><code>oklch()</code> 相对颜色语法</td><td>122（119 起部分支持）</td><td>128</td><td>18（16.4 起部分支持）</td></tr><tr><td><code>color-mix()</code> 混合多于两种颜色</td><td>不支持</td><td>150</td><td>27</td></tr></tbody></table>
<p>所以 <code>color-mix()</code> 目前稳妥的用法是只混两种颜色。需要照顾旧浏览器时，利用 CSS 遇到不认识的值会丢弃整条声明的规则，先写一条固定颜色，再写新语法：</p>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.button</span><span class="hljs-selector-pseudo">:hover</span> {
  <span class="hljs-attribute">background</span>: <span class="hljs-number">#2f5fb3</span>;
  <span class="hljs-attribute">background</span>: <span class="hljs-built_in">oklch</span>(from <span class="hljs-built_in">var</span>(--brand) <span class="hljs-built_in">calc</span>(l - <span class="hljs-number">0.1</span>) c h);
}
</code></pre></div>
<p>不过这个写法对通过 <code>var()</code> 引用的值不起作用。MDN 解释说，浏览器解析自定义属性时还不知道它会用在哪里，几乎所有值都算合法；等替换进 <code>color</code> 这类属性后发现无效，用的是继承值或初始值，而不是退回上一条声明。这种情况可以用 <code>@supports</code> 检测，MDN 给的写法是 <code>@supports (color: hsl(from white h s l))</code>，换成 <code>oklch</code> 同理，只在支持时才定义派生变量。</p>
<h2>常见追问</h2>
<p><strong>用户自选主题色时，JavaScript 要算出所有派生色吗？</strong></p>
<blockquote>
<p>不用。派生色都写成基于 <code>var(--brand)</code> 的表达式，JavaScript 只需要用 <code>document.documentElement.style.setProperty(&#x27;--brand&#x27;, &#x27;oklch(0.6 0.15 250)&#x27;)</code> 改这一个变量，其余颜色由浏览器重新计算。</p>
</blockquote>
<p><strong>为什么混合时要写 in oklab，不写会怎样？</strong></p>
<blockquote>
<p>插值方法决定在哪个色彩空间里混合，同样两种颜色在 sRGB 和 Oklab 里混出来不一样。MDN 说省略时默认是 <code>oklab</code>，但显式写出来更清楚，读代码的人不用记默认值。</p>
</blockquote>`};export{e as default};