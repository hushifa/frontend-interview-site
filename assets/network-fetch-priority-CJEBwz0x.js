var e={answerHtml:`<h2>简答</h2>
<ul>
<li>取值 <code>high</code>、<code>low</code>、<code>auto</code>，可以用在 <code>&lt;img&gt;</code>、<code>&lt;link&gt;</code>、<code>&lt;script&gt;</code>、<code>&lt;iframe&gt;</code> 和 <code>fetch()</code> 上。</li>
<li>浏览器默认把图片设为低优先级，等布局确定在视口内后才提升。首屏主图加 <code>fetchpriority=&quot;high&quot;</code> 可以从一开始就以高优先级请求，常用于改善 LCP。</li>
<li>它是提示，浏览器可以不采纳，也不改变资源被发现的时机。</li>
<li>资源藏在 CSS 或 JS 里发现得晚，先用 <code>preload</code> 让它被提前发现；首屏图片不要用 <code>loading=&quot;lazy&quot;</code>。</li>
</ul>
<h2>用法</h2>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">img</span> <span class="hljs-attr">src</span>=<span class="hljs-string">&quot;/hero.avif&quot;</span> <span class="hljs-attr">alt</span>=<span class="hljs-string">&quot;产品主图&quot;</span> <span class="hljs-attr">fetchpriority</span>=<span class="hljs-string">&quot;high&quot;</span> <span class="hljs-attr">width</span>=<span class="hljs-string">&quot;1200&quot;</span> <span class="hljs-attr">height</span>=<span class="hljs-string">&quot;600&quot;</span> /&gt;</span>

<span class="hljs-comment">&lt;!-- 轮播中初始不可见的图片 --&gt;</span>
<span class="hljs-tag">&lt;<span class="hljs-name">img</span> <span class="hljs-attr">src</span>=<span class="hljs-string">&quot;/slide-2.avif&quot;</span> <span class="hljs-attr">alt</span>=<span class="hljs-string">&quot;&quot;</span> <span class="hljs-attr">fetchpriority</span>=<span class="hljs-string">&quot;low&quot;</span> /&gt;</span>

<span class="hljs-comment">&lt;!-- 背景图在 CSS 中，先预加载再提升 --&gt;</span>
<span class="hljs-tag">&lt;<span class="hljs-name">link</span> <span class="hljs-attr">rel</span>=<span class="hljs-string">&quot;preload&quot;</span> <span class="hljs-attr">as</span>=<span class="hljs-string">&quot;image&quot;</span> <span class="hljs-attr">href</span>=<span class="hljs-string">&quot;/bg.avif&quot;</span> <span class="hljs-attr">fetchpriority</span>=<span class="hljs-string">&quot;high&quot;</span> /&gt;</span>

<span class="hljs-tag">&lt;<span class="hljs-name">script</span> <span class="hljs-attr">src</span>=<span class="hljs-string">&quot;/analytics.js&quot;</span> <span class="hljs-attr">async</span> <span class="hljs-attr">fetchpriority</span>=<span class="hljs-string">&quot;low&quot;</span>&gt;</span><span class="hljs-tag">&lt;/<span class="hljs-name">script</span>&gt;</span>
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// 预取下一步可能用到的数据，不和当前关键请求抢带宽</span>
<span class="hljs-title function_">fetch</span>(<span class="hljs-string">&#x27;/api/recommendations&#x27;</span>, { <span class="hljs-attr">priority</span>: <span class="hljs-string">&#x27;low&#x27;</span> });
</code></pre></div>
<p><code>fetch()</code> 里的选项名是 <code>priority</code>，HTML 属性名是 <code>fetchpriority</code>。</p>
<h2>解决不了的问题</h2>
<table><thead><tr><th>问题</th><th>应该怎么做</th></tr></thead><tbody><tr><td>主图由 JS 渲染后才插入</td><td>服务端渲染或 <code>preload</code></td></tr><tr><td>首屏图片加了 <code>loading=&quot;lazy&quot;</code></td><td>去掉懒加载</td></tr><tr><td>图片太大</td><td>压缩、选 AVIF/WebP、用 <code>srcset</code></td></tr><tr><td>页面 TTFB 很慢</td><td>优化服务端或用 Early Hints</td></tr><tr><td>主线程阻塞导致渲染慢</td><td>拆分长任务，减少阻塞脚本</td></tr></tbody></table>
<h2>不要滥用</h2>
<p>把很多资源都设成 <code>high</code>，等于没有设置，还会挤占 CSS 和关键脚本。只给一两个真正决定首屏的资源加。</p>
<h2>验证</h2>
<p>DevTools Network 面板打开 Priority 列，对比加属性前后的初始优先级和开始时间，再用 LCP 的变化确认收益。</p>
<h2>常见追问</h2>
<ul>
<li>和 <code>preload</code> 的区别？<code>preload</code> 解决&quot;何时发现&quot;，<code>fetchpriority</code> 解决&quot;发现后多急&quot;，两者可以一起用。</li>
<li>不支持的浏览器会怎样？忽略该属性，按默认优先级加载，不会出错。</li>
</ul>`};export{e as default};