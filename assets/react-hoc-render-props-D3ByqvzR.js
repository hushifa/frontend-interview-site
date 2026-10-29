var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>好几个组件都要知道“网络是否在线”，这段监听 <code>online</code>、<code>offline</code> 事件的逻辑想写一次到处用。React 里有三种写法：高阶组件 <code>withOnlineStatus(Component)</code> 返回一个包了一层的新组件，把 <code>isOnline</code> 作为 prop 传进去；Render Props 写一个 <code>&lt;OnlineStatus&gt;</code>，让使用方传一个函数，拿到 <code>isOnline</code> 后自己决定渲染什么；自定义 Hook 写一个 <code>useOnlineStatus()</code>，组件里直接调用拿到返回值。</p>
<p>前两种是 Hooks 出现前的方案，它们都要多套一层组件。层数多了，DevTools 里会出现一层层的包装，旧版 React 文档称之为“wrapper hell”；高阶组件传进来的 prop 还看不出来自哪一层，多个高阶组件可能用了同一个 prop 名。自定义 Hook 不改变组件层级，数据从哪个函数返回一目了然。</p>
<p>所以新代码复用有状态的逻辑，首选自定义 Hook。Render Props 仍适合“逻辑在我这里，长什么样由你定”的场景，比如列表组件接收一个 <code>renderItem</code>。高阶组件主要出现在类组件时代的老代码和一些库的 API 里，旧版文档也说它在现代 React 代码里已不常用。</p>
<p>要注意，自定义 Hook 共享的是逻辑，不是状态，两个组件调用同一个 Hook，各有一份独立的状态。高阶组件不能在渲染过程中创建，否则每次都是新组件，整个子树会被卸载重建，状态全部丢失。</p>
</blockquote>
<h2>同一段逻辑的三种写法</h2>
<p>下面用“网络是否在线”这个例子，把三种写法放在一起，重点看使用方的代码分别长什么样。</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-comment">// 自定义 Hook：逻辑写成函数，组件直接调用</span>
<span class="hljs-keyword">function</span> <span class="hljs-title function_">useOnlineStatus</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">const</span> [isOnline, setIsOnline] = <span class="hljs-title function_">useState</span>(<span class="hljs-literal">true</span>);
  <span class="hljs-title function_">useEffect</span>(<span class="hljs-function">() =&gt;</span> {
    <span class="hljs-keyword">const</span> <span class="hljs-title function_">on</span> = (<span class="hljs-params"></span>) =&gt; <span class="hljs-title function_">setIsOnline</span>(<span class="hljs-literal">true</span>);
    <span class="hljs-keyword">const</span> <span class="hljs-title function_">off</span> = (<span class="hljs-params"></span>) =&gt; <span class="hljs-title function_">setIsOnline</span>(<span class="hljs-literal">false</span>);
    <span class="hljs-variable language_">window</span>.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;online&#x27;</span>, on);
    <span class="hljs-variable language_">window</span>.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;offline&#x27;</span>, off);
    <span class="hljs-keyword">return</span> <span class="hljs-function">() =&gt;</span> {
      <span class="hljs-variable language_">window</span>.<span class="hljs-title function_">removeEventListener</span>(<span class="hljs-string">&#x27;online&#x27;</span>, on);
      <span class="hljs-variable language_">window</span>.<span class="hljs-title function_">removeEventListener</span>(<span class="hljs-string">&#x27;offline&#x27;</span>, off);
    };
  }, []);
  <span class="hljs-keyword">return</span> isOnline;
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">SaveButton</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">const</span> isOnline = <span class="hljs-title function_">useOnlineStatus</span>();
  <span class="hljs-keyword">return</span> <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">button</span> <span class="hljs-attr">disabled</span>=<span class="hljs-string">{!isOnline}</span>&gt;</span>保存<span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span></span>;
}

<span class="hljs-comment">// Render Props：组件负责逻辑，渲染交给传进来的函数</span>
<span class="hljs-keyword">function</span> <span class="hljs-title function_">OnlineStatus</span>(<span class="hljs-params">{ render }</span>) {
  <span class="hljs-keyword">const</span> isOnline = <span class="hljs-title function_">useOnlineStatus</span>();
  <span class="hljs-keyword">return</span> <span class="hljs-title function_">render</span>(isOnline);
}

&lt;<span class="hljs-title class_">OnlineStatus</span> render={<span class="hljs-function">(<span class="hljs-params">isOnline</span>) =&gt;</span> <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">button</span> <span class="hljs-attr">disabled</span>=<span class="hljs-string">{!isOnline}</span>&gt;</span>保存<span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span></span>} /&gt;;

<span class="hljs-comment">// 高阶组件：接收一个组件，返回一个注入了 isOnline 的新组件</span>
<span class="hljs-keyword">function</span> <span class="hljs-title function_">withOnlineStatus</span>(<span class="hljs-params">Component</span>) {
  <span class="hljs-keyword">return</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">WithOnlineStatus</span>(<span class="hljs-params">props</span>) {
    <span class="hljs-keyword">const</span> isOnline = <span class="hljs-title function_">useOnlineStatus</span>();
    <span class="hljs-keyword">return</span> <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">Component</span> {<span class="hljs-attr">...props</span>} <span class="hljs-attr">isOnline</span>=<span class="hljs-string">{isOnline}</span> /&gt;</span></span>;
  };
}

<span class="hljs-keyword">const</span> <span class="hljs-title class_">SaveButtonWithStatus</span> = <span class="hljs-title function_">withOnlineStatus</span>(<span class="hljs-keyword">function</span> (<span class="hljs-params">{ isOnline }</span>) {
  <span class="hljs-keyword">return</span> <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">button</span> <span class="hljs-attr">disabled</span>=<span class="hljs-string">{!isOnline}</span>&gt;</span>保存<span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span></span>;
});
</code></pre></div>
<p>为了对比，这里后两种也借用了 <code>useOnlineStatus</code>。在 Hooks 出现之前，它们内部是用类组件的 state 和生命周期实现的，那时这两种模式是复用有状态逻辑的主要办法。</p>
<p>三种写法的差别在使用方。自定义 Hook 的版本里，<code>isOnline</code> 就是一个普通变量，从哪里来一眼能看到。Render Props 的版本多了一层 <code>&lt;OnlineStatus&gt;</code>，数据通过函数参数传出来，嵌套几个这样的组件，代码就会一层套一层往右缩进。高阶组件的版本里，<code>SaveButtonWithStatus</code> 的 props 里突然多了 <code>isOnline</code>，读组件本身看不出它从哪来；再套上 <code>withRouter</code>、<code>withTheme</code>，就要去查每个高阶组件注入了什么，名字重复时后面的会覆盖前面的。</p>
<h2>Hooks 为什么能替代大部分场景</h2>
<p>旧版 React 文档在介绍 Hooks 的动机时说，React 没有提供把可复用行为“附加”到组件上的办法，Render Props 和高阶组件试图解决这个问题，但使用时要重新组织组件结构，代码更难读；DevTools 里常能看到 Provider、Consumer、高阶组件、Render Props 一层层包起来的“wrapper hell”。Hooks 让你在不改变组件层级的情况下复用有状态的逻辑。</p>
<p>有人会担心：两个组件都调用 <code>useOnlineStatus</code>，它们是不是共用一个 <code>isOnline</code>？不是。React 文档说明，自定义 Hook 只共享有状态的逻辑，不共享状态本身，每次调用 Hook 都与其他调用完全独立。两个组件显示同一个值，只是因为它们都同步了同一个外部数据源，也就是浏览器的网络状态。想要真正共享一份状态，要把状态提升到共同父组件或用 Context。</p>
<h2>Render Props 还适合什么时候用</h2>
<p>自定义 Hook 只交出数据，渲染完全由调用方负责。有些组件除了逻辑还有自己的结构，只想把其中一块的样子交给使用方，这时 Render Props 更合适。React 文档在讲 <code>cloneElement</code> 的替代方案时就推荐了这种写法：列表组件接收一个 <code>renderItem</code> 函数，组件自己负责遍历和高亮哪一项，每一项长什么样由使用方决定。</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx">&lt;<span class="hljs-title class_">List</span>
  items={products}
  renderItem={<span class="hljs-function">(<span class="hljs-params">product, isHighlighted</span>) =&gt;</span> (
    <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">Row</span> <span class="hljs-attr">key</span>=<span class="hljs-string">{product.id}</span> <span class="hljs-attr">title</span>=<span class="hljs-string">{product.title}</span> <span class="hljs-attr">isHighlighted</span>=<span class="hljs-string">{isHighlighted}</span> /&gt;</span></span>
  )}
/&gt;
</code></pre></div>
<p>文档解释了名字的由来：<code>renderItem</code> 是一个指定“怎么渲染某样东西”的 prop，所以叫 render prop。旧版文档也说，只要是组件用来决定渲染什么的函数 prop，严格来说都是 render prop，它不一定叫 <code>render</code>，把 <code>children</code> 写成函数也是同一种模式。</p>
<h2>高阶组件要注意什么</h2>
<p>高阶组件就是一个函数，接收一个组件，返回一个新组件。它在类组件时代很常见，比如给组件注入 store 里的数据。旧版文档列出了几个容易踩的坑。</p>
<p>最重要的一条是不要在渲染过程中调用高阶组件。React 靠组件的引用判断是不是同一个组件，每次渲染都调用 <code>withOnlineStatus(Button)</code>，得到的都是一个新组件，React 会把旧的子树整个卸载、再挂载新的，组件和它所有子组件的状态都会丢失。所以高阶组件要在组件定义之外调用，只创建一次。另外，包装后的新组件不会自动带上原组件的静态方法，需要手动复制。</p>
<h2>常见追问</h2>
<p><strong>自定义 Hook 能完全取代高阶组件吗？</strong></p>
<blockquote>
<p>复用有状态的逻辑基本可以。高阶组件还有一些用法 Hook 做不到，比如在外面包一层布局、错误边界，或者给第三方组件统一加上某些 props，这些本质上是“包一层组件”，用普通的包装组件或高阶组件实现更直接。</p>
</blockquote>
<p><strong>自定义 Hook 为什么必须以 use 开头？</strong></p>
<blockquote>
<p>React 文档要求 Hook 的名字以 <code>use</code> 开头、后面跟一个大写字母，这样人和 lint 工具一眼就能看出这个函数内部调用了 Hook，要遵守 Hook 的调用规则。反过来，函数内部不调用任何 Hook，就不要用 <code>use</code> 开头。</p>
</blockquote>
<p><strong>Render Props 会不会有性能问题？</strong></p>
<blockquote>
<p>旧版文档提醒过，在渲染时创建的内联函数每次都是新的，会让 <code>PureComponent</code> 的浅比较失效，用 <code>memo</code> 也是同样的道理。大多数情况下这不是瓶颈；确实需要时，可以用 <code>useCallback</code> 让函数保持同一个引用。</p>
</blockquote>`};export{e as default};