var e={answerHtml:`<h2>简答</h2>
<ul>
<li><code>scheduler.postTask(callback, { priority })</code> 返回 Promise，优先级有 <code>user-blocking</code>、<code>user-visible</code>（默认）、<code>background</code>。</li>
<li>用 <code>TaskController</code> 创建 signal，可以取消任务，也可以用 <code>setPriority()</code> 调整还没执行的任务的优先级。</li>
<li><code>scheduler.yield()</code> 在长任务中途让出主线程，之后的代码按原任务的优先级继续，排在普通 <code>setTimeout</code> 任务之前。</li>
<li>优先级只影响这些任务之间的排序，不能打断正在执行的代码，也不是实时保证。</li>
<li>MDN 把 <code>scheduler.yield()</code> 标为 Limited availability，使用前用 <code>globalThis.scheduler?.yield</code> 检测。</li>
</ul>
<h2>示例</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> controller = <span class="hljs-keyword">new</span> <span class="hljs-title class_">TaskController</span>({ <span class="hljs-attr">priority</span>: <span class="hljs-string">&#x27;background&#x27;</span> });

scheduler
  .<span class="hljs-title function_">postTask</span>(<span class="hljs-function">() =&gt;</span> <span class="hljs-title function_">prefetchNextPage</span>(), { <span class="hljs-attr">signal</span>: controller.<span class="hljs-property">signal</span> })
  .<span class="hljs-title function_">catch</span>(<span class="hljs-function">(<span class="hljs-params">error</span>) =&gt;</span> {
    <span class="hljs-keyword">if</span> (error.<span class="hljs-property">name</span> !== <span class="hljs-string">&#x27;AbortError&#x27;</span>) <span class="hljs-keyword">throw</span> error; <span class="hljs-comment">// abort 后 Promise 以 AbortError 拒绝</span>
  });

searchInput.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;focus&#x27;</span>, <span class="hljs-function">() =&gt;</span> {
  controller.<span class="hljs-title function_">setPriority</span>(<span class="hljs-string">&#x27;user-visible&#x27;</span>);
});

<span class="hljs-variable language_">window</span>.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;pagehide&#x27;</span>, <span class="hljs-function">() =&gt;</span> controller.<span class="hljs-title function_">abort</span>());
</code></pre></div>
<p>任务被取消时，返回的 Promise 以 <code>AbortError</code> reject。</p>
<h2>用 yield 拆分长任务</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">yieldToMain</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">if</span> (globalThis.<span class="hljs-property">scheduler</span>?.<span class="hljs-property">yield</span>) <span class="hljs-keyword">return</span> scheduler.<span class="hljs-title function_">yield</span>();
  <span class="hljs-keyword">return</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Promise</span>(<span class="hljs-function">(<span class="hljs-params">resolve</span>) =&gt;</span> <span class="hljs-built_in">setTimeout</span>(resolve, <span class="hljs-number">0</span>));
}

<span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">renderRows</span>(<span class="hljs-params">rows</span>) {
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">let</span> i = <span class="hljs-number">0</span>; i &lt; rows.<span class="hljs-property">length</span>; i++) {
    <span class="hljs-title function_">appendRow</span>(rows[i]);
    <span class="hljs-keyword">if</span> (i % <span class="hljs-number">100</span> === <span class="hljs-number">99</span>) <span class="hljs-keyword">await</span> <span class="hljs-title function_">yieldToMain</span>();
  }
}
</code></pre></div>
<p>每处理 100 行让出一次，浏览器在中间可以响应点击和输入，降低 INP。</p>
<h2>和其他调度方式对比</h2>
<table><thead><tr><th>方式</th><th>用途</th></tr></thead><tbody><tr><td><code>requestAnimationFrame</code></td><td>下一帧渲染前修改 DOM</td></tr><tr><td><code>queueMicrotask</code></td><td>当前任务结束前执行，不让出主线程</td></tr><tr><td><code>setTimeout(fn, 0)</code></td><td>让出主线程，排到任务队列末尾</td></tr><tr><td><code>requestIdleCallback</code></td><td>空闲时执行，没有空闲可能一直不执行</td></tr><tr><td><code>postTask</code></td><td>带优先级和取消的任务队列</td></tr></tbody></table>`};export{e as default};