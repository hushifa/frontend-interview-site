var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>后台系统里到处是表格：订单列表、用户列表、日志列表，都有表头、排序、分页、勾选，只是列不一样。通用表格组件要让每个页面只写“有哪些列、数据从哪来”，其余交给组件。</p>
<p>核心接口是两样东西：<code>columns</code> 列配置，每列写标题、取哪个字段、怎么渲染、能不能排序；<code>dataSource</code> 数据数组，每行一个对象。单元格内容通过列上的 <code>render</code> 函数交给调用方，这样状态标签、操作按钮都能自定义，组件不用为每种需求加参数。</p>
<p>排序、筛选、分页、勾选这些状态，组件可以自己管（非受控），也可以由外部传入、变化时通过回调通知（受控）。数据在服务端分页和排序时必须受控，因为组件手里只有当前一页，排不了全部数据。每行还要有稳定的 <code>rowKey</code>，勾选和展开状态才能对上行。</p>
<p>要注意，表格首先是表格：用原生 <code>&lt;table&gt;</code>、<code>&lt;th&gt;</code> 和 <code>scope</code> 保留语义，排序列用 <code>aria-sort</code> 告诉读屏用户；数据上万行时再加虚拟滚动，但虚拟滚动会让读屏用户和浏览器搜索找不到没渲染的行，要权衡。</p>
</blockquote>
<h2>列配置应该长什么样</h2>
<p>先看调用方怎么用。下面是一个订单表格：</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">const</span> columns = [
  { <span class="hljs-attr">key</span>: <span class="hljs-string">&#x27;id&#x27;</span>, <span class="hljs-attr">title</span>: <span class="hljs-string">&#x27;订单号&#x27;</span>, <span class="hljs-attr">dataIndex</span>: <span class="hljs-string">&#x27;id&#x27;</span> },
  { <span class="hljs-attr">key</span>: <span class="hljs-string">&#x27;amount&#x27;</span>, <span class="hljs-attr">title</span>: <span class="hljs-string">&#x27;金额&#x27;</span>, <span class="hljs-attr">dataIndex</span>: <span class="hljs-string">&#x27;amount&#x27;</span>, <span class="hljs-attr">sorter</span>: <span class="hljs-literal">true</span>, <span class="hljs-attr">align</span>: <span class="hljs-string">&#x27;right&#x27;</span> },
  {
    <span class="hljs-attr">key</span>: <span class="hljs-string">&#x27;status&#x27;</span>,
    <span class="hljs-attr">title</span>: <span class="hljs-string">&#x27;状态&#x27;</span>,
    <span class="hljs-attr">dataIndex</span>: <span class="hljs-string">&#x27;status&#x27;</span>,
    <span class="hljs-attr">render</span>: <span class="hljs-function">(<span class="hljs-params">value</span>) =&gt;</span> <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">StatusTag</span> <span class="hljs-attr">status</span>=<span class="hljs-string">{value}</span> /&gt;</span></span>,
  },
  {
    <span class="hljs-attr">key</span>: <span class="hljs-string">&#x27;action&#x27;</span>,
    <span class="hljs-attr">title</span>: <span class="hljs-string">&#x27;操作&#x27;</span>,
    <span class="hljs-attr">render</span>: <span class="hljs-function">(<span class="hljs-params">_, row</span>) =&gt;</span> <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">button</span> <span class="hljs-attr">onClick</span>=<span class="hljs-string">{()</span> =&gt;</span> openDetail(row.id)}&gt;查看<span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span></span>,
  },
];

<span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">Table</span> <span class="hljs-attr">columns</span>=<span class="hljs-string">{columns}</span> <span class="hljs-attr">dataSource</span>=<span class="hljs-string">{orders}</span> <span class="hljs-attr">rowKey</span>=<span class="hljs-string">&quot;id&quot;</span> /&gt;</span></span>;
</code></pre></div>
<p>每列的 <code>dataIndex</code> 说明从行数据的哪个字段取值，<code>render</code> 接收这个值和整行数据，返回要显示的内容。没有 <code>render</code> 的列直接显示值。<code>key</code> 是列的标识，排序、隐藏列、调整列宽都靠它找到对应的列。</p>
<p>为什么用 <code>render</code> 函数，而不是给组件加 <code>statusType</code>、<code>showButton</code> 这类参数？因为单元格的需求是无穷的，参数永远加不完。把渲染权交给调用方，组件只负责布局和通用功能，这叫控制反转。</p>
<h2>排序和分页的状态由谁管</h2>
<p>数据都在前端、量也不大时，组件可以自己管排序和分页：用户点表头，组件内部记下排序列和方向，对 <code>dataSource</code> 排序后再切出当前页。调用方什么都不用写。</p>
<p>数据在服务端时就不行了。组件手里只有当前这一页，在前端排序只能排这一页，结果是错的。这时要把状态交给外部：</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx">&lt;<span class="hljs-title class_">Table</span>
  columns={columns}
  dataSource={page.<span class="hljs-property">items</span>}
  rowKey=<span class="hljs-string">&quot;id&quot;</span>
  sort={sort}                 <span class="hljs-comment">// { key: &#x27;amount&#x27;, order: &#x27;descend&#x27; }</span>
  pagination={{ current, pageSize, <span class="hljs-attr">total</span>: page.<span class="hljs-property">total</span> }}
  onChange={<span class="hljs-function">(<span class="hljs-params">{ sort, pagination }</span>) =&gt;</span> <span class="hljs-title function_">fetchOrders</span>({ sort, ...pagination })}
/&gt;
</code></pre></div>
<p>组件只负责显示传进来的状态，用户操作时通过 <code>onChange</code> 告诉外部“想按金额降序”“想看第 3 页”，外部请求新数据再传回来。这和表单输入框的受控、非受控是同一个思路。</p>
<p>受控的另一个好处是能把状态同步到地址栏，刷新或分享链接后还是同样的排序和页码，见<a href="/questions/api-url-search-params/">《URLSearchParams 怎样处理筛选状态、重复参数和编码？》</a>。</p>
<h2>rowKey 为什么必须稳定</h2>
<p>勾选、展开、行内编辑这些状态，都要记住“是哪一行”。如果用数组下标当标识，排序或翻页后下标对应的是另一行，勾选状态就跑到别的行上了。所以要求调用方传 <code>rowKey</code>，指定用哪个字段当唯一标识，通常是数据库 ID。在 React 里它也直接用作行的 <code>key</code>，原因见<a href="/questions/react-key/">《列表中的 key 为什么不能随意使用数组下标？》</a>。</p>
<p>跨页勾选时，组件内部要用 <code>rowKey</code> 的集合记录已选的行，而不是记录当前页的行对象，翻页回来才能恢复勾选。</p>
<h2>语义和无障碍要做什么</h2>
<p>尽量渲染成原生的 <code>&lt;table&gt;</code>。MDN 说明 <code>&lt;table&gt;</code> 表示表格数据，也就是由行和列组成的二维信息；<code>&lt;th&gt;</code> 定义表头单元格，它是哪组单元格的表头，由 <code>scope</code> 和 <code>headers</code> 属性决定。列表头写 <code>scope=&quot;col&quot;</code>，行表头写 <code>scope=&quot;row&quot;</code>，读屏软件读到某个单元格时，就能同时念出它属于哪一列。</p>
<p>用 <code>div</code> 加 CSS 拼出来的表格，看起来一样，读屏用户却只听到一串没有关系的文字。</p>
<p>排序列要加 <code>aria-sort</code>。MDN 说明，表格支持排序时，在当前排序列的表头上设 <code>aria-sort=&quot;ascending&quot;</code> 或 <code>&quot;descending&quot;</code>；它应该只出现在一个表头上，换了排序列就移到新的表头；它只告诉辅助技术哪一列已排序，不会改变实际的排列顺序。排序触发器要放在表头里的 <code>&lt;button&gt;</code> 上，键盘才能操作。</p>
<p>还有一点：只是展示数据的表格，不要随手加 <code>role=&quot;grid&quot;</code>。MDN 说明 grid 角色是一种复合控件，单元格可以用方向键在二维方向上移动焦点，需要自己实现整套键盘交互。只有像电子表格那样需要在单元格之间导航编辑时才用。表格无障碍的细节见<a href="/questions/a11y-table/">《数据表格怎样设计才方便键盘和读屏用户理解？》</a>。</p>
<h2>数据量大时怎样保证流畅</h2>
<p>几百行直接渲染没问题。上千行以后，同时存在的 DOM 节点太多，滚动和更新都会卡，这时可以用虚拟滚动，只渲染可视区附近的行，原理见<a href="/questions/perf-virtual-list/">《虚拟列表通过什么方式减少渲染成本？》</a>。</p>
<p>表格做虚拟滚动比普通列表麻烦：行高可能不一样，要测量；固定表头和固定列要和滚动区域同步；列宽要在表头和表体之间保持一致，常用 <code>table-layout: fixed</code> 或者自己计算列宽。</p>
<p>虚拟滚动也有代价。没渲染的行不在 DOM 里，浏览器的页内搜索找不到，读屏软件也读不到，总行数要用 <code>aria-rowcount</code> 等属性另外告诉辅助技术。所以能分页的场景，分页往往比虚拟滚动更简单、更易用。</p>
<h2>常见追问</h2>
<p><strong>表格组件要不要内置请求数据的逻辑？</strong></p>
<blockquote>
<p>一般不内置。组件只负责展示和交互，请求放在外部或者一个单独的 Hook 里，比如 <code>useTable(fetcher)</code> 返回 <code>dataSource</code>、<code>pagination</code>、<code>onChange</code> 直接传给表格。这样表格能用在任何数据来源上，请求逻辑也能单独测试。</p>
</blockquote>
<p><strong>列很多时怎样让用户自定义显示哪些列？</strong></p>
<blockquote>
<p>列配置里每列有唯一的 <code>key</code>，组件维护一个“可见列 key 列表”，渲染时过滤 <code>columns</code>。用户的选择可以按页面存到 <code>localStorage</code>。列的顺序和宽度也是同样的做法。</p>
</blockquote>
<p><strong>单元格里的内容太长怎么办？</strong></p>
<blockquote>
<p>常见做法是单行省略，配合悬浮提示显示全文。但悬浮提示对键盘和触屏用户不友好，重要信息最好允许换行，或者在详情页里完整显示。</p>
</blockquote>`};export{e as default};