var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>这四个方法都是把一组 Promise 合成一个新的 Promise，区别只在于新的 Promise 什么时候结束、结束时给什么结果。</p>
<p><code>Promise.all</code> 要求全部成功，成功时按传入的顺序返回结果数组，只要有一个失败就立刻失败，适合“缺一不可”的场景，比如页面要同时拿到几份数据才能渲染。<code>Promise.allSettled</code> 会等所有 Promise 都有结果，不管成功失败，返回每一个的状态和值，它自己不会失败，适合批量操作后汇总成败。<code>Promise.race</code> 谁先有结果就跟谁，成功失败都算，常用来做超时。<code>Promise.any</code> 等第一个成功的，失败的先不管，全部失败时才以 <code>AggregateError</code> 失败，适合多个来源里取最快的那个可用结果。</p>
<p>传空数组时也不一样：<code>all</code> 和 <code>allSettled</code> 立刻以 <code>[]</code> 成功，<code>any</code> 立刻以 <code>AggregateError</code> 失败，<code>race</code> 会一直挂着，永远不结束。</p>
<p>要注意，这几个方法只负责“等结果”。任务在传进去之前就已经开始跑了，它们不会帮你限制并发数，也不会在失败或超时后把其他任务停下来。</p>
</blockquote>
<h2>先看一个对比</h2>
<p>下面用同一组任务分别跑四个方法：第一个失败，第二个成功。注意看每个方法怎么对待那个失败。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">compare</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">const</span> tasks = [
    <span class="hljs-title class_">Promise</span>.<span class="hljs-title function_">reject</span>(<span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">&#x27;A失败&#x27;</span>)),
    <span class="hljs-title class_">Promise</span>.<span class="hljs-title function_">resolve</span>(<span class="hljs-string">&#x27;B成功&#x27;</span>),
  ];

  <span class="hljs-keyword">try</span> {
    <span class="hljs-keyword">await</span> <span class="hljs-title class_">Promise</span>.<span class="hljs-title function_">all</span>(tasks);
  } <span class="hljs-keyword">catch</span> (error) {
    <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">\`all:<span class="hljs-subst">\${error.message}</span>\`</span>); <span class="hljs-comment">// all:A失败</span>
  }

  <span class="hljs-keyword">const</span> settled = <span class="hljs-keyword">await</span> <span class="hljs-title class_">Promise</span>.<span class="hljs-title function_">allSettled</span>(tasks);
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(settled.<span class="hljs-title function_">map</span>(<span class="hljs-function"><span class="hljs-params">item</span> =&gt;</span> item.<span class="hljs-property">status</span>).<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;,&#x27;</span>)); <span class="hljs-comment">// rejected,fulfilled</span>
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(settled.<span class="hljs-title function_">map</span>(<span class="hljs-function"><span class="hljs-params">item</span> =&gt;</span>
    item.<span class="hljs-property">status</span> === <span class="hljs-string">&#x27;fulfilled&#x27;</span> ? item.<span class="hljs-property">value</span> : item.<span class="hljs-property">reason</span>.<span class="hljs-property">message</span>,
  ).<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;|&#x27;</span>)); <span class="hljs-comment">// A失败|B成功</span>

  <span class="hljs-keyword">try</span> {
    <span class="hljs-keyword">await</span> <span class="hljs-title class_">Promise</span>.<span class="hljs-title function_">race</span>(tasks);
  } <span class="hljs-keyword">catch</span> (error) {
    <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">\`race:<span class="hljs-subst">\${error.message}</span>\`</span>); <span class="hljs-comment">// race:A失败</span>
  }

  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">\`any:<span class="hljs-subst">\${<span class="hljs-keyword">await</span> <span class="hljs-built_in">Promise</span>.any(tasks)}</span>\`</span>); <span class="hljs-comment">// any:B成功</span>
}

<span class="hljs-title function_">compare</span>();
</code></pre></div>
<p><code>all</code> 遇到 A 失败，整体就失败了，B 成功了也没用。</p>
<p><code>allSettled</code> 没有走 <code>catch</code>，它把两个结果都交了回来。每一项是一个对象：成功的是 <code>{ status: &#x27;fulfilled&#x27;, value }</code>，失败的是 <code>{ status: &#x27;rejected&#x27;, reason }</code>。所以遍历时先看 <code>status</code>，再决定读 <code>value</code> 还是 <code>reason</code>。</p>
<p><code>race</code> 也失败了，因为 A 先有结果，而 <code>race</code> 不挑成功失败，谁先结束就跟谁。<code>any</code> 则跳过了 A 的失败，拿到了 B 的成功。<code>race</code> 和 <code>any</code> 最大的区别就在这里：<code>race</code> 会被第一个失败打断，<code>any</code> 会忽略失败继续等成功。</p>
<h2>结果顺序和完成先后有关系吗</h2>
<p>没有关系。<code>all</code> 和 <code>allSettled</code> 返回的数组，顺序跟传进去的顺序一致，不是谁先完成谁排前面。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> <span class="hljs-title function_">wait</span> = (<span class="hljs-params">ms, value</span>) =&gt;
  <span class="hljs-keyword">new</span> <span class="hljs-title class_">Promise</span>(<span class="hljs-function">(<span class="hljs-params">resolve</span>) =&gt;</span> <span class="hljs-built_in">setTimeout</span>(<span class="hljs-function">() =&gt;</span> <span class="hljs-title function_">resolve</span>(value), ms));

<span class="hljs-title class_">Promise</span>.<span class="hljs-title function_">all</span>([<span class="hljs-title function_">wait</span>(<span class="hljs-number">30</span>, <span class="hljs-string">&#x27;慢&#x27;</span>), <span class="hljs-title function_">wait</span>(<span class="hljs-number">10</span>, <span class="hljs-string">&#x27;快&#x27;</span>), <span class="hljs-number">3</span>]).<span class="hljs-title function_">then</span>(<span class="hljs-function">(<span class="hljs-params">result</span>) =&gt;</span> {
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(result); <span class="hljs-comment">// [ &#x27;慢&#x27;, &#x27;快&#x27;, 3 ]</span>
});
</code></pre></div>
<p>“快”先完成，可它还是排在第二个位置，因为它是第二个传进去的。另外数组里的 <code>3</code> 不是 Promise，组合方法会用 <code>Promise.resolve</code> 把它包一层，当作一个已经成功的 Promise 处理，所以结果里直接就是 3。</p>
<h2>全部失败和空数组会怎样</h2>
<p><code>any</code> 只有在所有 Promise 都失败时才会失败，这时给出的错误是 <code>AggregateError</code>，它的 <code>errors</code> 属性按传入顺序保存了每一个失败原因。空数组则是几个方法差别最大的地方。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-title class_">Promise</span>.<span class="hljs-title function_">any</span>([
  <span class="hljs-title class_">Promise</span>.<span class="hljs-title function_">reject</span>(<span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">&#x27;甲&#x27;</span>)),
  <span class="hljs-title class_">Promise</span>.<span class="hljs-title function_">reject</span>(<span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">&#x27;乙&#x27;</span>)),
]).<span class="hljs-title function_">catch</span>(<span class="hljs-function">(<span class="hljs-params">error</span>) =&gt;</span> {
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(error.<span class="hljs-property">name</span>); <span class="hljs-comment">// AggregateError</span>
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(error.<span class="hljs-property">errors</span>.<span class="hljs-title function_">map</span>(<span class="hljs-function">(<span class="hljs-params">item</span>) =&gt;</span> item.<span class="hljs-property">message</span>)); <span class="hljs-comment">// [ &#x27;甲&#x27;, &#x27;乙&#x27; ]</span>
});

<span class="hljs-title class_">Promise</span>.<span class="hljs-title function_">all</span>([]).<span class="hljs-title function_">then</span>(<span class="hljs-function">(<span class="hljs-params">value</span>) =&gt;</span> <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;all&#x27;</span>, value)); <span class="hljs-comment">// all []</span>
<span class="hljs-title class_">Promise</span>.<span class="hljs-title function_">allSettled</span>([]).<span class="hljs-title function_">then</span>(<span class="hljs-function">(<span class="hljs-params">value</span>) =&gt;</span> <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;allSettled&#x27;</span>, value)); <span class="hljs-comment">// allSettled []</span>
<span class="hljs-title class_">Promise</span>.<span class="hljs-title function_">any</span>([]).<span class="hljs-title function_">catch</span>(<span class="hljs-function">(<span class="hljs-params">error</span>) =&gt;</span> <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;any&#x27;</span>, error.<span class="hljs-property">name</span>)); <span class="hljs-comment">// any AggregateError</span>
</code></pre></div>
<p>空数组时 <code>all</code> 和 <code>allSettled</code> 没有需要等的东西，所以立刻以 <code>[]</code> 成功；<code>any</code> 一个成功都等不到，所以立刻失败。<code>race</code> 没有写在这里，因为它传空数组时既不成功也不失败，<code>then</code> 和 <code>catch</code> 都不会被调用。</p>
<h2>这几个方法不负责的事</h2>
<p>很多误用都来自以为组合方法会“管理”任务。其实它们只是在等结果。</p>
<p>第一，它们不负责启动。传进去的 Promise 在创建时就已经开始执行了。<code>Promise.all(urls.map(fetch))</code> 里，<code>map</code> 那一刻所有请求就都发出去了。所以要限制同时发几个请求，得自己写并发池，详见<a href="/questions/alg-concurrency-pool/">《怎样实现有明确失败语义的异步并发池？》</a>。</p>
<p>第二，它们不负责取消。<code>all</code> 失败了，或者 <code>race</code> 超时了，其他任务其实还在跑，请求还在下载。需要真正停下来时，可以给每个任务传同一个 <code>AbortSignal</code>，在失败时调用 <code>controller.abort()</code>。</p>
<p>第三，关于未处理的失败。<code>all</code> 已经因为第一个失败而失败后，其他 Promise 再失败，不会触发 <code>unhandledrejection</code> 事件，因为组合方法已经给每个传入的 Promise 挂好了处理函数。</p>
<h2>用 race 做超时</h2>
<p><code>race</code> 最常见的用法是让请求和一个定时器赛跑，定时器先结束就当作超时。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">withTimeout</span>(<span class="hljs-params">promise, ms</span>) {
  <span class="hljs-keyword">return</span> <span class="hljs-title class_">Promise</span>.<span class="hljs-title function_">race</span>([
    promise,
    <span class="hljs-keyword">new</span> <span class="hljs-title class_">Promise</span>(<span class="hljs-function">(<span class="hljs-params">_, reject</span>) =&gt;</span>
      <span class="hljs-built_in">setTimeout</span>(<span class="hljs-function">() =&gt;</span> <span class="hljs-title function_">reject</span>(<span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">&#x27;超时&#x27;</span>)), ms)),
  ]);
}
</code></pre></div>
<p>这个写法能让调用方及时拿到“超时”错误，可是原来的请求并没有停，还在后台继续跑。按上一节说的，<code>race</code> 不负责取消。如果底层是 <code>fetch</code>，更好的写法是让请求本身到时间就中止：<code>fetch(url, { signal: AbortSignal.timeout(ms) })</code>。</p>
<h2>常见追问</h2>
<p><strong><code>all</code> 返回的结果是什么顺序？</strong></p>
<blockquote>
<p>按传入的顺序，跟谁先完成没有关系。第一个传进去的结果就在第一个位置。</p>
</blockquote>
<p><strong>输入里有不是 Promise 的值怎么办？</strong></p>
<blockquote>
<p>会被 <code>Promise.resolve</code> 包一层，当作已经成功的 Promise，结果里就是这个值本身。</p>
</blockquote>
<p><strong><code>any</code> 和 <code>race</code> 有什么区别？</strong></p>
<blockquote>
<p><code>race</code> 看谁先结束，第一个结束的是失败，整体就失败。<code>any</code> 只看成功，会跳过失败继续等，全部失败了才以 <code>AggregateError</code> 失败。</p>
</blockquote>`};export{e as default};