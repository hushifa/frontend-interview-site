var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>红绿灯题是：红灯亮 3 秒，绿灯亮 2 秒，黄灯亮 1 秒，然后一直循环。直接嵌套 <code>setTimeout</code> 能写出来，但层层回调很难读，也没法无限循环。更好的做法是先写一个 <code>sleep(ms)</code>，它返回一个在 <code>ms</code> 毫秒后完成的 Promise，然后在 <code>async</code> 函数里用 <code>while (true)</code> 循环，依次 <code>await sleep(3000)</code>、<code>await sleep(2000)</code>、<code>await sleep(1000)</code>。</p>
<p>LazyMan 题要求支持 <code>LazyMan(&#x27;Tom&#x27;).eat(&#x27;午饭&#x27;).sleep(1000).eat(&#x27;晚饭&#x27;)</code> 这样的链式调用，而且 <code>sleep</code> 要真的让后面的输出等一会儿。难点在于链式调用是同步执行完的，每个方法只能返回 <code>this</code>，不能自己等。所以每个方法只负责把要做的事包成一个任务函数，放进队列；构造时安排一个异步的“开始”，等整条链都调用完，再从队头逐个取出任务执行。</p>
<p><code>sleepFirst</code> 要求不管写在哪，都最先执行，它只需要把任务插到队列开头而不是末尾。这就是为什么要等同步代码全部执行完再开始：只有那时，队列里的任务才是完整的。</p>
<p>要注意，开始执行的时机要用 <code>setTimeout</code> 或 <code>queueMicrotask</code> 放到当前同步代码之后。如果在构造函数里立刻开始执行，后面链式调用加进来的任务就可能错过。</p>
</blockquote>
<h2>红绿灯</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> <span class="hljs-title function_">sleep</span> = (<span class="hljs-params">ms</span>) =&gt; <span class="hljs-keyword">new</span> <span class="hljs-title class_">Promise</span>(<span class="hljs-function">(<span class="hljs-params">resolve</span>) =&gt;</span> <span class="hljs-built_in">setTimeout</span>(resolve, ms));

<span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">trafficLight</span>(<span class="hljs-params">log, rounds = <span class="hljs-literal">Infinity</span></span>) {
  <span class="hljs-keyword">const</span> lights = [
    [<span class="hljs-string">&#x27;红&#x27;</span>, <span class="hljs-number">3000</span>],
    [<span class="hljs-string">&#x27;绿&#x27;</span>, <span class="hljs-number">2000</span>],
    [<span class="hljs-string">&#x27;黄&#x27;</span>, <span class="hljs-number">1000</span>],
  ];
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">let</span> round = <span class="hljs-number">0</span>; round &lt; rounds; round++) {
    <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> [color, ms] <span class="hljs-keyword">of</span> lights) {
      <span class="hljs-title function_">log</span>(color);
      <span class="hljs-keyword">await</span> <span class="hljs-title function_">sleep</span>(ms);
    }
  }
}
</code></pre></div>
<p><code>await sleep(ms)</code> 做了什么？<code>sleep</code> 返回的 Promise 在 <code>ms</code> 毫秒后才完成，<code>await</code> 让 <code>async</code> 函数暂停在这里，把控制权还给事件循环，时间到了再从下一行继续。所以这段代码虽然写成了普通的循环，实际是一个灯亮完再亮下一个。</p>
<p><code>rounds</code> 参数是为了测试和演示方便，默认无限循环。真正的页面里，组件卸载时要能停下来，可以在循环条件里检查一个停止标记，或者用 <code>AbortController</code> 取消。</p>
<h2>LazyMan</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">class</span> <span class="hljs-title class_">LazyMan</span> {
  #tasks = [];

  <span class="hljs-title function_">constructor</span>(<span class="hljs-params">name, log</span>) {
    <span class="hljs-variable language_">this</span>.<span class="hljs-property">log</span> = log;
    <span class="hljs-variable language_">this</span>.#tasks.<span class="hljs-title function_">push</span>(<span class="hljs-function">() =&gt;</span> <span class="hljs-variable language_">this</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">\`我是 <span class="hljs-subst">\${name}</span>\`</span>));
    <span class="hljs-comment">// 等整条链式调用同步执行完，再开始按队列执行</span>
    <span class="hljs-built_in">setTimeout</span>(<span class="hljs-function">() =&gt;</span> <span class="hljs-variable language_">this</span>.#<span class="hljs-title function_">run</span>(), <span class="hljs-number">0</span>);
  }

  <span class="hljs-keyword">async</span> #<span class="hljs-title function_">run</span>(<span class="hljs-params"></span>) {
    <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> task <span class="hljs-keyword">of</span> <span class="hljs-variable language_">this</span>.#tasks) <span class="hljs-keyword">await</span> <span class="hljs-title function_">task</span>();
  }

  <span class="hljs-title function_">eat</span>(<span class="hljs-params">food</span>) {
    <span class="hljs-variable language_">this</span>.#tasks.<span class="hljs-title function_">push</span>(<span class="hljs-function">() =&gt;</span> <span class="hljs-variable language_">this</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">\`吃 <span class="hljs-subst">\${food}</span>\`</span>));
    <span class="hljs-keyword">return</span> <span class="hljs-variable language_">this</span>;
  }

  <span class="hljs-title function_">sleep</span>(<span class="hljs-params">ms</span>) {
    <span class="hljs-variable language_">this</span>.#tasks.<span class="hljs-title function_">push</span>(<span class="hljs-function">() =&gt;</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Promise</span>(<span class="hljs-function">(<span class="hljs-params">resolve</span>) =&gt;</span> <span class="hljs-built_in">setTimeout</span>(resolve, ms)));
    <span class="hljs-keyword">return</span> <span class="hljs-variable language_">this</span>;
  }

  <span class="hljs-title function_">sleepFirst</span>(<span class="hljs-params">ms</span>) {
    <span class="hljs-variable language_">this</span>.#tasks.<span class="hljs-title function_">unshift</span>(<span class="hljs-function">() =&gt;</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Promise</span>(<span class="hljs-function">(<span class="hljs-params">resolve</span>) =&gt;</span> <span class="hljs-built_in">setTimeout</span>(resolve, ms)));
    <span class="hljs-keyword">return</span> <span class="hljs-variable language_">this</span>;
  }
}

