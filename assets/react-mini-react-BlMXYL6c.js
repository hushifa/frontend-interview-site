var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>写 <code>&lt;button title=&quot;点赞&quot;&gt;点赞：{count}&lt;/button&gt;</code> 时，JSX 在经典转换方式下会被编译成 <code>createElement(&#x27;button&#x27;, { title: &#x27;点赞&#x27; }, &#x27;点赞：&#x27;, count)</code>，它返回的只是一个描述界面的对象。mini React 就是从这里开始：先写 <code>createElement</code> 造对象，再写 <code>render</code> 把对象树变成结果，最后写 <code>useState</code> 让组件记住状态。</p>
<p><code>render</code> 遇到普通标签就原样保留，遇到函数组件就调用它，拿它返回的元素继续往下展开，最后得到一棵只有普通标签的树。真实的 React 会把这棵树同步到 DOM 上，这里为了能在 Node.js 里运行，直接用对象表示渲染结果。</p>
<p><code>useState</code> 能在函数多次调用之间记住值，是因为状态并不放在函数里，而是放在组件外面的一个数组里。每次渲染前把下标归零，每调用一次 <code>useState</code> 就取下一格。react.dev 用的也是这个说法：React 为每个组件保存一组状态，按调用顺序一一对应。所以 Hooks 不能写在条件和循环里，顺序一变就对错了格。</p>
<p>这是教学模型，不是 React 源码。它没有 diff、没有批处理，<code>setState</code> 一调用就同步重渲染整棵树；真实的 React 会排队更新、只比较变化的部分，还有 Fiber 调度。</p>
</blockquote>
<h2>先看完整实现</h2>
<p>代码分四块：<code>createElement</code> 造元素对象，<code>resolve</code> 把元素树展开，<code>useState</code> 读写状态，<code>createRoot</code> 提供 <code>render</code> 和重渲染。看每个函数组件的状态是怎么按位置存起来的。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">createElement</span>(<span class="hljs-params">type, props, ...children</span>) {
  <span class="hljs-keyword">return</span> {
    type,
    <span class="hljs-attr">props</span>: {
      ...props,
      <span class="hljs-attr">children</span>: children
        .<span class="hljs-title function_">flat</span>()
        .<span class="hljs-title function_">filter</span>(<span class="hljs-function">(<span class="hljs-params">child</span>) =&gt;</span> child != <span class="hljs-literal">null</span> &amp;&amp; child !== <span class="hljs-literal">false</span>)
        .<span class="hljs-title function_">map</span>(<span class="hljs-function">(<span class="hljs-params">child</span>) =&gt;</span>
          <span class="hljs-keyword">typeof</span> child === <span class="hljs-string">&#x27;object&#x27;</span> ? child : { <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;TEXT&#x27;</span>, <span class="hljs-attr">props</span>: { <span class="hljs-attr">value</span>: <span class="hljs-title class_">String</span>(child), <span class="hljs-attr">children</span>: [] } },
        ),
    },
  };
}

<span class="hljs-keyword">let</span> currentHooks = <span class="hljs-literal">null</span>;
<span class="hljs-keyword">let</span> hookIndex = <span class="hljs-number">0</span>;

