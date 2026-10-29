var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>async 函数调用时，会先同步执行到第一个 <code>await</code>，然后马上返回一个 Promise。函数里 <code>return</code> 的值让这个 Promise 成功，<code>throw</code> 的错误让它失败，也就是拒绝。</p>
<p><code>await</code> 一个失败的 Promise，错误会在 <code>await</code> 这一行抛出来，所以可以直接用 <code>try/catch</code> 接住。但有个细节：在 <code>try</code> 里写 <code>return p</code>，<code>p</code> 失败时本地的 <code>catch</code> 接不到，错误会直接交给调用方；写成 <code>return await p</code> 才能在本地捕获。</p>
<p>并发的关键是任务什么时候启动。先把几个任务都启动，再用 <code>Promise.all</code> 一起等，是并行；一个 <code>await</code> 完再 <code>await</code> 下一个，就是串行。</p>
<p>另外 <code>fetch</code> 遇到 404、500 不会拒绝，只有网络层失败才会，所以要自己检查 <code>response.ok</code>。</p>
</blockquote>
<h2>async 函数什么时候开始执行，什么时候暂停</h2>
<p>下面的例子用日志标出执行顺序，注意“函数内”和“调用后”谁先出现。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;调用前&#x27;</span>);

<span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">task</span>(<span class="hljs-params"></span>) {
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;函数内&#x27;</span>);
  <span class="hljs-keyword">await</span> <span class="hljs-number">42</span>;
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;恢复&#x27;</span>);
  <span class="hljs-keyword">return</span> <span class="hljs-number">7</span>;
}

<span class="hljs-keyword">const</span> promise = <span class="hljs-title function_">task</span>();
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;调用后&#x27;</span>);
promise.<span class="hljs-title function_">then</span>(<span class="hljs-function"><span class="hljs-params">value</span> =&gt;</span> <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(value));
<span class="hljs-comment">// 输出顺序：调用前 → 函数内 → 调用后 → 恢复 → 7</span>
</code></pre></div>
<p>很多人以为调用 async 函数时，函数体会“异步地”执行，可“函数内”其实紧跟在“调用前”后面。async 函数在第一个 <code>await</code> 之前是同步运行的。</p>
<p>遇到 <code>await</code> 以后，这个函数暂停，控制权回到调用方，所以接着打印“调用后”。等调用方的同步代码跑完，函数才在微任务里恢复，打印“恢复”。微任务就是当前同步代码执行完后立刻处理的一批回调，详见<a href="/questions/js-event-loop/">《事件循环中，任务和微任务按什么顺序执行？》</a>。注意 <code>await 42</code> 等的只是个普通值，恢复也一样要排到微任务里，不会立刻接着执行。</p>
<p>所以 <code>await</code> 暂停的只是这个函数，线程并没有停。反过来，第一个 <code>await</code> 之前如果有耗时的计算，它照样会卡住调用方。</p>
<h2>为什么 return p 时 catch 接不到错误</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">failLater</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">return</span> <span class="hljs-title class_">Promise</span>.<span class="hljs-title function_">reject</span>(<span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">&#x27;任务失败&#x27;</span>));
}

<span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">directReturn</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">try</span> {
    <span class="hljs-keyword">return</span> <span class="hljs-title function_">failLater</span>();
  } <span class="hljs-keyword">catch</span> {
    <span class="hljs-keyword">return</span> <span class="hljs-string">&#x27;当前函数已捕获&#x27;</span>;
  }
}

<span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">awaitedReturn</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">try</span> {
    <span class="hljs-keyword">return</span> <span class="hljs-keyword">await</span> <span class="hljs-title function_">failLater</span>();
  } <span class="hljs-keyword">catch</span> {
    <span class="hljs-keyword">return</span> <span class="hljs-string">&#x27;当前函数已捕获&#x27;</span>;
  }
}

