var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>HTML 文件第一行的 <code>&lt;!doctype html&gt;</code> 是写给浏览器的开关。有了它，浏览器按现代 HTML 和 CSS 规范来排版；没有它，浏览器会进入怪异模式，模仿上世纪 Navigator 4 和 IE5 的布局方式。</p>
<p>为什么要有两种模式？在 Web 标准普及之前，很多网站是按老浏览器的非标准行为写的。浏览器开始遵循标准时，为了不让这些老页面错乱，就用 DOCTYPE 来区分：老页面一般没写或写的是旧 DOCTYPE，按旧规则渲染；新页面写了标准 DOCTYPE，按标准渲染。</p>
<p>现在规范里有三种模式：无怪异模式（以前叫标准模式）、有限怪异模式（以前叫“近乎标准模式”，只保留极少数怪异行为）和怪异模式。MDN 说明 <code>&lt;!doctype html&gt;</code> 唯一的作用就是开启无怪异模式，所有现代浏览器都认它，没有理由写更复杂的 DOCTYPE。</p>
<p>要注意 DOCTYPE 必须放在文档最前面。漏写以后，页面可能出现行高、盒子高度等方面的奇怪差异，用 <code>document.compatMode</code> 就能检查：<code>&#x27;CSS1Compat&#x27;</code> 是无怪异或有限怪异模式，<code>&#x27;BackCompat&#x27;</code> 是怪异模式。</p>
</blockquote>
<h2>浏览器怎样决定用哪种模式</h2>
<p>HTML 解析规范里有一张详细的表。遇到的 DOCTYPE 名字不是 <code>html</code>、带有一批旧的公共标识符，或者根本没有 DOCTYPE，文档就进入怪异模式。公共标识符以 XHTML 1.0 Transitional、Frameset 开头的，以及带系统标识符的 HTML 4.01 Transitional、Frameset，进入有限怪异模式。其他情况，包括 <code>&lt;!doctype html&gt;</code>，都是无怪异模式。</p>
<p>WHATWG HTML 规范对 DOCTYPE 的解释是，它是因为历史原因才必须写的；省略时浏览器倾向于使用一种和部分规范不兼容的渲染模式。以 <code>application/xhtml+xml</code> 类型返回的 XHTML 文档例外，MDN 说明它们总是使用无怪异模式，不需要 DOCTYPE。</p>
<h2>怪异模式到底怪在哪</h2>
<p>这些行为差异写在 WHATWG 的 Quirks Mode 规范里。下面是用 headless Chrome 实测的两个例子，同一段 HTML 只改 DOCTYPE：</p>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">div</span> <span class="hljs-attr">style</span>=<span class="hljs-string">&quot;font-size: 16px&quot;</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">img</span> <span class="hljs-attr">style</span>=<span class="hljs-string">&quot;width: 10px; height: 10px&quot;</span> <span class="hljs-attr">src</span>=<span class="hljs-string">&quot;dot.gif&quot;</span> /&gt;</span>
<span class="hljs-tag">&lt;/<span class="hljs-name">div</span>&gt;</span>
<span class="hljs-tag">&lt;<span class="hljs-name">p</span> <span class="hljs-attr">style</span>=<span class="hljs-string">&quot;color: ff0000&quot;</span>&gt;</span>没有 # 的颜色<span class="hljs-tag">&lt;/<span class="hljs-name">p</span>&gt;</span>
</code></pre></div>
<p>写 <code>&lt;!doctype html&gt;</code> 时，<code>div</code> 的高度是 24px，因为图片按基线对齐，下方留出了行内文字需要的空间，这就是常说的“图片下面有一条缝”。删掉 DOCTYPE 进入怪异模式后，<code>div</code> 高度变成 10px，正好贴着图片。规范里叫行高计算怪异行为：只包含图片这类内容的行，不按 <code>line-height</code> 留出最小高度。用带系统标识符的 HTML 4.01 Transitional DOCTYPE 进入有限怪异模式时，高度也是 10px，因为这一条在有限怪异模式下同样生效，<code>compatMode</code> 却显示 <code>&#x27;CSS1Compat&#x27;</code>。</p>
<p>那个缺 <code>#</code> 的颜色 <code>ff0000</code>，标准模式下是无效值，文字保持黑色；怪异模式下按规范里的“无井号十六进制颜色怪异行为”被当作红色。同一次实测里还能看到，怪异模式下 <code>body</code> 会被撑满整个窗口高度，对应规范里的“body 填满 html 元素”。</p>
<p>所以漏写 DOCTYPE 引起的往往是这类细小的布局差别，不容易一眼看出原因。</p>
<h2>常见追问</h2>
<p><strong>DOCTYPE 前面有注释或空行会怎样？</strong></p>
<blockquote>
<p>只有空白和注释在前面，解析器还能识别后面的 DOCTYPE。但 MDN 的建议是把 DOCTYPE 放在文档最开头、任何其他内容之前。如果前面出现了别的标签或文字，解析器就把它当成没有 DOCTYPE 处理，进入怪异模式。</p>
</blockquote>
<p><strong>怪异模式下盒模型也不一样吗？</strong></p>
<blockquote>
<p>规范里确实有一条：怪异模式下，表格单元格计算高度时按 <code>border-box</code> 处理。但不是所有元素的盒模型都变了。想主动使用 <code>border-box</code>，在标准模式下写 <code>box-sizing: border-box</code> 即可，见<a href="/questions/css-box/">《标准盒模型和 border-box 有什么区别？》</a>。</p>
</blockquote>`};export{e as default};