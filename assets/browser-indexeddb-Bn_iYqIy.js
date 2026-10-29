var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>做一个离线笔记应用，要存几千条笔记和图片。localStorage 不合适：它是同步的，数据一大，读写就会卡住页面；而且只能存字符串，容量通常也就 5MB 左右。</p>
<p>IndexedDB 是浏览器里的数据库。它是异步的，读写不阻塞主线程；能直接存对象、<code>Blob</code>、<code>ArrayBuffer</code>，不用转成字符串；还能建索引、按范围查询。</p>
<p>所有读写都在事务里进行，失败时整体回滚。容量由浏览器的存储配额决定，通常比 localStorage 大得多。</p>
<p>代价是 API 比较底层。要注意两个坑：事务会自动提交，中间不能 <code>await</code> 网络请求；升级数据库版本时，其他标签页的旧连接会挡住升级。</p>
</blockquote>
<h2>先认识几个概念</h2>
<p>数据库有名字和版本号，用 <code>indexedDB.open(name, version)</code> 打开。版本号变大时会触发 <code>upgradeneeded</code> 事件，建表、建索引只能在这个事件里做。</p>
<p>IndexedDB 里的“表”叫对象仓库（object store），每条记录用 <code>keyPath</code> 指定的字段或者自增主键来标识。索引让你能按别的字段查，比如按 <code>updatedAt</code> 排序。</p>
<p>所有读写都要先开一个事务，指定是 <code>readonly</code> 还是 <code>readwrite</code>，以及要操作哪些对象仓库。</p>
<h2>先看一个例子</h2>
<p>下面打开笔记数据库，再保存一条笔记：</p>
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
<p>代码不短，因为原生 API 全是事件回调，要自己包成 Promise。实际项目一般用 <code>idb</code> 这类封装库，少写很多样板代码。</p>
<h2>为什么事务里不能 await 网络请求</h2>
<p>事务有个规则：当它没有待处理的请求时，就会自动提交。你在事务中间 <code>await fetch()</code>，等待网络的这段时间里事务没有请求要处理，于是先提交了。等数据回来再往里写，就会抛 <code>TransactionInactiveError</code>。</p>
<p>所以要先把网络数据取回来，再开事务写进去。</p>
<h2>版本升级为什么会卡住</h2>
<p>假设用户开着两个标签页，你上线了新版本，新标签页要把数据库从版本 1 升到 2。可是旧标签页还连着版本 1，升级就会被挡住，触发 <code>blocked</code>。</p>
<p>解决办法就是例子里那行：旧连接监听 <code>versionchange</code>，收到后调用 <code>db.close()</code>，把路让出来。</p>
<h2>数据一定能保住吗</h2>
<p>不一定。存储压力大时，浏览器可能清理数据。重要数据可以调用 <code>navigator.storage.persist()</code> 申请持久化，同时在服务端留备份。部分浏览器在隐私模式下容量很小，或者窗口一关数据就清掉了。</p>
<h2>常见追问</h2>
<p><strong>有了 IndexedDB，还用 localStorage 吗？</strong></p>
<blockquote>
<p>用。少量、同步读一下就够的配置，比如主题，用 localStorage 更省事。</p>
</blockquote>
<p><strong>IndexedDB 能跨源共享吗？</strong></p>
<blockquote>
<p>不能。它和 localStorage 一样按源隔离，每个源只能访问自己的数据库。</p>
</blockquote>`};export{e as default};