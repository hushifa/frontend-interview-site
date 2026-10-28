var e={answerHtml:`<h2>简答</h2>
<ul>
<li>请求头 <code>Range: bytes=0-1023</code> 表示取第 0 到 1023 字节，两端都包含。</li>
<li>服务器用 <code>Accept-Ranges: bytes</code> 声明支持；返回 <code>206 Partial Content</code> 和 <code>Content-Range: bytes 0-1023/5000</code>。</li>
<li>服务器忽略 Range 时返回 <code>200</code> 和完整内容，客户端必须检查状态码，否则会把整个文件当成一段。</li>
<li>范围超出文件大小返回 <code>416 Range Not Satisfiable</code>，<code>Content-Range: bytes */5000</code> 给出实际大小。</li>
<li>续传时带 <code>If-Range: &quot;etag&quot;</code>：文件没变返回 206，变了返回完整的 200，避免拼出损坏的文件。</li>
</ul>
<h2>写法</h2>
<div class="not-prose code-block"><div class="code-language">http</div><pre><code class="hljs language-http">Range: bytes=0-1023      # 前 1024 字节
Range: bytes=1024-       # 从 1024 到末尾
Range: bytes=-500        # 最后 500 字节
Range: bytes=0-99,200-299 # 多段，响应为 multipart/byteranges
</code></pre></div>
<h2>校验一段下载</h2>
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
<p>跨源请求时，<code>Range</code> 头会触发预检（除非是简单的单段范围），服务器还要用 <code>Access-Control-Expose-Headers</code> 暴露 <code>Content-Range</code> 和 <code>ETag</code>，脚本才能读到。</p>
<h2>场景</h2>
<ul>
<li>断点续传下载：记录已下载字节数，重连后从断点继续。</li>
<li>视频和音频：<code>&lt;video&gt;</code> 拖动进度条时，浏览器自动发 Range 请求，服务器不支持会导致无法拖动。</li>
<li>大文件局部读取：只读 ZIP 的目录区、PDF 的某一页、Parquet 文件的元数据。</li>
</ul>
<h2>注意</h2>
<ul>
<li><code>If-Range</code> 应该用强 ETag，弱 ETag 不能用于范围请求。</li>
<li>内容经过 gzip 等压缩时，范围是针对编码后的字节，大文件下载通常不做动态压缩。</li>
<li>CDN 要正确缓存和切分范围响应，部分 CDN 需要单独开启。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li>和分片上传有什么关系？Range 用于下载；上传的分片由应用协议或对象存储接口定义，见<a href="/questions/network-resumable-upload/">《浏览器分片上传如何实现可靠的暂停与续传？》</a>。</li>
<li>浏览器下载管理器的续传也用它吗？是的，前提是服务器支持 Range 并提供验证器。</li>
</ul>`};export{e as default};