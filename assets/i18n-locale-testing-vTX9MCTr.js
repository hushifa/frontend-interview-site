var e={answerHtml:`<h2>简答</h2>
<ul>
<li>语言、地区、时区、书写方向是四个变量。浏览器语言是英文，不代表用户在美国，也不代表要用纽约时区。</li>
<li>测试矩阵按风险挑代表：一种文字较长的语言、一种复杂文字、一种 RTL 语言、一个日期和数字格式不同的地区、两个相差较大的时区。</li>
<li>伪本地化把文案加长、加上重音字符和边界标记，不用真实翻译就能发现溢出、截断和写死的字符串。</li>
<li>自动化测试显式固定 locale 和时区，不依赖运行机器的系统设置，并覆盖夏令时切换和跨午夜。</li>
<li>方向、焦点顺序、读屏输出和翻译质量需要人工检查。</li>
</ul>
<h2>测试矩阵示例</h2>
<table><thead><tr><th>维度</th><th>代表值</th><th>发现的问题</th></tr></thead><tbody><tr><td>长文本</td><td><code>de-DE</code></td><td>按钮、表头、导航溢出</td></tr><tr><td>复杂文字</td><td><code>ja-JP</code>、<code>th-TH</code></td><td>换行、截断、字体回退</td></tr><tr><td>RTL</td><td><code>ar</code></td><td>方向、图标镜像、焦点顺序</td></tr><tr><td>格式</td><td><code>en-IN</code>（数字写作 <code>12,34,567.891</code>）、<code>de-CH</code></td><td>千位分隔、日期顺序、货币</td></tr><tr><td>时区</td><td><code>Asia/Shanghai</code>、<code>America/New_York</code></td><td>跨日、夏令时</td></tr></tbody></table>
<p>再叠加窄屏、200% 字号和读屏器。</p>
<h2>伪本地化</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// 只变换纯文字片段，变量由调用方另外拼接</span>
<span class="hljs-keyword">function</span> <span class="hljs-title function_">pseudo</span>(<span class="hljs-params">text</span>) {
  <span class="hljs-keyword">const</span> accented = text.<span class="hljs-title function_">replace</span>(<span class="hljs-regexp">/[A-Za-z]/g</span>, <span class="hljs-function">(<span class="hljs-params">ch</span>) =&gt;</span> <span class="hljs-string">\`<span class="hljs-subst">\${ch}</span>̄\`</span>);
  <span class="hljs-keyword">return</span> <span class="hljs-string">\`[<span class="hljs-subst">\${accented}</span>~~~~]\`</span>; <span class="hljs-comment">// 方括号标出边界，波浪线模拟变长</span>
}
</code></pre></div>
<ul>
<li>页面上出现不带方括号的文字，说明这段文字写死在代码里，没有走翻译。</li>
<li>方括号被截掉，说明容器宽度写死或使用了截断。</li>
<li>真实消息含有 ICU 语法时，要用消息解析器只改写文字节点，保留变量名和 <code>plural</code>、<code>select</code> 的分支键，不能用正则直接处理整条消息。</li>
</ul>
<h2>固定环境</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// 不依赖系统时区，直接在格式化时指定</span>
<span class="hljs-keyword">const</span> <span class="hljs-title function_">format</span> = (<span class="hljs-params">date, locale, timeZone</span>) =&gt;
  <span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">DateTimeFormat</span>(locale, { <span class="hljs-attr">dateStyle</span>: <span class="hljs-string">&#x27;short&#x27;</span>, <span class="hljs-attr">timeStyle</span>: <span class="hljs-string">&#x27;short&#x27;</span>, timeZone }).<span class="hljs-title function_">format</span>(date);

<span class="hljs-title function_">format</span>(<span class="hljs-keyword">new</span> <span class="hljs-title class_">Date</span>(<span class="hljs-string">&#x27;2026-01-01T00:00:00Z&#x27;</span>), <span class="hljs-string">&#x27;en-GB&#x27;</span>, <span class="hljs-string">&#x27;America/New_York&#x27;</span>); <span class="hljs-comment">// &#x27;31/12/2025, 19:00&#x27;</span>
</code></pre></div>
<p>用例包括夏令时切换当天、闰日、跨午夜、月末。时间戳与时区的建模见<a href="/questions/intl-timezones/">《时间戳、时区和只有日期的业务值应该怎样区分？》</a>。</p>
<p>Playwright 等工具可以为每个测试项目设置 <code>locale</code> 和 <code>timezoneId</code>，在同一套用例上跑多个地区。</p>
<h2>RTL 与人工检查</h2>
<ul>
<li>布局使用逻辑属性，见<a href="/questions/i18n-rtl/">《前端页面如何支持从右到左的语言？》</a>。</li>
<li>逐项检查：箭头和返回图标是否镜像、方向键行为、弹出层位置、数字与英文混排。</li>
<li>母语审校检查翻译是否自然、术语是否一致，伪本地化代替不了这一步。</li>
</ul>
<h2>业务规则</h2>
<p>税费按哪个地区算、订单时间显示用户时区还是商家时区、一周从周几开始，这些是产品规则，要写进需求，并和后端一起测试。</p>
<h2>常见追问</h2>
<ul>
<li><strong>视觉回归在多语言下怎么做？</strong> 对代表性语言和方向分别截图，字体渲染差异用合理阈值处理。</li>
<li><strong>缺失翻译怎么测？</strong> 构建时检查键集合，界面测试中故意删掉一个键，确认回退语言生效、没有显示空白。</li>
</ul>`};export{e as default};