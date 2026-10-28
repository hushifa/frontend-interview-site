var e={answerHtml:`<h2>简答</h2>
<ul>
<li>文件不经过业务服务器，节省带宽；但签名和凭据只在服务端生成，浏览器拿不到长期密钥。</li>
<li>流程：创建上传会话 → 每个分片申请预签名 URL → 浏览器 PUT 分片并记录返回的 <code>ETag</code> → 服务端按分片编号和 ETag 合并。</li>
<li>对象键、大小上限、内容类型由服务端决定并写进签名，浏览器不能自己指定路径。</li>
<li>存储桶要配置 CORS，允许页面来源的 <code>PUT</code>，并用 <code>ExposeHeaders</code> 暴露 <code>ETag</code>，否则脚本读不到它。</li>
<li>未完成的上传会一直占用存储，要设置生命周期规则自动清理。</li>
</ul>
<p>下文以 S3 的接口为例，其他云厂商的分片大小、编号规则和接口名称不同。</p>
<h2>流程</h2>
<div class="not-prose code-block"><div class="code-language">text</div><pre><code class="hljs language-text">浏览器 ──POST /uploads──────────────▶ 业务服务器 ──CreateMultipartUpload──▶ 对象存储
        ◀─ uploadId, key ───────────
浏览器 ──POST /uploads/:id/parts/3─▶ 业务服务器（校验身份与配额，签发短期 URL）
        ◀─ 预签名 URL ──────────────
浏览器 ──PUT 分片 3────────────────────────────────────────────────────▶ 对象存储
        ◀─ ETag ────────────────────────────────────────────────────────
浏览器 ──POST /uploads/:id/complete（编号与 ETag 列表）▶ 业务服务器 ──Complete──▶
</code></pre></div>
<h2>浏览器上传一个分片</h2>
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
<p>同一编号的分片重新上传会覆盖之前的内容，所以分片 PUT 可以安全重试。并发数按网络情况取一个小值并可调，不要一次发出全部分片。</p>
<h2>安全要点</h2>
<ul>
<li>预签名 URL 有效期尽量短，只授权单个对象的单个分片。</li>
<li>合并时服务端校验分片总数、总大小和调用者身份，不信任浏览器传来的文件大小。</li>
<li>需要内容完整性时，让分片请求携带校验和（S3 支持 CRC64NVME、SHA-256 等算法），存储端校验不一致会拒绝。</li>
<li>合并完成后再做类型检测和病毒扫描，通过后才对外可见。</li>
<li>文件上传的通用安全边界见<a href="/questions/security-file-upload/">《前端文件上传有哪些安全边界？》</a>。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li>怎么支持断点续传？服务端保存 uploadId 和已完成的分片，见<a href="/questions/network-resumable-upload/">《浏览器分片上传如何实现可靠的暂停与续传？》</a>。</li>
<li>分片编号有什么限制？S3 的编号范围是 1 到 10000，可以不连续；启用校验和时必须从 1 开始连续编号。分片大小下限等限制见 S3 的 multipart upload limits 页面，其他厂商规则不同。</li>
</ul>`};export{e as default};