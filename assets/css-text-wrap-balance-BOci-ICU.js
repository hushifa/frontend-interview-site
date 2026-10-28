var e={answerHtml:`<h2>简答</h2>
<ul>
<li><code>text-wrap</code> 是 <code>text-wrap-mode</code>（<code>wrap</code>、<code>nowrap</code>）和 <code>text-wrap-style</code>（<code>auto</code>、<code>balance</code>、<code>pretty</code>、<code>stable</code>）的简写，可继承。</li>
<li><code>balance</code> 让各行长度尽量接近，浏览器只对少量行生效：Chromium 不超过 6 行，Firefox 不超过 10 行，所以性能影响很小。</li>
<li><code>pretty</code> 用更慢的算法优化整段换行，主要避免末行只剩一两个字，适合正文而不是大量动态文本。</li>
<li><code>stable</code> 让编辑内容时前面的行不重新换行，适合 <code>contenteditable</code> 和输入区域。</li>
<li>不支持的值会被忽略，文字按普通方式换行，不需要额外的回退代码。</li>
</ul>
<h2>用法</h2>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-tag">h1</span>,
<span class="hljs-selector-tag">h2</span>,
<span class="hljs-selector-tag">figcaption</span> {
  <span class="hljs-attribute">text-wrap</span>: balance;
}

<span class="hljs-selector-tag">article</span> <span class="hljs-selector-tag">p</span> {
  <span class="hljs-attribute">text-wrap</span>: pretty;
}

<span class="hljs-selector-attr">[contenteditable]</span> {
  <span class="hljs-attribute">text-wrap</span>: stable;
}
</code></pre></div>
<p>标题在窄屏上常出现“第一行很长、第二行只有一个词”的情况，<code>balance</code> 会把文字更平均地分到两行。超过行数上限的文本，<code>balance</code> 不生效，照常换行。</p>
<h2>注意事项</h2>
<ul>
<li><code>balance</code> 平衡的是行宽，元素本身的宽度不变。标题容器较宽时，文字右侧会留出空白，配合 <code>max-inline-size</code> 效果更好。</li>
<li><code>pretty</code> 的具体算法由浏览器决定，不同浏览器的结果可能不同，不要依赖它得到确定的断行位置。</li>
<li>中文没有空格分词，两个值都能用，但效果依赖浏览器对 CJK 断行的实现，上线前要在目标浏览器里看实际效果。</li>
<li>不要为了平衡标题去插入 <code>&lt;br&gt;</code>，固定换行在其他屏幕宽度下会变得更难看。</li>
</ul>
<h2>和截断配合</h2>
<p>需要多行截断时，目前通用写法仍是带前缀的 <code>-webkit-line-clamp</code>：</p>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.title</span> {
  <span class="hljs-attribute">display</span>: -webkit-box;
  -webkit-<span class="hljs-attribute">box-orient</span>: vertical;
  -webkit-<span class="hljs-selector-tag">line</span>-clamp: <span class="hljs-number">2</span>;
  <span class="hljs-attribute">overflow</span>: hidden;
  <span class="hljs-attribute">text-wrap</span>: balance;
}
</code></pre></div>
<p>截断后的完整内容要能通过其他方式获取，例如详情页或 <code>title</code> 以外的可见展开操作。</p>
<h2>常见追问</h2>
<ul>
<li>为什么 <code>balance</code> 只限少量行？平衡换行要反复尝试多种断行方案，行数越多计算越贵，浏览器用上限控制成本。</li>
</ul>`};export{e as default};