var e={answerHtml:`<h2>简答</h2>
<ul>
<li>本地优先：用户编辑后先写入 IndexedDB，界面立即更新，不等网络。</li>
<li>待同步队列也存在 IndexedDB 中，标签页关闭或页面被回收后不会丢失。</li>
<li>每个操作带 <code>id</code>（客户端生成的 UUID）和 <code>baseVersion</code>（基于的服务端版本）；服务端按 <code>id</code> 去重，重复发送不会重复写入。</li>
<li>网络错误、超时、5xx、429 按指数退避重试；400 这类请求错误重试也不会成功，要标记失败；409 版本冲突进入冲突处理。</li>
<li>冲突处理：字段级合并、后写覆盖、或保留两份让用户选择，按业务决定；同步成功后才从队列删除操作。</li>
</ul>
<h2>队列中的一条记录</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> change = {
  <span class="hljs-attr">id</span>: crypto.<span class="hljs-title function_">randomUUID</span>(),
  <span class="hljs-attr">docId</span>: <span class="hljs-string">&#x27;note-42&#x27;</span>,
  <span class="hljs-attr">baseVersion</span>: <span class="hljs-number">7</span>,
  <span class="hljs-attr">patch</span>: { <span class="hljs-attr">title</span>: <span class="hljs-string">&#x27;新标题&#x27;</span> },
  <span class="hljs-attr">attempts</span>: <span class="hljs-number">0</span>,
  <span class="hljs-attr">lastError</span>: <span class="hljs-literal">null</span>,
};
</code></pre></div>
<h2>同步循环</h2>
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
<ul>
<li>同一文档的操作按顺序发送，遇到错误就停下，避免后面的操作基于错误的版本。</li>
<li>退避间隔逐次加倍并加随机抖动，避免大量客户端同时重试。</li>
</ul>
<h2>冲突处理</h2>
<p>服务端发现 <code>baseVersion</code> 与当前版本不同时返回 409，并带上服务端最新内容。客户端可以：</p>
<ul>
<li>修改的字段不重叠时自动合并。</li>
<li>重叠时展示两个版本，让用户选择保留哪一个。</li>
<li>对计数器、集合这类数据，使用 CRDT（如 Yjs、Automerge）自动合并。</li>
</ul>
<p>&quot;最后写入覆盖&quot;实现最简单，但会静默丢失其他设备上的修改，只适合不重要的数据。</p>
<h2>后台同步</h2>
<p>Background Sync API 可以在页面关闭后、网络恢复时由 Service Worker 触发同步，但目前只有 Chromium 系浏览器支持。不支持的浏览器在页面打开时、<code>online</code> 事件和定时检查中同步。</p>
<h2>注意点</h2>
<ul>
<li>显示同步状态：已保存到本地、同步中、同步失败、存在冲突。</li>
<li>不同用户共用设备时，本地数据库按用户隔离，登出时清理。</li>
<li>存储可能被浏览器清除，重要数据可以调用 <code>navigator.storage.persist()</code> 申请持久化。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li>为什么不能只用一个 <code>isSynced</code> 标记？它无法表达&quot;本地有新编辑，同时上一次请求正在重试&quot;这类状态，也无法保留待发送的内容。</li>
<li>服务端怎么实现幂等？保存已处理的操作 ID 及其结果，收到重复 ID 时直接返回之前的结果。</li>
</ul>`};export{e as default};