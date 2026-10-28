var e={answerHtml:`<p>标题只有十几个字，却可能在某个宽度下变成“第一行很短、第二行挤满”的难看形状。过去常见做法是手动插入 <code>&lt;br&gt;</code>，或者给每个语言版本写不同的宽度；这样一换字体、窗口或翻译，人工断点就可能变成新的问题。<code>text-wrap</code> 的 <code>balance</code> 和 <code>pretty</code> 让浏览器根据当前可用宽度和字体度量选择更合适的换行方式：</p>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.article-title</span> {
  <span class="hljs-attribute">max-inline-size</span>: <span class="hljs-number">26ch</span>;
  <span class="hljs-attribute">text-wrap</span>: balance;
}

<span class="hljs-selector-class">.article-summary</span> {
  <span class="hljs-attribute">text-wrap</span>: pretty;
}
</code></pre></div>
<p><code>balance</code> 主要适合标题、卡片标题和短的多行文本，让各行长度更均衡；<code>pretty</code> 更偏向正文排版，尽量减少孤行或不理想的末行。二者都是排版提示，不是对内容强制插入固定换行。</p>
<h2>balance 不是把每行都变成相同长度</h2>
<p>浏览器会在不超过容器宽度的前提下寻找较平衡的分行方式，但词语长度、标点、语言断词、字体和容器尺寸仍决定最终结果：</p>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-tag">h1</span> {
  <span class="hljs-attribute">max-inline-size</span>: <span class="hljs-number">30rem</span>;
  <span class="hljs-attribute">margin-inline</span>: auto;
  <span class="hljs-attribute">text-wrap</span>: balance;
}
</code></pre></div>
<p>如果文字本来只能放下一行，balance 不会为了制造两行而缩小字体；如果某个词比整行还长，也不能靠 balance 解决溢出。长 URL、邮箱和代码仍要配合 <code>overflow-wrap</code>、横向滚动或明确的代码展示策略。不要把 <code>text-wrap: balance</code> 当作 <code>white-space</code>、<code>overflow-wrap</code> 或容器约束的替代品。</p>
<p>标题的最大宽度仍然很重要。给每个标题设置一个合理的 <code>max-inline-size</code>，比用 <code>&lt;br&gt;</code> 把某种语言的断点写死更容易适应响应式和翻译。<code>ch</code> 只是近似字符宽度，不代表中文、阿拉伯文或 Emoji 的实际排版宽度；它应作为设计范围，而不是精确排版算法。</p>
<h2>pretty 的目标是减少孤行，不是保证出版级排版</h2>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.article</span> <span class="hljs-selector-tag">p</span> {
  <span class="hljs-attribute">max-inline-size</span>: <span class="hljs-number">68ch</span>;
  <span class="hljs-attribute">text-wrap</span>: pretty;
}
</code></pre></div>
<p>pretty 可以让段落末尾少出现只有一个短词的孤行，具体算法和效果由浏览器决定。它不会替代 <code>hyphens</code>、语言标签、字体选择、列宽和编辑审校；中文、日文、阿拉伯文和混合代码的断行规则不同，不能用英文段落的截图推断所有语言都相同。</p>
<p>正文阅读宽度、行高和字体仍是主要可读性因素。若一个段落必须保持法律或技术文本的固定结构，不能依靠 pretty 改变视觉分行来表达语义；内容结构应由段落、列表和标题元素表达。</p>
<h2>语言和标点会影响结果</h2>
<p>换行算法需要知道文字语言和书写方向：</p>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">h1</span> <span class="hljs-attr">lang</span>=<span class="hljs-string">&quot;zh-CN&quot;</span>&gt;</span>让组件在不同屏幕上保持清晰的层次<span class="hljs-tag">&lt;/<span class="hljs-name">h1</span>&gt;</span>
<span class="hljs-tag">&lt;<span class="hljs-name">p</span> <span class="hljs-attr">lang</span>=<span class="hljs-string">&quot;en&quot;</span>&gt;</span>A responsive layout should remain readable at every width.<span class="hljs-tag">&lt;/<span class="hljs-name">p</span>&gt;</span>
</code></pre></div>
<p><code>lang</code> 不是只给搜索引擎看的元数据，它可以帮助浏览器、读屏器和断词规则选择更合适的行为。动态切换语言时，应同步更新文档或局部元素的语言标记。RTL 文本还要结合 <code>dir</code>、逻辑属性和真实混合内容测试，不能只把文本方向翻转就认为 balance/pretty 已经正确。</p>
<p>标点、不可断空格、连字符、CJK 断行规则和内联代码都会影响最优分行。不要用 JavaScript 先按字符数切字符串再插入 <code>&lt;br&gt;</code>，这会破坏复制、搜索、读屏和翻译；如果确实需要品牌标题的固定断点，应通过设计明确且只在语义允许的情况下使用可隐藏的分隔方式。</p>
<h2>响应式和字体变化会让分行重新计算</h2>
<p>窗口改变、容器查询切换、字体加载、用户放大文字和语言切换都可能改变换行结果。这个重新计算是预期行为，但可能导致标题高度变化和布局移动：</p>
<ul>
<li>给标题卡片和按钮预留能容纳合理行数的空间；</li>
<li>不要把标题高度硬编码成只适合默认字体的一行；</li>
<li>字体加载策略要结合 CLS 和可读性测量；</li>
<li>需要滚动到标题时，等待相关内容和字体达到稳定状态；</li>
<li>文字变化不能让键盘焦点跳走或遮住错误提示。</li>
</ul>
<p>如果卡片列表必须严格对齐，可以限制标题最大行数并提供完整文本，而不是为了追求平衡而裁剪内容：</p>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.card-title</span> {
  <span class="hljs-attribute">text-wrap</span>: balance;
  <span class="hljs-attribute">display</span>: -webkit-box;
  -webkit-<span class="hljs-attribute">box-orient</span>: vertical;
  -webkit-<span class="hljs-selector-tag">line</span>-clamp: <span class="hljs-number">3</span>;
  <span class="hljs-attribute">overflow</span>: hidden;
}
</code></pre></div>
<p>行数裁剪会隐藏文字，必须确认用户仍能通过详情页、悬停提示或可访问名称看到完整内容。<code>text-wrap</code> 只影响分行，不能让被 <code>line-clamp</code> 隐藏的文字自动可读。</p>
<h2>性能边界和动态内容</h2>
<p>平衡多行文本需要浏览器尝试不同的分行方案，短标题通常成本很小，但对大量长段落、频繁变化的实时数据或动画中的宽度，不应无条件使用。动态列表可以先使用普通换行，或在内容稳定后再增强；不要在每帧改变容器宽度时依赖复杂排版算法。</p>
<p>如果用户输入内容可以任意变长，仍要限制长度、设置容器上限和处理滚动。CSS 排版不会替代服务端请求体限制，也不会阻止恶意文本造成高 CPU 和超大 DOM。性能问题应通过真实设备、布局耗时和输入延迟测量，而不是只根据属性名称猜测成本。</p>
<h2>兼容性和渐进增强</h2>
<p><code>text-wrap: balance</code> 和 <code>pretty</code> 的支持程度取决于浏览器版本。未知值会被忽略，元素回到普通的 <code>text-wrap</code> 行为，因此基础内容应在没有增强时仍然可读：</p>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.title</span> {
  <span class="hljs-attribute">overflow-wrap</span>: break-word;
}

<span class="hljs-keyword">@supports</span> (<span class="hljs-attribute">text-wrap</span>: balance) {
  <span class="hljs-selector-class">.title</span> {
    <span class="hljs-attribute">text-wrap</span>: balance;
  }
}

<span class="hljs-keyword">@supports</span> (<span class="hljs-attribute">text-wrap</span>: pretty) {
  <span class="hljs-selector-class">.summary</span> {
    <span class="hljs-attribute">text-wrap</span>: pretty;
  }
}
</code></pre></div>
<p>不要用 JavaScript 检测后给每个标题手动插入断行作为默认回退；不同浏览器的字体和宽度仍会改变结果。视觉回归测试应覆盖不支持增强属性的环境、长翻译、窄屏、放大文字、RTL 和字体加载失败。</p>
<h2>选型与验收</h2>
<p>使用前先判断文本角色：短标题需要稳定的层次和均衡行长时选择 balance；连续正文希望减少孤行时可尝试 pretty；代码、URL、表格和严格协议文本应使用更明确的换行策略。验收至少包括：</p>
<ul>
<li>不同容器宽度、响应式断点和字体加载前后；</li>
<li>中文、英文、长德语、RTL、混合数字和 Emoji；</li>
<li>复制、搜索、读屏、键盘焦点和完整文本获取；</li>
<li>标题动态更新、动画尺寸变化和大列表性能；</li>
<li>不支持属性的浏览器、SSR 首屏和客户端接管。</li>
</ul>
<p><code>text-wrap</code> 的价值是把“浏览器如何分行”交给更适合当前语言和宽度的排版算法，而不是让开发者手写断点。它改善的是视觉排版，不会自动解决容器尺寸、内容长度、无障碍、字体加载和业务文本结构；这些边界仍需要一起设计。</p>`};export{e as default};