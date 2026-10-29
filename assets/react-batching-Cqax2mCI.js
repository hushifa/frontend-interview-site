var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>一个点击事件里连续调用了 <code>setCount</code> 和 <code>setFlag</code>，React 不会渲染两次，而是等这个事件处理函数里的代码全部跑完，再把两次更新一起处理，只渲染一次。这就是批量更新，也叫批处理。React 文档打了个比方：服务员会等你点完所有菜再去厨房，而不是听到一个菜名就跑一趟。</p>
<p>这样做是为了少做无用功。如果每次 <code>setState</code> 都立即渲染，中间那些只更新了一半的状态也会被渲染出来，既浪费又可能让界面闪出不一致的样子。</p>
<p>React 18 改变的是批处理的范围。之前只有 React 事件处理函数里的更新会合并，放在 <code>setTimeout</code>、Promise 回调、原生事件监听里的更新，每调用一次就渲染一次。React 18 用 <code>createRoot</code> 渲染后，无论更新从哪里来，都会自动合并，这叫自动批处理。</p>
<p>要注意，批处理意味着调用 <code>setState</code> 后，当前函数里读到的状态还是旧值，DOM 也还没更新。确实需要马上拿到更新后的 DOM，比如更新列表后立刻滚动到新的一项，可以把更新包在 <code>flushSync</code> 里，但它会强制同步渲染，影响性能，只在必要时使用。</p>
</blockquote>
<h2>React 18 前后的区别</h2>
<p>下面的代码在 <code>setTimeout</code> 里连续更新两个状态：</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">function</span> <span class="hljs-title function_">App</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">const</span> [count, setCount] = <span class="hljs-title function_">useState</span>(<span class="hljs-number">0</span>);
  <span class="hljs-keyword">const</span> [flag, setFlag] = <span class="hljs-title function_">useState</span>(<span class="hljs-literal">false</span>);
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;渲染&#x27;</span>);

  <span class="hljs-keyword">function</span> <span class="hljs-title function_">handleClick</span>(<span class="hljs-params"></span>) {
    <span class="hljs-built_in">setTimeout</span>(<span class="hljs-function">() =&gt;</span> {
      <span class="hljs-title function_">setCount</span>(<span class="hljs-function">(<span class="hljs-params">c</span>) =&gt;</span> c + <span class="hljs-number">1</span>);
      <span class="hljs-title function_">setFlag</span>(<span class="hljs-function">(<span class="hljs-params">f</span>) =&gt;</span> !f);
    }, <span class="hljs-number">0</span>);
  }

  <span class="hljs-keyword">return</span> <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">button</span> <span class="hljs-attr">onClick</span>=<span class="hljs-string">{handleClick}</span>&gt;</span>{count}<span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span></span>;
}
</code></pre></div>
<p>点一次按钮，React 17 会打印两次“渲染”，React 18 用 <code>createRoot</code> 时只打印一次。</p>
<p>为什么 React 17 在这里不合并？因为它的批处理是靠“正在执行 React 事件处理函数”这个标记实现的。<code>setTimeout</code> 的回调在事件处理函数执行完之后才运行，那时标记已经清掉了，React 不知道这两次更新属于同一批，只好各渲染一次。</p>
<p>React 18 换成了按时间合并：同一个任务里产生的更新，先放进队列，等当前代码跑完再统一处理，不再关心它是不是来自 React 事件。所以 <code>setTimeout</code>、Promise、原生事件里的更新也都合并了。</p>
<p>要注意，如果项目还在用旧的 <code>ReactDOM.render</code>，即使升级到 React 18，也保持旧的行为，只有改用 <code>createRoot</code> 才会启用自动批处理。</p>
<h2>需要立即更新时用 flushSync</h2>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">import</span> { flushSync } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;react-dom&#x27;</span>;

<span class="hljs-keyword">function</span> <span class="hljs-title function_">handleAdd</span>(<span class="hljs-params"></span>) {
  <span class="hljs-title function_">flushSync</span>(<span class="hljs-function">() =&gt;</span> {
    <span class="hljs-title function_">setItems</span>(<span class="hljs-function">(<span class="hljs-params">items</span>) =&gt;</span> [...items, newItem]);
  });
  listRef.<span class="hljs-property">current</span>.<span class="hljs-property">lastChild</span>.<span class="hljs-title function_">scrollIntoView</span>();
}
</code></pre></div>
<p>如果不用 <code>flushSync</code>，<code>scrollIntoView</code> 执行时新的一项还没渲染到 DOM 里，滚动到的是原来的最后一项。包在 <code>flushSync</code> 里，React 会立刻同步渲染完，下一行就能拿到新的 DOM。</p>
<h2>常见追问</h2>
<p><strong>为什么 setState 之后马上读 state 还是旧值？</strong></p>
<blockquote>
<p>一是批处理，更新还在队列里没处理；二是函数组件里的 <code>count</code> 是这一次渲染时的常量，就算渲染完了，当前这次调用里的变量也不会变。详见<a href="/questions/react-state/">《为什么调用 setState 后，当前变量还是旧值？》</a>。</p>
</blockquote>
<p><strong>连续调用三次 setCount(count + 1)，结果为什么只加了 1？</strong></p>
<blockquote>
<p>三次调用读到的都是同一个 <code>count</code>，比如都是 0，所以三次都是“设成 1”，合并后结果还是 1。想要每次都基于最新值累加，用函数式更新 <code>setCount((c) =&gt; c + 1)</code>，React 会把队列里的函数依次执行，结果是 3。</p>
</blockquote>
<p><strong>能不能关掉自动批处理？</strong></p>
<blockquote>
<p>没有全局开关。需要某一处不合并时，用 <code>flushSync</code> 包住那次更新。</p>
</blockquote>`};export{e as default};