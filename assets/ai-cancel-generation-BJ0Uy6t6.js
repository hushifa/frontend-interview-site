var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>不一定。用户点“停止”，其实涉及四层：前端不再显示新内容、浏览器中止到我们服务的请求、我们的服务端停止任务、服务端中止对模型服务商的请求。前一层停了，后一层不一定跟着停。</p>
<p>前端用 <code>AbortController</code> 中止 fetch，同时关掉写入界面的回调，这样迟到的数据也不会再显示出来。</p>
<p>服务端要把请求的取消信号传给调用模型的 SDK。如果生成是后台任务，用户关掉页面也要继续跑，就不能靠断连来取消，要单独提供一个按任务 ID 取消的接口。</p>
<p>停止以后，已经收到的文字要保留并标记为“中断”。生成过程中已经执行的工具操作，比如发出去的邮件，停止按钮是撤销不了的。</p>
</blockquote>
<h2>前端：中止请求，并关掉回调</h2>
<p>下面这个函数负责启动一次生成，并返回一个 <code>stop</code> 方法。注意看 <code>accepting</code> 这个变量。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">startGeneration</span>(<span class="hljs-params">run, onChunk</span>) {
  <span class="hljs-keyword">const</span> controller = <span class="hljs-keyword">new</span> <span class="hljs-title class_">AbortController</span>();
  <span class="hljs-keyword">let</span> accepting = <span class="hljs-literal">true</span>;

  <span class="hljs-keyword">const</span> done = <span class="hljs-title function_">run</span>({
    <span class="hljs-attr">signal</span>: controller.<span class="hljs-property">signal</span>,
    <span class="hljs-title function_">emit</span>(<span class="hljs-params">chunk</span>) {
      <span class="hljs-keyword">if</span> (accepting) <span class="hljs-title function_">onChunk</span>(chunk);
    },
  })
    .<span class="hljs-title function_">then</span>(<span class="hljs-function">() =&gt;</span> ({ <span class="hljs-attr">status</span>: <span class="hljs-string">&#x27;completed&#x27;</span> }))
    .<span class="hljs-title function_">catch</span>(<span class="hljs-function">(<span class="hljs-params">error</span>) =&gt;</span> {
      <span class="hljs-keyword">if</span> (controller.<span class="hljs-property">signal</span>.<span class="hljs-property">aborted</span>) <span class="hljs-keyword">return</span> { <span class="hljs-attr">status</span>: <span class="hljs-string">&#x27;stopped&#x27;</span> };
      <span class="hljs-keyword">throw</span> error; <span class="hljs-comment">// 真正的错误继续抛出</span>
    })
    .<span class="hljs-title function_">finally</span>(<span class="hljs-function">() =&gt;</span> {
      accepting = <span class="hljs-literal">false</span>;
    });

  <span class="hljs-keyword">return</span> {
    done,
    <span class="hljs-title function_">stop</span>(<span class="hljs-params"></span>) {
      accepting = <span class="hljs-literal">false</span>;
      controller.<span class="hljs-title function_">abort</span>();
    },
  };
}
</code></pre></div>
<p><code>controller.abort()</code> 会让 fetch 中止，这个好理解。那为什么还要一个 <code>accepting</code>？</p>
<p>因为我们没法保证底层代码一定响应 <code>signal</code>。有的库忽略了它，有的数据已经在路上，中止之后回调还可能被调用。<code>stop()</code> 先把 <code>accepting</code> 设成 <code>false</code>，之后不管还有什么数据进来，<code>emit</code> 都直接丢掉，界面不会再多出一个字。</p>
<p><code>catch</code> 里也做了区分：如果是我们自己中止的，返回 <code>stopped</code>；如果是网络错误这类真问题，继续往外抛，不能把它吞掉当成“用户停止”。</p>
<h2>服务端：取消信号要一路传下去</h2>
<p>浏览器中止 fetch 以后，服务端会看到连接断开。可是服务端代码如果没有监听这个信号，它对模型服务商的请求还会继续跑，token 照样生成、照样计费。所以服务端要拿到请求的取消信号，把它传给调用模型的 SDK。</p>
<p>中间如果隔着代理、边缘平台的缓冲或者任务队列，断连这件事可能根本传不到模型调用那一层。</p>
<p>还有一种产品设计是：用户关掉页面，任务继续跑，回来再看结果。这时断连就不能等于取消，要提供一个显式接口，比如 <code>POST /runs/:id/cancel</code>，返回 <code>cancelling</code>、<code>cancelled</code> 或 <code>completed</code>，让前端知道任务最后到底停没停。</p>
<p>另外要知道，服务商在收到中止之前已经生成的 token，通常仍然会计费。</p>
<h2>停止以后，数据怎么处理</h2>
<p>已经收到的文字要保留，消息记录里写明结束原因，比如用户停止、网络错误、服务端拒绝。这样刷新页面以后，它不会被显示成一条完整的回答。</p>
<p>用户停止后马上重试，新的生成要用新的请求 ID，旧请求迟到的回调直接丢弃，不然两次的内容会混在一起。</p>
<p>最容易被忽略的是工具调用。生成过程中如果已经发了邮件、写了文件，停止按钮撤销不了这些操作。能做的是：还没开始的步骤不再执行；正在进行的按调用 ID 去查真实结果；确实需要撤销时，调用业务自己的撤销接口。</p>
<h2>常见追问</h2>
<p><strong><code>reader.cancel()</code> 和 <code>controller.abort()</code> 有什么区别？</strong></p>
<blockquote>
<p><code>reader.cancel()</code> 是不再读取响应体；<code>abort()</code> 是中止整个 fetch，连还没开始的响应也一起中止。不过两者影响的都只是浏览器到我们服务端这一段连接，服务端后面的模型调用停不停，要看服务端有没有把信号传下去。</p>
</blockquote>
<p><strong>停止功能要测哪些情况？</strong></p>
<blockquote>
<p>至少要测这几种：第一个字出来之前就停止、流到一半停止、停止后马上重试、模型 SDK 不支持取消、停止时工具已经执行了。</p>
</blockquote>`};export{e as default};