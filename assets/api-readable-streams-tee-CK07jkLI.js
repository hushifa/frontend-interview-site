var e={answerHtml:`<p>一个下载页面常见这样的需求：内容一边流式展示给用户，一边保存到缓存；或者一个网络响应同时交给预览器和完整解析器。直接对同一个 <code>ReadableStream</code> 调两次 <code>getReader()</code> 会遇到锁错误，因为一个可读流在同一时刻只能有一个默认 reader。<code>tee()</code> 提供了一个明确的分流入口，但它不是免费的复制操作，也不会自动让两个消费者拥有独立的无限缓冲。</p>
<h2>tee 做的是分支，不是重新请求</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> response = <span class="hljs-keyword">await</span> <span class="hljs-title function_">fetch</span>(<span class="hljs-string">&#x27;/report.ndjson&#x27;</span>);
<span class="hljs-keyword">if</span> (!response.<span class="hljs-property">body</span>) <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">&#x27;响应没有正文&#x27;</span>);

<span class="hljs-keyword">const</span> [previewStream, archiveStream] = response.<span class="hljs-property">body</span>.<span class="hljs-title function_">tee</span>();

<span class="hljs-keyword">const</span> preview = <span class="hljs-title function_">consumePreview</span>(previewStream);
<span class="hljs-keyword">const</span> archive = <span class="hljs-title function_">saveToCache</span>(archiveStream);
<span class="hljs-keyword">await</span> <span class="hljs-title class_">Promise</span>.<span class="hljs-title function_">all</span>([preview, archive]);
</code></pre></div>
<p><code>tee()</code> 读取原始流，然后把每个 chunk 分别交给两个分支。它不会发送第二个 HTTP 请求，也不会把已经消费过的响应体从头恢复。调用 <code>tee()</code> 会取得原流的锁，原来的 <code>response.body</code> 不能再被另一个 reader 随意消费；两个返回分支各自可以获得自己的 reader 或交给 <code>pipeTo()</code>。</p>
<p>分支之间共享底层数据源，但消费进度可以不同。一个分支读得快时，另一个分支尚未读取的 chunk 需要暂存，直到慢分支继续读取。因此“两个消费者都拿到完整数据”并不等于“内存成本只有一份”。</p>
<h2>慢分支会把数据积压在内存里</h2>
<p>考虑一个用户只看预览的场景：预览器每次处理少量文本，缓存分支却因为磁盘或事务写入缓慢而长时间不读。原始网络流为了满足两个分支，可能继续把数据排队给慢分支。对大文件或无限流而言，这会带来持续增长的内存压力。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">consumePreview</span>(<span class="hljs-params">stream</span>) {
  <span class="hljs-keyword">const</span> reader = stream.<span class="hljs-title function_">getReader</span>();
  <span class="hljs-keyword">try</span> {
    <span class="hljs-keyword">while</span> (<span class="hljs-literal">true</span>) {
      <span class="hljs-keyword">const</span> { value, done } = <span class="hljs-keyword">await</span> reader.<span class="hljs-title function_">read</span>();
      <span class="hljs-keyword">if</span> (done) <span class="hljs-keyword">return</span>;
      <span class="hljs-keyword">await</span> <span class="hljs-title function_">renderSmallPreview</span>(value);
    }
  } <span class="hljs-keyword">finally</span> {
    reader.<span class="hljs-title function_">releaseLock</span>();
  }
}

<span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">saveToCache</span>(<span class="hljs-params">stream</span>) {
  <span class="hljs-comment">// 真实实现应使用有界写入、可恢复文件或后端存储。</span>
  <span class="hljs-keyword">const</span> reader = stream.<span class="hljs-title function_">getReader</span>();
  <span class="hljs-keyword">try</span> {
    <span class="hljs-keyword">while</span> (<span class="hljs-literal">true</span>) {
      <span class="hljs-keyword">const</span> { value, done } = <span class="hljs-keyword">await</span> reader.<span class="hljs-title function_">read</span>();
      <span class="hljs-keyword">if</span> (done) <span class="hljs-keyword">return</span>;
      <span class="hljs-keyword">await</span> <span class="hljs-title function_">writeChunk</span>(value);
    }
  } <span class="hljs-keyword">finally</span> {
    reader.<span class="hljs-title function_">releaseLock</span>();
  }
}
</code></pre></div>
<p>这段代码展示了两个独立消费循环，但没有替应用控制缓存容量。业务应给慢分支设置大小上限、暂停下载、降级为只预览，或改用服务端复制和独立的持久化上传。对于几十 MB 以上的文件，不能因为 <code>tee()</code> API 简洁就把两个完整副本都留在浏览器内存中。</p>
<h2>分支关闭不等于原流立即结束</h2>
<p>每个分支都可以被 <code>cancel()</code>，但底层源什么时候能停止，要结合另一个分支和源本身的状态。一个分支提前取消时，另一分支可能仍需要完整数据；如果两个分支都取消，底层流才有机会被取消。不能把取消一个预览分支理解成 HTTP 请求已经立刻中断。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">cancelPreview</span>(<span class="hljs-params">reader, reason</span>) {
  <span class="hljs-keyword">try</span> {
    <span class="hljs-keyword">await</span> reader.<span class="hljs-title function_">cancel</span>(reason);
  } <span class="hljs-keyword">finally</span> {
    reader.<span class="hljs-title function_">releaseLock</span>();
  }
}
</code></pre></div>
<p><code>releaseLock()</code> 只是释放 reader 对分支的占用，不会取消分支，也不会关闭网络连接。若用户离开页面并且两个分支都不再需要，应取消对应 reader 或通过 Fetch 的 <code>AbortController</code> 取消请求，再按顺序释放锁。清理过程也可能拒绝，生产代码要保留原始错误并记录取消失败，不能只调用 <code>releaseLock()</code> 让资源在后台继续流动。</p>
<h2>一个分支报错时，另一个分支不会自动变成业务成功</h2>
<p>流的错误传播和业务任务状态需要分开处理。解析分支遇到非法数据时，可以让它失败；缓存分支是否继续保存原始字节，取决于产品是否允许保留未验证的内容。直接 <code>Promise.all</code> 会让调用方很快收到一个拒绝，但另一个分支可能仍在读取或写入：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> results = <span class="hljs-keyword">await</span> <span class="hljs-title class_">Promise</span>.<span class="hljs-title function_">allSettled</span>([
  <span class="hljs-title function_">consumePreview</span>(previewStream),
  <span class="hljs-title function_">saveToCache</span>(archiveStream),
]);

<span class="hljs-keyword">if</span> (results.<span class="hljs-title function_">some</span>(<span class="hljs-function">(<span class="hljs-params">result</span>) =&gt;</span> result.<span class="hljs-property">status</span> === <span class="hljs-string">&#x27;rejected&#x27;</span>)) {
  <span class="hljs-comment">// 根据业务决定取消另一分支、删除临时缓存或保留可诊断状态。</span>
}
</code></pre></div>
<p>如果要求“预览失败就停止缓存”，应显式取消缓存分支并等待其结束，而不是假设 <code>Promise.all</code> 会自动取消另一个异步函数。反过来，缓存失败也不一定意味着已经展示给用户的预览必须消失；状态机要明确“可见内容”和“持久化结果”是否相互依赖。</p>
<h2>tee 与响应克隆不是完全相同的抽象</h2>
<p><code>Response.clone()</code> 常用于让两个代码路径分别读取响应体，底层也会产生分流语义；<code>response.body.tee()</code> 则直接作用于 ReadableStream，适合已经拿到流、需要控制两个分支的场景。两者都不能把大数据复制当成无成本操作，也都要处理慢消费者和取消。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> response = <span class="hljs-keyword">await</span> <span class="hljs-title function_">fetch</span>(<span class="hljs-string">&#x27;/data.json&#x27;</span>);
<span class="hljs-keyword">const</span> copy = response.<span class="hljs-title function_">clone</span>();

<span class="hljs-keyword">const</span> textPromise = response.<span class="hljs-title function_">text</span>();
<span class="hljs-keyword">const</span> jsonPromise = copy.<span class="hljs-title function_">json</span>();
<span class="hljs-keyword">const</span> [text, data] = <span class="hljs-keyword">await</span> <span class="hljs-title class_">Promise</span>.<span class="hljs-title function_">all</span>([textPromise, jsonPromise]);
</code></pre></div>
<p>这个示例只适合正文较小、确实需要两种完整解析结果的场景。对大型响应同时调用 <code>text()</code> 和 <code>json()</code> 会产生解析和内存成本；如果只是记录少量诊断字段，不要复制完整正文，应该在一个流式解析管线中提取所需数据并设置上限。</p>
<h2>需要自定义背压时，应该显式设计分流管线</h2>
<p>原生 tee 的分支需求有限。如果两个消费者需要完全不同的速率控制、丢弃策略或有界队列，可以创建中间 <code>TransformStream</code> 或自己的有界广播器。但自定义实现也必须处理写入返回的 Promise、消费者退出、错误和关闭，不是把 chunk 放进两个数组就完成了背压：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">publishToConsumers</span>(<span class="hljs-params">consumers, chunk</span>) {
  <span class="hljs-keyword">const</span> writes = consumers.<span class="hljs-title function_">map</span>(<span class="hljs-title function_">async</span> (consumer) =&gt; {
    <span class="hljs-keyword">const</span> writer = consumer.<span class="hljs-title function_">getWriter</span>();
    <span class="hljs-keyword">try</span> {
      <span class="hljs-keyword">await</span> writer.<span class="hljs-property">ready</span>;
      <span class="hljs-keyword">await</span> writer.<span class="hljs-title function_">write</span>(chunk);
    } <span class="hljs-keyword">finally</span> {
      writer.<span class="hljs-title function_">releaseLock</span>();
    }
  });

  <span class="hljs-comment">// 要求所有消费者跟上时，发布者等待最慢分支；容量上限和退出策略仍需另行维护。</span>
  <span class="hljs-keyword">await</span> <span class="hljs-title class_">Promise</span>.<span class="hljs-title function_">all</span>(writes);
}
</code></pre></div>
<p>示例不是生产级广播器：调用方仍要维护消费者的加入、退出、关闭竞态、单个消费者失败、chunk 所有权和队列大小。它想表达的是，若要求所有消费者都跟上，发布者必须等待它们；若允许慢消费者丢数据，则要明确丢弃、合并或断开规则。使用 <code>tee()</code> 还是自定义管线，要根据数据是否可重放、消费者数量、最大内存和错误隔离来选择。</p>
<h2>兼容性和验收重点</h2>
<p>ReadableStream 与 <code>tee()</code> 在现代浏览器和 Node.js 的 Web Streams 实现中都有支持，但具体的 Fetch、文件、Service Worker 和跨运行时行为仍应按项目目标版本验证。不能只因为本地浏览器能读取，就假设旧浏览器、SSR 进程或测试替身拥有完全相同的锁和取消语义。</p>
<p>验收至少包括：</p>
<ul>
<li>一个分支比另一个慢很多时，内存和网络是否仍有上限；</li>
<li>一个分支提前取消、另一个继续读取时，结果和连接状态是否符合预期；</li>
<li>两个分支都取消后，底层 Fetch、文件或设备资源是否真正结束；</li>
<li>解析错误、写入错误和网络错误发生在不同时间时，业务状态是否可解释；</li>
<li>页面卸载、组件卸载和请求超时后，reader 锁、定时器、缓存临时文件和 AbortSignal 是否清理；</li>
<li>大文件、无限流和恶意慢消费者是否会造成无限缓冲或重复解析。</li>
</ul>
<p><code>tee()</code> 的价值是把一次读取明确分成两个分支，方便组合预览、缓存和审计流程；它不是无限复制器，也不是自动背压和取消管理器。真正可靠的实现要把分支的速度、容量、错误、生命周期和业务结果一起建模。</p>`};export{e as default};