var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>一排卡片，每张都有标题、正文、按钮。有的标题一行，有的两行，结果各张卡片的按钮高低不齐。原因是每张卡片自己是一个网格，自己算自己的行高，互相不知道。</p>
<p><code>subgrid</code> 让子网格不自己定义行列，直接借用父网格的。条件是子网格本身是父网格的一个项目，并且跨了若干行或列，借用的就是它跨的那几条。</p>
<p>行和列可以分开设置。只写 <code>grid-template-rows: subgrid</code> 时，列还可以自己定义。子网格默认继承父网格的 <code>gap</code>，也可以自己改。</p>
<p>典型用途就是卡片列表对齐和表单的标签对齐。subgrid 主流浏览器都已经支持了。</p>
</blockquote>
<h2>让卡片里的内容对齐</h2>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.cards</span> {
  <span class="hljs-attribute">display</span>: grid;
  <span class="hljs-attribute">grid-template-columns</span>: <span class="hljs-built_in">repeat</span>(auto-fill, <span class="hljs-built_in">minmax</span>(<span class="hljs-number">220px</span>, <span class="hljs-number">1</span>fr));
  <span class="hljs-attribute">gap</span>: <span class="hljs-number">16px</span>;
}

<span class="hljs-selector-class">.card</span> {
  <span class="hljs-attribute">display</span>: grid;
  <span class="hljs-attribute">grid-row</span>: span <span class="hljs-number">3</span>;
  <span class="hljs-attribute">grid-template-rows</span>: subgrid;
}
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">div</span> <span class="hljs-attr">class</span>=<span class="hljs-string">&quot;cards&quot;</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">article</span> <span class="hljs-attr">class</span>=<span class="hljs-string">&quot;card&quot;</span>&gt;</span>
    <span class="hljs-tag">&lt;<span class="hljs-name">h3</span>&gt;</span>标题<span class="hljs-tag">&lt;/<span class="hljs-name">h3</span>&gt;</span>
    <span class="hljs-tag">&lt;<span class="hljs-name">p</span>&gt;</span>正文长短不一<span class="hljs-tag">&lt;/<span class="hljs-name">p</span>&gt;</span>
    <span class="hljs-tag">&lt;<span class="hljs-name">a</span> <span class="hljs-attr">href</span>=<span class="hljs-string">&quot;/a&quot;</span>&gt;</span>查看<span class="hljs-tag">&lt;/<span class="hljs-name">a</span>&gt;</span>
  <span class="hljs-tag">&lt;/<span class="hljs-name">article</span>&gt;</span>
<span class="hljs-tag">&lt;/<span class="hljs-name">div</span>&gt;</span>
</code></pre></div>
<p>每张卡片在父网格里跨 3 行，<code>subgrid</code> 让它直接用这 3 行，标题、正文、链接分别放进去。</p>
<p>现在这 3 行是父网格的行，同一排所有卡片共用。某张卡片的标题换成两行，这一行变高，同一排所有卡片的标题区一起变高，下面的按钮还是对齐的。</p>
<p>不用 subgrid 时，常见的办法是给标题固定高度，或者用 flex 把按钮推到底部。后一种只能让最后一项对齐，标题和正文的分界线还是参差不齐。</p>
<h2>表单标签对齐</h2>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.form</span> {
  <span class="hljs-attribute">display</span>: grid;
  <span class="hljs-attribute">grid-template-columns</span>: max-content <span class="hljs-number">1</span>fr;
}

<span class="hljs-selector-class">.field</span> {
  <span class="hljs-attribute">display</span>: grid;
  <span class="hljs-attribute">grid-column</span>: span <span class="hljs-number">2</span>;
  <span class="hljs-attribute">grid-template-columns</span>: subgrid;
}
</code></pre></div>
<p>每个 <code>.field</code> 里包着一个 label 和一个 input，HTML 结构保持完整。因为用的是父网格的两列，所有 label 这一列的宽度，由最长的那个 label 决定，输入框就能左边对齐。</p>
<h2>常见追问</h2>
<p><strong>subgrid 和 <code>display: contents</code> 有什么区别？</strong></p>
<blockquote>
<p><code>display: contents</code> 是让元素自己的盒子消失，子元素直接变成父网格的项目。代价是元素自己的背景、边框没了，有的浏览器里语义也会丢。subgrid 保留了元素的盒子，背景、边框、语义都在。</p>
</blockquote>`};export{e as default};