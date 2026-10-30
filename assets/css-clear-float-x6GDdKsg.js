var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>父元素里只有一张左浮动的图片，父元素的高度会变成 0，背景和边框缩成一条线，图片“掉”到了外面。这叫高度塌陷，原因是普通块元素计算高度时不把浮动的子元素算进去。“清除浮动”就是让父元素重新把浮动包住。</p>
<p>第一种方法是在浮动元素后面放一个设置了 <code>clear: both</code> 的块。<code>clear</code> 让这个元素移到前面所有浮动的下方，父元素要包住它，高度自然就撑开了。现在一般不额外写空标签，而是用 <code>::after</code> 伪元素来做，也就是常说的 clearfix。</p>
<p>第二种方法是让父元素创建 BFC，也叫块格式化上下文，BFC 的高度会包含内部的浮动。最直接的写法是 <code>display: flow-root</code>。<code>overflow: hidden</code> 也能创建 BFC，但它会把超出的阴影、下拉菜单裁掉。</p>
<p>第三种是从根上避免：两栏、多栏布局现在用 Flex 或 Grid 写，不再依赖浮动。浮动只留给“图片在左、文字环绕”这种它本来的用途。</p>
</blockquote>
<h2>三种写法放在一起看</h2>
<p>下面三个父元素里都只有一个 50px 高的左浮动块。在 Chrome 中用 headless 模式实测，三个父元素的高度都是 50px；去掉这些写法，父元素高度是 0。</p>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.float-child</span> {
  <span class="hljs-attribute">float</span>: left;
  <span class="hljs-attribute">height</span>: <span class="hljs-number">50px</span>;
}

<span class="hljs-comment">/* 方法一：clearfix */</span>
<span class="hljs-selector-class">.clearfix</span><span class="hljs-selector-pseudo">::after</span> {
  <span class="hljs-attribute">content</span>: <span class="hljs-string">&#x27;&#x27;</span>;
  <span class="hljs-attribute">display</span>: block;
  <span class="hljs-attribute">clear</span>: both;
}

<span class="hljs-comment">/* 方法二：创建 BFC */</span>
<span class="hljs-selector-class">.flow-root</span> {
  <span class="hljs-attribute">display</span>: flow-root;
}

<span class="hljs-comment">/* 方法二的旧写法，会裁剪溢出内容 */</span>
<span class="hljs-selector-class">.overflow-hidden</span> {
  <span class="hljs-attribute">overflow</span>: hidden;
}
</code></pre></div>
<p>clearfix 为什么要写 <code>content: &#x27;&#x27;</code> 和 <code>display: block</code>？<code>::after</code> 没有 <code>content</code> 就不会生成，而 <code>clear</code> 只对块级盒子起作用，行内的伪元素清不了浮动（用 headless Chrome 实测，把 <code>clear: both</code> 写在一个行内 <code>span</code> 上，父元素高度仍是 0）。MDN 对 <code>clear</code> 的说明是，它让元素移到前面的浮动元素下方，<code>both</code> 表示左右两侧的浮动都要清。伪元素成为父元素里最后一个块，又被推到了浮动下面，父元素为了包住它就得把高度撑到浮动底部。</p>
<h2>为什么 BFC 能包住浮动</h2>
<p>MDN 列出的 BFC 作用之一就是“包含内部的浮动”。哪些元素会创建 BFC 呢？浮动元素本身、绝对定位元素、<code>overflow</code> 不是 <code>visible</code> 或 <code>clip</code> 的块，以及 <code>display: flow-root</code> 的元素，等等。</p>
<p><code>flow-root</code> 是专门为创建 BFC 设计的值，没有别的副作用。<code>overflow: hidden</code> 是借用裁剪功能顺带创建 BFC，MDN 也提醒这样做可能出现多余的滚动条或者被裁掉的阴影。所以新代码优先用 <code>flow-root</code>。BFC 的其他用途，比如阻止外边距折叠、让块避开旁边的浮动，见<a href="/questions/css-bfc/">《BFC 解决哪些布局问题，什么时候用 flow-root？》</a>。</p>
<h2>常见追问</h2>
<p><strong>给父元素设固定高度算不算清除浮动？</strong></p>
<blockquote>
<p>能让外观看起来正常，但父元素不会跟着内容变高，内容多了还是会溢出，所以不算可靠的办法。</p>
</blockquote>
<p><strong>clear 只能写在父元素里吗？</strong></p>
<blockquote>
<p>不是。<code>clear</code> 可以用在任何块元素上，比如浮动图片后面的一段正文加 <code>clear: both</code>，这段文字就会从图片下方开始，不再环绕图片。clearfix 只是把它用在父元素的最后一个伪元素上。</p>
</blockquote>`};export{e as default};