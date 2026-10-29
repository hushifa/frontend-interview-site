var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>做一个网页版编辑器，想要“打开本地文件，改完直接保存回去”，就用 File System Access API。<code>showOpenFilePicker()</code>、<code>showSaveFilePicker()</code>、<code>showDirectoryPicker()</code> 弹出系统的文件选择框，用户选完，网页拿到一个文件句柄（<code>FileSystemFileHandle</code> 或 <code>FileSystemDirectoryHandle</code>），可以理解成“这个文件的遥控器”。</p>
<p>这些选择器方法只有 Chromium 桌面浏览器支持，Firefox、Safari 和手机上都没有，所以要准备降级。</p>
<p>句柄可以存进 IndexedDB，下次打开页面还能用。但权限不一定还在，要先 <code>queryPermission()</code> 查询，必要时在用户点击里用 <code>requestPermission()</code> 重新申请。写入用 <code>createWritable()</code>，内容在 <code>close()</code> 之后才真正写到原文件，中途失败不会留下半个文件。</p>
<p>另外还有一个 OPFS（源私有文件系统），用 <code>navigator.storage.getDirectory()</code> 获取。所有主流浏览器都支持，适合存应用自己的数据文件，但用户在系统里看不到这些文件。</p>
</blockquote>
<h2>打开并保存文件</h2>
<p>下面打开一个文本文件，保存时写回同一个文件。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">let</span> handle;

<span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">openFile</span>(<span class="hljs-params"></span>) {
  [handle] = <span class="hljs-keyword">await</span> <span class="hljs-title function_">showOpenFilePicker</span>({
    <span class="hljs-attr">types</span>: [{ <span class="hljs-attr">description</span>: <span class="hljs-string">&#x27;文本&#x27;</span>, <span class="hljs-attr">accept</span>: { <span class="hljs-string">&#x27;text/plain&#x27;</span>: [<span class="hljs-string">&#x27;.txt&#x27;</span>, <span class="hljs-string">&#x27;.md&#x27;</span>] } }],
  });
  <span class="hljs-keyword">const</span> file = <span class="hljs-keyword">await</span> handle.<span class="hljs-title function_">getFile</span>();
  <span class="hljs-keyword">return</span> file.<span class="hljs-title function_">text</span>();
}

<span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">save</span>(<span class="hljs-params">text</span>) {
  <span class="hljs-keyword">if</span> (!handle) handle = <span class="hljs-keyword">await</span> <span class="hljs-title function_">showSaveFilePicker</span>({ <span class="hljs-attr">suggestedName</span>: <span class="hljs-string">&#x27;note.md&#x27;</span> });
  <span class="hljs-keyword">if</span> ((<span class="hljs-keyword">await</span> handle.<span class="hljs-title function_">queryPermission</span>({ <span class="hljs-attr">mode</span>: <span class="hljs-string">&#x27;readwrite&#x27;</span> })) !== <span class="hljs-string">&#x27;granted&#x27;</span>) {
    <span class="hljs-keyword">if</span> ((<span class="hljs-keyword">await</span> handle.<span class="hljs-title function_">requestPermission</span>({ <span class="hljs-attr">mode</span>: <span class="hljs-string">&#x27;readwrite&#x27;</span> })) !== <span class="hljs-string">&#x27;granted&#x27;</span>) {
      <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">&#x27;没有写入权限&#x27;</span>);
    }
  }
  <span class="hljs-keyword">const</span> writable = <span class="hljs-keyword">await</span> handle.<span class="hljs-title function_">createWritable</span>();
  <span class="hljs-keyword">await</span> writable.<span class="hljs-title function_">write</span>(text);
  <span class="hljs-keyword">await</span> writable.<span class="hljs-title function_">close</span>();
}
</code></pre></div>
<p>为什么保存前还要查权限？因为打开文件时用户只给了读权限，写入要另外申请 <code>readwrite</code>。句柄从 IndexedDB 里取出来时，权限也可能已经失效了。所以先查，不够就申请。</p>
<p>为什么中途失败不会弄坏原文件？因为 <code>createWritable()</code> 返回的流先写到一个临时位置，<code>close()</code> 的时候才替换原文件。<code>close()</code> 之前出了错，或者主动调用 <code>abort()</code>，原文件保持不变。</p>
<p>还有一种情况：用户在选择框里点了取消，Promise 会以 <code>AbortError</code> reject。这不是真错误，应当静默处理。</p>
<h2>不支持时怎么降级</h2>
<p>先检测：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> supportsPicker = <span class="hljs-string">&#x27;showOpenFilePicker&#x27;</span> <span class="hljs-keyword">in</span> <span class="hljs-variable language_">window</span>;
</code></pre></div>
<p>不支持的浏览器里，打开文件用 <code>&lt;input type=&quot;file&quot;&gt;</code>；保存文件就生成一个 Blob，用 <code>&lt;a download&gt;</code> 下载。区别是用户每次保存都会得到一个新下载的文件，没法写回原文件。</p>
<h2>OPFS 是什么</h2>
<p>OPFS 是浏览器给每个网站分配的私有文件空间：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> root = <span class="hljs-keyword">await</span> navigator.<span class="hljs-property">storage</span>.<span class="hljs-title function_">getDirectory</span>();
<span class="hljs-keyword">const</span> fileHandle = <span class="hljs-keyword">await</span> root.<span class="hljs-title function_">getFileHandle</span>(<span class="hljs-string">&#x27;cache.db&#x27;</span>, { <span class="hljs-attr">create</span>: <span class="hljs-literal">true</span> });
</code></pre></div>
<p>它不需要用户授权，数据按源隔离，受存储配额限制。在 Worker 里还可以用 <code>createSyncAccessHandle()</code> 同步读写，性能很高，SQLite 的 Wasm 版本就是用它存数据库的。</p>
<h2>安全上有哪些限制</h2>
<p>浏览器禁止选择系统目录等敏感位置。而且每次都必须由用户自己选，网页不能自己指定一个路径去读文件。</p>
<h2>常见追问</h2>
<p><strong>句柄存进 IndexedDB 以后，下次能直接写吗？</strong></p>
<blockquote>
<p>不一定。句柄还在，但权限可能已经没了。要先 <code>queryPermission()</code>，不是 <code>granted</code> 就在用户点击时调用 <code>requestPermission()</code> 重新申请。</p>
</blockquote>
<p><strong>OPFS 和选择器打开的文件有什么区别？</strong></p>
<blockquote>
<p>选择器打开的是用户磁盘上看得见的真实文件，只有 Chromium 桌面支持。OPFS 是网站私有的空间，所有主流浏览器都支持，但用户在系统文件管理器里看不到。</p>
</blockquote>`};export{e as default};