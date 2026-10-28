var e={answerHtml:`<h2>简答</h2>
<ul>
<li>异步迭代器的 next() 返回 Promise，for await...of 逐个等待结果，适合分页、流式响应和逐块读取。</li>
<li>消费是顺序的，不会自动并发处理各项。</li>
<li>提前 break 会调用 return() 关闭迭代器，循环会等待清理完成。</li>
<li>背压需要生产者按需产出，写了 for await 不等于自动具备背压。</li>
</ul>
<p>普通数组已经有全部元素，普通迭代器可以同步给出下一项。分页接口、网络流或异步生成的数据则不同：下一项可能还要等请求、读取或计算完成。</p>
<p>异步迭代器把“给我下一项”定义成一个可等待的过程。数据源提供 Symbol.asyncIterator，返回的迭代器通过 next 产生 Promise 结果，兑现后得到 <code>{ value, done }</code>。for await...of 帮助消费者等待并检查这些结果。</p>
<h2>async Generator 是一种直观的生产者</h2>
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
<p>消费者没有一次拿到完整数组，而是先得到第一页，再请求后面的数据。真实分页生产者可以在每次需要下一页时请求接口，并根据服务端的游标或完成标志结束；这里用就绪数据演示协议，不包含网络请求。</p>
<p>调用 async Generator 函数先得到异步生成器对象，next 才推动执行。函数体可以 await 异步操作，也可以 yield 一项结果。它仍然不是独立线程，里面长时间的同步计算依然会阻塞所在执行环境。</p>
<h2>顺序消费不等于“自动并发所有处理”</h2>
<p>for await...of 会等待本次 next 的结果，然后执行循环体，再继续请求下一项。如果循环体中也 await 某项处理，那么通常是这项处理结束后才请求下一项。</p>
<p>如果循环体只是启动一个异步函数却没有等待它，那些处理仍然可能同时在途，错误也可能没有被当前循环观察。需要并发处理时应明确管理任务集合与并发上限，而不是误以为 for await 自带并发池。</p>
<p>与 Promise.all 等待一组已启动任务相比，异步迭代很适合总量尚不确定、希望边到达边处理的数据。但如果传进来的是一个已经创建了大量请求 Promise 的数组，那些请求仍然已经启动，顺序 await 不会倒过来限制其启动数量。</p>
<h2>从 ReadableStream 读取时，锁和取消要分别处理</h2>
<p>下面的包装器拥有传入流的读取锁。正常读到结束时释放锁；消费者提前退出或读取流程异常时，尝试取消后续读取，并在 finally 中释放锁。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span>* <span class="hljs-title function_">readChunks</span>(<span class="hljs-params">stream</span>) {
  <span class="hljs-keyword">const</span> reader = stream.<span class="hljs-title function_">getReader</span>();
  <span class="hljs-keyword">let</span> completed = <span class="hljs-literal">false</span>;

  <span class="hljs-keyword">try</span> {
    <span class="hljs-keyword">while</span> (<span class="hljs-literal">true</span>) {
      <span class="hljs-keyword">const</span> { done, value } = <span class="hljs-keyword">await</span> reader.<span class="hljs-title function_">read</span>();
      <span class="hljs-keyword">if</span> (done) {
        completed = <span class="hljs-literal">true</span>;
        <span class="hljs-keyword">return</span>;
      }
      <span class="hljs-keyword">yield</span> value;
    }
  } <span class="hljs-keyword">finally</span> {
    <span class="hljs-keyword">try</span> {
      <span class="hljs-keyword">if</span> (!completed) <span class="hljs-keyword">await</span> reader.<span class="hljs-title function_">cancel</span>();
    } <span class="hljs-keyword">finally</span> {
      reader.<span class="hljs-title function_">releaseLock</span>();
    }
  }
}

<span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">demonstrateStream</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">const</span> stream = <span class="hljs-keyword">new</span> <span class="hljs-title class_">ReadableStream</span>({
    <span class="hljs-title function_">start</span>(<span class="hljs-params">controller</span>) {
      controller.<span class="hljs-title function_">enqueue</span>(<span class="hljs-keyword">new</span> <span class="hljs-title class_">Uint8Array</span>([<span class="hljs-number">1</span>, <span class="hljs-number">2</span>]));
      controller.<span class="hljs-title function_">enqueue</span>(<span class="hljs-keyword">new</span> <span class="hljs-title class_">Uint8Array</span>([<span class="hljs-number">3</span>, <span class="hljs-number">4</span>]));
    },
    <span class="hljs-title function_">cancel</span>(<span class="hljs-params"></span>) {
      <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;数据源已取消&#x27;</span>);
    },
  });

  <span class="hljs-keyword">for</span> <span class="hljs-keyword">await</span> (<span class="hljs-keyword">const</span> chunk <span class="hljs-keyword">of</span> <span class="hljs-title function_">readChunks</span>(stream)) {
    <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>([...chunk].<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;,&#x27;</span>)); <span class="hljs-comment">// 1,2</span>
    <span class="hljs-keyword">break</span>;
  }
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(stream.<span class="hljs-property">locked</span>); <span class="hljs-comment">// false</span>
}

<span class="hljs-title function_">demonstrateStream</span>();
<span class="hljs-comment">// 完整输出顺序：1,2 → 数据源已取消 → false</span>
</code></pre></div>
<p>break 触发异步关闭，进入生成器 finally；循环等待这段清理结束后才继续，因此最后读取 stream.locked 为 false。</p>
<p>releaseLock 只是解除当前 reader 对流的占用，并不等于取消底层数据生产。这里显式调用 cancel，是因为包装器约定提前结束就不再需要后续数据。若调用者还希望把未消费部分交给其他 reader，就应选择不同的所有权和取消策略。</p>
<p>取消本身也可能失败，生产代码应决定如何记录清理错误，避免丢失主要错误上下文。内层 finally 确保即便取消 Promise 拒绝，也仍尝试释放锁。</p>
<h2>背压不是只要写 for await 就自动完整实现</h2>
<p>消费者一次请求一项，有助于表达按需获取，但生产者仍可能在内部预取多页、提前缓冲大量字节，甚至完全忽略需求不断推送。缓冲区大小、highWaterMark、拉取策略和外部服务行为，都会影响实际内存与吞吐。</p>
<p>示例中的流在 start 时就排入两块数据，说明队列中可以提前存在内容。网络流的一块字节也不保证恰好是一行文本、一个 JSON 对象或一条业务消息；解码和协议分帧仍需单独处理跨块边界。</p>
<p>消费者把所有结果 push 进数组，也会重新累积全部内存。若目标是流式处理，应尽可能及时处理或写出已经消费的数据，而不是最后才一次性汇总。</p>
<h2>关闭迭代器不保证立即打断正在等待的 next</h2>
<p>for await 的 break 要等执行进入循环体后才有机会发生。如果当前 next 一直等待底层请求，外部用户点击取消，不会自动使这段等待结束。async Generator 的 return 请求也可能排在尚未完成的操作之后，不能当成抢占式中断。</p>
<p>需要及时取消，应把 AbortSignal 或数据源自己的取消入口连接到那项等待，让它能够结束或拒绝。收到拒绝后再按生产者的 try/finally 收尾；服务端任务是否真的停止，又是另外的协议问题。</p>
<p>各条关闭路径的区别见《JavaScript 迭代器关闭和 return 方法有什么作用？》；生产者应对自己获取资源后的失败负责。</p>
<h2>同步迭代器也能被消费，但适配细节有边界</h2>
<p>for await...of 找不到 Symbol.asyncIterator 时，可以使用同步 Symbol.iterator 并进行异步适配。同步迭代器产出的 Promise 值会被等待，所以拿一个普通的 Promise 数组也能逐项得到兑现值。</p>
<p>这与“自定义异步迭代器的 value 无论嵌套多少层都自动解包”不是同一保证。自定义异步协议主要等待 next 返回的结果对象；应清楚定义 value 的类型，async Generator 的 yield 则有其等待语义。</p>
<p>同步生成器 yield 一个被拒绝的 Promise 时，关闭行为存在规范更新与运行时支持差异：当前 ECMAScript 异步适配算法安排在相关拒绝路径上关闭同步迭代器，但一些较旧实现可能没有执行同步生成器 finally。部分 Node.js 22 版本在这一场景下不会执行 finally，依赖该行为前应在目标运行时实测。</p>
<p>因此管理真实异步资源时，优先使用 async Generator 并在内部 await、try/finally 中明确处理失败，或对目标运行时单独验证清理路径，不要只看成功遍历例子就认定跨环境资源管理已经可靠。</p>
<p>补充参考：<a href="https://tc39.es/ecma262/multipage/control-abstraction-objects.html#sec-asyncfromsynciteratorcontinuation">ECMAScript · AsyncFromSyncIteratorContinuation</a>。</p>`};export{e as default};