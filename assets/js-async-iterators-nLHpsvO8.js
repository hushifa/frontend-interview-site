var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>有些数据不是一次拿全的，而是“下一项过一会儿才到”，比如分页接口要一页一页请求，流式响应一块一块到达。处理这类数据，就用异步迭代器加 <code>for await...of</code>。</p>
<p>异步迭代器和普通迭代器很像，区别是它的 <code>next()</code> 返回的是 Promise，等 Promise 完成才知道下一项是什么。最简单的写法是 <code>async function*</code>，里面既能 <code>await</code> 又能 <code>yield</code>。浏览器的 <code>ReadableStream</code> 和 Node.js 的 <code>Readable</code> 流本身就支持 <code>for await</code>。</p>
<p><code>for await...of</code> 每次等一项处理完，才去要下一项，所以它是串行的，不会并发。</p>
<p>提前 <code>break</code> 时，它会调用并等待迭代器的 <code>return()</code>，异步生成器就能在 <code>finally</code> 里做清理。还要注意，生产者如果自己偷偷预取、无限缓冲，或者消费者把每一项都存进数组，内存照样会涨。</p>
</blockquote>
<h2>先看一个分页的例子</h2>
<p>下面的生成器先给出第一页，等一下再给出第二页。注意两行输出之间是要等待的。</p>
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
<p><code>for await</code> 每一轮先等 <code>next()</code> 返回的 Promise 完成，拿到一页再执行循环体。生成器走到 <code>await</code> 时暂停，循环就在那里等着，等它 <code>yield</code> 出第二页，才打印 <code>3</code>。</p>
<p>真实场景里，每一页要请求接口，下一页的地址在上一页的响应里：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span>* <span class="hljs-title function_">fetchAll</span>(<span class="hljs-params">url, signal</span>) {
  <span class="hljs-keyword">while</span> (url) {
    <span class="hljs-keyword">const</span> response = <span class="hljs-keyword">await</span> <span class="hljs-title function_">fetch</span>(url, { signal });
    <span class="hljs-keyword">const</span> { items, next } = <span class="hljs-keyword">await</span> response.<span class="hljs-title function_">json</span>();
    <span class="hljs-keyword">yield</span>* items;
    url = next;
  }
}
</code></pre></div>
<p>调用方只管 <code>for await (const item of fetchAll(url))</code>，不用关心分页。而且生成器只有在被要下一项时才继续执行，所以消费者 <code>break</code> 以后，就不会再请求下一页。</p>
<h2>怎样一块一块读取流</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">readText</span>(<span class="hljs-params">response</span>) {
  <span class="hljs-keyword">const</span> decoder = <span class="hljs-keyword">new</span> <span class="hljs-title class_">TextDecoder</span>();
  <span class="hljs-keyword">let</span> text = <span class="hljs-string">&#x27;&#x27;</span>;
  <span class="hljs-keyword">for</span> <span class="hljs-keyword">await</span> (<span class="hljs-keyword">const</span> chunk <span class="hljs-keyword">of</span> response.<span class="hljs-property">body</span>) {
    text += decoder.<span class="hljs-title function_">decode</span>(chunk, { <span class="hljs-attr">stream</span>: <span class="hljs-literal">true</span> });
  }
  <span class="hljs-keyword">return</span> text + decoder.<span class="hljs-title function_">decode</span>();
}
</code></pre></div>
<p><code>response.body</code> 是 <code>ReadableStream</code>，每次循环拿到一块字节。这里有个容易忽略的地方：网络分块不会按行切，也不会按字符切。一个汉字在 UTF-8 里占 3 个字节，可能一半在这块、一半在下一块。所以 <code>decode</code> 要带 <code>{ stream: true }</code>，让解码器把不完整的字节先留着，等下一块来了拼起来再解。最后不带参数调用一次 <code>decode()</code>，把剩下的输出来。</p>
<p>用 <code>for await</code> 读 <code>ReadableStream</code> 时，提前 <code>break</code> 默认会取消整个流。如果只想停止读取、不想取消流，可以改成遍历 <code>stream.values({ preventCancel: true })</code>，这样退出时只释放读取锁。</p>
<h2>为什么说它是串行的</h2>
<p><code>for await</code> 一定要等这一项的循环体执行完，才会去要下一项。要是每一项都要发请求，又想同时处理几项，不能在循环体里启动任务却不等它，那样任务失败时，错误不会被循环捕获。正确的做法是在循环里把任务交给一个限制并发数量的并发池。</p>
<h2>它能防止内存涨爆吗</h2>
<p>数据生产得比消费快时，要有办法让生产方慢下来，这叫背压。</p>
<p>异步生成器天然带这个效果。消费者调用 <code>next()</code>，生成器才往下跑，到 <code>yield</code> 又停下，所以不会提前生产一大堆。可是如果生产者内部自己预取数据，或者用一个没有上限的队列缓冲，内存还是会涨。消费者把每一项都 <code>push</code> 进数组，也等于又把全部数据攒了起来。</p>
<h2>怎样中途取消</h2>
<p><code>break</code> 只能写在循环体里，循环体执行的时候才能退出。如果 <code>next()</code> 一直卡在一个网络请求上，循环体根本不会执行，<code>break</code> 也就没机会发生。这时要用 <code>AbortSignal</code> 去取消底层请求，就像上面 <code>fetchAll</code> 接收 <code>signal</code> 那样。各种关闭方式的区别见<a href="/questions/js-iterator-closing/">《JavaScript 迭代器关闭和 return 方法有什么作用？》</a>。</p>
<h2>常见追问</h2>
<p><strong><code>Array.fromAsync(iterable)</code> 做什么？</strong></p>
<blockquote>
<p>它把异步可迭代对象收集成一个数组，是 ES2026 的方法。它也是一项一项等待的，跟 <code>for await</code> 一样不会并发。</p>
</blockquote>
<p><strong>同步可迭代对象能用 <code>for await</code> 吗？</strong></p>
<blockquote>
<p>能，每一项都会被 <code>await</code> 一下，所以可以写 <code>for await (const x of [promiseA, promiseB])</code>。但要小心，这些 Promise 早就都启动了，如果前面一项还在等，后面某一项先失败了，它可能会先被报成未处理的拒绝。</p>
</blockquote>`};export{e as default};