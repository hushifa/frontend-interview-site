var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>父组件重新渲染时，默认所有子组件都会跟着重新渲染。<code>memo(Component)</code> 给子组件加了一道检查：新旧 props 逐项用 <code>Object.is</code> 比较，全都一样就跳过这次渲染，直接复用上次的结果。</p>
<p>这个比较是浅比较，只看每个 prop 的引用。对象字面量、数组、箭头函数、JSX children 每次渲染都是新建的，内容一样引用也不同，比较就过不去。所以要让传给 <code>memo</code> 组件的 props 引用稳定：传基本类型，把对象拆成几个基本类型 prop，或者用 <code>useMemo</code>、<code>useCallback</code> 缓存。</p>
<p>需要特殊比较规则时，可以给 <code>memo</code> 传第二个参数 <code>arePropsEqual(prevProps, nextProps)</code>，返回 <code>true</code> 就跳过。但它必须比较所有 props，包括函数，否则会一直用着旧回调。</p>
<p>要注意，组件自己的 state 或它读的 Context 变了，<code>memo</code> 照样会重新渲染，它只管父组件传来的 props。<code>memo</code> 只是性能优化，React 不保证一定跳过，去掉以后程序逻辑应该仍然正确。</p>
</blockquote>
<h2>memo 在哪一步起作用</h2>
<p>下面的搜索页里有一个主题切换按钮和一个结果列表。我们希望切换主题时，列表不要重新渲染。</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">import</span> { memo, useCallback, useMemo, useState } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;react&#x27;</span>;

<span class="hljs-keyword">const</span> <span class="hljs-title class_">ResultList</span> = <span class="hljs-title function_">memo</span>(<span class="hljs-keyword">function</span> <span class="hljs-title function_">ResultList</span>(<span class="hljs-params">{ items, onSelect }</span>) {
  <span class="hljs-keyword">return</span> items.<span class="hljs-title function_">map</span>(<span class="hljs-function">(<span class="hljs-params">item</span>) =&gt;</span> (
    <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">button</span> <span class="hljs-attr">key</span>=<span class="hljs-string">{item.id}</span> <span class="hljs-attr">onClick</span>=<span class="hljs-string">{()</span> =&gt;</span> onSelect(item.id)}&gt;
      {item.title}
    <span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span></span>
  ));
});

