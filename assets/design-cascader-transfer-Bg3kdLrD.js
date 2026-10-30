var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>级联选择最常见的是选省市区：先选省，右边出现这个省的市，再选市，又出现区。数据本身是一棵树，组件把它按层摆成几列，选中哪一项，就拿它的子节点生成下一列。组件的值是从根到选中节点的路径，比如 <code>[&#x27;zhejiang&#x27;, &#x27;hangzhou&#x27;, &#x27;xihu&#x27;]</code>。</p>
<p>这样设计的原因是，同名的节点在不同上级下可能都有，只存最后一级的 ID 不够；而存路径以后，回显时按路径逐层找就能恢复每一列。子节点多或者要从接口取时，可以在选中某一项时再懒加载下一列。</p>
<p>穿梭框是左右两个可多选的列表，把左边勾选的项移到右边。实现时不要真的把数据从一个数组搬到另一个数组，而是只维护一个“已选 ID 集合”，两侧列表都从原始数据按这个集合过滤出来，这样顺序不会乱，搜索和全选也只是在过滤结果上操作。</p>
<p>要注意数据量。级联的搜索要先把每条路径拍平才能匹配；穿梭框数据上千时，每侧列表要做虚拟滚动。键盘操作上，两侧列表可以按 WAI-ARIA 的多选 listbox 模式实现。</p>
</blockquote>
<h2>级联选择的数据和值</h2>
<p>下面的例子做两件事：根据当前路径生成每一列要显示的选项；以及把树拍平成“完整路径”的列表，用来搜索。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> options = [
  {
    <span class="hljs-attr">value</span>: <span class="hljs-string">&#x27;zj&#x27;</span>,
    <span class="hljs-attr">label</span>: <span class="hljs-string">&#x27;浙江&#x27;</span>,
    <span class="hljs-attr">children</span>: [
      { <span class="hljs-attr">value</span>: <span class="hljs-string">&#x27;hz&#x27;</span>, <span class="hljs-attr">label</span>: <span class="hljs-string">&#x27;杭州&#x27;</span>, <span class="hljs-attr">children</span>: [{ <span class="hljs-attr">value</span>: <span class="hljs-string">&#x27;xh&#x27;</span>, <span class="hljs-attr">label</span>: <span class="hljs-string">&#x27;西湖区&#x27;</span> }] },
      { <span class="hljs-attr">value</span>: <span class="hljs-string">&#x27;nb&#x27;</span>, <span class="hljs-attr">label</span>: <span class="hljs-string">&#x27;宁波&#x27;</span> },
    ],
  },
  { <span class="hljs-attr">value</span>: <span class="hljs-string">&#x27;js&#x27;</span>, <span class="hljs-attr">label</span>: <span class="hljs-string">&#x27;江苏&#x27;</span>, <span class="hljs-attr">children</span>: [{ <span class="hljs-attr">value</span>: <span class="hljs-string">&#x27;nj&#x27;</span>, <span class="hljs-attr">label</span>: <span class="hljs-string">&#x27;南京&#x27;</span> }] },
];

<span class="hljs-comment">// 第一列永远是根节点；之后每选中一项，就用它的 children 作为下一列。</span>
<span class="hljs-keyword">function</span> <span class="hljs-title function_">columnsOf</span>(<span class="hljs-params">path</span>) {
  <span class="hljs-keyword">const</span> columns = [options];
  <span class="hljs-keyword">let</span> current = options;
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> value <span class="hljs-keyword">of</span> path) {
    <span class="hljs-keyword">const</span> node = current.<span class="hljs-title function_">find</span>(<span class="hljs-function">(<span class="hljs-params">item</span>) =&gt;</span> item.<span class="hljs-property">value</span> === value);
    <span class="hljs-keyword">if</span> (!node || !node.<span class="hljs-property">children</span>) <span class="hljs-keyword">break</span>;
    columns.<span class="hljs-title function_">push</span>(node.<span class="hljs-property">children</span>);
    current = node.<span class="hljs-property">children</span>;
  }
  <span class="hljs-keyword">return</span> columns;
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">flattenPaths</span>(<span class="hljs-params">nodes, prefix = [], result = []</span>) {
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> node <span class="hljs-keyword">of</span> nodes) {
    <span class="hljs-keyword">const</span> path = [...prefix, node];
    <span class="hljs-keyword">if</span> (node.<span class="hljs-property">children</span>) <span class="hljs-title function_">flattenPaths</span>(node.<span class="hljs-property">children</span>, path, result);
    <span class="hljs-keyword">else</span> result.<span class="hljs-title function_">push</span>(path);
  }
  <span class="hljs-keyword">return</span> result;
}

<span class="hljs-keyword">const</span> columns = <span class="hljs-title function_">columnsOf</span>([<span class="hljs-string">&#x27;zj&#x27;</span>, <span class="hljs-string">&#x27;hz&#x27;</span>]);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(columns.<span class="hljs-title function_">map</span>(<span class="hljs-function">(<span class="hljs-params">col</span>) =&gt;</span> col.<span class="hljs-title function_">map</span>(<span class="hljs-function">(<span class="hljs-params">item</span>) =&gt;</span> item.<span class="hljs-property">label</span>).<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;,&#x27;</span>)).<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27; | &#x27;</span>)); <span class="hljs-comment">// 浙江,江苏 | 杭州,宁波 | 西湖区</span>

<span class="hljs-keyword">const</span> keyword = <span class="hljs-string">&#x27;杭州&#x27;</span>;
<span class="hljs-keyword">const</span> matched = <span class="hljs-title function_">flattenPaths</span>(options).<span class="hljs-title function_">filter</span>(<span class="hljs-function">(<span class="hljs-params">path</span>) =&gt;</span> path.<span class="hljs-title function_">some</span>(<span class="hljs-function">(<span class="hljs-params">node</span>) =&gt;</span> node.<span class="hljs-property">label</span>.<span class="hljs-title function_">includes</span>(keyword)));
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(matched.<span class="hljs-title function_">map</span>(<span class="hljs-function">(<span class="hljs-params">path</span>) =&gt;</span> path.<span class="hljs-title function_">map</span>(<span class="hljs-function">(<span class="hljs-params">node</span>) =&gt;</span> node.<span class="hljs-property">label</span>).<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27; / &#x27;</span>)).<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;;&#x27;</span>)); <span class="hljs-comment">// 浙江 / 杭州 / 西湖区</span>
</code></pre></div>
<p>为什么搜索要先拍平？因为用户搜“杭州”时，想看到的是“浙江 / 杭州 / 西湖区”这样一整条可选路径，而不是孤零零的一个“杭州”。拍平以后每一项就是一条完整路径，匹配和显示都直接。例子里只把叶子当作可选结果，如果业务允许选中任意一级，就在每个节点处都把路径收进去。</p>
<p><code>columnsOf</code> 只依赖路径，所以回显很简单：后端返回 <code>[&#x27;zj&#x27;, &#x27;hz&#x27;, &#x27;xh&#x27;]</code>，组件按它逐层查找就能恢复三列和每列的高亮项。</p>
<h2>懒加载下一列</h2>
<p>省市区这种数据可以一次给全，但组织架构、商品类目往往很大，要在选中某项时再请求它的子节点。节点上标一个 <code>isLeaf</code> 或“有子节点”，选中非叶子节点时请求，拿到结果写回这个节点的 <code>children</code>，再重新算列。</p>
<p>这里有个容易漏的情况：用户连续快速点了两个不同的省，第一个请求后回来，会把错误的市列表显示出来。可以给请求带上它所属的路径，结果回来时如果当前路径已经变了就丢弃。回显时，如果中间几级还没加载，要按路径依次请求，或者让后端直接返回每一级的标签。</p>
<h2>穿梭框为什么只维护一个集合</h2>
<p>穿梭框直观的写法是两个数组，移动时从左边删、往右边加。可是这样移动几次以后，左边的顺序就乱了，搜索框、全选、禁用项也都要在两个数组上各写一遍。</p>
<p>更简单的做法是数据源只有一份，组件状态只有三个：已选 ID 集合，左侧勾选的 ID，右侧勾选的 ID。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> data = [
  { <span class="hljs-attr">key</span>: <span class="hljs-number">1</span>, <span class="hljs-attr">title</span>: <span class="hljs-string">&#x27;张三&#x27;</span> },
  { <span class="hljs-attr">key</span>: <span class="hljs-number">2</span>, <span class="hljs-attr">title</span>: <span class="hljs-string">&#x27;李四&#x27;</span> },
  { <span class="hljs-attr">key</span>: <span class="hljs-number">3</span>, <span class="hljs-attr">title</span>: <span class="hljs-string">&#x27;王五&#x27;</span> },
  { <span class="hljs-attr">key</span>: <span class="hljs-number">4</span>, <span class="hljs-attr">title</span>: <span class="hljs-string">&#x27;赵六&#x27;</span> },
];

<span class="hljs-keyword">let</span> targetKeys = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Set</span>();
<span class="hljs-keyword">const</span> <span class="hljs-title function_">left</span> = (<span class="hljs-params"></span>) =&gt; data.<span class="hljs-title function_">filter</span>(<span class="hljs-function">(<span class="hljs-params">item</span>) =&gt;</span> !targetKeys.<span class="hljs-title function_">has</span>(item.<span class="hljs-property">key</span>));
<span class="hljs-keyword">const</span> <span class="hljs-title function_">right</span> = (<span class="hljs-params"></span>) =&gt; data.<span class="hljs-title function_">filter</span>(<span class="hljs-function">(<span class="hljs-params">item</span>) =&gt;</span> targetKeys.<span class="hljs-title function_">has</span>(item.<span class="hljs-property">key</span>));

<span class="hljs-keyword">function</span> <span class="hljs-title function_">moveToRight</span>(<span class="hljs-params">keys</span>) {
  targetKeys = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Set</span>([...targetKeys, ...keys]);
}
<span class="hljs-keyword">function</span> <span class="hljs-title function_">moveToLeft</span>(<span class="hljs-params">keys</span>) {
  <span class="hljs-keyword">const</span> removing = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Set</span>(keys);
  targetKeys = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Set</span>([...targetKeys].<span class="hljs-title function_">filter</span>(<span class="hljs-function">(<span class="hljs-params">key</span>) =&gt;</span> !removing.<span class="hljs-title function_">has</span>(key)));
}

<span class="hljs-title function_">moveToRight</span>([<span class="hljs-number">3</span>, <span class="hljs-number">1</span>]);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">left</span>().<span class="hljs-title function_">map</span>(<span class="hljs-function">(<span class="hljs-params">item</span>) =&gt;</span> item.<span class="hljs-property">title</span>).<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;,&#x27;</span>)); <span class="hljs-comment">// 李四,赵六</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">right</span>().<span class="hljs-title function_">map</span>(<span class="hljs-function">(<span class="hljs-params">item</span>) =&gt;</span> item.<span class="hljs-property">title</span>).<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;,&#x27;</span>)); <span class="hljs-comment">// 张三,王五</span>
<span class="hljs-title function_">moveToLeft</span>([<span class="hljs-number">1</span>]);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">left</span>().<span class="hljs-title function_">map</span>(<span class="hljs-function">(<span class="hljs-params">item</span>) =&gt;</span> item.<span class="hljs-property">title</span>).<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;,&#x27;</span>)); <span class="hljs-comment">// 张三,李四,赵六</span>
</code></pre></div>
<p>先移过去的是“王五”，后移的是“张三”，右侧显示时仍然按原始顺序，移回左边的“张三”也回到了原来的位置。因为两侧都是从同一份 <code>data</code> 过滤出来的，顺序天然一致。</p>
<p>如果业务要求右侧按“添加的先后”排列，就把 <code>targetKeys</code> 换成数组，右侧按数组顺序取数据，左侧仍从 <code>data</code> 过滤。搜索和“全选”也只作用于当前过滤后的可见项，并且跳过禁用项，否则用户会把看不见的数据一起移走。</p>
<h2>大数据量和可访问性</h2>
<p>穿梭框两侧一次显示上千项会卡，要对每侧列表做虚拟滚动，见<a href="/questions/perf-virtual-list/">《定高虚拟列表怎样手写？怎样根据 scrollTop 算出要渲染哪几行？》</a>。级联选择每一列一般不长，但搜索结果可能很多，同样要限制条数或虚拟化。</p>
<p>可访问性方面，穿梭框两侧可以各自是一个多选 listbox：容器用 <code>role=&quot;listbox&quot;</code> 和 <code>aria-multiselectable=&quot;true&quot;</code>，每项是 <code>option</code>，用 <code>aria-selected</code> 表示是否勾选。WAI-ARIA APG 推荐的多选键盘模型是方向键移动焦点、空格切换当前项，Shift 加方向键和 Ctrl+A 是可选的批量选择快捷键。中间的移动按钮用原生 <code>button</code>。带输入框的级联搜索则属于 combobox，键盘和 ARIA 行为见<a href="/questions/a11y-combobox/">《可访问的 Combobox 需要哪些键盘和 ARIA 行为？》</a>。</p>
<h2>常见追问</h2>
<p><strong>级联选择允许选中非叶子节点怎么办？</strong></p>
<blockquote>
<p>加一个配置，比如“选中任意一级即改变值”。这时点击非叶子节点既展开下一列又更新值，值是到这一级为止的路径。搜索拍平时也要把每个中间节点的路径收进结果。</p>
</blockquote>
<p><strong>级联选择要支持多选怎么设计？</strong></p>
<blockquote>
<p>值变成路径的数组，每一列的选项前加复选框，父子之间的勾选联动和半选和树组件完全一样，见<a href="/questions/design-tree-component/">《树组件怎样设计？上万个节点时虚拟树怎样实现？》</a>。显示时选中项太多可以折叠成“+N”。</p>
</blockquote>`};export{e as default};