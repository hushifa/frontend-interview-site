var e={answerHtml:`<h2>简答</h2>
<ul>
<li>多栏布局里内容是一条流：填满第一栏后进入第二栏，就像报纸排版。</li>
<li><code>column-width: 18rem</code> 设定理想栏宽，浏览器按容器宽度决定栏数；<code>column-count</code> 设定最大栏数。</li>
<li>卡片或图片放进多栏时可能被切成两半，加 <code>break-inside: avoid</code> 让它整体移到下一栏。</li>
<li><code>column-span: all</code> 让元素横跨所有栏，常用于章节标题。</li>
<li>多栏的阅读顺序是竖向的，项目需要横向浏览或对齐时用 Grid。</li>
</ul>
<h2>示例</h2>
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
<p>窄屏下只有一栏，宽屏自动变成两到三栏，不需要媒体查询。</p>
<h2>和 Grid 对比</h2>
<table><thead><tr><th></th><th>多栏</th><th>Grid</th></tr></thead><tbody><tr><td>内容模型</td><td>一段连续内容</td><td>独立项目</td></tr><tr><td>顺序</td><td>先竖后横</td><td>先横后竖（默认）</td></tr><tr><td>栏高</td><td>自动平衡</td><td>由轨道决定</td></tr><tr><td>适合</td><td>长文、术语表、链接列表</td><td>卡片、页面布局</td></tr></tbody></table>
<h2>注意事项</h2>
<ul>
<li>屏幕上的多栏长文需要读者上下来回滚动，内容超过一屏高时体验会变差，可以给容器限定高度或只在宽屏使用。</li>
<li><code>break-inside: avoid</code> 是建议，元素比一栏还高时仍会被切开。</li>
<li>同样的 <code>break-*</code> 属性也用于打印分页，见《网页打印样式应该怎样单独设计？》。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li>多栏能做瀑布流吗？可以得到类似外观，但顺序是先竖后横，新增项目会让所有栏重新分配，见《CSS Masonry 和传统瀑布流方案应该怎样选择？》。</li>
</ul>`};export{e as default};