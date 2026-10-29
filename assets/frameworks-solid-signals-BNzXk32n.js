var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>React 里状态一变，整个组件函数会重新执行一遍，再比较虚拟 DOM 找出要改的地方。Solid 不一样，组件函数只在创建时执行一次，之后再也不执行。谁读了 signal，signal 变的时候就只更新谁，比如 JSX 里的 <code>{count()}</code> 会被编译成只更新这一个文本节点。这叫细粒度响应式。</p>
<p>写法上，<code>const [count, setCount] = createSignal(0)</code>，<code>count()</code> 是读取函数，<code>setCount</code> 用来改值。</p>
<p>因为组件只执行一次，有两个坑。在组件主体里写 <code>const n = count()</code>，拿到的只是初始值，之后不会变；要在 JSX、<code>createMemo</code>、<code>createEffect</code> 这些会追踪的地方读取。同样，解构 props，比如 <code>const { name } = props</code>，读出来的也是当时的值，会丢掉响应性，要写 <code>props.name</code>，或者用 <code>splitProps</code>、<code>mergeProps</code>。</p>
<p>好处是没有依赖数组，也没有过期闭包的问题。但只有同步读取会被追踪，<code>await</code> 之后的读取不算。下面的示例都基于 Solid 1.x。</p>
</blockquote>
<h2>同一个计数器，两种执行方式</h2>
<p>先看 React 版本。每次点击，<code>render</code> 都会打印一次：</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-comment">// React：每次点击，Counter 整个函数重新执行</span>
<span class="hljs-keyword">function</span> <span class="hljs-title function_">Counter</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">const</span> [count, setCount] = <span class="hljs-title function_">useState</span>(<span class="hljs-number">0</span>);
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;render&#x27;</span>); <span class="hljs-comment">// 每次点击都打印</span>
  <span class="hljs-keyword">return</span> <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">button</span> <span class="hljs-attr">onClick</span>=<span class="hljs-string">{()</span> =&gt;</span> setCount(count + 1)}&gt;{count}<span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span></span>;
}
</code></pre></div>
<p>再看 Solid 版本，写法几乎一样，但 <code>setup</code> 只打印一次：</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-comment">// Solid：Counter 只执行一次</span>
<span class="hljs-keyword">import</span> { createSignal } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;solid-js&#x27;</span>;

<span class="hljs-keyword">function</span> <span class="hljs-title function_">Counter</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">const</span> [count, setCount] = <span class="hljs-title function_">createSignal</span>(<span class="hljs-number">0</span>);
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;setup&#x27;</span>); <span class="hljs-comment">// 只打印一次</span>
  <span class="hljs-keyword">return</span> <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">button</span> <span class="hljs-attr">onClick</span>=<span class="hljs-string">{()</span> =&gt;</span> setCount(count() + 1)}&gt;{count()}<span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span></span>;
}
</code></pre></div>
<p>既然 Solid 的函数不再执行，按钮上的数字怎么变的？因为 JSX 里写的是 <code>count()</code>，编译后这个位置会订阅 <code>count</code>。<code>count</code> 变了，只有这个文本节点被更新，组件函数本身没再运行。</p>
<p>这也解释了为什么 Solid 没有过期闭包。React 每次渲染都产生新的 <code>count</code> 变量，旧回调会拿着旧值；Solid 只有一个 signal，每次调用 <code>count()</code> 读到的都是当前值。</p>
<h2>派生值怎么写</h2>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">const</span> [items, setItems] = <span class="hljs-title function_">createSignal</span>([]);
<span class="hljs-keyword">const</span> total = <span class="hljs-title function_">createMemo</span>(<span class="hljs-function">() =&gt;</span> <span class="hljs-title function_">items</span>().<span class="hljs-title function_">reduce</span>(<span class="hljs-function">(<span class="hljs-params">s, i</span>) =&gt;</span> s + i.<span class="hljs-property">price</span>, <span class="hljs-number">0</span>));
<span class="hljs-keyword">const</span> <span class="hljs-title function_">count</span> = (<span class="hljs-params"></span>) =&gt; <span class="hljs-title function_">items</span>().<span class="hljs-property">length</span>; <span class="hljs-comment">// 便宜的派生可以直接写成函数</span>
</code></pre></div>
<p><code>createMemo</code> 会缓存结果，多处读取只算一次，适合计算比较重的派生。像取数组长度这种便宜的计算，写成普通函数就行。它在 JSX 里被调用时，内部读了 <code>items()</code>，同样会被追踪。</p>
<h2>副作用怎样清理</h2>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">import</span> { createEffect, createSignal, onCleanup } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;solid-js&#x27;</span>;

