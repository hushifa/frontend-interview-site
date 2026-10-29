var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>有时候结果要等之后的某个事件才知道，比如等 Worker 发来“准备好了”，等用户点一下确认。这时想先拿到一个 Promise，等事件发生再去结束它。<code>Promise.withResolvers()</code> 一次返回 <code>{ promise, resolve, reject }</code>，正好满足这个需求。它等价于在 <code>new Promise</code> 的执行器里，把 <code>resolve</code> 和 <code>reject</code> 存到外面的变量上，这种拆开使用的写法常叫 deferred。</p>
<p>它适合把一次性事件或者回调 API 包装成 Promise。要注意 Promise 只能结束一次，之后再调 <code>resolve</code> 会被忽略，所以它不能当消息队列用，连续的消息要用队列、异步迭代器或者流。</p>
<p>它也不会帮你取消或清理。监听器、定时器要在 Promise 结束时自己移除，否则回调和它引用的对象会一直留在内存里，这就是 deferred 泄漏。</p>
<p>它是 ES2024 标准化的，主流浏览器和 Node.js 22 都支持。</p>
</blockquote>
<h2>和以前的写法比有什么不同</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">let</span> resolveReady;
<span class="hljs-keyword">const</span> ready = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Promise</span>(<span class="hljs-function">(<span class="hljs-params">resolve</span>) =&gt;</span> {
  resolveReady = resolve;
});

