var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>一张折线图，看得见的人扫一眼就知道“在涨”，读屏用户却什么也拿不到。所以图表旁边要用文字写出标题、单位、时间范围和一句话结论，再提供一个可以展开的数据表。读屏用户和想看精确数值的人都用得上。</p>
<p>整张图当成一张图片来说明时，用 <code>role=&quot;img&quot;</code> 加上名称和描述。如果要让用户逐个查看数据点，交互控件就要放在 <code>role=&quot;img&quot;</code> 外面。悬停提示也不能是唯一能看数据的地方，键盘和触摸用户也要能看到。</p>
<p>颜色不能是区分系列的唯一手段，还要配合线型、形状或者直接写上系列名。</p>
<p>性能和无障碍可以分开做：数据量大时，Canvas 或 WebGL 负责画全部数据，语义层只给当前选中项或可见区域维护少量节点。实时数据要按时间段合并以后再播报。</p>
</blockquote>
<h2>一个图表的基本结构</h2>
<p>下面的结构里，标题和结论是普通文字，图表本身整体当作一张图片，数据表放在可以展开的 <code>&lt;details&gt;</code> 里：</p>
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
<p>读屏软件读到图表时，会念出标题作为名称，念出那句结论作为描述。想看具体数字，就展开表格。</p>
<p>为什么不把所有数据都写进 <code>aria-label</code>？因为那样会变成一长串话，读屏用户没法在里面定位到某一个数。纯装饰的图表，直接从无障碍树里隐藏就行。</p>
<p>如果用 SVG，可以用 <code>&lt;title&gt;</code> 和 <code>&lt;desc&gt;</code> 提供名称和描述，网格线、坐标轴这类装饰元素加上 <code>aria-hidden=&quot;true&quot;</code>。</p>
<h2>怎样用键盘逐个查看数据点</h2>
<p>需要逐点查看时，下面是一种常见的设计。这不是 ARIA 规定的标准，只是常用做法：</p>
<ul>
<li><code>Tab</code> 进入图表的数据选择器。</li>
<li>方向键在数据点或系列之间移动，<code>Home</code>/<code>End</code> 跳到首尾。</li>
<li>选中点的详情显示在图表外的固定区域。</li>
<li><code>Escape</code> 关闭浮层，焦点回到触发位置。</li>
</ul>
<p>鼠标和键盘要用同一份数据模型来决定“当前是哪个点”，不要从 Canvas 的像素反推。数据点有成千上万个时，要提供按区间跳转或搜索，不能让用户一个个按方向键。</p>
<h2>颜色和对比度要注意什么</h2>
<p>色盲用户分不清某些颜色，所以系列之间要用实线、虚线、不同形状的标记来区分，或者在线条末端直接写上系列名。</p>
<p>对比度也有要求。文字和背景的对比度要满足 WCAG，正文是 4.5:1；线条、图形这类非文本元素，和相邻颜色的对比度至少 3:1。</p>
<p>细线、半透明区域、重叠的点，工具检查过了也要人工再看一遍，因为工具不一定能判断出来。</p>
<h2>数据量很大时怎样分层</h2>
<p>思路是把“画出来”和“读出来”分开：</p>
<table><thead><tr><th>层</th><th>负责</th><th>规模</th></tr></thead><tbody><tr><td>绘制层</td><td>Canvas 或 WebGL 画全部数据</td><td>任意多</td></tr><tr><td>语义层</td><td>摘要、当前选中点、图例按钮</td><td>少量节点</td></tr><tr><td>数据表</td><td>完整数据，分页或按需展开</td><td>不一次性全部渲染</td></tr></tbody></table>
<p>绘制层画多少都不增加 DOM 节点。语义层只有几个节点，读屏用户靠它操作。完整数据在表格里，按需展开或者分页，不一次性全渲染出来。</p>
<p>如果做了抽样显示，要说清楚抽样规则，免得抽样把异常值给藏掉了。</p>
<h2>实时数据和动画怎么处理</h2>
<p>要显示数据的更新时间、现在是否暂停，并提供暂停按钮。</p>
<p>live region 是一块内容变化时读屏软件会自动念出来的区域。它不要每帧都播报，否则用户什么都听不清。应该定期播报一段摘要，比如“过去 10 秒最高 120，当前呈上升趋势”。</p>
<p>用户在系统里开了“减少动态效果”，也就是 <code>prefers-reduced-motion: reduce</code> 时，要减少或关掉过渡动画，直接显示最终状态。</p>
<h2>常见追问</h2>
<p><strong>自动化检查通过了，就算完成了吗？</strong></p>
<blockquote>
<p>不算。读屏的顺序、焦点怎么移动、页面缩放和动态更新，都要用真实的读屏软件测一遍。</p>
</blockquote>
<p><strong>数据很少的图表用什么实现？</strong></p>
<blockquote>
<p>只有几十个数据点、又要逐个操作时，用 SVG 或 HTML 更简单。每个元素可以直接获得焦点和名称，不用自己维护语义层。</p>
</blockquote>`};export{e as default};