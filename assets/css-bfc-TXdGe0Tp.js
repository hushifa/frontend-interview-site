var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>可以把 BFC 理解成页面上一块独立的布局区域，全称是块级格式化上下文。区域里的块从上往下排，里面的浮动只影响这块区域里的内容。</p>
<p>新建一个 BFC 常用来解决三个问题：父元素包不住浮动的子元素，高度塌了；一个块想躲开旁边的浮动，而不是钻到它下面；父元素和子元素的上下外边距折叠到了一起。</p>
<p>创建 BFC 的办法很多，比如 <code>display: flow-root</code>、<code>overflow</code> 不是 <code>visible</code> 或 <code>clip</code>、浮动、绝对定位、<code>inline-block</code>、flex 和 grid 的项目、<code>contain: layout</code>。</p>
<p>只是想要 BFC 的话，用 <code>display: flow-root</code>。以前常用的 <code>overflow: hidden</code> 会把阴影、下拉菜单这些超出的内容裁掉。</p>
</blockquote>
<h2>父元素为什么包不住浮动的图片</h2>
<p>下面是常见的“图片在左、文字在右”的媒体块：</p>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.media</span> {
  <span class="hljs-attribute">display</span>: flow-root;
}

<span class="hljs-selector-class">.media</span> <span class="hljs-selector-tag">img</span> {
  <span class="hljs-attribute">float</span>: left;
  <span class="hljs-attribute">margin-inline-end</span>: <span class="hljs-number">12px</span>;
}
</code></pre></div>
<p>如果去掉 <code>display: flow-root</code>，文字很短而图片很高时，父元素的背景和边框会比图片矮一截，图片露到外面。</p>
<p>原因是普通的父元素算高度时，不把浮动的子元素算进去。父元素成为 BFC 以后，规则变了，它的高度会把内部的浮动包进来。这就是以前说的“清除浮动”。</p>
<h2>怎样让一个块躲开旁边的浮动</h2>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.aside</span> {
  <span class="hljs-attribute">float</span>: left;
  <span class="hljs-attribute">width</span>: <span class="hljs-number">200px</span>;
}

<span class="hljs-selector-class">.main</span> {
  <span class="hljs-attribute">display</span>: flow-root;
}
</code></pre></div>
<p><code>.main</code> 如果只是普通的块，它的盒子其实会一直延伸到浮动元素下面，只有里面的文字绕开浮动。给它加背景色就能看出来，背景压在了浮动元素底下。</p>
<p><code>.main</code> 成为 BFC 后，BFC 不能和外面的浮动重叠，所以整个盒子会缩到浮动元素旁边，两栏布局就出来了。</p>
<h2>外边距折叠是怎么回事</h2>
<p>上下相邻的两个块，一个 <code>margin-bottom: 20px</code>，一个 <code>margin-top: 30px</code>，它们之间的距离是 30px，不是 50px。两个垂直外边距合成了一个，这叫外边距折叠。父元素和它第一个或最后一个子元素之间也会这样，子元素的 <code>margin-top</code> 会“跑到”父元素外面去。</p>
<p>父元素成为 BFC 后，子元素的外边距就留在父元素里面了。不过要阻止父子折叠，不一定非得用 BFC，给父元素加 <code>padding</code> 或 <code>border</code> 也可以。</p>
<p>flex 和 grid 容器里的项目之间不会发生外边距折叠，这也是现在写布局很少碰到这个问题的原因。</p>
<h2>为什么不推荐用 overflow: hidden 创建 BFC</h2>
<p><code>overflow: hidden</code> 确实能创建 BFC，但它的本职是裁剪超出的内容。卡片的阴影、展开的下拉菜单、<code>position: absolute</code> 的提示框，只要超出父元素就会被切掉。换成 <code>overflow: auto</code>，又可能冒出意外的滚动条。</p>
<p><code>flow-root</code> 就是专门用来创建 BFC 的，没有这些副作用，读代码的人也一眼能看出意图。</p>
<h2>常见追问</h2>
<p><strong>现在都用 flex 和 grid 了，还需要了解 BFC 吗？</strong></p>
<blockquote>
<p>新写的布局确实多用 flex 和 grid，浮动主要留给文字环绕图片。但理解 BFC 还是有用的，维护旧代码、排查外边距为什么跑出去，都离不开它。</p>
</blockquote>`};export{e as default};