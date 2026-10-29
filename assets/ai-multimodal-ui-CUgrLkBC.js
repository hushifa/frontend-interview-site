var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>文件上传完了，模型还不一定能用。服务端通常还要扫描病毒、转码、提取文字，这些都做完，附件才算就绪。</p>
<p>所以每个附件都是一个独立的任务，有自己的 ID 和状态：本地、上传中、处理中、就绪、失败。传多个附件时，允许其中一部分失败。</p>
<p>还要注意，用户看到的预览是原文件，模型收到的可能是缩小、裁剪过的，或者只提取了部分页面。重要的转换要告诉用户。</p>
<p>资源要记得释放：用 <code>URL.createObjectURL</code> 生成的预览地址，不用了要调 <code>revokeObjectURL</code>；麦克风和摄像头的 track 要调 <code>stop()</code>。用户移除附件以后，旧任务迟到的结果要按附件 ID 丢掉。</p>
</blockquote>
<h2>一个附件要经历哪些状态</h2>
<p>下面的函数处理一个文件从选中到就绪的全过程。注意看 <code>current</code> 这个变量，每一步都基于它更新。</p>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">type</span> <span class="hljs-title class_">Attachment</span> = {
  <span class="hljs-attr">id</span>: <span class="hljs-built_in">string</span>;
  <span class="hljs-attr">name</span>: <span class="hljs-built_in">string</span>;
  <span class="hljs-attr">phase</span>: <span class="hljs-string">&#x27;local&#x27;</span> | <span class="hljs-string">&#x27;uploading&#x27;</span> | <span class="hljs-string">&#x27;processing&#x27;</span> | <span class="hljs-string">&#x27;ready&#x27;</span> | <span class="hljs-string">&#x27;failed&#x27;</span>;
  <span class="hljs-attr">progress</span>?: <span class="hljs-built_in">number</span>;
  <span class="hljs-attr">serverFileId</span>?: <span class="hljs-built_in">string</span>;
  <span class="hljs-attr">error</span>?: <span class="hljs-built_in">string</span>;
};

<span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">prepareFile</span>(<span class="hljs-params"><span class="hljs-attr">file</span>: <span class="hljs-title class_">File</span>, <span class="hljs-attr">update</span>: (a: Attachment) =&gt; <span class="hljs-built_in">void</span></span>) {
  <span class="hljs-keyword">let</span> <span class="hljs-attr">current</span>: <span class="hljs-title class_">Attachment</span> = { <span class="hljs-attr">id</span>: crypto.<span class="hljs-title function_">randomUUID</span>(), <span class="hljs-attr">name</span>: file.<span class="hljs-property">name</span>, <span class="hljs-attr">phase</span>: <span class="hljs-string">&#x27;local&#x27;</span> };
  <span class="hljs-title function_">update</span>(current);

  <span class="hljs-keyword">try</span> {
    current = { ...current, <span class="hljs-attr">phase</span>: <span class="hljs-string">&#x27;uploading&#x27;</span>, <span class="hljs-attr">progress</span>: <span class="hljs-number">0</span> };
    <span class="hljs-title function_">update</span>(current);
    <span class="hljs-keyword">const</span> uploaded = <span class="hljs-keyword">await</span> <span class="hljs-title function_">uploadFile</span>(file, <span class="hljs-function">(<span class="hljs-params">progress</span>) =&gt;</span> <span class="hljs-title function_">update</span>({ ...current, progress }));

    current = { ...current, <span class="hljs-attr">phase</span>: <span class="hljs-string">&#x27;processing&#x27;</span>, <span class="hljs-attr">serverFileId</span>: uploaded.<span class="hljs-property">id</span> };
    <span class="hljs-title function_">update</span>(current);
    <span class="hljs-keyword">await</span> <span class="hljs-title function_">waitUntilParsed</span>(uploaded.<span class="hljs-property">id</span>);

    current = { ...current, <span class="hljs-attr">phase</span>: <span class="hljs-string">&#x27;ready&#x27;</span> };
    <span class="hljs-title function_">update</span>(current);
  } <span class="hljs-keyword">catch</span> (error) {
    <span class="hljs-comment">// current 里保留了 serverFileId，失败后服务端可以据此清理文件</span>
    <span class="hljs-title function_">update</span>({ ...current, <span class="hljs-attr">phase</span>: <span class="hljs-string">&#x27;failed&#x27;</span>, <span class="hljs-attr">error</span>: <span class="hljs-title function_">getErrorMessage</span>(error) });
  }
}
</code></pre></div>
<p>为什么要用一个 <code>current</code> 一直往下传？因为解析失败的时候，文件其实已经传上去了。<code>current</code> 里保存着已经拿到的 <code>serverFileId</code>，失败状态里也带着它，服务端就能根据这个 ID 把没用的文件清理掉。如果每一步各写各的对象，失败时很容易把这个 ID 丢了。</p>
<p>发送按钮的规则要事先定好：是等所有附件都就绪才能发，还是允许先发文字、附件在后台继续处理。不管选哪种，都不能把没就绪的附件悄悄丢掉。</p>
<h2>用户看到的和模型收到的不一样</h2>
<p>服务端可能为了尺寸和成本把图片缩小，PDF 只处理前面若干页，扫描出来的图片版 PDF 可能根本提取不到文字。用户以为模型看到了整份文件，其实没有。所以界面上要写清楚，比如“已压缩到 xx 像素”“仅分析前 20 页”。</p>
<p>文件的扩展名和 MIME 类型都是可以伪造的，只能拿来给用户提示。服务端要自己验证真实格式和大小。预览时也不能把上传的内容当成 HTML 或脚本去执行。</p>
<h2>取消、移除和刷新</h2>
<p>取消上传、取消服务端解析、停止模型生成，是三件不同的事，要分别处理。</p>
<p>用户移除了一个附件，可是原来的上传请求还在路上，过一会儿可能返回“成功”。所以事件要带上附件 ID，前端发现这个附件已经被移除了，就丢掉结果，同时通知服务端清理。</p>
<p>刷新页面以后，附件处理到哪一步了，要去服务端查，不要根据本地的 loading 状态去猜。</p>
<h2>常见追问</h2>
<p><strong>重试上传会不会产生重复文件？</strong></p>
<blockquote>
<p>可能会。可以用上传会话 ID 或者幂等键，让服务端认出这是同一个文件，不再存第二份。</p>
</blockquote>
<p><strong>用户没给麦克风权限怎么办？</strong></p>
<blockquote>
<p>提供文字输入作为替代。反过来，如果模型输出的是语音，也要提供文字版本。</p>
</blockquote>`};export{e as default};