<span class="hljs-keyword">function</span> <span class="hljs-title function_">Search</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">const</span> [query, setQuery] = <span class="hljs-title function_">createSignal</span>(<span class="hljs-string">&#x27;&#x27;</span>);
  <span class="hljs-keyword">const</span> [results, setResults] = <span class="hljs-title function_">createSignal</span>([]);

  <span class="hljs-title function_">createEffect</span>(<span class="hljs-function">() =&gt;</span> {
    <span class="hljs-keyword">const</span> q = <span class="hljs-title function_">query</span>();
    <span class="hljs-keyword">const</span> controller = <span class="hljs-keyword">new</span> <span class="hljs-title class_">AbortController</span>();
    <span class="hljs-title function_">fetch</span>(<span class="hljs-string">\`/api/search?q=<span class="hljs-subst">\${<span class="hljs-built_in">encodeURIComponent</span>(q)}</span>\`</span>, { <span class="hljs-attr">signal</span>: controller.<span class="hljs-property">signal</span> })
      .<span class="hljs-title function_">then</span>(<span class="hljs-function">(<span class="hljs-params">r</span>) =&gt;</span> (r.<span class="hljs-property">ok</span> ? r.<span class="hljs-title function_">json</span>() : <span class="hljs-title class_">Promise</span>.<span class="hljs-title function_">reject</span>(<span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">\`HTTP <span class="hljs-subst">\${r.status}</span>\`</span>))))
      .<span class="hljs-title function_">then</span>(setResults)
      .<span class="hljs-title function_">catch</span>(<span class="hljs-function">(<span class="hljs-params">err</span>) =&gt;</span> {
        <span class="hljs-keyword">if</span> (err.<span class="hljs-property">name</span> !== <span class="hljs-string">&#x27;AbortError&#x27;</span>) <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">error</span>(err);
      });
    <span class="hljs-title function_">onCleanup</span>(<span class="hljs-function">() =&gt;</span> controller.<span class="hljs-title function_">abort</span>());
  });

  <span class="hljs-keyword">return</span> <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">input</span> <span class="hljs-attr">value</span>=<span class="hljs-string">{query()}</span> <span class="hljs-attr">onInput</span>=<span class="hljs-string">{(e)</span> =&gt;</span> setQuery(e.currentTarget.value)} /&gt;</span>;
}
</code></pre></div>
<p>effect 第一行同步读了 <code>query()</code>，所以 <code>query</code> 就成了它的依赖，不用写依赖数组。<code>query</code> 一变，先执行 <code>onCleanup</code> 注册的函数，取消旧请求，再重新运行 effect。实际项目里，异步数据通常用 <code>createResource</code> 来处理。</p>
<h2>条件和列表为什么要用专门的组件</h2>
<p>在 React 里可以直接写 <code>{user ? &lt;A /&gt; : &lt;B /&gt;}</code>，因为组件会重新执行。Solid 的组件不重新执行，所以条件渲染和列表要交给 Solid 提供的控制流组件：</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx">&lt;<span class="hljs-title class_">Show</span> when={<span class="hljs-title function_">user</span>()} fallback={<span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">p</span>&gt;</span>请登录<span class="hljs-tag">&lt;/<span class="hljs-name">p</span>&gt;</span></span>}&gt;
  {<span class="hljs-function">(<span class="hljs-params">u</span>) =&gt;</span> <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">p</span>&gt;</span>你好，{u().name}<span class="hljs-tag">&lt;/<span class="hljs-name">p</span>&gt;</span></span>}
&lt;/<span class="hljs-title class_">Show</span>&gt;

<span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">For</span> <span class="hljs-attr">each</span>=<span class="hljs-string">{todos()}</span>&gt;</span>{(todo) =&gt; <span class="hljs-tag">&lt;<span class="hljs-name">li</span>&gt;</span>{todo.text}<span class="hljs-tag">&lt;/<span class="hljs-name">li</span>&gt;</span>}<span class="hljs-tag">&lt;/<span class="hljs-name">For</span>&gt;</span></span>
</code></pre></div>
<p><code>&lt;For&gt;</code> 按对象引用复用 DOM 节点，相当于自动带了 key。</p>
<h2>常见追问</h2>
<p><strong>嵌套对象怎么处理？</strong></p>
<blockquote>
<p>用 <code>createStore</code> 创建深层响应式对象，再用 <code>setStore(&#x27;user&#x27;, &#x27;name&#x27;, &#x27;Lin&#x27;)</code> 这样按路径更新。</p>
</blockquote>
<p><strong>和 Vue 的响应式像吗？</strong></p>
<blockquote>
<p>原理接近，都是读取时收集依赖、写入时通知。区别在于 Vue 组件还有渲染函数和虚拟 DOM，Solid 直接更新 DOM。</p>
</blockquote>`};export{e as default};