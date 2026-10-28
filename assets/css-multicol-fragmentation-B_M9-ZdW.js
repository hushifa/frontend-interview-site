var e={answerHtml:`<p>一篇长文章想在宽屏上像报纸一样分成两栏，用 Grid 把正文容器设成两列，却发现整段文字仍然只在一个网格项里。原因是 Grid 排布的是项目，而多栏布局会把同一份连续内容拆成多个片段，让文字从一栏继续流入下一栏。</p>
<p>如果需求是卡片按行排列、每行对齐，优先考虑 Grid；如果需求是连续文章按栏阅读，多栏布局才与内容模型相符。不能只看两者都能显示“几列”，就认为它们可互换。</p>
<h2>栏宽是偏好，不是固定像素承诺</h2>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">article</span> <span class="hljs-attr">class</span>=<span class="hljs-string">&quot;story&quot;</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">h1</span>&gt;</span>城市散步路线<span class="hljs-tag">&lt;/<span class="hljs-name">h1</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">p</span>&gt;</span>第一段较长的路线说明……<span class="hljs-tag">&lt;/<span class="hljs-name">p</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">p</span>&gt;</span>第二段较长的路线说明……<span class="hljs-tag">&lt;/<span class="hljs-name">p</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">figure</span>&gt;</span>
    <span class="hljs-tag">&lt;<span class="hljs-name">img</span> <span class="hljs-attr">src</span>=<span class="hljs-string">&quot;route.jpg&quot;</span> <span class="hljs-attr">alt</span>=<span class="hljs-string">&quot;沿河步行路线示意图&quot;</span>&gt;</span>
    <span class="hljs-tag">&lt;<span class="hljs-name">figcaption</span>&gt;</span>路线总长约三公里。<span class="hljs-tag">&lt;/<span class="hljs-name">figcaption</span>&gt;</span>
  <span class="hljs-tag">&lt;/<span class="hljs-name">figure</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">p</span>&gt;</span>后续路线说明……<span class="hljs-tag">&lt;/<span class="hljs-name">p</span>&gt;</span>
<span class="hljs-tag">&lt;/<span class="hljs-name">article</span>&gt;</span>
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.story</span> {
  <span class="hljs-attribute">columns</span>: <span class="hljs-number">18rem</span> <span class="hljs-number">3</span>;
  <span class="hljs-attribute">column-gap</span>: <span class="hljs-number">2rem</span>;
  <span class="hljs-attribute">column-rule</span>: <span class="hljs-number">1px</span> solid <span class="hljs-number">#ccc</span>;
}
<span class="hljs-selector-class">.story</span> <span class="hljs-selector-tag">h1</span> { <span class="hljs-attribute">column-span</span>: all; }
<span class="hljs-selector-class">.story</span> <span class="hljs-selector-tag">figure</span> {
  <span class="hljs-attribute">margin</span>: <span class="hljs-number">0</span> <span class="hljs-number">0</span> <span class="hljs-number">1rem</span>;
  <span class="hljs-attribute">break-inside</span>: avoid;
}
<span class="hljs-selector-class">.story</span> <span class="hljs-selector-tag">img</span> { <span class="hljs-attribute">max-width</span>: <span class="hljs-number">100%</span>; <span class="hljs-attribute">height</span>: auto; }
<span class="hljs-keyword">@media</span> (<span class="hljs-attribute">max-width</span>: <span class="hljs-number">40rem</span>) {
  <span class="hljs-selector-class">.story</span> { <span class="hljs-attribute">columns</span>: auto <span class="hljs-number">1</span>; }
}
</code></pre></div>
<p>columns 是 column-width 与 column-count 的简写。这里希望栏宽接近 18rem，最多三栏；实际可用宽度还要扣除间隙，浏览器据此安排栏数和栏宽。在空间不足时不会硬塞三栏。column-rule 画在栏间隙里，不像额外的网格轨道那样再次占用一列宽度。</p>
<p>示例图片地址需替换为项目真实资源，内容也要足够长才能观察到分栏；两个短句不会凭空生成三份文章。</p>
<h2>内容先沿一栏向下，再继续到下一栏</h2>
<p>多栏中正文保持一条内容流。默认水平书写时通常先向下读完一栏，再进入下一栏；方向还受到 writing-mode 和 direction 影响。它不是按卡片逐行填满的 Grid。</p>
<p>因此把有编号的任务卡片放进 columns，视觉上横向看到的顺序可能并非 1、2、3。DOM 顺序、键盘焦点顺序和辅助技术阅读顺序也不会自动变成设计稿期待的横向顺序。对需要按行比较数据或逐项操作的列表，多栏可能并不合适。</p>
<h2>break-inside 是避免断开的请求</h2>
<p>图片与说明、短卡片可以设置 break-inside: avoid，尽量让它们留在同一栏，避免标题在上一栏而内容跑到下一栏。但内容若比可用片段还高，浏览器仍需按分片规则处理，不能把 avoid 当作无条件保证。</p>
<p>如果过多大块内容都要求不可断开，可能出现明显留白。应在真实长文案、字体放大和窄屏中检查，而不是给所有元素统一加 avoid。必要时对标题使用合适的 break-after 策略，让标题与后续正文尽量相邻。</p>
<p>column-span: all 可以让标题横跨全部栏，它会影响其前后内容的分栏与平衡，不是任意跨“两栏”的 Grid 跨轨道功能。需要精确控制每个项目的位置时应回到 Grid 或普通流布局。</p>
<h2>固定高度可能产生横向溢出的额外栏</h2>
<p>限定多栏容器高度后，内容不能无限向下延伸，可能继续生成容器外的栏。如果原本只想让文章自然增高，通常不要给它强行设置固定高度。column-fill 的平衡行为也应结合容器是否有确定块尺寸理解，不要把改变 fill 当成隐藏溢出的补丁。</p>
<p>长网址、代码块和大表格还可能在单栏内部溢出。允许文本换行、对代码提供横向滚动或让复杂区域不参与多栏，应按内容类型处理；overflow: hidden 可能直接裁掉读者需要的信息。</p>
<h2>什么时候值得使用</h2>
<p>文章、术语表等自然按栏流动的阅读内容适合多栏；仪表盘、对齐表单、卡片网格通常更适合 Grid/Flex。用 columns 模拟瀑布流虽然简便，但顺序和高度分配不等于专门的 masonry 布局。</p>
<p>基本多栏能力在现代浏览器较成熟，具体断栏、跨栏和打印行为仍要按目标版本验证。可先保留单栏可读正文，再用 CSS 增强；无需为分栏用 JavaScript 拆分段落，也不要复制同一份正文来填满各栏。</p>
<p>动态插入图片、字体加载和容器尺寸变化可能使多栏重新分片，影响滚动位置与布局成本。为图片预留尺寸，避免每次输入都重排巨大的多栏内容。外部正文仍按普通 HTML 安全规则处理，多栏样式不提供内容净化或脚本隔离。</p>`};export{e as default};