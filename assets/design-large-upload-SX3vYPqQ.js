var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>大文件上传要拆成几个部分来设计：怎样标识一个上传任务、怎样判断能不能秒传、分片存在哪里、什么时候合并、怎样限制并发。浏览器端怎样暂停、续传、显示进度和重试，见<a href="/questions/network-resumable-upload/">《浏览器分片上传如何实现可靠的暂停与续传？》</a>，这道题讲整体系统。</p>
<p>上传任务以服务端的会话为准，记下文件哈希、大小、分片大小和已收到的分片序号。上传前先拿哈希问服务端：已有完整文件就秒传，已有部分分片就只传缺的。算哈希要读完整个文件，<code>crypto.subtle.digest</code> 不支持流式输入，所以大文件通常放到 Web Worker 里，用支持增量计算的库来算。</p>
<p>分片按序号存进临时存储，全部到齐后客户端调用合并接口，服务端按序号拼接，再校验总大小和整体哈希。没完成的会话设过期时间，到期删除分片。并发两头都要管：客户端用固定大小的任务池，同时传 3 到 6 片；服务端超过限额时返回 429，可以带 <code>Retry-After</code> 告诉客户端多久后再试。</p>
<p>要特别注意秒传的安全问题。服务端拿到的只是一个哈希，证明不了客户端真的有这个文件。所以秒传只能给当前用户新建一条引用，必要时让客户端回传服务端随机指定的一段内容。抽样哈希不能拿来判定秒传。</p>
</blockquote>
<h2>整体流程是怎样的</h2>
<ol>
<li>选好文件后，在 Worker 里计算文件哈希。</li>
<li>调用“检查”接口，传上哈希、文件名和大小。返回“已存在”就是秒传，直接结束；否则创建或找回上传会话，返回已经上传过的分片序号列表。</li>
<li>跳过已有的分片，其余分片放进并发池上传。每个请求带上会话 ID、分片序号，还可以带分片自己的哈希，服务端收到后先校验再落盘。</li>
<li>全部成功后调用“合并”接口，服务端把分片拼起来并校验，返回最终的文件地址。</li>
</ol>
<p>分片状态以服务端记录为准。所以刷新页面以后，用户重新选同一个文件，算出同一个哈希，就能接着传。</p>
<h2>怎样切分片</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> <span class="hljs-variable constant_">CHUNK_SIZE</span> = <span class="hljs-number">5</span> * <span class="hljs-number">1024</span> * <span class="hljs-number">1024</span>;

<span class="hljs-keyword">function</span> <span class="hljs-title function_">createChunks</span>(<span class="hljs-params">file</span>) {
  <span class="hljs-keyword">const</span> chunks = [];
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">let</span> start = <span class="hljs-number">0</span>, index = <span class="hljs-number">0</span>; start &lt; file.<span class="hljs-property">size</span>; start += <span class="hljs-variable constant_">CHUNK_SIZE</span>, index += <span class="hljs-number">1</span>) {
    chunks.<span class="hljs-title function_">push</span>({ index, <span class="hljs-attr">blob</span>: file.<span class="hljs-title function_">slice</span>(start, start + <span class="hljs-variable constant_">CHUNK_SIZE</span>) });
  }
  <span class="hljs-keyword">return</span> chunks;
}
</code></pre></div>
<p>每 5MB 切一片，最后一片可能不满 5MB。分片大小是个权衡：太小，请求数太多；太大，一片失败要重传很久。如果传到对象存储，它的分片上传接口通常有最小分片大小和最大分片数的限制，按所用服务的文档来定。</p>
<h2>秒传有什么安全问题</h2>
<p>算完整文件的哈希要把整个文件读一遍，几个 GB 的文件耗时很明显。于是有人用抽样哈希，只取头、尾和中间几段来算。它可以用来快速提示“这个文件可能传过”，但碰撞概率高，也容易被人故意构造，不能直接据此判定秒传成功。</p>
<p>更根本的问题是：只凭客户端交上来的哈希，服务端没法确认对方真有这个文件。如果谁知道某个文件的哈希，就可能用“秒传”把别人上传的私有文件变成自己的。常见的防护有这些。</p>
<p>秒传成功时，只给当前用户新建一条指向已有存储对象的引用，权限按当前用户算，不返回原上传者的文件地址或元数据。</p>
<p>敏感场景要求“持有证明”。服务端随机指定几个字节区间，客户端读出这些区间的内容或内容的哈希回传，服务端比对通过才算秒传。因为区间是随机的，只知道哈希的人答不上来。</p>
<p>最后，秒传判断只用完整文件的哈希。</p>
<h2>并发池怎么写</h2>
<p>下面这个函数同时最多运行 <code>limit</code> 个任务，结果按原来的顺序返回。先看它跑起来的效果：</p>
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

