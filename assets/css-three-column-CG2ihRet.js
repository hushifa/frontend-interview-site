var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>后台页面常见这样的结构：左边是 200px 的菜单，右边是 150px 的辅助栏，中间放主要内容，宽度随窗口变化。这就是三栏布局。面试里通常还会加一个要求：中间栏在 HTML 里写在最前面，让主要内容最先加载和渲染。</p>
<p>现在最简单的写法是 Flex：父元素 <code>display: flex</code>，左右栏设固定宽度并加上 <code>flex-shrink: 0</code> 防止被压缩，中间栏写 <code>flex: 1</code> 占满剩余空间。中间栏写在 HTML 最前面也没关系，给左栏设 <code>order: -1</code> 就能把它显示在前面。Grid 更直接，<code>grid-template-columns: 200px 1fr 150px</code>，再用 <code>grid-area</code> 或 <code>order</code> 摆放位置。</p>
<p>圣杯布局和双飞翼布局是 Flex 还不能用时的方案，三栏都用浮动。它们的共同点是：中间栏写在最前面并设宽度 100%，左右栏用负的 <code>margin-left</code> 把自己拉回到中间栏所在的那一行。区别在于怎样不让中间内容被左右栏盖住：圣杯布局给父元素加左右 <code>padding</code>，再用相对定位把左右栏挪进 padding 里；双飞翼布局在中间栏里再套一层，给这层加左右 <code>margin</code>。</p>
<p>要注意，新项目直接用 Flex 或 Grid。面试问圣杯和双飞翼，主要是考负 margin 和浮动的理解，能讲清楚原理就够了。</p>
</blockquote>
<h2>Flex 和 Grid 的写法</h2>
<p>HTML 里中间栏写在最前面：</p>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">div</span> <span class="hljs-attr">class</span>=<span class="hljs-string">&quot;layout&quot;</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">main</span> <span class="hljs-attr">class</span>=<span class="hljs-string">&quot;center&quot;</span>&gt;</span>主要内容<span class="hljs-tag">&lt;/<span class="hljs-name">main</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">aside</span> <span class="hljs-attr">class</span>=<span class="hljs-string">&quot;left&quot;</span>&gt;</span>左栏<span class="hljs-tag">&lt;/<span class="hljs-name">aside</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">aside</span> <span class="hljs-attr">class</span>=<span class="hljs-string">&quot;right&quot;</span>&gt;</span>右栏<span class="hljs-tag">&lt;/<span class="hljs-name">aside</span>&gt;</span>
<span class="hljs-tag">&lt;/<span class="hljs-name">div</span>&gt;</span>
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.layout</span> {
  <span class="hljs-attribute">display</span>: flex;
}
<span class="hljs-selector-class">.center</span> {
  <span class="hljs-attribute">flex</span>: <span class="hljs-number">1</span>;
  <span class="hljs-attribute">min-width</span>: <span class="hljs-number">0</span>;
}
<span class="hljs-selector-class">.left</span> {
  <span class="hljs-attribute">order</span>: -<span class="hljs-number">1</span>;
  <span class="hljs-attribute">flex</span>: <span class="hljs-number">0</span> <span class="hljs-number">0</span> <span class="hljs-number">200px</span>;
}
<span class="hljs-selector-class">.right</span> {
  <span class="hljs-attribute">flex</span>: <span class="hljs-number">0</span> <span class="hljs-number">0</span> <span class="hljs-number">150px</span>;
}

