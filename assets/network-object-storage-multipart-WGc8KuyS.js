var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>直传的意思是文件不经过业务服务器，浏览器直接传到对象存储，省下业务服务器的带宽。但存储的密钥不能给浏览器，所以签名只在服务端生成。服务端给浏览器一个临时的、带签名的上传地址，这叫预签名 URL。</p>
<p>流程是四步：服务端创建上传会话；浏览器为每个分片申请预签名 URL；浏览器把分片 PUT 上去，记下返回的 <code>ETag</code>；最后服务端按分片编号和 ETag 合并。</p>
<p>安全上最重要的一条：文件存在哪个路径（对象键）、多大、什么类型，都由服务端决定并写进签名，浏览器不能自己指定。</p>
<p>还有两个容易漏的配置。存储桶要配 CORS，允许页面来源发 <code>PUT</code>，并且用 <code>ExposeHeaders</code> 把 <code>ETag</code> 暴露出来，否则脚本读不到它。没传完的上传会一直占着存储，要设生命周期规则自动清理。</p>
</blockquote>
<p>下文以 S3 的接口为例，其他云厂商的分片大小、编号规则和接口名称不同。</p>
<h2>整个流程</h2>
<div class="not-prose code-block"><div class="code-language">text</div><pre><code class="hljs language-text">浏览器 ──POST /uploads──────────────▶ 业务服务器 ──CreateMultipartUpload──▶ 对象存储
        ◀─ uploadId, key ───────────
浏览器 ──POST /uploads/:id/parts/3─▶ 业务服务器（校验身份与配额，签发短期 URL）
        ◀─ 预签名 URL ──────────────
浏览器 ──PUT 分片 3────────────────────────────────────────────────────▶ 对象存储
        ◀─ ETag ────────────────────────────────────────────────────────
浏览器 ──POST /uploads/:id/complete（编号与 ETag 列表）▶ 业务服务器 ──Complete──▶
</code></pre></div>
<p>可以看到，大块数据只在浏览器和对象存储之间走。业务服务器每一步只处理很小的请求，但每一步都会校验身份，权限始终在它手里。</p>
<h2>浏览器怎么上传一个分片</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">uploadPart</span>(<span class="hljs-params">file, partNumber, partSize, url, signal</span>) {
  <span class="hljs-keyword">const</span> start = (partNumber - <span class="hljs-number">1</span>) * partSize; <span class="hljs-comment">// S3 分片编号从 1 开始</span>
  <span class="hljs-keyword">const</span> body = file.<span class="hljs-title function_">slice</span>(start, start + partSize);

  <span class="hljs-keyword">const</span> response = <span class="hljs-keyword">await</span> <span class="hljs-title function_">fetch</span>(url, { <span class="hljs-attr">method</span>: <span class="hljs-string">&#x27;PUT&#x27;</span>, body, signal });
  <span class="hljs-keyword">if</span> (!response.<span class="hljs-property">ok</span>) <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">\`分片 <span class="hljs-subst">\${partNumber}</span> 失败：<span class="hljs-subst">\${response.status}</span>\`</span>);

  <span class="hljs-keyword">const</span> etag = response.<span class="hljs-property">headers</span>.<span class="hljs-title function_">get</span>(<span class="hljs-string">&#x27;ETag&#x27;</span>);
  <span class="hljs-keyword">if</span> (!etag) <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">&#x27;读不到 ETag，检查存储桶 CORS 的 ExposeHeaders&#x27;</span>);
  <span class="hljs-keyword">return</span> { partNumber, etag };
}
</code></pre></div>
<p>S3 的分片编号从 1 开始，所以起始位置要先减 1。拿不到 <code>ETag</code> 时代码单独报错，因为这几乎总是 CORS 没暴露这个头，而不是上传失败了。</p>
<p>同一编号的分片重新上传，会覆盖之前的内容，所以分片 PUT 可以放心重试。并发数取一个小值，并且可调，不要一次把所有分片都发出去。</p>
<h2>安全上要守住哪些点</h2>
<p>预签名 URL 的有效期尽量短，并且只授权一个对象的一个分片。这样就算被别人拿到，能做的事也很有限。</p>
<p>合并时服务端要校验分片总数、总大小和调用者身份。浏览器传来的文件大小不能信。</p>
<p>需要保证内容完整时，让分片请求带上校验和。S3 支持 CRC64NVME、SHA-256 等算法，存储端算出来不一致就会拒绝。</p>
<p>合并完成以后，再做文件类型检测和病毒扫描，通过了才对外可见。文件上传通用的安全边界见<a href="/questions/security-file-upload/">《前端文件上传有哪些安全边界？》</a>。</p>
<h2>常见追问</h2>
<p><strong>怎么支持断点续传？</strong></p>
<blockquote>
<p>服务端保存 uploadId 和已经完成的分片，续传时只补缺的部分，见<a href="/questions/network-resumable-upload/">《浏览器分片上传如何实现可靠的暂停与续传？》</a>。</p>
</blockquote>
<p><strong>分片编号有什么限制？</strong></p>
<blockquote>
<p>S3 的编号范围是 1 到 10000，可以不连续；但启用了校验和时，必须从 1 开始连续编号。分片大小的下限等限制，看 S3 的 multipart upload limits 页面。其他厂商规则不一样。</p>
</blockquote>`};export{e as default};