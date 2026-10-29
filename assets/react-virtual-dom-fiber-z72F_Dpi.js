var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>写 <code>&lt;button className=&quot;primary&quot;&gt;保存&lt;/button&gt;</code> 时，组件返回的并不是真实 DOM，而是一个普通的 JS 对象，描述“这里应该有一个按钮，class 是 primary，文字是保存”。这些对象组成的树常被叫作虚拟 DOM。状态变化时，React 重新调用组件得到一棵新树，跟上一次比较，只把有差异的地方改到真实 DOM 上，这个比较的过程叫协调，比较算法就是常说的 diff。</p>
<p>完整比较两棵树找最少改动，复杂度是 O(n³)，React 用了两条假设把它降到 O(n)。第一，类型不同的元素产生不同的树，比如 <code>&lt;div&gt;</code> 换成 <code>&lt;span&gt;</code>、<code>&lt;Article&gt;</code> 换成 <code>&lt;Comment&gt;</code>，就把旧的整棵卸载、重新创建，里面的状态全部丢掉。第二，列表里的子元素用 <code>key</code> 标识，React 靠 key 认出哪一项是哪一项。类型相同的 DOM 元素则保留节点，只更新变了的属性。</p>
<p>Fiber 是 React 16 换的新协调器。以前的渲染一旦开始就要递归到底，组件树很大时会长时间占着主线程，用户输入得不到响应。Fiber 把渲染工作拆成一个个小单元，每个组件对应一个 fiber 节点，这样渲染就可以暂停、继续，按优先级先处理紧急的更新。React 18 的并发特性，比如 <code>useTransition</code>，就建立在这个基础上。</p>
<p>要注意，虚拟 DOM 不等于一定比直接操作 DOM 快，它省掉的是手动找差异、手动改 DOM 的工作。真正决定性能的，是有多少组件被重新渲染、每次渲染做了多少计算。</p>
</blockquote>
<h2>类型变了，状态为什么会丢</h2>
<p>先看一个例子。根据 <code>isFancy</code> 切换外层标签，里面的 <code>Counter</code> 看起来没变：</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">function</span> <span class="hljs-title function_">App</span>(<span class="hljs-params">{ isFancy }</span>) {
  <span class="hljs-keyword">return</span> isFancy ? (
    <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">div</span> <span class="hljs-attr">className</span>=<span class="hljs-string">&quot;fancy&quot;</span>&gt;</span><span class="hljs-tag">&lt;<span class="hljs-name">Counter</span> /&gt;</span><span class="hljs-tag">&lt;/<span class="hljs-name">div</span>&gt;</span></span>
  ) : (
    <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">section</span>&gt;</span><span class="hljs-tag">&lt;<span class="hljs-name">Counter</span> /&gt;</span><span class="hljs-tag">&lt;/<span class="hljs-name">section</span>&gt;</span></span>
  );
}
</code></pre></div>
<p>用户把计数点到 5，然后切换 <code>isFancy</code>，计数器回到了 0。</p>
<p>原因在第一条假设上。React 比较时发现同一位置的根元素从 <code>&lt;section&gt;</code> 变成了 <code>&lt;div&gt;</code>，类型不同，它不会再往里比较，而是直接把旧的整棵子树卸载，连同里面的 <code>Counter</code> 和它的状态一起丢掉，再按新的结构重新创建。</p>
<p>React 文档的说法是：状态跟着组件在渲染树中的位置走。同一位置渲染同一类型的组件，状态保留；换了类型，整棵子树的状态都会重置。所以想保留状态，要让外层结构保持一致，比如两种情况都用 <code>&lt;div&gt;</code>，只改 <code>className</code>。反过来，想主动重置一个组件，可以给它换一个 <code>key</code>，详见<a href="/questions/react-key/">《列表中的 key 为什么不能随意使用数组下标？》</a>。</p>
<h2>同类型的元素怎么比较</h2>
<p>如果新旧两个元素类型相同，比如都是 <code>&lt;div&gt;</code>，React 保留原来的 DOM 节点，只对比属性：</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx">&lt;div className=<span class="hljs-string">&quot;before&quot;</span> title=<span class="hljs-string">&quot;stuff&quot;</span> /&gt;
<span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">div</span> <span class="hljs-attr">className</span>=<span class="hljs-string">&quot;after&quot;</span> <span class="hljs-attr">title</span>=<span class="hljs-string">&quot;stuff&quot;</span> /&gt;</span></span>
</code></pre></div>
<p>这里只有 <code>className</code> 变了，React 就只改这一个属性。<code>style</code> 也一样，只更新变了的那几个样式。</p>
<p>如果是同类型的组件，比如都是 <code>&lt;Counter&gt;</code>，组件实例保留，状态也保留，React 用新的 props 再调用它一次，然后递归比较它返回的子树。</p>
<h2>列表为什么需要 key</h2>
<p>比较一组子元素时，React 默认按顺序一一对应。在列表末尾加一项，前面的都能对上，没问题；可是在开头插入一项，第 1 个对第 1 个、第 2 个对第 2 个，每一项都会被认为“变了”，于是全部更新一遍，带状态的子组件还会错位。</p>
<p>有了 key，React 就按 key 去对应，能认出原来的项只是往后挪了一位，只需要新建开头那一项。这就是为什么 key 要用数据自己的 ID，而不是数组下标。</p>
<h2>Fiber 解决了什么问题</h2>
<p>React 16 之前的协调器常被叫作 Stack Reconciler，它用递归的方式遍历组件树。递归一旦开始，就要一直执行到整棵树比较完才停，中途没法让出主线程。组件树很大时，一次更新可能持续几十甚至上百毫秒，这期间用户打字、点击都要排队等着，页面就会卡。</p>
<p>Fiber 换了一种做法。它把每个组件对应成一个 fiber 节点，节点之间用 <code>child</code>、<code>sibling</code>、<code>return</code> 指针连起来，遍历从递归改成了循环。这样一来，渲染工作就被拆成了一个个可以单独处理的单元，React 处理完一个单元，可以先看看有没有更紧急的事，有就暂停当前的工作，回头再继续，或者干脆丢掉重来。</p>
<p>这正是<a href="/questions/react-render-commit/">《React 的渲染阶段与提交阶段有什么区别？》</a>里说的：渲染阶段可以被打断，提交阶段必须一口气做完。因为渲染阶段只是在内存里算新树，打断了也不会让用户看到一半的界面；提交阶段要改真实 DOM，所以不能中断。</p>
<h2>常见追问</h2>
<p><strong>虚拟 DOM 一定比直接操作 DOM 快吗？</strong></p>
<blockquote>
<p>不一定。手写一个精确的 DOM 操作，比如只改一个元素的文字，肯定比先生成虚拟 DOM 再比较要快。虚拟 DOM 的价值在于，你只要描述界面应该是什么样，React 帮你算出要改哪里，代码好写好维护，大多数场景下性能也够用。</p>
</blockquote>
<p><strong>React 的 diff 和 Vue 的 diff 有什么不同？</strong></p>
<blockquote>
<p>两者都只比较同一层、都靠 key 复用节点。差别在列表的处理上，Vue 2 用双端比较，Vue 3 用最长递增子序列减少移动；Vue 3 的编译器还会标出哪些节点是动态的，更新时可以跳过静态内容。具体见<a href="/questions/vue2-diff/">《Vue 2 的 diff 算法是怎样比较子节点的？》</a>。</p>
</blockquote>
<p><strong>Fiber 让 React 变成多线程了吗？</strong></p>
<blockquote>
<p>没有。JavaScript 还是在主线程上单线程执行。Fiber 做的是把一大块工作切小，在小块之间让出主线程，让浏览器有机会处理用户输入和绘制，这叫时间切片。</p>
</blockquote>`};export{e as default};