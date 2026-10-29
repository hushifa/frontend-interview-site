var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>一个弹窗组件写在卡片里面，卡片有 <code>overflow: hidden</code>，弹窗就被裁掉了。<code>createPortal</code> 能把弹窗的 DOM 放到 <code>document.body</code> 下面，绕开父元素的样式限制。它只改 DOM 的物理位置，在 React 树里弹窗还是卡片的子组件，能读到上层的 context，事件也按 React 树往上冒泡。</p>
<p><code>forwardRef</code> 解决的是另一件事：父组件想拿到子组件内部的 <code>&lt;input&gt;</code> 来调用 <code>focus()</code>。以前函数组件收不到 <code>ref</code>，要用 <code>forwardRef</code> 包一层。React 19 起 <code>ref</code> 可以像普通 prop 一样直接接收，react.dev 写明 <code>forwardRef</code> 已经不再需要，将在未来的版本里弃用。</p>
<p><code>useImperativeHandle</code> 用来控制父组件拿到的是什么。不想把整个 DOM 节点交出去，就只暴露 <code>focus</code>、<code>scrollIntoView</code> 这样几个方法，父组件拿不到底层节点，也就没法随便改它。</p>
<p>要注意不要滥用 ref。官方的建议是，能用 props 表达的就别用 ref，比如弹窗的开关用 <code>isOpen</code> 这个 prop，而不是暴露 <code>open()</code>、<code>close()</code> 方法。ref 只留给滚动、聚焦、触发动画、选中文字这类命令式操作。</p>
</blockquote>
<h2>Portal 把 DOM 放到哪里</h2>
<p>下面这段代码要看两个 <code>&lt;p&gt;</code> 最后各自出现在哪：</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">import</span> { createPortal } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;react-dom&#x27;</span>;

<span class="hljs-keyword">function</span> <span class="hljs-title function_">MyComponent</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">return</span> (
    <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">div</span> <span class="hljs-attr">style</span>=<span class="hljs-string">{{</span> <span class="hljs-attr">border:</span> &#x27;<span class="hljs-attr">2px</span> <span class="hljs-attr">solid</span> <span class="hljs-attr">black</span>&#x27; }}&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">p</span>&gt;</span>这一段在父元素 div 里。<span class="hljs-tag">&lt;/<span class="hljs-name">p</span>&gt;</span>
      {createPortal(<span class="hljs-tag">&lt;<span class="hljs-name">p</span>&gt;</span>这一段在 document.body 里。<span class="hljs-tag">&lt;/<span class="hljs-name">p</span>&gt;</span>, document.body)}
    <span class="hljs-tag">&lt;/<span class="hljs-name">div</span>&gt;</span></span>
  );
}
</code></pre></div>
<p>两段文字写在同一个 <code>div</code> 里，可是浏览器里第二段出现在带边框的 <code>div</code> 外面，成了 <code>body</code> 的子节点。所以父元素的 <code>overflow: hidden</code>、<code>z-index</code> 层叠上下文这类样式就管不到它了，弹窗、提示框、下拉菜单常这样做。为什么父元素会裁掉浮层，见<a href="/questions/css-position-containing-block/">《absolute、fixed 和 sticky 的定位参照是什么？》</a>。</p>
<p>那它和普通子组件还有区别吗？react.dev 说得很清楚：Portal 只改变 DOM 节点的物理位置，其他方面都和普通子组件一样。它能读到父组件提供的 context，事件也按 React 树而不是 DOM 树冒泡。所以 Portal 里点击一个按钮，外层 <code>div</code> 上的 <code>onClick</code> 也会触发，尽管在 DOM 里它们根本不是父子关系。不想要这种冒泡，可以在 Portal 内部阻止事件传播，或者把 Portal 移到 React 树更上层。</p>
<p><code>createPortal</code> 的第二个参数是目标 DOM 节点。更新时换成另一个节点，Portal 里的内容会被重新创建。它还能把 React 组件渲染进一段不归 React 管的 DOM，比如地图库或旧页面留出来的容器。</p>
<h2>React 19 之前为什么需要 forwardRef</h2>
<p>父组件写 <code>&lt;MyInput ref={inputRef} /&gt;</code>，想拿到里面的 <code>&lt;input&gt;</code>。在 React 19 之前，函数组件的 props 里收不到 <code>ref</code>，所以要这样写：</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">import</span> { forwardRef } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;react&#x27;</span>;

