var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>同步代码抛出的错误，会沿着调用栈一层层往外传，被最近的 <code>try/catch</code> 接住。Promise 失败，也就是拒绝，要在使用它的地方处理：要么在 <code>try</code> 里 <code>await</code> 它，要么在链的末尾接 <code>.catch()</code>。</p>
<p>容易误会的是回调。定时器、事件监听的回调是之后才执行的，那时注册回调时外面那个 <code>try</code> 早就结束了，所以接不住回调里的错误，要在回调内部自己处理。还有，<code>.then(onOk, onErr)</code> 里的 <code>onErr</code>，接不住同一个 <code>then</code> 里 <code>onOk</code> 抛出的错误。</p>
<p>总有遗漏的错误，所以页面上要用 <code>window</code> 的 <code>error</code> 和 <code>unhandledrejection</code> 事件做兜底上报。但它们只负责记录，真正的恢复，比如提示重试、回退界面，要在了解业务的地方做。</p>
</blockquote>
<h2>await 怎样把拒绝变成能 catch 的错误</h2>
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
<p>错误是在 <code>then</code> 回调里抛出的，让这个 Promise 变成了拒绝。<code>await</code> 等到拒绝以后，会把拒绝的原因在这一行重新抛出来，所以 <code>try/catch</code> 能像处理同步错误一样接住它，<code>finally</code> 也照常执行。</p>
<p>反过来，如果调用一个 async 函数，既不 <code>await</code> 也不 <code>.catch()</code>，它失败了就没人处理，会变成未处理的拒绝。</p>
<h2>为什么外面的 try 接不住定时器里的错误</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">try</span> {
  <span class="hljs-built_in">setTimeout</span>(<span class="hljs-function">() =&gt;</span> {
    <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">&#x27;稍后失败&#x27;</span>); <span class="hljs-comment">// 外层 try 已经结束，捕获不到</span>
  }, <span class="hljs-number">0</span>);
} <span class="hljs-keyword">catch</span> {}
</code></pre></div>
<p><code>try</code> 里执行的只是 <code>setTimeout</code> 这一句，它的作用是登记一个回调，登记完就返回了，<code>try</code> 跟着结束。回调要等到之后的任务里才执行，那时调用栈上已经没有这个 <code>try</code>，错误只能落到全局。</p>
<p>如果想让调用方能等待、能捕获，就把回调包装成 Promise：</p>
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
<p>注意回调里面还是写了 <code>try/catch</code>。因为 Promise 构造器只会自动捕获执行器函数同步执行时抛出的错误，定时器回调是后来才跑的，不在这个范围里，抛错必须自己 <code>reject</code>。</p>
<p>事件监听也是同样的道理。即使把处理函数写成 <code>async</code>，事件系统也不会等它返回的 Promise，失败了没人管，所以处理函数内部要自己捕获错误。</p>
<h2>then 的第二个参数能接住什么</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> result = <span class="hljs-title class_">Promise</span>.<span class="hljs-title function_">resolve</span>(<span class="hljs-number">1</span>).<span class="hljs-title function_">then</span>(
  <span class="hljs-function">() =&gt;</span> {
    <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">&#x27;后处理失败&#x27;</span>);
  },
  <span class="hljs-function">() =&gt;</span> <span class="hljs-string">&#x27;只处理原 Promise 的拒绝&#x27;</span>,
);
result.<span class="hljs-title function_">catch</span>(<span class="hljs-function"><span class="hljs-params">error</span> =&gt;</span> <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(error.<span class="hljs-property">message</span>)); <span class="hljs-comment">// 后处理失败</span>
</code></pre></div>
<p>第一个回调抛了错，可第二个回调没有执行，错误被后面的 <code>.catch()</code> 接住了。</p>
<p>因为 <code>then</code> 的两个参数都是针对前一个 Promise 的：前一个成功走第一个，前一个失败走第二个。第一个回调自己抛的错，属于 <code>then</code> 返回的新 Promise，只有后面的步骤能处理。所以通常在链的末尾接一个 <code>.catch()</code>，它能接住前面所有步骤的错误。</p>
<h2>全局兜底怎么做</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-variable language_">window</span>.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;error&#x27;</span>, <span class="hljs-function">(<span class="hljs-params">event</span>) =&gt;</span> {
  <span class="hljs-title function_">report</span>({ <span class="hljs-attr">message</span>: event.<span class="hljs-property">message</span>, <span class="hljs-attr">stack</span>: event.<span class="hljs-property">error</span>?.<span class="hljs-property">stack</span> });
});

<span class="hljs-variable language_">window</span>.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;unhandledrejection&#x27;</span>, <span class="hljs-function">(<span class="hljs-params">event</span>) =&gt;</span> {
  <span class="hljs-title function_">report</span>({ <span class="hljs-attr">reason</span>: <span class="hljs-title class_">String</span>(event.<span class="hljs-property">reason</span>) });
});
</code></pre></div>
<p><code>error</code> 事件收集没被捕获的同步错误，<code>unhandledrejection</code> 收集没人处理的 Promise 拒绝。用的时候有几点要注意。</p>
<p>图片、脚本这类资源加载失败也会触发 <code>error</code>，但这个事件不会冒泡到 <code>window</code>，所以要在捕获阶段监听，写成 <code>addEventListener(&#x27;error&#x27;, fn, true)</code>。</p>
<p>跨源加载的脚本出错时，默认只能看到 <code>Script error.</code>，看不到具体信息。要让 <code>script</code> 标签带上 <code>crossorigin</code> 属性，并且服务器返回 CORS 响应头，才能拿到详情。</p>
<p>一个拒绝先被报成未处理，之后又补上了处理函数，会再触发一次 <code>rejectionhandled</code> 事件。</p>
<p><code>report</code> 函数自己也要捕获异常。否则上报请求失败，又会产生一个新的未处理拒绝。</p>
<h2>业务代码里怎样处理错误</h2>
<p>不同的错误要不同处理。网络失败可以提示用户重试，字段校验错误要定位到具体字段，用户主动取消（错误名是 <code>AbortError</code>）通常什么都不用提示。</p>
<p>写 <code>catch(() =&gt; [])</code> 要谨慎，只有当“失败”确实等于“没有数据”时才这么写，否则接口坏了，页面却显示一个空列表，用户和开发都发现不了。</p>
<p>包装错误时，用 <code>new Error(&#x27;加载订单失败&#x27;, { cause: error })</code> 把原来的错误保留下来，排查时能看到最初的原因。上报时不要带上令牌和完整的表单内容。</p>
<p><code>finally</code> 里不要 <code>return</code>，也不要抛新错误，否则会把原来的结果或错误覆盖掉。</p>
<h2>常见追问</h2>
<p><strong>Node.js 里未处理的拒绝怎么处理？</strong></p>
<blockquote>
<p>Node.js 默认会让进程以错误退出。可以监听 <code>process.on(&#x27;unhandledRejection&#x27;)</code> 做兜底，这和浏览器的 <code>unhandledrejection</code> 事件不是同一套接口。</p>
</blockquote>
<p><strong>React 渲染时出错怎么办？</strong></p>
<blockquote>
<p>用错误边界组件，它能接住子组件渲染过程中的错误，显示备用界面。但它接不住事件处理函数和异步代码里的错误，这些还要自己 <code>try/catch</code>。</p>
</blockquote>
<p><strong><code>return</code> 和 <code>return await</code> 对 <code>catch</code> 有什么影响？</strong></p>
<blockquote>
<p>见<a href="/questions/js-async-await-errors/">《async/await 如何处理异常和并发？》</a>。</p>
</blockquote>`};export{e as default};