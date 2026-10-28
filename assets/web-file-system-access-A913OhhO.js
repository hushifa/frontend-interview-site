var e={answerHtml:`<h2>简答</h2>
<ul>
<li>File System Access API 通过用户选择获得文件句柄，权限范围由用户决定。</li>
<li>写入要通过 createWritable，等 close 完成才算保存。</li>
<li>文件可能在应用之外被修改，保存句柄也不代表保存了权限，再次使用前要重新确认。</li>
<li>它目前只有 Chromium 系浏览器支持；OPFS 与用户文件选择器是两套机制。</li>
</ul>
<p>普通文件选择得到 File，主要用于读取所选数据；File System Access 的选择器可以返回文件或目录句柄，让应用在授权范围内再次访问，甚至写回用户选择的位置。</p>
<p>句柄代表一种受权限控制的访问能力，不是网页拿到了整块磁盘，也不是一个可以自由拼接路径的普通字符串。</p>
<h2>用户选择与权限范围是入口</h2>
<p>showOpenFilePicker、showSaveFilePicker 等能力需要支持它们的浏览器、安全上下文及相应用户激活。系统文件选择器目前只有 Chromium 系桌面浏览器提供，Firefox 和 Safari 只支持 OPFS 部分。应从打开或保存按钮触发，并处理用户取消，而不是页面加载后自动扫描文件。</p>
<p>文件句柄可以通过 getFile 得到可读取的 File。保存到外部文件通常还需要 readwrite 权限，已有读取权限不等于写入权限。</p>
<p>句柄的 queryPermission/requestPermission 与 Permissions.query 不是同一个调用接口。重新打开页面后，即使保存过句柄，也可能需要重新确认权限；不应把曾经授权作为永久事实。</p>
<h2>一次完整保存要等待 close</h2>
<p>下面的函数从用户“另存为”操作中调用，text 已经准备好：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">saveTextFile</span>(<span class="hljs-params">text</span>) {
  <span class="hljs-keyword">if</span> (!<span class="hljs-variable language_">window</span>.<span class="hljs-property">showSaveFilePicker</span>) {
    <span class="hljs-keyword">return</span> { <span class="hljs-attr">saved</span>: <span class="hljs-literal">false</span>, <span class="hljs-attr">reason</span>: <span class="hljs-string">&#x27;unsupported&#x27;</span> };
  }

  <span class="hljs-keyword">let</span> handle;
  <span class="hljs-keyword">try</span> {
    handle = <span class="hljs-keyword">await</span> <span class="hljs-variable language_">window</span>.<span class="hljs-title function_">showSaveFilePicker</span>({
      <span class="hljs-attr">suggestedName</span>: <span class="hljs-string">&#x27;notes.txt&#x27;</span>,
      <span class="hljs-attr">types</span>: [{ <span class="hljs-attr">description</span>: <span class="hljs-string">&#x27;文本文件&#x27;</span>, <span class="hljs-attr">accept</span>: { <span class="hljs-string">&#x27;text/plain&#x27;</span>: [<span class="hljs-string">&#x27;.txt&#x27;</span>] } }],
    });
  } <span class="hljs-keyword">catch</span> (error) {
    <span class="hljs-keyword">if</span> (error?.<span class="hljs-property">name</span> === <span class="hljs-string">&#x27;AbortError&#x27;</span>) <span class="hljs-keyword">return</span> { <span class="hljs-attr">saved</span>: <span class="hljs-literal">false</span>, <span class="hljs-attr">reason</span>: <span class="hljs-string">&#x27;cancelled&#x27;</span> };
    <span class="hljs-keyword">throw</span> error;
  }

  <span class="hljs-keyword">const</span> writable = <span class="hljs-keyword">await</span> handle.<span class="hljs-title function_">createWritable</span>();
  <span class="hljs-keyword">try</span> {
    <span class="hljs-keyword">await</span> writable.<span class="hljs-title function_">write</span>(text);
    <span class="hljs-keyword">await</span> writable.<span class="hljs-title function_">close</span>();
    <span class="hljs-keyword">return</span> { <span class="hljs-attr">saved</span>: <span class="hljs-literal">true</span>, handle };
  } <span class="hljs-keyword">catch</span> (error) {
    <span class="hljs-keyword">try</span> {
      <span class="hljs-keyword">await</span> writable.<span class="hljs-title function_">abort</span>();
    } <span class="hljs-keyword">catch</span> {
      <span class="hljs-comment">// 流可能已经失败或关闭，保留原始保存错误。</span>
    }
    <span class="hljs-keyword">throw</span> error;
  }
}
</code></pre></div>
<p>write 完成不代表全部保存已经提交；应等待 close 成功再提示“已保存”。这种写入通常通过临时内容再替换目标实现，但应用仍需处理 close 失败，不能承诺任意系统崩溃场景下都绝对不会丢数据。</p>
<p>示例把选择器取消当作正常结果，其他权限、空间或 I/O 错误交给调用方显示。没有开启 keepExistingData 的写入通常从空内容开始，适合完整替换；局部编辑必须明确保留、seek 和 truncate 的语义，避免把原文件尾部处理错。</p>
<h2>文件可能在应用之外改变</h2>
<p>其他程序、浏览器标签页或用户都可能修改、移动、删除文件。之前拿到的 File 不一定永远能继续读取；需要时重新 getFile，并对读写错误给出恢复路径。</p>
<p>并发编辑不能只靠保存按钮解决。可记录上次读取时的元信息或内容版本，在保存前提示外部变化；严格冲突检测还应根据实际平台能力设计，不能把时间戳比较当成完美事务锁。</p>
<p>保存成功也不要自动丢弃所有内存草稿，尤其在需要撤销或错误恢复的编辑器中。文件写入与编辑历史是不同层次的状态。</p>
<h2>保存句柄不代表保存了权限</h2>
<p>支持的环境中可通过 IndexedDB 等结构化克隆机制保存句柄，便于下次继续选择记录。JSON.stringify 不是序列化文件能力的通用方法。</p>
<p>恢复后仍要查询权限并在适当用户操作时请求，处理授权拒绝、句柄无效和文件不存在。界面可以显示最近文件，但不能在用户不知情时把它们全部读取或写入。</p>
<h2>OPFS 与用户文件选择器要区分</h2>
<p>Origin Private File System 是来源私有的存储空间，用户通常不会像普通文档目录那样直接看到它。它适合应用内部数据和缓存，但受配额、清理及来源隔离约束。</p>
<p>拥有 OPFS 不等于支持系统文件选择器，也不等于可以写入用户 Documents 目录。同步访问句柄等能力还有执行环境限制，应按具体 API 使用，不要把整个 File System API 当成一个支持度完全相同的功能。</p>
<p>不支持外部句柄时，可退回 input type=&quot;file&quot; 读取与下载副本保存，但这通常不是对原文件直接覆盖。降级界面应说明差异，让用户知道保存在哪里，而不是仍显示同一套误导性的“已覆盖原文件”。</p>`};export{e as default};