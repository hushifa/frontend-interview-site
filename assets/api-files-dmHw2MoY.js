var e={answerHtml:`<p>Blob 表示一段不可变的二进制数据，File 在 Blob 基础上增加 name、lastModified 等文件信息。用户通过文件选择器或拖放把 File 交给页面后，页面可以读取这份数据，但不会因此获得任意扫描磁盘的权限。</p>
<p>File 也不等于可写文件句柄。拿到一个头像 File，可以预览或上传，却不能直接修改用户原来的本地图片。</p>
<h3>根据用途选择读取方式</h3>
<p>小文本可以用 file.text()，需要字节时用 arrayBuffer()，大文件可评估 stream() 增量处理。FileReader 提供事件式读取与 abort 等能力，适合需要相应兼容或事件接口的场景。</p>
<p>text 或 arrayBuffer 会把结果整体交给你，文件很大时会增加内存和后续解析成本。即使读取是异步的，大段 JSON.parse 或图像处理仍可能占用主线程。</p>
<p>Blob.slice 可以表示某个字节范围，但切片边界不一定是完整字符或业务记录；按块解析仍要处理编码和协议边界。</p>
<h3>object URL 让元素引用 Blob，不必先转 Base64</h3>
<p>URL.createObjectURL(file) 返回一个 blob: 地址，可以交给 img、video 或下载链接。它通常比先 readAsDataURL 更适合普通预览，因为不必将全部二进制编码成更大的 Base64 字符串。</p>
<p>下面管理一个预览位置当前拥有的 URL：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">createImagePreview</span>(<span class="hljs-params">image</span>) {
  <span class="hljs-keyword">let</span> currentUrl = <span class="hljs-literal">null</span>;

  <span class="hljs-keyword">function</span> <span class="hljs-title function_">clear</span>(<span class="hljs-params"></span>) {
    image.<span class="hljs-title function_">removeAttribute</span>(<span class="hljs-string">&#x27;src&#x27;</span>);
    <span class="hljs-keyword">if</span> (currentUrl !== <span class="hljs-literal">null</span>) {
      <span class="hljs-variable constant_">URL</span>.<span class="hljs-title function_">revokeObjectURL</span>(currentUrl);
      currentUrl = <span class="hljs-literal">null</span>;
    }
  }

  <span class="hljs-keyword">return</span> {
    <span class="hljs-title function_">show</span>(<span class="hljs-params">file</span>) {
      <span class="hljs-title function_">clear</span>();
      currentUrl = <span class="hljs-variable constant_">URL</span>.<span class="hljs-title function_">createObjectURL</span>(file);
      image.<span class="hljs-property">src</span> = currentUrl;
    },
    <span class="hljs-attr">dispose</span>: clear,
  };
}
</code></pre></div>
<p>更换文件时释放旧地址，预览区域销毁时调用 dispose。这个辅助函数只管理 URL 生命周期，调用方仍需处理文件类型、解码失败和用户提示。</p>
<p>每次 createObjectURL 都会创建新的地址，即使传的是同一个 Blob，也应分别管理。不要在组件每次渲染时创建新 URL，却从不释放旧的。</p>
<h3>不要过早撤销仍在使用的地址</h3>
<p>如果刚设置 src 就立即 revoke，资源可能还没读完。即使图片 load 已触发，用户还可能需要右键保存或在新页面打开，因此应根据实际使用周期撤销，而不是机械地在第一次加载完成后清掉。</p>
<p>反过来，只依赖页面关闭时自动清理，会让长期打开的应用保留大量预览资源。应把 URL 所有权放在明确的组件或对象中，复用和释放都有清楚入口。</p>
<p>object URL 不是可长期分享的公网地址，也不是原文件绝对路径。把它存入数据库或发送给另一个用户，不能期待对方之后直接访问同一份文件。</p>
<h3>MIME 与文件名只是线索</h3>
<p>file.type 可能为空，也可能不准确；后缀可以随意改名。accept 属性只是选择提示，不能替代真正的内容验证。上传服务仍需按业务校验格式、大小和权限。</p>
<p>不要把外部 HTML 或 SVG 源码直接插入主页面作为“预览”。Blob URL 只是引用数据，不会净化内容；不同预览容器拥有不同执行与隔离语义，应按内容类型设计安全展示。</p>
<h3>选择、读取和上传是不同阶段</h3>
<p>用户取消选择通常不应显示“上传失败”。读取成功不代表上传成功，上传完成也不代表服务端已经完成扫描或业务处理。界面应按实际阶段反馈，支持取消和重新选择。</p>
<p>文件选择控件中的 fakepath 不是可供页面访问的真实磁盘路径。若要持续编辑并保存到用户选择的文件，应使用支持的文件句柄方案并处理授权，或者提供下载副本，而不是试图从 File.name 拼出本地写入地址。</p>`};export{e as default};