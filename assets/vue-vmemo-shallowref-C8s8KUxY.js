var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>一个页面顶部有一段只在加载时生成的说明文字，下面是一张上千行、只有“选中”状态会变的表格，旁边还挂着一个 ECharts 实例。这四个 API 正好对应这些场景：说明文字用 <code>v-once</code>，表格行用 <code>v-memo</code>，表格的大数组用 <code>shallowRef</code>，图表实例用 <code>markRaw</code>。</p>
<p>前两个是模板指令，管的是渲染。<code>v-once</code> 让元素和它的子节点只渲染一次，之后重新渲染时都当成静态内容跳过。<code>v-memo</code> 接收一个依赖数组，重新渲染时数组里的值都没变，就跳过整个子树的更新，连虚拟 DOM 节点都不重新创建。它从 Vue 3.2 开始支持。</p>
<p>后两个是响应式 API，管的是数据。<code>shallowRef</code> 只有 <code>.value</code> 本身被换掉才触发更新，里面的对象不会被转成深层响应式，适合大块数据。<code>markRaw</code> 给对象打上标记，让它永远不会被转成代理，适合第三方类实例或者组件对象。</p>
<p>要注意它们都是在特定场景下的微优化。<code>v-memo</code> 依赖写漏了、<code>shallowRef</code> 里改了内部数据，界面就不会更新。所以先用工具确认慢在哪，再有针对性地用。</p>
</blockquote>
<h2>v-once：只渲染一次</h2>
<p><code>v-once</code> 不需要表达式。下面这段要看 <code>msg</code> 后来变了，页面上会不会跟着变：</p>
<div class="not-prose code-block"><div class="code-language">vue</div><pre><code class="hljs language-vue">&lt;span v-once&gt;这里永远不会变：{{ msg }}&lt;/span&gt;
&lt;MyComponent v-once :comment=&quot;msg&quot; /&gt;
</code></pre></div>
<p>第一次渲染时，<code>msg</code> 的值被正常显示。之后 <code>msg</code> 变了，组件重新渲染，可这两个元素以及它们的子节点都被当成静态内容跳过，所以页面上还是旧值。</p>
<p>这正是它的用途和风险：确定只需要初始值的内容，用它省掉后续的比较；如果哪天这里需要跟着数据变，就要记得把 <code>v-once</code> 去掉。</p>
<h2>v-memo：依赖不变就跳过</h2>
<p><code>v-memo</code> 接收一个固定长度的数组。重新渲染时，数组里每个值都和上次一样，整个子树的更新就全部跳过。文档说，最常见的有用场景是超过 1000 项的 <code>v-for</code> 长列表：</p>
<div class="not-prose code-block"><div class="code-language">vue</div><pre><code class="hljs language-vue">&lt;div v-for=&quot;item in list&quot; :key=&quot;item.id&quot; v-memo=&quot;[item.id === selected]&quot;&gt;
  &lt;p&gt;ID: {{ item.id }} - 选中：{{ item.id === selected }}&lt;/p&gt;
  &lt;p&gt;……更多子节点&lt;/p&gt;
&lt;/div&gt;
</code></pre></div>
<p><code>selected</code> 变化时，没有 <code>v-memo</code> 的话，每一行都要重新创建虚拟节点再比较，尽管大部分行根本没变。加了 <code>v-memo</code> 以后，只有刚被选中和刚取消选中的两行，依赖值从 <code>true</code> 变成 <code>false</code> 或者反过来，其余行的依赖值没变，就直接复用上次的结果。</p>
<p>那依赖数组可以只写一部分吗？不行。比如行里还显示了 <code>item.name</code>，数组里却没有它，名字改了界面也不会更新。文档反复强调要把依赖写对，否则会跳过应该执行的更新。和 <code>v-for</code> 一起用时，两者要写在同一个元素上，<code>v-memo</code> 不能写在 <code>v-for</code> 内部的子元素上。依赖数组是空的 <code>v-memo=&quot;[]&quot;</code>，效果和 <code>v-once</code> 一样。</p>
<p>这两个指令和编译器的静态提升是什么关系，见<a href="/questions/vue-compiler-optimizations/">《Vue 模板编译如何减少运行时更新工作？》</a>。</p>
<h2>shallowRef 和 markRaw：减少代理</h2>
<p>前面两个跳过的是渲染，后面两个跳过的是把数据转成响应式代理的工作。下面这个例子要看三次操作里，哪次会让 effect 重新执行：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">import</span> { shallowRef, markRaw, reactive, isReactive, effect } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;@vue/reactivity&#x27;</span>;

