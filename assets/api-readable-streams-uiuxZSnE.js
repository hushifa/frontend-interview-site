var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>导出一个很大的表格，或者接收 AI 一个字一个字吐出来的回答，不想等全部下载完再处理，就要直接读 <code>response.body</code>。它是一个 <code>ReadableStream&lt;Uint8Array&gt;</code>，数据到一块，就能处理一块。</p>
<p>读文本时，用 <code>pipeThrough(new TextDecoderStream())</code> 把字节解码成字符串。它能处理一个汉字被拆在两块之间的情况，自己用 <code>TextDecoder</code> 逐块解码就容易出乱码。</p>
<p>按行解析要注意，网络上的“块”和业务上的“行”没有关系，一块的结尾可能是半行。所以要把最后一段不完整的内容留下来，和下一块拼接。</p>
<p>还要注意释放。用 <code>AbortController</code> 取消 <code>fetch</code>，流会出错并停止；只读一部分就不读了，要调用 <code>reader.cancel()</code>，否则下载还在继续。</p>
</blockquote>
<h2>按行解析 NDJSON</h2>
<p>NDJSON 就是每行一个 JSON。下面写一个异步生成器，一行一行地吐出解析好的对象。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span>* <span class="hljs-title function_">readLines</span>(<span class="hljs-params">response</span>) {
  <span class="hljs-keyword">const</span> reader = response.<span class="hljs-property">body</span>.<span class="hljs-title function_">pipeThrough</span>(<span class="hljs-keyword">new</span> <span class="hljs-title class_">TextDecoderStream</span>()).<span class="hljs-title function_">getReader</span>();
  <span class="hljs-keyword">let</span> buffer = <span class="hljs-string">&#x27;&#x27;</span>;
  <span class="hljs-keyword">let</span> finished = <span class="hljs-literal">false</span>;
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
    finished = <span class="hljs-literal">true</span>;
  } <span class="hljs-keyword">finally</span> {
    <span class="hljs-comment">// 调用方提前 break 或解析出错时取消流，停止下载；releaseLock 本身不会取消</span>
    <span class="hljs-keyword">if</span> (!finished) <span class="hljs-keyword">await</span> reader.<span class="hljs-title function_">cancel</span>().<span class="hljs-title function_">catch</span>(<span class="hljs-function">() =&gt;</span> {});
    reader.<span class="hljs-title function_">releaseLock</span>();
  }
}

<span class="hljs-keyword">const</span> controller = <span class="hljs-keyword">new</span> <span class="hljs-title class_">AbortController</span>();
<span class="hljs-keyword">const</span> response = <span class="hljs-keyword">await</span> <span class="hljs-title function_">fetch</span>(<span class="hljs-string">&#x27;/api/export&#x27;</span>, { <span class="hljs-attr">signal</span>: controller.<span class="hljs-property">signal</span> });
<span class="hljs-keyword">if</span> (!response.<span class="hljs-property">ok</span>) <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">\`HTTP <span class="hljs-subst">\${response.status}</span>\`</span>);
<span class="hljs-keyword">for</span> <span class="hljs-keyword">await</span> (<span class="hljs-keyword">const</span> row <span class="hljs-keyword">of</span> <span class="hljs-title function_">readLines</span>(response)) <span class="hljs-title function_">appendRow</span>(row);
</code></pre></div>
<p>关键在 <code>buffer = lines.pop()</code> 这一句。用换行切开以后，最后一段后面没有换行，可能是半行，所以把它取出来留在 <code>buffer</code> 里，等下一块到了再拼上。</p>
<p>流结束时，<code>buffer</code> 里可能还剩最后一行，因为文件结尾不一定有换行，所以循环外还要再处理一次。</p>
<p>为什么要写 <code>finally</code>？调用方可能读到一半就 <code>break</code> 了，这时生成器的 <code>finally</code> 会执行。如果不 <code>cancel()</code>，只 <code>releaseLock()</code>，读取锁是释放了，但下载还在继续。</p>
<h2>为什么要用 TextDecoderStream 解码</h2>
<p>一个汉字在 UTF-8 里占 3 个字节，网络分块时可能前 2 个字节在这一块、第 3 个字节在下一块。下面在 Node 里模拟一下：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> bytes = <span class="hljs-keyword">new</span> <span class="hljs-title class_">TextEncoder</span>().<span class="hljs-title function_">encode</span>(<span class="hljs-string">&#x27;中&#x27;</span>);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-keyword">new</span> <span class="hljs-title class_">TextDecoder</span>().<span class="hljs-title function_">decode</span>(bytes.<span class="hljs-title function_">slice</span>(<span class="hljs-number">0</span>, <span class="hljs-number">2</span>))); <span class="hljs-comment">// �</span>

<span class="hljs-keyword">const</span> stream = <span class="hljs-keyword">new</span> <span class="hljs-title class_">ReadableStream</span>({
  <span class="hljs-title function_">start</span>(<span class="hljs-params">controller</span>) {
    controller.<span class="hljs-title function_">enqueue</span>(bytes.<span class="hljs-title function_">slice</span>(<span class="hljs-number">0</span>, <span class="hljs-number">2</span>));
    controller.<span class="hljs-title function_">enqueue</span>(bytes.<span class="hljs-title function_">slice</span>(<span class="hljs-number">2</span>));
    controller.<span class="hljs-title function_">close</span>();
  },
}).<span class="hljs-title function_">pipeThrough</span>(<span class="hljs-keyword">new</span> <span class="hljs-title class_">TextDecoderStream</span>());

<span class="hljs-keyword">let</span> text = <span class="hljs-string">&#x27;&#x27;</span>;
<span class="hljs-keyword">for</span> <span class="hljs-keyword">await</span> (<span class="hljs-keyword">const</span> chunk <span class="hljs-keyword">of</span> stream) text += chunk;
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(text); <span class="hljs-comment">// 中</span>
</code></pre></div>
<p>只拿前 2 个字节单独解码，得到的是替换字符 �，也就是乱码。<code>TextDecoderStream</code> 会把不完整的字节先留着，等下一块到了拼完整再输出，所以结果是正确的“中”。</p>
<p>这个例子最后也用了 <code>for await</code>，支持异步迭代的环境可以直接这样遍历流。</p>
<h2>其他读取方式</h2>
<p>如果不需要逐块处理，直接用 <code>response.text()</code> 或 <code>response.json()</code> 更简单。</p>
<p>想显示下载进度，可以累加每块的 <code>value.byteLength</code>，和响应头的 <code>Content-Length</code> 比较。但响应被压缩时，<code>Content-Length</code> 是压缩后的大小，而读到的是解压后的字节数，两个数对不上，算出来的进度不准，可能超过 100%。</p>
<h2>常见追问</h2>
<p><strong>一个流能读两次吗？</strong></p>
<blockquote>
<p>不能。开始读的时候流就被锁定了。需要两份时用 <code>tee()</code>，代价见<a href="/questions/api-readable-streams-tee/">《ReadableStream 的 tee 分流有什么代价？》</a>。</p>
</blockquote>
<p><strong>SSE 能用这种方式解析吗？</strong></p>
<blockquote>
<p>可以，按空行分隔事件就行。不过 SSE 还有 <code>data:</code>、<code>id:</code> 和重连这些字段，更推荐用成熟的解析库处理。</p>
</blockquote>`};export{e as default};