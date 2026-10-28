var e={answerHtml:`<h2>简答</h2>
<ul>
<li>默认值 <code>fixed</code> 下，表单控件有固定的默认尺寸；<code>content</code> 让控件按当前内容或占位文字伸缩。</li>
<li>textarea 会随输入变高，单行 input 会随输入变宽，select 按选中项宽度调整。</li>
<li>一定要配 <code>min-*</code> 和 <code>max-*</code>：空内容时控件可能缩得很小，长内容会无限撑开。</li>
<li>自 2026 年 6 月起进入 Baseline，旧浏览器保持固定尺寸，功能不受影响。</li>
<li>设置了 <code>rows</code>、<code>cols</code>、<code>size</code> 属性或显式宽高时，对应方向不再按内容伸缩。</li>
</ul>
<h2>自动增高的 textarea</h2>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-tag">textarea</span> {
  <span class="hljs-attribute">field-sizing</span>: content;
  <span class="hljs-attribute">min-block-size</span>: <span class="hljs-number">3</span>lh;
  <span class="hljs-attribute">max-block-size</span>: <span class="hljs-number">12</span>lh;
}
</code></pre></div>
<p><code>lh</code> 是当前行高。内容少时至少显示 3 行，超过 12 行出现滚动条。以前要监听 <code>input</code> 事件，把高度设为 <code>auto</code> 再读 <code>scrollHeight</code>，现在不需要 JavaScript。</p>
<h2>按内容伸缩的输入框</h2>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.tag-input</span> {
  <span class="hljs-attribute">field-sizing</span>: content;
  <span class="hljs-attribute">min-inline-size</span>: <span class="hljs-number">8ch</span>;
  <span class="hljs-attribute">max-inline-size</span>: <span class="hljs-number">100%</span>;
}
</code></pre></div>
<p>适合标签输入、行内编辑。注意布局稳定性：输入框变宽会推动同一行的其他元素，放在 flex 容器里时要确认换行行为。</p>
<h2>无障碍和体验</h2>
<ul>
<li>占位文字也参与尺寸计算，空输入框会按 <code>placeholder</code> 的宽度显示，所以占位文字不要太长。</li>
<li>自动伸缩不改变 <code>&lt;label&gt;</code> 的关联，名称和错误提示仍按常规方式提供。</li>
<li>用户放大页面后，最大尺寸要能容纳内容，避免文字被截断。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li>不支持时要不要写 JavaScript 回退？多数场景不需要，固定尺寸的 textarea 加上滚动条仍然可用。确实需要时，用 <code>CSS.supports(&#x27;field-sizing&#x27;, &#x27;content&#x27;)</code> 判断后再加载回退逻辑。</li>
</ul>`};export{e as default};