<span class="hljs-keyword">const</span> { promise, resolve, reject } = <span class="hljs-title class_">Promise</span>.<span class="hljs-title function_">withResolvers</span>();
</code></pre></div>
<p>以前要先声明一个变量，再在执行器里把 <code>resolve</code> 赋值出去，写起来绕一圈。现在一行就能拿到三样东西，效果是一样的。</p>
<h2>怎样包装一次性事件，并且清理干净</h2>
<p>下面等 Worker 发来 <code>ready</code> 消息，同时设置超时。注意成功、失败、超时三条路径里都调用了 <code>cleanup</code>。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">waitForWorkerReady</span>(<span class="hljs-params">worker, timeout = <span class="hljs-number">5000</span></span>) {
  <span class="hljs-keyword">const</span> { promise, resolve, reject } = <span class="hljs-title class_">Promise</span>.<span class="hljs-title function_">withResolvers</span>();

  <span class="hljs-keyword">const</span> timer = <span class="hljs-built_in">setTimeout</span>(<span class="hljs-function">() =&gt;</span> {
    <span class="hljs-title function_">cleanup</span>();
    <span class="hljs-title function_">reject</span>(<span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">&#x27;等待 Worker 启动超时&#x27;</span>));
  }, timeout);

  <span class="hljs-keyword">function</span> <span class="hljs-title function_">cleanup</span>(<span class="hljs-params"></span>) {
    <span class="hljs-built_in">clearTimeout</span>(timer);
    worker.<span class="hljs-title function_">removeEventListener</span>(<span class="hljs-string">&#x27;message&#x27;</span>, onMessage);
    worker.<span class="hljs-title function_">removeEventListener</span>(<span class="hljs-string">&#x27;error&#x27;</span>, onError);
  }

  <span class="hljs-keyword">function</span> <span class="hljs-title function_">onMessage</span>(<span class="hljs-params">event</span>) {
    <span class="hljs-keyword">if</span> (event.<span class="hljs-property">data</span>?.<span class="hljs-property">type</span> !== <span class="hljs-string">&#x27;ready&#x27;</span>) <span class="hljs-keyword">return</span>;
    <span class="hljs-title function_">cleanup</span>();
    <span class="hljs-title function_">resolve</span>(event.<span class="hljs-property">data</span>.<span class="hljs-property">version</span>);
  }

  <span class="hljs-keyword">function</span> <span class="hljs-title function_">onError</span>(<span class="hljs-params">event</span>) {
    <span class="hljs-title function_">cleanup</span>();
    <span class="hljs-title function_">reject</span>(event.<span class="hljs-property">error</span> ?? <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">&#x27;Worker 启动失败&#x27;</span>));
  }

  worker.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;message&#x27;</span>, onMessage);
  worker.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;error&#x27;</span>, onError);
  <span class="hljs-keyword">return</span> promise;
}
</code></pre></div>
<p>为什么要这么麻烦？Promise 结束以后，监听器并不会自己消失。如果不移除，Worker 之后发来的每一条消息都还会调用 <code>onMessage</code>，虽然 <code>resolve</code> 已经没有效果了，但这些函数和闭包里的对象会一直被引用着，回收不掉。所以哪条路径先结束，都要先 <code>cleanup</code>。</p>
<h2>怎样支持中途取消</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">waitForMessage</span>(<span class="hljs-params">target, signal</span>) {
  <span class="hljs-keyword">const</span> { promise, resolve, reject } = <span class="hljs-title class_">Promise</span>.<span class="hljs-title function_">withResolvers</span>();

  <span class="hljs-keyword">function</span> <span class="hljs-title function_">cleanup</span>(<span class="hljs-params"></span>) {
    target.<span class="hljs-title function_">removeEventListener</span>(<span class="hljs-string">&#x27;message&#x27;</span>, onMessage);
    signal?.<span class="hljs-title function_">removeEventListener</span>(<span class="hljs-string">&#x27;abort&#x27;</span>, onAbort);
  }
  <span class="hljs-keyword">function</span> <span class="hljs-title function_">onMessage</span>(<span class="hljs-params">event</span>) {
    <span class="hljs-title function_">cleanup</span>();
    <span class="hljs-title function_">resolve</span>(event.<span class="hljs-property">data</span>);
  }
  <span class="hljs-keyword">function</span> <span class="hljs-title function_">onAbort</span>(<span class="hljs-params"></span>) {
    <span class="hljs-title function_">cleanup</span>();
    <span class="hljs-title function_">reject</span>(signal.<span class="hljs-property">reason</span>);
  }

  <span class="hljs-keyword">if</span> (signal?.<span class="hljs-property">aborted</span>) {
    <span class="hljs-title function_">onAbort</span>();
  } <span class="hljs-keyword">else</span> {
    target.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;message&#x27;</span>, onMessage);
    signal?.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;abort&#x27;</span>, onAbort, { <span class="hljs-attr">once</span>: <span class="hljs-literal">true</span> });
  }
  <span class="hljs-keyword">return</span> promise;
}
</code></pre></div>
<p>调用方传一个 <code>AbortSignal</code>，想放弃等待时调用 <code>abort()</code>，Promise 就以取消原因失败。开头先检查 <code>signal?.aborted</code>，是因为传进来的信号可能早就取消了，这时再去监听 <code>abort</code> 事件永远等不到。<code>signal</code> 也可以不传。</p>
<p>要明白，这里的取消只是“我不等了”，并移除监听器。对方正在做的工作不会因此停下，要靠它自己检查取消状态。</p>
<h2>为什么不能用它接收连续的消息</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> next = <span class="hljs-title class_">Promise</span>.<span class="hljs-title function_">withResolvers</span>();
next.<span class="hljs-title function_">resolve</span>(<span class="hljs-string">&#x27;第一条&#x27;</span>);
next.<span class="hljs-title function_">resolve</span>(<span class="hljs-string">&#x27;第二条&#x27;</span>);
next.<span class="hljs-property">promise</span>.<span class="hljs-title function_">then</span>(<span class="hljs-variable language_">console</span>.<span class="hljs-property">log</span>); <span class="hljs-comment">// 第一条</span>
</code></pre></div>
<p><code>resolve</code> 调了两次，可只拿到了“第一条”。Promise 一旦结束，结果就定了，后面的调用全部被忽略。</p>
<p>所以如果用一个 deferred 表示“下一条消息”，消息来得快一点就会丢。需要连续数据时，用 <code>ReadableStream</code> 或者异步生成器，并且给缓冲设一个上限。</p>
<h2>常见追问</h2>
<p><strong>超时用 <code>Promise.race</code> 够吗？</strong></p>
<blockquote>
<p>只能让调用方早点拿到“超时”的结果，被比赛的那个任务其实还在跑。更好的做法是超时后调用 <code>AbortController.abort()</code>，并把 signal 传给下游，让任务真正停下来。</p>
</blockquote>
<p><strong>不支持 <code>withResolvers</code> 的环境怎样降级？</strong></p>
<blockquote>
<p>用 <code>new Promise</code> 写一个同样的工厂函数就行，在执行器里把 <code>resolve</code>、<code>reject</code> 存出来，和 <code>promise</code> 一起返回。</p>
</blockquote>`};export{e as default};