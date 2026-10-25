var e={answerHtml:`<p>阿拉伯语、希伯来语等语言通常从右向左阅读，但页面里还会出现英文产品名、电话号码和代码。RTL 支持不是把所有字符顺序反转，也不是给页面加一次 <code>transform: scaleX(-1)</code>；需要让文字和布局按各自语义处理方向。</p>
<h3>用 dir 声明方向，用 lang 声明语言</h3>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">html</span> <span class="hljs-attr">lang</span>=<span class="hljs-string">&quot;ar&quot;</span> <span class="hljs-attr">dir</span>=<span class="hljs-string">&quot;rtl&quot;</span>&gt;</span>
</code></pre></div>
<p>lang 告诉浏览器和辅助技术内容使用哪种语言，dir 表示基础文字方向。两者相关但不能互相替代：只写 lang=&quot;ar&quot; 不应作为整个布局已经正确切换方向的保证。</p>
<p>根节点的 dir 会影响后代的方向继承、双向文本排布以及部分布局行为。使用 HTML 语义属性比只在某个组件里覆盖 CSS direction 更清楚，局部内容也可以单独声明方向。</p>
<h3>用逻辑方向表达布局意图</h3>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.card</span> {
  <span class="hljs-attribute">padding-inline</span>: <span class="hljs-number">1rem</span>;
  <span class="hljs-attribute">border-inline-start</span>: <span class="hljs-number">3px</span> solid currentColor;
  <span class="hljs-attribute">text-align</span>: start;
}

<span class="hljs-selector-class">.card__action</span> {
  <span class="hljs-attribute">margin-inline-start</span>: auto;
}

<span class="hljs-selector-class">.close-button</span> {
  <span class="hljs-attribute">position</span>: absolute;
  <span class="hljs-attribute">inset-inline-end</span>: <span class="hljs-number">0.75rem</span>;
  <span class="hljs-attribute">inset-block-start</span>: <span class="hljs-number">0.75rem</span>;
}
</code></pre></div>
<p>在常见的水平书写模式中，inline-start 在 LTR 下通常是左侧，在 RTL 下通常是右侧。这样“卡片起始边框”“尾部关闭按钮”会随方向调整，不需要维护两套 left/right 样式。</p>
<p>逻辑属性还与 writing-mode 有关，不能把 inline 永久等同于水平方向。对确实要求固定物理位置的装饰，left/right 仍可能合理，关键是先确定设计意图，而不是全局搜索替换。</p>
<p>Flex 的 row 会受到 direction 影响。如果同时在 RTL 下再设 row-reverse，可能把原本自动调整的顺序又反转回来。Grid、表格和绝对定位也要分别检查，不能认为所有布局模型都只需要同一条覆盖规则。</p>
<h3>混合文本需要隔离，不需要手动倒序</h3>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">p</span> <span class="hljs-attr">dir</span>=<span class="hljs-string">&quot;rtl&quot;</span>&gt;</span>
  المستخدم <span class="hljs-tag">&lt;<span class="hljs-name">bdi</span> <span class="hljs-attr">dir</span>=<span class="hljs-string">&quot;auto&quot;</span>&gt;</span>Alice_42<span class="hljs-tag">&lt;/<span class="hljs-name">bdi</span>&gt;</span>
<span class="hljs-tag">&lt;/<span class="hljs-name">p</span>&gt;</span>
<span class="hljs-tag">&lt;<span class="hljs-name">pre</span> <span class="hljs-attr">dir</span>=<span class="hljs-string">&quot;ltr&quot;</span>&gt;</span><span class="hljs-tag">&lt;<span class="hljs-name">code</span>&gt;</span>const total = price * count;<span class="hljs-tag">&lt;/<span class="hljs-name">code</span>&gt;</span><span class="hljs-tag">&lt;/<span class="hljs-name">pre</span>&gt;</span>
</code></pre></div>
<p>bdi 把未知方向的用户名与周围文字隔离，降低标点、数字和名字互相影响排布的风险。dir=&quot;auto&quot; 会根据内容的强方向字符判断基础方向，适合用户生成的短文本，但不是自动识别语言或翻译。</p>
<p>代码通常应保持 LTR。邮箱、电话号码等结构化文本也要按实际显示需求处理，不能通过反转字符串来适配 RTL，否则复制内容、搜索和辅助技术读取都会受到影响。</p>
<p>双向控制字符还可能造成视觉欺骗，尤其在代码、路径和账号标识中。显示方向的处理与标识安全校验是两个问题，bdi 不会自动删除所有可疑字符。</p>
<h3>哪些图标应该镜像</h3>
<p>表示前进、返回或阅读进程的箭头通常需要结合语言方向调整；品牌标志、真实物体图案以及一些约定俗成的媒体控制图标则不能机械镜像。</p>
<p>应逐个按语义确认，而不是对全部 svg 应用 scaleX(-1)。若图标里包含文字或数字，整体翻转还会让字形反写。图表坐标、时间线和进度方向也需要产品明确规则，不宜仅根据页面 dir 推断所有业务含义。</p>
<h3>视觉顺序、键盘顺序和阅读顺序要一起检查</h3>
<p>通过 CSS order 或 row-reverse 改变显示位置，不一定会改变 DOM 和 Tab 顺序。看起来从右往左排列的表单，键盘焦点若在屏幕上来回跳，会让用户很难使用。</p>
<p>优先让 DOM 保持合理的语义顺序，再采用方向感知的布局。菜单、标签页、滑块等组件的左右键行为应遵循对应组件模式和 RTL 约定，不能把页面里所有 ArrowLeft/ArrowRight 处理统一交换。</p>
<p>还要检查弹窗、浮层和通过 portal 渲染的内容是否继承了正确方向。应用内一块区域是 RTL，不代表挂到 body 的浮层也自动属于同一方向上下文。</p>
<p>验收应使用真实的长短文案、数字、标点、输入框和混合语言名称，同时测试窄屏、键盘与复制粘贴。RTL 是语言体验的一部分，逻辑属性能减少重复 CSS，但不能代替这些交互判断。</p>`};export{e as default};