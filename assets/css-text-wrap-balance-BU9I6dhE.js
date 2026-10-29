var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>标题在窄屏上经常是第一行很长、第二行只剩一个词，很难看。<code>text-wrap: balance</code> 会让各行长度尽量接近，把文字平均分到两行。正文段落最后一行只剩一两个字，叫孤字，<code>text-wrap: pretty</code> 用更慢、更细的算法排整段，主要就是避免这种情况。</p>
<p><code>text-wrap</code> 其实是个简写，管两件事：<code>text-wrap-mode</code> 管换不换行（<code>wrap</code>、<code>nowrap</code>），<code>text-wrap-style</code> 管怎么换（<code>auto</code>、<code>balance</code>、<code>pretty</code>、<code>stable</code>）。它会继承。<code>stable</code> 让编辑内容时前面的行不重新换行，适合可编辑区域。</p>
<p><code>balance</code> 只对少量行生效，Chromium 不超过 6 行，Firefox 不超过 10 行，所以性能影响很小。<code>pretty</code> 更费计算，适合正文，不适合大量动态变化的文本。</p>
<p>不支持的值会被浏览器忽略，文字按普通方式换行，不需要额外写回退代码。</p>
</blockquote>
<h2>基本用法</h2>
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
<p>标题和图片说明用 <code>balance</code>，正文用 <code>pretty</code>，可编辑区域用 <code>stable</code>。</p>
<p>标题如果超过了行数上限，<code>balance</code> 就不起作用，照常换行。</p>
<h2>用了 balance，为什么标题右边空出一大块</h2>
<p><code>balance</code> 平衡的是每一行文字的宽度，元素本身的宽度不变。原来第一行占满、第二行很短，平衡后两行都只占一半多，右边自然空出来了。标题容器比较宽时，配合 <code>max-inline-size</code> 限制宽度，效果更好。</p>
<h2>还要注意什么</h2>
<p><code>pretty</code> 的具体算法由浏览器自己决定，不同浏览器排出来可能不一样。所以不要指望它在固定的位置断行。</p>
<p>中文没有空格分词，两个值都能用，但效果取决于浏览器怎么处理中日韩文字的断行。上线前要在目标浏览器里看实际效果。</p>
<p>别为了让标题好看去手动插 <code>&lt;br&gt;</code>。固定的换行在别的屏幕宽度下，会变得更难看。</p>
<h2>和多行截断一起用</h2>
<p>要多行截断时，目前通用的写法还是带前缀的 <code>-webkit-line-clamp</code>：</p>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.title</span> {
  <span class="hljs-attribute">display</span>: -webkit-box;
  -webkit-<span class="hljs-attribute">box-orient</span>: vertical;
  -webkit-<span class="hljs-selector-tag">line</span>-clamp: <span class="hljs-number">2</span>;
  <span class="hljs-attribute">overflow</span>: hidden;
  <span class="hljs-attribute">text-wrap</span>: balance;
}
</code></pre></div>
<p>截断以后，完整内容要能通过别的方式看到，比如详情页，或者一个看得见的展开按钮，不能只靠 <code>title</code> 属性。</p>
<h2>常见追问</h2>
<p><strong>为什么 <code>balance</code> 只对少量行生效？</strong></p>
<blockquote>
<p>平衡换行要反复尝试好几种断行方案，再挑出最均匀的。行数越多，计算越贵，所以浏览器用上限来控制成本。</p>
</blockquote>`};export{e as default};