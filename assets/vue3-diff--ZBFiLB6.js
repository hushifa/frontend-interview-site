var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>列表从 <code>a b c d e f g</code> 变成 <code>a b e c d h f g</code>，开头的 <code>a b</code> 和结尾的 <code>f g</code> 都没变，真正要处理的只有中间那一段。Vue 3 的 <code>patchKeyedChildren</code> 就是先把两头相同的部分处理掉，再集中处理中间。判断“相同”用的是 <code>isSameVNodeType</code>：类型相同并且 key 相同。</p>
<p>具体分五步。第一步从头往后比，相同就更新，不同就停。第二步从尾往前比，同样处理。第三步，如果旧的已经比完、新的还有剩，剩下的全部挂载。第四步，如果新的已经比完、旧的还有剩，剩下的全部卸载。前面都处理不完的，才进入第五步：乱序比较。</p>
<p>第五步先给中间段的新节点建一张“key → 新下标”的表，遍历旧节点去查：查不到的卸载，查到的更新，并记下“新位置对应的旧下标”。这个数组里，旧下标递增的那些节点，彼此的相对顺序没有变，不用移动。所以 Vue 用 <code>getSequence</code> 求出最长递增子序列，子序列里的节点不动，其余节点从后往前移动到位，下标表里为 0 的则是新增，直接挂载。</p>
<p>要注意两点。一是只有检测到节点顺序真的变了，才会去算最长递增子序列，否则直接跳过。二是这套比较只在没有编译信息、或子节点顺序可能变化时才需要，比如 <code>v-for</code> 渲染的带 key 的列表；模板编译器能确定顺序不会变的地方，运行时会直接跳过子节点顺序的比较。</p>
</blockquote>
<h2>先处理两头</h2>
<p>源码注释给的例子很直观。从头比：</p>
<div class="not-prose code-block"><div class="code-language">text</div><pre><code class="hljs language-text">(a b) c
(a b) d e
</code></pre></div>
<p><code>a b</code> 相同，更新后指针 <code>i</code> 走到 2。从尾比：</p>
<div class="not-prose code-block"><div class="code-language">text</div><pre><code class="hljs language-text">a (b c)
d e (b c)
</code></pre></div>
<p><code>b c</code> 相同，两个尾指针 <code>e1</code>、<code>e2</code> 往前退。</p>
<p>两头比完，有三种可能。旧的比完了，新的还剩，比如 <code>(a b)</code> 变成 <code>(a b) c</code>，就把 <code>c</code> 挂载上。新的比完了，旧的还剩，比如 <code>(a b) c</code> 变成 <code>(a b)</code>，就把 <code>c</code> 卸载掉。两边都还剩，就是中间乱序的情况。</p>
<p>为什么先处理两头？因为实际的列表更新大多是在头部或尾部增删几项，这两步就能处理完，根本走不到后面复杂的部分。</p>
<h2>中间乱序时怎么判断谁要移动</h2>
<p>还是 <code>a b [c d e] f g</code> 变成 <code>a b [e c d h] f g</code>，中间段是旧的 <code>c d e</code> 和新的 <code>e c d h</code>。</p>
<p>Vue 先为新的中间段建 <code>keyToNewIndexMap</code>，再建一个长度等于新中间段的数组 <code>newIndexToOldIndexMap</code>，初始全是 0。然后遍历旧的中间段，用 key 去查新下标，查到就把“旧下标 + 1”填进对应位置。加 1 是因为 0 被用来表示“这个新节点没有对应的旧节点”。</p>
<p>这个例子填完是 <code>[5, 3, 4, 0]</code>：<code>e</code> 原来在下标 4，<code>c</code> 在 2，<code>d</code> 在 3，<code>h</code> 是新增的。</p>
<p>遍历的同时还记录 <code>maxNewIndexSoFar</code>。如果某个旧节点查到的新下标比之前见过的最大值小，说明顺序乱了，就把 <code>moved</code> 设为 <code>true</code>。只有 <code>moved</code> 为真，才会去算最长递增子序列。</p>
<p><code>[5, 3, 4, 0]</code> 里，<code>3, 4</code> 是递增的，对应 <code>c d</code>。它们原来的相对顺序没有变，不用动。只需要把 <code>e</code> 移到前面，再把 <code>h</code> 挂载上去。</p>
<h2>getSequence 怎么求最长递增子序列</h2>
<p>下面是 <code>renderer.ts</code> 中 <code>getSequence</code> 的逻辑，加上一个按五步处理 key 数组的简化版 diff，用来看结果。简化版只处理 key，没有真正的 DOM 操作。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">getSequence</span>(<span class="hljs-params">arr</span>) {
  <span class="hljs-keyword">const</span> p = arr.<span class="hljs-title function_">slice</span>();
  <span class="hljs-keyword">const</span> result = [<span class="hljs-number">0</span>];
  <span class="hljs-keyword">let</span> i, j, u, v, c;
  <span class="hljs-keyword">const</span> len = arr.<span class="hljs-property">length</span>;
  <span class="hljs-keyword">for</span> (i = <span class="hljs-number">0</span>; i &lt; len; i++) {
    <span class="hljs-keyword">const</span> arrI = arr[i];
    <span class="hljs-keyword">if</span> (arrI !== <span class="hljs-number">0</span>) {
      j = result[result.<span class="hljs-property">length</span> - <span class="hljs-number">1</span>];
      <span class="hljs-keyword">if</span> (arr[j] &lt; arrI) {
        p[i] = j;
        result.<span class="hljs-title function_">push</span>(i);
        <span class="hljs-keyword">continue</span>;
      }
      u = <span class="hljs-number">0</span>;
      v = result.<span class="hljs-property">length</span> - <span class="hljs-number">1</span>;
      <span class="hljs-keyword">while</span> (u &lt; v) {
        c = (u + v) &gt;&gt; <span class="hljs-number">1</span>;
        <span class="hljs-keyword">if</span> (arr[result[c]] &lt; arrI) {
          u = c + <span class="hljs-number">1</span>;
        } <span class="hljs-keyword">else</span> {
          v = c;
        }
      }
      <span class="hljs-keyword">if</span> (arrI &lt; arr[result[u]]) {
        <span class="hljs-keyword">if</span> (u &gt; <span class="hljs-number">0</span>) p[i] = result[u - <span class="hljs-number">1</span>];
        result[u] = i;
      }
    }
  }
  u = result.<span class="hljs-property">length</span>;
  v = result[u - <span class="hljs-number">1</span>];
  <span class="hljs-keyword">while</span> (u-- &gt; <span class="hljs-number">0</span>) {
    result[u] = v;
    v = p[v];
  }
  <span class="hljs-keyword">return</span> result;
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">diff</span>(<span class="hljs-params">c1, c2</span>) {
  <span class="hljs-keyword">const</span> ops = [];
  <span class="hljs-keyword">let</span> i = <span class="hljs-number">0</span>;
  <span class="hljs-keyword">let</span> e1 = c1.<span class="hljs-property">length</span> - <span class="hljs-number">1</span>;
  <span class="hljs-keyword">let</span> e2 = c2.<span class="hljs-property">length</span> - <span class="hljs-number">1</span>;
  <span class="hljs-keyword">while</span> (i &lt;= e1 &amp;&amp; i &lt;= e2 &amp;&amp; c1[i] === c2[i]) i++;
  <span class="hljs-keyword">while</span> (i &lt;= e1 &amp;&amp; i &lt;= e2 &amp;&amp; c1[e1] === c2[e2]) { e1--; e2--; }
  <span class="hljs-keyword">if</span> (i &gt; e1) {
    <span class="hljs-keyword">for</span> (; i &lt;= e2; i++) ops.<span class="hljs-title function_">push</span>(<span class="hljs-string">\`挂载<span class="hljs-subst">\${c2[i]}</span>\`</span>);
  } <span class="hljs-keyword">else</span> <span class="hljs-keyword">if</span> (i &gt; e2) {
    <span class="hljs-keyword">for</span> (; i &lt;= e1; i++) ops.<span class="hljs-title function_">push</span>(<span class="hljs-string">\`卸载<span class="hljs-subst">\${c1[i]}</span>\`</span>);
  } <span class="hljs-keyword">else</span> {
    <span class="hljs-keyword">const</span> s = i;
    <span class="hljs-keyword">const</span> keyToNewIndex = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Map</span>();
    <span class="hljs-keyword">for</span> (<span class="hljs-keyword">let</span> k = s; k &lt;= e2; k++) keyToNewIndex.<span class="hljs-title function_">set</span>(c2[k], k);
    <span class="hljs-keyword">const</span> toBePatched = e2 - s + <span class="hljs-number">1</span>;
    <span class="hljs-keyword">const</span> newIndexToOldIndex = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Array</span>(toBePatched).<span class="hljs-title function_">fill</span>(<span class="hljs-number">0</span>);
    <span class="hljs-keyword">let</span> moved = <span class="hljs-literal">false</span>;
    <span class="hljs-keyword">let</span> maxNewIndexSoFar = <span class="hljs-number">0</span>;
    <span class="hljs-keyword">for</span> (<span class="hljs-keyword">let</span> k = s; k &lt;= e1; k++) {
      <span class="hljs-keyword">const</span> newIndex = keyToNewIndex.<span class="hljs-title function_">get</span>(c1[k]);
      <span class="hljs-keyword">if</span> (newIndex === <span class="hljs-literal">undefined</span>) {
        ops.<span class="hljs-title function_">push</span>(<span class="hljs-string">\`卸载<span class="hljs-subst">\${c1[k]}</span>\`</span>);
        <span class="hljs-keyword">continue</span>;
      }
      newIndexToOldIndex[newIndex - s] = k + <span class="hljs-number">1</span>;
      <span class="hljs-keyword">if</span> (newIndex &gt;= maxNewIndexSoFar) maxNewIndexSoFar = newIndex;
      <span class="hljs-keyword">else</span> moved = <span class="hljs-literal">true</span>;
    }
    <span class="hljs-keyword">const</span> seq = moved ? <span class="hljs-title function_">getSequence</span>(newIndexToOldIndex) : [];
    <span class="hljs-keyword">let</span> j = seq.<span class="hljs-property">length</span> - <span class="hljs-number">1</span>;
    <span class="hljs-keyword">for</span> (<span class="hljs-keyword">let</span> k = toBePatched - <span class="hljs-number">1</span>; k &gt;= <span class="hljs-number">0</span>; k--) {
      <span class="hljs-keyword">const</span> key = c2[s + k];
      <span class="hljs-keyword">if</span> (newIndexToOldIndex[k] === <span class="hljs-number">0</span>) ops.<span class="hljs-title function_">push</span>(<span class="hljs-string">\`挂载<span class="hljs-subst">\${key}</span>\`</span>);
      <span class="hljs-keyword">else</span> <span class="hljs-keyword">if</span> (moved) {
        <span class="hljs-keyword">if</span> (j &lt; <span class="hljs-number">0</span> || k !== seq[j]) ops.<span class="hljs-title function_">push</span>(<span class="hljs-string">\`移动<span class="hljs-subst">\${key}</span>\`</span>);
        <span class="hljs-keyword">else</span> j--;
      }
    }
  }
  <span class="hljs-keyword">return</span> ops.<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27; &#x27;</span>) || <span class="hljs-string">&#x27;无操作&#x27;</span>;
}

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">getSequence</span>([<span class="hljs-number">5</span>, <span class="hljs-number">3</span>, <span class="hljs-number">4</span>, <span class="hljs-number">0</span>])); <span class="hljs-comment">// [ 1, 2 ]</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">diff</span>([<span class="hljs-string">&#x27;a&#x27;</span>, <span class="hljs-string">&#x27;b&#x27;</span>, <span class="hljs-string">&#x27;c&#x27;</span>, <span class="hljs-string">&#x27;d&#x27;</span>, <span class="hljs-string">&#x27;e&#x27;</span>, <span class="hljs-string">&#x27;f&#x27;</span>, <span class="hljs-string">&#x27;g&#x27;</span>], [<span class="hljs-string">&#x27;a&#x27;</span>, <span class="hljs-string">&#x27;b&#x27;</span>, <span class="hljs-string">&#x27;e&#x27;</span>, <span class="hljs-string">&#x27;c&#x27;</span>, <span class="hljs-string">&#x27;d&#x27;</span>, <span class="hljs-string">&#x27;h&#x27;</span>, <span class="hljs-string">&#x27;f&#x27;</span>, <span class="hljs-string">&#x27;g&#x27;</span>])); <span class="hljs-comment">// 挂载h 移动e</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">diff</span>([<span class="hljs-string">&#x27;A&#x27;</span>, <span class="hljs-string">&#x27;B&#x27;</span>, <span class="hljs-string">&#x27;C&#x27;</span>, <span class="hljs-string">&#x27;D&#x27;</span>], [<span class="hljs-string">&#x27;D&#x27;</span>, <span class="hljs-string">&#x27;A&#x27;</span>, <span class="hljs-string">&#x27;B&#x27;</span>, <span class="hljs-string">&#x27;C&#x27;</span>])); <span class="hljs-comment">// 移动D</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">diff</span>([<span class="hljs-string">&#x27;a&#x27;</span>, <span class="hljs-string">&#x27;b&#x27;</span>], [<span class="hljs-string">&#x27;a&#x27;</span>, <span class="hljs-string">&#x27;b&#x27;</span>, <span class="hljs-string">&#x27;c&#x27;</span>])); <span class="hljs-comment">// 挂载c</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">diff</span>([<span class="hljs-string">&#x27;a&#x27;</span>, <span class="hljs-string">&#x27;b&#x27;</span>, <span class="hljs-string">&#x27;c&#x27;</span>], [<span class="hljs-string">&#x27;c&#x27;</span>, <span class="hljs-string">&#x27;b&#x27;</span>, <span class="hljs-string">&#x27;a&#x27;</span>])); <span class="hljs-comment">// 移动b 移动c</span>
</code></pre></div>
<p><code>getSequence</code> 返回的是下标，不是值。<code>[5, 3, 4, 0]</code> 的结果 <code>[1, 2]</code> 指的是第 1 和第 2 个位置，也就是 <code>c</code> 和 <code>d</code>。值为 0 的位置是新增节点，算法会直接跳过。</p>
<p>算法本身是经典的“贪心 + 二分”。<code>result</code> 保存当前找到的递增序列的下标，新值比末尾大就接在后面；否则用二分找到第一个不小于它的位置替换掉，让序列末尾尽量小，后面才更容易接上。<code>p</code> 记录每个元素接在谁后面，最后从末尾倒着走一遍，还原出真正的序列。整体复杂度是 O(n log n)。</p>
<p>第三个例子是把最后的 D 挪到最前面，只移动了一次 D。同样的变化，React 只往右走的策略会移动 A、B、C 三个，见<a href="/questions/react-diff/">《React 的 diff 算法怎样处理单节点和多节点？key 起什么作用？和 Vue 有什么不同？》</a>。</p>
<p>最后一个是整体反转，最长递增子序列只有一个元素，所以三个节点里有两个要移动。</p>
<h2>为什么要从后往前移动</h2>
<p>移动和挂载都要用 <code>insertBefore</code> 插到某个节点前面，这个参照节点叫锚点。Vue 用的锚点是新列表里当前节点的下一个节点的 DOM。</p>
<p>从后往前处理时，后面的节点已经放到正确位置了，拿它当锚点一定是对的。如果从前往后，后面的节点可能还没归位，锚点就不可靠。源码注释写的也是这个原因：倒着循环，才能用上一个处理好的节点做锚点。</p>
<h2>和 Vue 2 的双端比较有什么不同</h2>
<p>Vue 2 每轮尝试旧头对新头、旧尾对新尾、旧头对新尾、旧尾对新头四种配对，配不上再用 key 查表，遇到能复用的就当场移动。Vue 3 只从两端各同步一次，中间部分统一算出哪些节点不用动，再一次性移动其余节点，移动次数更少，详见<a href="/questions/vue2-diff/">《Vue 2 的 diff 算法是怎样比较子节点的？》</a>。</p>
<p>还有一点更重要。Vue 3 的编译器会给节点打上 PatchFlags，并用 Block 收集动态节点，模板里结构固定的部分运行时根本不进入这套子节点比较，见<a href="/questions/vue-compiler-optimizations/">《Vue 模板编译如何减少运行时更新工作？》</a>。</p>
<h2>常见追问</h2>
<p><strong>没写 key 的子节点会怎样？</strong></p>
<blockquote>
<p><code>patchKeyedChildren</code> 在第五步遇到没有 key 的旧节点时，会在新节点里找一个同样没有 key、类型相同、还没被匹配的节点来复用，相当于按顺序就地复用。所以列表项有自己的状态时，应该写稳定且唯一的 key。key 重复时，开发环境会发出 <code>Duplicate keys found during update</code> 的警告。</p>
</blockquote>
<p><strong>“移动”是重新创建 DOM 吗？</strong></p>
<blockquote>
<p>不是。移动是把已有的 DOM 节点用 <code>insertBefore</code> 挪到新位置，节点本身和里面的状态都保留。只有新增的节点才会创建，找不到对应新节点的旧节点才会卸载。</p>
</blockquote>`};export{e as default};