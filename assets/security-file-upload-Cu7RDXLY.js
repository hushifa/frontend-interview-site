var e={answerHtml:`<h2>简答</h2>
<ul>
<li>上传安全覆盖保存、处理、预览和下载全过程。</li>
<li>accept 和 file.type 只是提示，服务端按用途识别内容并重编码。</li>
<li>原文件名不能直接做存储路径，应使用随机标识。</li>
<li>预览和下载会重新解释文件，不可信 HTML/SVG 不能放进主页面的 innerHTML。</li>
</ul>
<p>文件上传的安全问题不只发生在“选择文件”时，还包括服务器保存、后台处理、页面预览和下载。一个文件可能上传时只是字节，预览时却被浏览器当作 HTML 执行，或者解压时写到原本不允许的位置。</p>
<p>因此，前端限制负责尽早提示用户，服务端和文件分发层才负责建立不能绕过的边界。</p>
<h2>accept 和 file.type 不能证明内容安全</h2>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">input</span> <span class="hljs-attr">type</span>=<span class="hljs-string">&quot;file&quot;</span> <span class="hljs-attr">accept</span>=<span class="hljs-string">&quot;image/png,image/jpeg&quot;</span> /&gt;</span>
</code></pre></div>
<p>accept 主要是文件选择器提示，不是上传防火墙。用户可以绕过界面直接构造请求；File.type 也不是完整的内容识别结果，可能为空或与实际内容不符。把一个文件改成 .jpg 后缀，不会让里面的 HTML 自动变成图片。</p>
<p>前端仍然值得做大小、数量和类型提示，例如头像上传只接受不超过 5 MiB 的 PNG/JPEG：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">validateAvatar</span>(<span class="hljs-params">file</span>) {
  <span class="hljs-keyword">if</span> (!file) <span class="hljs-keyword">return</span> <span class="hljs-string">&#x27;请选择头像&#x27;</span>;
  <span class="hljs-keyword">if</span> (file.<span class="hljs-property">size</span> === <span class="hljs-number">0</span>) <span class="hljs-keyword">return</span> <span class="hljs-string">&#x27;文件为空&#x27;</span>;
  <span class="hljs-keyword">if</span> (file.<span class="hljs-property">size</span> &gt; <span class="hljs-number">5</span> * <span class="hljs-number">1024</span> * <span class="hljs-number">1024</span>) <span class="hljs-keyword">return</span> <span class="hljs-string">&#x27;头像不能超过 5 MiB&#x27;</span>;
  <span class="hljs-keyword">if</span> (![<span class="hljs-string">&#x27;image/png&#x27;</span>, <span class="hljs-string">&#x27;image/jpeg&#x27;</span>].<span class="hljs-title function_">includes</span>(file.<span class="hljs-property">type</span>)) {
    <span class="hljs-keyword">return</span> <span class="hljs-string">&#x27;请选择 PNG 或 JPEG 图片&#x27;</span>;
  }
  <span class="hljs-keyword">return</span> <span class="hljs-literal">null</span>;
}
</code></pre></div>
<p>返回 null 只代表通过客户端体验检查，不代表服务器可以省略验证。前端拒绝后缀或 MIME 的策略还应与服务端实际支持的格式保持一致，避免用户反复试错。</p>
<h2>服务端应该验证“将如何使用它”</h2>
<p>头像业务通常不需要接受任意文件。服务端应限制请求大小、数量与允许格式，结合内容特征和安全的解析器识别文件，再按业务需求解码、重编码。只检查前几个字节的文件签名仍不够，因为恶意或畸形内容可能通过浅层检查。</p>
<p>图片还要限制像素尺寸和处理资源消耗，防止小文件解码成巨大图像。压缩包则要考虑解压后的总大小、文件数量、路径穿越以及符号链接等问题，不能只限制压缩包本身的体积。涉及文档处理时，还要评估解析库漏洞、宏或嵌入内容，并按风险采用扫描或内容重建。</p>
<p>这些措施各有边界，杀毒扫描不是“扫描通过就绝对安全”的证明，处理库也需要更新并运行在受限环境中。</p>
<h2>文件名不要直接变成存储路径</h2>
<p>原文件名适合作为展示信息，不适合直接拼接服务器路径。服务端可以生成随机存储标识，把原始名称作为经过处理的元数据保存，避免重名覆盖、路径穿越和特殊字符造成的问题。</p>
<p>下载接口应按文件 ID 查询并检查当前用户权限，不能仅凭“URL 很难猜”授权。若使用对象存储直传，签名凭证应限制目标对象、有效期及可约束的上传条件；上传完成后的内容检查仍然必要。前端能拿到直传地址，不意味着它应拿到永久存储密钥。</p>
<h2>预览和下载会重新解释文件</h2>
<p>不要把不可信 HTML、SVG 源码直接赋给主页面的 innerHTML。Markdown 渲染也应使用安全配置，不能随意开启原始 HTML。不同嵌入方式的权限并不相同：SVG 作为 img 图片与作为独立文档或内联 SVG，不能按同一种执行环境理解。</p>
<p>本地使用 URL.createObjectURL 只是得到文件的访问地址，没有净化文件。预览结束后应释放不再使用的对象 URL，避免长期占用内存；但释放 URL 也不是安全扫描。</p>
<p>公开分发不可信文件时，可以使用与主应用隔离的来源，避免共享敏感 Cookie；设置正确 Content-Type，按用途选择 Content-Disposition: attachment，并结合 X-Content-Type-Options: nosniff。不要把任意用户文件作为主应用同源可执行页面提供。attachment 和 nosniff 各有适用范围，不能取代内容校验和权限控制。</p>
<p>最后还要限制上传频率、存储配额和下载流量，防止资源耗尽；使用 Cookie 登录的上传接口也需要 CSRF 防护。前端的进度条、取消和错误提示改善体验，真正的文件授权与清理规则必须由服务端落实。</p>`};export{e as default};