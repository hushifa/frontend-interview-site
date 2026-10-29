var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>大文件不能一次传完，要切成小块分别上传，这叫分片。用 <code>file.slice(start, end)</code> 切，它返回一个新的 <code>Blob</code>，不会改动原文件。每片单独一个请求，哪片失败只重传哪片。</p>
<p>每个上传任务用文件内容的哈希来标识。上传前先拿哈希问服务端：如果服务端已经有完整文件，直接返回成功，这就是秒传；如果已经有一部分分片，只传缺的那些，这就是断点续传。算哈希要注意，<code>crypto.subtle.digest</code> 不支持流式输入，必须一次把数据全读进来，所以大文件通常放到 Web Worker 里，用支持增量计算的库来算，免得卡住主线程、占满内存。</p>
<p>并发用固定大小的任务池控制，常见是同时传 3 到 6 片。每片配合重试上限和 <code>AbortController</code>，就能做暂停和取消。</p>
<p>要特别注意秒传的安全问题。服务端拿到的只是一个哈希，证明不了客户端真的有这个文件。所以秒传只能给当前用户新建一条引用，不能把别人文件的访问权限交出去，必要时让客户端回传服务端随机指定的一段内容。抽样哈希不能拿来判定秒传。</p>
</blockquote>
<h2>整体流程是怎样的</h2>
<ol>
<li>选好文件后，在 Worker 里计算文件哈希。</li>
<li>调用“检查”接口，传上哈希、文件名和大小。返回“已存在”就是秒传，直接结束；否则返回已经上传过的分片序号列表。</li>
<li>跳过已有的分片，其余分片放进并发池上传。每个请求带上文件哈希、分片序号，还可以带分片自己的哈希。</li>
<li>全部成功后调用“合并”接口，服务端把分片拼起来并校验，返回最终的文件地址。</li>
</ol>
<p>分片状态以服务端记录为准。所以刷新页面以后，用户重新选同一个文件，算出同一个哈希，就能接着传。暂停、续传、合并校验和失败分类的细节见<a href="/questions/network-resumable-upload/">《浏览器分片上传如何实现可靠的暂停与续传？》</a>，这道题侧重秒传和并发。</p>
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
<p>实际上传时，每个任务里面再包一层重试：失败后按指数退避重试，超过次数就把整个上传标记为失败。</p>
<p>还要注意注释里写的问题：这个池子在某个任务失败后不会停。<code>Promise.all</code> 虽然立刻 reject 了，其他 worker 还在继续领任务。生产代码要加一个停止标志，让 worker 不再领新任务，再对进行中的请求调用 <code>abort()</code>，已经完成的分片保留下来，方便续传。</p>
<p>暂停也是同样的思路：对进行中的请求调用 <code>abort()</code>，并停止领取新任务。恢复时重新调用检查接口，拿到最新的已上传列表。取消请求的边界见<a href="/questions/api-abort/">《AbortController 能取消什么，不能取消什么？》</a>。</p>
<h2>上传进度怎么算</h2>
<p><code>fetch</code> 不提供上传进度事件，想要分片级别的进度，可以用 <code>XMLHttpRequest</code> 的 <code>upload.onprogress</code>。</p>
<p>总进度等于“已完成分片的字节数”加上“进行中分片已发送的字节数”。某一片重试时，要把它失败那次已经计入的字节扣掉，不然进度会超过 100%。</p>
<h2>常见追问</h2>
<p><strong>为什么不一次性上传整个文件？</strong></p>
<blockquote>
<p>单个请求失败就得从头再来，而且很容易碰到网关对请求体大小和超时时间的限制。</p>
</blockquote>
<p><strong>分片乱序到达怎么办？</strong></p>
<blockquote>
<p>服务端按序号存储，合并时按序号拼接，跟到达的先后没关系。</p>
</blockquote>
<p><strong>能直接传到对象存储吗？</strong></p>
<blockquote>
<p>可以。由服务端签发分片上传凭证，前端直接传给对象存储，减轻业务服务器的带宽压力。</p>
</blockquote>`};export{e as default};