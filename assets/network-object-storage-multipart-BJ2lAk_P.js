var e={answerHtml:`<h2>简答</h2>
<ul>
<li>大文件可以由浏览器直传对象存储，应用服务只负责鉴权和编排。</li>
<li>预签名 URL 必须固定对象键、方法、必要头和过期时间，不是通用上传凭证。</li>
<li>分片编号和 ETag 要来自同一个 uploadId；恢复时查询服务端已完成的分片。</li>
<li>完成和取消由服务端校验执行，文件类型不能靠扩展名判断。</li>
</ul>
<p>让浏览器把数 GB 文件先传到自己的 Node 服务，再由 Node 转发到对象存储，会让应用服务器承担额外带宽和连接压力。常见做法是由应用服务鉴权并创建上传会话，再为每个分片签发短期 URL，浏览器直接把内容发给对象存储，最后由应用服务确认并完成合并。</p>
<h2>预签名 URL 不是通用上传凭证</h2>
<p>预签名 URL 把“允许对某个对象执行某个操作”的权限和过期时间编码到 URL 中。服务端签发时必须固定对象键、HTTP 方法、必要的请求头和有效期；浏览器只能使用这条 URL 完成指定操作。不要让浏览器提交任意对象路径，也不要把云账号的长期密钥放进前端。</p>
<p>一个安全的会话流程如下：</p>
<ol>
<li>浏览器把文件大小、媒体类型和客户端生成的会话标识提交给应用服务。</li>
<li>应用服务检查用户权限和业务配额，在对象存储创建 multipart upload，返回 <code>uploadId</code>。</li>
<li>浏览器请求一批分片 URL，服务端只为合法的片段编号签发短期 URL。</li>
<li>浏览器直接上传分片，并保存对象存储返回的 <code>ETag</code> 或厂商要求的校验值。</li>
<li>浏览器把片段编号和校验值提交给应用服务；服务端重新校验会话归属后调用完成接口。</li>
</ol>
<p>URL 的有效期只限制“发起请求的时间窗口”，不能把它当成业务层的最终授权。应用服务仍应记录会话归属、最大文件大小、允许的 MIME 类型和过期时间，并在完成、取消或超时后更新状态。</p>
<p>S3 官方明确说明预签名 URL 是持有者凭证，在有效期内可多次使用，不是绑定当前浏览器的一次性票据。应用数据库把会话标成取消，不会自动撤销已经发出的存储访问能力，需要配合存储端取消、权限策略与短有效期。完整签名 URL 不应写入普通日志、分析事件或公开工单。</p>
<p>有效期还受到签名凭证生命周期影响：临时凭证先过期时，链接会提前失效。不能把到期理解成正在传输的请求必定立即终止；恢复时重新确认会话状态，再按需要重新签发。</p>
<h2>分片编号与校验值必须来自同一个上传会话</h2>
<p>对象存储通常要求每个片段有唯一编号，并在完成请求中按编号升序提交。客户端不能把不同文件或不同 <code>uploadId</code> 的 <code>ETag</code> 混在一起。<code>ETag</code> 在不同服务和加密方式下不一定是整个文件的 MD5，也不能无条件把它当作安全的内容摘要；应按具体对象存储的文档使用校验头或 SHA-256 等明确算法。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">uploadPresignedPart</span>(<span class="hljs-params">url, file, partNumber, partSize, signal</span>) {
  <span class="hljs-keyword">if</span> (!<span class="hljs-title class_">Number</span>.<span class="hljs-title function_">isSafeInteger</span>(partNumber) || partNumber &lt; <span class="hljs-number">1</span> ||
      !<span class="hljs-title class_">Number</span>.<span class="hljs-title function_">isSafeInteger</span>(partSize) || partSize &lt; <span class="hljs-number">1</span>) {
    <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">RangeError</span>(<span class="hljs-string">&#x27;片段编号和大小必须为正安全整数&#x27;</span>);
  }
  <span class="hljs-keyword">const</span> start = (partNumber - <span class="hljs-number">1</span>) * partSize;
  <span class="hljs-keyword">if</span> (!<span class="hljs-title class_">Number</span>.<span class="hljs-title function_">isSafeInteger</span>(start)) <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">RangeError</span>(<span class="hljs-string">&#x27;片段偏移超出安全整数范围&#x27;</span>);
  <span class="hljs-keyword">const</span> end = <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">min</span>(start + partSize, file.<span class="hljs-property">size</span>);
  <span class="hljs-keyword">if</span> (start &gt;= file.<span class="hljs-property">size</span>) <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">RangeError</span>(<span class="hljs-string">&#x27;片段起点超出文件大小&#x27;</span>);

  <span class="hljs-keyword">const</span> response = <span class="hljs-keyword">await</span> <span class="hljs-title function_">fetch</span>(url, {
    <span class="hljs-attr">method</span>: <span class="hljs-string">&#x27;PUT&#x27;</span>,
    <span class="hljs-attr">body</span>: file.<span class="hljs-title function_">slice</span>(start, end),
    signal,
  });
  <span class="hljs-keyword">if</span> (!response.<span class="hljs-property">ok</span>) <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">\`对象存储上传失败：HTTP <span class="hljs-subst">\${response.status}</span>\`</span>);

  <span class="hljs-keyword">const</span> etag = response.<span class="hljs-property">headers</span>.<span class="hljs-title function_">get</span>(<span class="hljs-string">&#x27;ETag&#x27;</span>);
  <span class="hljs-keyword">if</span> (!etag) <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">&#x27;响应没有返回完成上传所需的校验值&#x27;</span>);
  <span class="hljs-keyword">return</span> { partNumber, etag };
}
</code></pre></div>
<p>上面的示例假定签名时没有要求额外的 <code>Content-Type</code> 或校验头。如果签名把某个请求头纳入签名，浏览器发送的值必须完全一致；擅自补充或修改头部可能得到 403。跨源场景还需要对象存储的 CORS 规则允许 <code>PUT</code>，并暴露 <code>ETag</code> 等响应头，否则脚本虽然可能上传成功，却读不到完成合并所需的数据。</p>
<h2>恢复时查询服务端，而不是只看本地进度条</h2>
<p>页面刷新或网络中断后，浏览器应根据保存的 <code>uploadId</code> 向应用服务查询已完成分片。服务端再向对象存储查询该会话的片段列表，过滤掉已过期或不属于当前用户的会话。只保存“已上传到 60%”是不可靠的，因为最后几个片段可能完成、前面的某个片段却失败了。</p>
<p>如果 URL 已过期，客户端只重新申请缺失片段的 URL；不要为了方便重新创建会话并丢弃所有已完成片段。若对象存储不支持安全地复用旧会话，则由服务端明确返回“会话已失效”，客户端再从头创建，并清理旧会话。</p>
<h2>完成和取消都必须由服务端控制</h2>
<p>完成请求不能直接信任浏览器传来的片段列表。服务端至少要检查：</p>
<ul>
<li><code>uploadId</code> 属于当前用户且没有过期；</li>
<li>片段编号没有重复、没有缺失，数量和大小符合会话记录；</li>
<li>每个校验值来自对象存储查询结果，而不是只来自客户端；</li>
<li>合并后的对象键由服务端生成，不能使用未经处理的用户文件名。</li>
</ul>
<p>取消上传时调用对象存储的 abort 接口，定期任务还要清理客户端放弃后遗留的 multipart 会话。否则临时片段可能长期占用存储空间，即使最终对象从未生成。</p>
<p>完成接口应设计成幂等的：重复点击“完成”时，如果最终对象已经生成，就返回同一个资源标识；如果正在合并，则返回处理中状态；如果片段列表冲突，则拒绝请求而不是再次覆盖对象。对象发布前可以写入私有临时键，完成校验后再以服务端控制的方式发布，避免用户看到未完成文件。</p>
<h2>权限和文件类型不能由扩展名决定</h2>
<p>用户提供的文件名和扩展名都不可信。服务端应限制大小、数量和允许的业务类型，并在完成后重新检测实际内容。若对象会通过网站域名直接提供，HTML、SVG 或带脚本的内容可能造成存储型 XSS；常见措施包括使用独立资源域名、正确设置 <code>Content-Type</code> 和 <code>Content-Disposition</code>，以及禁止把不可信内容当作应用页面执行。</p>
<p>预签名 URL 会出现在浏览器网络记录、日志和用户复制的链接中，因此有效期应尽量短，并限制为单个对象和单个操作。不要把用户身份、长期令牌或内部路径编码进 URL 查询参数。涉及下载时同样要检查对象权限，不能因为“URL 已签名”就跳过业务授权。</p>
<h2>并发和分片大小要结合平台限制</h2>
<p>分片太小会增加签名请求、HTTP 请求和对象存储元数据开销；分片太大则让失败重试浪费更多流量。具体最小、最大分片数和单片大小由对象存储产品规定，不能直接套用其他厂商的限制。浏览器端应设置一个可配置的并发上限（例如 4），并根据失败率、网络变化和设备资源调整；不要一次性创建数千个 <code>fetch</code>。</p>
<p>移动网络切换、页面进入后台和浏览器被系统挂起都可能使请求中断。界面应区分“已保存的分片”和“当前请求”，暂停时取消未完成请求，恢复时重新查询状态。Service Worker 不能保证页面关闭后仍能无限期完成上传，真正需要后台上传时应采用平台提供的后台任务或原生能力，并为普通浏览器保留可恢复路径。</p>
<h2>何时不适合直传</h2>
<p>直传适合大文件、对象存储已经是系统的最终落点、且应用服务只负责鉴权和编排的场景。若文件必须经过服务端病毒扫描、内容转码、脱敏或逐字节审计，就不能在未检查的情况下直接公开对象；可以先上传到隔离桶，再由受控服务处理并转移。小文件或需要强同步事务的请求，普通应用接口往往更简单，也更容易统一错误处理。</p>
<h2>参考资料</h2>
<ul>
<li><a href="https://docs.aws.amazon.com/AmazonS3/latest/userguide/mpuoverview.html">Amazon S3 · Multipart upload overview</a></li>
<li><a href="https://docs.aws.amazon.com/AmazonS3/latest/userguide/using-presigned-url.html">Amazon S3 · Presigned URLs</a></li>
<li><a href="https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS">MDN · CORS</a></li>
<li><a href="https://developer.mozilla.org/en-US/docs/Web/API/File_API">MDN · File API</a></li>
</ul>`};export{e as default};