var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>瀑布流就是像图片网站那样，卡片高度不一，一列列往下排，下一张卡片总是放到当前最短的那一列。它适合高度不一的图片卡片，不适合要横向比较的数据卡片。</p>
<p>原生写法是 <code>display: grid-lanes</code>。定义好 <code>grid-template-columns</code>，每个项目会放进可用空间最多的那一列。早期草案里的 <code>grid-template-rows: masonry</code> 已经被替换掉了。它现在还是实验特性，支持有限，所以要用 <code>@supports (display: grid-lanes)</code> 叠加在普通 Grid 上。</p>
<p>另外两种老办法：多栏布局 <code>columns</code> 能做出类似的样子，但内容先填满第一列再去第二列，阅读顺序是竖的；JavaScript 定位完全可控，但每次都要测量高度。</p>
<p>不管用哪种，键盘焦点和读屏软件都是按 DOM 顺序走的，视觉上左右挨着的两张卡片，在顺序上不一定挨着。</p>
</blockquote>
<h2>原生写法和回退</h2>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.gallery</span> {
  <span class="hljs-attribute">display</span>: grid;
  <span class="hljs-attribute">grid-template-columns</span>: <span class="hljs-built_in">repeat</span>(auto-fill, <span class="hljs-built_in">minmax</span>(<span class="hljs-number">14rem</span>, <span class="hljs-number">1</span>fr));
  <span class="hljs-attribute">gap</span>: <span class="hljs-number">1rem</span>;
}

<span class="hljs-keyword">@supports</span> (<span class="hljs-attribute">display</span>: grid-lanes) {
  <span class="hljs-selector-class">.gallery</span> {
    <span class="hljs-attribute">display</span>: grid-lanes;
  }
}
</code></pre></div>
<p>不支持的浏览器显示成普通网格。同一行的卡片顶端对齐，矮的卡片下面会留空，但内容完整，能正常使用。</p>
<p>支持的浏览器里，列方向上的 <code>span</code> 和明确指定位置照样有效。比如 <code>grid-column: span 2</code> 能让某张卡片占两列。</p>
<h2>三种方案怎么选</h2>
<p><code>grid-lanes</code> 不用 JavaScript，项目大体按 DOM 顺序从左往右放进最短的列，顺序最自然，缺点是还处在实验阶段。</p>
<p>多栏布局 <code>columns</code> 所有浏览器都支持，也不用 JavaScript。可是它先把第一列填满再到下一列，第 2 张卡片在第 1 张下面，而不是右边。新加一批项目时，所有列都会整体重新分配，用户看到的卡片会换位置。</p>
<p>JavaScript 定位，比如 Masonry.js，或者自己算出最短列再用绝对定位放过去，顺序完全可控，所有浏览器都支持。代价是图片加载完、窗口变化时都要重新测量。每次重排都要先读元素高度、再写位置，读写交替会触发强制同步布局，数据多时还要配合虚拟列表。</p>
<h2>图片加载后卡片为什么会跳</h2>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">img</span> <span class="hljs-attr">src</span>=<span class="hljs-string">&quot;/cover.webp&quot;</span> <span class="hljs-attr">width</span>=<span class="hljs-string">&quot;640&quot;</span> <span class="hljs-attr">height</span>=<span class="hljs-string">&quot;480&quot;</span> <span class="hljs-attr">alt</span>=<span class="hljs-string">&quot;课程封面&quot;</span> <span class="hljs-attr">loading</span>=<span class="hljs-string">&quot;lazy&quot;</span>&gt;</span>
</code></pre></div>
<p>图片没下载完时，浏览器不知道它多高，卡片先按很矮的高度排。图片到了以后卡片突然变高，后面的卡片全部跟着挪位置。</p>
<p>给图片写上 <code>width</code> 和 <code>height</code>，或者设置 <code>aspect-ratio</code>，浏览器在图片到达前就能算出卡片的高度，布局就不会跳。</p>
<h2>可访问性要注意什么</h2>
<p>卡片里要用真正的链接和按钮，不要用只能鼠标点的 <code>div</code>。</p>
<p>无限加载插入新卡片时，不要把焦点或者滚动位置拉回顶部。</p>
<p>如果视觉顺序和 DOM 顺序差得太远，键盘用户会觉得焦点在乱跳。这时可以考虑按列的顺序生成 DOM，或者干脆换成普通网格。</p>
<h2>常见追问</h2>
<p><strong>为什么不直接用 Grid 加 <code>grid-row: span N</code> 来做？</strong></p>
<blockquote>
<p>可以按每张卡片的高度估算它跨几行，近似做出瀑布流。但这需要 JavaScript 先读出每张卡片的高度，本质上还是测量方案。</p>
</blockquote>`};export{e as default};