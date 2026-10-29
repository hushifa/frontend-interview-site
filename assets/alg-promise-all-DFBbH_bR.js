var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p><code>Promise.all</code> 等所有输入都成功了，返回一个结果数组；只要有一个失败，就立刻用它的原因失败。</p>
<p>结果数组的顺序和输入顺序一致，跟谁先完成没关系。做法是每一项在登记的时候就记住自己的下标，完成以后写进 <code>results[position]</code>。每一项都用 <code>Promise.resolve(item)</code> 包一下，这样普通值、原生 Promise、带 <code>then</code> 方法的对象（也就是 thenable）都能统一处理。</p>
<p>什么时候算全部完成？用一个计数器 <code>remaining</code>，它从 1 开始，遍历结束后再减 1。这样空输入能正确返回 <code>[]</code>，也不会因为前面的项早早完成，在遍历到一半时就提前兑现。</p>
<p>要注意，有一项失败时，其他已经开始的任务还会继续跑，<code>Promise.all</code> 没法取消它们。另外输入不一定是数组，Set、字符串、生成器这些可迭代对象都行，遍历过程中抛的错会让返回的 Promise 失败。</p>
</blockquote>
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
<p><code>const position = index++</code> 这一行很关键。每次循环都会创建一个新的 <code>position</code>，回调通过闭包记住的是自己那一份。所以不管哪个先完成，都会写回自己原来的位置。</p>
<p>下面让第二项先完成，看看结果的顺序：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">let</span> finishFirst;
<span class="hljs-keyword">let</span> finishSecond;

<span class="hljs-keyword">const</span> first = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Promise</span>(<span class="hljs-function">(<span class="hljs-params">resolve</span>) =&gt;</span> { finishFirst = resolve; });
<span class="hljs-keyword">const</span> second = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Promise</span>(<span class="hljs-function">(<span class="hljs-params">resolve</span>) =&gt;</span> { finishSecond = resolve; });
<span class="hljs-keyword">const</span> combined = <span class="hljs-title function_">promiseAll</span>([first, second, <span class="hljs-number">42</span>]);

<span class="hljs-title function_">finishSecond</span>(<span class="hljs-string">&#x27;B&#x27;</span>);
<span class="hljs-title function_">finishFirst</span>(<span class="hljs-string">&#x27;A&#x27;</span>);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-keyword">await</span> combined);
</code></pre></div>
<p>虽然 B 先完成，输出仍然是 <code>[&#x27;A&#x27;, &#x27;B&#x27;, 42]</code>。第三项 42 是个普通值，被 <code>Promise.resolve</code> 包成了一个已完成的 Promise。这个例子用了顶层 <code>await</code>，要在 ES 模块或者异步函数里运行。</p>
<h2>几个读者常问的细节</h2>
<p><strong>为什么 <code>remaining</code> 要从 1 开始？</strong> 多出来的这个 1，代表“遍历还没结束”。如果从 0 开始，会有两个问题。一是空输入时根本不进循环，<code>remaining</code> 一直是 0，可也没有任何回调会去调 <code>resolve</code>，结果永远不兑现。二是如果某一项在遍历过程中就完成了，计数可能提前归零。从 1 开始，遍历结束时再把这个 1 减掉，空输入在这一步就直接兑现了。</p>
<p><strong>为什么要在 <code>new Promise</code> 的回调里遍历？</strong> 因为这个回调里同步抛出的错误，会自动变成 Promise 的失败。所以传进来一个 <code>null</code>（不能遍历），或者生成器遍历到一半抛错了，返回的 Promise 会失败，而不是直接同步抛错给调用方。</p>
<p><strong>为什么用 <code>Promise.resolve</code>，不直接调 <code>item.then</code>？</strong> 普通值根本没有 <code>then</code> 方法。而且有些不规范的 thenable 可能会把回调调好几次，<code>Promise.resolve</code> 会把它转成一个只结算一次的原生 Promise。</p>
<p><strong><code>reject</code> 被调用好几次会怎样？</strong> Promise 只会结算一次，后面的调用都被忽略。所以好几项都失败时，最终的原因是第一个被处理的那个失败。</p>
<h2>和其他组合方法比一比</h2>
<table><thead><tr><th>方法</th><th>兑现条件</th><th>拒绝条件</th></tr></thead><tbody><tr><td><code>Promise.all</code></td><td>全部兑现</td><td>任一拒绝</td></tr><tr><td><code>Promise.allSettled</code></td><td>全部结算（不论成功失败）</td><td>不会拒绝</td></tr><tr><td><code>Promise.race</code></td><td>第一个结算的是兑现</td><td>第一个结算的是拒绝</td></tr><tr><td><code>Promise.any</code></td><td>任一兑现</td><td>全部拒绝，原因是 <code>AggregateError</code></td></tr></tbody></table>
<h2>常见追问</h2>
<p><strong>Promise.all 能限制并发吗？</strong></p>
<blockquote>
<p>不能。传进来的 Promise 在创建的时候就已经开始执行了，<code>Promise.all</code> 只是在等结果。要限制并发，得传任务函数进去，见<a href="/questions/alg-concurrency-pool/">《怎样实现有明确失败语义的异步并发池？》</a>。</p>
</blockquote>
<p><strong>这个版本和原生实现还有什么区别？</strong></p>
<blockquote>
<p>原生实现用 <code>this</code> 作为构造器，所以支持子类，每一项也是通过 <code>this.resolve</code> 处理的。这个教学版本固定用的是内建的 Promise。</p>
</blockquote>`};export{e as default};