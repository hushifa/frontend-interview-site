var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>页面上的工作有轻重缓急：响应点击最急，渲染可见内容其次，预取下一页最不急。<code>scheduler.postTask(callback, { priority })</code> 就是让你给任务标上优先级，有 <code>user-blocking</code>、<code>user-visible</code>（默认）、<code>background</code> 三档，它返回一个 Promise。</p>
<p>任务排上以后还能调整。用 <code>TaskController</code> 创建 signal 传进去，之后可以取消任务，也可以用 <code>setPriority()</code> 改还没执行的任务的优先级。</p>
<p>长任务要中途歇一下，就用 <code>scheduler.yield()</code> 让出主线程。之后的代码按原来任务的优先级继续，会排在普通 <code>setTimeout</code> 任务前面。</p>
<p>要注意，优先级只决定这些任务之间谁先谁后，打断不了正在执行的代码，也不是实时保证。兼容性上，MDN 把 <code>scheduler.yield()</code> 标为 Limited availability，用之前先检测 <code>globalThis.scheduler?.yield</code>。</p>
</blockquote>
<h2>先看一个可以升级的预取任务</h2>
<p>预取下一页本来不急，用 <code>background</code> 优先级。可是用户一聚焦搜索框，说明马上要用了，就把它升级：</p>
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
<p>优先级不写在 <code>postTask</code> 里，而是写在 <code>TaskController</code> 上，因为之后要通过同一个 controller 去改它。用户离开页面时 <code>abort()</code>，没执行的任务就不跑了。</p>
<p>为什么要 <code>catch</code>？任务被取消时，返回的 Promise 会以 <code>AbortError</code> reject。不处理的话，会冒出一个未处理的 Promise 拒绝。</p>
<h2>用 yield 把长任务切开</h2>
<p>渲染一万行数据，一口气跑完会让页面卡住，用户点什么都没反应。可以每处理一批就让出一次：</p>
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
<p>每处理 100 行让出一次，浏览器在中间就能响应点击和输入，INP 也会降下来。不支持 <code>scheduler.yield()</code> 的浏览器退回 <code>setTimeout</code>。</p>
<p>为什么优先用 <code>yield</code> 而不是直接 <code>setTimeout</code>？因为 <code>setTimeout</code> 会排到任务队列末尾，前面可能还有一堆别的任务；<code>yield</code> 之后的代码排在普通 <code>setTimeout</code> 任务前面，能更快接着干。</p>
<h2>和其他调度方式怎么选</h2>
<table><thead><tr><th>方式</th><th>用途</th></tr></thead><tbody><tr><td><code>requestAnimationFrame</code></td><td>下一帧渲染前修改 DOM</td></tr><tr><td><code>queueMicrotask</code></td><td>当前任务结束前执行，不让出主线程</td></tr><tr><td><code>setTimeout(fn, 0)</code></td><td>让出主线程，排到任务队列末尾</td></tr><tr><td><code>requestIdleCallback</code></td><td>空闲时执行，没有空闲可能一直不执行</td></tr><tr><td><code>postTask</code></td><td>带优先级和取消的任务队列</td></tr></tbody></table>
<h2>常见追问</h2>
<p><strong>把任务设成 <code>user-blocking</code>，能打断正在跑的代码吗？</strong></p>
<blockquote>
<p>不能。优先级只影响排队的顺序，正在执行的代码要自己跑完或者主动 <code>yield</code>，后面的任务才有机会执行。它也不是实时保证。</p>
</blockquote>
<p><strong>任务被取消后会发生什么？</strong></p>
<blockquote>
<p><code>postTask</code> 返回的 Promise 会以 <code>AbortError</code> reject。所以要 <code>catch</code> 住，把 <code>AbortError</code> 当成正常情况忽略掉。</p>
</blockquote>`};export{e as default};