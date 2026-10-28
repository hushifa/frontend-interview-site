var e={answerHtml:`<h2>简答</h2>
<ul>
<li><code>balance</code> 让短的多行文本（标题、卡片标题）各行长度更均衡，<code>pretty</code> 让正文尽量避免末行只剩一个词的孤行。</li>
<li>两者都是排版提示，由浏览器按当前宽度和字体计算，不是插入固定 <code>&lt;br&gt;</code>，也不会缩小字体或修复溢出。</li>
<li>窗口、字体、翻译和文字放大都会触发重新分行，布局要能容纳行数变化。</li>
<li>不支持的浏览器忽略它们，回到普通换行，天然是渐进增强。</li>
</ul>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.article-title</span> {
  <span class="hljs-attribute">max-inline-size</span>: <span class="hljs-number">26ch</span>;
  <span class="hljs-attribute">text-wrap</span>: balance;
}

<span class="hljs-selector-class">.article</span> <span class="hljs-selector-tag">p</span> {
  <span class="hljs-attribute">max-inline-size</span>: <span class="hljs-number">68ch</span>;
  <span class="hljs-attribute">text-wrap</span>: pretty;
}
</code></pre></div>
<h2>balance 不是让每行一样长</h2>
<p>浏览器在不超过容器宽度的前提下找较平衡的分法，最终结果仍取决于词长、标点、语言和字体。本来只能放一行的文字不会被拆成两行；比整行还长的 URL 或代码也不会被它解决，仍要配合 <code>overflow-wrap</code> 或横向滚动。</p>
<p>给标题设合理的 <code>max-inline-size</code>，比按某种语言写死 <code>&lt;br&gt;</code> 更能适应响应式和翻译。<code>ch</code> 只是近似字符宽度，对中文和 Emoji 并不精确，当作设计范围即可。</p>
<h2>pretty 不保证出版级排版</h2>
<p><code>pretty</code> 的具体算法由浏览器决定，不替代 <code>hyphens</code>、语言标签、列宽和编辑审校。中文、日文和阿拉伯文的断行规则与英文不同，不能拿英文截图推断所有语言的效果。</p>
<h2>语言标记会影响结果</h2>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">h1</span> <span class="hljs-attr">lang</span>=<span class="hljs-string">&quot;zh-CN&quot;</span>&gt;</span>让组件在不同屏幕上保持清晰的层次<span class="hljs-tag">&lt;/<span class="hljs-name">h1</span>&gt;</span>
<span class="hljs-tag">&lt;<span class="hljs-name">p</span> <span class="hljs-attr">lang</span>=<span class="hljs-string">&quot;en&quot;</span>&gt;</span>A responsive layout should remain readable at every width.<span class="hljs-tag">&lt;/<span class="hljs-name">p</span>&gt;</span>
</code></pre></div>
<p><code>lang</code> 帮浏览器和读屏器选择断行与发音规则，动态切换语言时要同步更新。不要用 JavaScript 按字数切字符串插 <code>&lt;br&gt;</code>，这会破坏复制、搜索、读屏和翻译。</p>
<h2>布局要容纳重新分行</h2>
<ul>
<li>卡片和按钮为标题预留合理的行数，不要把高度硬编码成一行；</li>
<li>需要严格对齐的列表可以用 <code>line-clamp</code> 限制行数，但被隐藏的文字要能通过详情或可访问名称获取；</li>
<li>字体加载策略要结合 CLS 一起评估。</li>
</ul>
<p>平衡算法会尝试多种分法，短标题成本很小；大量长段落、实时变化的内容或动画中的宽度不宜无条件使用。</p>
<h2>兼容回退</h2>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.title</span> {
  <span class="hljs-attribute">overflow-wrap</span>: break-word;
}

<span class="hljs-keyword">@supports</span> (<span class="hljs-attribute">text-wrap</span>: balance) {
  <span class="hljs-selector-class">.title</span> {
    <span class="hljs-attribute">text-wrap</span>: balance;
  }
}
</code></pre></div>
<p>验收覆盖不同容器宽度、字体加载前后、长德语与 RTL、文字放大，以及不支持该属性的浏览器。代码、URL、表格和严格格式的协议文本应使用更明确的换行策略，而不是 balance 或 pretty。</p>`};export{e as default};