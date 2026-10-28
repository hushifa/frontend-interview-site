var e={answerHtml:`<h2>简答</h2>
<ul>
<li>分片用 <code>file.slice(start, end)</code>，返回新的 <code>Blob</code> 而不修改原文件；每片单独请求上传，失败只重传该片。</li>
<li>用文件内容哈希作为上传任务 ID：服务端已有完整文件时直接返回成功即为秒传，已有部分分片时只上传缺失分片即为断点续传。</li>
<li><code>crypto.subtle.digest</code> 不支持流式输入，必须一次读入全部数据；大文件哈希通常在 Web Worker 里用支持增量计算的库完成，避免阻塞主线程和占满内存。</li>
<li>并发用固定大小的任务池控制，常见 3～6 个；每片配合重试上限和 <code>AbortController</code> 实现暂停与取消。</li>
<li>秒传时服务端拿到的只有哈希，无法证明客户端持有文件：只给当前用户新建一条引用、不返回他人文件的访问权限，必要时要求回传服务端随机指定区间的内容；抽样哈希不能作为秒传依据。</li>
</ul>
<h2>整体流程</h2>
<ol>
<li>选择文件后在 Worker 中计算文件哈希。</li>
<li>调用&quot;检查&quot;接口，传哈希、文件名和大小：返回&quot;已存在&quot;则秒传结束；否则返回已上传的分片序号列表。</li>
<li>跳过已有分片，把其余分片放入并发池上传，每个请求带哈希、序号和分片哈希（可选）。</li>
<li>全部成功后调用&quot;合并&quot;接口，服务端拼接并校验，返回最终文件地址。</li>
</ol>
<p>分片状态以服务端记录为准，刷新页面后重新选择同一文件、算出同一哈希就能续传。暂停、续传、合并校验和失败分类的细节见<a href="/questions/network-resumable-upload/">《浏览器分片上传如何实现可靠的暂停与续传？》</a>，本题侧重秒传和并发。</p>
<h2>分片</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> <span class="hljs-variable constant_">CHUNK_SIZE</span> = <span class="hljs-number">5</span> * <span class="hljs-number">1024</span> * <span class="hljs-number">1024</span>;

<span class="hljs-keyword">function</span> <span class="hljs-title function_">createChunks</span>(<span class="hljs-params">file</span>) {
  <span class="hljs-keyword">const</span> chunks = [];
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">let</span> start = <span class="hljs-number">0</span>, index = <span class="hljs-number">0</span>; start &lt; file.<span class="hljs-property">size</span>; start += <span class="hljs-variable constant_">CHUNK_SIZE</span>, index += <span class="hljs-number">1</span>) {
    chunks.<span class="hljs-title function_">push</span>({ index, <span class="hljs-attr">blob</span>: file.<span class="hljs-title function_">slice</span>(start, start + <span class="hljs-variable constant_">CHUNK_SIZE</span>) });
  }
  <span class="hljs-keyword">return</span> chunks;
}
</code></pre></div>
<p>分片大小影响请求数和重传代价：太小请求过多，太大则单片失败重传慢。对象存储的分片上传接口通常有最小分片大小和最大分片数限制，按所用服务的文档确定。</p>
<h2>哈希与秒传</h2>
<p>哈希读完整文件，几 GB 的文件耗时明显。抽样哈希只取头尾和中间若干片段计算，可以用来快速提示&quot;可能已上传过&quot;，但碰撞概率高，也容易被构造，不能据此直接判定秒传成功。</p>
<p>秒传的风险在于：只凭客户端提交的哈希，服务端无法确认对方真的有这个文件。知道某个文件哈希的人，就可能&quot;秒传&quot;出别人上传的私有文件。常见防护：</p>
<ul>
<li>秒传成功只为当前用户新建一条指向已有存储对象的引用，权限按当前用户计算，不返回原上传者的文件地址或元数据。</li>
<li>敏感场景要求持有证明：服务端随机指定若干字节区间，客户端读取这些区间的内容或其哈希回传，服务端比对后才判定秒传。</li>
<li>秒传判断使用完整文件哈希。</li>
</ul>
<h2>并发池</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">runPool</span>(<span class="hljs-params">tasks, limit</span>) {
  <span class="hljs-keyword">const</span> results = [];
  <span class="hljs-keyword">let</span> next = <span class="hljs-number">0</span>;
  <span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">worker</span>(<span class="hljs-params"></span>) {
    <span class="hljs-keyword">while</span> (next &lt; tasks.<span class="hljs-property">length</span>) {
      <span class="hljs-keyword">const</span> index = next++;
      results[index] = <span class="hljs-keyword">await</span> tasks[index]();
    }
  }
  <span class="hljs-comment">// 任一任务失败时 Promise.all 立即 reject，但其余 worker 仍会继续领取任务</span>
  <span class="hljs-keyword">await</span> <span class="hljs-title class_">Promise</span>.<span class="hljs-title function_">all</span>(<span class="hljs-title class_">Array</span>.<span class="hljs-title function_">from</span>({ <span class="hljs-attr">length</span>: <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">min</span>(limit, tasks.<span class="hljs-property">length</span>) }, worker));
  <span class="hljs-keyword">return</span> results;
}
</code></pre></div>
<p>每个 worker 完成一个任务后立刻领取下一个，同时进行的任务数不超过 <code>limit</code>，结果按原序号存放。实际上传时任务内部再包一层重试：失败后指数退避，超过次数则整个上传标记失败。这个池在失败后不会停下，生产代码要设置停止标志，让 worker 不再领取新任务，并对进行中的请求调用 <code>abort()</code>，已完成的分片保留以便续传。</p>
<p>暂停时对进行中的请求调用 <code>abort()</code>，并停止领取新任务；恢复时重新调用检查接口拿到最新的已上传列表。取消请求的边界见<a href="/questions/api-abort/">《AbortController 能取消什么，不能取消什么？》</a>。</p>
<h2>进度</h2>
<p><code>fetch</code> 不提供上传进度事件，需要分片级进度时可用 <code>XMLHttpRequest</code> 的 <code>upload.onprogress</code>。总进度按&quot;已完成分片字节数 + 进行中分片已发送字节数&quot;计算，重试时要扣掉失败分片的计数。</p>
<h2>常见追问</h2>
<ul>
<li>为什么不一次性上传？单个请求失败需整体重来，且容易触发网关的请求体大小和超时限制。</li>
<li>分片乱序到达怎么办？服务端按序号存储，合并时按序拼接，与到达顺序无关。</li>
<li>能直接传对象存储吗？可以由服务端签发分片上传凭证，前端直传，减轻业务服务器带宽压力。</li>
</ul>`};export{e as default};