var e={answerHtml:`<h2>简答</h2>
<ul>
<li>网络可以把一条事件拆成多块，也可以把多条事件合成一块；一个中文字符或 emoji 也可能被拆在两块之间。</li>
<li>解析分三层：字节解码成字符（<code>TextDecoder</code> 加 <code>stream: true</code>），字符按 SSE 规则分成事件，事件的 <code>data</code> 再解析成 JSON。</li>
<li>SSE 支持 LF 和 CRLF 换行、多行 <code>data</code>、注释行，只用 <code>split(&#x27;\\n\\n&#x27;)</code> 会漏掉这些情况，用成熟的解析器更可靠。</li>
<li>连接结束不等于生成完成，要以协议里的结束事件为准；没有结束事件就当作截断处理。</li>
</ul>
<h2>一个可用的读取函数</h2>
<p>下面用 eventsource-parser 4.x 的 <code>createParser({ onEvent })</code> 处理 SSE 分帧。示例约定服务端最后发送 <code>[DONE]</code> 作为结束标记，这是本例的协议，不同服务商的结束方式不同。</p>
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
<ul>
<li><code>decoder.decode(value, { stream: true })</code> 会把被截断的多字节字符留到下一块再输出。</li>
<li>解析或回调出错时调用 <code>reader.cancel()</code> 关闭底层流；<code>releaseLock()</code> 只解除读取器绑定，不会关闭连接。</li>
<li>生产环境还要限制单个事件和总字节数，防止异常流耗尽内存。</li>
</ul>
<h2>事件按类型和 ID 分别累积</h2>
<p>一条 AI 流里通常混有文本增量、工具调用参数、引用、错误和结束事件。</p>
<ul>
<li>文本增量按消息 ID 和片段 ID 追加。</li>
<li>工具参数按调用 ID 累积，完整并通过 Schema 校验之前不执行。半截 JSON 即使恰好能解析也不算完成。</li>
<li>错误事件到达后，这次生成标记为失败，不再追加文本。</li>
</ul>
<p>使用 AI SDK 这类库时，要用和服务端协议版本匹配的解码器，不要混用不同服务商的事件格式。</p>
<h2>测试</h2>
<p>把同一段流在任意字节位置切开再喂给解析器，覆盖：emoji 被切断、CRLF 换行、多行 <code>data</code>、多条事件在同一块、非法 JSON、只有半条事件就断开。只在本地&quot;一次写出、一次读到&quot;的环境测试，会掩盖这些问题。</p>
<h2>常见追问</h2>
<ul>
<li><strong>为什么不直接用 <code>EventSource</code>？</strong> <code>EventSource</code> 只支持 GET，不能自定义请求头和请求体，AI 接口通常要 POST 并带认证头，所以多用 fetch 自己解析。代价是要自己处理重连。</li>
<li><strong>停止和断线怎么处理？</strong> 见《点击“停止生成”后，服务端一定停止调用模型吗？》和&quot;AI 流式输出断线后，怎样恢复同一条生成任务？&quot;。</li>
</ul>`};export{e as default};