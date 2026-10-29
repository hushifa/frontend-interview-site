var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>因为网络切块的位置是随机的。一条事件可能被拆成好几块，好几条事件也可能挤在一块里，连一个中文字或 emoji 都可能被拆在两块之间。拿一块去 <code>JSON.parse</code>，经常是半截 JSON，直接报错。</p>
<p>正确的做法分三层：先把字节解码成文字，用 <code>TextDecoder</code> 并加上 <code>stream: true</code>；再按 SSE 的规则把文字切成一条条事件；最后把每条事件的 <code>data</code> 解析成 JSON。</p>
<p>切事件这一步，不要只用 <code>split(&#x27;\\n\\n&#x27;)</code>。SSE 支持 LF 和 CRLF 两种换行、一条事件多行 <code>data</code>、还有注释行，用成熟的解析器更可靠。</p>
<p>还要注意，连接结束不等于生成完成。要以协议里的结束事件为准，没收到结束事件就当作被截断了。</p>
</blockquote>
<h2>为什么一块不对应一个字</h2>
<p>网络传输的是字节，常用汉字在 UTF-8 里占 3 个字节，常见的 emoji 占 4 个。网络完全可能在一个字的中间切开，比如前 2 个字节在这一块，最后 1 个在下一块。</p>
<p>如果每块单独解码，半个字会变成乱码。<code>TextDecoder</code> 加上 <code>{ stream: true }</code> 以后，它会把不完整的字节先留着，等下一块来了拼上再输出。</p>
<h2>一个可用的读取函数</h2>
<p>下面用 eventsource-parser 4.x 的 <code>createParser({ onEvent })</code> 来切分 SSE 事件。这个例子约定服务端最后发一个 <code>[DONE]</code> 表示结束。这只是本例的约定，不同服务商的结束方式不一样。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">import</span> { createParser } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;eventsource-parser&#x27;</span>;

<span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">consume</span>(<span class="hljs-params">response, onEvent</span>) {
  <span class="hljs-keyword">if</span> (!response.<span class="hljs-property">ok</span> || !response.<span class="hljs-property">body</span>) <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">&#x27;流不可用&#x27;</span>);
  <span class="hljs-keyword">const</span> reader = response.<span class="hljs-property">body</span>.<span class="hljs-title function_">getReader</span>();
  <span class="hljs-keyword">const</span> decoder = <span class="hljs-keyword">new</span> <span class="hljs-title class_">TextDecoder</span>(<span class="hljs-string">&#x27;utf-8&#x27;</span>, { <span class="hljs-attr">fatal</span>: <span class="hljs-literal">true</span> });
  <span class="hljs-keyword">let</span> completed = <span class="hljs-literal">false</span>;

  <span class="hljs-keyword">const</span> parser = <span class="hljs-title function_">createParser</span>({
    <span class="hljs-title function_">onEvent</span>(<span class="hljs-params">event</span>) {
      <span class="hljs-keyword">if</span> (completed) <span class="hljs-keyword">return</span>;
      <span class="hljs-keyword">if</span> (event.<span class="hljs-property">data</span> === <span class="hljs-string">&#x27;[DONE]&#x27;</span>) {
        completed = <span class="hljs-literal">true</span>;
        <span class="hljs-title function_">onEvent</span>({ <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;done&#x27;</span> });
        <span class="hljs-keyword">return</span>;
      }
      <span class="hljs-title function_">onEvent</span>({ <span class="hljs-attr">id</span>: event.<span class="hljs-property">id</span>, <span class="hljs-attr">event</span>: event.<span class="hljs-property">event</span>, <span class="hljs-attr">value</span>: <span class="hljs-title class_">JSON</span>.<span class="hljs-title function_">parse</span>(event.<span class="hljs-property">data</span>) });
    },
  });

  <span class="hljs-keyword">try</span> {
    <span class="hljs-keyword">while</span> (!completed) {
      <span class="hljs-keyword">const</span> { value, done } = <span class="hljs-keyword">await</span> reader.<span class="hljs-title function_">read</span>();
      <span class="hljs-keyword">if</span> (done) {
        parser.<span class="hljs-title function_">feed</span>(decoder.<span class="hljs-title function_">decode</span>()); <span class="hljs-comment">// 冲刷解码器里剩余的字节</span>
        <span class="hljs-keyword">if</span> (!completed) <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">&#x27;连接结束但没有收到结束标记&#x27;</span>);
        <span class="hljs-keyword">break</span>;
      }
      parser.<span class="hljs-title function_">feed</span>(decoder.<span class="hljs-title function_">decode</span>(value, { <span class="hljs-attr">stream</span>: <span class="hljs-literal">true</span> }));
    }
    <span class="hljs-keyword">await</span> reader.<span class="hljs-title function_">cancel</span>(); <span class="hljs-comment">// 收到结束标记后丢弃剩余字节</span>
  } <span class="hljs-keyword">catch</span> (error) {
    <span class="hljs-keyword">await</span> reader.<span class="hljs-title function_">cancel</span>(error).<span class="hljs-title function_">catch</span>(<span class="hljs-function">() =&gt;</span> {});
    <span class="hljs-keyword">throw</span> error;
  } <span class="hljs-keyword">finally</span> {
    reader.<span class="hljs-title function_">releaseLock</span>();
  }
}
</code></pre></div>
<p><code>parser.feed</code> 可以接收任意长度的文字，它会自己攒着，攒够一条完整事件才调用 <code>onEvent</code>。所以 <code>JSON.parse</code> 拿到的一定是一条完整事件的 <code>data</code>。</p>
<p>读到 <code>done</code> 时还调了一次不带参数的 <code>decoder.decode()</code>，这是为了把解码器里剩下的字节吐出来。之后如果还没收到 <code>[DONE]</code>，说明连接是中途断掉的，要当成错误。</p>
<p>出错时调用的是 <code>reader.cancel()</code>，它会关闭底层的流。<code>finally</code> 里的 <code>releaseLock()</code> 只是解除读取器和流的绑定，不会关闭连接，两者不能互相替代。</p>
<p>生产环境还要限制单条事件和总字节数，防止异常的流把内存吃光。</p>
<h2>不同类型的事件怎么累积</h2>
<p>一条 AI 流里通常混着文字增量、工具调用参数、引用、错误和结束事件，要分开处理。</p>
<p>文字增量按消息 ID 和片段 ID 追加。工具参数按调用 ID 累积，要等参数完整、并且通过 Schema 校验以后才能执行。半截 JSON 就算碰巧能解析，也不算完成，比如 <code>{&quot;count&quot;: 1</code> 后面可能还有 <code>0}</code>。错误事件一到，这次生成就标成失败，后面不再追加文字。</p>
<p>用 AI SDK 这类库时，解码器要和服务端的协议版本对上，不要混用不同服务商的事件格式。</p>
<h2>怎么测试</h2>
<p>把同一段流在任意字节位置切开，再喂给解析器。至少覆盖这些情况：emoji 被切断、CRLF 换行、多行 <code>data</code>、多条事件挤在同一块、非法 JSON、只来了半条事件就断开。</p>
<p>只在本地测是不够的。本地服务器往往一次写出、浏览器一次读到，这些切块问题根本不会出现。</p>
<h2>常见追问</h2>
<p><strong>为什么不直接用 <code>EventSource</code>？</strong></p>
<blockquote>
<p><code>EventSource</code> 只支持 GET，不能自定义请求头和请求体。AI 接口一般要用 POST，还要带认证头，所以多数是用 fetch 自己解析。代价是断线重连也要自己处理。</p>
</blockquote>
<p><strong>停止和断线怎么处理？</strong></p>
<blockquote>
<p>停止见<a href="/questions/ai-cancel-generation/">《点击“停止生成”后，服务端一定停止调用模型吗？》</a>，断线恢复见<a href="/questions/ai-stream-recovery/">《AI 流式输出断线后，怎样恢复同一条生成任务？》</a>。</p>
</blockquote>`};export{e as default};