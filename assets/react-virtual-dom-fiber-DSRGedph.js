var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>写 <code>&lt;button className=&quot;primary&quot;&gt;保存&lt;/button&gt;</code> 时，组件返回的并不是真实 DOM，而是一个普通的 JS 对象，描述“这里应该有一个按钮，class 是 primary，文字是保存”。这些对象组成的树常被叫作虚拟 DOM。状态变化时，React 重新调用组件得到一棵新树，跟上一次比较，只把有差异的地方改到真实 DOM 上，这个比较的过程叫协调，比较算法就是常说的 diff。</p>
<p>比较新旧两棵树的具体规则，比如类型不同就整棵重建、列表靠 key 对应，见<a href="/questions/react-diff/">《React 的 diff 算法怎样处理单节点和多节点？key 起什么作用？和 Vue 有什么不同？》</a>。这里讲虚拟 DOM 本身和执行比较的 Fiber 架构。</p>
<p>Fiber 是 React 16 换的新协调器。以前的渲染一旦开始就要递归到底，组件树很大时会长时间占着主线程，用户输入得不到响应。Fiber 把渲染工作拆成一个个小单元，每个组件对应一个 fiber 节点，这样渲染就可以暂停、继续，按优先级先处理紧急的更新。React 18 的并发特性，比如 <code>useTransition</code>，就建立在这个基础上。</p>
<p>要注意，虚拟 DOM 不等于一定比直接操作 DOM 快，它省掉的是手动找差异、手动改 DOM 的工作。真正决定性能的，是有多少组件被重新渲染、每次渲染做了多少计算。</p>
</blockquote>
<h2>虚拟 DOM 就是普通对象</h2>
<p>JSX 只是语法糖，<code>&lt;button className=&quot;primary&quot;&gt;保存&lt;/button&gt;</code> 编译后调用的是创建元素的函数，返回一个普通对象，大致长这样：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js">{
  <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;button&#x27;</span>,
  <span class="hljs-attr">props</span>: { <span class="hljs-attr">className</span>: <span class="hljs-string">&#x27;primary&#x27;</span>, <span class="hljs-attr">children</span>: <span class="hljs-string">&#x27;保存&#x27;</span> },
}
</code></pre></div>
<p><code>type</code> 是字符串时代表原生标签，是函数时代表组件。React 调用组件函数，拿到它返回的元素，再一层层往下展开，就得到整棵界面描述。组件每次渲染都会生成一批新对象，它们只是一次性的描述，创建成本很低，真正要保留的状态不放在这些对象上。</p>
<p>那状态存在哪里？存在 fiber 节点上。元素对象每次渲染都会换新，fiber 节点则会跨渲染保留，<code>useState</code> 的值、副作用列表都挂在对应的 fiber 上。这也是为什么组件在树中的位置决定了状态归属。</p>
<h2>Fiber 解决了什么问题</h2>
<p>React 16 之前的协调器常被叫作 Stack Reconciler，它用递归的方式遍历组件树。递归一旦开始，就要一直执行到整棵树比较完才停，中途没法让出主线程。组件树很大时，一次更新可能持续几十甚至上百毫秒，这期间用户打字、点击都要排队等着，页面就会卡。</p>
<p>Fiber 换了一种做法。它把每个组件对应成一个 fiber 节点，节点之间用 <code>child</code>、<code>sibling</code>、<code>return</code> 指针连起来，遍历从递归改成了循环。这样一来，渲染工作就被拆成了一个个可以单独处理的单元，React 处理完一个单元，可以先看看有没有更紧急的事，有就暂停当前的工作，回头再继续，或者干脆丢掉重来。</p>
<p>这正是<a href="/questions/react-render-commit/">《React 的渲染阶段与提交阶段有什么区别？》</a>里说的：渲染阶段可以被打断，提交阶段必须一口气做完。因为渲染阶段只是在内存里算新树，打断了也不会让用户看到一半的界面；提交阶段要改真实 DOM，所以不能中断。</p>
<h2>新树在哪里算</h2>
<p>acdlite 的 Fiber 架构说明里提到，每个 fiber 有一个 <code>alternate</code> 字段，指向它的另一个版本：一边是屏幕上正在显示的那棵树，一边是正在计算的新树。渲染阶段只修改新树，算完以后在提交阶段一次性换上，所以用户不会看到算到一半的界面。</p>
<h2>常见追问</h2>
<p><strong>虚拟 DOM 一定比直接操作 DOM 快吗？</strong></p>
<blockquote>
<p>不一定。手写一个精确的 DOM 操作，比如只改一个元素的文字，肯定比先生成虚拟 DOM 再比较要快。虚拟 DOM 的价值在于，你只要描述界面应该是什么样，React 帮你算出要改哪里，代码好写好维护，大多数场景下性能也够用。</p>
</blockquote>
<p><strong>Fiber 让 React 变成多线程了吗？</strong></p>
<blockquote>
<p>没有。JavaScript 还是在主线程上单线程执行。Fiber 做的是把一大块工作切小，在小块之间让出主线程，让浏览器有机会处理用户输入和绘制，这叫时间切片。</p>
</blockquote>`};export{e as default};