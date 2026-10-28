var e={answerHtml:`<h2>简答</h2>
<ul>
<li>盒子由内容区、内边距、边框和外边距组成。</li>
<li>默认的 <code>content-box</code> 中，<code>width</code> 指内容区，实际占位宽度是 <code>width + padding + border</code>。</li>
<li><code>border-box</code> 中，<code>width</code> 包含内边距和边框，内容区会相应变窄。</li>
<li>外边距始终在 <code>width</code> 之外，两种模式都一样。</li>
<li>项目里通常全局设置 <code>border-box</code>，让声明的尺寸就是看到的尺寸。</li>
</ul>
<h2>计算示例</h2>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.box</span> {
  <span class="hljs-attribute">width</span>: <span class="hljs-number">200px</span>;
  <span class="hljs-attribute">padding</span>: <span class="hljs-number">20px</span>;
  <span class="hljs-attribute">border</span>: <span class="hljs-number">5px</span> solid;
}
</code></pre></div>
<ul>
<li><code>content-box</code>：内容区 200px，盒子总宽 200 + 40 + 10 = 250px。</li>
<li><code>border-box</code>：盒子总宽 200px，内容区 200 − 40 − 10 = 150px。</li>
</ul>
<p><code>border-box</code> 下，如果内边距和边框加起来超过 <code>width</code>，内容区宽度为 0，盒子会被撑到内边距加边框的宽度。</p>
<h2>全局设置</h2>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css">*,
*<span class="hljs-selector-pseudo">::before</span>,
*<span class="hljs-selector-pseudo">::after</span> {
  <span class="hljs-attribute">box-sizing</span>: border-box;
}
</code></pre></div>
<p>这样写便于两栏布局：<code>width: 50%</code> 加上内边距也不会超出父元素。</p>
<h2>最终尺寸还受什么影响</h2>
<ul>
<li><code>min-width</code>、<code>max-width</code> 同样按 <code>box-sizing</code> 解释。</li>
<li>flex 和 grid 项目的尺寸会被容器重新分配，<code>width</code> 只是参考值。</li>
<li>内容过长（例如长 URL）可能撑开盒子，需要 <code>min-width: 0</code> 或 <code>overflow-wrap: anywhere</code>。</li>
<li>行内元素的 <code>width</code>、<code>height</code> 不生效，要改为 <code>inline-block</code> 或块级。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li>怪异模式的盒模型是什么？缺少 DOCTYPE 时，浏览器进入怪异模式，部分元素按类似 <code>border-box</code> 的方式计算。现代页面都要写 <code>&lt;!DOCTYPE html&gt;</code>。</li>
</ul>`};export{e as default};