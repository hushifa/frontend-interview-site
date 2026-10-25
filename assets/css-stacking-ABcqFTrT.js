var e={answerHtml:`<p><code>z-index: 999999</code> 不是全页面通用的最高通行证。浏览器把一部分元素组织成独立的<strong>层叠上下文</strong>，每个上下文先安排内部的绘制顺序，再把整体放进外层参与排序。</p>
<p>可以把它理解成成组比较：A 组整体在 B 组下面，那么 A 组中的子元素即使排在组内最前，也不能凭自己的数值插到 B 组上面。DOM 层级不完全等同于这棵上下文树，只有满足特定条件的元素才创建新的组。</p>
<h3>一个数值很大仍被挡住的例子</h3>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">div</span> <span class="hljs-attr">class</span>=<span class="hljs-string">&quot;stage&quot;</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">section</span> <span class="hljs-attr">class</span>=<span class="hljs-string">&quot;left&quot;</span>&gt;</span>
    左侧区域
    <span class="hljs-tag">&lt;<span class="hljs-name">div</span> <span class="hljs-attr">class</span>=<span class="hljs-string">&quot;tip&quot;</span>&gt;</span>提示内容，z-index 很大<span class="hljs-tag">&lt;/<span class="hljs-name">div</span>&gt;</span>
  <span class="hljs-tag">&lt;/<span class="hljs-name">section</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">section</span> <span class="hljs-attr">class</span>=<span class="hljs-string">&quot;right&quot;</span>&gt;</span>右侧区域<span class="hljs-tag">&lt;/<span class="hljs-name">section</span>&gt;</span>
<span class="hljs-tag">&lt;/<span class="hljs-name">div</span>&gt;</span>
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.stage</span> {
  <span class="hljs-attribute">display</span>: grid;
  <span class="hljs-attribute">grid-template-columns</span>: <span class="hljs-number">1</span>fr <span class="hljs-number">1</span>fr;
  <span class="hljs-attribute">width</span>: <span class="hljs-number">360px</span>;
  <span class="hljs-attribute">max-width</span>: <span class="hljs-number">100%</span>;
}

<span class="hljs-selector-class">.stage</span> &gt; <span class="hljs-selector-tag">section</span> {
  <span class="hljs-attribute">min-height</span>: <span class="hljs-number">6rem</span>;
}

<span class="hljs-selector-class">.left</span> {
  <span class="hljs-attribute">position</span>: relative;
  <span class="hljs-attribute">z-index</span>: <span class="hljs-number">1</span>;
  <span class="hljs-attribute">background</span>: <span class="hljs-number">#e2e8f0</span>;
}

<span class="hljs-selector-class">.tip</span> {
  <span class="hljs-attribute">position</span>: absolute;
  <span class="hljs-attribute">top</span>: <span class="hljs-number">2rem</span>;
  <span class="hljs-attribute">left</span>: <span class="hljs-number">3rem</span>;
  <span class="hljs-attribute">width</span>: <span class="hljs-number">16rem</span>;
  <span class="hljs-attribute">z-index</span>: <span class="hljs-number">999999</span>;
  <span class="hljs-attribute">background</span>: <span class="hljs-number">#fde68a</span>;
}

<span class="hljs-selector-class">.right</span> {
  <span class="hljs-attribute">position</span>: relative;
  <span class="hljs-attribute">z-index</span>: <span class="hljs-number">2</span>;
  <span class="hljs-attribute">background</span>: <span class="hljs-number">#bfdbfe</span>;
}
</code></pre></div>
<p>提示框横向伸进右侧区域，但重叠部分仍会被右侧背景盖住。<code>.left</code> 与 <code>.right</code> 分别建立上下文，外层先比较的是 1 和 2。提示框的 999999 只在左侧上下文内有意义，不会拿来与右侧的 2 直接比较。</p>
<p>把 <code>.left</code> 的层级调到右侧之上，能让它连同提示框一起上来。但这也会提高整个左侧区域，不一定符合需求。如果只希望提示框浮到页面其他区域之上，应考虑把提示框移出这个受限上下文。</p>
<h3>哪些样式会建立新的上下文</h3>
<p>常见情况包括：</p>
<ul>
<li>文档根元素。</li>
<li><code>position: relative</code> 或 <code>absolute</code>，并且 <code>z-index</code> 不是 <code>auto</code>。</li>
<li><code>position: fixed</code> 或 <code>sticky</code>，即便 <code>z-index</code> 是 <code>auto</code>。</li>
<li>Flex 项或 Grid 项设置了非 <code>auto</code> 的 <code>z-index</code>，不要求额外写 <code>position: relative</code>。</li>
<li><code>opacity</code> 小于 1、非 <code>none</code> 的 <code>transform</code>，以及 <code>isolation: isolate</code>。</li>
<li><code>contain: layout</code>、<code>contain: paint</code> 等包含规则，或指定相关属性的 <code>will-change</code>。</li>
</ul>
<p>这不是所有触发条件的完整清单。例如混合模式、滤镜、裁剪路径等也可能相关，排查时应查看实际计算样式和对应规则。</p>
<p>特别容易忽略的是 <code>opacity: 0.99</code> 与 <code>transform: translateZ(0)</code>：它们可能看不出明显视觉变化，却改变了分组关系。不要为了所谓“开启硬件加速”到处添加 transform，然后只在子元素上不断加大层级。</p>
<h3><code>auto</code> 和 0 不是总能互换</h3>
<p>对普通的相对或绝对定位元素，<code>z-index: auto</code> 本身不会创建新的层叠上下文，<code>z-index: 0</code> 则会。两者看上去都像“没有提高层级”，但子元素能参与哪一层的比较可能已经改变。</p>
<p>如果上面例子的 <code>.left</code> 没有其他触发条件，把它改成 <code>z-index: auto</code> 后，它不再以独立上下文约束 <code>.tip</code>。提示框便有机会在更外层与右侧比较。这里不能只删掉某个数值就认定一定解决，因为祖先还可能有 transform、opacity 等触发条件。</p>
<p>同时，<code>z-index</code> 并不对所有普通静态块元素都产生预期效果。普通流的静态元素与 Flex/Grid 项的规则不同，应先判断元素所处的布局身份，再决定是否需要定位。</p>
<h3>被盖住和被裁掉，需要不同的处理</h3>
<p>元素伸出祖先的 <code>overflow: hidden</code> 或裁剪区域，可能是内容被裁掉，并不是另一个元素画在上面。提高 <code>z-index</code> 不能普遍突破祖先裁剪边界，应该检查裁剪来源与定位包含块，必要时移动挂载位置。</p>
<p>把 <code>z-index</code> 改成负数也不是可靠的隐藏方式。它改变的是当前上下文里的绘制顺序，元素仍然可能占位、被访问或在其他部分可见；还可能落到其他背景后面，让问题更难定位。</p>
<h3>浮层可以采用哪一种结构</h3>
<p>组件库常通过 Portal 把浮层挂到页面外层，避开业务容器的上下文和裁剪。Portal 本身不是浏览器的新层级：挂载目标仍在普通文档层叠中，还需要设计清楚的层级、定位与焦点管理。</p>
<p>原生模态对话框通过 <code>dialog.showModal()</code> 进入 top layer，显示中的 Popover 等也能进入 top layer。这个顶层显示机制位于普通文档层叠之上，不需要与普通卡片的巨大 <code>z-index</code> 竞争。只写 <code>&lt;dialog open&gt;</code> 或调用非模态 <code>show()</code>，则不能等同于 <code>showModal()</code> 的模态顶层行为。</p>
<p>top layer 也不意味着多个顶层元素可以随意按普通 z-index 排序，更不代表非模态 Popover 自动具有模态对话框的交互语义。需要哪一种浮层，应由内容、焦点、关闭方式与模态需求共同决定。</p>
<p>实际排查可以从被遮挡元素向上找到上下文祖先，再对另一侧做同样检查，找出它们在共同外层中首先分开的两个上下文。比较那一层的顺序，往往比修改最里面那个数字有效得多。</p>`};export{e as default};