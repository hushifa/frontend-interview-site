var e={answerHtml:`<h2>简答</h2>
<ul>
<li>图表旁边写出标题、单位、时间范围和一句话结论，并提供可展开的数据表，读屏用户和需要精确数值的用户都能用上。</li>
<li>整张图作为一张图片说明时用 <code>role=&quot;img&quot;</code> 加名称和描述；需要逐点探索时，交互控件放在 <code>role=&quot;img&quot;</code> 外面。</li>
<li>悬停提示不能是唯一的数据入口，键盘和触摸用户也要能查看数据点。</li>
<li>颜色不能是唯一编码，同时用线型、形状或直接标注区分系列。</li>
<li>数据量大时，Canvas 或 WebGL 负责绘制，语义层只为当前选中项或可见区域维护少量节点；实时数据按时间窗口合并播报。</li>
</ul>
<h2>结构示例</h2>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">section</span> <span class="hljs-attr">aria-labelledby</span>=<span class="hljs-string">&quot;sales-title&quot;</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">h2</span> <span class="hljs-attr">id</span>=<span class="hljs-string">&quot;sales-title&quot;</span>&gt;</span>本季度销售额趋势<span class="hljs-tag">&lt;/<span class="hljs-name">h2</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">p</span> <span class="hljs-attr">id</span>=<span class="hljs-string">&quot;sales-summary&quot;</span>&gt;</span>4 月至 6 月持续增长，6 月比 5 月增加 12%。<span class="hljs-tag">&lt;/<span class="hljs-name">p</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">div</span> <span class="hljs-attr">role</span>=<span class="hljs-string">&quot;img&quot;</span> <span class="hljs-attr">aria-labelledby</span>=<span class="hljs-string">&quot;sales-title&quot;</span> <span class="hljs-attr">aria-describedby</span>=<span class="hljs-string">&quot;sales-summary&quot;</span>&gt;</span>
    <span class="hljs-tag">&lt;<span class="hljs-name">canvas</span> <span class="hljs-attr">width</span>=<span class="hljs-string">&quot;640&quot;</span> <span class="hljs-attr">height</span>=<span class="hljs-string">&quot;320&quot;</span>&gt;</span><span class="hljs-tag">&lt;/<span class="hljs-name">canvas</span>&gt;</span>
  <span class="hljs-tag">&lt;/<span class="hljs-name">div</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">details</span>&gt;</span>
    <span class="hljs-tag">&lt;<span class="hljs-name">summary</span>&gt;</span>查看详细数据<span class="hljs-tag">&lt;/<span class="hljs-name">summary</span>&gt;</span>
    <span class="hljs-tag">&lt;<span class="hljs-name">table</span>&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">caption</span>&gt;</span>按月份统计的销售额（万元）<span class="hljs-tag">&lt;/<span class="hljs-name">caption</span>&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">thead</span>&gt;</span>
        <span class="hljs-tag">&lt;<span class="hljs-name">tr</span>&gt;</span><span class="hljs-tag">&lt;<span class="hljs-name">th</span> <span class="hljs-attr">scope</span>=<span class="hljs-string">&quot;col&quot;</span>&gt;</span>月份<span class="hljs-tag">&lt;/<span class="hljs-name">th</span>&gt;</span><span class="hljs-tag">&lt;<span class="hljs-name">th</span> <span class="hljs-attr">scope</span>=<span class="hljs-string">&quot;col&quot;</span>&gt;</span>销售额<span class="hljs-tag">&lt;/<span class="hljs-name">th</span>&gt;</span><span class="hljs-tag">&lt;/<span class="hljs-name">tr</span>&gt;</span>
      <span class="hljs-tag">&lt;/<span class="hljs-name">thead</span>&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">tbody</span>&gt;</span>
        <span class="hljs-tag">&lt;<span class="hljs-name">tr</span>&gt;</span><span class="hljs-tag">&lt;<span class="hljs-name">th</span> <span class="hljs-attr">scope</span>=<span class="hljs-string">&quot;row&quot;</span>&gt;</span>4 月<span class="hljs-tag">&lt;/<span class="hljs-name">th</span>&gt;</span><span class="hljs-tag">&lt;<span class="hljs-name">td</span>&gt;</span>80<span class="hljs-tag">&lt;/<span class="hljs-name">td</span>&gt;</span><span class="hljs-tag">&lt;/<span class="hljs-name">tr</span>&gt;</span>
        <span class="hljs-tag">&lt;<span class="hljs-name">tr</span>&gt;</span><span class="hljs-tag">&lt;<span class="hljs-name">th</span> <span class="hljs-attr">scope</span>=<span class="hljs-string">&quot;row&quot;</span>&gt;</span>5 月<span class="hljs-tag">&lt;/<span class="hljs-name">th</span>&gt;</span><span class="hljs-tag">&lt;<span class="hljs-name">td</span>&gt;</span>92<span class="hljs-tag">&lt;/<span class="hljs-name">td</span>&gt;</span><span class="hljs-tag">&lt;/<span class="hljs-name">tr</span>&gt;</span>
        <span class="hljs-tag">&lt;<span class="hljs-name">tr</span>&gt;</span><span class="hljs-tag">&lt;<span class="hljs-name">th</span> <span class="hljs-attr">scope</span>=<span class="hljs-string">&quot;row&quot;</span>&gt;</span>6 月<span class="hljs-tag">&lt;/<span class="hljs-name">th</span>&gt;</span><span class="hljs-tag">&lt;<span class="hljs-name">td</span>&gt;</span>103<span class="hljs-tag">&lt;/<span class="hljs-name">td</span>&gt;</span><span class="hljs-tag">&lt;/<span class="hljs-name">tr</span>&gt;</span>
      <span class="hljs-tag">&lt;/<span class="hljs-name">tbody</span>&gt;</span>
    <span class="hljs-tag">&lt;/<span class="hljs-name">table</span>&gt;</span>
  <span class="hljs-tag">&lt;/<span class="hljs-name">details</span>&gt;</span>
<span class="hljs-tag">&lt;/<span class="hljs-name">section</span>&gt;</span>
</code></pre></div>
<p>不要把全部数据拼进一个超长的 <code>aria-label</code>，读屏用户无法定位。纯装饰的图表从无障碍树中隐藏即可。</p>
<p>SVG 可以用 <code>&lt;title&gt;</code> 和 <code>&lt;desc&gt;</code> 提供名称和描述，网格线、坐标轴等装饰元素加 <code>aria-hidden=&quot;true&quot;</code>。</p>
<h2>键盘探索</h2>
<p>需要逐点查看时，可以这样设计（这是一种常见方案，不是 ARIA 规定的标准）：</p>
<ul>
<li><code>Tab</code> 进入图表的数据选择器。</li>
<li>方向键在数据点或系列之间移动，<code>Home</code>/<code>End</code> 跳到首尾。</li>
<li>选中点的详情显示在图表外的固定区域。</li>
<li><code>Escape</code> 关闭浮层，焦点回到触发位置。</li>
</ul>
<p>鼠标和键盘使用同一份数据模型确定&quot;当前点&quot;，不要从 Canvas 像素反推。数据点成千上万时，提供按区间跳转或搜索，不要求用户逐个按方向键。</p>
<h2>颜色与对比</h2>
<ul>
<li>系列之间用实线、虚线、不同标记形状区分，或在线条末端直接写系列名。</li>
<li>文字与背景的对比度满足 WCAG 要求（正文 4.5:1），线条、图形等非文本元素与相邻颜色的对比度至少 3:1。</li>
<li>细线、半透明区域、重叠的点在工具检查之外还要人工看一遍。</li>
</ul>
<h2>大数据量</h2>
<table><thead><tr><th>层</th><th>负责</th><th>规模</th></tr></thead><tbody><tr><td>绘制层</td><td>Canvas 或 WebGL 画全部数据</td><td>任意多</td></tr><tr><td>语义层</td><td>摘要、当前选中点、图例按钮</td><td>少量节点</td></tr><tr><td>数据表</td><td>完整数据，分页或按需展开</td><td>不一次性全部渲染</td></tr></tbody></table>
<p>抽样显示时要说明抽样规则，避免抽样掩盖异常值。</p>
<h2>实时数据和动画</h2>
<ul>
<li>显示更新时间和是否暂停，提供暂停按钮。</li>
<li>live region 不要每帧播报，改为定期播报摘要，例如&quot;过去 10 秒最高 120，当前呈上升趋势&quot;。</li>
<li>用户开启 <code>prefers-reduced-motion: reduce</code> 时减少或关闭过渡动画，直接显示最终状态。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li><strong>自动化检查通过了，就算完成了吗？</strong> 不算。读屏顺序、焦点移动、缩放和动态更新要用真实读屏软件测试。</li>
<li><strong>少量数据的图表用什么实现？</strong> 几十个数据点、需要逐个操作时，用 SVG 或 HTML 更简单，元素可以直接获得焦点和名称。</li>
</ul>`};export{e as default};