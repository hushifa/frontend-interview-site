var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p><code>Blob</code> 是一段不可变的二进制数据，有 <code>size</code> 和 <code>type</code>。<code>File</code> 继承自 <code>Blob</code>，多了文件名 <code>name</code> 和修改时间 <code>lastModified</code>，所以凡是收 Blob 的 API 都能直接收 File。</p>
<p>网页不能自己去读本地路径，只有用户通过 <code>&lt;input type=&quot;file&quot;&gt;</code>、拖放或粘贴交出来的文件，网页才拿得到。要读内容就用 <code>blob.text()</code>、<code>blob.arrayBuffer()</code> 或 <code>blob.stream()</code>；要切一段就用 <code>blob.slice()</code>，它返回新的 Blob。</p>
<p><code>URL.createObjectURL(blob)</code> 给这份数据生成一个 <code>blob:&lt;origin&gt;/&lt;uuid&gt;</code> 形式的地址，可以交给 <code>img</code>、<code>video</code>、<code>&lt;a download&gt;</code> 这类只认 URL 的 API。它只是一个指向内存数据的标识，不包含数据本身。</p>
<p>要注意它的生命周期：每调用一次都会生成一个新地址，只要还有一个地址有效，背后的数据就不能被垃圾回收。浏览器会在文档卸载时自动释放，单页应用里要自己在资源不再被用户访问时调用 <code>URL.revokeObjectURL()</code>。</p>
</blockquote>
<h2>File 就是带名字的 Blob</h2>
<p>下面用 Node 也能跑，看看 File 和 Blob 的关系。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> file = <span class="hljs-keyword">new</span> <span class="hljs-title class_">File</span>([<span class="hljs-string">&#x27;你好&#x27;</span>], <span class="hljs-string">&#x27;a.txt&#x27;</span>, { <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;text/plain&#x27;</span> });
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(file <span class="hljs-keyword">instanceof</span> <span class="hljs-title class_">Blob</span>); <span class="hljs-comment">// true</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(file.<span class="hljs-property">size</span>, file.<span class="hljs-property">name</span>); <span class="hljs-comment">// 6 a.txt</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-keyword">await</span> file.<span class="hljs-title function_">slice</span>(<span class="hljs-number">0</span>, <span class="hljs-number">3</span>).<span class="hljs-title function_">text</span>()); <span class="hljs-comment">// 你</span>
</code></pre></div>
<p><code>size</code> 是 6 而不是 2，因为它数的是字节，一个汉字用 UTF-8 编码占 3 个字节。<code>slice(0, 3)</code> 切出前 3 个字节，正好是“你”。</p>
<p>Blob 不可变，<code>slice</code> 不会改原来的 Blob，而是返回一个新的 Blob。大文件切片上传就是用 <code>file.slice(start, end)</code> 一块一块地传。</p>
<p><code>type</code> 也值得多看一眼。用户选的文件，<code>file.type</code> 是浏览器根据扩展名推断的，把 exe 改名成 png 就能骗过去，所以服务端必须按文件内容重新校验。</p>
<h2>object URL 的生命周期</h2>
<p>object URL 从 <code>createObjectURL</code> 生成开始有效，到下面两件事之一发生为止：调用 <code>URL.revokeObjectURL(url)</code>，或者创建它的文档卸载。</p>
<p>MDN 对内存管理写了三点。第一，同一个对象调用两次 <code>createObjectURL</code>，会得到两个不同的地址，每个都要单独释放。第二，只要有一个地址还有效，背后的对象就不能被回收，可能造成内存泄漏。第三，也不能释放得太早：图片 <code>load</code> 后立刻 revoke，用户就没法右键保存或在新标签打开这张图。所以长期运行的页面，应该在资源已经不再被用户访问时释放，比如图片从 DOM 上移除的时候。</p>
<p><code>revokeObjectURL</code> 本身很宽容：传入无效地址、不是 object URL 的字符串，或者已经释放过的地址，它什么都不做，不会报错。所以清理时不必先判断地址是否还有效。</p>
<p>下载一段前端生成的文本，就是一个完整的生命周期：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> blob = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Blob</span>([text], { <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;text/plain&#x27;</span> });
<span class="hljs-keyword">const</span> url = <span class="hljs-variable constant_">URL</span>.<span class="hljs-title function_">createObjectURL</span>(blob);
<span class="hljs-keyword">const</span> link = <span class="hljs-variable language_">document</span>.<span class="hljs-title function_">createElement</span>(<span class="hljs-string">&#x27;a&#x27;</span>);
link.<span class="hljs-property">href</span> = url;
link.<span class="hljs-property">download</span> = <span class="hljs-string">&#x27;notes.txt&#x27;</span>;
link.<span class="hljs-title function_">click</span>();
<span class="hljs-variable constant_">URL</span>.<span class="hljs-title function_">revokeObjectURL</span>(url);
</code></pre></div>
<p>上传前预览图片怎样接入文件选择框、换图时怎样释放上一个地址，以及和 <code>FileReader</code> 生成的 data URL 怎么选，见<a href="/questions/alg-image-upload-preview/">《图片上传前怎样本地预览？FileReader 和 URL.createObjectURL 有什么区别？》</a>。</p>
<h2>常见追问</h2>
<p><strong>object URL 能发给别人或存起来下次用吗？</strong></p>
<blockquote>
<p>不能。它的有效期跟着创建它的文档，文档卸载就失效；背后的数据在当前浏览器里，别的设备也打不开。要长期保存，得存 Blob 本身，比如放进 IndexedDB。</p>
</blockquote>
<p><strong>Service Worker 里能用 createObjectURL 吗？</strong></p>
<blockquote>
<p>不能。MDN 写明 <code>createObjectURL</code> 和 <code>revokeObjectURL</code> 在 Web Worker 里可用，但 Service Worker 除外，原因是 Blob 的生命周期问题和潜在的泄漏。</p>
</blockquote>`};export{e as default};