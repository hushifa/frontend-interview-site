var e={answerHtml:`<h2>简答</h2>
<ul>
<li><code>dns-prefetch</code>：只做 DNS 解析，成本最低，适合可能用到的第三方域名。</li>
<li><code>preconnect</code>：完成 DNS、TCP、TLS 握手，适合马上就会请求、且只有少数几个的关键域名。连接没有被使用时，浏览器会在一段时间后关闭它，时长取决于浏览器，用不到就白白浪费。</li>
<li><code>preload</code>：下载指定资源并放入缓存，但不执行脚本、不应用样式。适合浏览器发现得晚的关键资源，如 CSS 里引用的字体、JS 才插入的首屏图片。</li>
<li><code>preload</code> 必须写对 <code>as</code>；字体等以 CORS 模式请求的资源还要加 <code>crossorigin</code>，否则缓存匹配失败，资源会下载两次。</li>
</ul>
<h2>写法</h2>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">link</span> <span class="hljs-attr">rel</span>=<span class="hljs-string">&quot;preconnect&quot;</span> <span class="hljs-attr">href</span>=<span class="hljs-string">&quot;https://fonts.example&quot;</span> <span class="hljs-attr">crossorigin</span> /&gt;</span>
<span class="hljs-tag">&lt;<span class="hljs-name">link</span> <span class="hljs-attr">rel</span>=<span class="hljs-string">&quot;dns-prefetch&quot;</span> <span class="hljs-attr">href</span>=<span class="hljs-string">&quot;https://analytics.example&quot;</span> /&gt;</span>

<span class="hljs-tag">&lt;<span class="hljs-name">link</span> <span class="hljs-attr">rel</span>=<span class="hljs-string">&quot;preload&quot;</span> <span class="hljs-attr">href</span>=<span class="hljs-string">&quot;/fonts/inter.woff2&quot;</span> <span class="hljs-attr">as</span>=<span class="hljs-string">&quot;font&quot;</span> <span class="hljs-attr">type</span>=<span class="hljs-string">&quot;font/woff2&quot;</span> <span class="hljs-attr">crossorigin</span> /&gt;</span>
<span class="hljs-tag">&lt;<span class="hljs-name">link</span> <span class="hljs-attr">rel</span>=<span class="hljs-string">&quot;preload&quot;</span> <span class="hljs-attr">as</span>=<span class="hljs-string">&quot;image&quot;</span> <span class="hljs-attr">href</span>=<span class="hljs-string">&quot;/hero.avif&quot;</span> <span class="hljs-attr">fetchpriority</span>=<span class="hljs-string">&quot;high&quot;</span> /&gt;</span>
<span class="hljs-tag">&lt;<span class="hljs-name">link</span> <span class="hljs-attr">rel</span>=<span class="hljs-string">&quot;modulepreload&quot;</span> <span class="hljs-attr">href</span>=<span class="hljs-string">&quot;/assets/app.js&quot;</span> /&gt;</span>
</code></pre></div>
<ul>
<li><code>preconnect</code> 的 <code>crossorigin</code> 要和后续请求一致：字体用 CORS 模式请求，就需要带 <code>crossorigin</code> 的连接。</li>
<li><code>type</code> 让浏览器在不支持该格式时跳过下载。</li>
<li><code>modulepreload</code> 用于 ES 模块，会下载并解析模块，比 <code>preload as=&quot;script&quot;</code> 更合适。</li>
<li>响应式图片可以用 <code>imagesrcset</code> 和 <code>imagesizes</code> 预加载正确尺寸，取值必须和 <code>&lt;img&gt;</code> 的 <code>srcset</code>、<code>sizes</code> 完全一致，否则浏览器会按两套规则各选一张，下载两次。</li>
<li>preload 不能像 <code>&lt;picture&gt;</code> 那样按格式回退。同时 preload AVIF 和 WebP，支持两者的浏览器会两张都下载；只 preload 目标浏览器一定会用到的那一种，或在 <code>&lt;link&gt;</code> 上用 <code>type</code> 让不支持的浏览器跳过。</li>
</ul>
<h2>怎么判断该不该用</h2>
<ul>
<li>资源在 HTML 里本来就能被扫描到（普通 <code>&lt;img&gt;</code>、<code>&lt;script&gt;</code>），通常不需要 preload，浏览器的预加载扫描器已经会提前发现。</li>
<li>preload 的资源会和其他资源竞争带宽，预加载太多会推迟真正关键的资源。</li>
<li>preload 后约 3 秒内没被使用，Chrome 控制台会警告，说明资源没用上或 <code>as</code>、<code>crossorigin</code> 不匹配。</li>
<li>想提高某个已发现资源的优先级，用 <code>fetchpriority</code>，见<a href="/questions/network-fetch-priority/">《fetchpriority 能解决资源加载优先级问题吗？》</a>。</li>
<li>下一个页面才用到的资源用 <code>prefetch</code>，以低优先级下载；预取整个下一页可以用 Speculation Rules。</li>
</ul>
<h2>也可以用响应头</h2>
<div class="not-prose code-block"><div class="code-language">http</div><pre><code class="hljs language-http">Link: &lt;/fonts/inter.woff2&gt;; rel=preload; as=font; type=&quot;font/woff2&quot;; crossorigin
</code></pre></div>
<p>配合 103 Early Hints，服务器可以在生成 HTML 前就发出这些提示，见<a href="/questions/network-early-hints/">《HTTP 103 Early Hints 适合怎样的加载优化？》</a>。</p>
<h2>常见追问</h2>
<ul>
<li>为什么首屏图片用了 <code>loading=&quot;lazy&quot;</code> 还 preload？两者矛盾，首屏图片不要懒加载。</li>
<li>怎么验证效果？看 DevTools 瀑布图中资源的开始时间是否提前，以及 LCP 是否改善。</li>
</ul>`};export{e as default};