<span class="hljs-comment">// 把元素树展开成只含普通标签的结果树；函数组件在这里被调用</span>
<span class="hljs-keyword">function</span> <span class="hljs-title function_">resolve</span>(<span class="hljs-params">element, path, store</span>) {
  <span class="hljs-keyword">if</span> (<span class="hljs-keyword">typeof</span> element.<span class="hljs-property">type</span> === <span class="hljs-string">&#x27;function&#x27;</span>) {
    <span class="hljs-comment">// 用组件在树里的位置当钥匙，同一位置的组件每次渲染都拿到同一份状态</span>
    <span class="hljs-keyword">if</span> (!store.<span class="hljs-title function_">has</span>(path)) store.<span class="hljs-title function_">set</span>(path, []);
    currentHooks = store.<span class="hljs-title function_">get</span>(path);
    hookIndex = <span class="hljs-number">0</span>;
    <span class="hljs-keyword">const</span> child = element.<span class="hljs-title function_">type</span>(element.<span class="hljs-property">props</span>);
    currentHooks = <span class="hljs-literal">null</span>;
    <span class="hljs-keyword">return</span> <span class="hljs-title function_">resolve</span>(child, <span class="hljs-string">\`<span class="hljs-subst">\${path}</span>/<span class="hljs-subst">\${element.type.name}</span>\`</span>, store);
  }
  <span class="hljs-keyword">const</span> { children, ...rest } = element.<span class="hljs-property">props</span>;
  <span class="hljs-keyword">return</span> {
    <span class="hljs-attr">type</span>: element.<span class="hljs-property">type</span>,
    <span class="hljs-attr">props</span>: rest,
    <span class="hljs-attr">children</span>: children.<span class="hljs-title function_">map</span>(<span class="hljs-function">(<span class="hljs-params">child, i</span>) =&gt;</span> <span class="hljs-title function_">resolve</span>(child, <span class="hljs-string">\`<span class="hljs-subst">\${path}</span>.<span class="hljs-subst">\${i}</span>\`</span>, store)),
  };
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">useState</span>(<span class="hljs-params">initial</span>) {
  <span class="hljs-keyword">const</span> hooks = currentHooks;
  <span class="hljs-keyword">const</span> index = hookIndex++;
  <span class="hljs-keyword">if</span> (hooks.<span class="hljs-property">length</span> &lt;= index) hooks.<span class="hljs-title function_">push</span>({ <span class="hljs-attr">state</span>: initial });
  <span class="hljs-keyword">const</span> hook = hooks[index];
  <span class="hljs-keyword">const</span> <span class="hljs-title function_">setState</span> = (<span class="hljs-params">next</span>) =&gt; {
    <span class="hljs-keyword">const</span> value = <span class="hljs-keyword">typeof</span> next === <span class="hljs-string">&#x27;function&#x27;</span> ? <span class="hljs-title function_">next</span>(hook.<span class="hljs-property">state</span>) : next;
    <span class="hljs-keyword">if</span> (<span class="hljs-title class_">Object</span>.<span class="hljs-title function_">is</span>(value, hook.<span class="hljs-property">state</span>)) <span class="hljs-keyword">return</span>;
    hook.<span class="hljs-property">state</span> = value;
    root.<span class="hljs-title function_">rerender</span>();
  };
  <span class="hljs-keyword">return</span> [hook.<span class="hljs-property">state</span>, setState];
}

<span class="hljs-keyword">let</span> root = <span class="hljs-literal">null</span>;
<span class="hljs-keyword">function</span> <span class="hljs-title function_">createRoot</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">const</span> store = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Map</span>();
  <span class="hljs-keyword">let</span> element = <span class="hljs-literal">null</span>;
  root = {
    <span class="hljs-attr">tree</span>: <span class="hljs-literal">null</span>,
    <span class="hljs-title function_">render</span>(<span class="hljs-params">next</span>) {
      element = next;
      root.<span class="hljs-title function_">rerender</span>();
    },
    <span class="hljs-title function_">rerender</span>(<span class="hljs-params"></span>) {
      root.<span class="hljs-property">tree</span> = <span class="hljs-title function_">resolve</span>(element, <span class="hljs-string">&#x27;root&#x27;</span>, store);
    },
  };
  <span class="hljs-keyword">return</span> root;
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">toText</span>(<span class="hljs-params">node</span>) {
  <span class="hljs-keyword">if</span> (node.<span class="hljs-property">type</span> === <span class="hljs-string">&#x27;TEXT&#x27;</span>) <span class="hljs-keyword">return</span> node.<span class="hljs-property">props</span>.<span class="hljs-property">value</span>;
  <span class="hljs-keyword">const</span> attrs = <span class="hljs-title class_">Object</span>.<span class="hljs-title function_">entries</span>(node.<span class="hljs-property">props</span>)
    .<span class="hljs-title function_">filter</span>(<span class="hljs-function">(<span class="hljs-params">[, v]</span>) =&gt;</span> <span class="hljs-keyword">typeof</span> v !== <span class="hljs-string">&#x27;function&#x27;</span>)
    .<span class="hljs-title function_">map</span>(<span class="hljs-function">(<span class="hljs-params">[k, v]</span>) =&gt;</span> <span class="hljs-string">\` <span class="hljs-subst">\${k}</span>=&quot;<span class="hljs-subst">\${v}</span>&quot;\`</span>)
    .<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;&#x27;</span>);
  <span class="hljs-keyword">return</span> <span class="hljs-string">\`&lt;<span class="hljs-subst">\${node.type}</span><span class="hljs-subst">\${attrs}</span>&gt;<span class="hljs-subst">\${node.children.map(toText).join(<span class="hljs-string">&#x27;&#x27;</span>)}</span>&lt;/<span class="hljs-subst">\${node.type}</span>&gt;\`</span>;
}

<span class="hljs-keyword">let</span> renders = <span class="hljs-number">0</span>;
<span class="hljs-keyword">function</span> <span class="hljs-title function_">Counter</span>(<span class="hljs-params">{ label }</span>) {
  renders++;
  <span class="hljs-keyword">const</span> [count, setCount] = <span class="hljs-title function_">useState</span>(<span class="hljs-number">0</span>);
  <span class="hljs-keyword">const</span> [step, setStep] = <span class="hljs-title function_">useState</span>(<span class="hljs-number">1</span>);
  <span class="hljs-keyword">return</span> <span class="hljs-title function_">createElement</span>(
    <span class="hljs-string">&#x27;button&#x27;</span>,
    { <span class="hljs-attr">title</span>: label, <span class="hljs-attr">onClick</span>: <span class="hljs-function">() =&gt;</span> <span class="hljs-title function_">setCount</span>(<span class="hljs-function">(<span class="hljs-params">c</span>) =&gt;</span> c + step), <span class="hljs-attr">onSetStep</span>: setStep },
    label, <span class="hljs-string">&#x27;：&#x27;</span>, count,
  );
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">App</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">return</span> <span class="hljs-title function_">createElement</span>(<span class="hljs-string">&#x27;div&#x27;</span>, <span class="hljs-literal">null</span>,
    <span class="hljs-title function_">createElement</span>(<span class="hljs-title class_">Counter</span>, { <span class="hljs-attr">label</span>: <span class="hljs-string">&#x27;点赞&#x27;</span> }),
    <span class="hljs-title function_">createElement</span>(<span class="hljs-title class_">Counter</span>, { <span class="hljs-attr">label</span>: <span class="hljs-string">&#x27;收藏&#x27;</span> }),
  );
}

<span class="hljs-keyword">const</span> app = <span class="hljs-title function_">createRoot</span>();
app.<span class="hljs-title function_">render</span>(<span class="hljs-title function_">createElement</span>(<span class="hljs-title class_">App</span>, <span class="hljs-literal">null</span>));
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">toText</span>(app.<span class="hljs-property">tree</span>)); <span class="hljs-comment">// &lt;div&gt;&lt;button title=&quot;点赞&quot;&gt;点赞：0&lt;/button&gt;&lt;button title=&quot;收藏&quot;&gt;收藏：0&lt;/button&gt;&lt;/div&gt;</span>

<span class="hljs-keyword">const</span> [like, star] = app.<span class="hljs-property">tree</span>.<span class="hljs-property">children</span>;
like.<span class="hljs-property">props</span>.<span class="hljs-title function_">onClick</span>();
like.<span class="hljs-property">props</span>.<span class="hljs-title function_">onClick</span>();
star.<span class="hljs-property">props</span>.<span class="hljs-title function_">onSetStep</span>(<span class="hljs-number">10</span>);
app.<span class="hljs-property">tree</span>.<span class="hljs-property">children</span>[<span class="hljs-number">1</span>].<span class="hljs-property">props</span>.<span class="hljs-title function_">onClick</span>();
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">toText</span>(app.<span class="hljs-property">tree</span>)); <span class="hljs-comment">// &lt;div&gt;&lt;button title=&quot;点赞&quot;&gt;点赞：2&lt;/button&gt;&lt;button title=&quot;收藏&quot;&gt;收藏：10&lt;/button&gt;&lt;/div&gt;</span>

<span class="hljs-keyword">const</span> before = renders;
app.<span class="hljs-property">tree</span>.<span class="hljs-property">children</span>[<span class="hljs-number">1</span>].<span class="hljs-property">props</span>.<span class="hljs-title function_">onSetStep</span>(<span class="hljs-number">10</span>);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(renders - before); <span class="hljs-comment">// 0</span>
</code></pre></div>
<p><code>toText</code> 只是把结果树打印成类似 HTML 的字符串，方便看结果，函数类型的属性（事件回调）不打印。</p>
<h2>createElement 只是在造对象</h2>
<p><code>createElement(type, props, ...children)</code> 返回 <code>{ type, props }</code>，子节点放进 <code>props.children</code>。react.dev 说明真实的 <code>createElement</code> 返回的元素对象也有 <code>type</code>、<code>props</code>、<code>key</code>、<code>ref</code> 这些属性，<code>children</code> 同样放在 <code>props</code> 里。</p>
<p>这里多做了两件事。字符串和数字被包成 <code>TEXT</code> 类型的节点，后面处理时就不用区分“是对象还是文字”。<code>null</code>、<code>undefined</code> 和 <code>false</code> 被过滤掉，这样 <code>{cond &amp;&amp; &lt;span /&gt;}</code> 这种写法在条件不成立时什么都不渲染。教学模型省掉了 <code>key</code> 和 <code>ref</code>。</p>
<h2>render 怎样处理函数组件</h2>
<p><code>resolve</code> 遇到 <code>type</code> 是函数的元素，就把 <code>props</code> 传进去调用它。组件返回的又是一个元素，于是递归继续展开，直到碰到 <code>&#x27;div&#x27;</code>、<code>&#x27;button&#x27;</code> 这样的普通标签。所以 <code>App</code> 和 <code>Counter</code> 都不会出现在结果树里，结果树里只有 <code>div</code> 和两个 <code>button</code>。</p>
<p>每次 <code>setState</code> 都调用 <code>rerender</code>，从根上重新展开一遍。所有组件函数都会重新执行，这跟 React 的心智模型一致：react.dev 说更新状态会让 React 用新的状态再渲染一次组件。不一样的是真实的 React 从触发更新的那个组件开始重新渲染，而不是每次都从根开始，渲染完还要比较新旧两棵树，只把差异提交到 DOM，见<a href="/questions/react-virtual-dom-fiber/">《React 的虚拟 DOM 和 diff 是怎样工作的？Fiber 解决了什么问题？》</a>。</p>
<h2>useState 为什么靠调用顺序</h2>
<p>组件函数每次执行都是一次全新的调用，局部变量不可能留下来。所以状态要存在函数外面。这里用组件在树里的位置当钥匙，比如 <code>root/App.1</code> 就是 <code>App</code> 下面第二个子组件，每个位置对应一个数组。</p>
<p>渲染某个组件之前，<code>currentHooks</code> 指向它的数组，<code>hookIndex</code> 归零。组件里第一次调用 <code>useState</code> 拿第 0 格，第二次拿第 1 格。第一次渲染时格子不存在，就用初始值创建；以后的渲染格子已经有了，初始值就被忽略。react.dev 在讲状态时给的解释几乎一样：React 为每个组件保存一组状态，渲染前把下标设为 0，每调用一次 <code>useState</code> 就给出下一组并把下标加一。</p>
<p>这也是 Hooks 规则的来由。假如把第一个 <code>useState</code> 写进 <code>if</code>，某次渲染条件不成立，原本的第二个 <code>useState</code> 就变成了第一个调用，拿到的是第 0 格，也就是 <code>count</code> 的值。react.dev 的规则是：不要在循环、条件、嵌套函数或 <code>try/catch/finally</code> 里调用 Hooks，只在组件顶层调用。</p>
<p>例子里两个 <code>Counter</code> 位置不同，各有一个数组，所以“点赞”点了两次变成 2，“收藏”改了步长 10 再点一次变成 10，互不影响。</p>
<h2>setState 做了什么</h2>
<p><code>setState</code> 先算出新值。传的是函数就把当前状态交给它算，这对应 React 的更新函数写法。然后用 <code>Object.is</code> 比较，新旧相同就直接返回，不重新渲染。例子最后把步长设成已有的 10，<code>renders</code> 没有增加。react.dev 的说法是，新值与当前状态经 <code>Object.is</code> 比较相同时，React 会跳过重新渲染这个组件和它的子组件。</p>
<p><code>setState</code> 是在 <code>useState</code> 里创建的闭包，它记住了自己那一格 <code>hook</code>。所以不管被拿到哪里调用，改的都是对应组件的对应状态。</p>
<h2>和真实 React 差在哪里</h2>
<p>这个模型每次 <code>setState</code> 都同步把整棵树重渲染一遍。React 会把更新放进队列，等事件处理函数都执行完再统一渲染，同一个事件里多次 <code>setState</code> 只渲染一次，见<a href="/questions/react-batching/">《React 的批量更新是什么？React 18 的自动批处理改变了什么？》</a>。</p>
<p>这里用 Map 加数组，只是为了把“按调用顺序取状态”这个核心讲清楚，React 内部的保存方式不是这样，更细的说法见<a href="/questions/react-hooks-internals/">《Hooks 在 React 内部是怎样保存状态的？为什么靠调用顺序区分？》</a>。</p>
<h2>常见追问</h2>
<p><strong>为什么调用 setState 之后，当前函数里的变量还是旧值？</strong></p>
<blockquote>
<p>在这个模型里也能看出来：<code>setState</code> 改的是外面那一格的 <code>hook.state</code>，而组件里的 <code>count</code> 是这次渲染开始时从格子里读出来的一个局部常量，不会跟着变。下一次渲染再调用 <code>useState</code>，才读到新值。React 里也是这样，react.dev 把它叫作“状态是快照”。</p>
</blockquote>
<p><strong>怎样在这个模型上加 useEffect？</strong></p>
<blockquote>
<p>同样在格子里存一项，记下依赖数组和清理函数。渲染时比较新旧依赖，有变化就把这个 effect 记下来，等整棵树渲染完再统一执行，执行前先调用上一次的清理函数。关键是 effect 要在渲染结束后再跑，不能在组件函数执行时直接调用。</p>
</blockquote>
<p><strong>怎么把结果真正显示到页面上？</strong></p>
<blockquote>
<p>把 <code>resolve</code> 得到的结果树交给一个函数，按 <code>type</code> 调 <code>document.createElement</code>，把普通属性设到元素上，<code>on</code> 开头的属性用 <code>addEventListener</code> 绑定，<code>TEXT</code> 节点用 <code>document.createTextNode</code>。最简单的做法是每次清空容器重建，再进一步就是比较新旧两棵树，只改变化的节点。</p>
</blockquote>`};export{e as default};