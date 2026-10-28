var e={answerHtml:`<h2>简答</h2>
<ul>
<li>IndexedDB 是异步 API，读写不会阻塞主线程；localStorage 是同步的，数据大时会卡住页面。</li>
<li>它能直接存对象、<code>Blob</code>、<code>ArrayBuffer</code>，不需要序列化成字符串。</li>
<li>支持索引和按范围查询，所有读写都在事务里，失败时整体回滚。</li>
<li>容量由浏览器的存储配额决定，通常远大于 localStorage 的约 5MB。</li>
</ul>
<h2>核心概念</h2>
<ul>
<li><strong>数据库与版本</strong>：<code>indexedDB.open(name, version)</code>。版本号变大时触发 <code>upgradeneeded</code>，只能在这个事件里创建或修改对象仓库和索引。</li>
<li><strong>对象仓库（object store）</strong>：类似表，用 <code>keyPath</code> 或自增主键标识记录。</li>
<li><strong>索引</strong>：按某个字段查询，例如按 <code>updatedAt</code> 排序。</li>
<li><strong>事务</strong>：<code>readonly</code> 或 <code>readwrite</code>，作用于指定的对象仓库。</li>
</ul>
<h2>示例</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">openDB</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">return</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Promise</span>(<span class="hljs-function">(<span class="hljs-params">resolve, reject</span>) =&gt;</span> {
    <span class="hljs-keyword">const</span> request = indexedDB.<span class="hljs-title function_">open</span>(<span class="hljs-string">&#x27;notes&#x27;</span>, <span class="hljs-number">2</span>);
    request.<span class="hljs-property">onupgradeneeded</span> = <span class="hljs-function">() =&gt;</span> {
      <span class="hljs-keyword">const</span> db = request.<span class="hljs-property">result</span>;
      <span class="hljs-keyword">if</span> (!db.<span class="hljs-property">objectStoreNames</span>.<span class="hljs-title function_">contains</span>(<span class="hljs-string">&#x27;notes&#x27;</span>)) {
        <span class="hljs-keyword">const</span> store = db.<span class="hljs-title function_">createObjectStore</span>(<span class="hljs-string">&#x27;notes&#x27;</span>, { <span class="hljs-attr">keyPath</span>: <span class="hljs-string">&#x27;id&#x27;</span> });
        store.<span class="hljs-title function_">createIndex</span>(<span class="hljs-string">&#x27;byUpdatedAt&#x27;</span>, <span class="hljs-string">&#x27;updatedAt&#x27;</span>);
      }
    };
    request.<span class="hljs-property">onsuccess</span> = <span class="hljs-function">() =&gt;</span> {
      <span class="hljs-keyword">const</span> db = request.<span class="hljs-property">result</span>;
      <span class="hljs-comment">// 其他标签页要升级版本时关闭旧连接，避免阻塞对方</span>
      db.<span class="hljs-property">onversionchange</span> = <span class="hljs-function">() =&gt;</span> db.<span class="hljs-title function_">close</span>();
      <span class="hljs-title function_">resolve</span>(db);
    };
    request.<span class="hljs-property">onerror</span> = <span class="hljs-function">() =&gt;</span> <span class="hljs-title function_">reject</span>(request.<span class="hljs-property">error</span>);
    request.<span class="hljs-property">onblocked</span> = <span class="hljs-function">() =&gt;</span> <span class="hljs-title function_">reject</span>(<span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">&#x27;其他标签页仍在使用旧版本数据库&#x27;</span>));
  });
}

<span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">saveNote</span>(<span class="hljs-params">note</span>) {
  <span class="hljs-keyword">const</span> db = <span class="hljs-keyword">await</span> <span class="hljs-title function_">openDB</span>();
  <span class="hljs-keyword">return</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Promise</span>(<span class="hljs-function">(<span class="hljs-params">resolve, reject</span>) =&gt;</span> {
    <span class="hljs-keyword">const</span> tx = db.<span class="hljs-title function_">transaction</span>(<span class="hljs-string">&#x27;notes&#x27;</span>, <span class="hljs-string">&#x27;readwrite&#x27;</span>);
    tx.<span class="hljs-title function_">objectStore</span>(<span class="hljs-string">&#x27;notes&#x27;</span>).<span class="hljs-title function_">put</span>(note);
    tx.<span class="hljs-property">oncomplete</span> = <span class="hljs-function">() =&gt;</span> <span class="hljs-title function_">resolve</span>();
    tx.<span class="hljs-property">onerror</span> = <span class="hljs-function">() =&gt;</span> <span class="hljs-title function_">reject</span>(tx.<span class="hljs-property">error</span>);
    tx.<span class="hljs-property">onabort</span> = <span class="hljs-function">() =&gt;</span> <span class="hljs-title function_">reject</span>(tx.<span class="hljs-property">error</span> ?? <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">&#x27;事务已中止&#x27;</span>));
  });
}
</code></pre></div>
<p>实际项目一般用 <code>idb</code> 这类 Promise 封装，减少样板代码。</p>
<h2>容易出错的地方</h2>
<ul>
<li><strong>事务自动提交</strong>：事务在没有待处理请求时会自动提交。在事务中间 <code>await fetch()</code> 之类的外部操作，事务会先提交，后续请求抛出 <code>TransactionInactiveError</code>。需要网络数据时先取回再开事务。</li>
<li><strong>版本升级被阻塞</strong>：其他标签页还打开着旧版本连接时，新版本的升级会触发 <code>blocked</code>。旧连接应监听 <code>versionchange</code> 并调用 <code>db.close()</code>。</li>
<li><strong>数据可能被清除</strong>：存储压力大时浏览器可能清理数据。重要数据可以调用 <code>navigator.storage.persist()</code> 申请持久化，并保留服务端备份。</li>
<li><strong>隐私模式</strong>：部分浏览器在隐私模式下容量很小或数据随窗口关闭清除。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li>什么时候还用 localStorage：少量、同步读取就能满足的配置，例如主题。</li>
<li>IndexedDB 能跨源共享吗：不能，它和 localStorage 一样按源隔离。</li>
</ul>`};export{e as default};