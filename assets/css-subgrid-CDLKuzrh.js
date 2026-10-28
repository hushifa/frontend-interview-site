var e={answerHtml:`<h2>简答</h2>
<ul>
<li>子网格必须本身是父网格的项目，并跨越若干轨道，<code>subgrid</code> 使用的就是这几条轨道。</li>
<li>行和列可以分别设置：只写 <code>grid-template-rows: subgrid</code> 时，列仍可自己定义。</li>
<li>典型用途是卡片列表：每张卡片的标题、正文、按钮分别对齐成一行，而不受其他卡片内容长短影响。</li>
<li>子网格继承父网格的 <code>gap</code>，也可以自己覆盖。</li>
<li>subgrid 已被主流浏览器支持。</li>
</ul>
<h2>卡片对齐</h2>
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
<p>每张卡片占父网格的 3 行，标题、正文、链接分别落在这 3 行里。某张卡片的标题换成两行时，同一行所有卡片的标题区一起变高，按钮依然对齐在底部。</p>
<p>不用 subgrid 时，常见做法是给标题固定高度或用 flex 把按钮推到底部，只能对齐最后一项。</p>
<h2>表单对齐</h2>
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
<p>每个 <code>.field</code> 包着 label 和 input，保留语义结构，而所有 label 列宽由最长的那个决定。</p>
<h2>常见追问</h2>
<ul>
<li>和 <code>display: contents</code> 有什么区别？<code>contents</code> 让元素的盒子消失，子元素直接参与父网格，但元素自身的背景、边框和部分浏览器中的语义会丢失。subgrid 保留了元素的盒子。</li>
</ul>`};export{e as default};