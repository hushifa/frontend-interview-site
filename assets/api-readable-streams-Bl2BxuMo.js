var e={answerHtml:`<h2>简答</h2>
<ul>
<li><code>response.body</code> 是 <code>ReadableStream&lt;Uint8Array&gt;</code>，数据到一块就能处理一块，不必等整个响应下载完。</li>
<li>文本流用 <code>pipeThrough(new TextDecoderStream())</code> 解码，多字节字符被拆在两块之间也能正确处理。</li>
<li>块的边界和业务上的&quot;行&quot;或&quot;消息&quot;无关，解析时要把最后一段不完整的数据留到下一块拼接。</li>
<li>用 <code>AbortController</code> 取消 <code>fetch</code>，流会随之出错并停止；只读部分数据时要调用 <code>reader.cancel()</code> 释放连接。</li>
</ul>
<h2>按行解析 NDJSON</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span>* <span class="hljs-title function_">readLines</span>(<span class="hljs-params">response</span>) {
  <span class="hljs-keyword">const</span> reader = response.<span class="hljs-property">body</span>.<span class="hljs-title function_">pipeThrough</span>(<span class="hljs-keyword">new</span> <span class="hljs-title class_">TextDecoderStream</span>()).<span class="hljs-title function_">getReader</span>();
  <span class="hljs-keyword">let</span> buffer = <span class="hljs-string">&#x27;&#x27;</span>;
  <span class="hljs-keyword">try</span> {
    <span class="hljs-keyword">while</span> (<span class="hljs-literal">true</span>) {
      <span class="hljs-keyword">const</span> { value, done } = <span class="hljs-keyword">await</span> reader.<span class="hljs-title function_">read</span>();
      <span class="hljs-keyword">if</span> (done) <span class="hljs-keyword">break</span>;
      buffer += value;
      <span class="hljs-keyword">const</span> lines = buffer.<span class="hljs-title function_">split</span>(<span class="hljs-string">&#x27;\\n&#x27;</span>);
      buffer = lines.<span class="hljs-title function_">pop</span>();
      <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> line <span class="hljs-keyword">of</span> lines) <span class="hljs-keyword">if</span> (line.<span class="hljs-title function_">trim</span>()) <span class="hljs-keyword">yield</span> <span class="hljs-title class_">JSON</span>.<span class="hljs-title function_">parse</span>(line);
    }
    <span class="hljs-keyword">if</span> (buffer.<span class="hljs-title function_">trim</span>()) <span class="hljs-keyword">yield</span> <span class="hljs-title class_">JSON</span>.<span class="hljs-title function_">parse</span>(buffer);
  } <span class="hljs-keyword">finally</span> {
    reader.<span class="hljs-title function_">releaseLock</span>();
  }
}

<span class="hljs-keyword">const</span> controller = <span class="hljs-keyword">new</span> <span class="hljs-title class_">AbortController</span>();
<span class="hljs-keyword">const</span> response = <span class="hljs-keyword">await</span> <span class="hljs-title function_">fetch</span>(<span class="hljs-string">&#x27;/api/export&#x27;</span>, { <span class="hljs-attr">signal</span>: controller.<span class="hljs-property">signal</span> });
<span class="hljs-keyword">if</span> (!response.<span class="hljs-property">ok</span>) <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">\`HTTP <span class="hljs-subst">\${response.status}</span>\`</span>);
<span class="hljs-keyword">for</span> <span class="hljs-keyword">await</span> (<span class="hljs-keyword">const</span> row <span class="hljs-keyword">of</span> <span class="hljs-title function_">readLines</span>(response)) <span class="hljs-title function_">appendRow</span>(row);
</code></pre></div>
<ul>
<li><code>lines.pop()</code> 取出最后一段可能不完整的内容，留在 <code>buffer</code> 里。</li>
<li>流结束后处理没有换行结尾的最后一行。</li>
<li>消费方提前 <code>break</code> 时，生成器的 <code>finally</code> 会执行，释放读取锁。</li>
</ul>
<h2>其他读取方式</h2>
<ul>
<li>不需要逐块处理时，直接 <code>response.text()</code> 或 <code>response.json()</code> 更简单。</li>
<li>显示下载进度：读取每块的 <code>value.byteLength</code> 累加，和 <code>Content-Length</code> 比较。响应被压缩时，<code>Content-Length</code> 是压缩后的大小，与读到的字节数不一致。</li>
<li>支持异步迭代的环境可以直接 <code>for await (const chunk of stream)</code>。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li>一个流能读两次吗：不能，读取时会被锁定。需要两份时用 <code>tee()</code>，见《ReadableStream 的 tee 分流有什么代价？》。</li>
<li>SSE 能这样解析吗：可以，按空行分隔事件，但更推荐用成熟的解析库处理 <code>data:</code>、<code>id:</code> 和重连字段。</li>
</ul>`};export{e as default};