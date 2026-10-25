var e={answerHtml:`<p>下载一个 100 MB 的文件，传到 60 MB 时网络断开。如果重新下载整个文件，之前的流量和等待就浪费了。Range 请求允许客户端指定“我只需要这个资源的某一部分”，是断点续传、视频拖动播放位置和按需读取大型文件的基础能力之一。</p>
<p>但 Range 只描述要读取的范围，不会替应用保存已下载数据、记录文件版本或完成分片合并。完整的下载器仍需要设计这些逻辑。</p>
<h2>范围是字节位置，结束位置也包含在内</h2>
<p>例如请求前 1024 个字节：</p>
<div class="not-prose code-block"><div class="code-language">http</div><pre><code class="hljs language-http">GET /files/report.zip HTTP/1.1
Host: example.com
Range: bytes=0-1023
</code></pre></div>
<p><code>0-1023</code> 包含两个端点，所以长度是 <code>1023 - 0 + 1 = 1024</code>。常见写法还有：</p>
<table><thead><tr><th>Range 值</th><th>含义</th></tr></thead><tbody><tr><td><code>bytes=1024-2047</code></td><td>从位置 1024 到 2047，共 1024 字节</td></tr><tr><td><code>bytes=1024-</code></td><td>从位置 1024 直到结尾</td></tr><tr><td><code>bytes=-500</code></td><td>最后 500 字节；文件不足 500 字节时取整个文件</td></tr><tr><td><code>bytes=0-99,200-299</code></td><td>请求两个范围，响应可能是 multipart/byteranges</td></tr></tbody></table>
<p>这里数的是字节，不是 JavaScript 字符串的字符数。汉字、emoji 等在 UTF-8 下可能占多个字节，不能把 <code>text.length</code> 直接当成下载偏移量，也不要把任意字节片段分别解码成字符串后再拼接。</p>
<p>服务器支持本次单范围请求时，典型响应如下：</p>
<div class="not-prose code-block"><div class="code-language">http</div><pre><code class="hljs language-http">HTTP/1.1 206 Partial Content
Content-Type: application/zip
Content-Range: bytes 0-1023/104857600
Content-Length: 1024
ETag: &quot;report-v7&quot;

...1024 字节的正文...
</code></pre></div>
<p><code>Content-Range</code> 说明本次正文来自完整表示的哪个区间，斜杠后是完整长度。<code>Content-Length</code> 若存在，在这里表示本次分片的正文长度，不是完整文件大小。多范围响应则会在各个 MIME 分段中分别携带范围信息，不能拿一个普通 ArrayBuffer 就假装它已经是按顺序拼好的文件。</p>
<h2>续传先确认：还是原来的那个文件吗</h2>
<p>只记录“已经下载 60 MB”还不够。假设服务器把同一个 URL 下的文件从 v7 更新成 v8，客户端继续请求第 60 MB 后面的内容，就可能拼出“前半段 v7、后半段 v8”的损坏文件。</p>
<p>可以保存服务器提供的强 ETag，在续传时一起发送：</p>
<div class="not-prose code-block"><div class="code-language">http</div><pre><code class="hljs language-http">Range: bytes=62914560-
If-Range: &quot;report-v7&quot;
</code></pre></div>
<p>意思是：“如果仍是这个版本，给我剩下的部分；如果版本已经变化，就把当前完整文件给我。”</p>
<ul>
<li>验证器匹配且范围被接受时，服务器可以返回 <code>206</code>，客户端校验后继续保存。</li>
<li>验证器不匹配时，服务器忽略 Range，通常返回完整的 <code>200</code> 响应。客户端必须重新开始，不能把它接在旧文件尾部。</li>
<li>服务器不支持或忽略 Range 时，也可能返回 <code>200</code>。客户端必须具备这种处理分支，不能只看 <code>response.ok</code>，因为 200 和 206 都属于成功状态。</li>
</ul>
<p><code>If-Range</code> 不能使用 <code>W/&quot;...&quot;</code> 这样的弱 ETag。它也可以使用符合强验证器要求的日期，但不能把任意 <code>Last-Modified</code> 值都当成可靠的字节版本证明。涉及拼接时优先使用服务端明确提供的强 ETag，并保持请求选择的是同一份表示。</p>
<p><code>Accept-Ranges: bytes</code> 是服务端支持范围请求的提示，不是之后每次都返回 206 的承诺。按照 HTTP 规范，即使先前没有收到这个头，客户端也可以尝试 Range；是否能使用返回的分片，最终要检查当前响应。具体规则见 <a href="https://www.rfc-editor.org/rfc/rfc9110.html#section-14.3">RFC 9110 的 Accept-Ranges 定义</a>。</p>
<h2>416 不一定代表“文件下载完成”</h2>
<p>如果文件总共只有 1000 字节，却请求 <code>bytes=1500-</code>，没有可满足的范围，服务器可能返回：</p>
<div class="not-prose code-block"><div class="code-language">http</div><pre><code class="hljs language-http">HTTP/1.1 416 Range Not Satisfiable
Content-Range: bytes */1000
</code></pre></div>
<p><code>*/1000</code> 提示当前表示的总大小。原因可能是偏移计算错误、文件变短，或者本地已经有全部数据。客户端要结合保存的版本、长度和完整性信息判断，不能收到 416 就直接宣布下载成功。服务器也可能拒绝不合理的多范围请求，因此 416 不只对应一种业务原因。</p>
<h2>在 fetch 中校验一个小分片</h2>
<p>下面是用于教学的单范围读取函数：每次最多请求 1 MiB，要求服务器返回已知总长度、没有内容编码的二进制表示。它不实现并发调度、持久化和最终文件合并；这种明确的限制可以让分片校验过程更容易看懂。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">readRange</span>(<span class="hljs-params">url, start, end, etag, signal</span>) {
  <span class="hljs-keyword">if</span> (
    !<span class="hljs-title class_">Number</span>.<span class="hljs-title function_">isSafeInteger</span>(start) ||
    !<span class="hljs-title class_">Number</span>.<span class="hljs-title function_">isSafeInteger</span>(end) ||
    start &lt; <span class="hljs-number">0</span> ||
    end &lt; start ||
    end - start + <span class="hljs-number">1</span> &gt; <span class="hljs-number">1024</span> * <span class="hljs-number">1024</span>
  ) {
    <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">RangeError</span>(<span class="hljs-string">&#x27;范围必须有效，且单次不能超过 1 MiB&#x27;</span>);
  }
  <span class="hljs-keyword">if</span> (<span class="hljs-keyword">typeof</span> etag !== <span class="hljs-string">&#x27;string&#x27;</span> || !<span class="hljs-regexp">/^&quot;[^&quot;\\r\\n]*&quot;$/</span>.<span class="hljs-title function_">test</span>(etag)) {
    <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">TypeError</span>(<span class="hljs-string">&#x27;请传入此前响应中的强 ETag&#x27;</span>);
  }

  <span class="hljs-keyword">const</span> response = <span class="hljs-keyword">await</span> <span class="hljs-title function_">fetch</span>(url, {
    <span class="hljs-attr">headers</span>: { <span class="hljs-title class_">Range</span>: <span class="hljs-string">\`bytes=<span class="hljs-subst">\${start}</span>-<span class="hljs-subst">\${end}</span>\`</span>, <span class="hljs-string">&#x27;If-Range&#x27;</span>: etag },
    signal,
  });

  <span class="hljs-keyword">if</span> (response.<span class="hljs-property">status</span> === <span class="hljs-number">200</span>) {
    <span class="hljs-comment">// 由调用方决定重新下载或取消，绝不能把完整正文追加到旧分片后。</span>
    <span class="hljs-keyword">return</span> { <span class="hljs-attr">kind</span>: <span class="hljs-string">&#x27;full&#x27;</span>, response };
  }

  <span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">fail</span>(<span class="hljs-params">message</span>) {
    <span class="hljs-keyword">await</span> response.<span class="hljs-property">body</span>?.<span class="hljs-title function_">cancel</span>();
    <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(message);
  }

  <span class="hljs-keyword">if</span> (response.<span class="hljs-property">status</span> === <span class="hljs-number">416</span>) {
    <span class="hljs-keyword">return</span> <span class="hljs-title function_">fail</span>(<span class="hljs-string">\`范围不可满足：<span class="hljs-subst">\${response.headers.get(<span class="hljs-string">&#x27;Content-Range&#x27;</span>) ?? <span class="hljs-string">&#x27;总长度未知&#x27;</span>}</span>\`</span>);
  }
  <span class="hljs-keyword">if</span> (response.<span class="hljs-property">status</span> !== <span class="hljs-number">206</span>) {
    <span class="hljs-keyword">return</span> <span class="hljs-title function_">fail</span>(<span class="hljs-string">\`读取分片失败：HTTP <span class="hljs-subst">\${response.status}</span>\`</span>);
  }
  <span class="hljs-keyword">if</span> (response.<span class="hljs-property">headers</span>.<span class="hljs-title function_">get</span>(<span class="hljs-string">&#x27;Content-Encoding&#x27;</span>)) {
    <span class="hljs-keyword">return</span> <span class="hljs-title function_">fail</span>(<span class="hljs-string">&#x27;此示例只支持没有内容编码的二进制表示&#x27;</span>);
  }

  <span class="hljs-keyword">const</span> match = <span class="hljs-regexp">/^bytes (\\d+)-(\\d+)\\/(\\d+)$/</span>.<span class="hljs-title function_">exec</span>(
    response.<span class="hljs-property">headers</span>.<span class="hljs-title function_">get</span>(<span class="hljs-string">&#x27;Content-Range&#x27;</span>) ?? <span class="hljs-string">&#x27;&#x27;</span>,
  );
  <span class="hljs-keyword">if</span> (!match) <span class="hljs-keyword">return</span> <span class="hljs-title function_">fail</span>(<span class="hljs-string">&#x27;缺少可识别的单范围 Content-Range&#x27;</span>);

  <span class="hljs-keyword">const</span> [actualStart, actualEnd, total] = match.<span class="hljs-title function_">slice</span>(<span class="hljs-number">1</span>).<span class="hljs-title function_">map</span>(<span class="hljs-title class_">Number</span>);
  <span class="hljs-keyword">if</span> (
    ![actualStart, actualEnd, total].<span class="hljs-title function_">every</span>(<span class="hljs-title class_">Number</span>.<span class="hljs-property">isSafeInteger</span>) ||
    actualStart !== start ||
    actualEnd &lt; actualStart ||
    actualEnd &gt;= total ||
    actualEnd !== <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">min</span>(end, total - <span class="hljs-number">1</span>)
  ) {
    <span class="hljs-keyword">return</span> <span class="hljs-title function_">fail</span>(<span class="hljs-string">&#x27;服务器返回的范围与请求不一致&#x27;</span>);
  }

  <span class="hljs-keyword">const</span> returnedEtag = response.<span class="hljs-property">headers</span>.<span class="hljs-title function_">get</span>(<span class="hljs-string">&#x27;ETag&#x27;</span>);
  <span class="hljs-keyword">if</span> (returnedEtag !== <span class="hljs-literal">null</span> &amp;&amp; returnedEtag !== etag) {
    <span class="hljs-keyword">return</span> <span class="hljs-title function_">fail</span>(<span class="hljs-string">&#x27;分片所属文件版本发生了变化&#x27;</span>);
  }

  <span class="hljs-keyword">const</span> bytes = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Uint8Array</span>(<span class="hljs-keyword">await</span> response.<span class="hljs-title function_">arrayBuffer</span>());
  <span class="hljs-keyword">if</span> (bytes.<span class="hljs-property">byteLength</span> !== actualEnd - actualStart + <span class="hljs-number">1</span>) {
    <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">&#x27;实际分片长度与 Content-Range 不一致&#x27;</span>);
  }
  <span class="hljs-keyword">return</span> { <span class="hljs-attr">kind</span>: <span class="hljs-string">&#x27;partial&#x27;</span>, bytes, <span class="hljs-attr">start</span>: actualStart, <span class="hljs-attr">end</span>: actualEnd, total };
}
</code></pre></div>
<p>返回 <code>kind: &#x27;partial&#x27;</code> 后才可以按照偏移保存字节，保存成功后再更新续传进度。返回 <code>kind: &#x27;full&#x27;</code> 时，调用方可以把这个响应作为新版本从头保存；如果不准备继续，应该取消它的响应体，避免无用传输。读取响应体本身也可能因断网或取消而失败，调用方需要捕获整个函数的拒绝。</p>
<p>这里允许服务器把结束位置截到文件末尾，例如文件长 1000 字节，请求 <code>900-1199</code>，有效响应可以是 <code>900-999/1000</code>。但任意错误偏移、混入其他版本或长度不符的正文都不能进入本地拼接结果。</p>
<p>示例用 <code>arrayBuffer()</code> 便于展示小分片的检查。实际大文件下载应根据环境采用流式写入或合适的持久化方案；不要把数 GB 文件的全部分片一直留在内存里。对不可信端点还应在读取过程中限制字节数，而不是只在完整读入后检查长度。</p>
<h2>浏览器里还要考虑跨域和压缩</h2>
<p>满足 CORS 安全列表格式的单个字节范围 <code>Range</code> 可以免于预检，但这里还发送了 <code>If-Range</code>，跨源调用通常需要预检，并由服务端允许相应请求头。要让脚本读取 <code>Content-Range</code>、<code>ETag</code> 和 <code>Content-Encoding</code>，服务端还需要通过 <code>Access-Control-Expose-Headers</code> 暴露它们，否则代码无法可靠判断响应。身份验证和资源权限也照常生效。</p>
<p>Range 针对的是选定表示的字节序列。内容编码、浏览器自动解压和 CDN 转换会让“响应里的字节位置”与“脚本最终得到的字节”产生混淆，所以示例要求下载端点提供稳定且未做内容编码的表示。不要试图在浏览器脚本里随意设置 <code>Accept-Encoding</code> 来修复它，该请求头由浏览器控制。</p>
<p>Range 与 HTTP/1.1 的 <code>Transfer-Encoding: chunked</code> 也不是一回事：前者是请求资源的某个区间，后者是传输响应体时的一种分帧方式。一次普通的全量下载也可以边传边读，却不一定支持中断后从指定偏移重新获取。</p>`};export{e as default};