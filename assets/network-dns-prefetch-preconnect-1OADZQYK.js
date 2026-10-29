var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>这三个都是告诉浏览器“提前做点准备”，区别是准备到哪一步。</p>
<p><code>dns-prefetch</code> 只提前把域名解析成 IP，成本最低，适合可能会用到的第三方域名。<code>preconnect</code> 更进一步，把 DNS、TCP、TLS 握手都做完，适合马上就要请求、而且只有少数几个的关键域名。连接建好了却没人用，浏览器过一阵会关掉它，具体多久看浏览器，等于白建。</p>
<p><code>preload</code> 是直接把某个文件下载下来放进缓存，但不执行脚本、不应用样式。它适合浏览器发现得晚的关键资源，比如 CSS 里引用的字体、JS 才插进页面的首屏图片。</p>
<p>用 <code>preload</code> 要注意两点：<code>as</code> 必须写对；字体这类以 CORS 模式请求的资源还要加 <code>crossorigin</code>。不然缓存对不上，同一个文件会下载两次。</p>
</blockquote>
<h2>怎么写</h2>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">link</span> <span class="hljs-attr">rel</span>=<span class="hljs-string">&quot;preconnect&quot;</span> <span class="hljs-attr">href</span>=<span class="hljs-string">&quot;https://fonts.example&quot;</span> <span class="hljs-attr">crossorigin</span> /&gt;</span>
<span class="hljs-tag">&lt;<span class="hljs-name">link</span> <span class="hljs-attr">rel</span>=<span class="hljs-string">&quot;dns-prefetch&quot;</span> <span class="hljs-attr">href</span>=<span class="hljs-string">&quot;https://analytics.example&quot;</span> /&gt;</span>

<span class="hljs-tag">&lt;<span class="hljs-name">link</span> <span class="hljs-attr">rel</span>=<span class="hljs-string">&quot;preload&quot;</span> <span class="hljs-attr">href</span>=<span class="hljs-string">&quot;/fonts/inter.woff2&quot;</span> <span class="hljs-attr">as</span>=<span class="hljs-string">&quot;font&quot;</span> <span class="hljs-attr">type</span>=<span class="hljs-string">&quot;font/woff2&quot;</span> <span class="hljs-attr">crossorigin</span> /&gt;</span>
<span class="hljs-tag">&lt;<span class="hljs-name">link</span> <span class="hljs-attr">rel</span>=<span class="hljs-string">&quot;preload&quot;</span> <span class="hljs-attr">as</span>=<span class="hljs-string">&quot;image&quot;</span> <span class="hljs-attr">href</span>=<span class="hljs-string">&quot;/hero.avif&quot;</span> <span class="hljs-attr">fetchpriority</span>=<span class="hljs-string">&quot;high&quot;</span> /&gt;</span>
<span class="hljs-tag">&lt;<span class="hljs-name">link</span> <span class="hljs-attr">rel</span>=<span class="hljs-string">&quot;modulepreload&quot;</span> <span class="hljs-attr">href</span>=<span class="hljs-string">&quot;/assets/app.js&quot;</span> /&gt;</span>
</code></pre></div>
<p>先看第一行为什么带 <code>crossorigin</code>。浏览器会把 CORS 模式和普通模式的连接分开用。字体是用 CORS 模式请求的，所以提前建的连接也要带 <code>crossorigin</code>，不然建好的连接字体用不上。</p>
<p>字体那行的 <code>type</code> 是给浏览器一个机会：不支持这个格式，就直接跳过，不下载。</p>
<p>最后一行的 <code>modulepreload</code> 是专门给 ES 模块用的，它会下载并解析模块，比 <code>preload as=&quot;script&quot;</code> 更合适。</p>
<h2>响应式图片和多格式容易下载两次</h2>
<p>响应式图片可以用 <code>imagesrcset</code> 和 <code>imagesizes</code> 预加载正确尺寸的那张。但这两个值必须和 <code>&lt;img&gt;</code> 上的 <code>srcset</code>、<code>sizes</code> 完全一致。不一致的话，浏览器会按两套规则各挑一张，结果下载两次。</p>
<p>格式也一样。preload 不能像 <code>&lt;picture&gt;</code> 那样按格式回退。你同时 preload 了 AVIF 和 WebP，两种都支持的浏览器就会两张都下。所以只 preload 目标浏览器一定会用的那一种，或者在 <code>&lt;link&gt;</code> 上写 <code>type</code>，让不支持的浏览器跳过。</p>
<h2>怎么判断该不该用</h2>
<p>资源如果本来就写在 HTML 里，比如普通的 <code>&lt;img&gt;</code>、<code>&lt;script&gt;</code>，一般不用 preload。浏览器有个预加载扫描器，会提前扫 HTML 发现它们。</p>
<p>preload 也不是越多越好。预加载的资源会和其他资源抢带宽，预加载太多，真正关键的反而被推后。</p>
<p>预加载了却没用上，Chrome 会在大约 3 秒后在控制台警告。看到警告，要么是资源确实没用，要么是 <code>as</code>、<code>crossorigin</code> 写得不匹配。</p>
<p>另外两个相关的工具：想提高某个已经被发现的资源的优先级，用 <code>fetchpriority</code>，见<a href="/questions/network-fetch-priority/">《fetchpriority 能解决资源加载优先级问题吗？》</a>；下一个页面才用的资源用 <code>prefetch</code>，它以低优先级下载，预取整个下一页可以用 Speculation Rules。</p>
<h2>也可以写在响应头里</h2>
<div class="not-prose code-block"><div class="code-language">http</div><pre><code class="hljs language-http">Link: &lt;/fonts/inter.woff2&gt;; rel=preload; as=font; type=&quot;font/woff2&quot;; crossorigin
</code></pre></div>
<p>配合 103 Early Hints，服务器可以在 HTML 还没生成时就先把这些提示发出去，见<a href="/questions/network-early-hints/">《HTTP 103 Early Hints 适合怎样的加载优化？》</a>。</p>
<h2>常见追问</h2>
<p><strong>首屏图片加了 <code>loading=&quot;lazy&quot;</code>，又 preload 了？</strong></p>
<blockquote>
<p>这两个是矛盾的，一个说晚点加载，一个说赶紧加载。首屏图片不要懒加载。</p>
</blockquote>
<p><strong>怎么验证有没有效果？</strong></p>
<blockquote>
<p>看 DevTools 瀑布图里资源开始下载的时间有没有提前，再看 LCP 有没有改善。</p>
</blockquote>`};export{e as default};