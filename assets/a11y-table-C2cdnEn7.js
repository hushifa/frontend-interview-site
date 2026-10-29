var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>看得见的用户扫一眼就知道某个数字属于哪一行哪一列，读屏用户却只能一格一格地听。所以数据表要用原生 <code>&lt;table&gt;</code>，并把表头关系写清楚，读屏才能在每个单元格前读出对应的表头。</p>
<p>具体来说，<code>&lt;caption&gt;</code> 是表格的名称，进入表格时读出。列表头写 <code>&lt;th scope=&quot;col&quot;&gt;</code>，行表头写 <code>&lt;th scope=&quot;row&quot;&gt;</code>，读屏在单元格之间移动时，会读出类似“列名，行名，值”的内容。多级表头用 <code>scope=&quot;colgroup&quot;</code> 和 <code>colspan</code>；关系再复杂，就用 <code>headers</code> 属性逐个关联，或者干脆拆成几个简单的表。</p>
<p>可排序的列，在表头里放一个按钮，并给 <code>th</code> 设置 <code>aria-sort=&quot;ascending&quot;</code> 或 <code>&quot;descending&quot;</code>。</p>
<p>还要注意窄屏。表格可以放进能横向滚动的容器里，但容器要加 <code>tabindex=&quot;0&quot;</code>、<code>role=&quot;region&quot;</code> 和名称，否则键盘用户滚不动它。</p>
</blockquote>
<h2>基本结构</h2>
<p>下面是一张季度销售表，外面套了一个可以横向滚动的容器。</p>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">div</span> <span class="hljs-attr">role</span>=<span class="hljs-string">&quot;region&quot;</span> <span class="hljs-attr">aria-labelledby</span>=<span class="hljs-string">&quot;sales-caption&quot;</span> <span class="hljs-attr">tabindex</span>=<span class="hljs-string">&quot;0&quot;</span> <span class="hljs-attr">class</span>=<span class="hljs-string">&quot;table-scroll&quot;</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">table</span>&gt;</span>
    <span class="hljs-tag">&lt;<span class="hljs-name">caption</span> <span class="hljs-attr">id</span>=<span class="hljs-string">&quot;sales-caption&quot;</span>&gt;</span>2026 年季度销售额（万元）<span class="hljs-tag">&lt;/<span class="hljs-name">caption</span>&gt;</span>
    <span class="hljs-tag">&lt;<span class="hljs-name">thead</span>&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">tr</span>&gt;</span>
        <span class="hljs-tag">&lt;<span class="hljs-name">th</span> <span class="hljs-attr">scope</span>=<span class="hljs-string">&quot;col&quot;</span>&gt;</span>地区<span class="hljs-tag">&lt;/<span class="hljs-name">th</span>&gt;</span>
        <span class="hljs-tag">&lt;<span class="hljs-name">th</span> <span class="hljs-attr">scope</span>=<span class="hljs-string">&quot;col&quot;</span>&gt;</span>
          <span class="hljs-tag">&lt;<span class="hljs-name">button</span>&gt;</span>第一季度<span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span>
        <span class="hljs-tag">&lt;/<span class="hljs-name">th</span>&gt;</span>
        <span class="hljs-tag">&lt;<span class="hljs-name">th</span> <span class="hljs-attr">scope</span>=<span class="hljs-string">&quot;col&quot;</span> <span class="hljs-attr">aria-sort</span>=<span class="hljs-string">&quot;descending&quot;</span>&gt;</span>
          <span class="hljs-tag">&lt;<span class="hljs-name">button</span>&gt;</span>第二季度<span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span>
        <span class="hljs-tag">&lt;/<span class="hljs-name">th</span>&gt;</span>
      <span class="hljs-tag">&lt;/<span class="hljs-name">tr</span>&gt;</span>
    <span class="hljs-tag">&lt;/<span class="hljs-name">thead</span>&gt;</span>
    <span class="hljs-tag">&lt;<span class="hljs-name">tbody</span>&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">tr</span>&gt;</span>
        <span class="hljs-tag">&lt;<span class="hljs-name">th</span> <span class="hljs-attr">scope</span>=<span class="hljs-string">&quot;row&quot;</span>&gt;</span>华东<span class="hljs-tag">&lt;/<span class="hljs-name">th</span>&gt;</span>
        <span class="hljs-tag">&lt;<span class="hljs-name">td</span>&gt;</span>120<span class="hljs-tag">&lt;/<span class="hljs-name">td</span>&gt;</span>
        <span class="hljs-tag">&lt;<span class="hljs-name">td</span>&gt;</span>150<span class="hljs-tag">&lt;/<span class="hljs-name">td</span>&gt;</span>
      <span class="hljs-tag">&lt;/<span class="hljs-name">tr</span>&gt;</span>
    <span class="hljs-tag">&lt;/<span class="hljs-name">tbody</span>&gt;</span>
  <span class="hljs-tag">&lt;/<span class="hljs-name">table</span>&gt;</span>
