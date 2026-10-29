var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>阿拉伯语、希伯来语是从右往左写的，简称 RTL。支持它，第一步是在 <code>&lt;html&gt;</code> 上同时写 <code>lang=&quot;ar&quot;</code> 和 <code>dir=&quot;rtl&quot;</code>。<code>lang</code> 说明是什么语言，<code>dir</code> 说明文字往哪个方向排，写了一个不会自动推出另一个。</p>
<p>布局不要写死左右，改用逻辑属性，比如 <code>margin-inline-start</code>、<code>padding-inline</code>、<code>inset-inline-end</code>、<code>text-align: start</code>。它们说的是“开始那一边”“结束那一边”，方向一换自动跟着换，不用再写一套样式。</p>
<p>用户名、产品名、数字这类方向不确定的内容，用 <code>&lt;bdi&gt;</code> 或 <code>dir=&quot;auto&quot;</code> 隔离开，不要手动反转字符串，代码块保持 <code>dir=&quot;ltr&quot;</code>。图标要按含义判断：表示前进、返回的箭头要镜像，品牌标志、播放按钮、数字不镜像，不要整页 <code>scaleX(-1)</code>。</p>
<p>还要注意，Flex 和 Grid 会随方向自动调整顺序，如果再加 <code>row-reverse</code>，顺序又被反了回去。</p>
</blockquote>
<h2>怎样声明方向</h2>
<p>在根元素上写语言和方向。</p>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">html</span> <span class="hljs-attr">lang</span>=<span class="hljs-string">&quot;ar&quot;</span> <span class="hljs-attr">dir</span>=<span class="hljs-string">&quot;rtl&quot;</span>&gt;</span>
</code></pre></div>
<p>用户切换语言时，这两个属性要一起更新。通过 portal 挂到 <code>body</code> 下的弹窗和提示框最容易漏掉，要确认它们也继承了正确的方向。</p>
<h2>用逻辑属性写布局</h2>
<p>下面这张卡片没有出现 <code>left</code> 和 <code>right</code>。</p>
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
<p><code>inline-start</code> 到底是哪边？在水平书写的页面里，从左往右写时它是左边，从右往左写时它是右边。所以同一份样式，换个 <code>dir</code> 就自动镜像了。</p>
<p>确实要固定在物理位置的装饰，比如一张始终在左上角的背景图，仍然可以用 <code>left</code>、<code>right</code>。</p>
<h2>混合方向的文本怎么处理</h2>
<p>阿拉伯文里夹着英文用户名时，排版很容易乱。</p>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">p</span>&gt;</span>
  المستخدم <span class="hljs-tag">&lt;<span class="hljs-name">bdi</span>&gt;</span>Alice_42<span class="hljs-tag">&lt;/<span class="hljs-name">bdi</span>&gt;</span> علّق
<span class="hljs-tag">&lt;/<span class="hljs-name">p</span>&gt;</span>
<span class="hljs-tag">&lt;<span class="hljs-name">pre</span> <span class="hljs-attr">dir</span>=<span class="hljs-string">&quot;ltr&quot;</span>&gt;</span><span class="hljs-tag">&lt;<span class="hljs-name">code</span>&gt;</span>const total = price * count;<span class="hljs-tag">&lt;/<span class="hljs-name">code</span>&gt;</span><span class="hljs-tag">&lt;/<span class="hljs-name">pre</span>&gt;</span>
</code></pre></div>
<p>问题出在用户名里的数字和下划线。浏览器排双向文本时，会根据周围的文字猜它们的方向，结果可能把用户名和旁边的阿拉伯文排错位置。<code>&lt;bdi&gt;</code> 让里面的文本自己单独判断方向，不影响外面。代码块则直接用 <code>dir=&quot;ltr&quot;</code> 固定成从左往右。</p>
<p>这里还有一个安全问题。双向控制字符（比如 U+202E）能让文本显示的顺序和实际顺序不同，被人用来伪装文件名或代码。<code>&lt;bdi&gt;</code> 只解决排版，管不了这个。所以显示用户提供的标识符时，要检测并过滤这些控制字符。</p>
<h2>交互也要检查</h2>
<p>视觉上从右往左排列以后，Tab 顺序也应该从右往左。可是用 <code>order</code> 或 <code>row-reverse</code> 调出来的位置，不会改变 Tab 顺序，所以优先保持 DOM 顺序本身合理。</p>
<p>滑块、标签页、菜单的左右方向键，在 RTL 下语义也是反的，要按各组件的交互模式处理。</p>
<p>测试时用真实的阿拉伯文和希伯来文，再混入数字、英文和长文本，比只看占位文字可靠得多。</p>
<h2>常见追问</h2>
<p><strong><code>direction: rtl</code> 和 <code>dir=&quot;rtl&quot;</code> 有什么区别？</strong></p>
<blockquote>
<p><code>dir</code> 是 HTML 语义，会影响双向文本算法和无障碍信息；CSS 的 <code>direction</code> 只是样式。所以优先用 <code>dir</code>。</p>
</blockquote>
<p><strong>怎样根据语言自动得到方向？</strong></p>
<blockquote>
<p>用 <code>Intl.Locale</code> 的 <code>getTextInfo()</code>，它会返回这种语言的书写方向，详见<a href="/questions/i18n-intl-locale/">《Intl.Locale 解决什么问题？语言标签应该怎样建模？》</a>。</p>
</blockquote>`};export{e as default};