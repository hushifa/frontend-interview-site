var e={answerHtml:`<p>“一维用 Flex，二维用 Grid”是一个有用起点，但不是说 Flex 不能换行、Grid 不能只排一行。区别在于：<strong>Flex 主要让一行或一列内的项目分配空间，Grid 让项目按共享的轨道系统对齐。</strong></p>
<p>所以应先看需要怎样的关系，而不是先决定项目必须统一使用哪一种布局。</p>
<h3>项目宽度随内容变化，通常先考虑 Flex</h3>
<p>工具栏里的标题、搜索框和按钮不一定等宽。标题占自己需要的空间，搜索框吃剩余空间，操作按钮保持可用宽度，这种主轴空间分配很适合 Flex。</p>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">div</span> <span class="hljs-attr">class</span>=<span class="hljs-string">&quot;toolbar&quot;</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">strong</span>&gt;</span>题目列表<span class="hljs-tag">&lt;/<span class="hljs-name">strong</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">label</span> <span class="hljs-attr">class</span>=<span class="hljs-string">&quot;search&quot;</span>&gt;</span>
    <span class="hljs-tag">&lt;<span class="hljs-name">span</span>&gt;</span>搜索<span class="hljs-tag">&lt;/<span class="hljs-name">span</span>&gt;</span>
    <span class="hljs-tag">&lt;<span class="hljs-name">input</span> <span class="hljs-attr">type</span>=<span class="hljs-string">&quot;search&quot;</span> /&gt;</span>
  <span class="hljs-tag">&lt;/<span class="hljs-name">label</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">button</span> <span class="hljs-attr">type</span>=<span class="hljs-string">&quot;button&quot;</span>&gt;</span>筛选<span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span>
<span class="hljs-tag">&lt;/<span class="hljs-name">div</span>&gt;</span>
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.toolbar</span> {
  <span class="hljs-attribute">display</span>: flex;
  <span class="hljs-attribute">align-items</span>: center;
  <span class="hljs-attribute">flex-wrap</span>: wrap;
  <span class="hljs-attribute">gap</span>: <span class="hljs-number">0.75rem</span>;
}

<span class="hljs-selector-class">.search</span> {
  <span class="hljs-attribute">display</span>: flex;
  <span class="hljs-attribute">align-items</span>: center;
  <span class="hljs-attribute">gap</span>: <span class="hljs-number">0.5rem</span>;
  <span class="hljs-attribute">flex</span>: <span class="hljs-number">1</span> <span class="hljs-number">1</span> <span class="hljs-number">15rem</span>;
  <span class="hljs-attribute">min-width</span>: <span class="hljs-number">0</span>;
}

<span class="hljs-selector-class">.search</span> <span class="hljs-selector-tag">input</span> {
  <span class="hljs-attribute">flex</span>: <span class="hljs-number">1</span>;
  <span class="hljs-attribute">min-width</span>: <span class="hljs-number">0</span>;
}
</code></pre></div>
<p>外层把三类内容沿主轴排开，并允许窄屏换行；内层搜索区让文字标签和输入框对齐，输入框拿到可用的剩余空间。这里没有要求“第二行的第三个项目必须对齐第一行的第三列”，所以不必先建立严格列轨道。</p>
<p>Flex 的交叉轴对齐很方便，但项目不是永远等宽。最终尺寸还受到 flex-basis、增长收缩系数、最小尺寸与内容的影响。</p>
<h3>需要不同项目共用列边界，通常先考虑 Grid</h3>
<p>题库页面的侧栏与内容区、规格表里的标签与值、课程卡片矩阵，往往更重视列边界的一致性。</p>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.page-layout</span> {
  <span class="hljs-attribute">display</span>: grid;
  <span class="hljs-attribute">grid-template-columns</span>: <span class="hljs-number">15rem</span> <span class="hljs-built_in">minmax</span>(<span class="hljs-number">0</span>, <span class="hljs-number">1</span>fr);
  <span class="hljs-attribute">gap</span>: <span class="hljs-number">2rem</span>;
}

<span class="hljs-selector-class">.cards</span> {
  <span class="hljs-attribute">display</span>: grid;
  <span class="hljs-attribute">grid-template-columns</span>: <span class="hljs-built_in">repeat</span>(<span class="hljs-number">3</span>, <span class="hljs-built_in">minmax</span>(<span class="hljs-number">0</span>, <span class="hljs-number">1</span>fr));
  <span class="hljs-attribute">gap</span>: <span class="hljs-number">1rem</span>;
}

<span class="hljs-keyword">@media</span> (<span class="hljs-attribute">max-width</span>: <span class="hljs-number">50rem</span>) {
  <span class="hljs-selector-class">.page-layout</span> {
    <span class="hljs-attribute">grid-template-columns</span>: <span class="hljs-built_in">minmax</span>(<span class="hljs-number">0</span>, <span class="hljs-number">1</span>fr);
  }

  <span class="hljs-selector-class">.cards</span> {
    <span class="hljs-attribute">grid-template-columns</span>: <span class="hljs-built_in">repeat</span>(<span class="hljs-number">2</span>, <span class="hljs-built_in">minmax</span>(<span class="hljs-number">0</span>, <span class="hljs-number">1</span>fr));
  }
}

<span class="hljs-keyword">@media</span> (<span class="hljs-attribute">max-width</span>: <span class="hljs-number">32rem</span>) {
  <span class="hljs-selector-class">.cards</span> {
    <span class="hljs-attribute">grid-template-columns</span>: <span class="hljs-built_in">minmax</span>(<span class="hljs-number">0</span>, <span class="hljs-number">1</span>fr);
  }
}
</code></pre></div>
<p>Grid 先提供轨道结构，项目再落入相应格子。不同排的卡片会共用列宽和网格线，某一排少几个项目也不会让这一排自动重新分出一套列宽。需要跨列的区域，也可以直接用 grid-column 表达。</p>
<p>这里的 <code>minmax(0, 1fr)</code> 允许弹性列缩到小于内容的自动最小宽度，但内容本身仍可能需要换行、裁切或局部滚动规则，不能把它当成所有溢出问题的万能修复。</p>
<h3>换行之后，差别最容易看出来</h3>
<p>假设一共有五张卡片，大屏一排容纳三张：</p>
<ul>
<li>Flex 配合换行和增长系数，可以让第一排三项各占一份，第二排两项又各自分掉第二排的剩余空间，所以最后两项可能明显更宽。</li>
<li>三列 Grid 中，第二排两项仍落在前两条既定列轨道上，最后一格保持空着，列边界与上一排一致。</li>
</ul>
<p>两种结果都可能正确。标签、按钮组希望每排自然铺开，可以选 Flex；商品列表希望各排保持列槽位，可以选 Grid。先把“最后一排应该长什么样”说清楚，通常就比空谈一维二维更容易做决定。</p>
<p>Grid 的 auto-fit、auto-fill 还能自动调整列数，但 auto-fit 折叠的是整条空轨道，不是保证最后一排的每个项目都自动铺满整行。需要那种效果时，不应把它与 Flex 的逐行分配混淆。</p>
<h3>页面和组件可以使用不同布局</h3>
<p>外层用 Grid 划分目录与正文，卡片内用 Flex 排列图标、标题和操作区，是很自然的组合。一个 Flex 项自己也可以成为 Grid 容器，反过来也一样。</p>
<p>若多个卡片不仅外框需要对齐，内部标题、正文、按钮也要跨卡片对齐，普通嵌套 Grid 仍可能各算各的轨道，可以进一步考虑 subgrid。若只是单列文章流，则普通块布局已经很好，未必需要给每一层都增加 Flex 或 Grid。</p>
<h3>两者都会受到内容与阅读顺序约束</h3>
<p>Flex 项常见的自动最小宽度会让长标题或输入框撑开布局，必要时设置 min-width:0，再决定文字怎样显示。纵向可滚动区域也可能需要相应的 min-height:0。Grid 的轨道最小值则需要结合 minmax、内容大小与项目约束检查。</p>
<p>order、row-reverse 或显式网格放置可以改变视觉位置，但通常不会同步改写 DOM 阅读顺序和键盘 Tab 顺序。把操作按钮视觉挪到前面、焦点却仍在最后，可能造成理解困难。优先让 DOM 本身具有合理顺序，再用布局适配显示。</p>
<p>因此选择标准是：内容怎样分配空间、是否要共享行列边界、换行后怎样表现，以及视觉顺序是否与语义顺序一致。某个方案需要大量硬编码百分比和例外规则时，就值得检查是否选错了布局模型。</p>`};export{e as default};