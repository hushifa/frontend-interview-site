var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>国际化测试最常见的误区，是只把浏览器语言切成英文看一眼。其实语言、地区、时区、书写方向是四个独立的变量。浏览器语言是英文，不代表用户在美国，更不代表要用纽约时区。</p>
<p>组合太多，全测不现实，所以按风险挑代表：一种文字较长的语言、一种复杂文字、一种从右到左的语言、一个日期和数字格式不同的地区，再加两个相差较大的时区。</p>
<p>还没拿到真实翻译时，可以先做伪本地化。把文案加长、加上重音字符和边界标记，溢出、截断和写死的字符串马上就能看出来。自动化测试要显式固定 locale 和时区，不依赖运行机器的系统设置，并覆盖夏令时切换和跨午夜。</p>
<p>要注意，方向、焦点顺序、读屏输出和翻译质量，工具判断不了，需要人工检查。</p>
</blockquote>
<h2>测试矩阵怎样挑</h2>
<p>下面每一行都对应一类容易出问题的情况。</p>
<table><thead><tr><th>维度</th><th>代表值</th><th>发现的问题</th></tr></thead><tbody><tr><td>长文本</td><td><code>de-DE</code></td><td>按钮、表头、导航溢出</td></tr><tr><td>复杂文字</td><td><code>ja-JP</code>、<code>th-TH</code></td><td>换行、截断、字体回退</td></tr><tr><td>RTL</td><td><code>ar</code></td><td>方向、图标镜像、焦点顺序</td></tr><tr><td>格式</td><td><code>en-IN</code>（数字写作 <code>12,34,567.891</code>）、<code>de-CH</code></td><td>千位分隔、日期顺序、货币</td></tr><tr><td>时区</td><td><code>Asia/Shanghai</code>、<code>America/New_York</code></td><td>跨日、夏令时</td></tr></tbody></table>
<p>在这些组合上，再叠加窄屏、200% 字号和读屏器，大部分布局和格式问题都能暴露出来。</p>
<h2>伪本地化是什么</h2>
<p>伪本地化就是不用真翻译，先用程序把原文“变个样”，看页面扛不扛得住。下面是一个最简单的版本。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// 只变换纯文字片段，变量由调用方另外拼接</span>
<span class="hljs-keyword">function</span> <span class="hljs-title function_">pseudo</span>(<span class="hljs-params">text</span>) {
  <span class="hljs-keyword">const</span> accented = text.<span class="hljs-title function_">replace</span>(<span class="hljs-regexp">/[A-Za-z]/g</span>, <span class="hljs-function">(<span class="hljs-params">ch</span>) =&gt;</span> <span class="hljs-string">\`<span class="hljs-subst">\${ch}</span>̄\`</span>);
  <span class="hljs-keyword">return</span> <span class="hljs-string">\`[<span class="hljs-subst">\${accented}</span>~~~~]\`</span>; <span class="hljs-comment">// 方括号标出边界，波浪线模拟变长</span>
}
</code></pre></div>
<p>它给每个字母加上一个组合用的横线，再在两头加上方括号和波浪线。</p>
<p>方括号是用来找问题的。页面上出现了不带方括号的文字，说明这段文字写死在代码里，没有走翻译。方括号被截掉了一半，说明容器宽度写死了，或者用了截断。</p>
<p>可是真实消息里常带 ICU 语法。这时不能用正则直接处理整条消息，否则变量名和 <code>plural</code>、<code>select</code> 的分支键也会被改掉。要用消息解析器，只改写其中的文字节点。</p>
<h2>测试为什么要固定时区</h2>
<p>如果测试依赖运行机器的系统时区，本地能过、CI 上就挂。所以格式化时直接把时区传进去。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// 不依赖系统时区，直接在格式化时指定</span>
<span class="hljs-keyword">const</span> <span class="hljs-title function_">format</span> = (<span class="hljs-params">date, locale, timeZone</span>) =&gt;
  <span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">DateTimeFormat</span>(locale, { <span class="hljs-attr">dateStyle</span>: <span class="hljs-string">&#x27;short&#x27;</span>, <span class="hljs-attr">timeStyle</span>: <span class="hljs-string">&#x27;short&#x27;</span>, timeZone }).<span class="hljs-title function_">format</span>(date);

<span class="hljs-title function_">format</span>(<span class="hljs-keyword">new</span> <span class="hljs-title class_">Date</span>(<span class="hljs-string">&#x27;2026-01-01T00:00:00Z&#x27;</span>), <span class="hljs-string">&#x27;en-GB&#x27;</span>, <span class="hljs-string">&#x27;America/New_York&#x27;</span>); <span class="hljs-comment">// &#x27;31/12/2025, 19:00&#x27;</span>
</code></pre></div>
<p>同一个 UTC 时刻，在纽约还是前一年的 12 月 31 日。这种跨日的情况正是要测的。</p>
<p>用例要包括夏令时切换当天、闰日、跨午夜和月末。时间戳和时区怎样建模，见<a href="/questions/intl-timezones/">《时间戳、时区和只有日期的业务值应该怎样区分？》</a>。</p>
<p>Playwright 这类工具可以给每个测试项目设置 <code>locale</code> 和 <code>timezoneId</code>，同一套用例就能在多个地区上各跑一遍。</p>
<h2>哪些要人工检查</h2>
<p>从右到左的布局先用逻辑属性写对，见<a href="/questions/i18n-rtl/">《前端页面如何支持从右到左的语言？》</a>。写完以后，还要人工逐项看：箭头和返回图标有没有镜像，方向键的行为对不对，弹出层的位置对不对，数字和英文混排时有没有乱。</p>
<p>翻译质量只能靠母语审校，看句子是否自然、术语是否一致。伪本地化能发现布局问题，但代替不了这一步。</p>
<h2>业务规则也要写进测试</h2>
<p>税费按哪个地区算，订单时间显示用户的时区还是商家的时区，一周从周几开始，这些都不是技术问题，而是产品规则。所以它们要写进需求，并和后端一起测试。</p>
<h2>常见追问</h2>
<p><strong>多语言下视觉回归怎么做？</strong></p>
<blockquote>
<p>对代表性的语言和书写方向分别截图对比。不同环境的字体渲染会有细微差异，用合理的阈值处理，别让它们一直误报。</p>
</blockquote>
<p><strong>缺失翻译怎么测？</strong></p>
<blockquote>
<p>构建时先检查各语言的键集合是否齐全。界面测试里再故意删掉一个键，确认回退语言生效，页面上没有出现空白。</p>
</blockquote>`};export{e as default};