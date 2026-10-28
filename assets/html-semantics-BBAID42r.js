var e={answerHtml:`<h2>简答</h2>
<ul>
<li>语义元素告诉浏览器和辅助技术内容是什么，例如 h2 是二级标题、button 是可激活按钮、nav 是导航区域。</li>
<li>读屏用户可以按标题、地标和链接跳转，清楚的结构让他们快速定位内容。</li>
<li>header、main、article、section 等元素表达页面模型，也让维护者更容易理解代码。</li>
<li>语义有助于搜索引擎理解结构，但不能承诺换个标签就提高排名。</li>
</ul>
<p>把文字设成 32px、加粗，看起来像标题，但浏览器未必知道它是标题；给 div 加点击事件，看起来像按钮，但它不一定能用键盘操作。语义化就是在视觉之外，用 HTML 表达“这段内容是什么、能做什么、与其他内容有什么关系”。</p>
<p>例如 h2 表示二级标题，button 表示可激活的按钮，nav 表示导航区域。CSS 可以改变它们的样子，正确的语义不必依赖浏览器默认样式。</p>
<h2>阅读者得到的不只是视觉上的分组</h2>
<p>屏幕阅读器用户可以按标题、地标或链接跳转，而不必从页面第一个字一直听到最后。清楚的标题结构让用户快速了解哪些是并列专题、哪些属于某个专题的细分内容；main 和有意义的导航区域也有助于定位主要内容。</p>
<p>对于维护代码的人，看到 article、form、ul，比面对几十层没有明确含义的 div 更容易理解页面模型。浏览器也能为原生控件提供键盘、表单和焦点行为，减少应用自行模拟的工作。</p>
<p>搜索引擎可以利用标题、链接与正文结构理解页面，但不能据此承诺“把 div 改成 section，排名就会提高”。内容准确性、可抓取性、链接和页面质量仍然重要。</p>
<h2>一篇知识文章可以怎样组织</h2>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">a</span> <span class="hljs-attr">href</span>=<span class="hljs-string">&quot;#main&quot;</span>&gt;</span>跳到主要内容<span class="hljs-tag">&lt;/<span class="hljs-name">a</span>&gt;</span>

<span class="hljs-tag">&lt;<span class="hljs-name">header</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">a</span> <span class="hljs-attr">href</span>=<span class="hljs-string">&quot;/&quot;</span>&gt;</span>前端学习站<span class="hljs-tag">&lt;/<span class="hljs-name">a</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">nav</span> <span class="hljs-attr">aria-label</span>=<span class="hljs-string">&quot;主要导航&quot;</span>&gt;</span>
    <span class="hljs-tag">&lt;<span class="hljs-name">a</span> <span class="hljs-attr">href</span>=<span class="hljs-string">&quot;/&quot;</span>&gt;</span>题库<span class="hljs-tag">&lt;/<span class="hljs-name">a</span>&gt;</span>
    <span class="hljs-tag">&lt;<span class="hljs-name">a</span> <span class="hljs-attr">href</span>=<span class="hljs-string">&quot;/resources/&quot;</span>&gt;</span>资源<span class="hljs-tag">&lt;/<span class="hljs-name">a</span>&gt;</span>
  <span class="hljs-tag">&lt;/<span class="hljs-name">nav</span>&gt;</span>
<span class="hljs-tag">&lt;/<span class="hljs-name">header</span>&gt;</span>

<span class="hljs-tag">&lt;<span class="hljs-name">main</span> <span class="hljs-attr">id</span>=<span class="hljs-string">&quot;main&quot;</span> <span class="hljs-attr">tabindex</span>=<span class="hljs-string">&quot;-1&quot;</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">article</span>&gt;</span>
    <span class="hljs-tag">&lt;<span class="hljs-name">h1</span>&gt;</span>理解浏览器缓存<span class="hljs-tag">&lt;/<span class="hljs-name">h1</span>&gt;</span>
    <span class="hljs-tag">&lt;<span class="hljs-name">p</span>&gt;</span>本文介绍缓存如何减少重复请求，以及怎样处理内容更新。<span class="hljs-tag">&lt;/<span class="hljs-name">p</span>&gt;</span>

    <span class="hljs-tag">&lt;<span class="hljs-name">section</span>&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">h2</span>&gt;</span>直接使用缓存<span class="hljs-tag">&lt;/<span class="hljs-name">h2</span>&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">p</span>&gt;</span>先根据响应中的新鲜度信息判断缓存是否仍可直接使用。<span class="hljs-tag">&lt;/<span class="hljs-name">p</span>&gt;</span>
    <span class="hljs-tag">&lt;/<span class="hljs-name">section</span>&gt;</span>

    <span class="hljs-tag">&lt;<span class="hljs-name">section</span>&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">h2</span>&gt;</span>向服务器重新验证<span class="hljs-tag">&lt;/<span class="hljs-name">h2</span>&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">p</span>&gt;</span>缓存需要验证时，可以使用验证器判断资源是否变化。<span class="hljs-tag">&lt;/<span class="hljs-name">p</span>&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">h3</span>&gt;</span>ETag 与 If-None-Match<span class="hljs-tag">&lt;/<span class="hljs-name">h3</span>&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">p</span>&gt;</span>客户端在后续请求中携带验证器，由服务器判断资源是否变化。<span class="hljs-tag">&lt;/<span class="hljs-name">p</span>&gt;</span>
    <span class="hljs-tag">&lt;/<span class="hljs-name">section</span>&gt;</span>
  <span class="hljs-tag">&lt;/<span class="hljs-name">article</span>&gt;</span>
<span class="hljs-tag">&lt;/<span class="hljs-name">main</span>&gt;</span>

<span class="hljs-tag">&lt;<span class="hljs-name">footer</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">a</span> <span class="hljs-attr">href</span>=<span class="hljs-string">&quot;/about/&quot;</span>&gt;</span>关于本站<span class="hljs-tag">&lt;/<span class="hljs-name">a</span>&gt;</span>
<span class="hljs-tag">&lt;/<span class="hljs-name">footer</span>&gt;</span>
</code></pre></div>
<p>header 包含页面介绍与主要导航，main 包含这张页面的核心内容，article 是可以独立理解的文章，section 则组织文章内不同主题。跳过链接让键盘用户可以快速进入正文，main 上的负 tabindex 使它可被程序或跳转聚焦，但不会增加一个普通 Tab 停靠点。</p>
<p>链接路径是站点结构的示例，需要替换为项目实际存在的地址。元素语义正确不能补救不存在的目标页面。</p>
<h2>article、section 和 div 怎么选</h2>
<p>article 适合一份相对独立、可以单独分发或复用的内容，例如文章、论坛帖子或完整的评论。不是每个视觉上的白底卡片都一定要用 article，要看它是否真的是一个独立内容单元。</p>
<p>section 用于有主题的章节或分区，通常应有能说明主题的标题。如果只是给一组元素套背景色、做 Grid 布局，没有独立主题，用 div 很合适。语义化不是把所有 div 都消灭。</p>
<p>section 有标题，也不代表浏览器一定把它暴露为一个有名字的 region 地标。如果确实需要一个命名区域，可用 aria-labelledby 显式关联标题；但页面到处都是地标，同样会让导航嘈杂，应只标出有助于定位的主要区域。</p>
<p>nav 适合主要导航集合，不是所有含链接的段落。aside 表示与主要内容相关但相对独立的补充，例如侧栏资料；它并不意味着视觉上必须排在右边。header、footer 也可以用于文章或区段内部，是否具有页面级地标角色与所处上下文有关。</p>
<h2>标题层级要根据内容关系决定</h2>
<p>h1 到 h6 表达级别，不是六种默认字号。通常让页面有清楚的主标题，再按章节关系使用 h2、h3；不要为了“小一点”直接从 h1 跳到 h4，应通过 CSS 调整字号。</p>
<p>也不要以为把每个 section 里面都写 h1，浏览器和辅助技术就会自动替你计算成正确的嵌套标题级别。实际支持不能依赖这种自动大纲假设，显式写出合理层级更可靠。</p>
<p>普通页面通常只有一个正在展示的 main。单页应用保留多个路由容器时，应让不活动的主要内容从展示与访问路径中隐藏，而不是让用户面对多个没有区分的主区域。</p>
<h2>内容关系同样需要语义表达</h2>
<p>一组并列项目可以用 ul，步骤有顺序就用 ol，术语与解释可考虑 dl。二维数据关系适合 table，并通过 th 等元素表达表头；页面左右分栏不应为了排版而滥用表格。</p>
<p>强调重要性用 strong，语气重音可用 em；单纯想加粗或倾斜则可以使用 CSS。alt、label 和控件名称描述的是内容与操作用途，也不应由“看起来大概能猜到”替代。</p>
<p>最终仍需检查阅读顺序、焦点顺序、可见名称与实际行为。正确的标签提供了良好的起点，但一个没有名字的 button、一个标题层级混乱的 article，或被视觉重排打乱的表单，都不会仅因使用了语义元素就自动易用。</p>`};export{e as default};