var e={answerHtml:`<h2>简答</h2>
<ul>
<li>流按块读写，同一时刻只在内存里保留缓冲区中的若干块，适合大文件、网络响应和压缩这类数据量不可控的场景。</li>
<li>背压是写入端处理不过来时让上游暂停的机制：<code>write()</code> 返回 <code>false</code> 表示缓冲区已超过 <code>highWaterMark</code>，应等 <code>drain</code> 事件再继续写。</li>
<li><code>stream.pipeline</code> 自动处理背压，任一环节出错时会销毁链路上的所有流并把错误交给调用方。</li>
<li>可读流支持 <code>for await...of</code> 逐块消费，循环体里的 <code>await</code> 本身就形成背压。</li>
</ul>
<h2>一次性读取的问题</h2>
<p><code>fs.readFile</code> 会把整个文件放进一个 Buffer。文件有几个 GB 时，进程内存随之上涨，还可能超过 Buffer 的长度上限；请求并发时问题会成倍放大。流把读取拆成默认 64KB（文件流）的块，处理完一块再读下一块，内存占用和文件大小基本无关。</p>
<h2>背压怎样发生</h2>
<p>写入目标（磁盘、网络、压缩）通常比读取慢。如果不管写入端的状态一直往里写，数据就会堆在可写流的内部缓冲区里，效果和一次性读入差不多。</p>
<p>可写流用 <code>write()</code> 的返回值通知上游：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">writeMany</span>(<span class="hljs-params">writable, chunks</span>) {
  <span class="hljs-keyword">let</span> index = <span class="hljs-number">0</span>;
  <span class="hljs-keyword">function</span> <span class="hljs-title function_">writeNext</span>(<span class="hljs-params"></span>) {
    <span class="hljs-keyword">while</span> (index &lt; chunks.<span class="hljs-property">length</span>) {
      <span class="hljs-keyword">const</span> ok = writable.<span class="hljs-title function_">write</span>(chunks[index++]);
      <span class="hljs-keyword">if</span> (!ok) {
        writable.<span class="hljs-title function_">once</span>(<span class="hljs-string">&#x27;drain&#x27;</span>, writeNext);
        <span class="hljs-keyword">return</span>;
      }
    }
    writable.<span class="hljs-title function_">end</span>();
  }
  <span class="hljs-title function_">writeNext</span>();
}
</code></pre></div>
<p><code>false</code> 不代表写入失败，这块数据已经进入缓冲区；它只是要求调用方暂停，等 <code>drain</code> 后再写。</p>
<h2>用 pipeline 连接</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">import</span> { createReadStream, createWriteStream } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;node:fs&#x27;</span>;
<span class="hljs-keyword">import</span> { <span class="hljs-title class_">Transform</span> } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;node:stream&#x27;</span>;
<span class="hljs-keyword">import</span> { pipeline } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;node:stream/promises&#x27;</span>;
<span class="hljs-keyword">import</span> { createGzip } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;node:zlib&#x27;</span>;

<span class="hljs-keyword">const</span> upper = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Transform</span>({
  <span class="hljs-title function_">transform</span>(<span class="hljs-params">chunk, _encoding, callback</span>) {
    <span class="hljs-title function_">callback</span>(<span class="hljs-literal">null</span>, chunk.<span class="hljs-title function_">toString</span>().<span class="hljs-title function_">toUpperCase</span>());
  },
});

<span class="hljs-keyword">await</span> <span class="hljs-title function_">pipeline</span>(
  <span class="hljs-title function_">createReadStream</span>(<span class="hljs-string">&#x27;in.txt&#x27;</span>),
  upper,
  <span class="hljs-title function_">createGzip</span>(),
  <span class="hljs-title function_">createWriteStream</span>(<span class="hljs-string">&#x27;out.gz&#x27;</span>),
);
</code></pre></div>
<p><code>pipeline</code> 做了三件事：下游缓冲区满时暂停上游；任一流出错时销毁其余流，避免文件句柄泄漏；全部完成或出错时让 Promise 结束。旧写法 <code>a.pipe(b).pipe(c)</code> 能传递背压，但不会传播错误，中间某个流出错时其他流不会被关闭。</p>
<p>上面的 Transform 直接对块调用 <code>toString()</code>，多字节 UTF-8 字符恰好被切在块边界时会出现乱码。处理文本时应给可读流设置 <code>encoding</code>，或使用 <code>string_decoder</code>。</p>
<h2>用异步迭代消费</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">let</span> lines = <span class="hljs-number">0</span>;
<span class="hljs-keyword">for</span> <span class="hljs-keyword">await</span> (<span class="hljs-keyword">const</span> chunk <span class="hljs-keyword">of</span> <span class="hljs-title function_">createReadStream</span>(<span class="hljs-string">&#x27;in.txt&#x27;</span>, { <span class="hljs-attr">encoding</span>: <span class="hljs-string">&#x27;utf8&#x27;</span> })) {
  lines += chunk.<span class="hljs-title function_">split</span>(<span class="hljs-string">&#x27;\\n&#x27;</span>).<span class="hljs-property">length</span> - <span class="hljs-number">1</span>;
}
</code></pre></div>
<p>循环体在 <code>await</code> 时不会读取下一块，所以这种写法天然带背压。循环中途 <code>break</code> 或抛错时，流会被销毁。</p>
<h2>常见追问</h2>
<ul>
<li><strong>HTTP 响应也是流吗？</strong> 是。<code>http.ServerResponse</code> 是可写流，<code>IncomingMessage</code> 是可读流，可以直接放进 <code>pipeline</code>。</li>
<li><strong>highWaterMark 是硬上限吗？</strong> 不是。它是 <code>write()</code> 开始返回 <code>false</code> 的阈值，不理会返回值继续写，缓冲区会超过它。</li>
<li><strong>Web Streams 和 Node 流怎么转换？</strong> 用 <code>Readable.fromWeb()</code>、<code>Readable.toWeb()</code> 等方法；<code>fetch</code> 返回的 <code>response.body</code> 是 Web ReadableStream。</li>
</ul>`};export{e as default};