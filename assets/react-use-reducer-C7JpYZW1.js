var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>比如一个购物车，加商品、删商品、改数量、用优惠券，每个按钮的事件处理器里都在拷贝数组、找对应项、算新值，改状态的代码散落在好几处。<code>useReducer</code> 就是把这些改法集中到一个函数里：<code>reducer(state, action)</code> 接收当前状态和一个动作，返回新状态；事件处理器只写 <code>dispatch({ type: &#x27;added&#x27;, id })</code>，说明发生了什么。</p>
<p>它适合的情况是：多个事件用相似的方式改同一份状态，或者一个操作要同时改好几个字段。这时用 <code>useState</code> 会让组件里塞满更新代码，<code>useReducer</code> 把“怎么改”和“发生了什么”分开，组件读起来清楚。</p>
<p>好处还有两个。出了 bug，可以在 reducer 里打日志，看到每次状态变化是哪个动作引起的；reducer 是不依赖组件的纯函数，可以单独导出测试。</p>
<p>但它不是越多越好。状态简单时 <code>useState</code> 代码更少，<code>useReducer</code> 要多写 reducer 和动作。react.dev 的建议是：某个组件经常因为状态更新写错而出 bug、想给它更多结构时再用，两者可以随时互相转换，也能在同一组件里混用。另外 reducer 必须是纯函数，不能发请求、设定时器，也不能直接修改原来的状态。</p>
</blockquote>
<h2>把购物车的更新逻辑写成 reducer</h2>
<p>下面的 <code>cartReducer</code> 是一个普通函数，不依赖 React。示例用数组的 <code>reduce</code> 依次执行一串动作，模拟用户的一系列操作，看最后的状态。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">cartReducer</span>(<span class="hljs-params">state, action</span>) {
  <span class="hljs-keyword">switch</span> (action.<span class="hljs-property">type</span>) {
    <span class="hljs-keyword">case</span> <span class="hljs-string">&#x27;added&#x27;</span>: {
      <span class="hljs-keyword">const</span> exists = state.<span class="hljs-property">items</span>.<span class="hljs-title function_">find</span>(<span class="hljs-function">(<span class="hljs-params">item</span>) =&gt;</span> item.<span class="hljs-property">id</span> === action.<span class="hljs-property">id</span>);
      <span class="hljs-keyword">const</span> items = exists
        ? state.<span class="hljs-property">items</span>.<span class="hljs-title function_">map</span>(<span class="hljs-function">(<span class="hljs-params">item</span>) =&gt;</span>
            item.<span class="hljs-property">id</span> === action.<span class="hljs-property">id</span> ? { ...item, <span class="hljs-attr">qty</span>: item.<span class="hljs-property">qty</span> + <span class="hljs-number">1</span> } : item,
          )
        : [...state.<span class="hljs-property">items</span>, { <span class="hljs-attr">id</span>: action.<span class="hljs-property">id</span>, <span class="hljs-attr">price</span>: action.<span class="hljs-property">price</span>, <span class="hljs-attr">qty</span>: <span class="hljs-number">1</span> }];
      <span class="hljs-keyword">return</span> { ...state, items };
    }
    <span class="hljs-keyword">case</span> <span class="hljs-string">&#x27;removed&#x27;</span>:
      <span class="hljs-keyword">return</span> { ...state, <span class="hljs-attr">items</span>: state.<span class="hljs-property">items</span>.<span class="hljs-title function_">filter</span>(<span class="hljs-function">(<span class="hljs-params">item</span>) =&gt;</span> item.<span class="hljs-property">id</span> !== action.<span class="hljs-property">id</span>) };
    <span class="hljs-keyword">case</span> <span class="hljs-string">&#x27;coupon_applied&#x27;</span>:
      <span class="hljs-keyword">return</span> { ...state, <span class="hljs-attr">discount</span>: action.<span class="hljs-property">discount</span> };
    <span class="hljs-attr">default</span>:
      <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">&#x27;未知动作：&#x27;</span> + action.<span class="hljs-property">type</span>);
  }
}

