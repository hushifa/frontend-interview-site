var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>离线同步的思路是本地优先：用户改了东西，先写进浏览器里的 IndexedDB，界面立刻更新，不用等网络。还没发出去的修改放进一个待同步队列，这个队列也存在 IndexedDB 里，所以标签页关了、页面被回收了，也不会丢。</p>
<p>每个操作带两样东西：一个客户端生成的唯一 <code>id</code>，和它基于的服务端版本 <code>baseVersion</code>。服务端按 <code>id</code> 去重，同一个操作发了两次也只写一次，这叫幂等。</p>
<p>失败了要分情况。网络错误、超时、5xx、429 这类是暂时的，按指数退避重试；400 这类是请求本身有问题，重试多少次都不会成功，要标记失败；409 是版本冲突，进入冲突处理。</p>
<p>冲突怎么处理要看业务：可以按字段合并，可以后写覆盖，也可以保留两份让用户选。要注意，只有同步成功了，才能把操作从队列里删掉。</p>
</blockquote>
<h2>队列里的一条记录长什么样</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> change = {
  <span class="hljs-attr">id</span>: crypto.<span class="hljs-title function_">randomUUID</span>(),
  <span class="hljs-attr">docId</span>: <span class="hljs-string">&#x27;note-42&#x27;</span>,
  <span class="hljs-attr">baseVersion</span>: <span class="hljs-number">7</span>,
  <span class="hljs-attr">patch</span>: { <span class="hljs-attr">title</span>: <span class="hljs-string">&#x27;新标题&#x27;</span> },
  <span class="hljs-attr">attempts</span>: <span class="hljs-number">0</span>,
  <span class="hljs-attr">lastError</span>: <span class="hljs-literal">null</span>,
};
</code></pre></div>
<p><code>id</code> 用来让服务端去重，<code>baseVersion</code> 表示“我是在第 7 版的基础上改的”，服务端靠它发现冲突。<code>attempts</code> 和 <code>lastError</code> 记录重试了几次、上次为什么失败。</p>
<h2>同步循环怎么写</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">flush</span>(<span class="hljs-params">queue</span>) {
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> change <span class="hljs-keyword">of</span> <span class="hljs-keyword">await</span> queue.<span class="hljs-title function_">list</span>()) {
    <span class="hljs-keyword">let</span> res;
    <span class="hljs-keyword">try</span> {
      res = <span class="hljs-keyword">await</span> <span class="hljs-title function_">fetch</span>(<span class="hljs-string">\`/api/docs/<span class="hljs-subst">\${change.docId}</span>\`</span>, {
        <span class="hljs-attr">method</span>: <span class="hljs-string">&#x27;PATCH&#x27;</span>,
        <span class="hljs-attr">headers</span>: { <span class="hljs-string">&#x27;Content-Type&#x27;</span>: <span class="hljs-string">&#x27;application/json&#x27;</span>, <span class="hljs-string">&#x27;Idempotency-Key&#x27;</span>: change.<span class="hljs-property">id</span> },
        <span class="hljs-attr">body</span>: <span class="hljs-title class_">JSON</span>.<span class="hljs-title function_">stringify</span>({ <span class="hljs-attr">baseVersion</span>: change.<span class="hljs-property">baseVersion</span>, <span class="hljs-attr">patch</span>: change.<span class="hljs-property">patch</span> }),
      });
    } <span class="hljs-keyword">catch</span> {
      <span class="hljs-keyword">await</span> queue.<span class="hljs-title function_">retryLater</span>(change); <span class="hljs-comment">// 网络错误：退避后重试</span>
      <span class="hljs-keyword">return</span>; <span class="hljs-comment">// 保持顺序，后面的操作暂不发送</span>
    }

    <span class="hljs-keyword">if</span> (res.<span class="hljs-property">ok</span>) {
      <span class="hljs-keyword">const</span> { version } = <span class="hljs-keyword">await</span> res.<span class="hljs-title function_">json</span>();
      <span class="hljs-keyword">await</span> queue.<span class="hljs-title function_">remove</span>(change.<span class="hljs-property">id</span>);
      <span class="hljs-keyword">await</span> queue.<span class="hljs-title function_">rebase</span>(change.<span class="hljs-property">docId</span>, version); <span class="hljs-comment">// 后续操作基于新版本</span>
    } <span class="hljs-keyword">else</span> <span class="hljs-keyword">if</span> (res.<span class="hljs-property">status</span> === <span class="hljs-number">409</span>) {
      <span class="hljs-keyword">await</span> queue.<span class="hljs-title function_">markConflict</span>(change, <span class="hljs-keyword">await</span> res.<span class="hljs-title function_">json</span>());
      <span class="hljs-keyword">return</span>;
    } <span class="hljs-keyword">else</span> <span class="hljs-keyword">if</span> (res.<span class="hljs-property">status</span> &gt;= <span class="hljs-number">500</span> || res.<span class="hljs-property">status</span> === <span class="hljs-number">429</span>) {
      <span class="hljs-keyword">await</span> queue.<span class="hljs-title function_">retryLater</span>(change);
      <span class="hljs-keyword">return</span>;
    } <span class="hljs-keyword">else</span> {
      <span class="hljs-keyword">await</span> queue.<span class="hljs-title function_">markFailed</span>(change, res.<span class="hljs-property">status</span>); <span class="hljs-comment">// 4xx：需要人工处理</span>
      <span class="hljs-keyword">return</span>;
    }
  }
}

<span class="hljs-variable language_">window</span>.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;online&#x27;</span>, <span class="hljs-function">() =&gt;</span> <span class="hljs-title function_">flush</span>(queue));
</code></pre></div>
<p>注意每个失败分支后面都有 <code>return</code>。为什么一出错就整个停下，而不是跳过这条、接着发下一条？因为同一文档的操作是有先后的，后一条是在前一条的基础上改的。前一条没成功就发后一条，它依据的版本就是错的。</p>
<p>成功的时候，服务端会返回新版本号。<code>rebase</code> 把队列里同一文档后续操作的 <code>baseVersion</code> 更新成这个新版本，下一条才能正确提交。</p>
<p>重试的间隔要逐次加倍，再加一点随机抖动。不加抖动的话，网络一恢复，大量客户端会在同一时刻一起重试，把服务器打垮。</p>
<h2>版本冲突怎么处理</h2>
<p>服务端发现 <code>baseVersion</code> 和当前版本对不上，说明别人在这期间改过了。这时返回 409，并带上服务端最新的内容。</p>
<p>客户端有几种处理方式。双方改的字段不重叠，就自动合并。改到同一个字段了，就把两个版本都展示出来，让用户选保留哪个。计数器、集合这类数据，可以用 CRDT 库，比如 Yjs、Automerge，自动合并。</p>
<p>“最后写入覆盖”实现起来最简单，可它会悄悄丢掉其他设备上的修改，只适合不重要的数据。</p>
<h2>页面关了还能同步吗</h2>
<p>Background Sync API 可以在页面关掉以后、网络恢复时，由 Service Worker 触发同步。但它目前只有 Chromium 系的浏览器支持。不支持的浏览器，就在页面打开时、<code>online</code> 事件触发时，以及定时检查时去同步。</p>
<h2>还要注意什么</h2>
<p>同步状态要让用户看得到：已保存到本地、同步中、同步失败、存在冲突。</p>
<p>几个人共用一台设备时，本地数据库要按用户隔离，登出时清理干净。</p>
<p>浏览器在存储空间紧张时可能会清掉本地数据。重要数据可以调用 <code>navigator.storage.persist()</code> 申请持久化。</p>
<h2>常见追问</h2>
<p><strong>为什么不能只用一个 <code>isSynced</code> 标记？</strong></p>
<blockquote>
<p>它表达不了“本地又有新编辑，同时上一次请求还在重试”这种状态，也存不下待发送的内容是什么。</p>
</blockquote>
<p><strong>服务端怎么实现幂等？</strong></p>
<blockquote>
<p>把处理过的操作 ID 和处理结果存下来。收到重复的 ID，直接返回之前的结果，不再执行一遍。</p>
</blockquote>`};export{e as default};