<span class="hljs-keyword">const</span> rows = <span class="hljs-title function_">shallowRef</span>([{ <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;甲&#x27;</span> }]);
<span class="hljs-keyword">let</span> renders = <span class="hljs-number">0</span>;
<span class="hljs-title function_">effect</span>(<span class="hljs-function">() =&gt;</span> {
  rows.<span class="hljs-property">value</span>.<span class="hljs-property">length</span>;
  renders += <span class="hljs-number">1</span>;
});

rows.<span class="hljs-property">value</span>.<span class="hljs-title function_">push</span>({ <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;乙&#x27;</span> });
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(renders); <span class="hljs-comment">// 1</span>

rows.<span class="hljs-property">value</span> = [...rows.<span class="hljs-property">value</span>];
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(renders); <span class="hljs-comment">// 2</span>

<span class="hljs-keyword">const</span> chart = <span class="hljs-title function_">markRaw</span>({ <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;第三方图表实例&#x27;</span> });
<span class="hljs-keyword">const</span> state = <span class="hljs-title function_">reactive</span>({ chart });
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">isReactive</span>(state.<span class="hljs-property">chart</span>)); <span class="hljs-comment">// false</span>
</code></pre></div>
<p>为什么 <code>push</code> 之后 <code>renders</code> 还是 1？因为 <code>shallowRef</code> 只追踪 <code>.value</code> 这一层，<code>push</code> 改的是数组内部，<code>.value</code> 指向的还是同一个数组，所以不会触发。把 <code>.value</code> 换成新数组，才触发了第二次。这里用 <code>@vue/reactivity</code> 的 <code>effect</code> 代替组件渲染，方便脱离组件单独运行，组件里的表现一样。</p>
<p>所以 <code>shallowRef</code> 适合整块替换的数据，比如每次从接口拿回来一整份新表格。确实需要原地修改时，可以改完之后调用 <code>triggerRef(rows)</code> 手动通知。和 <code>ref</code>、<code>reactive</code> 的对比见<a href="/questions/vue-ref-reactive/">《Vue 3 中 ref 和 reactive 有什么区别？》</a>。</p>
<p><code>markRaw</code> 的对象放进 <code>reactive</code> 里，再读出来也不是代理，<code>isReactive</code> 是 <code>false</code>。文档举的例子是复杂的第三方类实例和 Vue 组件对象，它们本来就不该是响应式的，被代理以后既浪费，还可能因为代理和原对象不是同一个而出错。</p>
<p><code>markRaw</code> 也有边界。标记只作用在这个对象本身：如果把一个没有标记的嵌套对象放进响应式对象，再读出来得到的还是代理版本。所以文档把它和 <code>shallowReactive</code> 一起列为进阶 API，提醒谨慎使用。</p>
<h2>常见追问</h2>
<p><strong>v-memo 和 computed 有什么区别？</strong></p>
<blockquote>
<p><code>computed</code> 缓存的是一个计算结果，依赖变了才重新算。<code>v-memo</code> 缓存的是一段模板渲染出来的虚拟 DOM 子树，依赖数组没变就整段跳过更新。一个作用在数据上，一个作用在渲染上。</p>
</blockquote>
<p><strong>shallowRef 和 markRaw 怎么选？</strong></p>
<blockquote>
<p>数据需要整体替换并触发更新，比如表格数据，用 <code>shallowRef</code>。对象本身永远不需要响应式，比如图表实例、地图实例，用 <code>markRaw</code>，放进任何响应式对象里都不会被代理。</p>
</blockquote>
<p><strong>什么时候不该用 v-memo？</strong></p>
<blockquote>
<p>列表不长、渲染不慢的时候。文档说它只用于性能关键场景下的微优化，很少需要。依赖数组要手动维护，漏一个依赖就是一个“改了不显示”的 bug，收益小的时候不值得。</p>
</blockquote>`};export{e as default};