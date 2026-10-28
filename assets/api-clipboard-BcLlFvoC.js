var e={answerHtml:`<h2>简答</h2>
<ul>
<li><code>navigator.clipboard</code> 只在 HTTPS 或 localhost 下存在。</li>
<li><code>writeText()</code> 一般要在点击等用户操作中调用，否则可能被拒绝；页面没有焦点时也会失败。</li>
<li><code>readText()</code> 涉及隐私，Chromium 会请求 <code>clipboard-read</code> 权限，Firefox 和 Safari 会在页面上显示粘贴确认。</li>
<li>在 iframe 里使用要由父页面授权：<code>&lt;iframe allow=&quot;clipboard-read; clipboard-write&quot;&gt;</code>。</li>
<li>写入失败要给用户手动复制的降级方式。</li>
</ul>
<h2>复制按钮</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js">copyButton.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;click&#x27;</span>, <span class="hljs-title function_">async</span> () =&gt; {
  <span class="hljs-keyword">try</span> {
    <span class="hljs-keyword">await</span> navigator.<span class="hljs-property">clipboard</span>.<span class="hljs-title function_">writeText</span>(codeBlock.<span class="hljs-property">textContent</span>);
    <span class="hljs-title function_">showToast</span>(<span class="hljs-string">&#x27;已复制&#x27;</span>);
  } <span class="hljs-keyword">catch</span> (error) {
    <span class="hljs-title function_">selectText</span>(codeBlock);
    <span class="hljs-title function_">showToast</span>(<span class="hljs-string">&#x27;复制失败，请按 Ctrl+C 手动复制&#x27;</span>);
  }
});
</code></pre></div>
<p><code>await</code> 之后再调用 <code>writeText()</code> 时，用户激活可能已经过期，例如先等待网络请求再复制。需要先请求数据的场景，可以传入 Promise 给 <code>ClipboardItem</code>：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js">button.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;click&#x27;</span>, <span class="hljs-function">() =&gt;</span> {
  <span class="hljs-keyword">const</span> item = <span class="hljs-keyword">new</span> <span class="hljs-title class_">ClipboardItem</span>({
    <span class="hljs-string">&#x27;text/plain&#x27;</span>: <span class="hljs-title function_">fetch</span>(<span class="hljs-string">&#x27;/api/share-link&#x27;</span>).<span class="hljs-title function_">then</span>(<span class="hljs-function">(<span class="hljs-params">r</span>) =&gt;</span> r.<span class="hljs-title function_">text</span>()).<span class="hljs-title function_">then</span>(<span class="hljs-function">(<span class="hljs-params">t</span>) =&gt;</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Blob</span>([t], { <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;text/plain&#x27;</span> })),
  });
  <span class="hljs-keyword">return</span> navigator.<span class="hljs-property">clipboard</span>.<span class="hljs-title function_">write</span>([item]);
});
</code></pre></div>
<p><code>write()</code> 在点击处理函数中同步调用，数据随后到达。</p>
<h2>读取剪贴板</h2>
<p>更推荐监听 <code>paste</code> 事件，从 <code>event.clipboardData</code> 读取用户主动粘贴的内容，不需要额外权限：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js">editor.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;paste&#x27;</span>, <span class="hljs-function">(<span class="hljs-params">event</span>) =&gt;</span> {
  <span class="hljs-keyword">const</span> files = [...event.<span class="hljs-property">clipboardData</span>.<span class="hljs-property">files</span>];
  <span class="hljs-keyword">if</span> (files.<span class="hljs-property">length</span> &gt; <span class="hljs-number">0</span>) {
    event.<span class="hljs-title function_">preventDefault</span>();
    <span class="hljs-title function_">uploadImages</span>(files);
  }
});
</code></pre></div>
<h2>常见错误</h2>
<table><thead><tr><th>错误</th><th>原因</th></tr></thead><tbody><tr><td><code>navigator.clipboard</code> 是 <code>undefined</code></td><td>页面不是安全上下文</td></tr><tr><td><code>NotAllowedError</code></td><td>没有用户激活、页面不在焦点或权限被拒绝</td></tr><tr><td>iframe 中失败</td><td>父页面没有通过 <code>allow</code> 授权</td></tr></tbody></table>
<p>写入图片等富格式时，<code>image/png</code> 支持较好，其他格式支持情况因浏览器而异，可以用 <code>ClipboardItem.supports(type)</code> 检测。</p>`};export{e as default};