<span class="hljs-comment">/* Grid 写法 */</span>
<span class="hljs-selector-class">.layout-grid</span> {
  <span class="hljs-attribute">display</span>: grid;
  <span class="hljs-attribute">grid-template-columns</span>: <span class="hljs-number">200px</span> <span class="hljs-number">1</span>fr <span class="hljs-number">150px</span>;
}
<span class="hljs-selector-class">.layout-grid</span> <span class="hljs-selector-class">.left</span> { <span class="hljs-attribute">grid-column</span>: <span class="hljs-number">1</span>; <span class="hljs-attribute">grid-row</span>: <span class="hljs-number">1</span>; }
<span class="hljs-selector-class">.layout-grid</span> <span class="hljs-selector-class">.center</span> { <span class="hljs-attribute">grid-column</span>: <span class="hljs-number">2</span>; <span class="hljs-attribute">grid-row</span>: <span class="hljs-number">1</span>; }
<span class="hljs-selector-class">.layout-grid</span> <span class="hljs-selector-class">.right</span> { <span class="hljs-attribute">grid-column</span>: <span class="hljs-number">3</span>; }
</code></pre></div>
<p>中间栏为什么要加 <code>min-width: 0</code>？Flex 子项默认的最小宽度是内容的宽度，中间如果有很长的不换行文字或宽表格，它会撑开中间栏，把右栏挤出去。设成 0 以后，中间栏才能真正缩小，里面的内容自己滚动或换行。</p>
<p><code>order: -1</code> 只改变显示顺序，不改变 HTML 顺序，读屏器和 Tab 键还是按 HTML 顺序走。这里中间内容在前，正好是希望的阅读顺序。</p>
<h2>圣杯布局怎样用负 margin</h2>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.holy-grail</span> {
  <span class="hljs-attribute">padding</span>: <span class="hljs-number">0</span> <span class="hljs-number">150px</span> <span class="hljs-number">0</span> <span class="hljs-number">200px</span>;
}
<span class="hljs-selector-class">.holy-grail</span> &gt; * {
  <span class="hljs-attribute">float</span>: left;
  <span class="hljs-attribute">position</span>: relative;
}
<span class="hljs-selector-class">.holy-grail</span> <span class="hljs-selector-class">.center</span> { <span class="hljs-attribute">width</span>: <span class="hljs-number">100%</span>; }
<span class="hljs-selector-class">.holy-grail</span> <span class="hljs-selector-class">.left</span> {
  <span class="hljs-attribute">width</span>: <span class="hljs-number">200px</span>;
  <span class="hljs-attribute">margin-left</span>: -<span class="hljs-number">100%</span>;
  <span class="hljs-attribute">left</span>: -<span class="hljs-number">200px</span>;
}
<span class="hljs-selector-class">.holy-grail</span> <span class="hljs-selector-class">.right</span> {
  <span class="hljs-attribute">width</span>: <span class="hljs-number">150px</span>;
  <span class="hljs-attribute">margin-right</span>: -<span class="hljs-number">150px</span>;
}
</code></pre></div>
<p>三栏都浮动后，中间栏宽度 100%，占满一整行，左右栏被挤到了第二行。左栏的 <code>margin-left: -100%</code>，这里的百分比相对父元素内容区宽度，相当于往左挪了一整行的宽度，回到第一行的最左边，和中间栏的开头重叠。再用 <code>left: -200px</code> 把它移到父元素左侧的 padding 里。右栏的 <code>margin-right: -150px</code> 让它不再占据宽度，于是浮到中间栏右边，正好落在右侧 padding 里。</p>
<p>双飞翼把父元素的 <code>padding</code> 去掉，改成在中间栏里套一个 <code>&lt;div class=&quot;inner&quot;&gt;</code>，给它 <code>margin: 0 150px 0 200px</code>。左栏 <code>margin-left: -100%</code>，右栏 <code>margin-left: -150px</code>，不需要相对定位。它比圣杯少一步定位，但多一层 DOM。</p>
<h2>常见追问</h2>
<p><strong>为什么要让中间栏写在 HTML 最前面？</strong></p>
<blockquote>
<p>浏览器按 HTML 顺序解析和渲染，主要内容在前，网络慢时用户能最先看到它。现在页面普遍很快，这个理由没有以前那么重要，但对读屏器和搜索引擎来说，主要内容在前仍然是好的结构。</p>
</blockquote>
<p><strong>两栏布局，左边固定、右边自适应有几种写法？</strong></p>
<blockquote>
<p>Flex 写法是右边 <code>flex: 1</code>；Grid 写法是 <code>grid-template-columns: 200px 1fr</code>；老写法是左边浮动，右边 <code>margin-left: 200px</code>，或者右边触发 BFC，比如 <code>overflow: hidden</code>，它就不会和浮动元素重叠，见<a href="/questions/css-bfc/">《BFC 解决哪些布局问题，什么时候用 flow-root？》</a>。</p>
</blockquote>`};export{e as default};