<span class="hljs-keyword">const</span> initial = { <span class="hljs-attr">items</span>: [], <span class="hljs-attr">discount</span>: <span class="hljs-number">0</span> };
<span class="hljs-keyword">const</span> actions = [
  { <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;added&#x27;</span>, <span class="hljs-attr">id</span>: <span class="hljs-string">&#x27;apple&#x27;</span>, <span class="hljs-attr">price</span>: <span class="hljs-number">5</span> },
  { <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;added&#x27;</span>, <span class="hljs-attr">id</span>: <span class="hljs-string">&#x27;apple&#x27;</span>, <span class="hljs-attr">price</span>: <span class="hljs-number">5</span> },
  { <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;added&#x27;</span>, <span class="hljs-attr">id</span>: <span class="hljs-string">&#x27;pear&#x27;</span>, <span class="hljs-attr">price</span>: <span class="hljs-number">3</span> },
  { <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;coupon_applied&#x27;</span>, <span class="hljs-attr">discount</span>: <span class="hljs-number">2</span> },
  { <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;removed&#x27;</span>, <span class="hljs-attr">id</span>: <span class="hljs-string">&#x27;pear&#x27;</span> },
];

<span class="hljs-keyword">const</span> final = actions.<span class="hljs-title function_">reduce</span>(cartReducer, initial);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">JSON</span>.<span class="hljs-title function_">stringify</span>(final.<span class="hljs-property">items</span>)); <span class="hljs-comment">// [{&quot;id&quot;:&quot;apple&quot;,&quot;price&quot;:5,&quot;qty&quot;:2}]</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(final.<span class="hljs-property">discount</span>); <span class="hljs-comment">// 2</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(initial.<span class="hljs-property">items</span>.<span class="hljs-property">length</span>); <span class="hljs-comment">// 0</span>
</code></pre></div>
<p>苹果加了两次，所以 <code>qty</code> 是 2；梨加进去又删掉了；优惠券单独记在 <code>discount</code> 里。最后一行打印 0，说明最初的 <code>initial</code> 没有被改过，每个分支都返回了新对象。</p>
<p>为什么一定要返回新对象？因为 React 用 <code>Object.is</code> 比较新旧状态，如果直接改 <code>state.items.push(...)</code> 再返回原来的 <code>state</code>，引用没变，React 会认为状态没变而跳过渲染。所以分支里都用展开语法创建新对象，并且带上 <code>...state</code>，否则其他字段会丢失。</p>
<p>为什么可以直接用 <code>reduce</code> 测？这也是 reducer 的好处：它只根据输入算输出，不依赖组件，所以 react.dev 说可以把它单独导出来测试。<code>useReducer</code> 这个名字也来自数组的 <code>reduce</code>，都是“拿当前结果和下一项算出新结果”。</p>
<h2>在组件里使用</h2>
<p>组件里用 <code>useReducer</code> 接上这个 reducer，事件处理器只负责 dispatch：</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">import</span> { useReducer } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;react&#x27;</span>;

<span class="hljs-keyword">function</span> <span class="hljs-title function_">Cart</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">const</span> [cart, dispatch] = <span class="hljs-title function_">useReducer</span>(cartReducer, { <span class="hljs-attr">items</span>: [], <span class="hljs-attr">discount</span>: <span class="hljs-number">0</span> });

  <span class="hljs-keyword">return</span> (
    <span class="xml"><span class="hljs-tag">&lt;&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">button</span> <span class="hljs-attr">onClick</span>=<span class="hljs-string">{()</span> =&gt;</span> dispatch({ type: &#x27;added&#x27;, id: &#x27;apple&#x27;, price: 5 })}&gt;加苹果<span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">button</span> <span class="hljs-attr">onClick</span>=<span class="hljs-string">{()</span> =&gt;</span> dispatch({ type: &#x27;coupon_applied&#x27;, discount: 2 })}&gt;用优惠券<span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">p</span>&gt;</span>共 {cart.items.length} 种商品<span class="hljs-tag">&lt;/<span class="hljs-name">p</span>&gt;</span>
    <span class="hljs-tag">&lt;/&gt;</span></span>
  );
}
</code></pre></div>
<p><code>dispatch</code> 和 <code>setState</code> 一样，只更新下一次渲染的状态，调用以后在同一个事件里读 <code>cart</code> 还是旧值。</p>
<p>动作应该怎么设计？react.dev 建议每个动作描述一次用户操作，即使它会改好几处数据。比如表单有五个字段，点“重置”时应该 dispatch 一个 <code>reset_form</code>，而不是五个 <code>set_field</code>。这样把动作日志打出来，就能看出用户按什么顺序做了什么。</p>
<h2>reducer 里不能做什么</h2>
<p>reducer 在渲染时运行，所以它必须是纯函数：同样的输入总得到同样的输出，不能发请求、设定时器，也不能修改传进来的对象。严格模式下 React 会在开发环境把 reducer 调用两次，帮你发现这类问题，比如在 reducer 里 <code>push</code> 数组，待办就会被加两次。</p>
<p>请求这类副作用放在事件处理器或 Effect 里，结果回来以后再 dispatch 一个动作。</p>
<h2>常见追问</h2>
<p><strong>初始状态要通过计算得到，怎样避免每次渲染都重新计算？</strong></p>
<blockquote>
<p>把计算函数作为第三个参数传进去：<code>useReducer(reducer, username, createInitialState)</code>。这样 React 只在初始化时调用一次 <code>createInitialState(username)</code>。如果写成 <code>useReducer(reducer, createInitialState(username))</code>，虽然结果只用一次，函数却每次渲染都会执行。</p>
</blockquote>
<p><strong>为什么 <code>dispatch</code> 可以不写进 Effect 的依赖？</strong></p>
<blockquote>
<p>因为 <code>dispatch</code> 的引用是稳定的，每次渲染都是同一个函数，写不写进依赖都不会让 Effect 多执行。所以把它通过 Context 传给深层组件也很方便，见<a href="/questions/react-context-reducer/">《Context 与 useReducer 适合管理什么状态？》</a>。</p>
</blockquote>
<p><strong>每个分支都写展开语法太啰嗦，有办法简化吗？</strong></p>
<blockquote>
<p>可以用 Immer。react.dev 介绍了 use-immer 库的 <code>useImmerReducer</code>，reducer 拿到的是一个草稿对象，可以直接 <code>push</code> 或赋值，Immer 在背后生成新的状态，所以也不用 return。</p>
</blockquote>`};export{e as default};