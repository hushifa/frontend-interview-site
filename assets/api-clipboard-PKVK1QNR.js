var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>做“复制”按钮时，经常遇到 <code>navigator.clipboard</code> 是 <code>undefined</code>，或者调用时抛 <code>NotAllowedError</code>。原因是剪贴板里可能有用户的密码、隐私，浏览器不让网页随便碰。</p>
<p>第一道限制是安全上下文，<code>navigator.clipboard</code> 只在 HTTPS 或 localhost 下存在。第二道是用户激活，也就是“用户刚刚点了一下”，<code>writeText()</code> 一般要在点击这类操作里调用，页面没有焦点也会失败。读取更严，Chromium 会请求 <code>clipboard-read</code> 权限，Firefox 和 Safari 会在页面上显示粘贴确认。</p>
<p>在 iframe 里用，还要父页面用 <code>allow=&quot;clipboard-read; clipboard-write&quot;</code> 授权。</p>
<p>实际开发中有两点。一是先 <code>await</code> 网络请求再复制，用户激活可能已经过期，可以把 Promise 交给 <code>ClipboardItem</code>。二是写入失败要给用户手动复制的办法。读取用户粘贴的内容，更推荐监听 <code>paste</code> 事件。</p>
</blockquote>
<h2>写一个复制按钮</h2>
<p>下面是一个带降级的复制按钮，失败时选中文本，提示用户自己按快捷键。</p>
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
<p>这里 <code>writeText()</code> 是在点击处理函数里直接调用的，用户激活还有效，所以一般能成功。失败的情况多半是页面不在焦点，或者浏览器策略拒绝了，所以 <code>catch</code> 里一定要有退路。</p>
<h2>为什么先请求数据再复制会失败</h2>
<p>用户激活，指的是浏览器记录“用户刚刚操作过”，它只在操作后的一小段时间里有效。如果点击后先 <code>await fetch(...)</code> 等分享链接回来，再调用 <code>writeText()</code>，这时激活可能已经过期，就会被拒绝。</p>
<p>改法是在点击里同步调用 <code>write()</code>，数据用 Promise 的形式交给 <code>ClipboardItem</code>，等它自己到达：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js">button.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;click&#x27;</span>, <span class="hljs-function">() =&gt;</span> {
  <span class="hljs-keyword">const</span> item = <span class="hljs-keyword">new</span> <span class="hljs-title class_">ClipboardItem</span>({
    <span class="hljs-string">&#x27;text/plain&#x27;</span>: <span class="hljs-title function_">fetch</span>(<span class="hljs-string">&#x27;/api/share-link&#x27;</span>).<span class="hljs-title function_">then</span>(<span class="hljs-function">(<span class="hljs-params">r</span>) =&gt;</span> r.<span class="hljs-title function_">text</span>()).<span class="hljs-title function_">then</span>(<span class="hljs-function">(<span class="hljs-params">t</span>) =&gt;</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Blob</span>([t], { <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;text/plain&#x27;</span> })),
  });
  <span class="hljs-keyword">return</span> navigator.<span class="hljs-property">clipboard</span>.<span class="hljs-title function_">write</span>([item]);
});
</code></pre></div>
<p><code>write()</code> 是在点击处理函数中同步调用的，浏览器认这次操作，数据随后到达也没关系。</p>
<h2>读取剪贴板，优先用 paste 事件</h2>
<p><code>readText()</code> 要权限或确认，体验不好。更推荐的做法是监听 <code>paste</code> 事件，用户自己按了粘贴，从 <code>event.clipboardData</code> 里读，不需要额外权限：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js">editor.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;paste&#x27;</span>, <span class="hljs-function">(<span class="hljs-params">event</span>) =&gt;</span> {
  <span class="hljs-keyword">const</span> files = [...event.<span class="hljs-property">clipboardData</span>.<span class="hljs-property">files</span>];
  <span class="hljs-keyword">if</span> (files.<span class="hljs-property">length</span> &gt; <span class="hljs-number">0</span>) {
    event.<span class="hljs-title function_">preventDefault</span>();
    <span class="hljs-title function_">uploadImages</span>(files);
  }
});
</code></pre></div>
<p>这样能拿到用户粘贴的图片文件，比如截图直接粘进编辑器上传。</p>
<h2>遇到错误怎么排查</h2>
<p>如果 <code>navigator.clipboard</code> 是 <code>undefined</code>，说明页面不是安全上下文，先检查是不是 HTTPS 或 localhost。如果抛 <code>NotAllowedError</code>，原因是没有用户激活、页面不在焦点，或者权限被拒绝。如果只在 iframe 中失败，多半是父页面没有通过 <code>allow</code> 授权。</p>
<p>写入图片等富格式时，<code>image/png</code> 支持较好，其他格式各浏览器不一样，可以先用 <code>ClipboardItem.supports(type)</code> 检测。</p>
<h2>常见追问</h2>
<p><strong>为什么 localhost 能用，部署到内网 HTTP 地址就不能用了？</strong></p>
<blockquote>
<p>因为 localhost 被当作安全上下文，普通 HTTP 地址不是。<code>navigator.clipboard</code> 只在安全上下文中存在，所以内网 HTTP 地址上它是 <code>undefined</code>，要换成 HTTPS。</p>
</blockquote>
<p><strong>怎样读取用户粘贴的图片？</strong></p>
<blockquote>
<p>监听 <code>paste</code> 事件，从 <code>event.clipboardData.files</code> 里拿文件。这是用户主动粘贴，不需要申请读取权限。</p>
</blockquote>`};export{e as default};