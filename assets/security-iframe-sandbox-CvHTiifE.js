var e={answerHtml:`<h2>简答</h2>
<ul>
<li><code>sandbox</code> 不写值就是最严格的：不透明源、禁止脚本、表单、弹窗、顶层导航、插件、自动播放等。</li>
<li>常用允许项：<code>allow-scripts</code>、<code>allow-forms</code>、<code>allow-popups</code>、<code>allow-same-origin</code>、<code>allow-top-navigation-by-user-activation</code>。</li>
<li><code>allow-same-origin</code> 只是保留文档原本的源，不会让跨源内容变成同源。</li>
<li>内容与父页面同源时，<code>allow-scripts</code> 加 <code>allow-same-origin</code> 等于没有沙箱：脚本可以访问 <code>parent.document</code>，删掉 iframe 的 <code>sandbox</code> 属性再重新加载自己。</li>
<li>展示用户提供的 HTML 时，放在独立的源（如 <code>usercontent.example</code>）上，再配合 sandbox。</li>
</ul>
<h2>常见组合</h2>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-comment">&lt;!-- 只展示静态内容 --&gt;</span>
<span class="hljs-tag">&lt;<span class="hljs-name">iframe</span> <span class="hljs-attr">sandbox</span> <span class="hljs-attr">src</span>=<span class="hljs-string">&quot;/preview.html&quot;</span>&gt;</span><span class="hljs-tag">&lt;/<span class="hljs-name">iframe</span>&gt;</span>

<span class="hljs-comment">&lt;!-- 第三方小组件：可以运行脚本，但处于不透明源，读不到自己的 Cookie 和存储 --&gt;</span>
<span class="hljs-tag">&lt;<span class="hljs-name">iframe</span> <span class="hljs-attr">sandbox</span>=<span class="hljs-string">&quot;allow-scripts&quot;</span> <span class="hljs-attr">src</span>=<span class="hljs-string">&quot;https://widget.example/embed&quot;</span>&gt;</span><span class="hljs-tag">&lt;/<span class="hljs-name">iframe</span>&gt;</span>

<span class="hljs-comment">&lt;!-- 第三方登录或支付：需要自己的源和用户点击触发的顶层跳转 --&gt;</span>
<span class="hljs-tag">&lt;<span class="hljs-name">iframe</span>
  <span class="hljs-attr">sandbox</span>=<span class="hljs-string">&quot;allow-scripts allow-same-origin allow-forms allow-popups allow-top-navigation-by-user-activation&quot;</span>
  <span class="hljs-attr">src</span>=<span class="hljs-string">&quot;https://pay.example/checkout&quot;</span>
&gt;</span><span class="hljs-tag">&lt;/<span class="hljs-name">iframe</span>&gt;</span>
</code></pre></div>
<p>第三方页面跨源，开 <code>allow-same-origin</code> 后它也只是拿回自己的源，仍然不能访问父页面。</p>
<h2>需要注意的点</h2>
<ul>
<li><code>allow-top-navigation</code> 允许 iframe 随时把整个页面跳走，优先用 <code>allow-top-navigation-by-user-activation</code>。</li>
<li><code>allow-popups</code> 打开的新窗口默认继承沙箱；加 <code>allow-popups-to-escape-sandbox</code> 才会解除。</li>
<li><code>srcdoc</code> 内容默认与父页面同源，展示不可信 HTML 时绝对不要同时允许脚本和同源。</li>
<li>服务端也可以用响应头 <code>Content-Security-Policy: sandbox</code> 对文档本身施加沙箱，适合用户上传文件的下载域。</li>
</ul>
<h2>与其他机制的分工</h2>
<table><thead><tr><th>机制</th><th>控制什么</th></tr></thead><tbody><tr><td><code>sandbox</code></td><td>嵌入方限制 iframe 内的能力</td></tr><tr><td><code>allow</code> 属性 / Permissions Policy</td><td>iframe 能否使用摄像头、地理位置等能力，见《Permissions Policy 怎样限制页面和 iframe 的设备能力？》</td></tr><tr><td><code>frame-ancestors</code></td><td>被嵌入方限制谁能嵌入自己</td></tr><tr><td><code>postMessage</code> 校验</td><td>父子窗口之间的消息信任</td></tr></tbody></table>
<h2>常见追问</h2>
<ul>
<li>沙箱里的脚本能用 <code>localStorage</code> 吗？没有 <code>allow-same-origin</code> 时处于不透明源，访问存储会抛出异常。</li>
<li>被嵌入方怎么知道自己在沙箱里？可以通过能力检测（如访问存储是否抛错）判断，没有专门的 API 直接告知。</li>
</ul>`};export{e as default};