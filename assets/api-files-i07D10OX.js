var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>上传头像前先在页面上预览，就会用到这三样东西。<code>Blob</code> 是一段不可变的二进制数据，有 <code>size</code> 和 <code>type</code>。<code>File</code> 继承自 <code>Blob</code>，多了文件名 <code>name</code> 和修改时间 <code>lastModified</code>。</p>
<p>网页不能自己去读本地路径，只有用户通过 <code>&lt;input type=&quot;file&quot;&gt;</code>、拖放或粘贴交出来的文件，网页才拿得到。</p>
<p>预览时用 <code>URL.createObjectURL(file)</code>，它返回一个 <code>blob:</code> 开头的短地址，直接赋给 <code>img.src</code> 就能显示，不用读成 base64。要读内容就用 <code>blob.text()</code>、<code>blob.arrayBuffer()</code> 或 <code>blob.stream()</code>。</p>
<p>要注意 object URL 会一直占着内存，直到调用 <code>URL.revokeObjectURL()</code> 或页面卸载。还有 <code>file.type</code> 是按扩展名猜的，不可信，服务端必须重新校验。</p>
</blockquote>
<h2>做一个图片预览</h2>
<p>下面监听文件选择框，用户选了图片就显示出来。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">let</span> previewUrl;

input.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;change&#x27;</span>, <span class="hljs-function">() =&gt;</span> {
  <span class="hljs-keyword">const</span> file = input.<span class="hljs-property">files</span>?.[<span class="hljs-number">0</span>];
  <span class="hljs-keyword">if</span> (!file) <span class="hljs-keyword">return</span>;
  <span class="hljs-keyword">if</span> (!file.<span class="hljs-property">type</span>.<span class="hljs-title function_">startsWith</span>(<span class="hljs-string">&#x27;image/&#x27;</span>)) {
    <span class="hljs-title function_">showError</span>(<span class="hljs-string">&#x27;请选择图片文件&#x27;</span>);
    <span class="hljs-keyword">return</span>;
  }

  <span class="hljs-keyword">if</span> (previewUrl) <span class="hljs-variable constant_">URL</span>.<span class="hljs-title function_">revokeObjectURL</span>(previewUrl);
  previewUrl = <span class="hljs-variable constant_">URL</span>.<span class="hljs-title function_">createObjectURL</span>(file);
  preview.<span class="hljs-property">src</span> = previewUrl;
});
</code></pre></div>
<p>为什么每次换图前要先 <code>revokeObjectURL</code>？因为 object URL 只是一个指向内存数据的“门牌号”，只要门牌号还在，浏览器就不敢回收那块数据。用户换十次图，不释放就会占着十份图片的内存。所以每次换图先释放上一张，组件卸载时也要释放。</p>
<h2>File 就是带名字的 Blob</h2>
<p>下面用 Node 也能跑，看看 File 和 Blob 的关系。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> file = <span class="hljs-keyword">new</span> <span class="hljs-title class_">File</span>([<span class="hljs-string">&#x27;你好&#x27;</span>], <span class="hljs-string">&#x27;a.txt&#x27;</span>, { <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;text/plain&#x27;</span> });
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(file <span class="hljs-keyword">instanceof</span> <span class="hljs-title class_">Blob</span>); <span class="hljs-comment">// true</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(file.<span class="hljs-property">size</span>, file.<span class="hljs-property">name</span>); <span class="hljs-comment">// 6 a.txt</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-keyword">await</span> file.<span class="hljs-title function_">slice</span>(<span class="hljs-number">0</span>, <span class="hljs-number">3</span>).<span class="hljs-title function_">text</span>()); <span class="hljs-comment">// 你</span>
</code></pre></div>
<p><code>size</code> 是 6 而不是 2，因为它数的是字节，一个汉字用 UTF-8 编码占 3 个字节。<code>slice(0, 3)</code> 切出前 3 个字节，正好是“你”。</p>
<p><code>slice</code> 返回一个新的 Blob，不复制数据，所以大文件切片上传就是用 <code>file.slice(start, end)</code> 一块一块地传。</p>
<h2>object URL 和 data URL 怎么选</h2>
<p>data URL 是把文件内容编码成 base64 字符串，用 <code>FileReader.readAsDataURL()</code> 生成。它要先把整个文件读完，长度大约是文件大小的 1.33 倍，好处是它就是普通字符串，不用手动释放。</p>
<p>object URL 用 <code>URL.createObjectURL()</code> 同步生成，立即返回，地址很短，但要手动释放。</p>
<p>所以预览大图、视频用 object URL；需要把数据嵌进 HTML 或者存起来时，才用 data URL。</p>
<h2>常见追问</h2>
<p><strong>前端检查了文件类型，服务端还要查吗？</strong></p>
<blockquote>
<p>要。<code>file.type</code> 是浏览器根据扩展名推断的，把 exe 改名成 png 就能骗过去。前端检查只是给用户一个提示，服务端必须重新校验文件内容。</p>
</blockquote>
<p><strong>怎样让用户下载一段前端生成的文本？</strong></p>
<blockquote>
<p>用 <code>new Blob([text], { type: &#x27;text/plain&#x27; })</code> 生成 Blob，再用 object URL 赋给 <code>&lt;a download&gt;</code> 的 <code>href</code>，点击后释放这个地址。</p>
</blockquote>`};export{e as default};