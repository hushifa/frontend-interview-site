var e={answerHtml:`<h2>简答</h2>
<ul>
<li><code>@media print</code> 里隐藏导航、按钮、广告等纸上无用的内容。</li>
<li>固定高度加滚动条的区域要改成 <code>height: auto; overflow: visible</code>，否则纸上只打印可见的那一部分。</li>
<li><code>@page { margin: 2cm; }</code> 设置页边距，<code>size</code> 设置纸张方向；用户的打印设置可能覆盖这些值。</li>
<li><code>break-inside: avoid</code> 防止表格行、图片被分页切开，<code>break-before: page</code> 强制换页。</li>
<li>浏览器默认不打印背景色，重要信息不要只靠背景色表达；必要时用 <code>print-color-adjust: exact</code>。</li>
</ul>
<h2>基本样式</h2>
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
<p>链接后打印出网址，读者在纸上也能找到来源。<code>thead</code> 设为 <code>table-header-group</code> 后，长表格的表头会在每页重复。</p>
<h2>常见问题</h2>
<ul>
<li><code>position: fixed</code> 的元素会在每一页重复出现，打印时通常改为 <code>static</code> 或隐藏。</li>
<li>懒加载的图片如果没进入过视口，打印时可能是空白；打印前可以在 <code>beforeprint</code> 事件里触发加载。</li>
<li>flex 和 grid 容器里的分页控制支持较弱，需要分页的长内容尽量用普通块布局。</li>
</ul>
<h2>测试</h2>
<p>开发者工具的 Rendering 面板可以模拟 <code>print</code> 媒体类型，最终效果要用浏览器的打印预览确认，并分别检查 A4 和 Letter 纸张。</p>
<h2>常见追问</h2>
<ul>
<li>要不要单独生成 PDF？需要固定格式（发票、合同）时，用服务端生成 PDF 更可控；普通文章用打印样式就够了。</li>
</ul>`};export{e as default};