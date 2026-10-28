var e={answerHtml:`<h2>简答</h2>
<ul>
<li>语言、地区和时区是独立变量，不能从浏览器语言推断用户所在地区。</li>
<li>测试矩阵按风险挑选代表性组合，不需要列出所有语言。</li>
<li>伪本地化可以提前暴露硬编码宽度、截断和字符串拼接问题。</li>
<li>RTL 要用逻辑属性并逐项验证镜像和焦点；自动化测试和人工检查要配合。</li>
</ul>
<p>页面在中文环境看起来正常，翻译成德语后按钮文字溢出；订单在东京创建，却在纽约用户页面显示成前一天；阿拉伯语界面方向反过来后，图标和焦点顺序仍然是从左到右。这些问题不是简单替换一份语言 JSON 就能发现，测试必须把语言、地区、时区、数字规则和书写方向分开建模。</p>
<h2>语言、地区和时区不是一个变量</h2>
<p><code>zh-CN</code>、<code>en-GB</code> 和 <code>en-US</code> 可能使用不同日期、数字和货币习惯；时区又是用户或业务数据的另一维度。不要把浏览器语言当成用户所在地区，也不要从日期字符串里猜时区。后端应传递明确的时间语义，例如 UTC 时间戳或带偏移的 ISO 字符串，前端根据显示场景选择用户时区或业务时区。</p>
<p>时间戳与时区怎样区分、为什么不能用固定 24 小时算“一天”，见“时间戳、时区和只有日期的业务值应该怎样区分？”。</p>
<p>测试应固定输入瞬间、locale 和时区，避免依赖运行机器的系统设置。用例要覆盖夏令时切换、闰日、跨午夜和历史时区规则。</p>
<h2>测试矩阵应覆盖真实风险，而不是列出所有语言</h2>
<p>可以按风险选择代表组合：</p>
<ul>
<li>一种短文本语言、一种通常更长的语言，用于发现按钮和表格溢出；</li>
<li>一种使用复杂文字或组合字符的语言，用于检查截断、分词和字体回退；</li>
<li>一种 RTL 语言，用于检查方向、图标、焦点和数字混排；</li>
<li>一个使用不同日期顺序、千位分隔符和货币符号的地区；</li>
<li>至少两个相差较大的时区，并覆盖夏令时边界。</li>
</ul>
<p>矩阵还要包含窄屏、放大字体、低带宽和屏幕阅读器。翻译条目数量不等于测试覆盖，关键是让每个组件经历不同长度、方向和格式规则。</p>
<h2>伪本地化可以提前暴露布局问题</h2>
<p>伪本地化可以把字符串加长、替换为带重音字符或包裹标记，帮助发现硬编码宽度、依赖字符长度的截断和拼接语句。测试数据应保持占位符、HTML 转义和复数变量有效；不能简单把每个字符替换成不可读内容，导致测试失去业务意义。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// 只处理纯文字片段，不解析 ICU、HTML 或占位符语法。</span>
<span class="hljs-keyword">function</span> <span class="hljs-title function_">pseudoText</span>(<span class="hljs-params">text</span>) {
  <span class="hljs-keyword">return</span> <span class="hljs-string">\`[<span class="hljs-subst">\${text.replace(/[A-Za-z]/g, (letter) =&gt; <span class="hljs-string">\`<span class="hljs-subst">\${letter}</span>̄\`</span>)}</span>]\`</span>;
}

<span class="hljs-comment">// 文字与参数由结构分开，用户名称不参与变换。</span>
<span class="hljs-keyword">function</span> <span class="hljs-title function_">greeting</span>(<span class="hljs-params">name</span>) {
  <span class="hljs-keyword">return</span> <span class="hljs-title function_">pseudoText</span>(<span class="hljs-string">&#x27;Hello, &#x27;</span>) + name + <span class="hljs-title function_">pseudoText</span>(<span class="hljs-string">&#x27;!&#x27;</span>);
}
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">greeting</span>(<span class="hljs-string">&#x27;小明&#x27;</span>));
</code></pre></div>
<p>伪本地化不是翻译质量检查，不能替代母语审校。它的价值是让布局、截断、换行和无障碍名称更早暴露。视觉回归测试应在代表性语言、方向和屏幕宽度下运行，而不是只在默认语言截图。</p>
<p>上述函数仅演示文字节点变换。如果把 Hello {name} 整串传入，变量名也会被改变，因此不能直接批量处理翻译源文件。实际 ICU 消息应由对应消息解析器生成语法树，仅改写 literal 节点，并在 plural/select 的每个分支递归处理文字；保留变量名、选择键、转义和富文本标签。不要用一个正则表达式假装能解析嵌套 ICU 语法。</p>
<p>组合重音字符也不保证明显增加视觉宽度。测试长文案布局时，应另准备明确加长的纯文字片段；组合字符主要用于暴露字符计数和截断问题。该示例返回普通字符串，展示时使用文本节点，不把参数拼成 HTML。</p>
<h2>日期、数字和货币必须使用格式化 API</h2>
<p>各个格式化 API 的用法见“为什么日期、金额和排序不应该手动拼接格式？”。测试关注的是边界数据：零、负数、大数、小数、无效值和不同货币的小数位，以及不同语言下的排序结果。</p>
<h2>RTL 不只是把 <code>direction</code> 改成 <code>rtl</code></h2>
<p>布局应优先使用 CSS 逻辑属性，如 <code>margin-inline-start</code>、<code>padding-block</code> 和 <code>inset-inline-end</code>，避免把左、右写死。箭头、返回图标和时间轴可能需要按语义决定是否镜像；品牌图标、播放按钮和数字并非都应反转。键盘方向键、焦点顺序、弹出层定位和滚动条行为要在 RTL 环境逐项验证。</p>
<p>混合文本还会涉及数字、URL、邮箱和英文缩写。不要通过插入不可见控制字符随意修复显示；应使用正确的 Unicode 双向文本处理、语义元素和浏览器能力，并用真实句子测试。</p>
<h2>翻译缺失、回退和动态内容</h2>
<p>缺少翻译时应有明确回退语言和监控，不能在页面上显示键名或空字符串。动态服务端错误、用户生成内容和富文本要区分翻译资源与不可信内容，插值时保持转义，不能把翻译文件当作可信 HTML 执行。</p>
<p>组件测试应覆盖加载中、缺失键、复数、长文本和异步切换语言。语言切换过程中要避免部分组件已经切换、部分组件仍显示旧语言；可以用版本化资源快照或等待资源加载完成后原子更新界面。</p>
<h2>自动化和人工检查如何配合</h2>
<p>自动化测试适合固定 locale、时区、方向和格式输入，检查文本存在、ARIA 名称、溢出和关键数字。视觉回归适合发现布局变化，但对字体渲染差异要设置合理阈值。人工检查应覆盖真实任务：填写表单、读表格、切换语言、使用键盘、放大页面和阅读屏幕阅读器输出。</p>
<p>国际化测试还要把产品规则写清楚：税费按哪个地区计算、订单时间显示哪个时区、周起始日是什么、货币是否允许换算。代码格式化正确不代表业务含义正确，后端和产品规则必须共同核对。</p>
<h2>参考资料</h2>
<ul>
<li><a href="https://www.w3.org/International/">W3C · Internationalization</a></li>
<li><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat">MDN · Intl.DateTimeFormat</a></li>
<li><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat">MDN · Intl.NumberFormat</a></li>
<li><a href="https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Logical_properties_and_values">MDN · CSS Logical Properties</a></li>
</ul>`};export{e as default};