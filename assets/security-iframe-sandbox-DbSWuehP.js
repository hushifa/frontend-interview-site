var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p><code>sandbox</code> 是 iframe 上的一个属性，用来限制里面的页面能做什么。只写 <code>sandbox</code> 不加值时最严格：里面的内容被当成一个谁都不认识的源，叫不透明源，而且不能运行脚本、提交表单、打开弹窗、跳转顶层页面，插件、自动播放这些也都禁止。</p>
<p>需要放开时，就往里加 <code>allow-*</code>，每加一个撤掉一项限制。常用的有 <code>allow-scripts</code>、<code>allow-forms</code>、<code>allow-popups</code>、<code>allow-same-origin</code> 和 <code>allow-top-navigation-by-user-activation</code>。</p>
<p><code>allow-same-origin</code> 容易被误解。它只是让文档保留自己原本的源，不会让跨源内容变成和父页面同源。</p>
<p>最危险的组合是：iframe 的内容和父页面同源，又同时开了 <code>allow-scripts</code> 和 <code>allow-same-origin</code>。这时里面的脚本可以访问 <code>parent.document</code>，把 iframe 上的 <code>sandbox</code> 属性删掉再重新加载自己，沙箱就等于没有。所以展示用户提供的 HTML 时，要放在独立的源上，再配合 sandbox。</p>
</blockquote>
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
<p>第三个例子同时开了脚本和同源，为什么不危险？因为 <code>pay.example</code> 和父页面本来就跨源。<code>allow-same-origin</code> 只是让它拿回自己的源，它照样受同源策略约束，访问不了父页面，也就拆不掉沙箱。危险只发生在内容和父页面同源的时候。</p>
<h2>为什么 srcdoc 要特别小心</h2>
<p><code>srcdoc</code> 是直接把 HTML 字符串写在 iframe 属性里，它的内容默认和父页面同源。所以用 <code>srcdoc</code> 展示不可信的 HTML 时，绝对不要同时允许脚本和同源，否则就是上面说的那个最危险的组合。</p>
<h2>其他需要注意的点</h2>
<p><code>allow-top-navigation</code> 允许 iframe 随时把整个页面跳走，用户什么都没点，页面就到了别的网站。所以优先用 <code>allow-top-navigation-by-user-activation</code>，只有用户点击后才允许跳转。</p>
<p><code>allow-popups</code> 打开的新窗口默认继承沙箱限制，要再加 <code>allow-popups-to-escape-sandbox</code> 才会解除。</p>
<p>除了嵌入方写属性，服务端也可以用响应头 <code>Content-Security-Policy: sandbox</code> 给文档本身加沙箱。用户上传文件的下载域很适合这样做，不管文件被谁、用什么方式打开，限制都在。</p>
<h2>和其他机制怎么分工</h2>
<table><thead><tr><th>机制</th><th>控制什么</th></tr></thead><tbody><tr><td><code>sandbox</code></td><td>嵌入方限制 iframe 内的能力</td></tr><tr><td><code>allow</code> 属性 / Permissions Policy</td><td>iframe 能否使用摄像头、地理位置等能力，见<a href="/questions/security-permissions-policy/">《Permissions Policy 怎样限制页面和 iframe 的设备能力？》</a></td></tr><tr><td><code>frame-ancestors</code></td><td>被嵌入方限制谁能嵌入自己</td></tr><tr><td><code>postMessage</code> 校验</td><td>父子窗口之间的消息信任</td></tr></tbody></table>
<h2>常见追问</h2>
<p><strong>沙箱里的脚本能用 <code>localStorage</code> 吗？</strong></p>
<blockquote>
<p>没有 <code>allow-same-origin</code> 时不能。这时它处于不透明源，访问存储会抛出异常。</p>
</blockquote>
<p><strong>被嵌入的页面怎么知道自己在沙箱里？</strong></p>
<blockquote>
<p>没有专门的 API 直接告诉它，只能做能力检测，比如试着访问存储，看会不会抛错。</p>
</blockquote>`};export{e as default};