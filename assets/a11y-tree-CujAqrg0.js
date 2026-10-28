var e={answerHtml:`<p>文件管理器、组织架构和权限目录都有父子层级。用户不仅要看见缩进，还要能用键盘展开、收起、移动和选择节点；读屏用户还要知道当前节点的层级、展开状态以及是否有子节点。</p>
<p>如果只是展示一棵静态目录，原生链接和标题结构往往更简单。只有当用户需要像树一样用方向键操作、展开折叠和选择节点时，才需要实现 Tree View 模式。<code>role=&quot;tree&quot;</code> 不会自动提供任何键盘行为。</p>
<h2>先把节点语义和状态分开</h2>
<p>典型结构是容器使用 <code>role=&quot;tree&quot;</code>，可操作节点使用 <code>role=&quot;treeitem&quot;</code>，子节点容器使用 <code>role=&quot;group&quot;</code>。拥有子节点的节点要表达 <code>aria-expanded</code>；可多选树还要明确 <code>aria-multiselectable</code> 与 <code>aria-selected</code> 的关系。</p>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">ul</span> <span class="hljs-attr">id</span>=<span class="hljs-string">&quot;file-tree&quot;</span> <span class="hljs-attr">role</span>=<span class="hljs-string">&quot;tree&quot;</span> <span class="hljs-attr">aria-label</span>=<span class="hljs-string">&quot;项目文件&quot;</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">li</span> <span class="hljs-attr">role</span>=<span class="hljs-string">&quot;treeitem&quot;</span> <span class="hljs-attr">aria-expanded</span>=<span class="hljs-string">&quot;true&quot;</span> <span class="hljs-attr">aria-level</span>=<span class="hljs-string">&quot;1&quot;</span> <span class="hljs-attr">tabindex</span>=<span class="hljs-string">&quot;0&quot;</span>&gt;</span>
    src
    <span class="hljs-tag">&lt;<span class="hljs-name">ul</span> <span class="hljs-attr">role</span>=<span class="hljs-string">&quot;group&quot;</span>&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">li</span> <span class="hljs-attr">role</span>=<span class="hljs-string">&quot;treeitem&quot;</span> <span class="hljs-attr">aria-level</span>=<span class="hljs-string">&quot;2&quot;</span> <span class="hljs-attr">tabindex</span>=<span class="hljs-string">&quot;-1&quot;</span>&gt;</span>main.ts<span class="hljs-tag">&lt;/<span class="hljs-name">li</span>&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">li</span> <span class="hljs-attr">role</span>=<span class="hljs-string">&quot;treeitem&quot;</span> <span class="hljs-attr">aria-level</span>=<span class="hljs-string">&quot;2&quot;</span> <span class="hljs-attr">tabindex</span>=<span class="hljs-string">&quot;-1&quot;</span>&gt;</span>styles.css<span class="hljs-tag">&lt;/<span class="hljs-name">li</span>&gt;</span>
    <span class="hljs-tag">&lt;/<span class="hljs-name">ul</span>&gt;</span>
  <span class="hljs-tag">&lt;/<span class="hljs-name">li</span>&gt;</span>
<span class="hljs-tag">&lt;/<span class="hljs-name">ul</span>&gt;</span>
</code></pre></div>
<p><code>aria-level</code> 表达节点的逻辑层级，不一定等于 DOM 的嵌套深度；如果 DOM 结构已经完整，浏览器可能推断部分层级，但动态或虚拟树仍应按实现需要明确提供。<code>aria-posinset</code> 和 <code>aria-setsize</code> 在无法从 DOM 推断同级集合时也需要正确更新，不能用固定数字填充。</p>
<p><code>aria-expanded=&quot;false&quot;</code> 表示节点有可展开的子树但当前收起；叶节点通常不应伪造这个属性。节点是否被选中、是否有焦点和是否正在加载，也不是同一个状态，不能用一个 <code>selected</code> 布尔值承担全部含义。</p>
<h2>键盘行为要先选定模式</h2>
<p>单选树常见的按键规则如下：</p>
<table><thead><tr><th>按键</th><th>典型行为</th></tr></thead><tbody><tr><td>ArrowDown / ArrowUp</td><td>移动到下一个或上一个可见节点</td></tr><tr><td>ArrowRight</td><td>收起节点时展开；已展开时进入第一个可见子节点</td></tr><tr><td>ArrowLeft</td><td>已展开时收起；已收起时移动到父节点</td></tr><tr><td>Home / End</td><td>移到当前树的第一个或最后一个可见节点</td></tr><tr><td>Enter</td><td>执行节点的默认操作或选择节点，具体含义要统一</td></tr><tr><td><code>*</code></td><td>在支持该模式时展开当前层级的节点</td></tr><tr><td>字符键</td><td>按可见名称定位节点，可选但要明确支持范围</td></tr><tr><td>Tab</td><td>进入树时聚焦当前节点，离开树时离开整个控件</td></tr></tbody></table>
<p>树控件通常使用 roving tabindex：只有当前焦点节点是 <code>tabindex=&quot;0&quot;</code>，其他可见节点为 <code>-1</code>。方向键移动时更新 DOM focus 和 tabindex，不能让几十个节点同时进入页面 Tab 顺序。另一种方案是让焦点留在树容器，通过 <code>aria-activedescendant</code> 指向活动节点，但这要求活动节点始终存在且 ID 稳定。</p>
<p>不要把所有方向键都无条件拦截。树节点如果是链接或包含可编辑控件，要明确树导航与原生操作如何协调；文本输入法、浏览器查找和辅助技术快捷键也不能被粗暴吞掉。</p>
<h2>一个最小的焦点移动实现</h2>
<p>下面只演示静态、单选树的可见节点导航。真实项目还要处理展开状态、动态加载和业务选择；函数不会把任意后代元素当成树节点：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">bindTreeNavigation</span>(<span class="hljs-params">tree</span>) {
  <span class="hljs-keyword">const</span> controller = <span class="hljs-keyword">new</span> <span class="hljs-title class_">AbortController</span>();

  <span class="hljs-keyword">function</span> <span class="hljs-title function_">items</span>(<span class="hljs-params"></span>) {
    <span class="hljs-keyword">return</span> [...tree.<span class="hljs-title function_">querySelectorAll</span>(<span class="hljs-string">&#x27;[role=&quot;treeitem&quot;]&#x27;</span>)]
      .<span class="hljs-title function_">filter</span>(<span class="hljs-function">(<span class="hljs-params">item</span>) =&gt;</span> !item.<span class="hljs-title function_">closest</span>(<span class="hljs-string">&#x27;[hidden]&#x27;</span>));
  }

  <span class="hljs-keyword">function</span> <span class="hljs-title function_">focusItem</span>(<span class="hljs-params">item</span>) {
    <span class="hljs-keyword">const</span> visible = <span class="hljs-title function_">items</span>();
    <span class="hljs-keyword">if</span> (!visible.<span class="hljs-title function_">includes</span>(item)) <span class="hljs-keyword">return</span>;
    visible.<span class="hljs-title function_">forEach</span>(<span class="hljs-function">(<span class="hljs-params">node</span>) =&gt;</span> node.<span class="hljs-title function_">setAttribute</span>(<span class="hljs-string">&#x27;tabindex&#x27;</span>, node === item ? <span class="hljs-string">&#x27;0&#x27;</span> : <span class="hljs-string">&#x27;-1&#x27;</span>));
    item.<span class="hljs-title function_">focus</span>();
  }

  tree.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;keydown&#x27;</span>, <span class="hljs-function">(<span class="hljs-params">event</span>) =&gt;</span> {
    <span class="hljs-keyword">const</span> current = event.<span class="hljs-property">target</span>.<span class="hljs-title function_">closest</span>(<span class="hljs-string">&#x27;[role=&quot;treeitem&quot;]&#x27;</span>);
    <span class="hljs-keyword">if</span> (!current || !tree.<span class="hljs-title function_">contains</span>(current)) <span class="hljs-keyword">return</span>;

    <span class="hljs-keyword">const</span> visible = <span class="hljs-title function_">items</span>();
    <span class="hljs-keyword">const</span> index = visible.<span class="hljs-title function_">indexOf</span>(current);
    <span class="hljs-keyword">if</span> (index &lt; <span class="hljs-number">0</span>) <span class="hljs-keyword">return</span>;

    <span class="hljs-keyword">let</span> next;
    <span class="hljs-keyword">if</span> (event.<span class="hljs-property">key</span> === <span class="hljs-string">&#x27;ArrowDown&#x27;</span>) next = visible[index + <span class="hljs-number">1</span>];
    <span class="hljs-keyword">if</span> (event.<span class="hljs-property">key</span> === <span class="hljs-string">&#x27;ArrowUp&#x27;</span>) next = visible[index - <span class="hljs-number">1</span>];
    <span class="hljs-keyword">if</span> (event.<span class="hljs-property">key</span> === <span class="hljs-string">&#x27;Home&#x27;</span>) next = visible[<span class="hljs-number">0</span>];
    <span class="hljs-keyword">if</span> (event.<span class="hljs-property">key</span> === <span class="hljs-string">&#x27;End&#x27;</span>) next = visible.<span class="hljs-title function_">at</span>(-<span class="hljs-number">1</span>);
    <span class="hljs-keyword">if</span> (!next) <span class="hljs-keyword">return</span>;

    event.<span class="hljs-title function_">preventDefault</span>();
    <span class="hljs-title function_">focusItem</span>(next);
  }, { <span class="hljs-attr">signal</span>: controller.<span class="hljs-property">signal</span> });

  <span class="hljs-keyword">return</span> <span class="hljs-function">() =&gt;</span> controller.<span class="hljs-title function_">abort</span>();
}
</code></pre></div>
<p>示例通过 <code>[hidden]</code> 排除收起子树，但真实项目可能使用 <code>aria-hidden</code>、虚拟化或完全移除节点；仅设置透明度和 <code>pointer-events:none</code> 不会让内容从可访问性树中消失。节点列表发生变化后，还要检查当前焦点节点是否仍存在，必要时把焦点移到父节点或合理的相邻节点。</p>
<h2>选择、聚焦和激活是三件事</h2>
<p>树可能是导航树、单选树、多选树或文件选择器。导航树的 Enter 可能打开链接；文件树的 Enter 可能进入编辑；多选树还要定义是否使用 Ctrl/Command、Shift 或 <code>aria-selected</code> 的锚点范围。不能把“获得焦点”自动当成“已选中”，也不能让鼠标和键盘使用不同的选择规则。</p>
<p>如果树节点有复选框，优先让复选框承担可操作语义，并明确父节点的全选、部分选中和禁用状态。把复选框视觉上画在 treeitem 里，却让整个节点同时拥有互相冲突的点击和键盘行为，会让读屏和指针操作都难以预测。</p>
<p>拖放排序、上下文菜单和批量操作也应提供键盘路径。只支持鼠标拖动的树不能称为完整的可访问文件管理器。</p>
<h2>异步子节点要处理过期结果</h2>
<p>点击展开目录后，子节点可能需要请求服务器。加载中、空目录、加载失败和已展开不是同一个状态；“正在加载”不应伪装成可以被 Enter 选中的文件节点。</p>
<p>请求要绑定节点 ID 和当前展开代次。用户快速收起、切换账号或重新加载目录后，旧响应不能把子节点写回新状态。取消请求可以节省资源，但仍需要版本检查，因为并非所有数据源都支持取消。</p>
<p>树的权限也不能由隐藏节点代替。服务端返回的目录和文件仍需按当前用户授权；前端没有显示某节点不代表接口不会被直接调用。懒加载错误应保留重试入口，并让用户知道是目录加载失败，而不是把整个树变成空白。</p>
<h2>虚拟树和无障碍信息要同步</h2>
<p>大型树可能只渲染可见节点，但活动节点必须真实存在，<code>aria-activedescendant</code> 不能指向已经卸载的元素。滚动到目标节点时，应先更新窗口、等待节点挂载，再设置焦点或活动后代。</p>
<p>如果 <code>aria-setsize</code>、<code>aria-posinset</code> 或层级信息来自服务端，插入、删除和过滤后必须重新计算。把当前屏幕上的 20 个节点都写成 <code>posinset=1..20</code>，会让用户误以为整棵树只有 20 项。</p>
<h2>验收不能只看 DOM 属性</h2>
<p>至少要用键盘完成进入树、上下移动、展开、收起、选择和离开；再测试空目录、错误重试、异步竞态、长名称、重复名称、禁用节点、窄屏和文字放大。用常用读屏器确认树名称、节点层级、展开状态和选择状态是否能被理解。</p>
<p>自动化检查可以发现缺少角色、重复 ID 或无法聚焦的节点，但不能替代真实读屏路径。若原生列表、链接和按钮已经能完成任务，优先保留原生语义；只有确实需要树导航时，才承担完整 Tree View 契约。</p>`};export{e as default};