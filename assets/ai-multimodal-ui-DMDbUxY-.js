var e={answerHtml:`<h2>简答</h2>
<ul>
<li>上传完成之后，服务端通常还要扫描、转码、提取文字，完成后模型才能使用附件。</li>
<li>每个附件是独立任务，有自己的 ID 和状态（本地、上传中、处理中、就绪、失败），多附件时允许部分失败。</li>
<li>本地预览是原文件，模型收到的可能是缩放、裁剪或只提取了部分页面的版本，重要的转换要告诉用户。</li>
<li>用 <code>URL.createObjectURL</code> 生成的预览不再使用时要 <code>revokeObjectURL</code>；麦克风和摄像头的 track 要 <code>stop()</code>。</li>
<li>移除附件后，旧任务的迟到结果要按附件 ID 和版本丢弃。</li>
</ul>
<h2>附件状态</h2>
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
<p><code>current</code> 始终保存最新状态，失败时不会丢掉已经拿到的 <code>serverFileId</code>。</p>
<p>发送按钮的规则要事先定好：等全部附件就绪才能发送，还是允许先发文字、附件在后台处理。未就绪的附件不能被悄悄丢掉。</p>
<h2>预览与实际输入</h2>
<ul>
<li>服务端可能为了尺寸和成本缩小图片，PDF 只处理前若干页，扫描件可能提取不到文字。界面上注明&quot;已压缩到 xx 像素&quot;&quot;仅分析前 20 页&quot;。</li>
<li>文件扩展名和 MIME 只用于提示，服务端要验证真实格式和大小，预览不能把上传内容当成 HTML 或脚本执行。</li>
</ul>
<h2>取消、移除与恢复</h2>
<ul>
<li>取消上传、取消服务端解析、停止模型生成是不同的操作，分别处理。</li>
<li>用户移除附件后，原来的上传可能仍然返回成功。事件带附件 ID，前端发现附件已移除就丢弃结果，并通知服务端清理。</li>
<li>刷新页面后，从服务端查询处理状态，不要根据本地的 loading 推测。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li><strong>重试上传会不会产生重复文件？</strong> 可能。用上传会话 ID 或幂等键，让服务端识别同一个文件。</li>
<li><strong>没有麦克风权限怎么办？</strong> 提供文字输入作为替代，音频输出也提供文字版本。</li>
</ul>`};export{e as default};