<span class="hljs-keyword">export</span> <span class="hljs-keyword">default</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">Search</span>(<span class="hljs-params">{ all }</span>) {
  <span class="hljs-keyword">const</span> [query, setQuery] = <span class="hljs-title function_">useState</span>(<span class="hljs-string">&#x27;&#x27;</span>);
  <span class="hljs-keyword">const</span> [theme, setTheme] = <span class="hljs-title function_">useState</span>(<span class="hljs-string">&#x27;light&#x27;</span>);

  <span class="hljs-keyword">const</span> items = <span class="hljs-title function_">useMemo</span>(
    <span class="hljs-function">() =&gt;</span> all.<span class="hljs-title function_">filter</span>(<span class="hljs-function">(<span class="hljs-params">item</span>) =&gt;</span> item.<span class="hljs-property">title</span>.<span class="hljs-title function_">includes</span>(query)),
    [all, query],
  );
  <span class="hljs-keyword">const</span> handleSelect = <span class="hljs-title function_">useCallback</span>(<span class="hljs-function">(<span class="hljs-params">id</span>) =&gt;</span> <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(id), []);

  <span class="hljs-keyword">return</span> (
    <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">div</span> <span class="hljs-attr">className</span>=<span class="hljs-string">{theme}</span>&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">input</span> <span class="hljs-attr">value</span>=<span class="hljs-string">{query}</span> <span class="hljs-attr">onChange</span>=<span class="hljs-string">{(e)</span> =&gt;</span> setQuery(e.target.value)} /&gt;
      <span class="hljs-tag">&lt;<span class="hljs-name">button</span> <span class="hljs-attr">onClick</span>=<span class="hljs-string">{()</span> =&gt;</span> setTheme((t) =&gt; (t === &#x27;light&#x27; ? &#x27;dark&#x27; : &#x27;light&#x27;))}&gt;切换主题<span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">ResultList</span> <span class="hljs-attr">items</span>=<span class="hljs-string">{items}</span> <span class="hljs-attr">onSelect</span>=<span class="hljs-string">{handleSelect}</span> /&gt;</span>
    <span class="hljs-tag">&lt;/<span class="hljs-name">div</span>&gt;</span></span>
  );
}
</code></pre></div>
<p>点切换主题，<code>Search</code> 重新渲染，轮到 <code>ResultList</code> 时，React 拿这次的 <code>items</code>、<code>onSelect</code> 和上次的逐个用 <code>Object.is</code> 比较。两个引用都没变，<code>ResultList</code> 这次就不渲染了，它下面的按钮也跟着不渲染。</p>
<p>你可能会想，只加 <code>memo</code> 不行吗？不行。去掉 <code>useMemo</code>，<code>filter</code> 每次都返回新数组；去掉 <code>useCallback</code>，箭头函数每次都是新的。只要有一个 prop 是新引用，比较就失败，<code>memo</code> 等于白加。这两个 Hook 本身的区别和使用边界，见<a href="/questions/react-usememo-usecallback/">《useMemo 和 useCallback 有什么区别？什么时候不该用？》</a>。</p>
<h2>为什么内容一样，比较还是失败</h2>
<p>这一点跟 React 无关，是 JavaScript 本身的规则。可以用 node 运行看看：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">render</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">return</span> { <span class="hljs-attr">items</span>: [<span class="hljs-number">1</span>, <span class="hljs-number">2</span>], <span class="hljs-attr">onSelect</span>: <span class="hljs-function">() =&gt;</span> {} };
}

<span class="hljs-keyword">const</span> a = <span class="hljs-title function_">render</span>();
<span class="hljs-keyword">const</span> b = <span class="hljs-title function_">render</span>();
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">Object</span>.<span class="hljs-title function_">is</span>(a.<span class="hljs-property">items</span>, b.<span class="hljs-property">items</span>));       <span class="hljs-comment">// false</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">Object</span>.<span class="hljs-title function_">is</span>(a.<span class="hljs-property">onSelect</span>, b.<span class="hljs-property">onSelect</span>)); <span class="hljs-comment">// false</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">Object</span>.<span class="hljs-title function_">is</span>(<span class="hljs-string">&#x27;light&#x27;</span>, <span class="hljs-string">&#x27;light&#x27;</span>));       <span class="hljs-comment">// true</span>
</code></pre></div>
<p>组件每渲染一次就相当于调用一次 <code>render</code>，里面写的数组字面量和箭头函数都会重新创建，内容一样，引用却不同。字符串、数字这类基本类型按值比较，所以不受影响。</p>
<p>JSX children 也是一样。<code>&lt;Card&gt;&lt;Title /&gt;&lt;/Card&gt;</code> 里的 <code>&lt;Title /&gt;</code> 每次渲染都会生成新的元素对象，作为 <code>children</code> prop 传给 <code>memo(Card)</code>，比较永远失败。</p>
<h2>怎样让 props 保持稳定</h2>
<p>React 文档给了几个方向。最简单的是少传对象：如果子组件只用到 <code>user.name</code>，就直接传 <code>name</code>，字符串按值比较。必须传对象时，用 <code>useMemo</code> 缓存它；传函数时，用 <code>useCallback</code> 缓存，或者把不依赖组件状态的函数挪到组件外部。</p>
<p>文档还建议，先尝试不用 <code>memo</code> 的结构调整：把状态下放到真正用它的组件里，或者让包裹型组件接收 <code>children</code>。这样父组件的状态变化根本碰不到这些子组件。</p>
<h2>自定义比较函数</h2>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">const</span> <span class="hljs-title class_">Chart</span> = <span class="hljs-title function_">memo</span>(<span class="hljs-keyword">function</span> <span class="hljs-title function_">Chart</span>(<span class="hljs-params">{ points, onHover }</span>) {
  <span class="hljs-comment">// ...</span>
}, <span class="hljs-function">(<span class="hljs-params">prev, next</span>) =&gt;</span> (
  prev.<span class="hljs-property">points</span>.<span class="hljs-property">length</span> === next.<span class="hljs-property">points</span>.<span class="hljs-property">length</span> &amp;&amp;
  prev.<span class="hljs-property">points</span>.<span class="hljs-title function_">every</span>(<span class="hljs-function">(<span class="hljs-params">p, i</span>) =&gt;</span> p.<span class="hljs-property">x</span> === next.<span class="hljs-property">points</span>[i].<span class="hljs-property">x</span> &amp;&amp; p.<span class="hljs-property">y</span> === next.<span class="hljs-property">points</span>[i].<span class="hljs-property">y</span>) &amp;&amp;
  prev.<span class="hljs-property">onHover</span> === next.<span class="hljs-property">onHover</span>
));
</code></pre></div>
<p>第二个参数返回 <code>true</code> 表示“props 相等，可以跳过”。React 文档提醒了两点。一是不要漏掉函数类型的 prop，否则组件被跳过后，里面闭包读到的还是旧的 props 和 state。二是不要做深比较，除非确定数据结构有上限，深比较可能比重新渲染还慢，甚至让页面卡住。</p>
<h2>memo 管不到的情况</h2>
<p><code>memo</code> 只拦截“父组件重新渲染导致的渲染”。组件自己调用 <code>setState</code> 改了 state，或者它用 <code>useContext</code> 读的 Context 变了，都会照常重新渲染。Context 这条路径的细节见<a href="/questions/react-context-performance/">《React Context 有哪些性能问题？怎样避免不必要的重新渲染？》</a>。</p>
<p>如果慢的原因是一次渲染了太多 DOM，<code>memo</code> 也帮不上忙，应该用虚拟列表或拆分组件。</p>
<h2>有了 React Compiler 还要手写吗</h2>
<p>React Compiler 在构建时分析符合 React 规则的组件，自动加上等价于 <code>memo</code>、<code>useMemo</code>、<code>useCallback</code> 的缓存。启用以后，新代码一般不需要再手写 <code>memo</code>。已有代码里的手写缓存可以先留着，确认编译器已经覆盖了对应组件再删。详见<a href="/questions/react-compiler/">《React Compiler 解决了哪些优化问题？》</a>。</p>
<h2>常见追问</h2>
<p><strong><code>memo</code> 和 <code>useMemo</code> 是一回事吗？</strong></p>
<blockquote>
<p>不是。<code>memo</code> 包裹整个组件，props 没变时跳过它的渲染；<code>useMemo</code> 是 Hook，在组件内部缓存一个值。两者经常配合使用，<code>useMemo</code> 负责让传进去的 prop 保持同一个引用。</p>
</blockquote>
<p><strong>每个组件都包上 <code>memo</code> 好不好？</strong></p>
<blockquote>
<p>没有必要。React 文档说，大多数交互本来就足够快，<code>memo</code> 只在组件经常用相同的 props 重新渲染、而且渲染逻辑比较昂贵时才有明显效果。props 每次都在变的组件，加了只会多一次比较。</p>
</blockquote>`};export{e as default};