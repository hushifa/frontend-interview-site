var e={answerHtml:`<p>订单列表、成绩表和库存明细都有行与列，但“能看见网格”不等于用户能理解每个单元格属于哪个标题。读屏用户通常按表头、行和单元格移动，键盘用户还需要完成排序、筛选和查看详情等操作。</p>
<p>先判断内容是否真的有二维关系。如果只是把几个字段排成两列的表单或卡片，使用普通的标题、列表和字段结构通常更合适；不要为了视觉对齐把所有内容包成 table。</p>
<h2>原生表格先把结构说清楚</h2>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">table</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">caption</span>&gt;</span>2026 年 10 月订单<span class="hljs-tag">&lt;/<span class="hljs-name">caption</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">thead</span>&gt;</span>
    <span class="hljs-tag">&lt;<span class="hljs-name">tr</span>&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">th</span> <span class="hljs-attr">scope</span>=<span class="hljs-string">&quot;col&quot;</span>&gt;</span>订单号<span class="hljs-tag">&lt;/<span class="hljs-name">th</span>&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">th</span> <span class="hljs-attr">scope</span>=<span class="hljs-string">&quot;col&quot;</span>&gt;</span>客户<span class="hljs-tag">&lt;/<span class="hljs-name">th</span>&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">th</span> <span class="hljs-attr">scope</span>=<span class="hljs-string">&quot;col&quot;</span>&gt;</span>金额<span class="hljs-tag">&lt;/<span class="hljs-name">th</span>&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">th</span> <span class="hljs-attr">scope</span>=<span class="hljs-string">&quot;col&quot;</span>&gt;</span>状态<span class="hljs-tag">&lt;/<span class="hljs-name">th</span>&gt;</span>
    <span class="hljs-tag">&lt;/<span class="hljs-name">tr</span>&gt;</span>
  <span class="hljs-tag">&lt;/<span class="hljs-name">thead</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">tbody</span>&gt;</span>
    <span class="hljs-tag">&lt;<span class="hljs-name">tr</span>&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">th</span> <span class="hljs-attr">scope</span>=<span class="hljs-string">&quot;row&quot;</span>&gt;</span>A-1024<span class="hljs-tag">&lt;/<span class="hljs-name">th</span>&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">td</span>&gt;</span>林晓<span class="hljs-tag">&lt;/<span class="hljs-name">td</span>&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">td</span>&gt;</span>¥128.00<span class="hljs-tag">&lt;/<span class="hljs-name">td</span>&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">td</span>&gt;</span>已发货<span class="hljs-tag">&lt;/<span class="hljs-name">td</span>&gt;</span>
    <span class="hljs-tag">&lt;/<span class="hljs-name">tr</span>&gt;</span>
  <span class="hljs-tag">&lt;/<span class="hljs-name">tbody</span>&gt;</span>
<span class="hljs-tag">&lt;/<span class="hljs-name">table</span>&gt;</span>
</code></pre></div>
<p><code>caption</code> 给表格一个可发现的标题，列标题使用 <code>th scope=&quot;col&quot;</code>，把订单号作为行标题时使用 <code>th scope=&quot;row&quot;</code>。这样辅助技术在读取“金额”或“状态”时，能把单元格放回相应的行列关系中。</p>
<p>简单的规则可以直接用 <code>scope</code> 表达。多层表头、跨行跨列或一个单元格同时属于多个标题时，可能需要稳定的 <code>id</code> 与 <code>headers</code> 关系：</p>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">th</span> <span class="hljs-attr">id</span>=<span class="hljs-string">&quot;q1&quot;</span> <span class="hljs-attr">colspan</span>=<span class="hljs-string">&quot;2&quot;</span>&gt;</span>第一季度<span class="hljs-tag">&lt;/<span class="hljs-name">th</span>&gt;</span>
<span class="hljs-tag">&lt;<span class="hljs-name">th</span> <span class="hljs-attr">id</span>=<span class="hljs-string">&quot;income&quot;</span> <span class="hljs-attr">scope</span>=<span class="hljs-string">&quot;col&quot;</span>&gt;</span>收入<span class="hljs-tag">&lt;/<span class="hljs-name">th</span>&gt;</span>
<span class="hljs-tag">&lt;<span class="hljs-name">th</span> <span class="hljs-attr">id</span>=<span class="hljs-string">&quot;expense&quot;</span> <span class="hljs-attr">scope</span>=<span class="hljs-string">&quot;col&quot;</span>&gt;</span>支出<span class="hljs-tag">&lt;/<span class="hljs-name">th</span>&gt;</span>
<span class="hljs-tag">&lt;<span class="hljs-name">td</span> <span class="hljs-attr">headers</span>=<span class="hljs-string">&quot;q1 income&quot;</span>&gt;</span>1200<span class="hljs-tag">&lt;/<span class="hljs-name">td</span>&gt;</span>
<span class="hljs-tag">&lt;<span class="hljs-name">td</span> <span class="hljs-attr">headers</span>=<span class="hljs-string">&quot;q1 expense&quot;</span>&gt;</span>800<span class="hljs-tag">&lt;/<span class="hljs-name">td</span>&gt;</span>
</code></pre></div>
<p>不要为了让源码“更语义化”而同时堆叠互相矛盾的 <code>scope</code>、<code>headers</code> 和大量 ARIA。先用浏览器的可访问性树确认实际关联结果，复杂表头也应在目标读屏器中验证。</p>
<h2>表格中的操作控件要保留自己的名称</h2>
<p>每行都有“查看”和“删除”按钮时，按钮名称不能全部只有“操作”或“点击这里”。可以让可见名称包含订单号，或者通过 <code>aria-labelledby</code> 关联该行的标题：</p>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">tr</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">th</span> <span class="hljs-attr">id</span>=<span class="hljs-string">&quot;order-a1024&quot;</span> <span class="hljs-attr">scope</span>=<span class="hljs-string">&quot;row&quot;</span>&gt;</span>A-1024<span class="hljs-tag">&lt;/<span class="hljs-name">th</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">td</span>&gt;</span>林晓<span class="hljs-tag">&lt;/<span class="hljs-name">td</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">td</span>&gt;</span>
    <span class="hljs-tag">&lt;<span class="hljs-name">button</span> <span class="hljs-attr">type</span>=<span class="hljs-string">&quot;button&quot;</span> <span class="hljs-attr">aria-labelledby</span>=<span class="hljs-string">&quot;view-a1024 order-a1024&quot;</span>&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">span</span> <span class="hljs-attr">id</span>=<span class="hljs-string">&quot;view-a1024&quot;</span>&gt;</span>查看<span class="hljs-tag">&lt;/<span class="hljs-name">span</span>&gt;</span>
    <span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span>
  <span class="hljs-tag">&lt;/<span class="hljs-name">td</span>&gt;</span>
<span class="hljs-tag">&lt;/<span class="hljs-name">tr</span>&gt;</span>
</code></pre></div>
<p>真实页面不能复制相同的 ID。更简单的做法是使用可见文本“查看订单 A-1024”，并在按钮点击时从稳定的数据 ID 发起操作。数据 ID 是业务参数，不是服务端授权凭据，接口仍要检查当前用户权限。</p>
<p>表格滚动、固定列和虚拟化也不能破坏表头关系。若使用虚拟列表，当前焦点单元格必须仍存在，<code>aria-activedescendant</code> 不能指向已经卸载的节点；如果内容需要全文查找、打印或复制，分页或普通文档结构可能比虚拟化更合适。</p>
<h2>排序要同时表达方向和结果</h2>
<p>可排序列的按钮应有可操作名称，当前排序列可以使用 <code>aria-sort</code> 表达方向：</p>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">th</span> <span class="hljs-attr">scope</span>=<span class="hljs-string">&quot;col&quot;</span> <span class="hljs-attr">aria-sort</span>=<span class="hljs-string">&quot;ascending&quot;</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">button</span> <span class="hljs-attr">type</span>=<span class="hljs-string">&quot;button&quot;</span>&gt;</span>金额<span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span>
<span class="hljs-tag">&lt;/<span class="hljs-name">th</span>&gt;</span>
</code></pre></div>
<p><code>aria-sort</code> 描述当前表格的排序状态，不是让浏览器自动排序。点击后应用必须真正更新数据顺序，并同步修改属性；没有排序的列通常不应都写成 ascending 或 descending。</p>
<p>排序字段要有稳定规则。数字、日期、大小写、空值和本地化文本不能都按字符串比较。排序请求发到服务端时，应使用允许的字段白名单，不能把列名直接拼进 SQL 或任意查询语句。</p>
<p>更新表格后，用户还需要知道发生了什么。可以在合适的状态区域简短说明“已按金额降序排列”，但不要每次单元格变化都使用高优先级播报。焦点通常应留在触发排序的按钮上，不要因为数据重排就把用户强行送到表格顶部。</p>
<h2>筛选、分页和加载状态要有清楚的语义</h2>
<p>筛选后应更新表格标题或状态信息，例如结果数量、当前条件和无结果状态。空结果不是加载失败，也不是把表头和整张表隐藏后留下一片空白。加载下一页时，如果已有数据仍然可读，可以保留表格并在状态区域说明正在更新。</p>
<p>如果筛选会改变 URL，应让刷新和分享能恢复相同条件；如果只是临时输入，则要区分尚未提交的输入和已经生效的筛选。请求返回顺序不一定等于输入顺序，旧结果不能覆盖最新筛选。</p>
<p>单元格中的省略号、颜色和图标不能成为唯一信息来源。金额变化、错误状态和库存告警要有文字或可访问名称；对装饰图标使用空替代文本，避免读屏重复读取无意义内容。</p>
<h2>响应式处理不要简单把表格压成难以理解的卡片</h2>
<p>窄屏下可以让表格横向滚动，并给滚动区域可发现的说明；也可以针对真正的业务需求重排成每条记录的字段列表。若改成卡片，仍要保留字段名称、记录关系、排序和操作顺序，不能只依靠 CSS <code>display: block</code> 改变视觉排列。</p>
<p>固定表头、横向滚动和高对比模式要一起测试。焦点不能被裁剪在不可见的滚动区域，键盘用户要能到达每个操作。触摸设备上还要保证横向滚动不会被某个拖拽手势完全拦截。</p>
<h2>什么时候应该用 grid，而不是 table</h2>
<p>可编辑排班表、电子表格和复杂键盘导航网格，可能需要 <code>role=&quot;grid&quot;</code> 及一套明确的单元格、行、方向键和焦点模型。<code>role=&quot;grid&quot;</code> 不会自动提供这些行为，反而会让开发者承担 roving tabindex、当前单元格、编辑模式和读屏反馈。</p>
<p>如果用户只是阅读和点击每行一个链接，原生 table 加普通控件通常更可靠。只有当二维键盘编辑确实是核心任务时，才考虑采用 WAI-ARIA Grid 模式或经过验证的组件库，并按目标浏览器和读屏器测试。</p>
<p>自动化工具可以发现缺少名称、重复 ID 或部分结构错误，却不能证明表头朗读顺序和业务文案易于理解。验收至少应覆盖：键盘移动、排序、筛选、空结果、加载失败、长文本、窄屏、放大文字和一个常用读屏器。表格的目标是让用户知道“我正在看哪条记录、哪一列、当前状态是什么”，不是让 DOM 看起来拥有更多 ARIA 属性。</p>`};export{e as default};