var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>上传一个 2GB 的视频，传到 90% 断网了，用户肯定不想从头再来。做法是把文件切成几 MB 一块，一块一块传，服务端记下收到了哪些块。</p>
<p>这里以服务端的上传会话为准：会话 ID、文件大小、分片大小、已收到的分片编号都记在服务端。浏览器本地的记录只用来加速，不能当依据。切片用 <code>file.slice()</code>，它只是创建一个引用，不会把整个文件读进内存。</p>
<p>每个分片的上传是幂等的，同一编号重复上传会覆盖旧数据，所以超时了可以放心重试。暂停就用 <code>AbortController</code> 取消进行中的请求；续传时先问服务端哪些已经完成，只补传剩下的。</p>
<p>最后合并时要校验总大小和整体哈希。还有一点要注意：页面刷新后，用户得重新选一次文件，浏览器不会替你保留文件的访问权限。</p>
</blockquote>
<h2>先看 slice 切出来是什么</h2>
<p>用一个 10 字节的 Blob 模拟文件，每块 4 字节。这段可以在 Node 18 以上运行：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> file = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Blob</span>([<span class="hljs-string">&#x27;abcdefghij&#x27;</span>]); <span class="hljs-comment">// 10 字节</span>
<span class="hljs-keyword">const</span> partSize = <span class="hljs-number">4</span>;
<span class="hljs-keyword">const</span> total = <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">ceil</span>(file.<span class="hljs-property">size</span> / partSize);
<span class="hljs-keyword">for</span> (<span class="hljs-keyword">let</span> index = <span class="hljs-number">0</span>; index &lt; total; index += <span class="hljs-number">1</span>) {
  <span class="hljs-keyword">const</span> part = file.<span class="hljs-title function_">slice</span>(index * partSize, (index + <span class="hljs-number">1</span>) * partSize);
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(index, part.<span class="hljs-property">size</span>, <span class="hljs-keyword">await</span> part.<span class="hljs-title function_">text</span>());
}
<span class="hljs-comment">// 0 4 abcd</span>
<span class="hljs-comment">// 1 4 efgh</span>
<span class="hljs-comment">// 2 2 ij</span>
</code></pre></div>
<p>最后一块只有 2 字节。<code>slice</code> 的结束位置超过文件末尾也没关系，它会自动截到末尾，所以不用单独处理最后一块。浏览器里的 <code>File</code> 继承自 <code>Blob</code>，用法一样。</p>
<h2>整个流程</h2>
<ol>
<li><code>POST /uploads</code>，提交文件名、大小、分片大小，拿到 <code>uploadId</code>。</li>
<li>并发上传分片 <code>PUT /uploads/:id/parts/:index</code>。</li>
<li>暂停：abort 所有进行中的请求。</li>
<li>续传：<code>GET /uploads/:id</code> 拿到已完成的分片，只上传其余的。</li>
<li><code>POST /uploads/:id/complete</code>，服务端合并、校验，返回最终的文件地址。</li>
</ol>
<h2>上传器怎么写</h2>
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
<p>一开始先问服务端哪些分片已经完成，把剩下的放进 <code>pending</code>。这样首次上传和续传走的是同一套代码，首次上传时 <code>done</code> 是空数组而已。</p>
<p>并发是怎么控制的？开 <code>concurrency</code> 个 <code>worker</code>，每个 worker 从 <code>pending</code> 里取一个传一个，传完再取下一个。所以同时在传的分片最多就这么几个。</p>
<p>重试也区分了情况。5xx 和 429 是暂时的，等 1 秒、2 秒、4 秒再试，最多重试 3 次；其他 4xx 重试也没用，直接失败。暂停时外面调 <code>controller.abort()</code>，所有带着这个 <code>signal</code> 的请求都会被取消。</p>
<p>但要注意，<code>fetch</code> 本身因为网络中断而失败时，<code>sendPart</code> 会直接抛出，这段代码没有重试网络错误。实际项目里可以在外层捕获后提示用户点续传，或者对不是 <code>AbortError</code> 的错误同样退避重试。</p>
<h2>还有哪些细节</h2>
<p>进度怎么算？<code>fetch</code> 不提供上传进度事件，所以按完成的分片数算。需要单个分片内更细的进度，就用 <code>XMLHttpRequest.upload.onprogress</code>。</p>
<p>分片多大合适？太小请求数太多，太大失败后重传成本高，一般取几 MB，按网络情况调。</p>
<p>完整性怎么保证？分片请求带上分片的哈希，服务端校验；合并后再校验整体哈希。整体哈希可以放在 Worker 里算，不卡页面。</p>
<p>秒传是怎么回事？上传前先用文件哈希问服务端有没有相同的文件，有就不用传了。但哈希只能当去重依据，权限还是要校验。</p>
<p>最后别忘了清理。服务端给没完成的会话设过期时间，到期就把分片删掉。</p>
<h2>常见追问</h2>
<p><strong>刷新页面后怎么续传？</strong></p>
<blockquote>
<p>把 <code>uploadId</code> 和文件名、大小、修改时间存进 <code>localStorage</code>。用户重新选了同一个文件后，用这些信息匹配到原来的会话。</p>
</blockquote>
<p><strong>直传对象存储怎么做？</strong></p>
<blockquote>
<p>会话和分片签名由业务服务器管理，见<a href="/questions/network-object-storage-multipart/">《浏览器直传对象存储时，如何设计安全的分片上传？》</a>。</p>
</blockquote>`};export{e as default};