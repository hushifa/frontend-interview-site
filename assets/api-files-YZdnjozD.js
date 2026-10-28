var e={answerHtml:`<h2>简答</h2>
<ul>
<li><code>Blob</code> 表示一段不可变的二进制数据，有 <code>size</code> 和 <code>type</code>；<code>File</code> 继承自 <code>Blob</code>，多了 <code>name</code> 和 <code>lastModified</code>。</li>
<li>用户通过 <code>&lt;input type=&quot;file&quot;&gt;</code>、拖放或粘贴提供文件，网页才能读取，不能任意读取本地路径。</li>
<li><code>URL.createObjectURL(blob)</code> 返回 <code>blob:</code> 地址，可以直接赋给 <code>img.src</code> 或 <code>video.src</code> 预览，不需要读成 base64。</li>
<li>object URL 会一直占用内存，直到调用 <code>URL.revokeObjectURL()</code> 或文档卸载。</li>
<li>需要读取内容时用 <code>blob.text()</code>、<code>blob.arrayBuffer()</code> 或 <code>blob.stream()</code>。</li>
</ul>
<h2>图片预览</h2>
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
<p>每次换图都先释放上一张的地址；组件卸载时也要释放。</p>
<h2>object URL 和 data URL</h2>
<table><thead><tr><th></th><th>object URL</th><th>data URL</th></tr></thead><tbody><tr><td>生成方式</td><td><code>URL.createObjectURL()</code>，同步、立即返回</td><td><code>FileReader.readAsDataURL()</code>，要读完整个文件</td></tr><tr><td>长度</td><td>很短</td><td>文件大小的约 1.33 倍</td></tr><tr><td>生命周期</td><td>需要手动释放</td><td>是普通字符串</td></tr><tr><td>适合</td><td>预览大图、视频</td><td>需要把数据嵌入 HTML 或存储</td></tr></tbody></table>
<h2>注意事项</h2>
<ul>
<li><code>file.type</code> 来自扩展名，不可信。服务端必须重新校验文件内容，前端检查只用于提示。</li>
<li>大文件切片上传用 <code>file.slice(start, end)</code>，返回新的 Blob，不复制数据。</li>
<li>生成下载：<code>new Blob([text], { type: &#x27;text/plain&#x27; })</code>，用 object URL 赋给 <code>&lt;a download&gt;</code> 的 <code>href</code>，点击后释放。</li>
</ul>`};export{e as default};