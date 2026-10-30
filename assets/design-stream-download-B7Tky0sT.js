var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>比如用户要下载一个 2 GB 的导出包。最简单的做法是让浏览器自己下载：服务器响应带上 <code>Content-Disposition: attachment</code>，或者在同源链接上加 <code>download</code> 属性，数据不经过网页的 JavaScript。</p>
<p>常见的坑是先 <code>fetch</code> 再 <code>response.blob()</code>，然后用 object URL 触发下载。<code>blob()</code> 要把整个响应读完才返回，文件越大，占的内存越多，用户也要等全部下完才看到下载提示。所以只在需要请求头鉴权、或者文件是前端生成时才这样做，用完要 <code>revokeObjectURL</code>。</p>
<p>断点续传用 Range 请求：记下已经收到的字节数，下次发 <code>Range: bytes=已收到-</code>，同时带 <code>If-Range</code> 确认文件没变。服务器返回 206 就接着写，返回 200 说明拿到的是完整文件，只能从头开始。想边下边写磁盘，可以用 <code>showSaveFilePicker</code> 让用户选位置，把响应流 <code>pipeTo</code> 写进文件；也可以让 Service Worker 拦截下载地址，返回一个流式的 <code>Response</code>。</p>
<p>要注意，<code>download</code> 属性只对同源地址、同源 blob 和 data URL 生效；<code>showSaveFilePicker</code> 不是 Baseline，要由用户点击触发；Service Worker 要在 HTTPS 下注册，只控制作用域内的页面。</p>
</blockquote>
<h2>能让浏览器直接下载时，就别经过 JavaScript</h2>
<p>服务器上已经有的文件，最好的下载方式是交给浏览器。MDN 介绍 <code>Content-Disposition</code> 时说，这个响应头决定内容是在浏览器里显示，还是作为附件下载到本地。写成 <code>attachment; filename*=UTF-8&#x27;&#x27;%E6%8A%A5%E8%A1%A8.zip</code> 这样，还能给出带中文的文件名。</p>
<p>前端这边，<code>&lt;a&gt;</code> 的 <code>download</code> 属性让浏览器把链接当成下载处理，可以带一个建议的文件名。MDN 特别提醒，<code>download</code> 只对同源地址、同源的 <code>blob:</code> 和 <code>data:</code> 生效；其他地址会忽略这个属性，变成普通跳转，不过目标服务器仍然可以用 <code>Content-Disposition</code> 要求下载。所以文件放在其他域名的 CDN 上时，<code>download</code> 属性改不了文件名，要由 CDN 返回响应头。</p>
<h2>fetch 成 Blob 再下载有什么问题</h2>
<p>有时下载接口要在请求头里带 token，链接没法直接点。常见写法是：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> response = <span class="hljs-keyword">await</span> <span class="hljs-title function_">fetch</span>(<span class="hljs-string">&#x27;/api/export&#x27;</span>, { <span class="hljs-attr">headers</span>: { <span class="hljs-title class_">Authorization</span>: <span class="hljs-string">\`Bearer <span class="hljs-subst">\${token}</span>\`</span> } });
<span class="hljs-keyword">const</span> blob = <span class="hljs-keyword">await</span> response.<span class="hljs-title function_">blob</span>();
<span class="hljs-keyword">const</span> url = <span class="hljs-variable constant_">URL</span>.<span class="hljs-title function_">createObjectURL</span>(blob);
<span class="hljs-keyword">const</span> link = <span class="hljs-variable language_">document</span>.<span class="hljs-title function_">createElement</span>(<span class="hljs-string">&#x27;a&#x27;</span>);
link.<span class="hljs-property">href</span> = url;
link.<span class="hljs-property">download</span> = <span class="hljs-string">&#x27;报表.zip&#x27;</span>;
link.<span class="hljs-title function_">click</span>();
<span class="hljs-variable constant_">URL</span>.<span class="hljs-title function_">revokeObjectURL</span>(url);
</code></pre></div>
<p>MDN 说明，<code>response.blob()</code> 会把响应流读到结束，才返回一个 <code>Blob</code>。所以整个文件下完以前，用户看不到浏览器的下载提示，文件内容也要先完整地读进来。小文件没问题，几个 GB 的文件就容易出问题。用完的 object URL 要调用 <code>revokeObjectURL</code>，MDN 的说法是让浏览器不再保留对这个文件的引用。object URL 的更多细节见<a href="/questions/api-files/">《File、Blob 和 object URL 怎样用于文件预览？》</a>。</p>
<h2>断点续传怎样判断能不能接着写</h2>
<p>断点续传的思路和<a href="/questions/design-large-upload/">《大文件上传怎样设计分片、断点续传、秒传和并发控制？》</a>方向相反：上传是客户端记住传了多少，下载是客户端记住收了多少，再向服务器要剩下的部分。</p>
<p>MDN 的 Range 指南给出了判断依据：响应带 <code>Accept-Ranges</code> 且值不是 <code>none</code>，说明服务器支持范围请求；请求时带上 <code>If-Range</code>，条件满足就返回 <code>206 Partial Content</code> 和对应的那一段，不满足就返回 <code>200 OK</code> 和完整内容。<code>Content-Range</code> 告诉你这一段在整个文件里的位置。下面把这几条判断写成函数：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// 根据已下载的字节数生成续传请求头。</span>
<span class="hljs-keyword">function</span> <span class="hljs-title function_">resumeHeaders</span>(<span class="hljs-params">received, etag</span>) {
  <span class="hljs-keyword">return</span> { <span class="hljs-title class_">Range</span>: <span class="hljs-string">\`bytes=<span class="hljs-subst">\${received}</span>-\`</span>, <span class="hljs-string">&#x27;If-Range&#x27;</span>: etag };
}
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">resumeHeaders</span>(<span class="hljs-number">1048576</span>, <span class="hljs-string">&#x27;&quot;v1&quot;&#x27;</span>).<span class="hljs-property">Range</span>); <span class="hljs-comment">// bytes=1048576-</span>

<span class="hljs-comment">// 解析 Content-Range，确认服务器返回的是哪一段。</span>
<span class="hljs-keyword">function</span> <span class="hljs-title function_">parseContentRange</span>(<span class="hljs-params">value</span>) {
  <span class="hljs-keyword">const</span> match = <span class="hljs-regexp">/^bytes (\\d+)-(\\d+)\\/(\\d+|\\*)$/</span>.<span class="hljs-title function_">exec</span>(value);
  <span class="hljs-keyword">if</span> (!match) <span class="hljs-keyword">return</span> <span class="hljs-literal">null</span>;
  <span class="hljs-keyword">const</span> [, start, end, total] = match;
  <span class="hljs-keyword">return</span> { <span class="hljs-attr">start</span>: <span class="hljs-title class_">Number</span>(start), <span class="hljs-attr">end</span>: <span class="hljs-title class_">Number</span>(end), <span class="hljs-attr">total</span>: total === <span class="hljs-string">&#x27;*&#x27;</span> ? <span class="hljs-literal">null</span> : <span class="hljs-title class_">Number</span>(total) };
}
<span class="hljs-keyword">const</span> range = <span class="hljs-title function_">parseContentRange</span>(<span class="hljs-string">&#x27;bytes 1048576-2097151/5242880&#x27;</span>);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(range.<span class="hljs-property">end</span> - range.<span class="hljs-property">start</span> + <span class="hljs-number">1</span>); <span class="hljs-comment">// 1048576</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(range.<span class="hljs-property">total</span>); <span class="hljs-comment">// 5242880</span>

<span class="hljs-comment">// 决定怎样处理续传响应：206 接着写，200 说明文件变了或不支持 Range，只能从头开始。</span>
<span class="hljs-keyword">function</span> <span class="hljs-title function_">nextStep</span>(<span class="hljs-params">status, contentRange, received</span>) {
  <span class="hljs-keyword">if</span> (status === <span class="hljs-number">200</span>) <span class="hljs-keyword">return</span> <span class="hljs-string">&#x27;restart&#x27;</span>;
  <span class="hljs-keyword">if</span> (status !== <span class="hljs-number">206</span>) <span class="hljs-keyword">return</span> <span class="hljs-string">&#x27;fail&#x27;</span>;
  <span class="hljs-keyword">const</span> info = <span class="hljs-title function_">parseContentRange</span>(contentRange);
  <span class="hljs-keyword">return</span> info &amp;&amp; info.<span class="hljs-property">start</span> === received ? <span class="hljs-string">&#x27;append&#x27;</span> : <span class="hljs-string">&#x27;restart&#x27;</span>;
}
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">nextStep</span>(<span class="hljs-number">206</span>, <span class="hljs-string">&#x27;bytes 1048576-2097151/5242880&#x27;</span>, <span class="hljs-number">1048576</span>)); <span class="hljs-comment">// append</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">nextStep</span>(<span class="hljs-number">200</span>, <span class="hljs-literal">null</span>, <span class="hljs-number">1048576</span>)); <span class="hljs-comment">// restart</span>
</code></pre></div>
<p><code>bytes=1048576-</code> 的意思是从第 1048576 个字节一直要到结尾。<code>Content-Range</code> 里的两个数字都包含在范围内，所以这一段的长度要加 1，正好是 1 MB。</p>
<p>为什么收到 200 不能接着写？因为 200 带的是完整文件，可能是服务器不支持 Range，也可能是 <code>If-Range</code> 发现文件已经变了。把它拼到旧数据后面，得到的就是一个损坏的文件。所以续传时要带 <code>If-Range</code>，MDN 说明它可以配合 <code>ETag</code> 或 <code>Last-Modified</code> 使用，但两者不能同时用。Range 请求的更多写法见<a href="/questions/network-range-request/">《HTTP Range 请求适合什么场景？》</a>。</p>
<h2>怎样边下载边写到磁盘</h2>
<p>要避免把整个文件读进内存，就得一边收数据一边写出去。File System Access API 能做到：<code>showSaveFilePicker()</code> 弹出保存对话框，用户选好位置后拿到文件句柄，再用 <code>createWritable()</code> 得到一个可写流。<code>fetch</code> 返回的 <code>response.body</code> 是可读流，用 <code>pipeTo</code> 接上：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js">saveButton.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;click&#x27;</span>, <span class="hljs-title function_">async</span> () =&gt; {
  <span class="hljs-keyword">const</span> handle = <span class="hljs-keyword">await</span> <span class="hljs-variable language_">window</span>.<span class="hljs-title function_">showSaveFilePicker</span>({ <span class="hljs-attr">suggestedName</span>: <span class="hljs-string">&#x27;报表.zip&#x27;</span> });
  <span class="hljs-keyword">const</span> writable = <span class="hljs-keyword">await</span> handle.<span class="hljs-title function_">createWritable</span>();
  <span class="hljs-keyword">const</span> response = <span class="hljs-keyword">await</span> <span class="hljs-title function_">fetch</span>(<span class="hljs-string">&#x27;/api/export&#x27;</span>);
  <span class="hljs-keyword">await</span> response.<span class="hljs-property">body</span>.<span class="hljs-title function_">pipeTo</span>(writable);
});
</code></pre></div>
<p><code>pipeTo</code> 返回一个 Promise，传输完成时兑现，出错时拒绝；默认情况下，可读流结束会把目标可写流也关掉。MDN 说明，写入的内容要等流关闭以后才会出现在文件里，浏览器一般先写临时文件，关闭时再替换。</p>
<p>为什么要写在点击事件里？MDN 列出的异常里有一条：调用不是由按钮点击这类用户交互触发时，会抛出 <code>SecurityError</code>。用户取消对话框时，会抛出 <code>AbortError</code>。更大的限制是兼容性，MDN 标注这个方法不是 Baseline，在一些主流浏览器里不能用，还只能在 HTTPS 下使用，所以要准备降级方案。</p>
<p>它也能和断点续传结合：<code>createWritable({ keepExistingData: true })</code> 会先把已有内容复制到临时文件，<code>write()</code> 可以用 <code>position</code> 指定从哪个字节开始写。权限和句柄的管理见<a href="/questions/web-file-system-access/">《File System Access API 的权限和文件句柄怎样管理？》</a>。</p>
<h2>Service Worker 怎样做流式下载</h2>
<p>另一种思路是让浏览器的下载管理器写磁盘，数据由网页提供。Service Worker 能拦截作用域内的请求，MDN 说明 <code>respondWith()</code> 会阻止浏览器默认的请求处理，改由你提供 <code>Response</code>。而 <code>Response</code> 的构造函数接受 <code>ReadableStream</code> 作为响应体。两者组合起来：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// sw.js</span>
<span class="hljs-variable language_">self</span>.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;fetch&#x27;</span>, <span class="hljs-function">(<span class="hljs-params">event</span>) =&gt;</span> {
  <span class="hljs-keyword">const</span> url = <span class="hljs-keyword">new</span> <span class="hljs-title function_">URL</span>(event.<span class="hljs-property">request</span>.<span class="hljs-property">url</span>);
  <span class="hljs-keyword">if</span> (url.<span class="hljs-property">pathname</span> !== <span class="hljs-string">&#x27;/download/report.zip&#x27;</span>) <span class="hljs-keyword">return</span>;
  <span class="hljs-comment">// createReportStream 返回一个 ReadableStream，数据由页面通过 postMessage 分块送进来</span>
  <span class="hljs-keyword">const</span> stream = <span class="hljs-title function_">createReportStream</span>();
  event.<span class="hljs-title function_">respondWith</span>(
    <span class="hljs-keyword">new</span> <span class="hljs-title class_">Response</span>(stream, {
      <span class="hljs-attr">headers</span>: {
        <span class="hljs-string">&#x27;Content-Type&#x27;</span>: <span class="hljs-string">&#x27;application/zip&#x27;</span>,
        <span class="hljs-string">&#x27;Content-Disposition&#x27;</span>: <span class="hljs-string">&#x27;attachment; filename=&quot;report.zip&quot;&#x27;</span>,
      },
    }),
  );
});
</code></pre></div>
<p>页面跳转到 <code>/download/report.zip</code>，请求被 Service Worker 截住，返回的响应带 <code>attachment</code>，浏览器就把它当成下载，边从流里取数据边写盘。这适合前端生成的大文件，比如边打包边下载的 zip，数据一块块送进流，不用先拼成一个完整的 Blob。</p>
<p>限制也要说清楚。MDN 写明注册 Service Worker 需要安全上下文（HTTPS）；它激活后只控制作用域内的页面，已经打开的页面要重新加载才受控制。生命周期的细节见<a href="/questions/mobile-serviceworker/">《Service Worker 的安装、激活与缓存更新有哪些坑？》</a>。</p>
<h2>常见追问</h2>
<p><strong>自己用 fetch 下载时，怎样显示进度？</strong></p>
<blockquote>
<p>用 <code>response.body.getReader()</code> 一块块读，累加已经收到的字节数，再除以 <code>Content-Length</code> 算出百分比。响应没有 <code>Content-Length</code> 时拿不到总长度，只能显示已下载多少。交给浏览器下载时，进度在浏览器的下载栏里，网页拿不到。</p>
</blockquote>
<p><strong>跨域的文件为什么设了 download 属性还是在新页面打开？</strong></p>
<blockquote>
<p>MDN 说明 <code>download</code> 只对同源地址、同源 blob 和 data URL 生效，跨域地址会忽略它，当成普通跳转。要么让文件服务器返回 <code>Content-Disposition: attachment</code>，要么在 CORS 允许的前提下先 <code>fetch</code> 成 Blob 再下载，后者要注意内存。</p>
</blockquote>
<p><strong>带 token 的下载接口，怎样避免把文件读进内存？</strong></p>
<blockquote>
<p>可以让后端先签发一个短期有效的下载地址，前端拿到后直接跳转，这样请求不用带请求头，又能交给浏览器的下载管理器。浏览器支持时，也可以用 <code>showSaveFilePicker</code> 加 <code>pipeTo</code>，<code>fetch</code> 照样能带请求头。</p>
</blockquote>`};export{e as default};