<span class="hljs-keyword">const</span> logs = [];
<span class="hljs-keyword">new</span> <span class="hljs-title class_">LazyMan</span>(<span class="hljs-string">&#x27;Tom&#x27;</span>, <span class="hljs-function">(<span class="hljs-params">text</span>) =&gt;</span> logs.<span class="hljs-title function_">push</span>(text)).<span class="hljs-title function_">eat</span>(<span class="hljs-string">&#x27;午饭&#x27;</span>).<span class="hljs-title function_">sleep</span>(<span class="hljs-number">1000</span>).<span class="hljs-title function_">eat</span>(<span class="hljs-string">&#x27;晚饭&#x27;</span>).<span class="hljs-title function_">sleepFirst</span>(<span class="hljs-number">500</span>);
</code></pre></div>
<p>执行顺序是：等 500 毫秒，输出“我是 Tom”“吃 午饭”，再等 1000 毫秒，输出“吃 晚饭”。</p>
<p>为什么 <code>sleepFirst</code> 写在最后，却最先执行？链式调用是同步代码，<code>new LazyMan(...)</code> 到 <code>.sleepFirst(500)</code> 一口气执行完，这期间只是往 <code>#tasks</code> 里放任务：先是“我是 Tom”，然后“吃 午饭”、等 1000、“吃 晚饭”，最后 <code>sleepFirst</code> 用 <code>unshift</code> 把等待 500 放到了最前面。直到这时，构造函数里的 <code>setTimeout</code> 回调才执行 <code>#run</code>，按队列顺序跑。</p>
<p><code>#run</code> 里的 <code>await task()</code> 为什么对普通任务也能用？<code>log</code> 返回 <code>undefined</code>，<code>await undefined</code> 会立即继续；<code>sleep</code> 任务返回 Promise，<code>await</code> 就会等它完成。所以同一个循环能同时处理同步任务和异步任务。</p>
<h2>常见追问</h2>
<p><strong>不用 async/await 怎么写？</strong></p>
<blockquote>
<p>用 <code>reduce</code> 把任务串成一条 Promise 链：<code>tasks.reduce((chain, task) =&gt; chain.then(task), Promise.resolve())</code>。每个 <code>then</code> 等上一个任务完成，返回 Promise 的任务会让链等待它。</p>
</blockquote>
<p><strong>怎样限制同时执行的异步任务数？</strong></p>
<blockquote>
<p>这是并发控制，和按顺序执行不同，要维护一个“正在执行”的计数，完成一个再补一个，见<a href="/questions/alg-concurrency-pool/">《怎样实现有明确失败语义的异步并发池？》</a>。</p>
</blockquote>`};export{e as default};