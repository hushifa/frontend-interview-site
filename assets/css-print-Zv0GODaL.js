var e={answerHtml:`<p>屏幕上可以滚动、展开、点击，纸张和普通导出的 PDF 却不会替用户继续操作页面。一个在屏幕里很舒服的“固定导航 + 高度受限表格 + 横向滚动代码区”，直接打印后可能只剩几行数据，导航还覆盖在正文上。</p>
<p>打印样式首先要决定“用户需要带走哪些内容”，再调整排版。不是把屏幕页面按比例缩小，就自动得到了可读的文档。</p>
<h3>使用专门的打印样式入口</h3>
<p>小规模规则可以放在现有样式表的 <code>@media print</code> 中；规则多时，也可以通过 <code>&lt;link rel=&quot;stylesheet&quot; href=&quot;/print.css&quot; media=&quot;print&quot;&gt;</code> 拆成独立文件。</p>
<p>下面假设页面的正文容器叫 <code>.report</code>，内部滚动区域叫 <code>.scroll-region</code>，按钮栏和导航分别有对应类名：</p>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-keyword">@media</span> print {
  <span class="hljs-selector-class">.site-nav</span>,
  <span class="hljs-selector-class">.action-bar</span>,
  <span class="hljs-selector-class">.no-print</span> {
    <span class="hljs-attribute">display</span>: none;
  }

  <span class="hljs-selector-tag">body</span> {
    <span class="hljs-attribute">color</span>: <span class="hljs-number">#000</span>;
    <span class="hljs-attribute">background</span>: <span class="hljs-number">#fff</span>;
    <span class="hljs-attribute">font-size</span>: <span class="hljs-number">11pt</span>;
    <span class="hljs-attribute">line-height</span>: <span class="hljs-number">1.5</span>;
  }

  <span class="hljs-selector-class">.report</span> {
    <span class="hljs-attribute">display</span>: block;
    <span class="hljs-attribute">width</span>: auto;
    <span class="hljs-attribute">max-width</span>: none;
    <span class="hljs-attribute">margin</span>: <span class="hljs-number">0</span>;
    <span class="hljs-attribute">padding</span>: <span class="hljs-number">0</span>;
    <span class="hljs-attribute">box-shadow</span>: none;
  }

  <span class="hljs-selector-class">.report</span>,
  <span class="hljs-selector-class">.scroll-region</span> {
    <span class="hljs-attribute">height</span>: auto;
    <span class="hljs-attribute">max-height</span>: none;
    <span class="hljs-attribute">overflow</span>: visible;
  }

  <span class="hljs-selector-class">.report</span> <span class="hljs-selector-class">.sticky-title</span> {
    <span class="hljs-attribute">position</span>: static;
  }

  <span class="hljs-selector-class">.report</span> pre {
    <span class="hljs-attribute">white-space</span>: pre-wrap;
    <span class="hljs-attribute">overflow-wrap</span>: anywhere;
  }

  <span class="hljs-selector-class">.report</span> <span class="hljs-selector-tag">img</span> {
    <span class="hljs-attribute">max-width</span>: <span class="hljs-number">100%</span>;
    <span class="hljs-attribute">height</span>: auto;
  }

  <span class="hljs-selector-class">.report</span> <span class="hljs-selector-tag">h2</span> {
    <span class="hljs-attribute">break-after</span>: avoid;
  }

  <span class="hljs-selector-class">.report</span> <span class="hljs-selector-tag">figure</span> {
    <span class="hljs-attribute">break-inside</span>: avoid;
  }
}

<span class="hljs-keyword">@page</span> {
  size: A4 portrait;
  <span class="hljs-attribute">margin</span>: <span class="hljs-number">15mm</span>;
}
</code></pre></div>
<p>这段代码的主要目的不是增加装饰，而是把正文重新变成可以连续分页的内容。取消滚动区域的高度限制，让内容有机会完整排出；取消吸顶定位，避免把屏幕交互布局带到纸上；代码允许折行，避免长行伸出纸张。</p>
<p><code>@media print</code> 不会给里面的选择器额外加权重。若屏幕规则使用更强的选择器、行内样式或 <code>!important</code>，打印规则仍可能被覆盖。应先统一层叠设计；确需覆盖局部第三方样式时，才有针对性地使用更高优先级，而不是全局到处加 <code>!important</code>。</p>
<h3>@page 管纸面，正文仍由普通 CSS 排版</h3>
<p><code>@page</code> 可以表达纸张尺寸、方向、页边距等要求。例子选择 A4 纵向和 15mm 页边距；横向大表格可以考虑 <code>size: A4 landscape</code>，但不能因此假定用户一定选择同样的纸张或缩放设置。</p>
<p>页面尺寸还要扣除页边距，剩下的才是正文可用区域。不要一边指定 15mm 页边距，一边仍把正文固定成 210mm 宽度，那相当于拿整张 A4 的宽度去塞已经缩窄的内容区域。</p>
<p>浏览器打印对话框、打印机可打印区域和用户设置都会影响结果。CSS 不能普遍、无条件地控制浏览器自动添加的日期、网址等页眉页脚；相关选项可能需要用户在打印设置中调整。</p>
<h3>分页规则是约束，不是绝对承诺</h3>
<p><code>break-before</code>、<code>break-after</code> 控制元素前后的分页倾向，<code>break-inside: avoid</code> 请求尽量不要把元素拆开。标题使用 <code>break-after: avoid</code>，是为了避免标题落在一页最后、正文却全在下一页。</p>
<p>但一个比整张纸内容区还高的卡片，不可能完整塞进一页。浏览器可能必须断开，过度使用 <code>avoid</code> 也可能让页面留下大片空白。因此适合小图片说明块的规则，不应无差别套到整篇文章、全部表格或所有容器上。</p>
<p>长表格应保留正确的 <code>table</code>、<code>thead</code>、<code>tbody</code> 结构，检查表头重复和行拆分在目标浏览器中的表现；给表格外层设置 <code>overflow: auto</code> 并不能在纸上提供横向滚动。列太多时需要缩短文案、调整列宽、横向纸张，或者单独提供打印视图。</p>
<h3>内容还没在 DOM 里，CSS 不能把它打印出来</h3>
<p>虚拟列表通常只渲染屏幕附近的几行。解除外层高度限制，不会凭空生成其余几千行数据。折叠区域可能根本没挂载，懒加载图片也可能尚未请求。此时需要在打印前明确准备内容：渲染所需数据、展开必要区域、等待关键资源就绪，再调用 <code>window.print()</code>。</p>
<p><code>beforeprint</code> 可用于同步调整已准备好的界面，<code>afterprint</code> 可用于恢复。但不能假设在 <code>beforeprint</code> 中发起的任意异步请求，浏览器都会等待；更稳妥的方式是让“打印”按钮先完成数据准备，失败时给出提示，准备完成后才打开打印流程。</p>
<p><code>afterprint</code> 也不是“用户已经成功拿到纸张”的凭据。关闭或取消预览等情况同样可能结束打印流程，网页无法据此确认打印机是否有纸、输出是否成功。</p>
<h3>可读性不能只靠背景色</h3>
<p>有的用户不会打印背景图形。图表、状态标签和深色主题若只靠背景颜色表达信息，打印时可能丢失含义。应保留文字、边框或其他识别方式；<code>print-color-adjust: exact</code> 可以表达保留颜色的意图，但用户与浏览器设置仍可能优先。</p>
<p>链接也需要按文档用途决定是否展示地址。学习资料可以给外部引用补充可读网址，操作后台里的内部链接则未必适合把一长串参数印出来。不能无差别给所有链接附上完整 <code>href</code>。</p>
<p>验证时先用 DevTools 的 print 媒体模拟检查规则是否命中，再打开真实打印预览或导出 PDF，检查第一页、中间分页和最后一页是否缺内容。媒体模拟不会完整复现实际纸张分页，因此不能只看模拟页面就宣称打印完成。</p>`};export{e as default};