var e={answerHtml:`<p>销售看板把趋势和异常都画在 Canvas 上，视觉用户能看懂，屏幕阅读器却只能读到一个“图表”空容器。鼠标用户还可以悬停查看数据，但键盘用户无法访问某个数据点。图表无障碍不是给 Canvas 加一个 <code>aria-label</code> 就结束，而是要让用户获得同等的结论、数据和操作路径，同时避免把数万个点都变成沉重的 DOM。</p>
<h2>先提供可读的数据结论</h2>
<p>图表旁边应有标题、单位、时间范围和关键结论。对于静态报告，可以提供一个可展开的数据表；对于实时图表，应提供当前值、变化方向、更新时间和异常说明。表格不是“重复内容”，而是为无法使用图形或需要精确比较的用户提供等价信息。</p>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">section</span> <span class="hljs-attr">aria-labelledby</span>=<span class="hljs-string">&quot;sales-title&quot;</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">h2</span> <span class="hljs-attr">id</span>=<span class="hljs-string">&quot;sales-title&quot;</span>&gt;</span>本季度销售额趋势<span class="hljs-tag">&lt;/<span class="hljs-name">h2</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">p</span> <span class="hljs-attr">id</span>=<span class="hljs-string">&quot;sales-summary&quot;</span>&gt;</span>4 月至 6 月持续增长，6 月比 5 月增加 12%。<span class="hljs-tag">&lt;/<span class="hljs-name">p</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">div</span>
    <span class="hljs-attr">role</span>=<span class="hljs-string">&quot;img&quot;</span>
    <span class="hljs-attr">aria-labelledby</span>=<span class="hljs-string">&quot;sales-title&quot;</span>
    <span class="hljs-attr">aria-describedby</span>=<span class="hljs-string">&quot;sales-summary&quot;</span>
  &gt;</span>
    <span class="hljs-tag">&lt;<span class="hljs-name">canvas</span> <span class="hljs-attr">id</span>=<span class="hljs-string">&quot;sales-chart&quot;</span> <span class="hljs-attr">width</span>=<span class="hljs-string">&quot;640&quot;</span> <span class="hljs-attr">height</span>=<span class="hljs-string">&quot;320&quot;</span>&gt;</span><span class="hljs-tag">&lt;/<span class="hljs-name">canvas</span>&gt;</span>
  <span class="hljs-tag">&lt;/<span class="hljs-name">div</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">details</span>&gt;</span>
    <span class="hljs-tag">&lt;<span class="hljs-name">summary</span>&gt;</span>查看详细数据<span class="hljs-tag">&lt;/<span class="hljs-name">summary</span>&gt;</span>
    <span class="hljs-tag">&lt;<span class="hljs-name">table</span>&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">caption</span>&gt;</span>按月份统计的销售额<span class="hljs-tag">&lt;/<span class="hljs-name">caption</span>&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">thead</span>&gt;</span><span class="hljs-tag">&lt;<span class="hljs-name">tr</span>&gt;</span><span class="hljs-tag">&lt;<span class="hljs-name">th</span> <span class="hljs-attr">scope</span>=<span class="hljs-string">&quot;col&quot;</span>&gt;</span>月份<span class="hljs-tag">&lt;/<span class="hljs-name">th</span>&gt;</span><span class="hljs-tag">&lt;<span class="hljs-name">th</span> <span class="hljs-attr">scope</span>=<span class="hljs-string">&quot;col&quot;</span>&gt;</span>销售额（万元）<span class="hljs-tag">&lt;/<span class="hljs-name">th</span>&gt;</span><span class="hljs-tag">&lt;/<span class="hljs-name">tr</span>&gt;</span><span class="hljs-tag">&lt;/<span class="hljs-name">thead</span>&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">tbody</span>&gt;</span>
        <span class="hljs-tag">&lt;<span class="hljs-name">tr</span>&gt;</span><span class="hljs-tag">&lt;<span class="hljs-name">th</span> <span class="hljs-attr">scope</span>=<span class="hljs-string">&quot;row&quot;</span>&gt;</span>4 月<span class="hljs-tag">&lt;/<span class="hljs-name">th</span>&gt;</span><span class="hljs-tag">&lt;<span class="hljs-name">td</span>&gt;</span>80<span class="hljs-tag">&lt;/<span class="hljs-name">td</span>&gt;</span><span class="hljs-tag">&lt;/<span class="hljs-name">tr</span>&gt;</span>
        <span class="hljs-tag">&lt;<span class="hljs-name">tr</span>&gt;</span><span class="hljs-tag">&lt;<span class="hljs-name">th</span> <span class="hljs-attr">scope</span>=<span class="hljs-string">&quot;row&quot;</span>&gt;</span>5 月<span class="hljs-tag">&lt;/<span class="hljs-name">th</span>&gt;</span><span class="hljs-tag">&lt;<span class="hljs-name">td</span>&gt;</span>92<span class="hljs-tag">&lt;/<span class="hljs-name">td</span>&gt;</span><span class="hljs-tag">&lt;/<span class="hljs-name">tr</span>&gt;</span>
        <span class="hljs-tag">&lt;<span class="hljs-name">tr</span>&gt;</span><span class="hljs-tag">&lt;<span class="hljs-name">th</span> <span class="hljs-attr">scope</span>=<span class="hljs-string">&quot;row&quot;</span>&gt;</span>6 月<span class="hljs-tag">&lt;/<span class="hljs-name">th</span>&gt;</span><span class="hljs-tag">&lt;<span class="hljs-name">td</span>&gt;</span>103<span class="hljs-tag">&lt;/<span class="hljs-name">td</span>&gt;</span><span class="hljs-tag">&lt;/<span class="hljs-name">tr</span>&gt;</span>
      <span class="hljs-tag">&lt;/<span class="hljs-name">tbody</span>&gt;</span>
    <span class="hljs-tag">&lt;/<span class="hljs-name">table</span>&gt;</span>
  <span class="hljs-tag">&lt;/<span class="hljs-name">details</span>&gt;</span>
<span class="hljs-tag">&lt;/<span class="hljs-name">section</span>&gt;</span>
</code></pre></div>
<p>如果图表本身只是装饰，应该使用空的替代文本或从辅助技术树中隐藏；如果图表承载业务结论，就必须提供有意义的名称和描述。不要把所有数据拼成一个很长的 <code>aria-label</code>，这会让阅读顺序和定位都变差。</p>
<h2>SVG 可以表达结构，但不能自动获得语义</h2>
<p>SVG 中的坐标轴、折线和标记默认不会变成屏幕阅读器能理解的表格。可以给整个图表提供标题和描述，并将需要交互的数据点做成可聚焦元素；但如果数据点很多，逐点暴露会让键盘操作变得不可用。应根据任务选择聚合、筛选或“当前点详情”模式。</p>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">svg</span> <span class="hljs-attr">role</span>=<span class="hljs-string">&quot;img&quot;</span> <span class="hljs-attr">aria-labelledby</span>=<span class="hljs-string">&quot;chart-title chart-desc&quot;</span> <span class="hljs-attr">viewBox</span>=<span class="hljs-string">&quot;0 0 640 320&quot;</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">title</span> <span class="hljs-attr">id</span>=<span class="hljs-string">&quot;chart-title&quot;</span>&gt;</span>每月销售额<span class="hljs-tag">&lt;/<span class="hljs-name">title</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">desc</span> <span class="hljs-attr">id</span>=<span class="hljs-string">&quot;chart-desc&quot;</span>&gt;</span>销售额从 4 月 80 万元增长到 6 月 103 万元。<span class="hljs-tag">&lt;/<span class="hljs-name">desc</span>&gt;</span>
  <span class="hljs-comment">&lt;!-- 视觉路径和网格线可以设置 aria-hidden=&quot;true&quot; --&gt;</span>
<span class="hljs-tag">&lt;/<span class="hljs-name">svg</span>&gt;</span>
</code></pre></div>
<p><code>role=&quot;img&quot;</code> 适合把整张图作为一个整体说明。如果用户需要逐点探索，就不能只把整个 SVG 当成单一图片，还要设计焦点管理和详情区域。使用 ARIA 角色时要遵循原生 HTML 语义优先原则，并在目标屏幕阅读器上实测；错误的角色组合可能比没有角色更难理解。</p>
<h2>键盘交互要有清晰的焦点模型</h2>
<p>悬停提示不能是唯一的数据入口。下面是一种可探索图表的交互设计，不是所有图表的统一 ARIA 键盘标准；静态图配摘要和数据表不需要人为增加一套方向键操作。若选择逐点探索模式，应明确并验证：</p>
<ul>
<li><code>Tab</code> 进入图表控件或数据选择器；</li>
<li>方向键在数据点、系列或时间粒度之间移动；</li>
<li><code>Enter</code> 或空格打开当前点的详细信息；</li>
<li><code>Escape</code> 关闭浮层并把焦点还给触发控件；</li>
<li>当数据点很多时提供搜索、缩放或按区间跳转，而不是要求逐个经过。</li>
</ul>
<p>详情浮层不能只依赖鼠标坐标。可以用共享的数据模型让鼠标与键盘选择同一个数据点，避免只靠像素位置生成详情。若焦点元素已有完整可访问名称，再同时使用 live region 可能重复播报；只有信息无法通过焦点语义表达时才补充 polite 播报，并控制更新频率。是否重绘整张图取决于绘制成本，应测量后优化，不能为了少重绘保留错误的选中状态。</p>
<p>如果图表包裹在 role=&quot;img&quot; 中，应把它当作一个整体的非交互图像，不把需要键盘访问的按钮或数据点藏在其中。逐点探索应采用与实际控件相符的结构，或把选择器与详情放在图像外部；不能仅给 SVG 点添加 tabindex 就认为读屏器能理解操作。</p>
<h2>颜色不是唯一编码</h2>
<p>用红绿两条线表示状态时，色觉差异用户可能无法区分。应同时使用线型、点形状、纹理、直接标注或文字状态，并确保文字与背景满足 WCAG 对比度要求。对比度工具只能检查颜色关系，不能证明图表整体可读；细线、半透明区域和重叠点还需要人工检查。</p>
<h2>大数据量下的性能取舍</h2>
<p>让每个点都成为 DOM 元素会带来布局、样式和辅助技术树的成本；把所有点画进 Canvas 又会失去天然语义。常见折中是：视觉层使用 Canvas 或 WebGL，交互层只维护当前可见范围和少量可访问节点，数据表按分页或抽样提供完整查询。抽样必须说明规则，不能让抽样后的趋势掩盖异常数据。</p>
<p>绘制层和语义层应分离。数据更新时先更新用于表格和播报的模型，再按可见区域重绘画布；不要从 Canvas 像素反推屏幕阅读器内容。命中测试可以把指针坐标映射到最近数据点，但键盘路径应使用同一份数据模型，避免鼠标和键盘显示不同结果。</p>
<h2>实时数据、动画和减少动作</h2>
<p>实时图表应告诉用户更新时间、暂停状态和数据是否延迟。动画不能是理解数值变化的唯一方式；用户启用 <code>prefers-reduced-motion: reduce</code> 时，应减少或关闭过渡，并保留最终状态。快速变化的数据不应每帧触发播报，可按固定时间窗口合并为“过去 10 秒最高值”和“当前趋势”等摘要。</p>
<h2>常见误区和选型</h2>
<ul>
<li>只给 Canvas 写 <code>aria-label</code>：无法提供数据点、单位和操作细节。</li>
<li>只做鼠标悬停：触摸和键盘用户无法稳定查看数据。</li>
<li>用颜色区分全部系列：色觉差异和低对比度环境下会丢失信息。</li>
<li>把数万行数据一次性放进隐藏表格：可能让页面和辅助技术都变慢，应分页或按需展开。</li>
<li>把自动扫描通过当成无障碍完成：屏幕阅读器顺序、焦点、缩放和动态更新必须人工验证。</li>
</ul>
<p>选择 Canvas、SVG 或 HTML 时，应先看交互和数据量：少量、需要逐元素操作的图表可以优先 SVG 或 HTML；大量点位通常用 Canvas/WebGL，再补充结构化数据和键盘控制；只展示一张结论图时，语义化标题、摘要和数据表比复杂 ARIA 更可靠。</p>
<h2>参考资料</h2>
<ul>
<li><a href="https://www.w3.org/WAI/tutorials/images/complex/">WAI · Complex Images Tutorial</a></li>
<li><a href="https://www.w3.org/WAI/tutorials/tables/">WAI · Tables Tutorial</a></li>
<li><a href="https://www.w3.org/WAI/tutorials/carousels/">WAI · Carousels 与动态内容原则</a></li>
<li><a href="https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/img_role">MDN · ARIA <code>img</code> role</a></li>
</ul>`};export{e as default};