var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>商品标题太长，列表里只显示一行，末尾用省略号。单行要写三条：<code>white-space: nowrap</code> 不让文字换行，<code>overflow: hidden</code> 把超出的部分藏起来，<code>text-overflow: ellipsis</code> 在被截断的地方显示省略号。元素本身要有确定的宽度，比如块元素或者设了 <code>width</code>、<code>max-width</code>。</p>
<p>为什么要三条一起写？MDN 的说明是，<code>text-overflow</code> 只负责“怎样提示内容溢出了”，它不会让文字溢出，要靠 <code>overflow</code> 和 <code>white-space</code> 让文字溢出并隐藏。而且它只处理行内方向的溢出，所以管不了多行。</p>
<p>多行省略目前通用的写法是带 <code>-webkit-</code> 前缀的一组：<code>display: -webkit-box</code>、<code>-webkit-box-orient: vertical</code>、<code>-webkit-line-clamp: 2</code>，再加 <code>overflow: hidden</code>。MDN 说明这个旧属性只在这种组合下生效。</p>
<p>要注意，标准的 <code>line-clamp</code> 属性已经写进规范，但浏览器支持还有限，现在还不能只写它。另外被截断的内容要有别的方式能看到，比如详情页或展开按钮。</p>
</blockquote>
<h2>单行省略</h2>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.title</span> {
  <span class="hljs-attribute">white-space</span>: nowrap;
  <span class="hljs-attribute">overflow</span>: hidden;
  <span class="hljs-attribute">text-overflow</span>: ellipsis;
}
</code></pre></div>
<p>为什么常见的“只写了 <code>text-overflow</code> 没效果”？因为默认情况下文字会换行，不会溢出，也就没什么可提示的。<code>white-space: nowrap</code> 让文字挤在一行里溢出，<code>overflow: hidden</code> 让溢出部分不显示，<code>text-overflow</code> 才有机会把截断处换成省略号。</p>
<p>在 flex 布局里，省略常常失效，原因是 flex 子项默认的最小宽度是内容宽度，不会被压缩到比文字还窄。给这个子项加上 <code>min-width: 0</code>，它才能缩小，省略号才会出现。用 headless Chrome 实测，100px 宽的 flex 容器里，没加 <code>min-width: 0</code> 的子项被撑到 261px，加了以后是 100px。</p>
<h2>多行省略</h2>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.desc</span> {
  <span class="hljs-attribute">display</span>: -webkit-box;
  -webkit-<span class="hljs-attribute">box-orient</span>: vertical;
  -webkit-<span class="hljs-selector-tag">line</span>-clamp: <span class="hljs-number">2</span>;
  <span class="hljs-attribute">overflow</span>: hidden;
}
</code></pre></div>
<p>这组写法来自旧版的 WebKit 弹性盒，看起来奇怪。MDN 说明这几个带前缀的属性虽然已经废弃，但它们的配合方式已经完整写进规范，会一直被支持。<code>-webkit-line-clamp</code> 只有在 <code>display</code> 是 <code>-webkit-box</code> 或 <code>-webkit-inline-box</code>、并且 <code>-webkit-box-orient</code> 是 <code>vertical</code> 时才生效。</p>
<p>为什么还要 <code>overflow: hidden</code>？MDN 提醒，大多数情况下都要加，否则省略号会出现在第二行末尾，后面的内容却照样显示出来。用 headless Chrome 156 实测，16px 字号、20px 行高时，加不加 <code>overflow: hidden</code>，元素高度都是 40px，也就是两行；可是不加的话，后面几行文字会溢出到元素外面。</p>
<h2>标准 line-clamp 现在能用吗</h2>
<p>CSS Overflow 规范定义了不带前缀的 <code>line-clamp</code>，MDN 把它标为浏览器支持有限。在 Chrome 156 里，<code>CSS.supports(&#x27;line-clamp&#x27;, &#x27;2&#x27;)</code> 返回 <code>false</code>，<code>-webkit-line-clamp</code> 返回 <code>true</code>，只写 <code>line-clamp: 2</code> 时文字不会被截断。所以现阶段多行省略还要写带前缀的那组，可以把标准写法一起写上，等浏览器支持后自动生效。</p>
<p>和标题的换行美化一起用的写法，见<a href="/questions/css-text-wrap-balance/">《text-wrap: balance 和 pretty 应该怎样使用？》</a>。</p>
<h2>常见追问</h2>
<p><strong>怎么判断文字有没有真的被截断？</strong></p>
<blockquote>
<p>在 JavaScript 里比较元素尺寸。单行看 <code>scrollWidth &gt; clientWidth</code>，多行看 <code>scrollHeight &gt; clientHeight</code>，成立就说明有内容被隐藏，可以据此决定要不要显示“展开”按钮。</p>
</blockquote>
<p><strong>省略号能放在中间吗，比如保留文件扩展名？</strong></p>
<blockquote>
<p><code>text-overflow</code> 只能在行尾截断。保留扩展名一般把文件名拆成两段：前一段用单行省略，扩展名放在单独的元素里不收缩。</p>
</blockquote>`};export{e as default};