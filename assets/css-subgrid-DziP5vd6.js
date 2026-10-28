var e={answerHtml:`<h2>简答</h2>
<ul>
<li>嵌套 Grid 默认有自己的轨道，卡片内部的标题、正文、按钮不会跨卡片对齐。</li>
<li><code>grid-template-rows: subgrid</code> 让嵌套网格在指定轴上采用父网格的轨道，同时保留卡片的 DOM 边界。</li>
<li>卡片要先在父网格中跨越足够轨道（如 <code>grid-row: span 3</code>），subgrid 才有轨道可用。</li>
<li>比给标题固定高度更可靠；不支持时用 <code>@supports</code> 回退到卡片自己的三行布局。</li>
</ul>
<p>把几张卡片放在 Grid 中，很容易让卡片外框一样高。但如果每张卡片内部又各自设置三行“标题、说明、按钮”，它们的内部行高仍然分别计算：一张标题只有一行，另一张有三行，正文的起点就可能对不齐。</p>
<p>原因是 <strong>Grid 默认只直接管理自己的网格项，嵌套 Grid 有自己的轨道系统</strong>。父级把卡片放进网格，不会自动继续穿过卡片包装层，把内部标题和别的卡片标题放在同一条轨道上。</p>
<p><code>subgrid</code> 允许嵌套网格在指定轴上采用父网格的轨道，而不是重新定义一套。这样既保留卡片的 DOM 和语义边界，也能让内部内容参与共享的轨道尺寸计算。</p>
<h2>让两张卡片的标题、正文和按钮分别对齐</h2>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">div</span> <span class="hljs-attr">class</span>=<span class="hljs-string">&quot;catalog&quot;</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">article</span> <span class="hljs-attr">class</span>=<span class="hljs-string">&quot;course&quot;</span>&gt;</span>
    <span class="hljs-tag">&lt;<span class="hljs-name">h2</span>&gt;</span>HTML 入门<span class="hljs-tag">&lt;/<span class="hljs-name">h2</span>&gt;</span>
    <span class="hljs-tag">&lt;<span class="hljs-name">p</span>&gt;</span>认识元素、表单与文档结构。<span class="hljs-tag">&lt;/<span class="hljs-name">p</span>&gt;</span>
    <span class="hljs-tag">&lt;<span class="hljs-name">button</span> <span class="hljs-attr">type</span>=<span class="hljs-string">&quot;button&quot;</span>&gt;</span>查看课程<span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span>
  <span class="hljs-tag">&lt;/<span class="hljs-name">article</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">article</span> <span class="hljs-attr">class</span>=<span class="hljs-string">&quot;course&quot;</span>&gt;</span>
    <span class="hljs-tag">&lt;<span class="hljs-name">h2</span>&gt;</span>从布局计算到合成：浏览器渲染专题<span class="hljs-tag">&lt;/<span class="hljs-name">h2</span>&gt;</span>
    <span class="hljs-tag">&lt;<span class="hljs-name">p</span>&gt;</span>结合长文本、图片和动画理解页面怎样显示，以及如何定位性能问题。<span class="hljs-tag">&lt;/<span class="hljs-name">p</span>&gt;</span>
    <span class="hljs-tag">&lt;<span class="hljs-name">button</span> <span class="hljs-attr">type</span>=<span class="hljs-string">&quot;button&quot;</span>&gt;</span>查看课程<span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span>
  <span class="hljs-tag">&lt;/<span class="hljs-name">article</span>&gt;</span>
<span class="hljs-tag">&lt;/<span class="hljs-name">div</span>&gt;</span>
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.catalog</span> {
  <span class="hljs-attribute">display</span>: grid;
  <span class="hljs-attribute">grid-template-columns</span>: <span class="hljs-built_in">repeat</span>(<span class="hljs-number">2</span>, <span class="hljs-built_in">minmax</span>(<span class="hljs-number">0</span>, <span class="hljs-number">1</span>fr));
  <span class="hljs-attribute">gap</span>: <span class="hljs-number">1rem</span>;
}

<span class="hljs-selector-class">.course</span> {
  <span class="hljs-attribute">display</span>: grid;
  <span class="hljs-attribute">grid-template-rows</span>: auto <span class="hljs-number">1</span>fr auto;
  <span class="hljs-attribute">gap</span>: <span class="hljs-number">1rem</span>;
  <span class="hljs-attribute">padding</span>: <span class="hljs-number">1rem</span>;
  <span class="hljs-attribute">border</span>: <span class="hljs-number">1px</span> solid <span class="hljs-number">#cbd5e1</span>;
}

<span class="hljs-selector-class">.course</span> <span class="hljs-selector-tag">h2</span>,
<span class="hljs-selector-class">.course</span> <span class="hljs-selector-tag">p</span> {
  <span class="hljs-attribute">margin</span>: <span class="hljs-number">0</span>;
  <span class="hljs-attribute">overflow-wrap</span>: anywhere;
}

<span class="hljs-selector-class">.course</span> <span class="hljs-selector-tag">button</span> {
  <span class="hljs-attribute">justify-self</span>: start;
  <span class="hljs-attribute">align-self</span>: start;
}

<span class="hljs-keyword">@supports</span> (<span class="hljs-attribute">grid-template-rows</span>: subgrid) {
  <span class="hljs-selector-class">.course</span> {
    <span class="hljs-attribute">grid-row</span>: span <span class="hljs-number">3</span>;
    <span class="hljs-attribute">grid-template-rows</span>: subgrid;
  }
}

<span class="hljs-keyword">@media</span> (<span class="hljs-attribute">max-width</span>: <span class="hljs-number">36rem</span>) {
  <span class="hljs-selector-class">.catalog</span> {
    <span class="hljs-attribute">grid-template-columns</span>: <span class="hljs-built_in">minmax</span>(<span class="hljs-number">0</span>, <span class="hljs-number">1</span>fr);
  }
}
</code></pre></div>
<p>支持 subgrid 时，每张卡片在父级中跨越三条行轨道，再把这些轨道交给自己的三个直接子项。并排两张卡片共用同一组父行：标题所在行要容纳较高的标题，正文行要容纳相应内容，所以各部分的边界可以一起对齐。</p>
<p>其中 <code>grid-row: span 3</code> 很重要。它告诉父级给这张卡片分配三条行轨道，<code>grid-template-rows: subgrid</code> 才有这三条轨道可采用。只写 subgrid、却不安排父级跨度，不能期待自动生成任意数量的内部行。</p>
<p>不支持时，<code>@supports</code> 中的规则不会生效，卡片仍采用独立的 <code>auto 1fr auto</code> 三行布局，内容可读，按钮也可以靠各自中间行扩展保持底部排列，只是标题、正文之间不保证跨卡片精确对齐。</p>
<h2>为什么这不同于给标题固定高度</h2>
<p>把所有标题固定为 <code>3rem</code>，只是猜它们最多需要这么高。语言变长、用户放大字号或容器变窄时，标题就可能溢出。subgrid 让实际内容共同参与轨道尺寸计算，标题行可以随较长内容增长，而不用在 JavaScript 中测量最高标题再写回样式。</p>
<p>但“共享”也有范围。列表出现多排卡片时，后一排通常占用另外三条父行轨道，因此后一排的标题高度与前一排可以不同。subgrid 不会自动把整个列表中所有标题都统一成同一个高度。</p>
<h2>只共享列，还是同时共享行</h2>
<p>可以只写 <code>grid-template-columns: subgrid</code>，让表单行里的标签、输入框、提示对齐父级列，同时用自己的行布局。也可以只共享行，如上面的卡片例子，或者两个方向都采用 subgrid。</p>
<p>共享某个轴后，该轴可用的轨道数量由网格项跨越的父轨道决定。假设它跨越父网格的三列，它的列子网格就是这三列，不是整个父网格的全部列。</p>
<p>子网格内部的数字网格线编号从自身的起点重新算起。一个放在父级第 4 到第 7 条线之间的子网格，内部仍可以使用 <code>grid-column: 1 / -1</code> 表示铺满自己的显式列范围；不要直接把父级数字编号复制进来。父级命名线则能够传入子网格，还可以补充局部名字。</p>
<h2>间距和额外内容有哪些限制</h2>
<p>子网格在共享轴上默认采用父级的间距，也可以显式设置不同的 gap。间距变化不会把它变回完全独立的网格，但会影响内部项目相对共享网格线的边缘位置，所以要检查实际对齐效果。</p>
<p>subgrid 轴上不能像普通 Grid 那样无限追加隐式轨道。如果上面的卡片增加第四个直接子项，却仍然只跨三行，不应该期待自动得到第四条独立子网格行；自动放置可能把额外内容挤到已有轨道里。应明确增加跨度，或把新增内容包进既有区域。未采用 subgrid 的另一个轴仍可按普通网格规则处理。</p>
<p>它也不会自动穿透任意深度的包装层。需要共享对齐的后代应参与当前子网格布局；中间再多一层普通容器，就要决定该层是否也应成为嵌套子网格。设计时先确定需要共享的是哪几条轨道，再安排组件结构，比把所有嵌套 Grid 都改成 subgrid 更清楚。</p>`};export{e as default};