<span class="hljs-tag">&lt;/<span class="hljs-name">div</span>&gt;</span>
</code></pre></div>
<p>读屏移到 150 这一格时，会结合“第二季度”和“华东”这两个表头一起读，用户就知道这是华东第二季度的数字。这就是 <code>scope</code> 的作用。</p>
<p>“华东”用的是 <code>th scope=&quot;row&quot;</code> 而不是 <code>td</code>，因为它是这一行的表头。第二季度表头上的 <code>aria-sort=&quot;descending&quot;</code> 告诉读屏这列当前按降序排列，表头里的按钮负责触发排序。</p>
<p>外层容器为什么要 <code>tabindex=&quot;0&quot;</code>？因为普通的 <code>div</code> 不能聚焦，键盘用户就没法用方向键滚动它。加上 <code>role=&quot;region&quot;</code> 和名称，读屏也知道这块区域是什么。</p>
<h2>多级表头</h2>
<p>表头有两层时，上层用 <code>colgroup</code> 表示它管着下面好几列。</p>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">thead</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">tr</span>&gt;</span>
    <span class="hljs-tag">&lt;<span class="hljs-name">td</span>&gt;</span><span class="hljs-tag">&lt;/<span class="hljs-name">td</span>&gt;</span>
    <span class="hljs-tag">&lt;<span class="hljs-name">th</span> <span class="hljs-attr">scope</span>=<span class="hljs-string">&quot;colgroup&quot;</span> <span class="hljs-attr">colspan</span>=<span class="hljs-string">&quot;2&quot;</span>&gt;</span>上半年<span class="hljs-tag">&lt;/<span class="hljs-name">th</span>&gt;</span>
  <span class="hljs-tag">&lt;/<span class="hljs-name">tr</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">tr</span>&gt;</span>
    <span class="hljs-tag">&lt;<span class="hljs-name">th</span> <span class="hljs-attr">scope</span>=<span class="hljs-string">&quot;col&quot;</span>&gt;</span>地区<span class="hljs-tag">&lt;/<span class="hljs-name">th</span>&gt;</span>
    <span class="hljs-tag">&lt;<span class="hljs-name">th</span> <span class="hljs-attr">scope</span>=<span class="hljs-string">&quot;col&quot;</span>&gt;</span>Q1<span class="hljs-tag">&lt;/<span class="hljs-name">th</span>&gt;</span>
    <span class="hljs-tag">&lt;<span class="hljs-name">th</span> <span class="hljs-attr">scope</span>=<span class="hljs-string">&quot;col&quot;</span>&gt;</span>Q2<span class="hljs-tag">&lt;/<span class="hljs-name">th</span>&gt;</span>
  <span class="hljs-tag">&lt;/<span class="hljs-name">tr</span>&gt;</span>
<span class="hljs-tag">&lt;/<span class="hljs-name">thead</span>&gt;</span>
</code></pre></div>
<p>“上半年”横跨 Q1 和 Q2 两列，<code>scope=&quot;colgroup&quot;</code> 让读屏知道这两列都属于上半年。</p>
<h2>常见错误</h2>
<p>用 CSS Grid 加 <code>div</code> 显示表格数据，读屏就没法按行和列导航了。确实需要 div 结构时，要把 <code>role=&quot;table&quot;</code>、<code>row</code>、<code>columnheader</code>、<code>cell</code> 全部补上。</p>
<p>反过来，给布局用的表格加 <code>th</code>，读屏会把它当成数据表来读。布局用 CSS 做，不要用 table。</p>
<p>还有一种是让每个单元格都能聚焦，用户按 Tab 要按几百次。普通数据表只让单元格里的链接和按钮能聚焦。</p>
<h2>可编辑的表格是另一回事</h2>
<p>像电子表格那样用方向键在格子间移动、按 Enter 编辑的表格，是 <code>role=&quot;grid&quot;</code>。它要实现漫游焦点、方向键、Enter 编辑等一整套键盘行为，复杂得多，参考 APG 的 Grid 模式。</p>
<h2>常见追问</h2>
<p><strong>窄屏下把表格改成卡片可以吗？</strong></p>
<blockquote>
<p>可以，但每张卡片要把表头文字一起显示出来，比如“第二季度：150”。否则读屏用户只听到一个数字，不知道它是哪一列的。</p>
</blockquote>`};export{e as default};