var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>两个 Hook 都是“依赖没变就返回上次的东西”，区别在于缓存的是什么。<code>useMemo(() =&gt; filter(items), [items])</code> 会调用这个函数，缓存的是它返回的结果。<code>useCallback(handleClick, [id])</code> 不调用函数，缓存的是函数本身。所以 <code>useCallback(fn, deps)</code> 就等于 <code>useMemo(() =&gt; fn, deps)</code>。</p>
<p>为什么需要缓存函数？因为组件每次渲染，里面写的函数都会重新创建，引用每次都不同。这个函数如果传给了用 <code>memo</code> 包裹的子组件，或者写进了 <code>useEffect</code> 的依赖，引用一变，子组件就重新渲染，effect 就重新执行。</p>
<p>官方文档列出的适用场景很窄：<code>useMemo</code> 适合计算明显很慢且依赖很少变化、要传给 <code>memo</code> 组件、要作为其他 Hook 依赖这三种情况；<code>useCallback</code> 只适合后两种。其他情况加了没有好处，只会让代码更难读。</p>
<p>有了 React Compiler 以后，官方建议新代码依赖编译器自动缓存，需要精确控制时才手写；已有代码里的 <code>useMemo</code>、<code>useCallback</code> 先保留，删除前要仔细测试，因为删掉可能改变编译结果。另外它们只是性能优化，React 可能在某些情况下丢弃缓存，程序逻辑不能依赖它们。</p>
</blockquote>
<h2>一个缓存结果，一个缓存函数</h2>
<p>下面用一个极简的模拟看两者的行为。它按调用顺序保存上一次的值和依赖，依赖用 <code>Object.is</code> 逐个比较，和 React 的规则一致。真实的 React 实现要复杂得多，这里只用来说明效果。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">createHooks</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">const</span> slots = [];
  <span class="hljs-keyword">let</span> index = <span class="hljs-number">0</span>;
  <span class="hljs-keyword">const</span> <span class="hljs-title function_">depsChanged</span> = (<span class="hljs-params">prev, next</span>) =&gt; !prev || next.<span class="hljs-title function_">some</span>(<span class="hljs-function">(<span class="hljs-params">dep, i</span>) =&gt;</span> !<span class="hljs-title class_">Object</span>.<span class="hljs-title function_">is</span>(dep, prev[i]));
  <span class="hljs-keyword">function</span> <span class="hljs-title function_">useMemo</span>(<span class="hljs-params">calculate, deps</span>) {
    <span class="hljs-keyword">const</span> slot = slots[index++];
    <span class="hljs-keyword">if</span> (slot &amp;&amp; !<span class="hljs-title function_">depsChanged</span>(slot.<span class="hljs-property">deps</span>, deps)) <span class="hljs-keyword">return</span> slot.<span class="hljs-property">value</span>;
    <span class="hljs-keyword">const</span> value = <span class="hljs-title function_">calculate</span>();
    slots[index - <span class="hljs-number">1</span>] = { value, deps };
    <span class="hljs-keyword">return</span> value;
  }
  <span class="hljs-keyword">const</span> <span class="hljs-title function_">useCallback</span> = (<span class="hljs-params">fn, deps</span>) =&gt; <span class="hljs-title function_">useMemo</span>(<span class="hljs-function">() =&gt;</span> fn, deps);
  <span class="hljs-keyword">const</span> <span class="hljs-title function_">render</span> = (<span class="hljs-params">component, props</span>) =&gt; {
    index = <span class="hljs-number">0</span>;
    <span class="hljs-keyword">return</span> <span class="hljs-title function_">component</span>(props);
  };
  <span class="hljs-keyword">return</span> { useMemo, useCallback, render };
}

<span class="hljs-keyword">const</span> { useMemo, useCallback, render } = <span class="hljs-title function_">createHooks</span>();
<span class="hljs-keyword">let</span> calls = <span class="hljs-number">0</span>;
<span class="hljs-keyword">function</span> <span class="hljs-title function_">List</span>(<span class="hljs-params">{ items, query }</span>) {
  <span class="hljs-keyword">const</span> visible = <span class="hljs-title function_">useMemo</span>(<span class="hljs-function">() =&gt;</span> {
    calls += <span class="hljs-number">1</span>;
    <span class="hljs-keyword">return</span> items.<span class="hljs-title function_">filter</span>(<span class="hljs-function">(<span class="hljs-params">item</span>) =&gt;</span> item.<span class="hljs-title function_">includes</span>(query));
  }, [items, query]);
  <span class="hljs-keyword">const</span> onSelect = <span class="hljs-title function_">useCallback</span>(<span class="hljs-function">(<span class="hljs-params">id</span>) =&gt;</span> id, [query]);
  <span class="hljs-keyword">return</span> { visible, onSelect };
}

