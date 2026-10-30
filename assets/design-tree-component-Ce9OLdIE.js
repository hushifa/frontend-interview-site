var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>比如一个组织架构树，公司下面有部门，部门下面有小组和员工。数据是嵌套的，但页面上显示出来其实是一行一行的列表，只是每行缩进不同。所以树组件的核心做法是：按当前哪些节点展开了，把嵌套数据拍平成一维数组，每一项记下自己的层级，渲染时按层级缩进。</p>
<p>拍平以后，树就变成了普通列表。节点上万时直接对这个数组做虚拟列表，只渲染可视区域里的几十行；展开或收起一个节点，只是重新算一遍数组。子节点很多或者要从接口取时，可以在第一次展开时再懒加载。</p>
<p>带勾选的树还要做联动。勾选一个节点，它的子孙要全部跟着变；父节点则要根据子节点重新算：全部选中就是选中，全部没选就是未选，部分选中就是半选。</p>
<p>要注意，半选只是显示状态，原生复选框的 indeterminate 只能用 JavaScript 设置，也不影响表单提交。无障碍方面要按 WAI-ARIA 的 tree 模式提供方向键操作；虚拟化后 DOM 里节点不全，还要给每个节点标上 aria-level、aria-setsize 和 aria-posinset。</p>
</blockquote>
<h2>为什么要把树拍平</h2>
<p>嵌套数据最直接的渲染方式是递归组件：每个节点渲染自己，再渲染一个子节点列表。节点少时这样没问题，可是要做虚拟滚动就很难，因为虚拟列表需要知道“第 1000 行是谁”，递归结构回答不了这个问题。</p>
<p>所以换个思路：用户看到的始终是一行一行的列表。只要从根开始深度优先遍历，遇到展开的节点才继续进入它的子节点，把经过的节点依次放进数组，就得到了当前可见的所有行。每一项带上 <code>level</code>，渲染时用 <code>padding-left: level * 缩进宽度</code> 就能显示出层级。</p>
<p>下面的例子实现了拍平和勾选联动，看两点：拍平只收集展开路径上的节点；勾选一个子节点后，父节点会变成半选。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> tree = [
  {
    <span class="hljs-attr">id</span>: <span class="hljs-string">&#x27;a&#x27;</span>,
    <span class="hljs-attr">label</span>: <span class="hljs-string">&#x27;研发部&#x27;</span>,
    <span class="hljs-attr">children</span>: [
      { <span class="hljs-attr">id</span>: <span class="hljs-string">&#x27;a1&#x27;</span>, <span class="hljs-attr">label</span>: <span class="hljs-string">&#x27;前端组&#x27;</span> },
      { <span class="hljs-attr">id</span>: <span class="hljs-string">&#x27;a2&#x27;</span>, <span class="hljs-attr">label</span>: <span class="hljs-string">&#x27;后端组&#x27;</span> },
    ],
  },
  { <span class="hljs-attr">id</span>: <span class="hljs-string">&#x27;b&#x27;</span>, <span class="hljs-attr">label</span>: <span class="hljs-string">&#x27;市场部&#x27;</span>, <span class="hljs-attr">children</span>: [{ <span class="hljs-attr">id</span>: <span class="hljs-string">&#x27;b1&#x27;</span>, <span class="hljs-attr">label</span>: <span class="hljs-string">&#x27;品牌组&#x27;</span> }] },
];

<span class="hljs-comment">// 建一次父节点索引，向上联动时不用每次重新遍历整棵树。</span>
<span class="hljs-keyword">const</span> parentOf = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Map</span>();
<span class="hljs-keyword">const</span> nodeOf = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Map</span>();
<span class="hljs-keyword">function</span> <span class="hljs-title function_">index</span>(<span class="hljs-params">nodes, parent</span>) {
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> node <span class="hljs-keyword">of</span> nodes) {
    nodeOf.<span class="hljs-title function_">set</span>(node.<span class="hljs-property">id</span>, node);
    parentOf.<span class="hljs-title function_">set</span>(node.<span class="hljs-property">id</span>, parent);
    <span class="hljs-keyword">if</span> (node.<span class="hljs-property">children</span>) <span class="hljs-title function_">index</span>(node.<span class="hljs-property">children</span>, node);
  }
}
<span class="hljs-title function_">index</span>(tree, <span class="hljs-literal">null</span>);

<span class="hljs-keyword">function</span> <span class="hljs-title function_">flatten</span>(<span class="hljs-params">nodes, expanded, level = <span class="hljs-number">0</span>, rows = []</span>) {
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> node <span class="hljs-keyword">of</span> nodes) {
    rows.<span class="hljs-title function_">push</span>({ <span class="hljs-attr">id</span>: node.<span class="hljs-property">id</span>, <span class="hljs-attr">label</span>: node.<span class="hljs-property">label</span>, level });
    <span class="hljs-keyword">if</span> (node.<span class="hljs-property">children</span> &amp;&amp; expanded.<span class="hljs-title function_">has</span>(node.<span class="hljs-property">id</span>)) {
      <span class="hljs-title function_">flatten</span>(node.<span class="hljs-property">children</span>, expanded, level + <span class="hljs-number">1</span>, rows);
    }
  }
  <span class="hljs-keyword">return</span> rows;
}

<span class="hljs-keyword">const</span> checked = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Set</span>();
<span class="hljs-keyword">function</span> <span class="hljs-title function_">setChecked</span>(<span class="hljs-params">node, value</span>) {
  <span class="hljs-comment">// 向下：子孙全部设成同一状态。</span>
  <span class="hljs-keyword">if</span> (value) checked.<span class="hljs-title function_">add</span>(node.<span class="hljs-property">id</span>);
  <span class="hljs-keyword">else</span> checked.<span class="hljs-title function_">delete</span>(node.<span class="hljs-property">id</span>);
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> child <span class="hljs-keyword">of</span> node.<span class="hljs-property">children</span> ?? []) <span class="hljs-title function_">setChecked</span>(child, value);
  <span class="hljs-comment">// 向上：按子节点重新计算父节点。</span>
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">let</span> p = parentOf.<span class="hljs-title function_">get</span>(node.<span class="hljs-property">id</span>); p; p = parentOf.<span class="hljs-title function_">get</span>(p.<span class="hljs-property">id</span>)) {
    <span class="hljs-keyword">if</span> (p.<span class="hljs-property">children</span>.<span class="hljs-title function_">every</span>(<span class="hljs-function">(<span class="hljs-params">c</span>) =&gt;</span> checked.<span class="hljs-title function_">has</span>(c.<span class="hljs-property">id</span>))) checked.<span class="hljs-title function_">add</span>(p.<span class="hljs-property">id</span>);
    <span class="hljs-keyword">else</span> checked.<span class="hljs-title function_">delete</span>(p.<span class="hljs-property">id</span>);
  }
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">stateOf</span>(<span class="hljs-params">node</span>) {
  <span class="hljs-keyword">if</span> (checked.<span class="hljs-title function_">has</span>(node.<span class="hljs-property">id</span>)) <span class="hljs-keyword">return</span> <span class="hljs-string">&#x27;checked&#x27;</span>;
  <span class="hljs-keyword">const</span> leaves = [];
  (<span class="hljs-keyword">function</span> <span class="hljs-title function_">collect</span>(<span class="hljs-params">n</span>) {
    <span class="hljs-keyword">if</span> (!n.<span class="hljs-property">children</span>) leaves.<span class="hljs-title function_">push</span>(n);
    <span class="hljs-keyword">else</span> n.<span class="hljs-property">children</span>.<span class="hljs-title function_">forEach</span>(collect);
  })(node);
  <span class="hljs-keyword">return</span> leaves.<span class="hljs-title function_">some</span>(<span class="hljs-function">(<span class="hljs-params">leaf</span>) =&gt;</span> checked.<span class="hljs-title function_">has</span>(leaf.<span class="hljs-property">id</span>)) ? <span class="hljs-string">&#x27;mixed&#x27;</span> : <span class="hljs-string">&#x27;unchecked&#x27;</span>;
}