<span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">demonstrate</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">const</span> direct = <span class="hljs-keyword">await</span> <span class="hljs-title function_">directReturn</span>().<span class="hljs-title function_">catch</span>(<span class="hljs-function"><span class="hljs-params">error</span> =&gt;</span> <span class="hljs-string">\`外层接到：<span class="hljs-subst">\${error.message}</span>\`</span>);
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(direct); <span class="hljs-comment">// 外层接到：任务失败</span>
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-keyword">await</span> <span class="hljs-title function_">awaitedReturn</span>()); <span class="hljs-comment">// 当前函数已捕获</span>
}

<span class="hljs-title function_">demonstrate</span>();
</code></pre></div>
<p>两个函数只差一个 <code>await</code>，可 <code>directReturn</code> 的 <code>catch</code> 完全没起作用，错误跑到了外层。</p>
<p>原因是 <code>return failLater()</code> 把 Promise 原样交了出去，这一行本身没有出错，<code>try</code> 就正常结束了。Promise 后来失败时，已经离开了 <code>try</code>，失败只能落到 async 函数返回的那个 Promise 上，由调用方处理。<code>return await</code> 会在 <code>try</code> 里面等结果，失败就在这一行抛出，本地 <code>catch</code> 才能接住。</p>
<p><code>finally</code> 也有同样的问题。直接 <code>return p</code> 时，<code>finally</code> 会在 <code>p</code> 完成之前就运行，所以资源要保留到任务结束，就得写 <code>return await</code>。如果不在 <code>try</code> 里，这两种写法效果一样。</p>
<h2>怎样让几个请求并行</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">loadUser</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">return</span> { <span class="hljs-attr">id</span>: <span class="hljs-number">1</span> };
}

<span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">loadPermissions</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">return</span> [<span class="hljs-string">&#x27;read&#x27;</span>];
}

<span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">initialize</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">const</span> [user, permissions] = <span class="hljs-keyword">await</span> <span class="hljs-title class_">Promise</span>.<span class="hljs-title function_">all</span>([
    <span class="hljs-title function_">loadUser</span>(),
    <span class="hljs-title function_">loadPermissions</span>(),
  ]);
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">\`<span class="hljs-subst">\${user.id}</span>:<span class="hljs-subst">\${permissions.join(<span class="hljs-string">&#x27;,&#x27;</span>)}</span>\`</span>); <span class="hljs-comment">// 1:read</span>
}

<span class="hljs-title function_">initialize</span>();
</code></pre></div>
<p>两个函数在构造数组的时候就都调用了，请求已经一起发出去，<code>Promise.all</code> 只是负责等它们都完成。如果写成 <code>await loadUser(); await loadPermissions();</code>，第二个要等第一个结束才开始，就变成了串行。</p>
<p>并行写的时候还有几点要注意。第一，后一个请求如果要用前一个的结果，比如需要 <code>user.id</code>，那就只能串行。第二，不要写成先 <code>const a = loadA(); const b = loadB();</code>，再分别 <code>await a; await b;</code>。如果 <code>b</code> 在 <code>await a</code> 期间就失败了，这时还没有人处理它，会先报一次未处理的拒绝，所以并行任务启动后应该马上交给 <code>Promise.all</code> 或 <code>allSettled</code>。第三，任务很多时一下全部启动可能压垮服务，要用并发池限制同时进行的数量。第四，<code>Promise.all</code> 失败以后，其他任务其实还在运行，要停下它们，得给它们传 <code>AbortSignal</code>。</p>
<h2>请求失败要分几种情况处理</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">getJson</span>(<span class="hljs-params">url, signal</span>) {
  <span class="hljs-keyword">const</span> response = <span class="hljs-keyword">await</span> <span class="hljs-title function_">fetch</span>(url, { signal });
  <span class="hljs-keyword">if</span> (!response.<span class="hljs-property">ok</span>) {
    <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">\`HTTP <span class="hljs-subst">\${response.status}</span>\`</span>);
  }
  <span class="hljs-keyword">try</span> {
    <span class="hljs-keyword">return</span> <span class="hljs-keyword">await</span> response.<span class="hljs-title function_">json</span>();
  } <span class="hljs-keyword">catch</span> (error) {
    <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">&#x27;响应不是合法 JSON&#x27;</span>, { <span class="hljs-attr">cause</span>: error });
  }
}
</code></pre></div>
<p>一次请求可能在好几个地方失败：网络断了、用户取消（错误名是 <code>AbortError</code>）、服务器返回 HTTP 错误、响应不是合法 JSON、业务校验没通过。这几种的处理方式不一样，比如用户取消通常不用提示，网络失败可以让用户重试，所以要分开抛、分开处理。包装错误时把原来的错误放进 <code>cause</code>，排查时还能看到最初的原因。</p>
<h2>常见追问</h2>
<p><strong>顶层 <code>await</code> 能用在哪里？</strong></p>
<blockquote>
<p>能用在 ES 模块的最顶层，浏览器控制台里也可以直接写。经典脚本和 CommonJS 模块里不行，只能在 async 函数里用。</p>
</blockquote>
<p><strong><code>await</code> 一个 thenable 会怎样？</strong></p>
<blockquote>
<p>thenable 就是带 <code>then</code> 方法的对象。<code>await</code> 会调用它的 <code>then</code> 方法，按它给出的结果恢复执行，跟等一个真正的 Promise 一样。</p>
</blockquote>
<p><strong>定时器回调里的错误和全局兜底怎么处理？</strong></p>
<blockquote>
<p>这部分见<a href="/questions/js-errors-event-handling/">《同步错误、Promise 拒绝和全局异常应该怎样处理？》</a>。</p>
</blockquote>`};export{e as default};