<span class="hljs-keyword">let</span> running = <span class="hljs-number">0</span>;
<span class="hljs-keyword">let</span> peak = <span class="hljs-number">0</span>;
<span class="hljs-keyword">const</span> <span class="hljs-title function_">sleep</span> = (<span class="hljs-params">ms</span>) =&gt; <span class="hljs-keyword">new</span> <span class="hljs-title class_">Promise</span>(<span class="hljs-function">(<span class="hljs-params">resolve</span>) =&gt;</span> <span class="hljs-built_in">setTimeout</span>(resolve, ms));
<span class="hljs-keyword">const</span> tasks = [<span class="hljs-number">30</span>, <span class="hljs-number">10</span>, <span class="hljs-number">20</span>, <span class="hljs-number">10</span>, <span class="hljs-number">5</span>].<span class="hljs-title function_">map</span>(<span class="hljs-function">(<span class="hljs-params">ms, i</span>) =&gt;</span> <span class="hljs-title function_">async</span> () =&gt; {
  running += <span class="hljs-number">1</span>;
  peak = <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">max</span>(peak, running);
  <span class="hljs-keyword">await</span> <span class="hljs-title function_">sleep</span>(ms);
  running -= <span class="hljs-number">1</span>;
  <span class="hljs-keyword">return</span> i;
});

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-keyword">await</span> <span class="hljs-title function_">runPool</span>(tasks, <span class="hljs-number">2</span>)); <span class="hljs-comment">// [ 0, 1, 2, 3, 4 ]</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(peak); <span class="hljs-comment">// 2</span>
</code></pre></div>
<p>五个任务耗时各不相同，完成的先后顺序是乱的，可结果数组还是 <code>[0, 1, 2, 3, 4]</code>，同时运行的任务最多 2 个。</p>
<p>为什么能做到？池子里开了 <code>limit</code> 个 worker，每个 worker 做完一个任务就马上去领下一个，所以同时在跑的任务永远不超过 <code>limit</code>。<code>next++</code> 是同步执行的，两个 worker 不会领到同一个任务。结果按领到的序号 <code>index</code> 存放，跟谁先完成没关系。</p>
<p>实际上传时，每个任务里面再包一层重试，重试和暂停的写法见<a href="/questions/network-resumable-upload/">《浏览器分片上传如何实现可靠的暂停与续传？》</a>。还要注意注释里写的问题：这个池子在某个任务失败后不会停，生产代码要加一个停止标志，让 worker 不再领新任务。</p>
<h2>服务端怎样合并和存储</h2>
<p>分片可以先存在服务端的临时目录或临时存储里，按“会话 ID 加序号”命名。分片乱序到达也没关系，合并时按序号拼接。合并前先确认分片数量齐全，合并后校验总大小和整体哈希，不一致就让客户端重传，校验通过才把文件移到正式存储，并把会话标记为完成。</p>
<p>合并接口要能重复调用。客户端调用合并后可能因为超时没收到响应，再调一次时，服务端发现会话已经完成，直接返回同一个文件地址，不要合并第二遍。</p>
<p>文件很大时，也可以不经过业务服务器，直接传到对象存储。业务服务器只负责管理会话、签发分片上传凭证，合并交给对象存储的分片上传接口完成，见<a href="/questions/network-object-storage-multipart/">《浏览器直传对象存储时，如何设计安全的分片上传？》</a>。对象存储的分片上传接口通常有最小分片大小和最大分片数的限制，要按所用服务的文档来定。</p>
<p>最后是清理。很多上传会中途放弃，服务端给每个会话设过期时间，到期删除临时分片，否则存储会被半截的文件占满。</p>
<h2>服务端怎样限流</h2>
<p>客户端的并发池只能约束守规矩的客户端，服务端还要自己限流，比如限制每个用户同时进行的会话数和每秒接收的分片数。超过限额时返回 <code>429 Too Many Requests</code>。MDN 说明 429 表示客户端在给定时间内发送了太多请求，响应里可以带 <code>Retry-After</code>，表示要等多久再发下一个请求。客户端收到 429 后按 <code>Retry-After</code> 或指数退避等待，再重传这一片。</p>
<h2>常见追问</h2>
<p><strong>为什么不一次性上传整个文件？</strong></p>
<blockquote>
<p>单个请求失败就得从头再来，而且很容易碰到网关对请求体大小和超时时间的限制。</p>
</blockquote>
<p><strong>能直接传到对象存储吗？</strong></p>
<blockquote>
<p>可以。由服务端签发分片上传凭证，前端直接传给对象存储，减轻业务服务器的带宽压力。</p>
</blockquote>`};export{e as default};