var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>题目一般这样给：有一个 <code>asyncAdd(a, b, callback)</code>，它不立即返回结果，而是过一会儿通过 <code>callback(err, result)</code> 告诉你 <code>a + b</code>，可以想象成一次要等待的网络请求。要求只用它算出 <code>sum(1, 2, 3, ...)</code>。</p>
<p>第一步是把回调包成 Promise，写一个 <code>add(a, b)</code> 返回 Promise，后面就能用 <code>await</code> 和 <code>Promise.all</code>。最直接的写法是串行累加：先算 <code>1 + 2</code>，结果再加 3，以此类推。n 个数要调用 n-1 次，每次都得等上一次完成，总耗时是 n-1 次调用的时间。</p>
<p>优化的依据是加法满足结合律，先加哪两个都不影响结果。所以每一轮把数两两配对，<code>[1,2,3,4]</code> 同时算 <code>1+2</code> 和 <code>3+4</code>，用 <code>Promise.all</code> 等这一轮全部完成，下一轮再把结果两两相加。调用次数还是 n-1，但只要等约 log₂n 轮，8 个数从 7 轮降到 3 轮。</p>
<p>要注意，第一轮会同时发出约 n/2 次调用，如果 <code>asyncAdd</code> 背后是真实请求，数量大时要加并发上限。另外 <code>Promise.all</code> 只要有一个失败就整体失败，回调里的 <code>err</code> 一定要传给 <code>reject</code>，否则错误会被吞掉。</p>
</blockquote>
<h2>先把回调包成 Promise，再比较两种写法</h2>
<p>示例里的 <code>asyncAdd</code> 用 <code>Promise.resolve().then()</code> 模拟异步，<code>calls</code> 记录它被调用了多少次，<code>rounds</code> 记录两两合并的写法等了几轮。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">let</span> calls = <span class="hljs-number">0</span>;
<span class="hljs-keyword">function</span> <span class="hljs-title function_">asyncAdd</span>(<span class="hljs-params">a, b, callback</span>) {
  calls += <span class="hljs-number">1</span>;
  <span class="hljs-title class_">Promise</span>.<span class="hljs-title function_">resolve</span>().<span class="hljs-title function_">then</span>(<span class="hljs-function">() =&gt;</span> <span class="hljs-title function_">callback</span>(<span class="hljs-literal">null</span>, a + b));
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">add</span>(<span class="hljs-params">a, b</span>) {
  <span class="hljs-keyword">return</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Promise</span>(<span class="hljs-function">(<span class="hljs-params">resolve, reject</span>) =&gt;</span> {
    <span class="hljs-title function_">asyncAdd</span>(a, b, <span class="hljs-function">(<span class="hljs-params">err, result</span>) =&gt;</span> (err ? <span class="hljs-title function_">reject</span>(err) : <span class="hljs-title function_">resolve</span>(result)));
  });
}

<span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">sumSerial</span>(<span class="hljs-params">nums</span>) {
  <span class="hljs-keyword">if</span> (nums.<span class="hljs-property">length</span> === <span class="hljs-number">0</span>) <span class="hljs-keyword">return</span> <span class="hljs-number">0</span>;
  <span class="hljs-keyword">let</span> total = nums[<span class="hljs-number">0</span>];
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">let</span> i = <span class="hljs-number">1</span>; i &lt; nums.<span class="hljs-property">length</span>; i += <span class="hljs-number">1</span>) total = <span class="hljs-keyword">await</span> <span class="hljs-title function_">add</span>(total, nums[i]);
  <span class="hljs-keyword">return</span> total;
}

<span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">sumParallel</span>(<span class="hljs-params">nums</span>) {
  <span class="hljs-keyword">if</span> (nums.<span class="hljs-property">length</span> === <span class="hljs-number">0</span>) <span class="hljs-keyword">return</span> <span class="hljs-number">0</span>;
  <span class="hljs-keyword">let</span> rounds = <span class="hljs-number">0</span>;
  <span class="hljs-keyword">let</span> current = nums;
  <span class="hljs-keyword">while</span> (current.<span class="hljs-property">length</span> &gt; <span class="hljs-number">1</span>) {
    <span class="hljs-keyword">const</span> tasks = [];
    <span class="hljs-keyword">for</span> (<span class="hljs-keyword">let</span> i = <span class="hljs-number">0</span>; i &lt; current.<span class="hljs-property">length</span>; i += <span class="hljs-number">2</span>) {
      tasks.<span class="hljs-title function_">push</span>(i + <span class="hljs-number">1</span> &lt; current.<span class="hljs-property">length</span> ? <span class="hljs-title function_">add</span>(current[i], current[i + <span class="hljs-number">1</span>]) : current[i]);
    }
    current = <span class="hljs-keyword">await</span> <span class="hljs-title class_">Promise</span>.<span class="hljs-title function_">all</span>(tasks);
    rounds += <span class="hljs-number">1</span>;
  }
  <span class="hljs-keyword">return</span> { <span class="hljs-attr">total</span>: current[<span class="hljs-number">0</span>], rounds };
}

