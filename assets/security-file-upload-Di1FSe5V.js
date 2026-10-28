var e={answerHtml:`<h2>简答</h2>
<ul>
<li><code>accept</code> 属性和 <code>file.type</code> 来自文件扩展名或系统猜测，只能用于提示用户，不能作为安全判断。</li>
<li>服务端校验大小上限、扩展名白名单和文件内容（魔数），图片最好重新编码，去掉隐藏数据和元信息。</li>
<li>存储时用服务端生成的随机名称，原始文件名只作为元数据，防止路径穿越和覆盖。</li>
<li>用户上传的文件放在独立的域名下提供，带 <code>Content-Disposition: attachment</code> 和 <code>X-Content-Type-Options: nosniff</code>，避免在主站源下被当成 HTML 执行。</li>
<li>SVG 可以包含脚本，不要直接插入页面 DOM；预览时用 <code>&lt;img&gt;</code> 加载或在服务端转成位图。</li>
</ul>
<h2>前端做什么</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> <span class="hljs-variable constant_">MAX_SIZE</span> = <span class="hljs-number">10</span> * <span class="hljs-number">1024</span> * <span class="hljs-number">1024</span>;
<span class="hljs-keyword">const</span> <span class="hljs-variable constant_">ALLOWED</span> = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Set</span>([<span class="hljs-string">&#x27;image/png&#x27;</span>, <span class="hljs-string">&#x27;image/jpeg&#x27;</span>, <span class="hljs-string">&#x27;image/webp&#x27;</span>]);

input.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;change&#x27;</span>, <span class="hljs-function">() =&gt;</span> {
  <span class="hljs-keyword">const</span> file = input.<span class="hljs-property">files</span>[<span class="hljs-number">0</span>];
  <span class="hljs-keyword">if</span> (!file) <span class="hljs-keyword">return</span>;
  <span class="hljs-keyword">if</span> (file.<span class="hljs-property">size</span> &gt; <span class="hljs-variable constant_">MAX_SIZE</span>) <span class="hljs-keyword">return</span> <span class="hljs-title function_">showError</span>(<span class="hljs-string">&#x27;文件不能超过 10 MB&#x27;</span>);
  <span class="hljs-keyword">if</span> (!<span class="hljs-variable constant_">ALLOWED</span>.<span class="hljs-title function_">has</span>(file.<span class="hljs-property">type</span>)) <span class="hljs-keyword">return</span> <span class="hljs-title function_">showError</span>(<span class="hljs-string">&#x27;只支持 PNG、JPEG、WebP&#x27;</span>);

  preview.<span class="hljs-property">src</span> = <span class="hljs-variable constant_">URL</span>.<span class="hljs-title function_">createObjectURL</span>(file);
  preview.<span class="hljs-property">onload</span> = <span class="hljs-function">() =&gt;</span> <span class="hljs-variable constant_">URL</span>.<span class="hljs-title function_">revokeObjectURL</span>(preview.<span class="hljs-property">src</span>);
});
</code></pre></div>
<p>这些检查让用户尽早得到反馈，服务端必须重复且更严格地校验。</p>
<h2>服务端检查清单</h2>
<table><thead><tr><th>风险</th><th>措施</th></tr></thead><tbody><tr><td>超大文件、压缩炸弹</td><td>限制请求体大小、解压后的总大小和文件数</td></tr><tr><td>伪装类型</td><td>按内容识别类型，与扩展名都在白名单内才接受</td></tr><tr><td>路径穿越（<code>../../etc/passwd</code>）</td><td>不用原始文件名作路径</td></tr><tr><td>存储型 XSS</td><td>隔离域名、<code>nosniff</code>、强制下载或安全的 <code>Content-Type</code></td></tr><tr><td>恶意文件</td><td>病毒扫描，扫描通过前不对外可见</td></tr><tr><td>越权访问</td><td>下载接口校验权限，或使用短期签名链接</td></tr><tr><td>元数据泄露</td><td>去除图片的 EXIF（可能含地理位置）</td></tr></tbody></table>
<h2>预览时的风险</h2>
<ul>
<li>不要把上传的 HTML 或 SVG 内容读成字符串写入 <code>innerHTML</code>。</li>
<li>在 <code>&lt;img&gt;</code> 中加载的 SVG 不会执行脚本；直接在新标签页打开 SVG 文件则会在其所在的源下执行，所以文件要放在隔离域名。</li>
<li>预览 PDF、Office 文档时同样放在隔离源或沙箱 iframe 中。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li>为什么要单独的域名？如果上传的 HTML 在主站源下被打开，它的脚本就能读写主站的 Cookie 和存储。</li>
<li>大文件上传怎么做？见<a href="/questions/network-object-storage-multipart/">《浏览器直传对象存储时，如何设计安全的分片上传？》</a>。</li>
</ul>`};export{e as default};