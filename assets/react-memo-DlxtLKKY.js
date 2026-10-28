var e={answerHtml:`<h2>简答</h2>
<ul>
<li><code>memo(Component)</code>：父组件重新渲染时，如果新旧 props 用 <code>Object.is</code> 逐项比较都相同，就跳过这个子组件的渲染。</li>
<li><code>useMemo(fn, deps)</code>：依赖不变时返回上次的计算结果，用于昂贵计算或需要保持引用稳定的对象。</li>
<li><code>useCallback(fn, deps)</code>：依赖不变时返回同一个函数引用，等价于 <code>useMemo(() =&gt; fn, deps)</code>。</li>
<li>组件自身的 state 或它读取的 Context 变化时，<code>memo</code> 照样会重新渲染。</li>
<li>这些都是性能优化，去掉后程序逻辑应该仍然正确；先用 React DevTools Profiler 确认瓶颈再加。</li>
</ul>
<h2>三者配合</h2>
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
<p>切换主题时 <code>Search</code> 重新渲染，但 <code>items</code> 和 <code>handleSelect</code> 的引用没变，所以 <code>ResultList</code> 被跳过。去掉任意一个 <code>useMemo</code> 或 <code>useCallback</code>，每次渲染都会生成新引用，<code>memo</code> 的比较就会失败。</p>
<h2>什么时候不值得用</h2>
<ul>
<li>计算本身很便宜，缓存的比较开销和代码复杂度反而更高。</li>
<li>props 里经常有每次都新建的对象、数组或 JSX children，<code>memo</code> 永远比较不通过。</li>
<li>慢的原因是一次渲染太多 DOM，这时应该用虚拟列表或拆分组件，而不是缓存。</li>
</ul>
<p>更好的第一步通常是调整结构：把状态下放到真正用它的组件，或者把不变的部分作为 <code>children</code> 传进来，让它不随父组件重新渲染。</p>
<h2>和 React Compiler 的关系</h2>
<p>React Compiler 1.0 已稳定发布。它在构建时分析符合 React 规则的组件，自动插入等价的缓存。启用后，新代码一般不需要再手写 <code>memo</code>、<code>useMemo</code>、<code>useCallback</code>。已有代码里的手写缓存可以先保留，确认编译器覆盖了对应组件后再删除，详见《React Compiler 解决了哪些优化问题？》。</p>
<h2>常见追问</h2>
<ul>
<li><code>memo</code> 能自定义比较吗？第二个参数传 <code>arePropsEqual(prev, next)</code>，但必须比较所有 props，包括函数，否则会读到旧回调。</li>
<li><code>useMemo</code> 能保证一定缓存吗？官方说明 React 可能在某些情况下丢弃缓存，所以不能用它保存必须持久的数据。</li>
</ul>`};export{e as default};