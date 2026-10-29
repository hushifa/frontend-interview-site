var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>浏览器会给每个资源排一个优先级，决定先下谁。<code>fetchpriority</code> 就是让你提个建议，取值有 <code>high</code>、<code>low</code>、<code>auto</code>，能用在 <code>&lt;img&gt;</code>、<code>&lt;link&gt;</code>、<code>&lt;script&gt;</code> 和 <code>fetch()</code> 上。</p>
<p>最常见的用途是首屏主图。以 Chromium 为例，它一开始用较低优先级请求图片，等确定图片在视口里才提上去。给主图加 <code>fetchpriority=&quot;high&quot;</code>，就能从一开始就高优先级请求，常用来改善 LCP。</p>
<p>但它只是个提示，浏览器可以不听；而且它不改变资源被发现的时间。</p>
<p>所以资源如果藏在 CSS 或 JS 里、发现得很晚，要先用 <code>preload</code> 让浏览器早点知道它。首屏图片也不要加 <code>loading=&quot;lazy&quot;</code>。</p>
</blockquote>
<h2>怎么用</h2>
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
<p>注意名字不一样：HTML 属性叫 <code>fetchpriority</code>，<code>fetch()</code> 里的选项叫 <code>priority</code>。</p>
<p>背景图那一行值得多看一眼。背景图写在 CSS 里，浏览器要等 CSS 下载解析完才知道它，这时光设优先级没用，因为还没发现。所以先用 <code>preload</code> 让它被提前发现，再用 <code>fetchpriority</code> 提高优先级。</p>
<h2>它解决不了哪些问题</h2>
<table><thead><tr><th>问题</th><th>应该怎么做</th></tr></thead><tbody><tr><td>主图由 JS 渲染后才插入</td><td>服务端渲染或 <code>preload</code></td></tr><tr><td>首屏图片加了 <code>loading=&quot;lazy&quot;</code></td><td>去掉懒加载</td></tr><tr><td>图片太大</td><td>压缩、选 AVIF/WebP、用 <code>srcset</code></td></tr><tr><td>页面 TTFB 很慢</td><td>优化服务端或用 Early Hints</td></tr><tr><td>主线程阻塞导致渲染慢</td><td>拆分长任务，减少阻塞脚本</td></tr></tbody></table>
<p>这些问题的共同点是，慢的原因不在“排队顺序”上。发现得晚、文件太大、服务器慢、主线程忙，调优先级都救不了。</p>
<h2>为什么不能到处设 high</h2>
<p>优先级是相对的。把很多资源都设成 <code>high</code>，等于谁都没提高，还会挤占 CSS 和关键脚本的位置。只给一两个真正决定首屏的资源加。</p>
<h2>怎么验证</h2>
<p>在 DevTools Network 面板打开 Priority 列，对比加属性前后资源的初始优先级和开始时间，再看 LCP 有没有变好。</p>
<h2>常见追问</h2>
<p><strong>和 <code>preload</code> 有什么区别？</strong></p>
<blockquote>
<p><code>preload</code> 解决的是“什么时候发现”，<code>fetchpriority</code> 解决的是“发现以后有多急”，两者可以一起用。</p>
</blockquote>
<p><strong>不支持的浏览器会怎样？</strong></p>
<blockquote>
<p>会忽略这个属性，按默认优先级加载，不会出错。</p>
</blockquote>`};export{e as default};