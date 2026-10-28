var e={answerHtml:`<h2>简答</h2>
<ul>
<li>读屏用户常按标题、地标、链接列表跳转；用 <code>h1</code>–<code>h6</code>、<code>nav</code>、<code>main</code> 等元素，这些跳转才能用。</li>
<li>原生元素自带行为：<code>button</code> 可用键盘激活，<code>a href</code> 可在新标签打开，<code>label</code> 扩大点击区域。</li>
<li>搜索引擎用标题和结构理解页面主题，阅读模式和翻译工具也依赖语义。</li>
<li>选择元素按含义而不是外观，外观交给 CSS。</li>
<li><code>div</code> 和 <code>span</code> 没有语义，适合纯布局；需要语义时先找原生元素，没有合适元素再考虑 ARIA。</li>
</ul>
<h2>页面结构</h2>
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
<ul>
<li><code>main</code> 每页一个，是“跳到主内容”的目标。</li>
<li>页面有多个 <code>nav</code> 时，用 <code>aria-label</code> 区分。</li>
<li><code>section</code> 只有带名称时才成为地标；没有标题的分组用 <code>div</code>。</li>
</ul>
<h2>标题层级</h2>
<p>标题按层级嵌套，不要为了字号跳级，例如 <code>h2</code> 下直接用 <code>h4</code>。需要小字号的二级标题，用 CSS 调整。每页通常只有一个 <code>h1</code>。</p>
<h2>常被误用的元素</h2>
<table><thead><tr><th>需要</th><th>正确</th><th>常见错误</th></tr></thead><tbody><tr><td>执行操作</td><td><code>button</code></td><td><code>div onclick</code></td></tr><tr><td>跳转</td><td><code>a href</code></td><td><code>button</code> 里 <code>location.href</code></td></tr><tr><td>列表</td><td><code>ul</code>/<code>ol</code></td><td>一串 <code>div</code></td></tr><tr><td>数据表</td><td><code>table</code> + <code>th</code></td><td>用 grid 拼出的表格</td></tr><tr><td>强调</td><td><code>strong</code>/<code>em</code></td><td>只用 <code>b</code>/<code>i</code> 或加粗样式</td></tr></tbody></table>
<h2>常见追问</h2>
<ul>
<li>语义化和 SEO 的关系有多大？搜索引擎能处理不规范的页面，语义化不会直接提高排名，但清晰的标题和结构有助于正确理解内容和生成摘要。</li>
</ul>`};export{e as default};