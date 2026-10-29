var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>浏览器读 HTML 时碰到一个普通的 <code>&lt;script src&gt;</code>，会停下来，等脚本下载完、执行完才接着往下读。放在 head 里的大脚本，就会推迟页面显示。</p>
<p><code>defer</code> 和 <code>async</code> 都让下载不再挡着解析，区别在什么时候执行。<code>defer</code> 等 HTML 全部解析完，在 <code>DOMContentLoaded</code> 之前按书写顺序执行。<code>async</code> 下载完马上执行，多个 async 脚本谁先下载完谁先执行。</p>
<p><code>type=&quot;module&quot;</code> 默认就像 <code>defer</code>，也可以加 <code>async</code>。它还开启了模块的规则：能用 <code>import</code>，自动严格模式，顶层变量不会跑到全局，同一个模块只执行一次。</p>
<p>怎么选：依赖页面 DOM 或其他脚本的代码，用 <code>defer</code> 或模块；统计、广告这种独立的脚本，用 <code>async</code>。要注意下载不挡解析，不等于页面不卡，脚本执行时照样占主线程。</p>
</blockquote>
<h2>三种方式的时间线</h2>
<div class="not-prose code-block"><div class="code-language">text</div><pre><code class="hljs language-text">普通：  解析 ──停──[下载][执行]── 继续解析
defer： 解析 ─────────────────────── 完成 → [执行]
          └──[下载]──┘
async： 解析 ─────停──[执行]── 继续解析
          └──[下载]┘
</code></pre></div>
<p>普通脚本，下载和执行都在解析的路上，解析只能等着。</p>
<p><code>defer</code> 的下载和解析同时进行，执行被推到解析完成以后，所以完全不打断解析。</p>
<p><code>async</code> 的下载也是同时进行的，可是一下载完就插队执行，执行的这段时间解析还是要停下来。而且执行时机取决于下载快慢，所以顺序没法保证。</p>
<h2>写法和要注意的地方</h2>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">head</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">script</span> <span class="hljs-attr">src</span>=<span class="hljs-string">&quot;/app.js&quot;</span> <span class="hljs-attr">defer</span>&gt;</span><span class="hljs-tag">&lt;/<span class="hljs-name">script</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">script</span> <span class="hljs-attr">type</span>=<span class="hljs-string">&quot;module&quot;</span> <span class="hljs-attr">src</span>=<span class="hljs-string">&quot;/main.js&quot;</span>&gt;</span><span class="hljs-tag">&lt;/<span class="hljs-name">script</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">script</span> <span class="hljs-attr">src</span>=<span class="hljs-string">&quot;https://analytics.example.com/a.js&quot;</span> <span class="hljs-attr">async</span>&gt;</span><span class="hljs-tag">&lt;/<span class="hljs-name">script</span>&gt;</span>
<span class="hljs-tag">&lt;/<span class="hljs-name">head</span>&gt;</span>
</code></pre></div>
<p><code>defer</code> 和 <code>async</code> 只对外部脚本生效，写在内联脚本上没有用。内联的模块脚本是例外，可以加 <code>async</code>。</p>
<p>模块脚本跨源加载时，服务器需要返回 CORS 响应头，不然加载不了。</p>
<p>用 JavaScript 动态创建的 <code>&lt;script&gt;</code>，默认就是 async 的。需要它们按顺序执行时，设置 <code>script.async = false</code>。</p>
<h2>用了 defer，为什么页面还是卡</h2>
<p><code>defer</code> 只解决了下载阻塞解析的问题，脚本执行时仍然占着主线程。一个很大的打包文件，就算用了 <code>defer</code>，执行的那段时间用户点什么都没反应。</p>
<p>所以减少首屏的 JavaScript、按路由拆分代码，比调整这几个属性更重要。</p>
<h2>想提前下载脚本怎么办</h2>
<p><code>&lt;link rel=&quot;modulepreload&quot; href=&quot;/chunk.js&quot;&gt;</code> 提前下载并解析模块依赖，等真正用到时就不用再等。</p>
<p><code>&lt;link rel=&quot;preload&quot; as=&quot;script&quot;&gt;</code> 提前下载普通脚本，但只下载不执行。</p>
<h2>常见追问</h2>
<p><strong>脚本放在 body 末尾，和放在 head 里加 defer，有什么区别？</strong></p>
<blockquote>
<p>两种都不阻塞解析。区别在于下载开始的时间。放在 head 里，浏览器一开始就发现了它，马上开始下载；放在 body 末尾，要等前面的 HTML 都读完才发现。所以 <code>defer</code> 通常更快。</p>
</blockquote>`};export{e as default};