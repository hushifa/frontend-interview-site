var e={answerHtml:`<h2>简答</h2>
<ul>
<li>实现了 <code>[Symbol.asyncIterator]()</code> 的对象是异步可迭代对象，其迭代器的 <code>next()</code> 返回 <code>Promise&lt;{ value, done }&gt;</code>。</li>
<li><code>async function*</code> 是最简单的写法，内部可以 <code>await</code> 也可以 <code>yield</code>。</li>
<li><code>for await...of</code> 等一项处理完再请求下一项，不会并发。</li>
<li>提前 <code>break</code> 时会调用并等待迭代器的 <code>return()</code>，异步生成器借此在 <code>finally</code> 中清理。</li>
<li>浏览器的 <code>ReadableStream</code> 和 Node.js 的 <code>Readable</code> 流都是异步可迭代对象。</li>
</ul>
<h2>分页</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span>* <span class="hljs-title function_">pages</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">yield</span> [<span class="hljs-number">1</span>, <span class="hljs-number">2</span>];
  <span class="hljs-keyword">await</span> <span class="hljs-title class_">Promise</span>.<span class="hljs-title function_">resolve</span>();
  <span class="hljs-keyword">yield</span> [<span class="hljs-number">3</span>];
}

<span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">readPages</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">for</span> <span class="hljs-keyword">await</span> (<span class="hljs-keyword">const</span> page <span class="hljs-keyword">of</span> <span class="hljs-title function_">pages</span>()) {
    <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(page.<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;,&#x27;</span>));
  }
}

<span class="hljs-title function_">readPages</span>();
<span class="hljs-comment">// 输出：1,2</span>
<span class="hljs-comment">// 随后输出：3</span>
</code></pre></div>
<p>真实场景：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span>* <span class="hljs-title function_">fetchAll</span>(<span class="hljs-params">url, signal</span>) {
  <span class="hljs-keyword">while</span> (url) {
    <span class="hljs-keyword">const</span> response = <span class="hljs-keyword">await</span> <span class="hljs-title function_">fetch</span>(url, { signal });
    <span class="hljs-keyword">const</span> { items, next } = <span class="hljs-keyword">await</span> response.<span class="hljs-title function_">json</span>();
    <span class="hljs-keyword">yield</span>* items;
    url = next;
  }
}
</code></pre></div>
<p>消费者 <code>break</code> 后不会再请求下一页。</p>
<h2>读取流</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">readText</span>(<span class="hljs-params">response</span>) {
  <span class="hljs-keyword">const</span> decoder = <span class="hljs-keyword">new</span> <span class="hljs-title class_">TextDecoder</span>();
  <span class="hljs-keyword">let</span> text = <span class="hljs-string">&#x27;&#x27;</span>;
  <span class="hljs-keyword">for</span> <span class="hljs-keyword">await</span> (<span class="hljs-keyword">const</span> chunk <span class="hljs-keyword">of</span> response.<span class="hljs-property">body</span>) {
    text += decoder.<span class="hljs-title function_">decode</span>(chunk, { <span class="hljs-attr">stream</span>: <span class="hljs-literal">true</span> });
  }
  <span class="hljs-keyword">return</span> text + decoder.<span class="hljs-title function_">decode</span>();
}
</code></pre></div>
<p><code>ReadableStream</code> 的异步迭代在提前 <code>break</code> 时默认取消流；传 <code>stream.values({ preventCancel: true })</code> 可以只释放读取锁而不取消。网络分块不按行或按 UTF-8 字符边界切分，所以 <code>TextDecoder</code> 要带 <code>stream: true</code>。</p>
<h2>串行与并发</h2>
<p><code>for await</code> 本身是串行的。需要限制并发地处理每一项时，在循环里把任务交给并发池，而不是在循环体内启动后不等待。不等待会让错误无法被循环捕获。</p>
<h2>背压</h2>
<p>消费者按需调用 <code>next()</code>，生成器在 <code>yield</code> 处暂停，天然不会提前生产。但如果生产者内部预取或使用无限缓冲的队列，内存仍会增长。消费者把每项都 <code>push</code> 进数组，也会重新累积全部数据。</p>
<h2>取消</h2>
<p><code>break</code> 只有在循环体执行时才能发生。如果 <code>next()</code> 一直挂起在网络请求上，要通过 <code>AbortSignal</code> 取消底层请求。各种关闭路径的区别见<a href="/questions/js-iterator-closing/">《JavaScript 迭代器关闭和 return 方法有什么作用？》</a>。</p>
<h2>常见追问</h2>
<ul>
<li><code>Array.fromAsync(iterable)</code> 做什么？把异步可迭代对象收集成数组（ES2026），同样逐项等待。</li>
<li>同步可迭代对象能用 <code>for await</code> 吗？能，每一项会被 <code>await</code>，适合 <code>[promiseA, promiseB]</code>，但其中某项拒绝时后面已启动的 Promise 可能成为未处理拒绝。</li>
</ul>`};export{e as default};