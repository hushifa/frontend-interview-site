var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>状态更新后，React 要拿新渲染出的元素和上一次的 Fiber 树比较，决定哪些节点复用、哪些新建、哪些删除、哪些移动。完整的树比较算法复杂度是 O(n³)，React 用两个假设把它降到 O(n)：类型不同的元素会产生不同的树；开发者可以用 <code>key</code> 告诉 React 哪些子元素在多次渲染之间是同一个。</p>
<p>所以 React 只比较同一层。同一位置上类型变了，比如 <code>div</code> 换成 <code>span</code>、<code>Counter</code> 换成 <code>p</code>，整棵子树直接卸载重建，里面的 state 也一起丢掉。类型相同就复用节点，只更新属性，再接着比较子节点。</p>
<p>子节点分两种情况。新的只有一个节点时，React 在旧子节点里找 key 相同的；key 相同、类型也相同就复用，其余旧节点删掉。新的是数组时，React 先从左往右按位置逐个比，遇到 key 对不上就停下，把剩下的旧节点放进一个按 key 索引的 Map，再逐个查找。判断移动时它记录一个 <code>lastPlacedIndex</code>，复用的节点在旧列表里的位置比它小，就标记为需要移动。</p>
<p>和 Vue 3 最大的不同在多节点。React 源码注释写明，Fiber 没有指向前一个兄弟的指针，所以不从两端搜索，只往右走。Vue 3 先同步首尾相同的部分，中间乱序的部分用最长递增子序列找出不动的节点。另外 Vue 有编译器提供的 PatchFlags，能跳过不变的内容，React 运行时则要完整比较，React Compiler 是在组件层面做缓存，减少的是重新渲染。</p>
</blockquote>
<h2>类型不同为什么整棵重建</h2>
<p>react.dev 讲状态保留时说得很直接：同一个组件渲染在树的同一个位置，它的 state 就保留；同一个位置换成了别的组件，React 会丢掉它和整棵子树的 state。</p>
<p>这就是第一个假设的后果。React 不会去比较 <code>&lt;Counter&gt;</code> 和 <code>&lt;p&gt;</code> 里面有没有相似的结构，类型一变就当成两棵完全不同的树。所以文档提醒，不要在组件里面定义组件。每次渲染都会得到一个新的函数，类型每次都不同，React 每次都会重置下面所有的 state。</p>
<h2>单节点怎么比</h2>
<p>新的子节点只有一个元素时，源码走 <code>reconcileSingleElement</code>。它遍历旧的子节点：</p>
<ul>
<li>key 不同，删掉这个旧节点，继续看下一个兄弟；</li>
<li>key 相同、类型也相同，复用它，并删掉剩下的所有兄弟；</li>
<li>key 相同但类型不同，说明不可能复用了，把它和剩下的兄弟全部删掉，新建一个。</li>
</ul>
<p>为什么 key 相同而类型不同就直接放弃？因为在同一层里 key 应该唯一，key 对上了却类型不同，后面不可能还有能复用的节点。</p>
<h2>多节点怎么比</h2>
<p>新的子节点是数组时，源码走 <code>reconcileChildrenArray</code>，大致分三步。</p>
<p>第一轮从左往右，把新旧节点按位置一对一比较，key 相同就更新。遇到 key 不同就跳出循环。大多数更新只是改了某几项内容，顺序没变，这一轮就能处理完。</p>
<p>如果新的已经走完了，剩下的旧节点全部删除。如果旧的走完了，剩下的新节点全部新建插入。</p>
<p>两边都没走完，说明有插入、删除或移动。React 把剩下的旧节点放进 Map，key 作为键，没写 key 的用下标。然后继续遍历新节点，在 Map 里查能复用的旧节点，查到就从 Map 里拿掉。遍历完 Map 里还剩的，就是要删除的。</p>
<p>移动的判断在 <code>placeChild</code> 里。React 记录 <code>lastPlacedIndex</code>，表示已经处理的、不需要移动的节点里，旧下标最大的那个。复用的节点旧下标比它小，说明它原来在某个“不动的节点”前面，现在跑到后面去了，要标记移动；否则就不动，并把 <code>lastPlacedIndex</code> 更新为它的旧下标。</p>
<p>下面按这个规则模拟三种变化：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">reactMoves</span>(<span class="hljs-params">oldKeys, newKeys</span>) {
  <span class="hljs-keyword">const</span> oldIndex = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Map</span>(oldKeys.<span class="hljs-title function_">map</span>(<span class="hljs-function">(<span class="hljs-params">key, i</span>) =&gt;</span> [key, i]));
  <span class="hljs-keyword">let</span> lastPlacedIndex = <span class="hljs-number">0</span>;
  <span class="hljs-keyword">const</span> result = [];
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> key <span class="hljs-keyword">of</span> newKeys) {
    <span class="hljs-keyword">if</span> (!oldIndex.<span class="hljs-title function_">has</span>(key)) {
      result.<span class="hljs-title function_">push</span>(<span class="hljs-string">\`<span class="hljs-subst">\${key}</span>:插入\`</span>);
      <span class="hljs-keyword">continue</span>;
    }
    <span class="hljs-keyword">const</span> index = oldIndex.<span class="hljs-title function_">get</span>(key);
    <span class="hljs-keyword">if</span> (index &lt; lastPlacedIndex) {
      result.<span class="hljs-title function_">push</span>(<span class="hljs-string">\`<span class="hljs-subst">\${key}</span>:移动\`</span>);
    } <span class="hljs-keyword">else</span> {
      lastPlacedIndex = index;
      result.<span class="hljs-title function_">push</span>(<span class="hljs-string">\`<span class="hljs-subst">\${key}</span>:不动\`</span>);
    }
  }
  <span class="hljs-keyword">return</span> result.<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27; &#x27;</span>);
}

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">reactMoves</span>([<span class="hljs-string">&#x27;A&#x27;</span>, <span class="hljs-string">&#x27;B&#x27;</span>, <span class="hljs-string">&#x27;C&#x27;</span>, <span class="hljs-string">&#x27;D&#x27;</span>], [<span class="hljs-string">&#x27;A&#x27;</span>, <span class="hljs-string">&#x27;C&#x27;</span>, <span class="hljs-string">&#x27;B&#x27;</span>, <span class="hljs-string">&#x27;D&#x27;</span>])); <span class="hljs-comment">// A:不动 C:不动 B:移动 D:不动</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">reactMoves</span>([<span class="hljs-string">&#x27;A&#x27;</span>, <span class="hljs-string">&#x27;B&#x27;</span>, <span class="hljs-string">&#x27;C&#x27;</span>, <span class="hljs-string">&#x27;D&#x27;</span>], [<span class="hljs-string">&#x27;D&#x27;</span>, <span class="hljs-string">&#x27;A&#x27;</span>, <span class="hljs-string">&#x27;B&#x27;</span>, <span class="hljs-string">&#x27;C&#x27;</span>])); <span class="hljs-comment">// D:不动 A:移动 B:移动 C:移动</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">reactMoves</span>([<span class="hljs-string">&#x27;A&#x27;</span>, <span class="hljs-string">&#x27;B&#x27;</span>, <span class="hljs-string">&#x27;C&#x27;</span>], [<span class="hljs-string">&#x27;A&#x27;</span>, <span class="hljs-string">&#x27;X&#x27;</span>, <span class="hljs-string">&#x27;B&#x27;</span>, <span class="hljs-string">&#x27;C&#x27;</span>]));      <span class="hljs-comment">// A:不动 X:插入 B:不动 C:不动</span>
</code></pre></div>
<p>第一行交换了 B 和 C，只有 B 被移动。第三行在中间插入 X，原有的节点都不用动。</p>
<p>第二行值得注意。只是把最后的 D 挪到最前面，按理说移动一次就够了。可是 React 先遇到 D，旧下标 3，<code>lastPlacedIndex</code> 变成 3，后面 A、B、C 的旧下标都比 3 小，于是三个都被标记为移动。这就是只往右走的代价，源码注释也承认这种做法处理不好反转这类情况，但它认为这种情况不常见。</p>
<h2>key 起什么作用</h2>
<p>从上面的过程可以看出，key 是 React 认出“这还是原来那个节点”的唯一依据。</p>
<p>react.dev 说明，不写 key 时 React 默认用数组下标。下标只表示位置，列表头部插入一项，所有项的下标都变了，React 会把第一项的 state 和 DOM 给新插进来的那一项用，输入框内容就会错位。也不要用 <code>Math.random()</code> 这类每次都变的值，否则 key 永远对不上，每次都要重建所有组件和 DOM，用户的输入也会丢失。key 只要在兄弟节点之间唯一就够了，不同数组里可以重复。下标作 key 的具体问题见<a href="/questions/react-key/">《列表中的 key 为什么不能随意使用数组下标？》</a>。</p>
<h2>和 Vue 的 diff 有什么不同</h2>
<p>两者的基本规则相同：只比较同一层，类型和 key 都相同才复用。区别主要在多节点的比较策略。</p>
<p>React 的源码注释说明了原因：Fiber 的兄弟节点之间只有指向下一个的 <code>sibling</code> 指针，没有指向上一个的，所以不从两端搜索，先试试只往右走能走多远。Vue 的子节点是数组，可以从两头比较。Vue 2 用双端比较，Vue 3 先同步首尾相同的部分，中间乱序的部分求最长递增子序列，子序列里的节点不动，只移动其他的。像上面“D 挪到最前面”的例子，Vue 3 只会移动 D 一次，见<a href="/questions/vue3-diff/">《Vue 3 的快速 diff 是怎样用最长递增子序列减少移动的？》</a>。</p>
<p>另一个区别在编译期。Vue 的模板编译器会把“哪些节点不变、哪个属性会变”写进渲染函数，运行时能跳过大量比较，见<a href="/questions/vue-compiler-optimizations/">《Vue 模板编译如何减少运行时更新工作？》</a>。React 的 JSX 编译后就是普通的函数调用，diff 要在运行时完整比较。React Compiler 做的是自动缓存组件和计算结果，减少不必要的重新渲染，并不改变 diff 本身。</p>
<h2>常见追问</h2>
<p><strong>diff 的结果是马上改 DOM 吗？</strong></p>
<blockquote>
<p>不是。diff 发生在渲染阶段，只在 Fiber 上打标记，比如插入、移动、删除。等整棵树处理完，提交阶段才统一操作真实 DOM。两个阶段的区别见<a href="/questions/react-virtual-dom-fiber/">《React 的虚拟 DOM 和 diff 是怎样工作的？Fiber 解决了什么问题？》</a>。</p>
</blockquote>
<p><strong>想让一个组件重置 state，可以利用 diff 规则吗？</strong></p>
<blockquote>
<p>可以。给它换一个 key，React 会认为这是一个不同的节点，卸载旧的、挂载新的，state 就重置了。react.dev 在讲重置状态时就用这个办法。</p>
</blockquote>`};export{e as default};