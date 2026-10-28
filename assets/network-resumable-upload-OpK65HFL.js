var e={answerHtml:`<p>上传一个几个 GB 的视频时，用户切换网络或关闭页面，重新从零开始会浪费时间和流量。把文件切成多个小片并逐片发送，可以让客户端只重试失败的片段；但“切片”本身还不等于可靠续传。客户端和服务器还必须约定上传会话、片段编号、重复请求的结果以及最终合并规则。</p>
<h2>先确定协议，而不是先写并发循环</h2>
<p>一个可维护的上传协议通常分为三个阶段：</p>
<ol>
<li><strong>创建会话</strong>：客户端提交文件大小、文件名、片段大小和可选的文件指纹，服务器返回不可猜测的 <code>uploadId</code>。</li>
<li><strong>上传片段</strong>：每个请求带上 <code>uploadId</code>、片段编号、总片段数和片段内容。服务器校验编号与长度后保存片段，并以幂等方式返回结果。</li>
<li><strong>完成合并</strong>：客户端通知服务器所有片段都已上传。服务器按编号读取并合并，校验完整文件后再把会话标记为完成。</li>
</ol>
<p>片段编号应从 0 开始且连续。最后一个片段可以小于固定大小，但中间片段不能因为客户端计算错误而出现空洞。服务器不能只相信客户端提供的总大小，必须根据实际收到的字节数再次检查。</p>
<p>下面是一种示意请求：</p>
<div class="not-prose code-block"><div class="code-language">http</div><pre><code class="hljs language-http">PUT /api/uploads/9b2.../parts/12 HTTP/1.1
Authorization: Bearer &lt;短期令牌&gt;
Content-Type: application/octet-stream
X-Part-Number: 12
X-Part-Count: 80
X-Part-SHA-256: &lt;该片段的摘要&gt;

&lt;第 12 个片段的二进制内容&gt;
</code></pre></div>
<p>实际项目也可以把元数据放在查询参数或 JSON 中，但二进制正文和元数据的含义必须固定。不要把整块文件转换成 Base64 放进 JSON：Base64 会增加传输体积，并让服务端和浏览器多做一次编码、解码和内存复制。</p>
<h2><code>File.slice()</code> 只创建视图，不会复制整个文件</h2>
<p>浏览器的 <code>File</code> 继承自 <code>Blob</code>，<code>slice(start, end)</code> 返回指定字节区间的 <code>Blob</code>。结束位置不包含在区间内，因此每片的起点和终点可以这样计算：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">getPart</span>(<span class="hljs-params">file, partNumber, partSize</span>) {
  <span class="hljs-keyword">if</span> (!(file <span class="hljs-keyword">instanceof</span> <span class="hljs-title class_">File</span>)) <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">TypeError</span>(<span class="hljs-string">&#x27;必须传入 File&#x27;</span>);
  <span class="hljs-keyword">if</span> (!<span class="hljs-title class_">Number</span>.<span class="hljs-title function_">isSafeInteger</span>(partNumber) || partNumber &lt; <span class="hljs-number">0</span>) {
    <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">RangeError</span>(<span class="hljs-string">&#x27;片段编号必须是非负整数&#x27;</span>);
  }
  <span class="hljs-keyword">if</span> (!<span class="hljs-title class_">Number</span>.<span class="hljs-title function_">isSafeInteger</span>(partSize) || partSize &lt;= <span class="hljs-number">0</span>) {
    <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">RangeError</span>(<span class="hljs-string">&#x27;片段大小必须是正整数&#x27;</span>);
  }

  <span class="hljs-keyword">const</span> start = partNumber * partSize;
  <span class="hljs-keyword">if</span> (start &gt;= file.<span class="hljs-property">size</span>) <span class="hljs-keyword">return</span> <span class="hljs-literal">null</span>;
  <span class="hljs-keyword">const</span> end = <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">min</span>(start + partSize, file.<span class="hljs-property">size</span>);
  <span class="hljs-keyword">return</span> { <span class="hljs-attr">blob</span>: file.<span class="hljs-title function_">slice</span>(start, end), start, end, <span class="hljs-attr">size</span>: end - start };
}
</code></pre></div>
<p>它不会把整个文件一次性读进 JavaScript 堆，因此适合大文件。不过上传请求真正发送时仍会占用网络缓冲，摘要计算也可能读取片段内容。不要在主线程同时计算几十个片段的摘要，否则会造成输入卡顿；可以限制并发，或把计算放进 Web Worker。</p>
<h2>续传依赖“查询服务器状态”，不能只依赖浏览器内存</h2>
<p>刷新页面后，内存中的 <code>uploadedParts</code> 会消失。可靠做法是把 <code>uploadId</code>、文件大小、文件指纹和片段大小保存到 IndexedDB，并在恢复时向服务器查询已经持久化的片段：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">getUploadedParts</span>(<span class="hljs-params">uploadId, signal</span>) {
  <span class="hljs-keyword">const</span> response = <span class="hljs-keyword">await</span> <span class="hljs-title function_">fetch</span>(<span class="hljs-string">\`/api/uploads/<span class="hljs-subst">\${<span class="hljs-built_in">encodeURIComponent</span>(uploadId)}</span>\`</span>, {
    <span class="hljs-attr">headers</span>: { <span class="hljs-title class_">Accept</span>: <span class="hljs-string">&#x27;application/json&#x27;</span> },
    signal,
  });
  <span class="hljs-keyword">if</span> (!response.<span class="hljs-property">ok</span>) <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">\`查询上传状态失败：HTTP <span class="hljs-subst">\${response.status}</span>\`</span>);

  <span class="hljs-keyword">const</span> data = <span class="hljs-keyword">await</span> response.<span class="hljs-title function_">json</span>();
  <span class="hljs-keyword">if</span> (!<span class="hljs-title class_">Array</span>.<span class="hljs-title function_">isArray</span>(data.<span class="hljs-property">parts</span>)) <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">&#x27;服务器返回的片段列表无效&#x27;</span>);
  <span class="hljs-keyword">return</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Set</span>(
    data.<span class="hljs-property">parts</span>.<span class="hljs-title function_">filter</span>(<span class="hljs-function">(<span class="hljs-params">number</span>) =&gt;</span> <span class="hljs-title class_">Number</span>.<span class="hljs-title function_">isSafeInteger</span>(number) &amp;&amp; number &gt;= <span class="hljs-number">0</span>),
  );
}
</code></pre></div>
<p>恢复时必须重新确认文件仍然是同一个文件。文件名相同不够，用户可能替换了内容。小文件可以对完整文件计算摘要；大文件可以先用大小、<code>lastModified</code> 和若干固定位置的片段做快速指纹，再由服务器在合并阶段计算完整摘要。快速指纹只是减少误匹配的手段，不能代替最终完整性校验。</p>
<h2>重试必须满足幂等，超时不能直接判定失败</h2>
<p>网络超时后，服务器可能已经保存了片段，而客户端还没有收到响应。若再次发送同一编号，服务端应该根据 <code>uploadId + partNumber</code> 幂等处理：内容摘要相同就返回已存在，摘要不同则拒绝并要求客户端重新创建会话。不能让后一次请求无条件覆盖前一次内容，否则重试可能悄悄替换文件的一部分。</p>
<p>客户端可以采用有限次数的指数退避，并对 <code>AbortSignal</code> 保持可取消：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">uploadPart</span>(<span class="hljs-params">{ uploadId, partNumber, blob, digest, signal }</span>) {
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">let</span> attempt = <span class="hljs-number">0</span>; attempt &lt; <span class="hljs-number">4</span>; attempt += <span class="hljs-number">1</span>) {
    signal?.<span class="hljs-title function_">throwIfAborted</span>();
    <span class="hljs-keyword">let</span> response;
    <span class="hljs-keyword">try</span> {
      response = <span class="hljs-keyword">await</span> <span class="hljs-title function_">fetch</span>(
        <span class="hljs-string">\`/api/uploads/<span class="hljs-subst">\${<span class="hljs-built_in">encodeURIComponent</span>(uploadId)}</span>/parts/<span class="hljs-subst">\${partNumber}</span>\`</span>,
        {
          <span class="hljs-attr">method</span>: <span class="hljs-string">&#x27;PUT&#x27;</span>,
          <span class="hljs-attr">headers</span>: {
            <span class="hljs-string">&#x27;Content-Type&#x27;</span>: <span class="hljs-string">&#x27;application/octet-stream&#x27;</span>,
            <span class="hljs-string">&#x27;X-Part-SHA-256&#x27;</span>: digest,
          },
          <span class="hljs-attr">body</span>: blob,
          signal,
        },
      );

    } <span class="hljs-keyword">catch</span> (error) {
      <span class="hljs-keyword">if</span> (signal?.<span class="hljs-property">aborted</span> || attempt === <span class="hljs-number">3</span>) <span class="hljs-keyword">throw</span> error;
    }

    <span class="hljs-keyword">if</span> (response) {
      <span class="hljs-comment">// 本协议仅以 204 表示已经持久化；相同摘要的重复请求也返回 204。</span>
      <span class="hljs-keyword">await</span> response.<span class="hljs-property">body</span>?.<span class="hljs-title function_">cancel</span>();
      <span class="hljs-keyword">if</span> (response.<span class="hljs-property">status</span> === <span class="hljs-number">204</span>) <span class="hljs-keyword">return</span>;
      <span class="hljs-keyword">if</span> (![<span class="hljs-number">502</span>, <span class="hljs-number">503</span>, <span class="hljs-number">504</span>].<span class="hljs-title function_">includes</span>(response.<span class="hljs-property">status</span>) || attempt === <span class="hljs-number">3</span>) {
        <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">\`片段上传未确认：HTTP <span class="hljs-subst">\${response.status}</span>\`</span>);
      }
    }
    <span class="hljs-keyword">await</span> <span class="hljs-title function_">wait</span>(<span class="hljs-number">500</span> * <span class="hljs-number">2</span> ** attempt + <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">random</span>() * <span class="hljs-number">250</span>, signal);
  }
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">wait</span>(<span class="hljs-params">ms, signal</span>) {
  signal?.<span class="hljs-title function_">throwIfAborted</span>();
  <span class="hljs-keyword">return</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Promise</span>(<span class="hljs-function">(<span class="hljs-params">resolve, reject</span>) =&gt;</span> {
    <span class="hljs-keyword">const</span> timer = <span class="hljs-built_in">setTimeout</span>(<span class="hljs-function">() =&gt;</span> {
      signal?.<span class="hljs-title function_">removeEventListener</span>(<span class="hljs-string">&#x27;abort&#x27;</span>, onAbort);
      <span class="hljs-title function_">resolve</span>();
    }, ms);
    <span class="hljs-keyword">function</span> <span class="hljs-title function_">onAbort</span>(<span class="hljs-params"></span>) {
      <span class="hljs-built_in">clearTimeout</span>(timer);
      <span class="hljs-title function_">reject</span>(signal.<span class="hljs-property">reason</span>);
    }
    signal?.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;abort&#x27;</span>, onAbort, { <span class="hljs-attr">once</span>: <span class="hljs-literal">true</span> });
  });
}
</code></pre></div>
<p>这里约定服务端持久化成功或确认相同摘要的重复上传时返回 204，409 表示内容冲突并立即停止。401、403、413 等响应也不应靠重试解决；原示例把这些错误抛进统一 catch 后会重复请求，必须将 HTTP 分类放在网络异常捕获之外。202 只表示接受处理，不作为保存成功的证明。</p>
<p>示例最多请求四次，仅对网络异常和 502、503、504 做有限重试。网络异常也可能来自永久性 CORS 配置问题，并不保证下一次成功。生产实现还应解析 Retry-After、设置总截止时间，并按接口契约处理 429；本例不自动重试 429。退避等待同样响应取消，暂停时不必等待定时器到期。服务端应设置会话过期时间和遗留片段清理任务。</p>
<h2>并发不是越高越快</h2>
<p>可以维护一个有限大小的任务池，例如同时上传 3 到 6 个片段。并发数太高会争抢上行带宽、增加移动设备耗电，也可能让服务端连接数和临时磁盘压力上升。并发数应根据网络类型、片段大小和失败率动态调整，至少要支持暂停：暂停时停止派发新任务，并通过 <code>AbortController</code> 取消正在进行的请求；已成功保存的片段不要删除，恢复时重新查询即可。</p>
<p>不要用 <code>Promise.all</code> 一次启动所有片段。它会同时创建大量请求，并且一个请求拒绝后不能自动取消其余请求。更稳妥的任务池需要记录每个片段的状态（等待、上传中、成功、失败），只从等待队列取任务，并在取消时统一终止控制器。</p>
<h2>完成阶段仍要由服务器做最终校验</h2>
<p>客户端发送“完成”请求时，可以带上片段摘要列表和完整文件摘要，但服务器必须重新检查：</p>
<ul>
<li>会话属于当前用户或当前授权范围，且没有过期；</li>
<li>片段编号完整、没有重复冲突，实际字节数符合预期；</li>
<li>每个片段的摘要与保存内容一致；</li>
<li>合并后的文件摘要、媒体类型和大小符合业务限制。</li>
</ul>
<p>合并应写入临时文件，校验通过后再以原子方式改名为最终文件。不要在用户能访问的公开目录中直接使用用户提供的文件名或路径；文件名应经过规范化，或直接生成服务端文件名，并根据实际内容重新判断 <code>Content-Type</code>。上传文件如果会被浏览器直接打开，还要考虑 HTML、SVG、脚本和恶意压缩包造成的存储型 XSS 或资源消耗攻击。</p>
<h2>跨域、鉴权和兼容性</h2>
<p>跨源上传需要服务端正确配置 CORS，并允许实际使用的请求方法和请求头。带 <code>Authorization</code>、自定义摘要头或预检条件的请求通常会触发 <code>OPTIONS</code>，服务端必须正确响应 <code>Access-Control-Allow-Origin</code>，且不能在允许凭据时使用通配来源。上传令牌应短期、绑定用户和文件会话，并避免把长期凭据写入 URL。</p>
<p><code>File</code>、<code>Blob</code>、<code>fetch</code> 和 <code>AbortController</code> 在现代浏览器中普遍可用；目录选择、后台持续上传、文件系统写入和流式摘要等能力的兼容性则更复杂。不能把浏览器关闭后的持续上传当作普通网页能力保证。需要后台上传时，应单独评估 Service Worker、操作系统分享目标或原生应用方案，并为不支持的浏览器提供重新选择文件后继续的提示。</p>
<p>分片上传适合大文件、网络不稳定或需要显示精确进度的场景。小文件直接一次上传更简单，只有在确实需要暂停恢复、并发控制或大文件容错时才引入这套协议；否则额外的会话、临时存储和清理逻辑会增加系统复杂度。</p>
<h2>参考资料</h2>
<ul>
<li><a href="https://developer.mozilla.org/en-US/docs/Web/API/File_API">MDN · File API</a></li>
<li><a href="https://developer.mozilla.org/en-US/docs/Web/API/Blob/slice">MDN · Blob.slice()</a></li>
<li><a href="https://developer.mozilla.org/en-US/docs/Web/API/AbortController">MDN · AbortController</a></li>
<li><a href="https://www.rfc-editor.org/rfc/rfc9110.html">RFC 9110 · HTTP 语义</a></li>
</ul>`};export{e as default};