var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>网页上点一下“分享”，弹出手机系统自带的分享面板，用的就是 <code>navigator.share()</code>。它有两个前提：页面要在安全上下文里，比如 HTTPS；调用要由用户点击这类操作直接触发。</p>
<p>支持并不全。移动端浏览器和部分桌面浏览器支持，桌面版 Firefox 等不支持，所以要先检测 <code>navigator.share</code> 在不在。分享文件前还要用 <code>navigator.canShare({ files })</code> 检查，有的平台只能分享链接和文本。</p>
<p>用户自己关掉分享面板时，Promise 会以 <code>AbortError</code> 拒绝。这不算失败，不应该提示“分享失败”。</p>
<p>不支持时就降级成复制链接，用 <code>navigator.clipboard.writeText</code>；复制也失败了，就显示一段能选中的链接文本，让用户手动复制。</p>
</blockquote>
<h2>一个完整的分享按钮</h2>
<p>下面的函数按“系统分享 → 复制链接 → 手动复制”的顺序一层层降级。</p>
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
<p><code>AbortError</code> 单独判断，直接返回 <code>&#x27;cancelled&#x27;</code>，因为那是用户自己取消的。其他错误才往下走降级。</p>
<h2>为什么先请求数据再分享会失败</h2>
<p>浏览器要求 <code>share()</code> 直接发生在用户的点击里。如果点击后先 <code>await</code> 一个网络请求，再调用 <code>share()</code>，这时“用户刚刚点过”的状态可能已经失效，就会抛 <code>NotAllowedError</code>。所以要分享的内容最好提前准备好。</p>
<p>还有一个情况：同一时间只能有一个分享面板，面板开着时再点一次会抛 <code>InvalidStateError</code>。可以在分享期间先把按钮禁用。</p>
<h2>怎样分享文件</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> file = <span class="hljs-keyword">new</span> <span class="hljs-title class_">File</span>([blob], <span class="hljs-string">&#x27;poster.png&#x27;</span>, { <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;image/png&#x27;</span> });

<span class="hljs-keyword">if</span> (navigator.<span class="hljs-property">canShare</span>?.({ <span class="hljs-attr">files</span>: [file] })) {
  <span class="hljs-keyword">await</span> navigator.<span class="hljs-title function_">share</span>({ <span class="hljs-attr">files</span>: [file], <span class="hljs-attr">title</span>: <span class="hljs-string">&#x27;活动海报&#x27;</span> });
} <span class="hljs-keyword">else</span> {
  <span class="hljs-title function_">downloadFile</span>(file);
}
</code></pre></div>
<p>先用 <code>canShare</code> 问一下这个文件能不能分享，不能就改成下载。允许哪些文件类型由浏览器决定，常见的图片、PDF、文本一般都支持。</p>
<h2>安全和隐私要注意什么</h2>
<p>分享出去的内容会交给用户选的另一个应用，所以不要在 URL 里带会话令牌或个人信息。</p>
<p>如果在 iframe 里调用，需要父页面用 <code>allow=&quot;web-share&quot;</code> 授权。</p>
<h2>常见追问</h2>
<p><strong>怎样让分享出去的链接显示标题和图片？</strong></p>
<blockquote>
<p>这跟 Web Share API 没关系。是目标应用去抓取页面的 Open Graph 元信息，再显示出标题和图片。</p>
</blockquote>
<p><strong>网页能接收别的应用分享过来的内容吗？</strong></p>
<blockquote>
<p>安装后的 PWA 可以在 Manifest 里声明 <code>share_target</code>，这样它就能出现在系统分享面板里。目前主要是 Chromium 支持。</p>
</blockquote>`};export{e as default};