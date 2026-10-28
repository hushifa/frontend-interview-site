var e={answerHtml:`<h2>简答</h2>
<ul>
<li>BFC 内部的块盒按垂直方向排列，浮动只影响同一个 BFC 里的内容。</li>
<li>新建 BFC 有三个常用效果：高度包含内部浮动；不与外部浮动重叠；和子元素之间不发生外边距折叠。</li>
<li>创建方式包括 <code>display: flow-root</code>、<code>overflow</code> 非 <code>visible</code>/<code>clip</code>、浮动、绝对定位、<code>display: inline-block</code>、flex 和 grid 项目、<code>contain: layout</code> 等。</li>
<li>只想创建 BFC 时用 <code>display: flow-root</code>，它没有 <code>overflow: hidden</code> 裁剪阴影和弹层的副作用。</li>
</ul>
<h2>包含浮动</h2>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.media</span> {
  <span class="hljs-attribute">display</span>: flow-root;
}

<span class="hljs-selector-class">.media</span> <span class="hljs-selector-tag">img</span> {
  <span class="hljs-attribute">float</span>: left;
  <span class="hljs-attribute">margin-inline-end</span>: <span class="hljs-number">12px</span>;
}
</code></pre></div>
<p>父元素不是 BFC 时，浮动的图片不参与父元素的高度计算，父元素的背景和边框会比图片矮。加上 <code>flow-root</code> 后，父元素的高度包含浮动。</p>
<h2>避开外部浮动</h2>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.aside</span> {
  <span class="hljs-attribute">float</span>: left;
  <span class="hljs-attribute">width</span>: <span class="hljs-number">200px</span>;
}

<span class="hljs-selector-class">.main</span> {
  <span class="hljs-attribute">display</span>: flow-root;
}
</code></pre></div>
<p>普通块会延伸到浮动元素下方，只有文字绕开浮动。<code>.main</code> 成为 BFC 后，整个盒子会缩到浮动旁边，形成两栏。</p>
<h2>外边距折叠</h2>
<p>相邻块之间、父元素和第一个或最后一个子元素之间的垂直外边距会折叠。父元素成为 BFC 后，子元素的外边距留在父元素内部。父元素加 <code>padding</code>、<code>border</code> 也能阻止父子折叠，不一定需要 BFC。</p>
<p>flex 和 grid 容器的项目之间不发生外边距折叠，这也是现代布局里很少遇到折叠问题的原因。</p>
<h2>为什么少用 overflow: hidden</h2>
<p><code>overflow: hidden</code> 能创建 BFC，但会裁剪超出的内容，例如阴影、下拉菜单、<code>position: absolute</code> 的提示。<code>overflow: auto</code> 可能出现意外的滚动条。用 <code>flow-root</code> 表达意图更直接。</p>
<h2>常见追问</h2>
<ul>
<li>现在还需要 BFC 吗？新布局多用 flex 和 grid，浮动主要用于文字环绕。理解 BFC 仍有助于排查旧代码和外边距问题。</li>
</ul>`};export{e as default};