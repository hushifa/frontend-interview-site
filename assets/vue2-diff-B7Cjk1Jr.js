var e={answerHtml:`<h2>简答</h2>
<ul>
<li>Vue 2 已于 2023-12-31 停止维护，本题 Vue 2 部分以 2.7 源码为准。</li>
<li>同层比较：只在同一父节点的子节点之间比较；<code>sameVnode</code> 要求 key、标签等一致才复用，否则销毁重建。</li>
<li>Vue 2 的 <code>updateChildren</code> 维护旧头、旧尾、新头、新尾四个指针，依次尝试四种命中，命中后 patch 并按需移动 DOM，指针向中间收缩。</li>
<li>四种都不命中时，为剩余旧节点建立 key → 下标的映射查找新头；找不到就新建。循环结束后批量新增或删除剩余节点。</li>
<li>Vue 3 先同步相同前缀和后缀，对中间乱序部分用最长递增子序列确定不需要移动的节点；编译器生成的 PatchFlags、Block 和静态缓存（Cache Static）让运行时跳过不变内容。</li>
</ul>
<h2>sameVnode</h2>
<p>两个 vnode 视为&quot;同一个节点&quot;需要：<code>key</code> 相同、<code>asyncFactory</code> 相同，并且标签相同、是否注释节点相同、是否都有 <code>data</code>，<code>input</code> 还要 <code>type</code> 相同（异步占位节点另有判断）。没有写 key 时两边 key 都是 <code>undefined</code>，同标签的节点会被就地复用，这就是列表用下标或不写 key 时状态错位的原因。</p>
<h2>双端比较的四种命中</h2>
<p>设 <code>oldStart</code>、<code>oldEnd</code>、<code>newStart</code>、<code>newEnd</code> 四个指针，循环条件为两组都还有未处理的节点（循环开头会跳过被置为 <code>undefined</code> 的旧节点）：</p>
<ol>
<li>旧头 vs 新头：命中则 patch，两个头指针后移。</li>
<li>旧尾 vs 新尾：命中则 patch，两个尾指针前移。</li>
<li>旧头 vs 新尾：命中说明节点被移到了后面，patch 后把旧头的 DOM 插到旧尾 DOM 的后面。</li>
<li>旧尾 vs 新头：命中说明节点被移到了前面，patch 后把旧尾的 DOM 插到旧头 DOM 的前面。</li>
<li>都不命中：首次用 <code>createKeyToOldIdx</code> 为剩余旧节点建 key 映射。新头有 key 就查映射，没有 key 就用 <code>findIdxInOld</code> 逐个 <code>sameVnode</code> 比较。找到且 <code>sameVnode</code> 成立则 patch，把旧位置置为 <code>undefined</code> 并移到旧头之前；找不到或 key 相同但元素不同，就新建并插到旧头之前。新头指针后移。</li>
</ol>
<p>循环结束后：旧节点先用完，把剩余新节点插入；新节点先用完，删除剩余旧节点。</p>
<div class="not-prose code-block"><div class="code-language">text</div><pre><code class="hljs language-text">旧：A B C D      新：D A B C
旧头 A vs 新头 D ✗；旧尾 D vs 新尾 C ✗；旧头 A vs 新尾 C ✗
旧尾 D vs 新头 D ✓ → 把 D 移到 A 前面，只移动一次
</code></pre></div>
<h2>Vue 3 的做法</h2>
<p><code>patchKeyedChildren</code> 分五步：</p>
<ol>
<li>从头同步，<code>isSameVNodeType</code> 成立就 patch，直到不同。</li>
<li>从尾同步。</li>
<li>旧的用完，挂载剩余新节点。</li>
<li>新的用完，卸载剩余旧节点。</li>
<li>中间未知序列：为新节点建 key → 下标映射，遍历旧节点 patch 可复用的、卸载找不到的，并记录 <code>newIndexToOldIndexMap</code>。只有检测到节点移动时才调用 <code>getSequence</code> 求最长递增子序列；从后往前遍历，在子序列中的节点不动，其余节点移动或新挂载。</li>
</ol>
<h2>编译期优化</h2>
<p>Vue 2 编译器会标记静态根节点，patch 时跳过它们，但动态节点仍按完整树比较。Vue 3 的模板编译结果带有更多提示：</p>
<ul>
<li>PatchFlags：标记节点哪些部分是动态的，如 <code>TEXT</code>、<code>CLASS</code>、<code>PROPS</code>，<code>patchElement</code> 只更新这些部分。</li>
<li>Block：块节点收集内部的动态后代到 <code>dynamicChildren</code>，更新时只遍历这个扁平数组，而不是整棵子树。</li>
<li>静态缓存（Cache Static，早期版本称为静态提升）：静态节点只创建一次，Vue 3.5 的编译器把它缓存到 <code>_cache</code> 中并标记为 <code>CACHED</code>，更新时完全跳过。</li>
</ul>
<p>具体的编译策略见<a href="/questions/vue-compiler-optimizations/">《Vue 模板编译如何减少运行时更新工作？》</a>。</p>
<h2>示例</h2>
<p>用 <code>@vue/compiler-dom</code>（<a href="mailto:vue@3.5.x">vue@3.5.x</a> 依赖）编译 <code>&lt;div&gt;&lt;p&gt;static&lt;/p&gt;&lt;span :class=&quot;c&quot;&gt;{{msg}}&lt;/span&gt;&lt;/div&gt;</code>，输出的关键部分：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js">_cache[<span class="hljs-number">0</span>] || (_cache[<span class="hljs-number">0</span>] = <span class="hljs-title function_">_createElementVNode</span>(<span class="hljs-string">&quot;p&quot;</span>, <span class="hljs-literal">null</span>, <span class="hljs-string">&quot;static&quot;</span>, -<span class="hljs-number">1</span> <span class="hljs-comment">/* CACHED */</span>)),
<span class="hljs-title function_">_createElementVNode</span>(<span class="hljs-string">&quot;span&quot;</span>, { <span class="hljs-attr">class</span>: <span class="hljs-title function_">_normalizeClass</span>(_ctx.<span class="hljs-property">c</span>) },
  <span class="hljs-title function_">_toDisplayString</span>(_ctx.<span class="hljs-property">msg</span>), <span class="hljs-number">3</span> <span class="hljs-comment">/* TEXT, CLASS */</span>)
</code></pre></div>
<h2>常见追问</h2>
<ul>
<li>为什么不推荐用下标作 key？插入或删除中间项后，下标与数据的对应关系改变，<code>sameVnode</code> 会把不同数据的节点当成同一个复用，带状态的子组件或输入框就会错位。</li>
<li>双端比较和最长递增子序列哪个更好？两者都是启发式减少 DOM 移动，Vue 3 的方案在中间乱序部分能得到最少移动次数，但这里不给出普适的性能结论。</li>
</ul>`};export{e as default};