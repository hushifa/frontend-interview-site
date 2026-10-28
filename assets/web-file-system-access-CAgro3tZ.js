var e={answerHtml:`<h2>简答</h2>
<ul>
<li><code>showOpenFilePicker()</code>、<code>showSaveFilePicker()</code>、<code>showDirectoryPicker()</code> 弹出系统文件选择器，返回 <code>FileSystemFileHandle</code> 或 <code>FileSystemDirectoryHandle</code>。</li>
<li>这些选择器方法只有 Chromium 桌面浏览器支持，Firefox、Safari 和移动端都不支持。</li>
<li>句柄可以存进 IndexedDB，下次打开页面后要调用 <code>queryPermission()</code>，必要时在用户手势中用 <code>requestPermission()</code> 重新授权。</li>
<li>写入用 <code>createWritable()</code>，写入的内容在 <code>close()</code> 之后才落到原文件，中途失败不会留下半个文件。</li>
<li><code>navigator.storage.getDirectory()</code> 返回的 OPFS 所有主流浏览器都支持，适合应用自己的数据文件，用户在系统里看不到这些文件。</li>
</ul>
<h2>打开并保存文件</h2>
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
<p><code>createWritable()</code> 返回的流先写到临时位置，<code>close()</code> 时才替换原文件；<code>close()</code> 之前出错或调用 <code>abort()</code>，原文件保持不变。</p>
<p>用户取消选择器时，Promise 以 <code>AbortError</code> reject，应当静默处理。</p>
<h2>降级</h2>
<p>不支持时：</p>
<ul>
<li>打开文件：<code>&lt;input type=&quot;file&quot;&gt;</code>。</li>
<li>保存文件：生成 Blob，用 <code>&lt;a download&gt;</code> 下载。</li>
</ul>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> supportsPicker = <span class="hljs-string">&#x27;showOpenFilePicker&#x27;</span> <span class="hljs-keyword">in</span> <span class="hljs-variable language_">window</span>;
</code></pre></div>
<h2>OPFS</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> root = <span class="hljs-keyword">await</span> navigator.<span class="hljs-property">storage</span>.<span class="hljs-title function_">getDirectory</span>();
<span class="hljs-keyword">const</span> fileHandle = <span class="hljs-keyword">await</span> root.<span class="hljs-title function_">getFileHandle</span>(<span class="hljs-string">&#x27;cache.db&#x27;</span>, { <span class="hljs-attr">create</span>: <span class="hljs-literal">true</span> });
</code></pre></div>
<ul>
<li>不需要用户授权，数据按源隔离，受存储配额限制。</li>
<li>在 Worker 中可以用 <code>createSyncAccessHandle()</code> 同步读写，性能很高，SQLite 的 Wasm 版本就用它存储数据库。</li>
</ul>
<h2>安全限制</h2>
<ul>
<li>浏览器禁止选择系统目录等敏感位置。</li>
<li>每次都要由用户选择，网页不能自己指定路径读取文件。</li>
</ul>`};export{e as default};