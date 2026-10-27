var e={answerHtml:`<h2>上传成功不等于模型可以使用</h2>
<p>用户选择一张图片后，前端可能先生成本地预览，再上传原文件，服务端进行安全扫描和格式转换，最后提取文字或生成缩略图，模型才能真正使用它。音频还可能需要转码和语音识别，PDF 可能只提取部分页面。</p>
<p>如果界面只显示一个 <code>loading</code>，用户无法知道文件是否仍在本机、上传是否完成、解析是否失败，或者模型是否已经收到。多附件场景还会出现一张失败、其他成功的部分状态。</p>
<h2>为每个附件建立独立任务</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">type</span> <span class="hljs-title class_">Attachment</span> = {
  <span class="hljs-attr">id</span>: <span class="hljs-built_in">string</span>;
  <span class="hljs-attr">name</span>: <span class="hljs-built_in">string</span>;
  <span class="hljs-attr">phase</span>: <span class="hljs-string">&#x27;local&#x27;</span> | <span class="hljs-string">&#x27;uploading&#x27;</span> | <span class="hljs-string">&#x27;processing&#x27;</span> | <span class="hljs-string">&#x27;ready&#x27;</span>
    | <span class="hljs-string">&#x27;failed&#x27;</span> | <span class="hljs-string">&#x27;removed&#x27;</span>;
  <span class="hljs-attr">progress</span>?: <span class="hljs-built_in">number</span>;
  <span class="hljs-attr">serverFileId</span>?: <span class="hljs-built_in">string</span>;
  <span class="hljs-attr">error</span>?: <span class="hljs-built_in">string</span>;
};

<span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">prepareFile</span>(<span class="hljs-params"><span class="hljs-attr">file</span>: <span class="hljs-title class_">File</span>, <span class="hljs-attr">update</span>: (a: Attachment) =&gt; <span class="hljs-built_in">void</span></span>) {
  <span class="hljs-keyword">const</span> <span class="hljs-attr">attachment</span>: <span class="hljs-title class_">Attachment</span> = {
    <span class="hljs-attr">id</span>: crypto.<span class="hljs-title function_">randomUUID</span>(),
    <span class="hljs-attr">name</span>: file.<span class="hljs-property">name</span>,
    <span class="hljs-attr">phase</span>: <span class="hljs-string">&#x27;local&#x27;</span>,
  };
  <span class="hljs-title function_">update</span>(attachment);

  <span class="hljs-keyword">try</span> {
    <span class="hljs-title function_">update</span>({ ...attachment, <span class="hljs-attr">phase</span>: <span class="hljs-string">&#x27;uploading&#x27;</span>, <span class="hljs-attr">progress</span>: <span class="hljs-number">0</span> });
    <span class="hljs-keyword">const</span> uploaded = <span class="hljs-keyword">await</span> <span class="hljs-title function_">uploadFile</span>(file, <span class="hljs-function">(<span class="hljs-params">progress</span>) =&gt;</span> {
      <span class="hljs-title function_">update</span>({ ...attachment, <span class="hljs-attr">phase</span>: <span class="hljs-string">&#x27;uploading&#x27;</span>, progress });
    });
    <span class="hljs-keyword">const</span> processing = { ...attachment, <span class="hljs-attr">phase</span>: <span class="hljs-string">&#x27;processing&#x27;</span>, <span class="hljs-attr">serverFileId</span>: uploaded.<span class="hljs-property">id</span> };
    <span class="hljs-title function_">update</span>(processing);
    <span class="hljs-keyword">await</span> <span class="hljs-title function_">waitUntilParsed</span>(uploaded.<span class="hljs-property">id</span>);
    <span class="hljs-title function_">update</span>({ ...processing, <span class="hljs-attr">phase</span>: <span class="hljs-string">&#x27;ready&#x27;</span>, <span class="hljs-attr">progress</span>: <span class="hljs-number">1</span> });
  } <span class="hljs-keyword">catch</span> (error) {
    <span class="hljs-title function_">update</span>({ ...attachment, <span class="hljs-attr">phase</span>: <span class="hljs-string">&#x27;failed&#x27;</span>, <span class="hljs-attr">error</span>: <span class="hljs-title function_">getErrorMessage</span>(error) });
  }
}
</code></pre></div>
<p>这里的 <code>progress: 1</code> 只表示解析任务结束，不能把上传进度直接当成模型可用状态。发送按钮要明确产品规则：必须等全部附件 ready，还是允许先发送文字、附件后台处理。未就绪附件不能被静默丢弃。</p>
<h2>本地预览和模型输入不是同一份数据</h2>
<p>本地预览可能显示原图，但服务端为了尺寸、方向、隐私或成本做了缩放和裁剪。PDF 可能只处理前几页，扫描件可能无法提取文字，低质量音频可能识别失败。重要转换应在界面说明，避免用户以为模型看到了完整原件。</p>
<p>文件名、扩展名和 MIME 只能作为体验提示，服务端仍要验证真实格式、大小和解压后的体积，并检查用户是否有权访问。上传内容不能直接当作 HTML、脚本或带宏文档执行，预览应使用隔离策略。</p>
<p><code>URL.createObjectURL</code> 生成的预览在替换或移除后要 revoke；摄像头和麦克风还要停止 track，录音器、音频节点和上传流也要清理。删除预览卡片不等于后台任务自动停止。</p>
<h2>取消、重试和迟到事件要按阶段处理</h2>
<p>取消本地读取、停止上传、取消服务端解析和停止模型生成不是同一个动作。文件已经上传成功后，用户取消生成，是否保留服务端文件要由生命周期策略决定。</p>
<p>用户移除附件后，原任务可能仍返回成功。事件必须带附件 ID 和版本，前端发现附件已移除或版本不一致时丢弃迟到结果，并在服务端清理孤儿文件。重试上传应使用上传会话或幂等键，避免同一文件被重复保存；重试生成则可以复用已解析文件，但要重新检查权限和有效期。</p>
<p>页面刷新或断网恢复时，应从服务端重新查询任务状态，不能从本地的 <code>loading</code> 推断解析是否仍在运行。状态未知时要明确展示待核对，而不是直接让用户再次执行有副作用的操作。</p>
<h2>输出也需要分片状态</h2>
<p>回答可能先流出文字，再完成图片、音频或引用。每个输出片段需要独立的 ID、类型、顺序和完成状态；网络 chunk 不是最终文件。资源下载完成后还可能需要解码和播放准备。</p>
<p>历史记录应保存受控的资源引用和过期策略。临时 URL 失效时重新换取访问地址，不要把临时地址当成永久链接。模型生成的 Markdown、HTML、链接和文件仍是不可信内容，前端要按普通用户内容做安全渲染和协议限制。</p>
<p>没有麦克风权限时应允许文字输入，音频结果可以提供文字版本，图片解析失败要说明替代方式。验收要覆盖多附件部分失败、弱网重试、权限拒绝、超大文件、后台恢复和临时 URL 失效。</p>`};export{e as default};