<span class="hljs-keyword">const</span> nums = [<span class="hljs-number">1</span>, <span class="hljs-number">2</span>, <span class="hljs-number">3</span>, <span class="hljs-number">4</span>, <span class="hljs-number">5</span>, <span class="hljs-number">6</span>, <span class="hljs-number">7</span>, <span class="hljs-number">8</span>];
<span class="hljs-title function_">sumSerial</span>(nums)
  .<span class="hljs-title function_">then</span>(<span class="hljs-function">(<span class="hljs-params">total</span>) =&gt;</span> {
    <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">\`串行：<span class="hljs-subst">\${total}</span>，调用 <span class="hljs-subst">\${calls}</span> 次\`</span>); <span class="hljs-comment">// 串行：36，调用 7 次</span>
    calls = <span class="hljs-number">0</span>;
    <span class="hljs-keyword">return</span> <span class="hljs-title function_">sumParallel</span>(nums);
  })
  .<span class="hljs-title function_">then</span>(<span class="hljs-function">(<span class="hljs-params">{ total, rounds }</span>) =&gt;</span> {
    <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">\`两两合并：<span class="hljs-subst">\${total}</span>，调用 <span class="hljs-subst">\${calls}</span> 次，<span class="hljs-subst">\${rounds}</span> 轮\`</span>); <span class="hljs-comment">// 两两合并：36，调用 7 次，3 轮</span>
  });
</code></pre></div>
<p>两种写法调用 <code>asyncAdd</code> 的次数一样，都是 7 次，差别在等待的方式。串行写法里每次 <code>await</code> 都要等上一次结果回来，7 次调用一个接一个，要等 7 次。两两合并的写法第一轮同时发出 4 次调用，<code>1+2</code>、<code>3+4</code>、<code>5+6</code>、<code>7+8</code>，第二轮 2 次，第三轮 1 次，只需要等 3 轮。如果每次调用要 100 毫秒，串行大约 700 毫秒，两两合并大约 300 毫秒。</p>
<p>为什么调用次数省不下来？因为每次加法把两个数变成一个，n 个数变成 1 个，不管怎么安排都要做 n-1 次。能优化的只有“多少次调用可以同时进行”。</p>
<h2>两两合并里的几个细节</h2>
<p>奇数个数时怎么办？<code>tasks.push</code> 那一行判断，最后一个数没有搭档，就把它原样放进 <code>tasks</code>。<code>Promise.all</code> 接受普通值，会把它当成已经完成的结果，下一轮它再和别人配对。</p>
<p>为什么先包成 <code>add</code>？因为 <code>Promise.all</code> 只能等 Promise，回调形式的函数没法直接放进去。包装时要把回调里的 <code>err</code> 交给 <code>reject</code>，这样任何一次加法失败，<code>Promise.all</code> 都会立刻进入失败状态，外面可以 <code>catch</code> 到。<code>Promise.all</code> 的手写见<a href="/questions/alg-promise-all/">《怎样实现保持输入顺序的 Promise.all 教学版本？》</a>。</p>
<h2>数量很多时加上并发上限</h2>
<p>两两合并的第一轮会同时发出 n/2 次调用。如果 <code>asyncAdd</code> 其实是一次服务端请求，1000 个数就会一下子发出 500 个请求，浏览器和服务端都可能吃不消。</p>
<p>这时可以换一种调度方式：准备一个待加的数字队列，同时最多开 k 个任务，每个任务从队列里取两个数相加，结果放回队列；队列里只剩一个数、且没有正在进行的任务时就结束。每次一个任务完成，就有空位去取下一对，这和并发池的思路一样，见<a href="/questions/alg-concurrency-pool/">《怎样实现有明确失败语义的异步并发池？》</a>。k 取 n/2 时就退化成上面的两两合并，k 取 1 就是串行。</p>
<h2>常见追问</h2>
<p><strong>如果 asyncAdd 本身支持传多个数，比如 <code>asyncAdd(a, b, c, callback)</code>，怎么优化？</strong></p>
<blockquote>
<p>思路一样，只是每一轮不是两两分组，而是按它能接受的个数分组，每组一次调用。每轮剩下的数变成原来的几分之一，轮数会更少。</p>
</blockquote>
<p><strong>如果同样的两个数可能被反复计算，还能怎么优化？</strong></p>
<blockquote>
<p>可以按 <code>a</code> 和 <code>b</code> 做缓存，把 <code>add(a, b)</code> 返回的 Promise 存进 <code>Map</code>，键用两个数拼成的字符串。缓存 Promise 而不是结果，同一对数在计算中再次被请求时，会复用同一个正在进行的 Promise，不会重复调用。</p>
</blockquote>`};export{e as default};