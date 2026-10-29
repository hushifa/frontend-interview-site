var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>读一个几 GB 的文件，如果用 <code>fs.readFile</code> 一次读进来，内存就跟着涨几 GB。流的做法是一小块一小块地读，处理完一块再读下一块，内存里只留缓冲区里的那几块。所以大文件、网络响应、压缩这类数据量说不准的场景，都适合用流。</p>
<p>可是写入往往比读取慢，读得快写得慢，数据就会堆在中间。背压就是写入端处理不过来时让上游先停一停：<code>write()</code> 返回 <code>false</code>，表示缓冲区已经超过 <code>highWaterMark</code>，这时应该等 <code>drain</code> 事件再继续写。</p>
<p>实际写代码时用 <code>stream.pipeline</code> 把流串起来，它自动处理背压；任何一个环节出错，它会把链路上所有流都销毁，再把错误交给调用方。</p>
<p>另外，可读流也可以用 <code>for await...of</code> 一块块地消费，循环体里的 <code>await</code> 本身就起到了背压的作用。</p>
</blockquote>
<h2>一次性读取有什么问题</h2>
<p><code>fs.readFile</code> 会把整个文件放进一个 Buffer。文件有几个 GB 时，进程内存随之上涨，还可能超过 Buffer 的长度上限；如果多个请求同时这样读，问题会成倍放大。</p>
<p>流把读取拆成块，文件流默认每块 64KB，处理完一块再读下一块。这样内存占用基本和文件大小无关。</p>
<h2>背压是怎么发生的</h2>
<p>写入目标（磁盘、网络、压缩）通常比读取慢。如果不管写入端的状态一直往里写，数据就会堆在可写流的内部缓冲区里，效果和一次性读入差不多。</p>
<p>所以可写流用 <code>write()</code> 的返回值告诉上游要不要暂停。下面这段代码遇到 <code>false</code> 就停下，等 <code>drain</code> 再接着写：</p>
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
<p>很多人以为 <code>false</code> 是写失败了，其实不是。这块数据已经进了缓冲区，<code>false</code> 只是在说“缓冲区满了，你先别写”。等缓冲区清空，可写流触发 <code>drain</code>，再继续。</p>
<h2>为什么推荐用 pipeline 连接</h2>
<p>下面把读文件、转大写、gzip 压缩、写文件串成一条链路：</p>
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
<p><code>pipeline</code> 做了三件事：下游缓冲区满时暂停上游；任何一个流出错时销毁其余的流，避免文件句柄泄漏；全部完成或者出错时，让返回的 Promise 结束。</p>
<p>那旧写法 <code>a.pipe(b).pipe(c)</code> 不行吗？它能传递背压，但不会传播错误。中间某个流出错，其他流不会被关闭，资源就漏掉了。</p>
<p>上面的 Transform 还有一个小坑。它直接对每块调用 <code>toString()</code>，如果一个中文这样的多字节 UTF-8 字符恰好被切在两块中间，就会出现乱码。处理文本时，应该给可读流设置 <code>encoding</code>，或者使用 <code>string_decoder</code>。</p>
<h2>用异步迭代消费</h2>
<p>可读流也能用 <code>for await...of</code> 一块块读：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">let</span> lines = <span class="hljs-number">0</span>;
<span class="hljs-keyword">for</span> <span class="hljs-keyword">await</span> (<span class="hljs-keyword">const</span> chunk <span class="hljs-keyword">of</span> <span class="hljs-title function_">createReadStream</span>(<span class="hljs-string">&#x27;in.txt&#x27;</span>, { <span class="hljs-attr">encoding</span>: <span class="hljs-string">&#x27;utf8&#x27;</span> })) {
  lines += chunk.<span class="hljs-title function_">split</span>(<span class="hljs-string">&#x27;\\n&#x27;</span>).<span class="hljs-property">length</span> - <span class="hljs-number">1</span>;
}
</code></pre></div>
<p>循环体在 <code>await</code> 的时候不会去读下一块，所以这种写法天然带背压。循环中途 <code>break</code> 或者抛错，流也会被销毁。</p>
<h2>常见追问</h2>
<p><strong>HTTP 响应也是流吗？</strong></p>
<blockquote>
<p>是。<code>http.ServerResponse</code> 是可写流，<code>IncomingMessage</code> 是可读流，都可以直接放进 <code>pipeline</code>。</p>
</blockquote>
<p><strong>highWaterMark 是硬上限吗？</strong></p>
<blockquote>
<p>不是。它只是 <code>write()</code> 开始返回 <code>false</code> 的阈值。如果不理会返回值继续写，缓冲区会超过它。</p>
</blockquote>
<p><strong>Web Streams 和 Node 流怎么转换？</strong></p>
<blockquote>
<p>用 <code>Readable.fromWeb()</code>、<code>Readable.toWeb()</code> 等方法。<code>fetch</code> 返回的 <code>response.body</code> 是 Web ReadableStream。</p>
</blockquote>`};export{e as default};