<span class="hljs-keyword">const</span> items = [<span class="hljs-string">&#x27;apple&#x27;</span>, <span class="hljs-string">&#x27;banana&#x27;</span>, <span class="hljs-string">&#x27;cherry&#x27;</span>];
<span class="hljs-keyword">const</span> first = <span class="hljs-title function_">render</span>(<span class="hljs-title class_">List</span>, { items, <span class="hljs-attr">query</span>: <span class="hljs-string">&#x27;a&#x27;</span> });
<span class="hljs-keyword">const</span> second = <span class="hljs-title function_">render</span>(<span class="hljs-title class_">List</span>, { items, <span class="hljs-attr">query</span>: <span class="hljs-string">&#x27;a&#x27;</span> });
<span class="hljs-keyword">const</span> third = <span class="hljs-title function_">render</span>(<span class="hljs-title class_">List</span>, { items, <span class="hljs-attr">query</span>: <span class="hljs-string">&#x27;e&#x27;</span> });

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(calls); <span class="hljs-comment">// 2</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(first.<span class="hljs-property">visible</span> === second.<span class="hljs-property">visible</span>); <span class="hljs-comment">// true</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(first.<span class="hljs-property">onSelect</span> === second.<span class="hljs-property">onSelect</span>); <span class="hljs-comment">// true</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(second.<span class="hljs-property">onSelect</span> === third.<span class="hljs-property">onSelect</span>); <span class="hljs-comment">// false</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(third.<span class="hljs-property">visible</span>.<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;,&#x27;</span>)); <span class="hljs-comment">// apple,cherry</span>
</code></pre></div>
<p>渲染了三次，过滤只执行了两次。第二次渲染时 <code>items</code> 和 <code>query</code> 都没变，<code>useMemo</code> 直接返回上次的数组，所以 <code>first.visible === second.visible</code>。第三次 <code>query</code> 变了，才重新过滤。</p>
<p><code>useCallback</code> 这边，每次渲染其实都新建了一个箭头函数，这一点它阻止不了。它做的是：依赖没变时丢掉新建的那个，把上次的函数还给你。官方文档原话的意思也是这样：你总是在创建函数，只是 React 忽略它，返回缓存的那个。</p>
<h2>什么时候不该用</h2>
<p>官方文档给的判断标准是看场景，不是看“能不能加”。计算本身不慢，比如几十个元素的 <code>filter</code>，缓存省下的时间还不如比较依赖的开销显眼。文档建议先用 <code>console.time</code> 测一下，累计耗时达到 1 毫秒左右或更多，才考虑 <code>useMemo</code>。测量时要用生产构建，因为开发环境的严格模式会让组件渲染两次，数字不准。</p>
<p><code>useCallback</code> 更是如此。函数没有传给 <code>memo</code> 组件，也没有被别的 Hook 当依赖，缓存它没有任何用处，因为没人在比较它的引用。</p>
<p>缓存也很容易失效。只要传给 <code>memo</code> 组件的 props 里有一个每次都是新对象，整个组件的缓存就白做了。所以官方更推荐先调整结构：把包裹其他组件的组件改成接收 <code>children</code>，把状态放在真正用到它的地方，去掉不必要的 effect 依赖，比如把对象或函数挪进 effect 内部或组件外部。这些做完，很多缓存就不需要了。</p>
<p>还有一类误用是靠缓存来保证正确性。比如“不缓存这个对象，effect 就会无限执行”。文档的说法是，代码离开 <code>useMemo</code> 就不能工作，应该先找到并修好根本问题。React 也明确说过可能丢弃缓存，比如开发时编辑组件文件，或者组件在首次挂载时挂起。</p>
<h2>React Compiler 现在是什么情况</h2>
<p>React 官方文档说明，React Compiler 已经稳定，在 Meta 等公司的生产环境中使用，支持 React 17、18 和 19，可以通过 Babel、Vite、Metro、Rsbuild 等构建工具接入。它在构建时分析遵守 React 规则的组件和 Hook，自动加上等价于手写 <code>useMemo</code>、<code>useCallback</code>、<code>memo</code> 的缓存。</p>
<p>关于手写的缓存，官方的建议分新旧代码。新代码依赖编译器，需要精确控制时再用 <code>useMemo</code>、<code>useCallback</code>，典型场景是某个值被当作 effect 的依赖，要保证它没有实质变化时 effect 不重复执行。已有代码可以保留原来的缓存，删除前要仔细测试，因为删掉可能改变编译输出。</p>
<p>编译器也有边界。它只缓存组件和 Hook 里的东西，不会缓存组件外部的普通函数；它的缓存也不会在多个组件之间共享。所以一个昂贵的计算被很多组件调用时，官方建议考虑在 React 之外单独做缓存。更多细节见<a href="/questions/react-compiler/">《React Compiler 解决了哪些优化问题？》</a>。</p>
<h2>常见追问</h2>
<p><strong><code>useMemo</code> 和 <code>memo</code> 是一回事吗？</strong></p>
<blockquote>
<p>不是。<code>useMemo</code> 是 Hook，在组件内部缓存一个值；<code>memo</code> 包裹整个组件，props 没变时跳过它的渲染。两者经常配合使用，见<a href="/questions/react-memo/">《memo、useMemo、useCallback 各自优化什么？》</a>。</p>
</blockquote>
<p><strong>依赖数组写漏了会怎样？</strong></p>
<blockquote>
<p>缓存不会在该更新时更新，函数里读到的还是旧的 props 或 state。文档建议配置 React 的 lint 规则，它会检查每个用到的响应式值是否都写进了依赖。</p>
</blockquote>
<p><strong><code>useMemo</code> 里能发请求或者改外部变量吗？</strong></p>
<blockquote>
<p>不应该。传给 <code>useMemo</code> 的计算函数必须是纯函数，严格模式下开发环境会故意调用它两次来帮你发现副作用。请求这类副作用应该放在事件处理函数或 effect 里。</p>
</blockquote>`};export{e as default};