<span class="hljs-keyword">const</span> <span class="hljs-title class_">MyInput</span> = <span class="hljs-title function_">forwardRef</span>(<span class="hljs-keyword">function</span> <span class="hljs-title function_">MyInput</span>(<span class="hljs-params">props, ref</span>) {
  <span class="hljs-keyword">return</span> <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">input</span> {<span class="hljs-attr">...props</span>} <span class="hljs-attr">ref</span>=<span class="hljs-string">{ref}</span> /&gt;</span></span>;
});
</code></pre></div>
<p><code>forwardRef</code> 把 <code>ref</code> 作为第二个参数交给组件，组件再把它放到真正的 <code>&lt;input&gt;</code> 上。React 19 起不用这一层了，<code>ref</code> 直接出现在 props 里：</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">function</span> <span class="hljs-title function_">MyInput</span>(<span class="hljs-params">{ ref, ...props }</span>) {
  <span class="hljs-keyword">return</span> <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">input</span> {<span class="hljs-attr">...props</span>} <span class="hljs-attr">ref</span>=<span class="hljs-string">{ref}</span> /&gt;</span></span>;
}
</code></pre></div>
<p>react.dev 的 <code>forwardRef</code> 页面现在标为 Deprecated，原文是：在 React 19 中 <code>forwardRef</code> 不再需要，改为把 <code>ref</code> 作为 prop 传递；<code>forwardRef</code> 将在未来的版本中弃用。所以老代码还能跑，新代码直接用 prop 写法。升级时怎样批量改，见<a href="/questions/framework-react19-migration/">《React 18 项目升级到 React 19，怎样分步迁移并验证行为？》</a>。</p>
<h2>useImperativeHandle 暴露什么</h2>
<p>上面那种写法会把整个 <code>&lt;input&gt;</code> 节点交给父组件，父组件想怎么改就怎么改。如果只想让它调用两个方法，可以用 <code>useImperativeHandle</code> 自己定义 ref 拿到的对象。下面要看父组件最后拿到了什么：</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">import</span> { useRef, useImperativeHandle } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;react&#x27;</span>;

<span class="hljs-keyword">function</span> <span class="hljs-title function_">MyInput</span>(<span class="hljs-params">{ ref, ...props }</span>) {
  <span class="hljs-keyword">const</span> inputRef = <span class="hljs-title function_">useRef</span>(<span class="hljs-literal">null</span>);

  <span class="hljs-title function_">useImperativeHandle</span>(ref, <span class="hljs-function">() =&gt;</span> ({
    <span class="hljs-title function_">focus</span>(<span class="hljs-params"></span>) {
      inputRef.<span class="hljs-property">current</span>.<span class="hljs-title function_">focus</span>();
    },
    <span class="hljs-title function_">scrollIntoView</span>(<span class="hljs-params"></span>) {
      inputRef.<span class="hljs-property">current</span>.<span class="hljs-title function_">scrollIntoView</span>();
    },
  }), []);

  <span class="hljs-keyword">return</span> <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">input</span> {<span class="hljs-attr">...props</span>} <span class="hljs-attr">ref</span>=<span class="hljs-string">{inputRef}</span> /&gt;</span></span>;
}
</code></pre></div>
<p>父组件的 <code>ref.current</code> 现在是 <code>{ focus, scrollIntoView }</code> 这个对象，而不是 <code>&lt;input&gt;</code>。所以它能调用 <code>ref.current.focus()</code>，却拿不到 <code>ref.current.style</code>。暴露的方法也不一定要和 DOM 方法一一对应，官方例子里 <code>Post</code> 组件暴露的是 <code>scrollAndFocusAddComment</code>，一个方法里先滚动列表再聚焦输入框。</p>
<p>第三个参数是依赖数组，写法和 <code>useEffect</code> 一样，依赖变了才重新创建这个对象。</p>
<h2>常见追问</h2>
<p><strong>Portal 里的事件为什么会触发外层组件的 onClick？</strong></p>
<blockquote>
<p>因为 React 的事件按 React 组件树冒泡，而 Portal 在组件树里仍然是原来父组件的子节点。DOM 位置变了，组件关系没变。如果外层不该响应，就在 Portal 里调用 <code>e.stopPropagation()</code>，或者把 Portal 挪到更上层的组件里。</p>
</blockquote>
<p><strong>为什么说不要滥用 ref？</strong></p>
<blockquote>
<p>ref 绕开了 React 的数据流，父组件直接命令子组件做事，状态就不容易追踪。react.dev 建议只把 ref 用于没法用 props 表达的命令式操作，比如聚焦、滚动、触发动画、选中文字。弹窗开关这种能用 <code>isOpen</code> 表达的，就用 prop。</p>
</blockquote>
<p><strong>React 19 项目里还能用 forwardRef 吗？</strong></p>
<blockquote>
<p>能用，现在还没有删除。但官方已经说明它不再需要，并会在未来版本弃用，新写的组件直接把 <code>ref</code> 当 prop 接收更好。</p>
</blockquote>`};export{e as default};