var e={answerHtml:`<h2>简答</h2>
<ul>
<li>结果数组按输入顺序排列，与完成先后无关：每一项在登记时就固定了自己的下标，完成后写入 <code>results[position]</code>。</li>
<li>每一项都用 <code>Promise.resolve(item)</code> 包装，普通值、原生 Promise 和带 <code>then</code> 方法的对象（thenable）都能统一处理。</li>
<li>计数器 <code>remaining</code> 从 1 开始，遍历结束后再减 1。这样空输入能正确兑现为 <code>[]</code>，也不会在遍历中途因为前面的项已完成而提前兑现。</li>
<li>任意一项拒绝就用它的原因拒绝；其余已经开始的任务会继续运行，Promise.all 无法取消它们。</li>
<li>输入可以是数组、Set、字符串或生成器等同步可迭代对象，遍历过程中抛出的错误会让返回的 Promise 拒绝。</li>
</ul>
<h2>实现</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">promiseAll</span>(<span class="hljs-params">iterable</span>) {
  <span class="hljs-keyword">return</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Promise</span>(<span class="hljs-function">(<span class="hljs-params">resolve, reject</span>) =&gt;</span> {
    <span class="hljs-keyword">const</span> results = [];
    <span class="hljs-keyword">let</span> remaining = <span class="hljs-number">1</span>;
    <span class="hljs-keyword">let</span> index = <span class="hljs-number">0</span>;

    <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> item <span class="hljs-keyword">of</span> iterable) {
      <span class="hljs-keyword">const</span> position = index++;
      remaining++;

      <span class="hljs-title class_">Promise</span>.<span class="hljs-title function_">resolve</span>(item).<span class="hljs-title function_">then</span>(<span class="hljs-function">(<span class="hljs-params">value</span>) =&gt;</span> {
        results[position] = value;
        <span class="hljs-keyword">if</span> (--remaining === <span class="hljs-number">0</span>) <span class="hljs-title function_">resolve</span>(results);
      }, reject);
    }

    <span class="hljs-keyword">if</span> (--remaining === <span class="hljs-number">0</span>) <span class="hljs-title function_">resolve</span>(results);
  });
}
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">let</span> finishFirst;
<span class="hljs-keyword">let</span> finishSecond;

<span class="hljs-keyword">const</span> first = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Promise</span>(<span class="hljs-function">(<span class="hljs-params">resolve</span>) =&gt;</span> { finishFirst = resolve; });
<span class="hljs-keyword">const</span> second = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Promise</span>(<span class="hljs-function">(<span class="hljs-params">resolve</span>) =&gt;</span> { finishSecond = resolve; });
<span class="hljs-keyword">const</span> combined = <span class="hljs-title function_">promiseAll</span>([first, second, <span class="hljs-number">42</span>]);

<span class="hljs-title function_">finishSecond</span>(<span class="hljs-string">&#x27;B&#x27;</span>);
<span class="hljs-title function_">finishFirst</span>(<span class="hljs-string">&#x27;A&#x27;</span>);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-keyword">await</span> combined);
</code></pre></div>
<p>第二项先完成，输出仍是 <code>[&#x27;A&#x27;, &#x27;B&#x27;, 42]</code>（示例使用顶层 <code>await</code>，需要在 ES 模块或异步函数中运行）。</p>
<h2>实现细节</h2>
<p><strong>为什么 <code>remaining</code> 从 1 开始？</strong> 多出来的 1 代表&quot;遍历还没结束&quot;。如果从 0 开始，空输入时永远不会兑现；而且某项在遍历中途就完成时，计数可能提前归零。遍历结束后减去这个 1，空输入在这一步直接兑现。</p>
<p><strong>为什么在 executor 里遍历？</strong> <code>new Promise</code> 的 executor 中同步抛出的错误会自动变成拒绝，所以传入 <code>null</code>（不可迭代）或生成器中途抛错时，返回的 Promise 会拒绝，而不是同步抛出。</p>
<p><strong>为什么用 <code>Promise.resolve</code> 而不是直接调用 <code>item.then</code>？</strong> 普通值没有 <code>then</code> 方法；不规范的 thenable 可能多次调用回调，<code>Promise.resolve</code> 会把它转成一个只结算一次的原生 Promise。</p>
<p><strong><code>reject</code> 被调用多次会怎样？</strong> Promise 只会结算一次，后续调用被忽略，所以多项拒绝时结果是第一个被处理的拒绝。</p>
<h2>和其他组合方法对比</h2>
<table><thead><tr><th>方法</th><th>兑现条件</th><th>拒绝条件</th></tr></thead><tbody><tr><td><code>Promise.all</code></td><td>全部兑现</td><td>任一拒绝</td></tr><tr><td><code>Promise.allSettled</code></td><td>全部结算（不论成功失败）</td><td>不会拒绝</td></tr><tr><td><code>Promise.race</code></td><td>第一个结算的是兑现</td><td>第一个结算的是拒绝</td></tr><tr><td><code>Promise.any</code></td><td>任一兑现</td><td>全部拒绝，原因是 <code>AggregateError</code></td></tr></tbody></table>
<h2>常见追问</h2>
<ul>
<li><strong>Promise.all 能限制并发吗？</strong> 不能。传进来的 Promise 在创建时已经开始执行，Promise.all 只等待结果。需要限制并发时传入任务函数，见《怎样实现有明确失败语义的异步并发池？》。</li>
<li><strong>和原生实现还有哪些差别？</strong> 原生实现用 <code>this</code> 作为构造器（支持子类），并通过 <code>this.resolve</code> 处理每一项；这个教学版本固定使用内建 Promise。</li>
</ul>`};export{e as default};