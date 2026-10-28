var e={answerHtml:`<h2>简答</h2>
<ul>
<li>停止有四层：前端停止显示、中止浏览器到自己服务的请求、服务端停止任务、服务端中止对模型服务商的请求。前一层停了，后一层不一定停。</li>
<li>前端用 <code>AbortController</code> 中止 fetch，同时关闭结果回调，让迟到的数据不再写进界面。</li>
<li>服务端要把请求的取消信号传给模型 SDK；生成已经转成后台任务时，需要一个按任务 ID 取消的接口。</li>
<li>停止后保留已收到的文字并标记为中断；已经执行的工具调用要按调用 ID 查询真实状态，停止按钮不能回滚它们。</li>
</ul>
<h2>前端：中止请求并关闭回调</h2>
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
<p><code>accepting</code> 保证即使底层代码不响应 <code>signal</code>，旧结果也不会继续追加到界面。</p>
<h2>服务端：把取消传下去</h2>
<ul>
<li>浏览器中止 fetch 后，服务端会看到连接关闭。服务端代码要监听请求的取消信号，并把它传给调用模型的 SDK。</li>
<li>中间有代理、边缘平台缓冲或任务队列时，断连可能传不到模型调用这一层。</li>
<li>有的产品希望关掉页面后任务继续跑，用户回来再看。这时断连不应等于取消，而要提供 <code>POST /runs/:id/cancel</code> 这样的显式接口，返回 <code>cancelling</code>、<code>cancelled</code> 或 <code>completed</code>。</li>
</ul>
<p>服务商在收到中止前已经生成的 token 通常仍会计费。</p>
<h2>停止之后的数据</h2>
<ul>
<li>已收到的文字保留，消息记录里写明结束原因（用户停止、网络错误、服务端拒绝），刷新后不显示成完整回答。</li>
<li>下一次生成用新的请求 ID，旧请求的迟到回调直接丢弃。</li>
<li>生成过程中已经发出的工具调用（发邮件、写文件）不会被撤销。只能阻止还没开始的步骤，进行中的按调用 ID 查询结果，需要撤销时调用业务的撤销接口。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li><strong><code>reader.cancel()</code> 和 <code>controller.abort()</code> 有什么区别？</strong> <code>reader.cancel()</code> 取消对响应体的读取；<code>abort()</code> 中止整个 fetch，包括还没开始的响应。两者都只影响浏览器到服务端这一段连接。</li>
<li><strong>测试哪些情况？</strong> 首字前停止、流中停止、停止后立即重试、模型 SDK 不支持取消、工具已经执行。</li>
</ul>`};export{e as default};