var e={answerHtml:`<h2>简答</h2>
<ul>
<li>BFC 是块级格式化上下文，决定块盒和浮动在哪组布局规则里相互影响，不是额外的 DOM 节点。</li>
<li>建立 BFC 的容器会把内部浮动计入高度，<code>display: flow-root</code> 是最直接的写法，不像 <code>overflow: hidden</code> 会顺带裁切。</li>
<li>新的 BFC 根盒不与外部浮动重叠，也不与自己的普通流子级折叠外边距。</li>
<li>同一个 BFC 内相邻子块的外边距仍可能折叠，需要稳定间距时用 Flex/Grid 的 gap 更直接。</li>
</ul>
<p>BFC 是 Block Formatting Context，中文通常叫块级格式化上下文。它描述的是块盒和浮动在哪一组布局规则中相互影响，不是一个额外的 DOM 节点，也不是“GPU 图层”。</p>
<p>理解它最直接的方法，是看浮动和外边距这两类问题。<strong>建立新的 BFC，相当于为相关块布局划出边界；但边界内部仍然有自己的正常布局规则。</strong></p>
<h2>浮动为什么会让父容器看起来没有高度</h2>
<p>浮动不按普通流块盒的方式为父级贡献高度。父级只有一个浮动孩子时，若没有其他高度约束和正常流内容，父级背景、边框就可能没有把孩子完整包住。</p>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">div</span> <span class="hljs-attr">class</span>=<span class="hljs-string">&quot;card&quot;</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">div</span> <span class="hljs-attr">class</span>=<span class="hljs-string">&quot;avatar&quot;</span>&gt;</span>头像<span class="hljs-tag">&lt;/<span class="hljs-name">div</span>&gt;</span>
<span class="hljs-tag">&lt;/<span class="hljs-name">div</span>&gt;</span>
<span class="hljs-tag">&lt;<span class="hljs-name">p</span>&gt;</span>卡片之后的正文。<span class="hljs-tag">&lt;/<span class="hljs-name">p</span>&gt;</span>
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.card</span> {
  <span class="hljs-attribute">display</span>: flow-root;
  <span class="hljs-attribute">border</span>: <span class="hljs-number">1px</span> solid <span class="hljs-number">#64748b</span>;
}

<span class="hljs-selector-class">.avatar</span> {
  <span class="hljs-attribute">float</span>: left;
  <span class="hljs-attribute">width</span>: <span class="hljs-number">80px</span>;
  <span class="hljs-attribute">height</span>: <span class="hljs-number">80px</span>;
  <span class="hljs-attribute">margin-right</span>: <span class="hljs-number">1rem</span>;
  <span class="hljs-attribute">background</span>: <span class="hljs-number">#dbeafe</span>;
}
</code></pre></div>
<p>有 flow-root 时，card 建立 BFC，其自动高度计算会包含里面的浮动盒，边框就可以包住 80px 高的头像。在这个没有其他约束的例子中，卡片 border box 高度为 82px。</p>
<p>去掉 flow-root 后，父级内部没有普通流内容，自动内容高度可能变成 0，仅剩上下边框；头像继续浮动，并可能影响后面正文的环绕。这不是头像突然从 DOM 中消失，而是它与父级、后续内容的布局关系不同。</p>
<h2>为什么 flow-root 比 overflow:hidden 更明确</h2>
<p>块元素设置某些非 visible、非 clip 的 overflow 值，也能建立 BFC。过去常用 <code>overflow: hidden</code> 包含浮动，但这个属性同时要求裁切溢出内容，可能把阴影、弹出说明或其他内容截掉。</p>
<p><code>display: flow-root</code> 直接表达“建立新的块级格式化上下文”，不必顺带请求裁切或滚动条。如果你的真实目的就是滚动区域，使用 overflow:auto 合理；如果只是想包含浮动，flow-root 更清楚。</p>
<p><code>overflow: clip</code> 与 hidden 也不能直接等同。clip 单独使用时不建立同样的滚动容器，也不因为这个值本身建立 BFC；如果需要裁切又需要 BFC，可以根据布局组合 flow-root 等机制。</p>
<p>浮动、绝对定位、inline-block、表格单元格等也可能创建 BFC，但它们各自会改变其他布局行为。不能为了“触发 BFC”就随便把容器改成 absolute，让它意外脱离正常流。</p>
<h2>新的 BFC 怎样与外部浮动相处</h2>
<p>假设头像 float:left，旁边的普通正文盒子仍在正常块布局中，它的文字行可以围着浮动缩短，但正文盒子的背景可能延伸到浮动背后。</p>
<p>把正文容器改成 flow-root 后，它作为一个新的 BFC 根盒，会避免与同一外层格式化上下文中的相关浮动重叠。空间够时可以排在浮动旁边，空间不足时可能整体移到下方。这与“让每一行文字都环绕浮动”是不同效果。</p>
<p>BFC 不是阻挡全页面任何元素的隔离罩。这里讨论的是浮动参与的块布局规则，不是 z-index、绝对定位浮层或视觉变换的遮挡关系。</p>
<h2>外边距折叠究竟隔开了哪一层</h2>
<p>普通块流中，满足条件的相邻垂直外边距可能折叠。例如相邻两个正外边距 24px 和 40px，间距通常是较大的 40px，而不是相加为 64px。父级与首个或最后一个普通流子级，也可能发生满足条件的外边距折叠。</p>
<p>建立 BFC 的容器不会与其普通流孩子按原来的父子方式折叠外边距，因此 flow-root 可以避免子级的顶部 margin 看起来“跑到父级外面”。</p>
<p>但是，<strong>同一个 BFC 内相邻普通块孩子的外边距仍可能折叠</strong>。只给父级设置 flow-root，不会让所有子项的 margin 都变成相加。BFC 根元素自身与外部相邻块的外边距，也应继续根据它所处的外层布局判断。</p>
<p>如果希望一组项目始终保持明确间距，Flex/Grid 配合 gap 往往更直接。不要为了阻止相邻孩子折叠，就误以为一个 flow-root 能覆盖所有情况。</p>
<h2>clear、Flex、Grid 分别在解决什么</h2>
<p><code>clear</code> 约束某个盒子不能挨着哪些前面的浮动，需要时把它放到浮动下方。传统 clearfix 通常通过带 clear 的后置盒子参与父级高度计算。flow-root 则让容器通过新的 BFC 包含内部浮动，表达方式不同。</p>
<p>Flex 和 Grid 建立的是各自的格式化上下文，不应该仅为了背诵触发条件就统一称为 BFC。它们也有边界隔离和不折叠等相关效果，但内部项目按 Flex/Grid 规则排布，浮动也不再用来安排直接子项。</p>
<p>现代组件的行列排列、对齐与剩余空间分配，优先按需求选择 Flex 或 Grid。BFC 仍然值得理解，因为旧式图文环绕、普通文档流、外边距和一些包含边界问题都离不开它；它解决的是明确的布局关系，不是一个需要到处添加的性能优化标记。</p>`};export{e as default};