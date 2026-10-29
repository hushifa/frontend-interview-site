var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>做一个弹窗或者空状态提示，要把一块内容放在容器正中间，现在首选 Flex 或 Grid。Flex 写法是父元素 <code>display: flex</code>，再加 <code>justify-content: center</code> 管水平、<code>align-items: center</code> 管垂直；Grid 更短，父元素 <code>display: grid; place-items: center</code> 一行就够。两种都不需要知道子元素的宽高。</p>
<p>如果元素是绝对定位的，比如盖在页面上的弹窗，有两种写法。一种是 <code>position: absolute; inset: 0; margin: auto</code>，但元素必须有确定的宽高。另一种是 <code>top: 50%; left: 50%; transform: translate(-50%, -50%)</code>，先把左上角移到中心，再往回移自身宽高的一半，宽高不确定也能用。</p>
<p>只是让一行文字或行内元素水平居中，在父元素上写 <code>text-align: center</code> 就行；固定宽度的块元素水平居中，用 <code>margin: 0 auto</code>。</p>
<p>要注意，垂直居中需要父元素有高度。父元素高度由内容撑开时，内容本身就占满了，看不出居中效果，这时要给父元素设高度或 <code>min-height</code>。</p>
</blockquote>
<h2>Flex 和 Grid 的写法</h2>
<p>下面两段代码效果相同，都能让 <code>.child</code> 在 <code>.parent</code> 里居中：</p>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.parent</span> {
  <span class="hljs-attribute">display</span>: flex;
  <span class="hljs-attribute">justify-content</span>: center;
  <span class="hljs-attribute">align-items</span>: center;
  <span class="hljs-attribute">min-height</span>: <span class="hljs-number">300px</span>;
}

<span class="hljs-selector-class">.parent-grid</span> {
  <span class="hljs-attribute">display</span>: grid;
  <span class="hljs-attribute">place-items</span>: center;
  <span class="hljs-attribute">min-height</span>: <span class="hljs-number">300px</span>;
}
</code></pre></div>
<p>Flex 里为什么 <code>justify-content</code> 管水平、<code>align-items</code> 管垂直？因为 Flex 默认的主轴是水平方向，<code>justify-content</code> 控制主轴，<code>align-items</code> 控制交叉轴。如果改成了 <code>flex-direction: column</code>，主轴变成垂直方向，两者管的方向就对调了。</p>
<p>Grid 的 <code>place-items</code> 是 <code>align-items</code> 和 <code>justify-items</code> 的简写，只写一个 <code>center</code> 就同时设置了两个方向。Grid 不受主轴方向影响，所以写起来更省心。</p>
<p>还有一种 Flex 写法：父元素只写 <code>display: flex</code>，子元素写 <code>margin: auto</code>。在 Flex 容器里，<code>auto</code> 外边距会吃掉所有剩余空间，四个方向都是 <code>auto</code>，元素就被挤到了正中间。</p>
<h2>绝对定位元素怎么居中</h2>
<p>弹窗、加载遮罩这类元素经常是绝对定位或固定定位的，它们脱离了文档流，父元素的 Flex 对它们不起作用。</p>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.modal-known-size</span> {
  <span class="hljs-attribute">position</span>: fixed;
  <span class="hljs-attribute">inset</span>: <span class="hljs-number">0</span>;
  <span class="hljs-attribute">width</span>: <span class="hljs-number">400px</span>;
  <span class="hljs-attribute">height</span>: <span class="hljs-number">240px</span>;
  <span class="hljs-attribute">margin</span>: auto;
}

<span class="hljs-selector-class">.modal-any-size</span> {
  <span class="hljs-attribute">position</span>: fixed;
  <span class="hljs-attribute">top</span>: <span class="hljs-number">50%</span>;
  <span class="hljs-attribute">left</span>: <span class="hljs-number">50%</span>;
  <span class="hljs-attribute">transform</span>: <span class="hljs-built_in">translate</span>(-<span class="hljs-number">50%</span>, -<span class="hljs-number">50%</span>);
}
</code></pre></div>
<p>第一种为什么必须写宽高？<code>inset: 0</code> 让元素的四条边都贴着容器，这时如果没有宽高，元素会被拉伸到和容器一样大，谈不上居中。有了固定宽高，剩下的空间由 <code>margin: auto</code> 平均分到两边，元素就居中了。</p>
<p>第二种为什么要 <code>transform</code>？<code>top: 50%; left: 50%</code> 是把元素的左上角放到容器中心，元素整体偏右下。<code>translate(-50%, -50%)</code> 里的百分比是相对元素自己的宽高算的，往左上移一半，中心就对上了。这样不需要知道元素多大。</p>
<p>要注意，<code>transform</code> 的结果有时会落在半像素上，文字在某些屏幕上可能有点发虚。能用 Flex 或 Grid 的时候，优先用它们。</p>
<h2>常见追问</h2>
<p><strong>行内元素或者一行文字怎么垂直居中？</strong></p>
<blockquote>
<p>单行文字可以让 <code>line-height</code> 等于容器高度，文字就会垂直居中，但只适合确定只有一行的情况，换行后行高会撑大。多行文字或者图标加文字，用 Flex 的 <code>align-items: center</code> 更可靠。</p>
</blockquote>
<p><strong>为什么 vertical-align: middle 在 div 上不起作用？</strong></p>
<blockquote>
<p><code>vertical-align</code> 只对行内元素、行内块元素和表格单元格生效，它对齐的是元素在一行里的位置，不是在父容器里的位置。普通的块级 <code>div</code> 写了也没有效果。</p>
</blockquote>
<p><strong>Flex 和 Grid 居中有什么区别？</strong></p>
<blockquote>
<p>只居中一个元素时效果一样。区别在有多个子元素时：Flex 会把它们沿主轴排成一行再整体居中，Grid 默认把它们排成多行，每个都在自己的格子里居中。两者怎么选见<a href="/questions/css-flex-grid/">《Flexbox 和 Grid 应该如何选择？》</a>。</p>
</blockquote>`};export{e as default};