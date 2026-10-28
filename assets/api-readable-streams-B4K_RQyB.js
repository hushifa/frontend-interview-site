var e={answerHtml:`<h2>简答</h2>
<ul>
<li>Fetch 响应的 body 是 ReadableStream，可以用 reader.read() 逐块读取 value 和 done。</li>
<li>取得 reader 会锁定流，取消和释放锁是两件事。</li>
<li>文本要用 TextDecoder 按流式模式解码，文本片段还不是完整的协议消息。</li>
<li>背压和并发消费要明确设计。</li>
</ul>
<p>fetch 返回 Response 时，响应体不一定已经全部下载完。response.body 可以作为 ReadableStream 持续提供字节块，让应用边接收边处理，而不是先把全部内容放进内存。</p>
<p>逐块消费并不代表“每个块是一条消息”。网络、解压和浏览器缓冲决定分块位置，业务协议还需要自己的解码与边界处理。</p>
<h2>一个安全消费 UTF-8 文本的基础循环</h2>
<p>下面的 onText 是处理已解码文本片段的回调，可以返回 Promise；示例假设响应使用 UTF-8，并限制累计消费字节数：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">consumeText</span>(<span class="hljs-params">response, onText, maxBytes = <span class="hljs-number">1024</span> * <span class="hljs-number">1024</span></span>) {
  <span class="hljs-keyword">if</span> (!<span class="hljs-title class_">Number</span>.<span class="hljs-title function_">isSafeInteger</span>(maxBytes) || maxBytes &lt; <span class="hljs-number">0</span>) {
    <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">RangeError</span>(<span class="hljs-string">&#x27;字节上限必须是非负安全整数&#x27;</span>);
  }
  <span class="hljs-keyword">if</span> (!response.<span class="hljs-property">ok</span>) {
    <span class="hljs-keyword">await</span> response.<span class="hljs-property">body</span>?.<span class="hljs-title function_">cancel</span>();
    <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">\`请求失败：<span class="hljs-subst">\${response.status}</span>\`</span>);
  }
  <span class="hljs-keyword">if</span> (!response.<span class="hljs-property">body</span>) <span class="hljs-keyword">return</span>;

  <span class="hljs-keyword">const</span> reader = response.<span class="hljs-property">body</span>.<span class="hljs-title function_">getReader</span>();
  <span class="hljs-keyword">const</span> decoder = <span class="hljs-keyword">new</span> <span class="hljs-title class_">TextDecoder</span>(<span class="hljs-string">&#x27;utf-8&#x27;</span>, { <span class="hljs-attr">fatal</span>: <span class="hljs-literal">true</span> });
  <span class="hljs-keyword">let</span> bytes = <span class="hljs-number">0</span>;
  <span class="hljs-keyword">let</span> completed = <span class="hljs-literal">false</span>;
  <span class="hljs-keyword">try</span> {
    <span class="hljs-keyword">while</span> (<span class="hljs-literal">true</span>) {
      <span class="hljs-keyword">const</span> { value, done } = <span class="hljs-keyword">await</span> reader.<span class="hljs-title function_">read</span>();
      <span class="hljs-keyword">if</span> (done) {
        <span class="hljs-keyword">const</span> tail = decoder.<span class="hljs-title function_">decode</span>();
        <span class="hljs-keyword">if</span> (tail) <span class="hljs-keyword">await</span> <span class="hljs-title function_">onText</span>(tail);
        completed = <span class="hljs-literal">true</span>;
        <span class="hljs-keyword">break</span>;
      }
      bytes += value.<span class="hljs-property">byteLength</span>;
      <span class="hljs-keyword">if</span> (bytes &gt; maxBytes) <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">&#x27;响应体超出读取上限&#x27;</span>);
      <span class="hljs-keyword">const</span> text = decoder.<span class="hljs-title function_">decode</span>(value, { <span class="hljs-attr">stream</span>: <span class="hljs-literal">true</span> });
      <span class="hljs-keyword">if</span> (text) <span class="hljs-keyword">await</span> <span class="hljs-title function_">onText</span>(text);
    }
  } <span class="hljs-keyword">finally</span> {
    <span class="hljs-keyword">try</span> {
      <span class="hljs-keyword">if</span> (!completed) <span class="hljs-keyword">await</span> reader.<span class="hljs-title function_">cancel</span>();
    } <span class="hljs-keyword">finally</span> {
      reader.<span class="hljs-title function_">releaseLock</span>();
    }
  }
}
</code></pre></div>
<p>stream: true 让解码器保留跨块的不完整字符，最后无参数 decode 完成收尾。fatal: true 使非法编码抛错；若业务选择容忍坏数据，可以使用替换字符策略，但要明确取舍。</p>
<p>maxBytes 限制的是消费到的响应体字节，不是精确的线上压缩传输量，也不是整个进程内存上限。已经收到的单个块仍占内存，onText 自己若无限累积全部字符串，也会重新造成全量占用。</p>
<h2>reader 锁与取消是两件事</h2>
<p>getReader 会锁定流。持有锁时，不能再同时 response.text 或让另一个 reader 消费同一 body。响应体被消费后，也不能随意从头再读。</p>
<p>releaseLock 只是释放读取器对流的占有，不表示终止底层数据源。仍有未完成 read 时释放锁会使这些读取拒绝，未消费数据也不因此自动被清空。若不再需要结果，应调用 reader.cancel 或取消相关请求，再释放锁。</p>
<p>示例在异常时取消剩余读取，包括字节超限、解码失败或 onText 抛错。清理自身也可能失败，正式业务可以进一步保留原始异常与清理异常，避免丢失诊断信息。</p>
<h2>文本片段还不是协议消息</h2>
<p>一条 JSON 可能跨两个文本片段，也可能一个片段包含多条消息。NDJSON 通常需要保留未完成的一行；SSE 还涉及空行分隔、多个 data 字段、CRLF 等协议规则。</p>
<p>因此不能对每个 value 直接 JSON.parse，也不能只用一次 split 后丢掉末尾残片。应采用经过验证的协议解析器，并设置单条消息或残片长度上限，避免对方一直不发送分隔符导致内存增长。</p>
<p>TextDecoderStream 可以把字节流转换成文本流，但它同样不负责解析 JSON、SSE 或业务事件。</p>
<h2>背压与并发消费需要明确</h2>
<p>示例 await onText 后再继续 read，让下游处理速度影响消费节奏。若每次 onText 都启动异步任务却不等待，可能很快堆积大量未完成工作。</p>
<p>ReadableStream 可以通过 pipeThrough、pipeTo 组合转换与目标流，但取消、错误传播和信号仍需按管道语义配置。clone 或 tee 将数据分成多个消费者时，较慢分支可能产生额外缓冲，不应把它当作没有内存成本的复制。</p>
<p>选择流的依据是能否增量处理和控制缓冲。若最终仍必须拿到全部小型 JSON，response.json 更简单；若需要长连接、渐进展示或大文件处理，就需要完整考虑消息边界、取消与错误收尾。</p>`};export{e as default};