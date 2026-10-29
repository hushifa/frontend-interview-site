var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>给接口请求加超时，常见写法是 <code>Promise.race([fetch(url), timeout(3000)])</code>，谁先有结果就用谁。手写 <code>race</code>、<code>allSettled</code>、<code>any</code> 的思路都一样：返回一个新 Promise，遍历输入，用 <code>Promise.resolve</code> 包装每一项，再决定什么时候 resolve 或 reject。</p>
<p>三者的区别在于等什么。<code>race</code> 跟随第一个敲定（成功或失败）的结果；<code>allSettled</code> 等所有项都敲定，按输入顺序返回 <code>{ status, value }</code> 或 <code>{ status, reason }</code>，自己永远不会失败；<code>any</code> 取第一个成功的值，只有全部失败时才拒绝，拒绝原因是 <code>AggregateError</code>，它的 <code>errors</code> 属性按输入顺序放着每个失败原因。</p>
<p>空数组是常被问到的边界，三者各不相同。MDN 写明：<code>race([])</code> 永远处于 pending；<code>allSettled([])</code> 直接兑现为 <code>[]</code>；<code>any([])</code> 直接以 <code>AggregateError</code> 拒绝。</p>
<p>要注意，这几个方法敲定以后不会取消其他还在进行的操作。<code>race</code> 做超时只是不再等慢的那个请求，请求本身还在跑，真要中断得配合 <code>AbortController</code>。</p>
</blockquote>
<h2>三个方法的实现</h2>
<p>下面的实现重点看两处：怎样按输入顺序保存结果，以及怎样判断“全部完成”。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">race</span>(<span class="hljs-params">iterable</span>) {
  <span class="hljs-keyword">return</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Promise</span>(<span class="hljs-function">(<span class="hljs-params">resolve, reject</span>) =&gt;</span> {
    <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> item <span class="hljs-keyword">of</span> iterable) {
      <span class="hljs-title class_">Promise</span>.<span class="hljs-title function_">resolve</span>(item).<span class="hljs-title function_">then</span>(resolve, reject);
    }
  });
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">allSettled</span>(<span class="hljs-params">iterable</span>) {
  <span class="hljs-keyword">return</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Promise</span>(<span class="hljs-function">(<span class="hljs-params">resolve</span>) =&gt;</span> {
    <span class="hljs-keyword">const</span> results = [];
    <span class="hljs-keyword">let</span> count = <span class="hljs-number">0</span>;
    <span class="hljs-keyword">let</span> index = <span class="hljs-number">0</span>;
    <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> item <span class="hljs-keyword">of</span> iterable) {
      <span class="hljs-keyword">const</span> i = index++;
      <span class="hljs-title class_">Promise</span>.<span class="hljs-title function_">resolve</span>(item).<span class="hljs-title function_">then</span>(
        <span class="hljs-function">(<span class="hljs-params">value</span>) =&gt;</span> {
          results[i] = { <span class="hljs-attr">status</span>: <span class="hljs-string">&#x27;fulfilled&#x27;</span>, value };
          <span class="hljs-keyword">if</span> (++count === index) <span class="hljs-title function_">resolve</span>(results);
        },
        <span class="hljs-function">(<span class="hljs-params">reason</span>) =&gt;</span> {
          results[i] = { <span class="hljs-attr">status</span>: <span class="hljs-string">&#x27;rejected&#x27;</span>, reason };
          <span class="hljs-keyword">if</span> (++count === index) <span class="hljs-title function_">resolve</span>(results);
        },
      );
    }
    <span class="hljs-keyword">if</span> (index === <span class="hljs-number">0</span>) <span class="hljs-title function_">resolve</span>(results);
  });
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">any</span>(<span class="hljs-params">iterable</span>) {
  <span class="hljs-keyword">return</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Promise</span>(<span class="hljs-function">(<span class="hljs-params">resolve, reject</span>) =&gt;</span> {
    <span class="hljs-keyword">const</span> errors = [];
    <span class="hljs-keyword">let</span> count = <span class="hljs-number">0</span>;
    <span class="hljs-keyword">let</span> index = <span class="hljs-number">0</span>;
    <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> item <span class="hljs-keyword">of</span> iterable) {
      <span class="hljs-keyword">const</span> i = index++;
      <span class="hljs-title class_">Promise</span>.<span class="hljs-title function_">resolve</span>(item).<span class="hljs-title function_">then</span>(resolve, <span class="hljs-function">(<span class="hljs-params">reason</span>) =&gt;</span> {
        errors[i] = reason;
        <span class="hljs-keyword">if</span> (++count === index) {
          <span class="hljs-title function_">reject</span>(<span class="hljs-keyword">new</span> <span class="hljs-title class_">AggregateError</span>(errors, <span class="hljs-string">&#x27;All promises were rejected&#x27;</span>));
        }
      });
    }
    <span class="hljs-keyword">if</span> (index === <span class="hljs-number">0</span>) {
      <span class="hljs-title function_">reject</span>(<span class="hljs-keyword">new</span> <span class="hljs-title class_">AggregateError</span>(errors, <span class="hljs-string">&#x27;All promises were rejected&#x27;</span>));
    }
  });
}

<span class="hljs-keyword">const</span> <span class="hljs-title function_">delay</span> = (<span class="hljs-params">ms, value, fail = <span class="hljs-literal">false</span></span>) =&gt;
  <span class="hljs-keyword">new</span> <span class="hljs-title class_">Promise</span>(<span class="hljs-function">(<span class="hljs-params">resolve, reject</span>) =&gt;</span> <span class="hljs-built_in">setTimeout</span>(<span class="hljs-function">() =&gt;</span> (fail ? <span class="hljs-title function_">reject</span>(value) : <span class="hljs-title function_">resolve</span>(value)), ms));

<span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">main</span>(<span class="hljs-params"></span>) {
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-keyword">await</span> <span class="hljs-title function_">race</span>([<span class="hljs-title function_">delay</span>(<span class="hljs-number">30</span>, <span class="hljs-string">&#x27;慢&#x27;</span>), <span class="hljs-title function_">delay</span>(<span class="hljs-number">10</span>, <span class="hljs-string">&#x27;快&#x27;</span>)])); <span class="hljs-comment">// 快</span>
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-keyword">await</span> <span class="hljs-title function_">allSettled</span>([<span class="hljs-title function_">delay</span>(<span class="hljs-number">20</span>, <span class="hljs-string">&#x27;A&#x27;</span>), <span class="hljs-title function_">delay</span>(<span class="hljs-number">10</span>, <span class="hljs-string">&#x27;坏&#x27;</span>, <span class="hljs-literal">true</span>), <span class="hljs-number">3</span>]));
  <span class="hljs-comment">// [</span>
  <span class="hljs-comment">//   { status: &#x27;fulfilled&#x27;, value: &#x27;A&#x27; },</span>
  <span class="hljs-comment">//   { status: &#x27;rejected&#x27;, reason: &#x27;坏&#x27; },</span>
  <span class="hljs-comment">//   { status: &#x27;fulfilled&#x27;, value: 3 }</span>
  <span class="hljs-comment">// ]</span>
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-keyword">await</span> <span class="hljs-title function_">any</span>([<span class="hljs-title function_">delay</span>(<span class="hljs-number">10</span>, <span class="hljs-string">&#x27;x&#x27;</span>, <span class="hljs-literal">true</span>), <span class="hljs-title function_">delay</span>(<span class="hljs-number">20</span>, <span class="hljs-string">&#x27;y&#x27;</span>)])); <span class="hljs-comment">// y</span>
  <span class="hljs-keyword">try</span> {
    <span class="hljs-keyword">await</span> <span class="hljs-title function_">any</span>([<span class="hljs-title function_">delay</span>(<span class="hljs-number">20</span>, <span class="hljs-string">&#x27;e1&#x27;</span>, <span class="hljs-literal">true</span>), <span class="hljs-title function_">delay</span>(<span class="hljs-number">10</span>, <span class="hljs-string">&#x27;e2&#x27;</span>, <span class="hljs-literal">true</span>)]);
  } <span class="hljs-keyword">catch</span> (e) {
    <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(e <span class="hljs-keyword">instanceof</span> <span class="hljs-title class_">AggregateError</span>, e.<span class="hljs-property">errors</span>); <span class="hljs-comment">// true [ &#x27;e1&#x27;, &#x27;e2&#x27; ]</span>
  }
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-keyword">await</span> <span class="hljs-title function_">allSettled</span>([])); <span class="hljs-comment">// []</span>
  <span class="hljs-keyword">try</span> {
    <span class="hljs-keyword">await</span> <span class="hljs-title function_">any</span>([]);
  } <span class="hljs-keyword">catch</span> (e) {
    <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(e.<span class="hljs-property">errors</span>.<span class="hljs-property">length</span>); <span class="hljs-comment">// 0</span>
  }
  <span class="hljs-keyword">const</span> winner = <span class="hljs-keyword">await</span> <span class="hljs-title class_">Promise</span>.<span class="hljs-title function_">race</span>([<span class="hljs-title function_">race</span>([]), <span class="hljs-title function_">delay</span>(<span class="hljs-number">10</span>, <span class="hljs-string">&#x27;空数组的 race 一直没结果&#x27;</span>)]);
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(winner); <span class="hljs-comment">// 空数组的 race 一直没结果</span>
}

<span class="hljs-title function_">main</span>();
</code></pre></div>
<p>为什么 <code>race</code> 可以把 <code>resolve</code> 和 <code>reject</code> 直接传给每一项？因为一个 Promise 只能敲定一次。第一个有结果的项调用了 <code>resolve</code> 或 <code>reject</code> 以后，后面再调用都不起作用，所以不需要额外的标记。</p>
<p>为什么 <code>allSettled</code> 的结果里，10 毫秒就失败的“坏”排在第二位，而不是第一位？因为结果是按下标 <code>results[i]</code> 写进去的，不是按完成先后 <code>push</code>。MDN 说结果数组的顺序和输入顺序一致，<code>any</code> 的 <code>errors</code> 也一样，所以例子里 <code>e2</code> 先失败，<code>errors</code> 仍然是 <code>[&#x27;e1&#x27;, &#x27;e2&#x27;]</code>。</p>
<p><code>count</code> 和 <code>index</code> 比较，是因为输入是可迭代对象，不一定有 <code>length</code>，只能边遍历边计数。遍历是同步完成的，而回调最早也要到微任务里才执行，所以回调运行时 <code>index</code> 已经是总数了。</p>
<p><code>Promise.resolve(item)</code> 让普通值也能参与。例子里的 <code>3</code> 不是 Promise，包装以后马上兑现，结果是 <code>{ status: &#x27;fulfilled&#x27;, value: 3 }</code>。</p>
<h2>空数组为什么各不相同</h2>
<p>for 循环一次都不执行时，<code>race</code> 里没有任何地方调用 <code>resolve</code> 或 <code>reject</code>，返回的 Promise 就永远是 pending。这和 MDN 的描述一致：“An empty iterable causes the returned promise to be forever pending”。例子里用原生 <code>Promise.race</code> 给它配了一个 10 毫秒的对手，最后胜出的是对手。</p>
<p><code>allSettled</code> 和 <code>any</code> 需要单独处理 <code>index === 0</code>。<code>allSettled</code> 没有要等的项，直接兑现为空数组；<code>any</code> 没有任何一项能成功，也就等于“全部失败”，MDN 写明这时返回的 Promise 已经是拒绝状态，原因是一个 <code>errors</code> 为空数组的 <code>AggregateError</code>。</p>
<p>这里有一个细节和原生不同。MDN 说 <code>allSettled</code> 和 <code>any</code> 只有在输入为空时才同步敲定，其他情况都是异步敲定；<code>race</code> 则总是异步敲定。上面的实现也符合这一点，因为非空时结果都在 <code>then</code> 回调里产生。</p>
<h2>常见追问</h2>
<p><strong>怎样用 race 实现请求超时？</strong></p>
<blockquote>
<p>写一个 <code>timeout(ms)</code> 返回在 <code>ms</code> 毫秒后拒绝的 Promise，和请求一起传给 <code>race</code>。要注意 <code>race</code> 只决定用谁的结果，慢的请求不会被取消。真要中断请求，可以给 <code>fetch</code> 传 <code>AbortSignal.timeout(ms)</code> 或者自己的 <code>AbortController.signal</code>。</p>
</blockquote>
<p><strong>allSettled 和 all 有什么区别？</strong></p>
<blockquote>
<p><code>all</code> 遇到第一个失败就立刻拒绝，适合“缺一不可”的场景；<code>allSettled</code> 永远等到全部敲定，适合批量请求后分别处理成功和失败的场景。四个组合方法的选择可以看<a href="/questions/js-promise-combinators/">《Promise.all、allSettled、race 和 any 如何选择？》</a>。</p>
</blockquote>
<p><strong>any 和 race 有什么区别？</strong></p>
<blockquote>
<p><code>race</code> 跟随第一个敲定的结果，第一个失败了它就失败；<code>any</code> 会忽略失败，继续等下一个成功的，只有全部失败才拒绝。比如从多个镜像地址取同一份资源，用 <code>any</code> 能拿到最快的那个可用结果。</p>
</blockquote>`};export{e as default};