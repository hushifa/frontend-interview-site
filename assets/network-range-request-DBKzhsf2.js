var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>下载一个大文件下到一半断了，没必要从头再来，只要把剩下的部分要回来。Range 请求就是干这个的：请求头写 <code>Range: bytes=0-1023</code>，表示只要第 0 到第 1023 字节，两头都包含。</p>
<p>服务器用 <code>Accept-Ranges: bytes</code> 表示支持。支持的话，返回 <code>206 Partial Content</code>，并用 <code>Content-Range: bytes 0-1023/5000</code> 说明给的是哪一段、文件一共多大。</p>
<p>有两种情况要处理。服务器不支持或者忽略了 Range，会直接返回 <code>200</code> 和完整内容，客户端必须检查状态码，不然会把整个文件当成一段。范围超出文件大小，返回 <code>416 Range Not Satisfiable</code>，<code>Content-Range: bytes */5000</code> 告诉你实际大小。</p>
<p>续传时还要带 <code>If-Range: &quot;etag&quot;</code>。文件没变，服务器回 206；文件变了，就回完整的 200。这样不会把旧文件的前半段和新文件的后半段拼成一个坏文件。</p>
</blockquote>
<h2>Range 有哪几种写法</h2>
<div class="not-prose code-block"><div class="code-language">http</div><pre><code class="hljs language-http">Range: bytes=0-1023      # 前 1024 字节
Range: bytes=1024-       # 从 1024 到末尾
Range: bytes=-500        # 最后 500 字节
Range: bytes=0-99,200-299 # 多段，响应为 multipart/byteranges
</code></pre></div>
<p>注意 <code>-500</code> 不是“到第 500 字节”，而是“最后 500 字节”。多段请求时，响应是 <code>multipart/byteranges</code> 格式，几段内容包在一起返回。</p>
<h2>下载一段时要检查什么</h2>
<p>下面的函数请求一段字节，并检查服务器给的到底是不是这一段：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">fetchRange</span>(<span class="hljs-params">url, start, end, etag</span>) {
  <span class="hljs-keyword">const</span> headers = { <span class="hljs-title class_">Range</span>: <span class="hljs-string">\`bytes=<span class="hljs-subst">\${start}</span>-<span class="hljs-subst">\${end}</span>\`</span> };
  <span class="hljs-keyword">if</span> (etag) headers[<span class="hljs-string">&#x27;If-Range&#x27;</span>] = etag;

  <span class="hljs-keyword">const</span> response = <span class="hljs-keyword">await</span> <span class="hljs-title function_">fetch</span>(url, { headers });

  <span class="hljs-keyword">if</span> (response.<span class="hljs-property">status</span> === <span class="hljs-number">200</span>) {
    <span class="hljs-keyword">return</span> { <span class="hljs-attr">restart</span>: <span class="hljs-literal">true</span>, response }; <span class="hljs-comment">// 不支持 Range 或文件已变化</span>
  }
  <span class="hljs-keyword">if</span> (response.<span class="hljs-property">status</span> !== <span class="hljs-number">206</span>) {
    <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">\`下载失败：<span class="hljs-subst">\${response.status}</span>\`</span>);
  }

  <span class="hljs-keyword">const</span> match = <span class="hljs-regexp">/^bytes (\\d+)-(\\d+)\\/(\\d+|\\*)$/</span>.<span class="hljs-title function_">exec</span>(response.<span class="hljs-property">headers</span>.<span class="hljs-title function_">get</span>(<span class="hljs-string">&#x27;Content-Range&#x27;</span>) ?? <span class="hljs-string">&#x27;&#x27;</span>);
  <span class="hljs-keyword">if</span> (!match || <span class="hljs-title class_">Number</span>(match[<span class="hljs-number">1</span>]) !== start) {
    <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">&#x27;返回的范围与请求不一致&#x27;</span>);
  }

  <span class="hljs-keyword">return</span> {
    <span class="hljs-attr">restart</span>: <span class="hljs-literal">false</span>,
    <span class="hljs-attr">data</span>: <span class="hljs-keyword">new</span> <span class="hljs-title class_">Uint8Array</span>(<span class="hljs-keyword">await</span> response.<span class="hljs-title function_">arrayBuffer</span>()),
    <span class="hljs-attr">total</span>: match[<span class="hljs-number">3</span>] === <span class="hljs-string">&#x27;*&#x27;</span> ? <span class="hljs-literal">null</span> : <span class="hljs-title class_">Number</span>(match[<span class="hljs-number">3</span>]),
    <span class="hljs-attr">etag</span>: response.<span class="hljs-property">headers</span>.<span class="hljs-title function_">get</span>(<span class="hljs-string">&#x27;ETag&#x27;</span>),
  };
}
</code></pre></div>
<p>收到 200 时不能当成功拼接，因为可能是服务器不支持 Range，也可能是 <code>If-Range</code> 发现文件变了，两种情况都只能从头下载。</p>
<p>收到 206 也不要直接信，要解析 <code>Content-Range</code>，确认起点和你请求的一样。总大小那一位可能是 <code>*</code>，表示服务器也不知道总长度。这个正则可以在 Node 里单独试一下：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> pattern = <span class="hljs-regexp">/^bytes (\\d+)-(\\d+)\\/(\\d+|\\*)$/</span>;
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(pattern.<span class="hljs-title function_">exec</span>(<span class="hljs-string">&#x27;bytes 0-1023/5000&#x27;</span>).<span class="hljs-title function_">slice</span>(<span class="hljs-number">1</span>)); <span class="hljs-comment">// [ &#x27;0&#x27;, &#x27;1023&#x27;, &#x27;5000&#x27; ]</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(pattern.<span class="hljs-title function_">exec</span>(<span class="hljs-string">&#x27;bytes 0-1023/*&#x27;</span>).<span class="hljs-title function_">slice</span>(<span class="hljs-number">1</span>)); <span class="hljs-comment">// [ &#x27;0&#x27;, &#x27;1023&#x27;, &#x27;*&#x27; ]</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(pattern.<span class="hljs-title function_">exec</span>(<span class="hljs-string">&#x27;bytes */5000&#x27;</span>)); <span class="hljs-comment">// null</span>
</code></pre></div>
<p>最后一种是 416 的格式，不会出现在 206 里，所以匹配失败是对的。</p>
<p>跨源请求时，<code>Range</code> 头会触发预检，除非是简单的单段范围。服务器还要用 <code>Access-Control-Expose-Headers</code> 暴露 <code>Content-Range</code> 和 <code>ETag</code>，脚本才能读到。</p>
<h2>实际用在哪些地方</h2>
<p>最常见的是断点续传下载：记下已经下了多少字节，重连后从断点继续。</p>
<p>音视频也离不开它。<code>&lt;video&gt;</code> 拖动进度条时，浏览器会自动发 Range 请求。服务器不支持的话，视频就没法拖。</p>
<p>还有大文件的局部读取，比如只读 ZIP 的目录区、PDF 的某一页、Parquet 文件的元数据，不用把整个文件下下来。</p>
<h2>还有哪些坑</h2>
<p><code>If-Range</code> 要用强 ETag，弱 ETag 不能用于范围请求，因为弱 ETag 只保证意思一样，不保证字节一样。</p>
<p>内容经过 gzip 等压缩时，范围算的是压缩后的字节，所以大文件下载一般不做动态压缩。</p>
<p>CDN 要能正确缓存和切分范围响应，有些 CDN 需要单独开启这个功能。</p>
<h2>常见追问</h2>
<p><strong>和分片上传有什么关系？</strong></p>
<blockquote>
<p>Range 是用来下载的。上传的分片由应用自己的协议或者对象存储的接口定义，见<a href="/questions/network-resumable-upload/">《浏览器分片上传如何实现可靠的暂停与续传？》</a>。</p>
</blockquote>
<p><strong>浏览器下载管理器的续传也用它吗？</strong></p>
<blockquote>
<p>是的，前提是服务器支持 Range，并且提供了 ETag 这类验证器。</p>
</blockquote>`};export{e as default};