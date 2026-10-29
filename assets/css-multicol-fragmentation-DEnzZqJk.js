var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>多栏布局就像报纸排版，内容是连续的一条流，填满第一栏就流进第二栏。Grid 不一样，它是把一个个独立的项目放进行列格子里。</p>
<p>用 <code>column-width: 18rem</code> 设一个理想栏宽，浏览器按容器宽度决定分几栏；<code>column-count</code> 设的是最多几栏。</p>
<p>多栏里最常见的问题是卡片或图片被切成两半，上半截在这一栏底部，下半截在下一栏顶部。加上 <code>break-inside: avoid</code>，它会整个挪到下一栏。章节标题想横跨所有栏，用 <code>column-span: all</code>。</p>
<p>要注意，多栏的阅读顺序是先竖后横。项目需要横着浏览或者行列对齐时，用 Grid。</p>
</blockquote>
<h2>一段文章分栏</h2>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.article</span> {
  <span class="hljs-attribute">column-width</span>: <span class="hljs-number">18rem</span>;
  <span class="hljs-attribute">column-gap</span>: <span class="hljs-number">2rem</span>;
  <span class="hljs-attribute">column-rule</span>: <span class="hljs-number">1px</span> solid <span class="hljs-number">#ddd</span>;
}

<span class="hljs-selector-class">.article</span> <span class="hljs-selector-tag">h2</span> {
  <span class="hljs-attribute">column-span</span>: all;
}

<span class="hljs-selector-class">.article</span> <span class="hljs-selector-tag">figure</span> {
  <span class="hljs-attribute">break-inside</span>: avoid;
}
</code></pre></div>
<p>窄屏上装不下两个 18rem，就只有一栏；屏幕变宽，自动变成两栏、三栏，不用写媒体查询。<code>column-rule</code> 是栏之间的分隔线。</p>
<h2>和 Grid 到底差在哪里</h2>
<p>多栏处理的是一段连续内容，顺序是先往下排满一栏，再到下一栏，各栏的高度会自动平衡。所以它适合长文章、术语表、一长串链接。</p>
<p>Grid 处理的是独立的项目，默认先横着排满一行，再到下一行，行高由轨道决定。所以卡片、页面布局用 Grid。</p>
<h2>要注意什么</h2>
<p>屏幕上看多栏长文，读完第一栏要滚回顶部看第二栏。内容超过一屏高时，读者就得上下来回滚，体验很差。所以可以给容器限定高度，或者只在宽屏上分栏。</p>
<p><code>break-inside: avoid</code> 只是建议，不是保证。元素比一整栏还高时，放到哪一栏都放不下，还是会被切开。</p>
<p>同样的 <code>break-*</code> 属性也用来控制打印分页，见<a href="/questions/css-print/">《网页打印样式应该怎样单独设计？》</a>。</p>
<h2>常见追问</h2>
<p><strong>多栏能拿来做瀑布流吗？</strong></p>
<blockquote>
<p>能做出差不多的样子，但顺序是先竖后横，而且新加项目时，所有栏都会重新分配。详见<a href="/questions/css-masonry/">《CSS Masonry 和传统瀑布流方案应该怎样选择？》</a>。</p>
</blockquote>`};export{e as default};