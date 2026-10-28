var e={answerHtml:`<h2>简答</h2>
<ul>
<li>在 <code>&lt;html&gt;</code> 上同时写 <code>lang=&quot;ar&quot;</code> 和 <code>dir=&quot;rtl&quot;</code>。<code>lang</code> 说明语言，<code>dir</code> 说明基础方向，写了其中一个不会自动推出另一个。</li>
<li>布局用逻辑属性：<code>margin-inline-start</code>、<code>padding-inline</code>、<code>inset-inline-end</code>、<code>text-align: start</code>，切换方向时无需另写一套样式。</li>
<li>用户名、产品名、数字等方向不确定的内容用 <code>&lt;bdi&gt;</code> 或 <code>dir=&quot;auto&quot;</code> 隔离，不要手动反转字符串。代码块保持 <code>dir=&quot;ltr&quot;</code>。</li>
<li>表示前进、返回的箭头要镜像；品牌标志、播放按钮、数字不镜像。按语义逐个判断，不要整体 <code>scaleX(-1)</code>。</li>
<li>Flex 和 Grid 会随 <code>direction</code> 自动调整顺序，再加 <code>row-reverse</code> 会把顺序又反回去。</li>
</ul>
<h2>声明方向</h2>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">html</span> <span class="hljs-attr">lang</span>=<span class="hljs-string">&quot;ar&quot;</span> <span class="hljs-attr">dir</span>=<span class="hljs-string">&quot;rtl&quot;</span>&gt;</span>
</code></pre></div>
<p>用户切换语言时同步更新这两个属性。通过 portal 挂到 <code>body</code> 的弹窗和提示框，要确认它们继承了正确的方向。</p>
<h2>逻辑属性</h2>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.card</span> {
  <span class="hljs-attribute">padding-inline</span>: <span class="hljs-number">1rem</span>;
  <span class="hljs-attribute">border-inline-start</span>: <span class="hljs-number">3px</span> solid currentColor;
  <span class="hljs-attribute">text-align</span>: start;
}

<span class="hljs-selector-class">.card__action</span> {
  <span class="hljs-attribute">margin-inline-start</span>: auto; <span class="hljs-comment">/* LTR 下推到右边，RTL 下推到左边 */</span>
}

<span class="hljs-selector-class">.close-button</span> {
  <span class="hljs-attribute">position</span>: absolute;
  <span class="hljs-attribute">inset-inline-end</span>: <span class="hljs-number">0.75rem</span>;
  <span class="hljs-attribute">inset-block-start</span>: <span class="hljs-number">0.75rem</span>;
}
</code></pre></div>
<p>在水平书写模式下，<code>inline-start</code> 在 LTR 中是左边、在 RTL 中是右边。确实要固定在物理位置的装饰，仍可以用 <code>left</code>、<code>right</code>。</p>
<h2>混合方向的文本</h2>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">p</span>&gt;</span>
  المستخدم <span class="hljs-tag">&lt;<span class="hljs-name">bdi</span>&gt;</span>Alice_42<span class="hljs-tag">&lt;/<span class="hljs-name">bdi</span>&gt;</span> علّق
<span class="hljs-tag">&lt;/<span class="hljs-name">p</span>&gt;</span>
<span class="hljs-tag">&lt;<span class="hljs-name">pre</span> <span class="hljs-attr">dir</span>=<span class="hljs-string">&quot;ltr&quot;</span>&gt;</span><span class="hljs-tag">&lt;<span class="hljs-name">code</span>&gt;</span>const total = price * count;<span class="hljs-tag">&lt;/<span class="hljs-name">code</span>&gt;</span><span class="hljs-tag">&lt;/<span class="hljs-name">pre</span>&gt;</span>
</code></pre></div>
<p><code>&lt;bdi&gt;</code> 让里面的文本独立判断方向，用户名里的数字和标点不会把周围的阿拉伯文排乱。</p>
<p>双向控制字符（如 U+202E）可以让文本显示顺序和实际顺序不同，被用来伪装文件名或代码。显示用户提供的标识符时，检测并过滤这些字符，<code>&lt;bdi&gt;</code> 只解决排版，不解决这个安全问题。</p>
<h2>交互检查</h2>
<ul>
<li>视觉上从右到左排列后，Tab 顺序也应从右到左。用 <code>order</code> 或 <code>row-reverse</code> 调整的位置不会改变 Tab 顺序，优先保持 DOM 顺序合理。</li>
<li>滑块、标签页、菜单的左右方向键在 RTL 下语义相反，按组件模式处理。</li>
<li>用真实的阿拉伯文和希伯来文测试，加上数字、英文混排和长文本。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li><strong><code>direction: rtl</code> 和 <code>dir=&quot;rtl&quot;</code> 有什么区别？</strong> <code>dir</code> 是 HTML 语义，会影响双向文本算法和可访问性；CSS <code>direction</code> 只是样式。优先使用 <code>dir</code>。</li>
<li><strong>怎样根据语言自动得到方向？</strong> 用 <code>Intl.Locale</code> 的 <code>getTextInfo()</code>，见&quot;Intl.Locale 解决什么问题？语言标签应该怎样建模？&quot;。</li>
</ul>`};export{e as default};