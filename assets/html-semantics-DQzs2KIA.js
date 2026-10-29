var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>语义化就是按内容是什么来选元素，而不是按它长什么样。标题用 <code>h1</code> 到 <code>h6</code>，导航用 <code>nav</code>，列表用 <code>ul</code>，按钮用 <code>button</code>。外观交给 CSS。</p>
<p>最直接的受益者是读屏用户。他们常常按标题、按地标、按链接列表在页面里跳着找内容，地标就是 <code>nav</code>、<code>main</code> 这类表示页面区域的元素。页面全是 <code>div</code>，这些跳转就用不了。原生元素还自带行为，<code>button</code> 能用键盘触发，<code>a href</code> 能在新标签页打开，<code>label</code> 能扩大点击区域。</p>
<p>搜索引擎也用标题和结构理解页面在讲什么，阅读模式和翻译工具同样依赖语义。</p>
<p><code>div</code> 和 <code>span</code> 没有语义，适合纯粹做布局。需要语义时，先找有没有合适的原生元素，实在没有再考虑 ARIA。不过语义元素代替不了正确的交互和内容本身。</p>
</blockquote>
<h2>一个页面的基本结构</h2>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">body</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">header</span>&gt;</span>
    <span class="hljs-tag">&lt;<span class="hljs-name">a</span> <span class="hljs-attr">href</span>=<span class="hljs-string">&quot;/&quot;</span>&gt;</span>站点名<span class="hljs-tag">&lt;/<span class="hljs-name">a</span>&gt;</span>
    <span class="hljs-tag">&lt;<span class="hljs-name">nav</span> <span class="hljs-attr">aria-label</span>=<span class="hljs-string">&quot;主导航&quot;</span>&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">ul</span>&gt;</span>
        <span class="hljs-tag">&lt;<span class="hljs-name">li</span>&gt;</span><span class="hljs-tag">&lt;<span class="hljs-name">a</span> <span class="hljs-attr">href</span>=<span class="hljs-string">&quot;/questions&quot;</span>&gt;</span>题库<span class="hljs-tag">&lt;/<span class="hljs-name">a</span>&gt;</span><span class="hljs-tag">&lt;/<span class="hljs-name">li</span>&gt;</span>
        <span class="hljs-tag">&lt;<span class="hljs-name">li</span>&gt;</span><span class="hljs-tag">&lt;<span class="hljs-name">a</span> <span class="hljs-attr">href</span>=<span class="hljs-string">&quot;/resources&quot;</span>&gt;</span>资源<span class="hljs-tag">&lt;/<span class="hljs-name">a</span>&gt;</span><span class="hljs-tag">&lt;/<span class="hljs-name">li</span>&gt;</span>
      <span class="hljs-tag">&lt;/<span class="hljs-name">ul</span>&gt;</span>
    <span class="hljs-tag">&lt;/<span class="hljs-name">nav</span>&gt;</span>
  <span class="hljs-tag">&lt;/<span class="hljs-name">header</span>&gt;</span>

  <span class="hljs-tag">&lt;<span class="hljs-name">main</span>&gt;</span>
    <span class="hljs-tag">&lt;<span class="hljs-name">article</span>&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">h1</span>&gt;</span>闭包是什么？<span class="hljs-tag">&lt;/<span class="hljs-name">h1</span>&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">section</span> <span class="hljs-attr">aria-labelledby</span>=<span class="hljs-string">&quot;usage&quot;</span>&gt;</span>
        <span class="hljs-tag">&lt;<span class="hljs-name">h2</span> <span class="hljs-attr">id</span>=<span class="hljs-string">&quot;usage&quot;</span>&gt;</span>常见用途<span class="hljs-tag">&lt;/<span class="hljs-name">h2</span>&gt;</span>
        <span class="hljs-tag">&lt;<span class="hljs-name">p</span>&gt;</span>……<span class="hljs-tag">&lt;/<span class="hljs-name">p</span>&gt;</span>
      <span class="hljs-tag">&lt;/<span class="hljs-name">section</span>&gt;</span>
    <span class="hljs-tag">&lt;/<span class="hljs-name">article</span>&gt;</span>
  <span class="hljs-tag">&lt;/<span class="hljs-name">main</span>&gt;</span>

  <span class="hljs-tag">&lt;<span class="hljs-name">footer</span>&gt;</span>……<span class="hljs-tag">&lt;/<span class="hljs-name">footer</span>&gt;</span>
<span class="hljs-tag">&lt;/<span class="hljs-name">body</span>&gt;</span>
</code></pre></div>
<p><code>main</code> 每个页面只有一个，它是“跳到主内容”的目标。读屏用户不用每次都从导航听起。</p>
<p>页面上有好几个 <code>nav</code> 时，比如主导航和页脚导航，用 <code>aria-label</code> 给它们起不同的名字，读屏用户才分得清。</p>
<p><code>section</code> 有点特别，只有带了名字，比如这里用 <code>aria-labelledby</code> 关联了标题，它才会成为地标。没有标题的分组，直接用 <code>div</code> 就好。</p>
<h2>标题层级为什么不能跳</h2>
<p>读屏用户会用标题列表了解页面大纲，就像看书的目录。<code>h2</code> 下面直接用 <code>h4</code>，目录里就少了一级，看起来像漏了内容。</p>
<p>所以标题要按层级来。觉得 <code>h3</code> 字号太大想用 <code>h4</code>，正确的做法是继续用 <code>h3</code>，再用 CSS 改字号。每个页面通常只有一个 <code>h1</code>。</p>
<h2>常被用错的元素</h2>
<p>执行一个操作，用 <code>button</code>，而不是给 <code>div</code> 加 <code>onclick</code>。</p>
<p>跳转到别的页面，用 <code>a href</code>，而不是在 <code>button</code> 里写 <code>location.href</code>。</p>
<p>列表用 <code>ul</code> 或 <code>ol</code>，不是一串 <code>div</code>。数据表格用 <code>table</code> 加 <code>th</code>，不是用 grid 拼出来的样子像表格的东西。</p>
<p>强调用 <code>strong</code> 或 <code>em</code>，不要只用 <code>b</code>、<code>i</code> 或者加粗样式。</p>
<h2>常见追问</h2>
<p><strong>语义化对 SEO 的帮助有多大？</strong></p>
<blockquote>
<p>搜索引擎能处理写得不规范的页面，语义化不会直接提高排名。但清晰的标题和结构，能帮助搜索引擎正确理解内容、生成更准确的摘要。</p>
</blockquote>`};export{e as default};