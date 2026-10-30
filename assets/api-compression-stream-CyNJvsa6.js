var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>浏览器自带了两个转换流：<code>CompressionStream</code> 负责压缩，<code>DecompressionStream</code> 负责解压。写法是 <code>stream.pipeThrough(new CompressionStream(&#x27;gzip&#x27;))</code>，数据一块一块流过去，出来的就是 gzip 字节。</p>
<p>以前要在前端压缩，得打包 pako 这类库。内置以后不用额外下载代码，也不必把整个文件读进内存再压，按流处理就行。它从 2023 年 5 月起在主流浏览器都能用，Web Worker 里也能用。</p>
<p>常见用法是上传前压缩大段日志或 JSON，或者在前端解压用户选的 <code>.gz</code> 文件。拿到结果时可以把流交给 <code>new Response(stream)</code>，再调 <code>.blob()</code>、<code>.arrayBuffer()</code> 或 <code>.text()</code>。</p>
<p>要注意两点。<code>gzip</code>、<code>deflate</code>、<code>deflate-raw</code> 是早就支持的格式，<code>brotli</code> 和 <code>zstd</code> 是后加的，不支持的格式在构造时直接抛 <code>TypeError</code>，需要兜底。另外它只是处理字节，和 HTTP 响应头里的 <code>Content-Encoding</code> 没关系，浏览器对 gzip 响应本来就会自动解压。</p>
</blockquote>
<h2>怎样压缩一段数据再解压回来</h2>
<p>下面把一段 6000 字节的重复文本压缩成 gzip，看看压缩后的大小和文件头，再解压回去和原文比较。Node.js 22 也提供同名的全局类，这段代码用 Node.js 22.23 实际运行过。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> text = <span class="hljs-string">&#x27;hello &#x27;</span>.<span class="hljs-title function_">repeat</span>(<span class="hljs-number">1000</span>);
<span class="hljs-keyword">const</span> input = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Blob</span>([text]);
<span class="hljs-keyword">const</span> gzipStream = input.<span class="hljs-title function_">stream</span>().<span class="hljs-title function_">pipeThrough</span>(<span class="hljs-keyword">new</span> <span class="hljs-title class_">CompressionStream</span>(<span class="hljs-string">&#x27;gzip&#x27;</span>));

<span class="hljs-keyword">new</span> <span class="hljs-title class_">Response</span>(gzipStream)
  .<span class="hljs-title function_">arrayBuffer</span>()
  .<span class="hljs-title function_">then</span>(<span class="hljs-function">(<span class="hljs-params">buffer</span>) =&gt;</span> {
    <span class="hljs-keyword">const</span> bytes = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Uint8Array</span>(buffer);
    <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(input.<span class="hljs-property">size</span>); <span class="hljs-comment">// 6000</span>
    <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(bytes.<span class="hljs-property">length</span> &lt; <span class="hljs-number">100</span> ? <span class="hljs-string">&#x27;压缩后不到 100 字节&#x27;</span> : <span class="hljs-string">&#x27;压缩效果不明显&#x27;</span>); <span class="hljs-comment">// 压缩后不到 100 字节</span>
    <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(bytes[<span class="hljs-number">0</span>].<span class="hljs-title function_">toString</span>(<span class="hljs-number">16</span>) + <span class="hljs-string">&#x27; &#x27;</span> + bytes[<span class="hljs-number">1</span>].<span class="hljs-title function_">toString</span>(<span class="hljs-number">16</span>)); <span class="hljs-comment">// 1f 8b</span>
    <span class="hljs-keyword">const</span> restored = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Blob</span>([bytes]).<span class="hljs-title function_">stream</span>().<span class="hljs-title function_">pipeThrough</span>(<span class="hljs-keyword">new</span> <span class="hljs-title class_">DecompressionStream</span>(<span class="hljs-string">&#x27;gzip&#x27;</span>));
    <span class="hljs-keyword">return</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Response</span>(restored).<span class="hljs-title function_">text</span>();
  })
  .<span class="hljs-title function_">then</span>(<span class="hljs-function">(<span class="hljs-params">result</span>) =&gt;</span> {
    <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(result === text ? <span class="hljs-string">&#x27;解压后与原文一致&#x27;</span> : <span class="hljs-string">&#x27;内容不一致&#x27;</span>); <span class="hljs-comment">// 解压后与原文一致</span>
  });
</code></pre></div>
<p>为什么要绕一圈 <code>new Response()</code>？因为 <code>pipeThrough</code> 返回的仍然是一个 <code>ReadableStream</code>，它只能一块一块地读。<code>Response</code> 能把整个流读完并转换成 <code>ArrayBuffer</code>、<code>Blob</code> 或文本，这是 MDN 示例里推荐的收尾方式。</p>
<p><code>1f 8b</code> 是 gzip 格式固定的开头两个字节，看到它就说明输出确实是标准 gzip，可以交给服务端的 gzip 工具解压。重复文本压缩率很高，所以 6000 字节压到了不到 100 字节，真实数据的压缩率要看内容。</p>
<h2>格式怎么选，不支持时怎么办</h2>
<p>构造函数的参数决定格式。<code>gzip</code> 和 <code>deflate</code> 都带校验信息，区别在外层包装：<code>gzip</code> 是常见的 .gz 文件格式，<code>deflate</code> 是 ZLIB 格式。<code>deflate-raw</code> 只有压缩数据本身，没有头部和尾部的校验和，适合对接要求原始 DEFLATE 数据的格式。</p>
<p>MDN 目前还列出了 <code>brotli</code> 和 <code>zstd</code>。整个 API 虽然标为广泛可用，但页面注明部分功能的支持程度不一样，所以用新格式前要先试：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">let</span> stream;
<span class="hljs-keyword">try</span> {
  stream = <span class="hljs-keyword">new</span> <span class="hljs-title class_">CompressionStream</span>(<span class="hljs-string">&#x27;zstd&#x27;</span>);
} <span class="hljs-keyword">catch</span> (error) {
  <span class="hljs-keyword">if</span> (!(error <span class="hljs-keyword">instanceof</span> <span class="hljs-title class_">TypeError</span>)) <span class="hljs-keyword">throw</span> error;
  stream = <span class="hljs-keyword">new</span> <span class="hljs-title class_">CompressionStream</span>(<span class="hljs-string">&#x27;gzip&#x27;</span>);
}
</code></pre></div>
<p>MDN 写明，传入不支持的格式会抛 <code>TypeError</code>，所以捕获它再退回 <code>gzip</code> 就行。</p>
<h2>和 HTTP 压缩有什么区别</h2>
<p>很多人以为用了 <code>CompressionStream</code> 才能处理 gzip 响应，其实不用。服务端返回 <code>Content-Encoding: gzip</code> 时，浏览器在网络层就自动解压了，<code>fetch</code> 拿到的已经是原文。这部分属于内容协商，见<a href="/questions/network-content-negotiation/">《HTTP 内容协商会怎样影响前端资源和接口响应？》</a>。</p>
<p><code>CompressionStream</code> 处理的是<strong>页面自己手里的字节</strong>：要上传的日志、本地选的文件、存进 IndexedDB 的数据。比如上传前压缩，就是把 <code>file.stream().pipeThrough(new CompressionStream(&#x27;gzip&#x27;))</code> 的结果作为请求体，同时和后端约定好它收到的是 gzip 数据。</p>
<p>流本身的读取、背压和取消规则与其他 ReadableStream 一样，见<a href="/questions/api-readable-streams/">《怎样正确消费 Fetch 返回的 ReadableStream？》</a>。</p>
<h2>常见追问</h2>
<p><strong>压缩一定能让数据变小吗？</strong></p>
<blockquote>
<p>不一定。图片、视频、已经压缩过的 zip 本身没多少重复内容，再压一遍几乎不变，还白白花 CPU。适合压缩的是文本、JSON、日志这类重复度高的数据。</p>
</blockquote>
<p><strong>能在 Web Worker 里用吗？</strong></p>
<blockquote>
<p>能。MDN 标明这个 API 在 Web Worker 中可用。数据量大的时候放到 Worker 里压缩，可以避免占住主线程。</p>
</blockquote>
<p><strong>DecompressionStream 遇到损坏的数据会怎样？</strong></p>
<blockquote>
<p>数据不是合法的压缩格式时，流会进入错误状态，读取它的 Promise（比如 <code>response.text()</code>）会被拒绝，所以解压用户文件时要加 catch。</p>
</blockquote>`};export{e as default};