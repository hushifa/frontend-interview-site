var e={answerHtml:`<h2>简答</h2>
<ul>
<li>async 函数总是返回 Promise，函数内的 throw 会变成这个 Promise 的拒绝。</li>
<li>await 拒绝的 Promise 会在当前位置抛出，可以用 try/catch 捕获。</li>
<li>在 try 中 return await 才会让本地 catch、finally 覆盖这次异步结果，直接 return 则不会。</li>
<li>并发取决于任务何时启动：先启动再 await 是并行，逐个 await 是串行。</li>
</ul>
<p>async/await 把 Promise 链写成更接近顺序代码的形式，但不会把 JavaScript 函数自动变成后台线程。调用 async 函数时，它先执行同步部分，遇到需要暂停的 await 后才把后续逻辑留待恢复；调用方拿到的是一个 Promise。</p>
<p>如果函数在第一个 await 前进行大量计算，调用方仍然需要等这些同步工作结束。没有任何 await 的 async 函数，也不会因为关键字存在就让内部每行代码分别异步执行。</p>
<h2>await 已就绪的值也会产生后续恢复</h2>
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
<p>await 可以接收普通值、Promise 或 thenable。即便这里等待的是 42，后续逻辑仍会在后续微任务过程中恢复，不会把“恢复”插在“调用后”之前。</p>
<p>暂停的是 task 这一段异步执行过程，不是让整个线程睡在那里。其他同步代码可以继续运行；待等待结果可用后，task 再得到继续执行的机会。</p>
<h2>async 的返回与抛错都体现在 Promise 上</h2>
<p>在 async 函数中 return 一个普通值，会让返回的 Promise 兑现为那个值；抛出异常，会让它拒绝。即使异常出现在第一个 await 之前，调用方通常也应该通过 await、catch 等方式处理返回 Promise 的拒绝，而不是只用一个包住函数调用的同步 try/catch。</p>
<p>等待的 Promise 拒绝时，await 表达式会以抛出该原因的方式恢复，因此当前 try/catch 可以捕获它。这正是 await 让异步错误与普通控制流衔接的地方。</p>
<h2>return task() 与 return await task() 的错误边界不同</h2>
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
<p>directReturn 直接交出一个 Promise，函数没有在 try 内等待它拒绝，所以本地 catch 不处理这个后来的拒绝。但调用 failLater 本身如果同步抛错，仍然是另一个可以被当前 catch 捕获的情况。</p>
<p>awaitedReturn 在 try 内等待，拒绝会在 await 处恢复为异常，因此进入本地 catch。需要在当前函数包装错误、记录上下文或保持清理时机时，这个差别很重要。不能只凭旧式“return await 多一次开销”的印象机械删除 await，现代引擎也有优化。</p>
<h2>并发取决于任务何时启动</h2>
<p>如果先 await loadUser，再调用 loadPermissions，后一个函数直到前一个完成后才启动。独立任务可以先启动并立即交给 Promise.all 统一等待：</p>
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
<p>这里用就绪数据演示组合方式，真实实现可以返回网络等异步结果。Promise.all 不是负责“把函数变成并发”的调度器，数组构造时这两个函数就已经依次被调用；它负责观察各自的结果。</p>
<p>如果权限请求必须先拿到用户结果中的 ID，依赖关系就不能凭空并行化。任务数量很大时，一次 map 出所有请求也可能过载，需要控制启动数，而不只是把结果包进 Promise.all。</p>
<p>先启动多个任务、然后逐个 await，也可能让后面的任务在尚未连接拒绝处理时先失败，造成未处理拒绝风险。应及时把并发任务交给明确的组合与错误处理机制，而不是仅凭成功路径看起来正确。</p>
<h2>网络成功返回不等于业务成功</h2>
<p>fetch 对常见 HTTP 404、500 响应不会自动以 Promise 拒绝结束，通常需要检查 response.ok。随后解析 JSON 也可能失败；解析后的对象是否符合业务结构，又是另一层验证。</p>
<p>如果要在同一个 try/catch 中处理解析失败，必须在该范围内 await response.json()，或把错误处理放到实际观察那个 Promise 的位置。直接返回它，与前面的 return await 差别相同。</p>
<p>包装错误时可通过 Error 的 cause 保留原始原因，避免所有错误最后都只剩“请求失败”。用户主动取消、网络问题、HTTP 错误、解析错误和业务校验失败，也应根据产品需求分别处理。</p>
<h2>finally 负责清理，但不能覆盖主结果</h2>
<p>控制流离开相关 try/catch 时会执行 finally。把恢复加载状态、解除局部资源等逻辑放在这里很自然，但其中的 return 或新的 throw 会覆盖原本的返回值或错误。</p>
<p>如果 try 直接 return 一个尚未完成的 Promise，finally 可能在它真正完成前就执行；若需要资源一直保留到异步工作结束，应在 try 中等待该工作，再进入清理。一个永远待定的 await 也不会自动让函数立刻走进 finally，进程终止更不是可以依赖清理一定完成的正常控制流。</p>
<p>Promise.all 失败不会自动取消其他任务，取消客户端请求也不证明服务端写入已撤销。需要终止时应与任务协作使用 AbortSignal 等机制；写操作还应有幂等性、状态查询或重试规则。async/await 让代码更易读，但不会替代这些生命周期和业务设计。</p>`};export{e as default};