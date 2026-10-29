var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>表单控件默认是固定大小的，这对应默认值 <code>fixed</code>。改成 <code>field-sizing: content</code> 后，控件会按里面的内容或占位文字伸缩：textarea 打字越多越高，单行 input 越打越宽，select 按选中项的宽度变化。</p>
<p>以前做自动增高的输入框，要监听输入事件，再读 <code>scrollHeight</code> 去改高度，现在一行 CSS 就够了。</p>
<p>一定要配上 <code>min-*</code> 和 <code>max-*</code>。没内容时控件可能缩得很小，内容很长时又会无限撑开。另外设了 <code>content</code> 以后，<code>rows</code>、<code>cols</code>、<code>size</code> 这些属性就不起作用了，想固定某个方向，要明确写宽或高。</p>
<p>它从 2026 年 6 月起进入 Baseline。旧浏览器里控件保持固定尺寸，照样能用。</p>
</blockquote>
<h2>自动增高的 textarea</h2>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-tag">textarea</span> {
  <span class="hljs-attribute">field-sizing</span>: content;
  <span class="hljs-attribute">min-block-size</span>: <span class="hljs-number">3</span>lh;
  <span class="hljs-attribute">max-block-size</span>: <span class="hljs-number">12</span>lh;
}
</code></pre></div>
<p><code>lh</code> 是一个单位，等于当前的行高，所以 <code>3lh</code> 就是三行的高度。内容少时至少显示 3 行，写到超过 12 行就不再长高，出现滚动条。</p>
<h2>按内容变宽的输入框</h2>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.tag-input</span> {
  <span class="hljs-attribute">field-sizing</span>: content;
  <span class="hljs-attribute">min-inline-size</span>: <span class="hljs-number">8ch</span>;
  <span class="hljs-attribute">max-inline-size</span>: <span class="hljs-number">100%</span>;
}
</code></pre></div>
<p>这种写法适合输入标签、表格里的行内编辑。<code>ch</code> 约等于一个“0”字符的宽度，<code>8ch</code> 保证空着时也有个能点的大小。</p>
<p>要留意布局会不会跟着晃。输入框变宽会把同一行的其他元素往后推，放在 flex 容器里时，要确认换行的表现符合预期。</p>
<h2>体验和无障碍上要注意什么</h2>
<p>占位文字也会参与尺寸计算。空输入框会按 <code>placeholder</code> 的宽度显示，所以占位文字不要写太长。</p>
<p>自动伸缩不影响 <code>&lt;label&gt;</code> 的关联。控件的名称和错误提示，还是照常提供。</p>
<p>用户放大页面后，最大尺寸要还能装下内容，别让文字被截断。</p>
<h2>常见追问</h2>
<p><strong>浏览器不支持时，要不要写 JavaScript 回退？</strong></p>
<blockquote>
<p>大多数时候不用。固定尺寸的 textarea 加上滚动条照样能用。确实需要时，先用 <code>CSS.supports(&#x27;field-sizing&#x27;, &#x27;content&#x27;)</code> 判断，不支持再加载回退逻辑。</p>
</blockquote>`};export{e as default};