var e={answerHtml:`<h2>简答</h2>
<ul>
<li><code>Promise.withResolvers()</code> 返回 <code>{ promise, resolve, reject }</code>，等价于在 <code>new Promise</code> 执行器里把两个函数存到外部变量。</li>
<li>适合&quot;结果由之后的某个事件决定&quot;的场景：等待 Worker 就绪、等待一次用户确认、把回调 API 包装成 Promise。</li>
<li>Promise 只结算一次，之后的 <code>resolve</code> 调用被忽略；连续消息要用队列、异步迭代器或流。</li>
<li>它不会取消底层工作；监听器、定时器要在结算时移除，否则闭包会一直被持有。</li>
<li>ES2024 标准化，主流浏览器和 Node.js 22 都支持。</li>
</ul>
<h2>对比旧写法</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">let</span> resolveReady;
<span class="hljs-keyword">const</span> ready = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Promise</span>(<span class="hljs-function">(<span class="hljs-params">resolve</span>) =&gt;</span> {
  resolveReady = resolve;
});

<span class="hljs-keyword">const</span> { promise, resolve, reject } = <span class="hljs-title class_">Promise</span>.<span class="hljs-title function_">withResolvers</span>();
</code></pre></div>
<h2>桥接一次性事件并清理</h2>
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
<p>成功、失败、超时三条路径都调用 <code>cleanup</code>。不移除监听器时，Worker 后续每条消息都会调用 <code>onMessage</code>，并让闭包里的对象无法回收。</p>
<h2>支持取消</h2>
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
<p><code>signal</code> 可以不传。取消只是停止等待并移除监听器，对方正在执行的工作要靠它自己检查取消状态。</p>
<h2>一次性语义</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> next = <span class="hljs-title class_">Promise</span>.<span class="hljs-title function_">withResolvers</span>();
next.<span class="hljs-title function_">resolve</span>(<span class="hljs-string">&#x27;第一条&#x27;</span>);
next.<span class="hljs-title function_">resolve</span>(<span class="hljs-string">&#x27;第二条&#x27;</span>);
next.<span class="hljs-property">promise</span>.<span class="hljs-title function_">then</span>(<span class="hljs-variable language_">console</span>.<span class="hljs-property">log</span>); <span class="hljs-comment">// 第一条</span>
</code></pre></div>
<p>用一个 deferred 表示&quot;下一条消息&quot;会丢失消息。需要连续数据时用 <code>ReadableStream</code> 或异步生成器，并设计缓冲上限。</p>
<h2>常见追问</h2>
<ul>
<li>超时用 <code>Promise.race</code> 够吗？只能让调用方提前得到超时结果，被竞争的任务仍在运行。应让超时触发 <code>AbortController.abort()</code>，并把 signal 传给下游。</li>
<li>不支持的环境怎样降级？用 <code>new Promise</code> 实现同样的工厂函数即可。</li>
</ul>`};export{e as default};