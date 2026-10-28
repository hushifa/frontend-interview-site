var e={answerHtml:`<h2>简答</h2>
<ul>
<li><code>navigator.share()</code> 打开系统分享面板，只能在安全上下文中、由用户点击等手势触发调用。</li>
<li>移动端浏览器和部分桌面浏览器支持，桌面版 Firefox 等不支持，要先检测 <code>navigator.share</code> 是否存在。</li>
<li>分享文件前用 <code>navigator.canShare({ files })</code> 检查，部分平台只支持分享链接和文本。</li>
<li>用户关闭分享面板时 Promise 以 <code>AbortError</code> 拒绝，这不是错误，不应提示失败。</li>
<li>不支持时降级为复制链接（<code>navigator.clipboard.writeText</code>），复制也失败时显示可选中的链接文本。</li>
</ul>
<h2>完整的分享按钮</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">share</span>(<span class="hljs-params">{ title, url }</span>) {
  <span class="hljs-keyword">if</span> (navigator.<span class="hljs-property">share</span>) {
    <span class="hljs-keyword">try</span> {
      <span class="hljs-keyword">await</span> navigator.<span class="hljs-title function_">share</span>({ title, url });
      <span class="hljs-keyword">return</span> <span class="hljs-string">&#x27;shared&#x27;</span>;
    } <span class="hljs-keyword">catch</span> (error) {
      <span class="hljs-keyword">if</span> (error.<span class="hljs-property">name</span> === <span class="hljs-string">&#x27;AbortError&#x27;</span>) <span class="hljs-keyword">return</span> <span class="hljs-string">&#x27;cancelled&#x27;</span>;
      <span class="hljs-comment">// 其他错误继续走降级</span>
    }
  }

  <span class="hljs-keyword">try</span> {
    <span class="hljs-keyword">await</span> navigator.<span class="hljs-property">clipboard</span>.<span class="hljs-title function_">writeText</span>(url);
    <span class="hljs-title function_">showToast</span>(<span class="hljs-string">&#x27;链接已复制&#x27;</span>);
    <span class="hljs-keyword">return</span> <span class="hljs-string">&#x27;copied&#x27;</span>;
  } <span class="hljs-keyword">catch</span> {
    <span class="hljs-title function_">showLinkDialog</span>(url); <span class="hljs-comment">// 让用户手动复制</span>
    <span class="hljs-keyword">return</span> <span class="hljs-string">&#x27;manual&#x27;</span>;
  }
}

shareButton.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;click&#x27;</span>, <span class="hljs-function">() =&gt;</span> {
  <span class="hljs-title function_">share</span>({ <span class="hljs-attr">title</span>: <span class="hljs-variable language_">document</span>.<span class="hljs-property">title</span>, <span class="hljs-attr">url</span>: location.<span class="hljs-property">href</span> });
});
</code></pre></div>
<ul>
<li>调用必须直接发生在点击处理中。先 <code>await</code> 一个网络请求再调用 <code>share()</code>，用户激活可能已经失效，会抛 <code>NotAllowedError</code>。</li>
<li>同一时间只能有一个分享面板，重复点击会抛 <code>InvalidStateError</code>，可以在分享期间禁用按钮。</li>
</ul>
<h2>分享文件</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> file = <span class="hljs-keyword">new</span> <span class="hljs-title class_">File</span>([blob], <span class="hljs-string">&#x27;poster.png&#x27;</span>, { <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;image/png&#x27;</span> });

<span class="hljs-keyword">if</span> (navigator.<span class="hljs-property">canShare</span>?.({ <span class="hljs-attr">files</span>: [file] })) {
  <span class="hljs-keyword">await</span> navigator.<span class="hljs-title function_">share</span>({ <span class="hljs-attr">files</span>: [file], <span class="hljs-attr">title</span>: <span class="hljs-string">&#x27;活动海报&#x27;</span> });
} <span class="hljs-keyword">else</span> {
  <span class="hljs-title function_">downloadFile</span>(file);
}
</code></pre></div>
<p>允许分享的文件类型由浏览器决定，常见图片、PDF、文本一般支持。</p>
<h2>安全与隐私</h2>
<ul>
<li>分享内容会交给用户选择的其他应用，不要在 URL 中带上会话令牌或个人信息。</li>
<li>在 iframe 中调用需要父页面通过 <code>allow=&quot;web-share&quot;</code> 授权。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li>怎样让分享出去的链接显示标题和图片？这由目标应用抓取页面的 Open Graph 元信息决定，与 Web Share API 无关。</li>
<li>可以接收别的应用分享过来的内容吗？安装后的 PWA 可以在 Manifest 中声明 <code>share_target</code>，目前主要在 Chromium 中支持。</li>
</ul>`};export{e as default};