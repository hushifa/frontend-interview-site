var e={answerHtml:`<h2>简答</h2>
<ul>
<li>同步错误沿调用栈传播，被最近的 <code>try/catch</code> 捕获。</li>
<li>Promise 拒绝要在观察它的地方处理：<code>await</code> 在 <code>try</code> 中，或 <code>.catch()</code> 接在链尾。</li>
<li>定时器、事件监听器的回调在之后的任务中执行，注册时外层的 <code>try</code> 捕获不到其中的错误。</li>
<li><code>.then(onOk, onErr)</code> 的 <code>onErr</code> 不会捕获同一个 <code>then</code> 里 <code>onOk</code> 抛出的错误。</li>
<li><code>window</code> 的 <code>error</code> 和 <code>unhandledrejection</code> 事件用于兜底上报遗漏的错误，恢复要在了解业务上下文的地方做。</li>
</ul>
<h2>await 让拒绝变成异常</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">demonstrate</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">try</span> {
    <span class="hljs-keyword">await</span> <span class="hljs-title class_">Promise</span>.<span class="hljs-title function_">resolve</span>().<span class="hljs-title function_">then</span>(<span class="hljs-function">() =&gt;</span> {
      <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">&#x27;处理失败&#x27;</span>);
    });
  } <span class="hljs-keyword">catch</span> (error) {
    <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(error.<span class="hljs-property">message</span>); <span class="hljs-comment">// 处理失败</span>
  } <span class="hljs-keyword">finally</span> {
    <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;清理&#x27;</span>); <span class="hljs-comment">// 清理</span>
  }
}

<span class="hljs-title function_">demonstrate</span>();
</code></pre></div>
<p>调用 async 函数却既不 <code>await</code> 也不 <code>.catch()</code>，拒绝就会成为未处理拒绝。</p>
<h2>回调里的错误</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">try</span> {
  <span class="hljs-built_in">setTimeout</span>(<span class="hljs-function">() =&gt;</span> {
    <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">&#x27;稍后失败&#x27;</span>); <span class="hljs-comment">// 外层 try 已经结束，捕获不到</span>
  }, <span class="hljs-number">0</span>);
} <span class="hljs-keyword">catch</span> {}
</code></pre></div>
<p>要让调用方能等待并捕获，就把回调包装成 Promise：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">runTimerTask</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">return</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Promise</span>(<span class="hljs-function">(<span class="hljs-params">resolve, reject</span>) =&gt;</span> {
    <span class="hljs-built_in">setTimeout</span>(<span class="hljs-function">() =&gt;</span> {
      <span class="hljs-keyword">try</span> {
        <span class="hljs-title class_">JSON</span>.<span class="hljs-title function_">parse</span>(<span class="hljs-string">&#x27;{broken}&#x27;</span>);
        <span class="hljs-title function_">resolve</span>();
      } <span class="hljs-keyword">catch</span> (error) {
        <span class="hljs-title function_">reject</span>(error);
      }
    }, <span class="hljs-number">0</span>);
  });
}

<span class="hljs-title function_">runTimerTask</span>().<span class="hljs-title function_">catch</span>(<span class="hljs-function"><span class="hljs-params">error</span> =&gt;</span> <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(error.<span class="hljs-property">name</span>)); <span class="hljs-comment">// SyntaxError</span>
</code></pre></div>
<p>Promise 构造器只捕获执行器同步阶段的异常，定时器回调内部仍需自己 <code>try/catch</code>。<code>async</code> 事件处理器返回的 Promise 不会被事件系统等待，处理器内部要捕获错误。</p>
<h2>then 的第二个参数</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> result = <span class="hljs-title class_">Promise</span>.<span class="hljs-title function_">resolve</span>(<span class="hljs-number">1</span>).<span class="hljs-title function_">then</span>(
  <span class="hljs-function">() =&gt;</span> {
    <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">&#x27;后处理失败&#x27;</span>);
  },
  <span class="hljs-function">() =&gt;</span> <span class="hljs-string">&#x27;只处理原 Promise 的拒绝&#x27;</span>,
);
result.<span class="hljs-title function_">catch</span>(<span class="hljs-function"><span class="hljs-params">error</span> =&gt;</span> <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(error.<span class="hljs-property">message</span>)); <span class="hljs-comment">// 后处理失败</span>
</code></pre></div>
<p>两个参数都是针对前一个 Promise 的。链尾的 <code>.catch()</code> 才能捕获前面所有步骤的错误。</p>
<h2>全局兜底</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-variable language_">window</span>.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;error&#x27;</span>, <span class="hljs-function">(<span class="hljs-params">event</span>) =&gt;</span> {
  <span class="hljs-title function_">report</span>({ <span class="hljs-attr">message</span>: event.<span class="hljs-property">message</span>, <span class="hljs-attr">stack</span>: event.<span class="hljs-property">error</span>?.<span class="hljs-property">stack</span> });
});

<span class="hljs-variable language_">window</span>.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;unhandledrejection&#x27;</span>, <span class="hljs-function">(<span class="hljs-params">event</span>) =&gt;</span> {
  <span class="hljs-title function_">report</span>({ <span class="hljs-attr">reason</span>: <span class="hljs-title class_">String</span>(event.<span class="hljs-property">reason</span>) });
});
</code></pre></div>
<ul>
<li>图片、脚本等资源加载失败也触发 <code>error</code>，但不冒泡，要在捕获阶段监听：<code>addEventListener(&#x27;error&#x27;, fn, true)</code>。</li>
<li>跨源脚本的错误只显示 <code>Script error.</code>，需要脚本带 <code>crossorigin</code> 属性且服务器返回 CORS 头才能看到详情。</li>
<li>之后补上处理器的拒绝会触发 <code>rejectionhandled</code>。</li>
<li><code>report</code> 自身要捕获异常，避免上报失败又产生新的未处理拒绝。</li>
</ul>
<h2>业务层处理</h2>
<ul>
<li>网络失败提示重试；字段校验错误定位到字段；用户取消（<code>AbortError</code>）通常不提示。</li>
<li><code>catch(() =&gt; [])</code> 只在失败确实等同于&quot;没有数据&quot;时才合适，否则会把故障显示成空列表。</li>
<li>包装错误时用 <code>new Error(&#x27;加载订单失败&#x27;, { cause: error })</code> 保留原因；上报时不要带令牌和完整表单。</li>
<li><code>finally</code> 中不要 <code>return</code> 或抛新错误，否则会覆盖原结果。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li>Node.js 的未处理拒绝怎样处理？默认会让进程以错误退出，可以监听 <code>process.on(&#x27;unhandledRejection&#x27;)</code>，这和浏览器的事件不是同一套接口。</li>
<li>React 渲染错误怎样处理？用错误边界组件，它不捕获事件处理器和异步代码中的错误。</li>
<li><code>return</code> 和 <code>return await</code> 对 catch 的影响，见<a href="/questions/js-async-await-errors/">《async/await 如何处理异常和并发？》</a>。</li>
</ul>`};export{e as default};