var e={answerHtml:`<h2>简答</h2>
<ul>
<li><code>&lt;caption&gt;</code> 是表格的名称，读屏进入表格时读出。</li>
<li>列表头 <code>&lt;th scope=&quot;col&quot;&gt;</code>，行表头 <code>&lt;th scope=&quot;row&quot;&gt;</code>；读屏在单元格之间移动时会读出“列名，行名，值”。</li>
<li>多级表头用 <code>scope=&quot;colgroup&quot;</code> 和 <code>colspan</code>；关系太复杂时用 <code>headers</code> 属性逐个关联，或者考虑拆成多个简单表格。</li>
<li>排序列在表头里放一个按钮，并给 <code>th</code> 设置 <code>aria-sort=&quot;ascending&quot;</code> 或 <code>descending</code>。</li>
<li>窄屏下表格可以放进可横向滚动的容器，容器加 <code>tabindex=&quot;0&quot;</code>、<code>role=&quot;region&quot;</code> 和名称，键盘用户才能滚动。</li>
</ul>
<h2>基本结构</h2>
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
<h2>多级表头</h2>
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
<h2>常见错误</h2>
<ul>
<li>用 CSS Grid 加 <code>div</code> 显示表格数据：读屏无法按行列导航。确实需要 div 结构时，要完整补上 <code>role=&quot;table&quot;</code>、<code>row</code>、<code>columnheader</code>、<code>cell</code>。</li>
<li>给布局用的表格加了 <code>th</code>：读屏会把它当成数据表。布局用 CSS，不要用 table。</li>
<li>表格里每个单元格都可聚焦：Tab 要经过几百次。普通数据表只让单元格里的链接和按钮可聚焦。</li>
</ul>
<h2>可交互的网格</h2>
<p>可编辑的表格（像电子表格那样用方向键移动）是 <code>role=&quot;grid&quot;</code>，需要实现漫游焦点、方向键、Enter 编辑等键盘行为，复杂度高得多，参考 APG 的 Grid 模式。</p>
<h2>常见追问</h2>
<ul>
<li>窄屏下把表格改成卡片可以吗？可以，但每张卡片要把表头文字一起显示，例如“第二季度：150”，读屏用户才不会丢掉列的含义。</li>
</ul>`};export{e as default};