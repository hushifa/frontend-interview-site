var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>前端的 <code>accept</code> 属性和 <code>file.type</code>，其实来自文件扩展名或者系统的猜测，把 <code>evil.html</code> 改名成 <code>evil.png</code>，它就说是图片。所以前端检查只能用来提示用户，不能当安全判断，攻击者完全可以绕过页面直接调接口。</p>
<p>真正的防线在服务端。限制大小，扩展名用白名单，按文件内容开头的特征字节（叫魔数）识别类型，图片最好重新编码一遍，去掉隐藏的数据和元信息。存储时用服务端生成的随机名字，原始文件名只当元数据，防止路径穿越和覆盖。</p>
<p>提供下载时，用户文件放在独立的域名下，带上 <code>Content-Disposition: attachment</code> 和 <code>X-Content-Type-Options: nosniff</code>，避免它在主站的源下被当成 HTML 执行。</p>
<p>要注意 SVG，它可以包含脚本。不要把它直接插进页面 DOM，预览时用 <code>&lt;img&gt;</code> 加载，或者在服务端转成位图。</p>
</blockquote>
<h2>前端能做什么</h2>
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
<p>这些检查的作用是让用户早点知道文件不合格，不用等上传完才报错。可是它们都发生在用户自己的浏览器里，用户能改代码，也能直接发请求。所以服务端必须再检查一遍，而且要更严格。</p>
<h2>服务端要查哪些</h2>
<table><thead><tr><th>风险</th><th>措施</th></tr></thead><tbody><tr><td>超大文件、压缩炸弹</td><td>限制请求体大小、解压后的总大小和文件数</td></tr><tr><td>伪装类型</td><td>按内容识别类型，与扩展名都在白名单内才接受</td></tr><tr><td>路径穿越（<code>../../etc/passwd</code>）</td><td>不用原始文件名作路径</td></tr><tr><td>存储型 XSS</td><td>隔离域名、<code>nosniff</code>、强制下载或安全的 <code>Content-Type</code></td></tr><tr><td>恶意文件</td><td>病毒扫描，扫描通过前不对外可见</td></tr><tr><td>越权访问</td><td>下载接口校验权限，或使用短期签名链接</td></tr><tr><td>元数据泄露</td><td>去除图片的 EXIF（可能含地理位置）</td></tr></tbody></table>
<p>路径穿越是什么？如果服务端直接用用户给的文件名拼路径，文件名写成 <code>../../etc/passwd</code>，就可能写到上传目录外面去。用随机名字存储，这个问题就不存在了。</p>
<h2>为什么要放在单独的域名</h2>
<p>这是最容易被问到的一点。浏览器按源隔离数据。如果用户上传的一个 HTML 文件在主站的源下被打开，它里面的脚本就和主站的代码是“自己人”，能读写主站的 Cookie 和存储，这就成了存储型 XSS。放到 <code>usercontent.example</code> 这样的独立域名下，就算它执行了，也碰不到主站的数据。</p>
<p><code>nosniff</code> 是另一层保险。它告诉浏览器严格按 <code>Content-Type</code> 处理，不要自己去猜内容是什么类型，避免一个声明为图片的文件被浏览器“猜”成 HTML 执行。</p>
<h2>预览时的风险</h2>
<p>不要把上传的 HTML 或 SVG 读成字符串写进 <code>innerHTML</code>。SVG 用 <code>&lt;img&gt;</code> 加载时不会执行脚本；可是在新标签页里直接打开 SVG 文件，它会在所在的源下执行，这也是文件要放在隔离域名的原因。PDF、Office 文档的预览同样放在隔离源或沙箱 iframe 里。</p>
<h2>常见追问</h2>
<p><strong>为什么一定要单独的域名，同域名下换个路径不行吗？</strong></p>
<blockquote>
<p>不行。浏览器隔离的单位是源，也就是协议、主机和端口，路径不算。同一个域名下换路径，上传的 HTML 照样能读写主站的 Cookie 和存储。</p>
</blockquote>
<p><strong>大文件上传怎么做？</strong></p>
<blockquote>
<p>见<a href="/questions/network-object-storage-multipart/">《浏览器直传对象存储时，如何设计安全的分片上传？》</a>。</p>
</blockquote>`};export{e as default};