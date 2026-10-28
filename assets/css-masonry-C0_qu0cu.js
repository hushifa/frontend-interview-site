var e={answerHtml:`<h2>简答</h2>
<ul>
<li>瀑布流适合高度不一的图片卡片，不适合需要横向比较的数据卡片。</li>
<li>原生方案是 <code>display: grid-lanes</code>：定义 <code>grid-template-columns</code> 后，每个项目放进可用空间最多的那一列。早期草案的 <code>grid-template-rows: masonry</code> 已被替换。</li>
<li><code>grid-lanes</code> 目前是实验特性，属于有限可用，用 <code>@supports (display: grid-lanes)</code> 叠加在普通 Grid 之上。</li>
<li>多栏布局（<code>columns</code>）能做出类似效果，但项目先填满第一列再到下一列，阅读顺序是竖向的。</li>
<li>无论哪种方案，键盘焦点和读屏都按 DOM 顺序，视觉上的“左右相邻”不代表顺序相邻。</li>
</ul>
<h2>原生方案</h2>
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
<p>不支持的浏览器显示为普通网格，同一行的卡片顶端对齐，下方留空，内容完整可用。网格轴上的 <code>span</code> 和显式放置照常有效，例如 <code>grid-column: span 2</code> 让某张卡片占两列。</p>
<h2>三种方案对比</h2>
<table><thead><tr><th>方案</th><th>顺序</th><th>兼容性</th><th>成本</th></tr></thead><tbody><tr><td><code>grid-lanes</code></td><td>大体按 DOM 顺序从左到右放入最短列</td><td>实验特性</td><td>无 JavaScript</td></tr><tr><td><code>columns</code></td><td>先填满第一列，再到下一列</td><td>全部支持</td><td>无 JavaScript，新增项目会让各列整体重排</td></tr><tr><td>JavaScript 定位</td><td>完全可控</td><td>全部支持</td><td>要在图片加载、窗口变化时重新测量</td></tr></tbody></table>
<p>JavaScript 方案（例如 Masonry.js 或自己计算最短列再绝对定位）每次重排都要先读取元素高度再写位置。读写交替会触发强制同步布局，数据多时要配合虚拟列表。</p>
<h2>布局稳定性</h2>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">img</span> <span class="hljs-attr">src</span>=<span class="hljs-string">&quot;/cover.webp&quot;</span> <span class="hljs-attr">width</span>=<span class="hljs-string">&quot;640&quot;</span> <span class="hljs-attr">height</span>=<span class="hljs-string">&quot;480&quot;</span> <span class="hljs-attr">alt</span>=<span class="hljs-string">&quot;课程封面&quot;</span> <span class="hljs-attr">loading</span>=<span class="hljs-string">&quot;lazy&quot;</span>&gt;</span>
</code></pre></div>
<p>给图片写宽高或 <code>aspect-ratio</code>，浏览器在图片到达前就能算出卡片高度，不会因为图片加载而让后面的卡片跳位置。</p>
<h2>可访问性</h2>
<ul>
<li>卡片用真实的链接和按钮，不要用只能鼠标点击的 <code>div</code>。</li>
<li>无限加载插入新卡片时，不要把焦点或滚动位置拉回顶部。</li>
<li>如果视觉顺序和 DOM 顺序差异很大，可以考虑按列顺序生成 DOM，或者换成普通网格。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li>为什么不直接用 Grid 加 <code>grid-row: span N</code>？可以按高度估算行跨度来近似瀑布流，但需要 JavaScript 读取每张卡片高度，本质上还是测量方案。</li>
</ul>`};export{e as default};