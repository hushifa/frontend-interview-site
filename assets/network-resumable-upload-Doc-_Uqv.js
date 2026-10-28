var e={answerHtml:`<h2>简答</h2>
<ul>
<li>以服务端的上传会话为准：会话 ID、文件大小、分片大小、已收到的分片编号。浏览器本地记录只用来加速，不能作为依据。</li>
<li><code>file.slice()</code> 只是创建引用，不会把整个文件读进内存。</li>
<li>每个分片的上传是幂等的：同一编号重复上传覆盖旧数据，所以超时后可以安全重试。</li>
<li>暂停用 <code>AbortController</code> 取消进行中的请求；续传先查询服务端已完成的分片，再补传。</li>
<li>合并时校验总大小和整体哈希；页面刷新后需要用户重新选择文件，浏览器不会保留文件访问权限。</li>
</ul>
<h2>流程</h2>
<ol>
<li><code>POST /uploads</code>，提交文件名、大小、分片大小，得到 <code>uploadId</code>。</li>
<li>并发上传分片 <code>PUT /uploads/:id/parts/:index</code>。</li>
<li>暂停：abort 所有进行中的请求。</li>
<li>续传：<code>GET /uploads/:id</code> 得到已完成分片，只上传其余的。</li>
<li><code>POST /uploads/:id/complete</code>，服务端合并、校验、返回最终文件地址。</li>
</ol>
<h2>上传器</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">uploadFile</span>(<span class="hljs-params">file, uploadId, { partSize, concurrency = <span class="hljs-number">3</span>, signal }</span>) {
  <span class="hljs-keyword">const</span> total = <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">ceil</span>(file.<span class="hljs-property">size</span> / partSize);
  <span class="hljs-keyword">const</span> { done } = <span class="hljs-keyword">await</span> <span class="hljs-title function_">fetch</span>(<span class="hljs-string">\`/uploads/<span class="hljs-subst">\${uploadId}</span>\`</span>, { signal }).<span class="hljs-title function_">then</span>(<span class="hljs-function">(<span class="hljs-params">r</span>) =&gt;</span> r.<span class="hljs-title function_">json</span>());
  <span class="hljs-keyword">const</span> pending = [];
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">let</span> i = <span class="hljs-number">0</span>; i &lt; total; i += <span class="hljs-number">1</span>) <span class="hljs-keyword">if</span> (!done.<span class="hljs-title function_">includes</span>(i)) pending.<span class="hljs-title function_">push</span>(i);

  <span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">sendPart</span>(<span class="hljs-params">index</span>) {
    <span class="hljs-keyword">for</span> (<span class="hljs-keyword">let</span> attempt = <span class="hljs-number">0</span>; ; attempt += <span class="hljs-number">1</span>) {
      <span class="hljs-keyword">const</span> body = file.<span class="hljs-title function_">slice</span>(index * partSize, (index + <span class="hljs-number">1</span>) * partSize);
      <span class="hljs-keyword">const</span> response = <span class="hljs-keyword">await</span> <span class="hljs-title function_">fetch</span>(<span class="hljs-string">\`/uploads/<span class="hljs-subst">\${uploadId}</span>/parts/<span class="hljs-subst">\${index}</span>\`</span>, {
        <span class="hljs-attr">method</span>: <span class="hljs-string">&#x27;PUT&#x27;</span>,
        body,
        signal,
      });
      <span class="hljs-keyword">if</span> (response.<span class="hljs-property">ok</span>) <span class="hljs-keyword">return</span>;
      <span class="hljs-comment">// 401、403、413 等客户端错误重试无效，直接失败</span>
      <span class="hljs-keyword">if</span> (response.<span class="hljs-property">status</span> &lt; <span class="hljs-number">500</span> &amp;&amp; response.<span class="hljs-property">status</span> !== <span class="hljs-number">429</span>) {
        <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">\`分片 <span class="hljs-subst">\${index}</span> 被拒绝：<span class="hljs-subst">\${response.status}</span>\`</span>);
      }
      <span class="hljs-keyword">if</span> (attempt &gt;= <span class="hljs-number">3</span>) <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">\`分片 <span class="hljs-subst">\${index}</span> 多次失败\`</span>);
      <span class="hljs-keyword">await</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Promise</span>(<span class="hljs-function">(<span class="hljs-params">resolve</span>) =&gt;</span> <span class="hljs-built_in">setTimeout</span>(resolve, <span class="hljs-number">1000</span> * <span class="hljs-number">2</span> ** attempt));
    }
  }

  <span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">worker</span>(<span class="hljs-params"></span>) {
    <span class="hljs-keyword">while</span> (pending.<span class="hljs-property">length</span> &gt; <span class="hljs-number">0</span>) <span class="hljs-keyword">await</span> <span class="hljs-title function_">sendPart</span>(pending.<span class="hljs-title function_">shift</span>());
  }

  <span class="hljs-keyword">await</span> <span class="hljs-title class_">Promise</span>.<span class="hljs-title function_">all</span>(<span class="hljs-title class_">Array</span>.<span class="hljs-title function_">from</span>({ <span class="hljs-attr">length</span>: <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">min</span>(concurrency, pending.<span class="hljs-property">length</span>) }, worker));
  <span class="hljs-keyword">const</span> res = <span class="hljs-keyword">await</span> <span class="hljs-title function_">fetch</span>(<span class="hljs-string">\`/uploads/<span class="hljs-subst">\${uploadId}</span>/complete\`</span>, { <span class="hljs-attr">method</span>: <span class="hljs-string">&#x27;POST&#x27;</span>, signal });
  <span class="hljs-keyword">if</span> (!res.<span class="hljs-property">ok</span>) <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">\`合并失败：HTTP <span class="hljs-subst">\${res.status}</span>\`</span>);
  <span class="hljs-keyword">return</span> res.<span class="hljs-title function_">json</span>();
}
</code></pre></div>
<p><code>fetch</code> 本身因为网络中断而拒绝时，<code>sendPart</code> 会直接抛出，这里没有重试网络错误；实际项目里可以在外层捕获后提示用户点击续传，或者对非 <code>AbortError</code> 的错误同样退避重试。</p>
<h2>细节</h2>
<ul>
<li>进度：<code>fetch</code> 不提供上传进度事件，按完成的分片数计算；需要单个分片内的细粒度进度时用 <code>XMLHttpRequest.upload.onprogress</code>。</li>
<li>分片大小：太小请求数多，太大失败后重传成本高，通常取几 MB，按网络情况调整。</li>
<li>完整性：分片请求带上分片哈希，服务端校验；合并后校验整体哈希。整体哈希可以在 Worker 中计算，避免阻塞页面。</li>
<li>秒传：上传前用文件哈希查询服务端是否已有相同文件。哈希只能作为去重依据，权限仍要校验。</li>
<li>清理：服务端为未完成的会话设置过期时间，到期删除分片。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li>刷新页面后怎么续传？把 <code>uploadId</code> 和文件名、大小、修改时间存在 <code>localStorage</code>，用户重新选择同一文件后匹配会话。</li>
<li>直传对象存储怎么做？会话和分片签名由业务服务器管理，见<a href="/questions/network-object-storage-multipart/">《浏览器直传对象存储时，如何设计安全的分片上传？》</a>。</li>
</ul>`};export{e as default};