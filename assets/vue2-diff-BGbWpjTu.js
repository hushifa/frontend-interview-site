var e={answerHtml:`<blockquote>
<p>Vue 2 已于 2023-12-31 停止维护，本题 Vue 2 部分以 2.7 源码为准。</p>
</blockquote>
<h2>简答</h2>
<blockquote>
<p>diff 要回答的问题是：数据变了以后，新旧两组子节点怎么对应，哪些能复用、哪些要移动、哪些要新建或删除。Vue 只在同一个父节点的子节点之间比较，不跨层级。两个节点 key 相同、标签相同等条件都满足，才算“同一个节点”可以复用，源码里这个判断叫 <code>sameVnode</code>，不满足就销毁重建。</p>
<p>Vue 2 的子节点比较在 <code>updateChildren</code> 里。它给新旧两组各放头尾两个指针，一共四个，每轮依次尝试旧头对新头、旧尾对新尾、旧头对新尾、旧尾对新头四种配对。配上了就更新这个节点，必要时移动 DOM，然后指针往中间收。这个办法叫双端比较。</p>
<p>四种都配不上时，就为剩下的旧节点建一张“key → 下标”的表，用新头的 key 去查；查不到就新建。循环结束后，多出来的新节点批量插入，多出来的旧节点批量删除。</p>
<p>Vue 3 换了思路。它先把开头和结尾相同的部分同步掉，中间乱序的部分用最长递增子序列找出不需要动的节点，只移动其余的。再加上编译器生成的 PatchFlags、Block 和静态缓存，运行时能跳过大量不变的内容。</p>
</blockquote>
<h2>什么样的两个节点算“同一个”</h2>
<p>源码中 <code>sameVnode</code> 的条件是：<code>key</code> 相同、<code>asyncFactory</code> 相同，并且标签相同、是否注释节点相同、是否都有 <code>data</code>，<code>input</code> 元素还要求 <code>type</code> 相同（异步占位节点另有判断）。</p>
<p>这里有个关键点。没写 key 时，两边的 key 都是 <code>undefined</code>，也算“相同”。所以同标签的节点会被直接就地复用，不管它们背后对应的是不是同一条数据。列表用下标当 key 或者不写 key 时出现状态错位，原因就在这里。</p>
<h2>双端比较怎么走</h2>
<p>设 <code>oldStart</code>、<code>oldEnd</code>、<code>newStart</code>、<code>newEnd</code> 四个指针。只要两组都还有没处理的节点，就一直循环（循环开头会跳过之前被置为 <code>undefined</code> 的旧节点）。每轮按下面的顺序尝试：</p>
<ol>
<li>旧头 vs 新头：命中就 patch，两个头指针后移。</li>
<li>旧尾 vs 新尾：命中就 patch，两个尾指针前移。</li>
<li>旧头 vs 新尾：命中说明这个节点被移到了后面，patch 后把旧头的 DOM 插到旧尾 DOM 的后面。</li>
<li>旧尾 vs 新头：命中说明这个节点被移到了前面，patch 后把旧尾的 DOM 插到旧头 DOM 的前面。</li>
<li>都不命中：第一次走到这里时用 <code>createKeyToOldIdx</code> 为剩余旧节点建 key 映射。新头有 key 就查映射，没有 key 就用 <code>findIdxInOld</code> 逐个做 <code>sameVnode</code> 比较。找到且 <code>sameVnode</code> 成立就 patch，把旧位置置为 <code>undefined</code>，把 DOM 移到旧头之前；找不到，或者 key 相同但元素不同，就新建一个插到旧头之前。然后新头指针后移。</li>
</ol>
<p>循环结束后，如果旧节点先用完，就把剩下的新节点插进去；如果新节点先用完，就把剩下的旧节点删掉。</p>
<p>看一个具体例子，把最后一项挪到最前面：</p>
<div class="not-prose code-block"><div class="code-language">text</div><pre><code class="hljs language-text">旧：A B C D      新：D A B C
旧头 A vs 新头 D ✗；旧尾 D vs 新尾 C ✗；旧头 A vs 新尾 C ✗
旧尾 D vs 新头 D ✓ → 把 D 移到 A 前面，只移动一次
</code></pre></div>
<p>这个例子里，第四种配对就找到了 D，不需要建映射表。之后剩下的 <code>A B C</code> 每轮都是头对头命中，不再移动。在头尾增删、把一项挪到头或尾这类变化，都能靠首尾配对直接处理。</p>
<h2>Vue 3 换成了什么做法</h2>
<p>Vue 3 带 key 的子节点比较在 <code>patchKeyedChildren</code> 里，分五步：</p>
<ol>
<li>从头开始同步，<code>isSameVNodeType</code> 成立就 patch，直到遇到不同的。</li>
<li>从尾开始同步。</li>
<li>如果旧的用完了，挂载剩下的新节点。</li>
<li>如果新的用完了，卸载剩下的旧节点。</li>
<li>剩下中间一段乱序的部分：为新节点建 key → 下标映射，遍历旧节点，能复用的 patch，找不到的卸载，同时记录 <code>newIndexToOldIndexMap</code>。只有检测到节点发生了移动，才调用 <code>getSequence</code> 求最长递增子序列；然后从后往前遍历，在子序列里的节点不动，其余节点移动或新挂载。</li>
</ol>
<p>最长递增子序列是什么意思？把中间这段新节点在旧列表里的位置排出来，其中保持原有先后顺序的最长那一串，彼此之间的相对位置没变，就不用动它们，只需要移动别的节点。这样移动次数最少。</p>
<h2>编译器又帮了什么忙</h2>
<p>Vue 2 的编译器会标记静态根节点，patch 时跳过它们，但其余动态节点仍然按整棵树比较。Vue 3 的编译结果带了更多提示：</p>
<ul>
<li>PatchFlags：标记节点哪些部分是动态的，比如 <code>TEXT</code>、<code>CLASS</code>、<code>PROPS</code>，<code>patchElement</code> 只更新这些部分。</li>
<li>Block：块节点把内部的动态后代收集到 <code>dynamicChildren</code>，更新时只遍历这个扁平数组，不用走整棵子树。</li>
<li>静态缓存（Cache Static，早期版本叫静态提升）：静态节点只创建一次。Vue 3.5 的编译器把它缓存到 <code>_cache</code> 里并标记为 <code>CACHED</code>，更新时完全跳过。</li>
</ul>
<p>用 <code>@vue/compiler-dom</code>（<a href="mailto:vue@3.5.x">vue@3.5.x</a> 依赖）编译 <code>&lt;div&gt;&lt;p&gt;static&lt;/p&gt;&lt;span :class=&quot;c&quot;&gt;{{msg}}&lt;/span&gt;&lt;/div&gt;</code>，输出的关键部分是：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js">_cache[<span class="hljs-number">0</span>] || (_cache[<span class="hljs-number">0</span>] = <span class="hljs-title function_">_createElementVNode</span>(<span class="hljs-string">&quot;p&quot;</span>, <span class="hljs-literal">null</span>, <span class="hljs-string">&quot;static&quot;</span>, -<span class="hljs-number">1</span> <span class="hljs-comment">/* CACHED */</span>)),
<span class="hljs-title function_">_createElementVNode</span>(<span class="hljs-string">&quot;span&quot;</span>, { <span class="hljs-attr">class</span>: <span class="hljs-title function_">_normalizeClass</span>(_ctx.<span class="hljs-property">c</span>) },
  <span class="hljs-title function_">_toDisplayString</span>(_ctx.<span class="hljs-property">msg</span>), <span class="hljs-number">3</span> <span class="hljs-comment">/* TEXT, CLASS */</span>)
</code></pre></div>
<p>静态的 <code>p</code> 只在第一次渲染时创建，之后直接从 <code>_cache[0]</code> 拿；<code>span</code> 后面的 <code>3</code> 表示只有文本和 class 会变。具体的编译策略见<a href="/questions/vue-compiler-optimizations/">《Vue 模板编译如何减少运行时更新工作？》</a>。</p>
<h2>常见追问</h2>
<p><strong>为什么不推荐用下标当 key？</strong></p>
<blockquote>
<p>在中间插入或删除一项以后，下标和数据的对应关系就变了。<code>sameVnode</code> 只看 key，会把原本对应不同数据的节点当成同一个复用，带状态的子组件或者输入框就会错位。</p>
</blockquote>
<p><strong>双端比较和最长递增子序列哪个更好？</strong></p>
<blockquote>
<p>两者都是减少 DOM 移动的启发式方法。Vue 3 的方案在中间乱序的部分能得到最少的移动次数，但这里不给出普适的性能结论，实际差异取决于列表怎么变。</p>
</blockquote>`};export{e as default};