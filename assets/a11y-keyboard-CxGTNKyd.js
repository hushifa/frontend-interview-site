var e={answerHtml:`<h2>简答</h2>
<ul>
<li>键盘验收的目标是不用鼠标也能完成主要任务，而不是让 Tab 停在每个元素上。</li>
<li>导航用带 href 的 a，动作用 button，输入优先用原生表单控件，它们自带键盘行为。</li>
<li><code>tabindex=&quot;0&quot;</code> 只让元素可聚焦，<code>role=&quot;button&quot;</code> 只声明语义，键盘激活仍要自己实现。</li>
<li>Tab 顺序应与 DOM 顺序一致，避免正数 tabindex；焦点要始终可见，且不被其他内容遮挡。</li>
</ul>
<p>键盘验收的目标是：用户不用鼠标，也能找到并完成主要任务。不是让 Tab 停在每一个 div 上，更不是自动化工具发现页面有 tabindex 就算通过。</p>
<p>可以先放下鼠标，从页面入口开始完成一条真实流程：跳过重复导航、选择分类、输入搜索条件、查看结果、打开弹窗、修改设置、处理错误并返回原来的位置。每一步都应知道焦点在哪里、当前控件能做什么，以及怎样继续或取消。</p>
<h2>先用原生元素获得正确的基础行为</h2>
<p>导航用带 href 的 a，执行动作使用 button，输入和选择优先使用原生表单控件。原生按钮已经支持键盘激活、焦点、禁用等行为，表单还有提交和约束验证机制。</p>
<p>给 div 加 <code>tabindex=&quot;0&quot;</code> 只让它可以进入顺序焦点导航，不会自动变成按钮。再加 <code>role=&quot;button&quot;</code> 也只是声明语义，开发者仍需正确实现 Enter、空格、禁用和相关状态。没有特殊需求时，直接用 button 通常更可靠。</p>
<p>也不要把普通按钮换成 <code>&lt;a href=&quot;#&quot;&gt;</code>，然后拦截跳转来执行动作。链接与按钮具有不同的键盘和用户预期，使用正确元素能减少不必要的补丁。</p>
<h2>Tab 顺序应该能解释，而不是靠正数硬排</h2>
<p>没有额外干预时，顺序焦点导航通常与 DOM 顺序和元素的可聚焦性有关。CSS 把控件视觉上挪到另一个位置，不会自然让键盘顺序也跟着移动，复杂布局要同时检查视觉顺序与阅读顺序。</p>
<table><thead><tr><th>tabindex</th><th>主要含义</th></tr></thead><tbody><tr><td><code>0</code></td><td>让合适的元素进入正常顺序导航</td></tr><tr><td><code>-1</code></td><td>通常不进入 Tab 顺序，但可以按需要由脚本或相关导航聚焦</td></tr><tr><td>正数</td><td>建立额外的优先顺序，通常应避免</td></tr></tbody></table>
<p>正数 tabindex 容易让一个小改动打乱整页顺序，也会增加嵌套组件的维护成本。优先调整结构，而不是给每个控件编号。</p>
<p>静态段落、装饰图标通常不需要 Tab 停留，读屏用户有自己的文档阅读方式。让页面所有文字都可 Tab，只会把完成任务的按键次数大幅增加。</p>
<h2>重复导航需要有快速跳过的路径</h2>
<p>下面展示一个不依赖自定义键盘脚本的结构。搜索使用原生表单，跳转链接让用户直接到达主要内容：</p>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">a</span> <span class="hljs-attr">class</span>=<span class="hljs-string">&quot;skip-link&quot;</span> <span class="hljs-attr">href</span>=<span class="hljs-string">&quot;#main&quot;</span>&gt;</span>跳到主要内容<span class="hljs-tag">&lt;/<span class="hljs-name">a</span>&gt;</span>
<span class="hljs-tag">&lt;<span class="hljs-name">nav</span> <span class="hljs-attr">aria-label</span>=<span class="hljs-string">&quot;主导航&quot;</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">a</span> <span class="hljs-attr">href</span>=<span class="hljs-string">&quot;/questions/&quot;</span>&gt;</span>面试题库<span class="hljs-tag">&lt;/<span class="hljs-name">a</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">a</span> <span class="hljs-attr">href</span>=<span class="hljs-string">&quot;/resources/&quot;</span>&gt;</span>前端资源<span class="hljs-tag">&lt;/<span class="hljs-name">a</span>&gt;</span>
<span class="hljs-tag">&lt;/<span class="hljs-name">nav</span>&gt;</span>

<span class="hljs-tag">&lt;<span class="hljs-name">main</span> <span class="hljs-attr">id</span>=<span class="hljs-string">&quot;main&quot;</span> <span class="hljs-attr">tabindex</span>=<span class="hljs-string">&quot;-1&quot;</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">h1</span>&gt;</span>搜索面试题<span class="hljs-tag">&lt;/<span class="hljs-name">h1</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">form</span> <span class="hljs-attr">action</span>=<span class="hljs-string">&quot;/questions/&quot;</span> <span class="hljs-attr">method</span>=<span class="hljs-string">&quot;get&quot;</span>&gt;</span>
    <span class="hljs-tag">&lt;<span class="hljs-name">label</span> <span class="hljs-attr">for</span>=<span class="hljs-string">&quot;keyword&quot;</span>&gt;</span>关键词<span class="hljs-tag">&lt;/<span class="hljs-name">label</span>&gt;</span>
    <span class="hljs-tag">&lt;<span class="hljs-name">input</span> <span class="hljs-attr">id</span>=<span class="hljs-string">&quot;keyword&quot;</span> <span class="hljs-attr">name</span>=<span class="hljs-string">&quot;q&quot;</span> <span class="hljs-attr">type</span>=<span class="hljs-string">&quot;search&quot;</span> /&gt;</span>
    <span class="hljs-tag">&lt;<span class="hljs-name">button</span> <span class="hljs-attr">type</span>=<span class="hljs-string">&quot;submit&quot;</span>&gt;</span>搜索<span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span>
  <span class="hljs-tag">&lt;/<span class="hljs-name">form</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">details</span>&gt;</span>
    <span class="hljs-tag">&lt;<span class="hljs-name">summary</span>&gt;</span>筛选说明<span class="hljs-tag">&lt;/<span class="hljs-name">summary</span>&gt;</span>
    <span class="hljs-tag">&lt;<span class="hljs-name">p</span>&gt;</span>可以先输入主题，再逐步缩小结果范围。<span class="hljs-tag">&lt;/<span class="hljs-name">p</span>&gt;</span>
    <span class="hljs-tag">&lt;<span class="hljs-name">a</span> <span class="hljs-attr">href</span>=<span class="hljs-string">&quot;/help/&quot;</span>&gt;</span>查看完整说明<span class="hljs-tag">&lt;/<span class="hljs-name">a</span>&gt;</span>
  <span class="hljs-tag">&lt;/<span class="hljs-name">details</span>&gt;</span>
<span class="hljs-tag">&lt;/<span class="hljs-name">main</span>&gt;</span>
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.skip-link</span> {
  <span class="hljs-attribute">position</span>: absolute;
  <span class="hljs-attribute">top</span>: <span class="hljs-number">0.5rem</span>;
  <span class="hljs-attribute">left</span>: <span class="hljs-number">0.5rem</span>;
  <span class="hljs-attribute">padding</span>: <span class="hljs-number">0.75rem</span>;
  <span class="hljs-attribute">color</span>: <span class="hljs-number">#fff</span>;
  <span class="hljs-attribute">background</span>: <span class="hljs-number">#111</span>;
  <span class="hljs-attribute">transform</span>: <span class="hljs-built_in">translateY</span>(-<span class="hljs-number">200%</span>);
  <span class="hljs-attribute">z-index</span>: <span class="hljs-number">100</span>;
}

<span class="hljs-selector-class">.skip-link</span><span class="hljs-selector-pseudo">:focus</span> {
  <span class="hljs-attribute">transform</span>: <span class="hljs-built_in">translateY</span>(<span class="hljs-number">0</span>);
}

<span class="hljs-selector-pseudo">:focus-visible</span> {
  <span class="hljs-attribute">outline</span>: <span class="hljs-number">3px</span> solid <span class="hljs-number">#1d4ed8</span>;
  <span class="hljs-attribute">outline-offset</span>: <span class="hljs-number">3px</span>;
}

<span class="hljs-selector-id">#main</span> {
  <span class="hljs-attribute">scroll-margin-top</span>: <span class="hljs-number">5rem</span>;
}
</code></pre></div>
<p>跳过链接平时移出视觉区域，但获得焦点后必须出现，不能用 display:none 把它一起移出键盘路径。main 的 tabindex -1 用于成为跳转焦点目标，不是让每一段内容都进入 Tab 顺序。</p>
<p>focus-visible 可以为键盘等需要指示焦点的交互显示明确样式。不要先把所有 outline 删除，又忘记提供有效替代。颜色、粗细、与背景的对比，以及是否被固定头部或弹层挡住，都应在实际页面中检查。</p>
<h2>复合组件不一定让每个选项都占一个 Tab 位置</h2>
<p>单选组、菜单、标签页和列表框等组件常有自己的方向键模型。例如整个组件进入一次 Tab 顺序后，用户在内部用方向键移动，再用 Tab 离开。</p>
<p>常见实现方式有 roving tabindex，或者让 DOM 焦点保留在容器/输入框，再用 aria-activedescendant 表示活动项。应该遵循所选组件模式，不要同时让每个选项都可 Tab，又实现另一套不一致的方向键循环。</p>
<p>文本输入框中的左右键、Home、End、选词、复制粘贴和输入法候选操作也应保留。不能为了快捷键，把所有 keydown 一律 preventDefault；处理中英文组合输入时尤其要注意 isComposing 等状态。</p>
<h2>WCAG 2.2 新增的两条要求</h2>
<ul>
<li>2.4.11 焦点不被遮挡（最低，AA）：控件获得键盘焦点时，不能被页面自己的内容（吸顶导航、Cookie 横幅、浮动聊天按钮）完全挡住。可以用 <code>scroll-padding-top</code> 给吸顶头部留出空间。</li>
<li>2.5.7 拖拽动作（AA）：所有靠拖拽完成的功能，都要能用单指针、不拖拽的方式完成，例如排序列表提供“上移/下移”按钮，滑块支持点击轨道。拖拽本身是必要的，或行为由浏览器决定时除外。</li>
</ul>
<h2>重点寻找“进得去，出不来”的位置</h2>
<p>普通区域不应把焦点困住。进入自定义菜单、编辑器或播放器后，用户应该能按约定方式离开。模态框可以有意限制背景交互，但必须提供清楚的关闭路径，关闭后回到合理位置。</p>
<p>检查隐藏与禁用状态时，不要只看外观。opacity 为 0 的元素仍可能可聚焦；aria-hidden 不会自动禁止键盘焦点；aria-disabled 也不会像原生 disabled 一样替你阻止行为。</p>
<p>折叠内容、未打开的菜单和被覆盖的背景，不应留下看不见的可操作控件。需要让一整片内容暂时不可交互时，可以考虑适合场景的 inert 或原生模态机制，同时核对浏览器支持。</p>
<h2>表单报错后，要能继续完成任务</h2>
<p>提交失败后，仅把边框变红不够。应有可理解的错误文本，并与字段关联；长表单还可以把焦点放到适当的错误摘要，提供回到具体字段的路径。</p>
<p>异步保存中禁用按钮时，也要考虑当前焦点与状态反馈。成功后删除当前聚焦的列表项，需要给焦点一个合理去处，而不是让它悄悄掉回文档起点。</p>
<p>不要通过自动频繁聚焦新结果打断正在输入的用户。动态内容的通知、焦点移动和可访问名称是不同机制，要根据任务需要配合使用。</p>
<h2>一次有意义的验收怎么做</h2>
<p>从页面顶部开始，分别用 Tab 和 Shift+Tab 检查正反顺序，再用 Enter、空格、方向键和 Escape 完成对应控件的交互。检查缩放、固定头部、长内容和移动键盘布局下，焦点是否仍可见、可理解。</p>
<p>键盘可操作不要求用户必须在极短时间内连按某组键，也不应只给鼠标拖动提供唯一入口；适合的任务可以提供移动按钮或其他键盘等价方式。自由绘画等确实依赖运动路径的功能有特定例外，但不能把所有拖拽都归为例外。</p>
<p>最后还要用目标浏览器与真实辅助技术走流程。自动化能发现部分名称、角色和焦点错误，却不能证明任务逻辑、读屏反馈和用户体验已经完整正确。</p>`};export{e as default};