<span class="hljs-keyword">const</span> rows = <span class="hljs-title function_">flatten</span>(tree, <span class="hljs-keyword">new</span> <span class="hljs-title class_">Set</span>([<span class="hljs-string">&#x27;a&#x27;</span>]));
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(rows.<span class="hljs-title function_">map</span>(<span class="hljs-function">(<span class="hljs-params">r</span>) =&gt;</span> <span class="hljs-string">&#x27;  &#x27;</span>.<span class="hljs-title function_">repeat</span>(r.<span class="hljs-property">level</span>) + r.<span class="hljs-property">label</span>).<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;|&#x27;</span>)); <span class="hljs-comment">// 研发部|  前端组|  后端组|市场部</span>

<span class="hljs-title function_">setChecked</span>(nodeOf.<span class="hljs-title function_">get</span>(<span class="hljs-string">&#x27;a1&#x27;</span>), <span class="hljs-literal">true</span>);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">stateOf</span>(nodeOf.<span class="hljs-title function_">get</span>(<span class="hljs-string">&#x27;a&#x27;</span>))); <span class="hljs-comment">// mixed</span>
<span class="hljs-title function_">setChecked</span>(nodeOf.<span class="hljs-title function_">get</span>(<span class="hljs-string">&#x27;a2&#x27;</span>), <span class="hljs-literal">true</span>);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">stateOf</span>(nodeOf.<span class="hljs-title function_">get</span>(<span class="hljs-string">&#x27;a&#x27;</span>))); <span class="hljs-comment">// checked</span>
<span class="hljs-title function_">setChecked</span>(nodeOf.<span class="hljs-title function_">get</span>(<span class="hljs-string">&#x27;a&#x27;</span>), <span class="hljs-literal">false</span>);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(checked.<span class="hljs-property">size</span>); <span class="hljs-comment">// 0</span>
</code></pre></div>
<p>只展开了“研发部”，所以“品牌组”没有出现在结果里。展开或收起一个节点时，只需要改 <code>expanded</code> 这个集合，再调用一次 <code>flatten</code>，拿到的新数组直接交给列表渲染。</p>
<h2>虚拟树怎样实现</h2>
<p>拍平以后的数组就是虚拟列表的数据源。行高固定时，根据 <code>scrollTop</code> 算出起止下标，只渲染这一段，外层用一个总高度等于“行数 × 行高”的容器撑出滚动条。这部分和普通虚拟列表完全一样，详见<a href="/questions/perf-virtual-list/">《定高虚拟列表怎样手写？怎样根据 scrollTop 算出要渲染哪几行？》</a>；如果节点里有多行文字导致高度不固定，见<a href="/questions/performance-virtual-list/">《动态高度的虚拟列表怎样处理测量、滚动锚点和焦点？》</a>。</p>
<p>节点有几十万时，每次展开都从根重新遍历会变慢。可以只处理变化的部分：展开一个节点，就把它的可见子孙插到数组中它的后面；收起时删掉它后面所有 <code>level</code> 比它大的连续行。</p>
<h2>子节点怎样懒加载</h2>
<p>数据量大或者要从接口取时，节点上只放一个“有子节点”的标记，用户第一次展开时再请求。这时要处理几个状态：请求中显示加载提示，失败了允许重试，已经加载过的不要重复请求。</p>
<p>懒加载还会影响勾选联动。父节点被勾选时子节点还没加载回来，加载完成后要让新子节点继承父节点的选中状态。同理，没加载的子树无法算半选，所以“选中了哪些节点”通常要同时保存显式勾选的父节点，而不是只存叶子。</p>
<h2>勾选联动为什么分向下和向上</h2>
<p>勾选一个节点，用户的意思是“这一整支都要”，所以要向下把子孙全部设成同一状态。父节点的状态则不是用户直接点的，而是由子节点推出来的，所以要沿着父链向上逐层重算。例子里先建了一个 <code>parentOf</code> 索引，向上找父节点就不用每次遍历整棵树。</p>
<p>半选只是一种显示。MDN 说明，原生复选框的 <code>indeterminate</code> 只能通过 JavaScript 的 <code>input.indeterminate = true</code> 设置，没有对应的 HTML 属性；它只改变外观，表单提交时看的仍然是 <code>checked</code>。所以在数据里，半选状态应该每次由子节点算出来，不要把它当成一个独立存储的值。</p>
<p>如果不用原生复选框，而是自己画一个，就要用 <code>role=&quot;checkbox&quot;</code> 加 <code>aria-checked=&quot;mixed&quot;</code> 告诉辅助技术这是半选。MDN 写明，<code>mixed</code> 值只被 <code>checkbox</code> 和 <code>menuitemcheckbox</code> 这类三态角色支持。</p>
<h2>无障碍要做什么</h2>
<p>WAI-ARIA 的 Tree View 模式规定了角色和键盘行为。整个容器是 <code>tree</code>，每个节点是 <code>treeitem</code>，父节点的子节点放在 <code>group</code> 里；父节点用 <code>aria-expanded</code> 标出展开或收起，叶子节点不要加这个属性，否则会被当成父节点。</p>
<p>键盘上，上下方向键在可见节点间移动焦点；右方向键展开收起的节点，已展开时移到第一个子节点；左方向键收起展开的节点，否则回到父节点；Home 和 End 跳到第一个和最后一个节点。</p>
<p>虚拟化后，DOM 里只有可视区域的节点，屏幕阅读器没法自己数出层级和位置。APG 要求这种情况下给每个节点都标上 <code>aria-level</code>、<code>aria-setsize</code> 和 <code>aria-posinset</code>。拍平时顺手把层级、兄弟总数和自己的序号算出来放在每一行上就行。</p>
<h2>常见追问</h2>
<p><strong>父节点勾选后，提交给后端的应该是哪些 ID？</strong></p>
<blockquote>
<p>看业务。权限树之类通常只要叶子节点；按部门圈人时，提交父节点更省也更能表达“以后新增的成员也算”。组件可以提供一个选项决定返回全部、只返回叶子，还是在整支选中时只返回最上层的父节点。</p>
</blockquote>
<p><strong>树组件的搜索怎样做？</strong></p>
<blockquote>
<p>在原始数据上找出匹配的节点，再把它们的所有祖先加入展开集合，最后照常拍平。不匹配且没有匹配子孙的节点直接过滤掉，这样用户能看到每个结果所在的路径。</p>
</blockquote>`};export{e as default};