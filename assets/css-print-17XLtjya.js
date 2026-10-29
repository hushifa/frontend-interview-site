var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>网页打印出来，导航、按钮、广告在纸上都没用。所以用 <code>@media print</code> 写一套打印专用的样式，先把这些东西藏掉。</p>
<p>有固定高度和滚动条的区域要特别处理，改成 <code>height: auto; overflow: visible</code>。不然纸上只会印出能看到的那一截，滚动条下面的内容全丢了。</p>
<p>页面版式用 <code>@page</code> 设置，比如 <code>@page { margin: 2cm; }</code> 设页边距，<code>size</code> 设纸张方向，不过用户的打印设置可能会覆盖这些值。分页用 <code>break-*</code> 控制，<code>break-inside: avoid</code> 防止表格行、图片被切到两页，<code>break-before: page</code> 强制换页。</p>
<p>要注意，浏览器默认不打印背景色。重要信息不能只靠背景色来表达，确实要打印背景时用 <code>print-color-adjust: exact</code>。</p>
</blockquote>
<h2>一套基本的打印样式</h2>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-keyword">@media</span> print {
  <span class="hljs-selector-tag">nav</span>,
  <span class="hljs-selector-class">.toolbar</span>,
  <span class="hljs-selector-class">.ad</span> {
    <span class="hljs-attribute">display</span>: none;
  }

  <span class="hljs-selector-tag">body</span> {
    <span class="hljs-attribute">font-size</span>: <span class="hljs-number">11pt</span>;
    <span class="hljs-attribute">color</span>: black;
  }

  <span class="hljs-selector-class">.scroll-area</span> {
    <span class="hljs-attribute">height</span>: auto;
    <span class="hljs-attribute">overflow</span>: visible;
  }

  <span class="hljs-selector-tag">a</span><span class="hljs-selector-attr">[href^=<span class="hljs-string">&#x27;http&#x27;</span>]</span><span class="hljs-selector-pseudo">::after</span> {
    <span class="hljs-attribute">content</span>: <span class="hljs-string">&#x27; (&#x27;</span> <span class="hljs-built_in">attr</span>(href) <span class="hljs-string">&#x27;)&#x27;</span>;
  }

  <span class="hljs-selector-tag">h2</span> {
    <span class="hljs-attribute">break-after</span>: avoid;
  }

  <span class="hljs-selector-tag">tr</span>,
  <span class="hljs-selector-tag">img</span> {
    <span class="hljs-attribute">break-inside</span>: avoid;
  }

  <span class="hljs-selector-tag">thead</span> {
    <span class="hljs-attribute">display</span>: table-header-group;
  }
}

<span class="hljs-keyword">@page</span> {
  <span class="hljs-attribute">margin</span>: <span class="hljs-number">2cm</span>;
}
</code></pre></div>
<p>链接那条规则是在链接后面把网址打出来。纸上没法点链接，印出网址读者才知道来源在哪里。</p>
<p><code>h2</code> 的 <code>break-after: avoid</code> 是为了避免标题印在这一页最底下，正文却跑到下一页。</p>
<p><code>thead</code> 那条要解释一下。<code>thead</code> 默认就是 <code>table-header-group</code>，长表格分页时，浏览器通常会在每一页重复表头。只有当你的样式把它改成了别的 <code>display</code> 时，才需要像这里一样明确改回来。</p>
<h2>打印时常遇到的问题</h2>
<p><code>position: fixed</code> 的元素会在每一页都重复出现，比如固定的顶栏。打印时一般改成 <code>static</code> 或者直接藏掉。</p>
<p>懒加载的图片如果从来没进入过视口，打印时可能是空白的。可以在 <code>beforeprint</code> 事件里触发这些图片加载。</p>
<p>flex 和 grid 容器里的分页控制支持得比较弱。需要分页的长内容，尽量用普通的块布局。</p>
<h2>怎么测试</h2>
<p>开发者工具的 Rendering 面板可以模拟 <code>print</code> 媒体类型，方便调样式。但最终效果要用浏览器的打印预览确认，并且 A4 和 Letter 两种纸张都要看一下。</p>
<h2>常见追问</h2>
<p><strong>要不要单独生成 PDF？</strong></p>
<blockquote>
<p>发票、合同这种格式必须固定的，用服务端生成 PDF 更可控。普通文章用打印样式就够了。</p>
</blockquote>`};export{e as default};