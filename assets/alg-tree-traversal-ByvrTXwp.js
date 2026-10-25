var e={answerHtml:`<p>前序遍历先访问当前节点，然后按约定顺序完整遍历它的每棵子树。对于普通 children 数组，通常按从左到右的顺序。</p>
<p>它不是“先输出所有父节点，再输出所有子节点”。例如 A 的孩子是 B、C，B 下面还有 D、E，C 下面有 F，前序结果应当是 <code>A、B、D、E、C、F</code>。B 的子树处理完，才轮到 C。</p>
<h2>用栈记录还没处理的节点</h2>
<p>递归会把“之后还要回到哪里继续”保存在函数调用栈里。显式栈把待访问节点保存在数组中，用循环推进，避免深度完全依赖 JavaScript 的函数调用栈容量。</p>
<p>下面约定节点是普通对象，children 缺失或为 null 时表示没有子节点；非空 children 必须是数组。输入应是无环树，遍历期间不修改它。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">preorder</span>(<span class="hljs-params">root</span>) {
  <span class="hljs-keyword">if</span> (root == <span class="hljs-literal">null</span>) <span class="hljs-keyword">return</span> [];
  <span class="hljs-keyword">const</span> stack = [root];
  <span class="hljs-keyword">const</span> values = [];

  <span class="hljs-keyword">while</span> (stack.<span class="hljs-property">length</span> &gt; <span class="hljs-number">0</span>) {
    <span class="hljs-keyword">const</span> node = stack.<span class="hljs-title function_">pop</span>();
    <span class="hljs-keyword">if</span> (node === <span class="hljs-literal">null</span> || <span class="hljs-keyword">typeof</span> node !== <span class="hljs-string">&#x27;object&#x27;</span>) {
      <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">TypeError</span>(<span class="hljs-string">&#x27;树节点必须是对象&#x27;</span>);
    }

    <span class="hljs-keyword">const</span> children = node.<span class="hljs-property">children</span> ?? [];
    <span class="hljs-keyword">if</span> (!<span class="hljs-title class_">Array</span>.<span class="hljs-title function_">isArray</span>(children)) {
      <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">TypeError</span>(<span class="hljs-string">&#x27;children 必须是数组&#x27;</span>);
    }

    values.<span class="hljs-title function_">push</span>(node.<span class="hljs-property">value</span>);
    <span class="hljs-keyword">for</span> (<span class="hljs-keyword">let</span> index = children.<span class="hljs-property">length</span> - <span class="hljs-number">1</span>; index &gt;= <span class="hljs-number">0</span>; index--) {
      stack.<span class="hljs-title function_">push</span>(children[index]);
    }
  }

  <span class="hljs-keyword">return</span> values;
}
</code></pre></div>
<p>每次循环先弹出一个节点，再立即记录它的值，这对应前序的“先访问当前节点”。之后把子节点放进待处理栈，后续循环继续处理它们。</p>
<p>这里只读取树结构，改变的是新建的 stack 和 values，不会通过 pop 或 reverse 去修改原来的 children 数组。value 若是对象，返回的是相应引用，不是自动做了深拷贝。</p>
<h2>为什么必须把孩子反过来压入栈</h2>
<p>栈后进先出。要让 B 在 C 之前弹出，就要先压 C，再压 B。</p>
<p>下面把栈顶写在右边，沿例子走一遍：</p>
<table><thead><tr><th>本次弹出的节点</th><th>记录后压入孩子</th><th>下一轮前的栈，右侧为栈顶</th></tr></thead><tbody><tr><td>A</td><td>先 C，再 B</td><td><code>[C, B]</code></td></tr><tr><td>B</td><td>先 E，再 D</td><td><code>[C, E, D]</code></td></tr><tr><td>D</td><td>没有孩子</td><td><code>[C, E]</code></td></tr><tr><td>E</td><td>没有孩子</td><td><code>[C]</code></td></tr><tr><td>C</td><td>压入 F</td><td><code>[F]</code></td></tr><tr><td>F</td><td>没有孩子</td><td><code>[]</code></td></tr></tbody></table>
<p>如果按 children 的正序压栈，就会先弹出最右边的孩子，结果顺序被反转。反向的是“入栈动作”，不是树本身的逻辑访问顺序。</p>
<p>可以直接运行这个数据：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> tree = {
  <span class="hljs-attr">value</span>: <span class="hljs-string">&#x27;A&#x27;</span>,
  <span class="hljs-attr">children</span>: [
    { <span class="hljs-attr">value</span>: <span class="hljs-string">&#x27;B&#x27;</span>, <span class="hljs-attr">children</span>: [{ <span class="hljs-attr">value</span>: <span class="hljs-string">&#x27;D&#x27;</span> }, { <span class="hljs-attr">value</span>: <span class="hljs-string">&#x27;E&#x27;</span> }] },
    { <span class="hljs-attr">value</span>: <span class="hljs-string">&#x27;C&#x27;</span>, <span class="hljs-attr">children</span>: [{ <span class="hljs-attr">value</span>: <span class="hljs-string">&#x27;F&#x27;</span> }] },
  ],
};

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">preorder</span>(tree).<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;、&#x27;</span>));
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">preorder</span>(<span class="hljs-literal">null</span>));
</code></pre></div>
<p>输出依次是 <code>A、B、D、E、C、F</code> 和空数组。只有根节点时，只输出根的值；children 为空数组时，不会再压入待访问节点。</p>
<h2>复杂度不能只背“DFS 空间是树高”</h2>
<p>对一棵包含 n 个节点的有限树，每个节点入栈、出栈和访问一次，边总数与节点数同阶，因此这份遍历的时间复杂度是 O(n)。这里不把读取自定义 getter 或处理复杂 value 的额外工作假定成免费。</p>
<p>结果数组需要 O(n) 空间。待访问栈的峰值则与树形状有关：一条很深的单链，在这份实现中通常只需保留很少的待访问节点；但一个根节点带有 n-1 个孩子的宽树，会一下子把这些孩子全部压入栈，辅助栈可达到 O(n)。</p>
<p>所以对这份“把所有孩子压入栈”的多叉树实现，不能直接宣称额外空间始终 O(h)。如果改成保存“当前节点与下一个孩子下标”的遍历帧，才可以用另一种状态组织方式让深度优先过程更接近按路径保存，复杂度分析也应跟着实现改变。</p>
<p>若只需逐项处理或提前停止，不一定要收集完整 values，可以设计生成器或访问回调。但生成器是惰性输出接口，不会自动把每一步变成后台工作，也不会凭空取消算法的存储需求。</p>
<h2>避开递归调用栈，不等于没有性能限制</h2>
<p>深树递归可能报 Maximum call stack size exceeded 等错误，具体深度与引擎和调用内容有关，不能记成所有浏览器统一的一万层。显式循环避免了这类递归层数限制，但数据和结果仍占内存。</p>
<p>遍历十万个节点也仍是同步计算，放在页面主线程可能造成卡顿。需要保持交互时，可以分片让出或在适合的数据场景中使用 Worker；这些调度选择与前序顺序本身是两层问题。</p>
<h2>输入如果其实是图，需要先决定访问语义</h2>
<p>真正的树没有环，普通树遍历也假定每个节点属于对应的树结构。如果某个节点既被 B 引用又被 C 引用，这份函数会沿两条路径访问它两次；如果还有环，就可能一直压栈，无法结束。</p>
<p>可以用 Set 按对象身份记录已访问节点，但这样做改变了语义：共享节点只输出一次，而不是每条树路径都输出一次。两个内容相同但引用不同的对象，又不会因为值一样就被这个 Set 视为同一个节点。</p>
<p>业务有时需要检测重复就报错，有时需要按节点 ID 去重，有时允许共享节点沿不同路径出现。应该先明确数据模型，再选择图遍历、环检测或树遍历，不能在不知道需求时随便加一个 visited 就声称全部问题解决。</p>
<p>示例的类型检查只帮助拒绝明显不符合结构的输入，并不完整验证“无环且无共享子节点”。从外部导入层级数据时，还应有相应结构校验与大小上限，避免把错误数据交给一个假定它是树的循环。</p>`};export{e as default};