var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>父组件重新渲染时，默认所有子组件都会跟着重新渲染。<code>memo(Component)</code> 给子组件加了一道检查：新旧 props 逐项用 <code>Object.is</code> 比较，全都一样就跳过这次渲染。</p>
<p>可是函数和对象每次渲染都是新建的，引用变了，<code>memo</code> 的比较就过不去。所以需要 <code>useMemo(fn, deps)</code> 缓存计算结果，<code>useCallback(fn, deps)</code> 缓存函数，依赖不变就返回上一次的同一个值。<code>useCallback(fn, deps)</code> 等价于 <code>useMemo(() =&gt; fn, deps)</code>。</p>
<p>三者常常一起用：<code>useMemo</code> 和 <code>useCallback</code> 保证 props 引用稳定，<code>memo</code> 才能真正跳过子组件。<code>useMemo</code> 单独用也可以，用来避免重复的昂贵计算。</p>
<p>要注意，组件自己的 state 或它读的 Context 变了，<code>memo</code> 照样会重新渲染。这些都只是性能优化，去掉以后程序逻辑应该仍然正确，先用 React DevTools Profiler 确认瓶颈再加。</p>
</blockquote>
<h2>三者怎么配合</h2>
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
<p>点切换主题，<code>Search</code> 重新渲染。<code>items</code> 的依赖 <code>all</code>、<code>query</code> 都没变，<code>useMemo</code> 返回上次那个数组；<code>handleSelect</code> 依赖是空数组，<code>useCallback</code> 返回上次那个函数。<code>ResultList</code> 收到的两个 props 引用都没变，<code>memo</code> 就跳过了它。</p>
<p>你可能会想，只加 <code>memo</code> 不行吗？不行。去掉 <code>useMemo</code>，<code>filter</code> 每次都返回新数组；去掉 <code>useCallback</code>，箭头函数每次都是新的。只要有一个 prop 是新引用，<code>memo</code> 的比较就失败，等于白加。</p>
<h2>为什么函数和数组每次都是新的</h2>
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
<p>组件每渲染一次就相当于调用一次 <code>render</code>，里面写的数组字面量和箭头函数都会重新创建，内容一样，引用却不同。字符串、数字这类基本类型按值比较，所以不受影响。这就是 <code>useMemo</code> 和 <code>useCallback</code> 要解决的问题。</p>
<h2>什么时候不值得用</h2>
<p>计算本身很便宜时，缓存的比较开销和多出来的代码反而更贵。</p>
<p>props 里经常带着每次都新建的对象、数组或 JSX children 时，<code>memo</code> 永远比较不通过，加了也没用。</p>
<p>如果慢的原因是一次渲染了太多 DOM，缓存帮不上忙，应该用虚拟列表或拆分组件。</p>
<p>更好的第一步通常是调整结构：把状态下放到真正用它的组件里，或者把不变的部分作为 <code>children</code> 传进来。这样父组件的状态变化根本碰不到它们。</p>
<h2>有了 React Compiler 还要手写吗</h2>
<p>React Compiler 1.0 已经稳定发布。它在构建时分析符合 React 规则的组件，自动加上等价的缓存。启用以后，新代码一般不需要再手写 <code>memo</code>、<code>useMemo</code>、<code>useCallback</code>。</p>
<p>已有代码里的手写缓存可以先留着，确认编译器已经覆盖了对应组件再删。详见<a href="/questions/react-compiler/">《React Compiler 解决了哪些优化问题？》</a>。</p>
<h2>常见追问</h2>
<p><strong><code>memo</code> 能自定义比较逻辑吗？</strong></p>
<blockquote>
<p>可以，第二个参数传 <code>arePropsEqual(prev, next)</code>。但它必须比较所有 props，包括函数。如果漏掉函数，组件被跳过后就会一直用着旧回调。</p>
</blockquote>
<p><strong><code>useMemo</code> 能保证一定缓存住吗？</strong></p>
<blockquote>
<p>不能。官方说明 React 在某些情况下可能丢弃缓存，所以它只能当性能优化用，不能用来保存必须一直存在的数据。</p>
</blockquote>`};export{e as default};