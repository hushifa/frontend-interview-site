var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>用户点开商品详情页，白屏三四秒才看到商品大图，这就是首屏慢。优化前先别急着压图、拆包，要先量出慢在哪：TTFB 看服务器多久回第一个字节，FCP 看页面多久出现第一点内容，LCP 看最大的那块内容多久画出来。web.dev 给的良好线分别是 0.8 秒、1.8 秒和 2.5 秒，按真实用户的第 75 百分位评估。</p>
<p>定位到 LCP 慢以后，把它拆成四段：HTML 首字节、LCP 资源开始下载前的延迟、资源下载耗时、下载完到画出来的延迟。web.dev 建议的比例是两段网络时间各占约四成，两段“延迟”都在一成以内，哪段超了就先改哪段。</p>
<p>对应的手段分四层。服务器与网络层：减少重定向、上 CDN、缓存 HTML、流式输出。关键资源层：让首屏大图写在 HTML 里尽早被发现，加 <code>fetchpriority=&quot;high&quot;</code>，绝不懒加载。体积层：图片用合适尺寸和 AVIF、WebP，压缩文本。渲染层：减少阻塞渲染的 CSS 和同步脚本，避免首屏内容等 JS 才插进页面。</p>
<p>要注意，单改一段不一定有效。web.dev 举过例子，图片压小了，可是元素要等 JS 加载完才显示，省下的时间只会挪到渲染延迟里，LCP 一点没变。所以每改一步都要回头再量。</p>
</blockquote>
<h2>先量出慢在哪一段</h2>
<p>“首屏慢”是一种感受，要先换成数字。web.dev 对三个指标的定义和良好阈值如下：</p>
<table><thead><tr><th>指标</th><th>量的是什么</th><th>良好</th><th>较差</th></tr></thead><tbody><tr><td>TTFB</td><td>从开始请求到响应第一个字节到达</td><td>≤ 0.8 s</td><td>&gt; 1.8 s</td></tr><tr><td>FCP</td><td>从开始加载到页面出现任何内容</td><td>≤ 1.8 s</td><td>&gt; 3.0 s</td></tr><tr><td>LCP</td><td>从开始加载到视口里最大的图片或文字块渲染完</td><td>≤ 2.5 s</td><td>&gt; 4.0 s</td></tr></tbody></table>
<p>三者是先后关系。TTFB 包括重定向、Service Worker 启动、DNS、建连和 TLS、服务器处理，它一慢，后面全都跟着慢，所以 TTFB 差时先看服务器和网络。TTFB 正常而 FCP 慢，说明 HTML 到了，但有东西挡住了第一次渲染，通常是 CSS 和同步脚本。FCP 正常而 LCP 慢，说明页面框架出来了，主要内容还没到，通常是首屏大图发现得晚或者太大。</p>
<p>数据要分两类看。真实用户数据（RUM、CrUX）告诉你用户实际多慢，按第 75 百分位评估；Lighthouse、DevTools 这类实验室工具条件固定，适合复现和看瀑布图找原因。两者怎么配合见<a href="/questions/perf-rum/">《真实用户监测与实验室性能测试为什么要结合？》</a>，三个核心指标的含义见<a href="/questions/engineering-vitals/">《LCP、INP、CLS 分别衡量什么？》</a>。</p>
<h2>把 LCP 拆成四段</h2>
<p>web.dev 的 Optimize LCP 一文把 LCP 拆成首尾相接、没有重叠的四段：</p>
<ol>
<li><strong>TTFB</strong>：从开始加载到收到 HTML 的第一个字节。</li>
<li><strong>资源加载延迟</strong>：从 TTFB 到浏览器开始下载 LCP 资源（比如首屏大图）。</li>
<li><strong>资源加载耗时</strong>：下载 LCP 资源本身花的时间。</li>
<li><strong>元素渲染延迟</strong>：资源下载完到 LCP 元素真正画出来。</li>
</ol>
<p>如果 LCP 元素是用系统字体渲染的文字，不需要下载资源，第 2、3 段就是 0。下面拿一组示例数字算一下各段占比，数字只用于演示：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> lcp = { <span class="hljs-attr">ttfb</span>: <span class="hljs-number">600</span>, <span class="hljs-attr">loadDelay</span>: <span class="hljs-number">900</span>, <span class="hljs-attr">loadTime</span>: <span class="hljs-number">500</span>, <span class="hljs-attr">renderDelay</span>: <span class="hljs-number">400</span> };
<span class="hljs-keyword">const</span> total = <span class="hljs-title class_">Object</span>.<span class="hljs-title function_">values</span>(lcp).<span class="hljs-title function_">reduce</span>(<span class="hljs-function">(<span class="hljs-params">sum, ms</span>) =&gt;</span> sum + ms, <span class="hljs-number">0</span>);

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;LCP&#x27;</span>, total, <span class="hljs-string">&#x27;ms&#x27;</span>);
<span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> [part, ms] <span class="hljs-keyword">of</span> <span class="hljs-title class_">Object</span>.<span class="hljs-title function_">entries</span>(lcp)) {
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(part, <span class="hljs-string">\`<span class="hljs-subst">\${<span class="hljs-built_in">Math</span>.round((ms / total) * <span class="hljs-number">100</span>)}</span>%\`</span>);
}
<span class="hljs-comment">// LCP 2400 ms</span>
<span class="hljs-comment">// ttfb 25%</span>
<span class="hljs-comment">// loadDelay 38%</span>
<span class="hljs-comment">// loadTime 21%</span>
<span class="hljs-comment">// renderDelay 17%</span>
</code></pre></div>
<p>总时间 2.4 秒，刚好在 2.5 秒以内，那还要不要改？web.dev 说这些比例只是参考，LCP 稳定在 2.5 秒以内时比例不重要。可是这组数据里两段“延迟”加起来超过一半，一旦网络变差就很容易超线，而 web.dev 建议的比例是 TTFB 和资源加载耗时各约 40%，两段延迟都小于 10%。所以这里最该先查的是资源加载延迟：大图为什么开始下载得这么晚。</p>
<p>web.dev 还提醒，不要把百分比换算成绝对毫秒数去定目标，这几段只在相互比较时才有意义。真实页面里的四段时间可以在 DevTools Performance 面板里看到，也可以用 web-vitals 库的归因数据采集。</p>
<h2>第一层：服务器与网络</h2>
<p>TTFB 占比太大时，先看这一层。web.dev 的 Optimize TTFB 一文把托管质量放在第一位，然后是这几件事。</p>
<p>重定向要尽量少。广告链接、短链接常常要跳好几次才到最终地址，每跳一次都是一整轮请求。</p>
<p>用 CDN 让用户就近访问，CDN 通常还提供更快的 DNS、HTTP/2 或 HTTP/3、TLS 1.3 和压缩，原理见<a href="/questions/network-cdn/">《CDN 的原理是什么？前端怎样用好 CDN？》</a>。能缓存的 HTML 尽量让 CDN 缓存，web.dev 特别提到，给每个访客加不同的统计参数，会让 CDN 缓存失效、每次都回源。</p>
<p>服务端渲染的页面可以流式输出，先把 <code>&lt;head&gt;</code> 和首屏框架发出去，浏览器边收边解析，见<a href="/questions/rendering-streaming-ssr/">《React 流式 SSR 解决什么问题？》</a>。服务器还在生成页面时，可以先用 <code>103 Early Hints</code> 告诉浏览器去下载关键 CSS 和 JS。</p>
<h2>第二层：让关键资源尽早开始下载</h2>
<p>资源加载延迟大，说明 LCP 资源被发现得太晚。web.dev 给的经验规则是：LCP 资源应该和页面第一个子资源同时开始下载，比它晚就有改进空间。</p>
<p>最常见的原因是首屏图片不在 HTML 里，比如写在 CSS 的 <code>background-image</code> 里，或者由 JS 渲染出来，浏览器要等 CSS、JS 到了才知道要下载它。第二个原因是给首屏大图加了 <code>loading=&quot;lazy&quot;</code>，web.dev 明确说永远不要懒加载 LCP 图片，原因见<a href="/questions/perf-lazy-images/">《懒加载为什么有时反而让首屏和首次交互变慢？》</a>。第三个原因是图片默认优先级不高，因为它不阻塞渲染。</p>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-comment">&lt;!-- 图片直接写在 HTML 里，并提高优先级 --&gt;</span>
<span class="hljs-tag">&lt;<span class="hljs-name">img</span> <span class="hljs-attr">src</span>=<span class="hljs-string">&quot;/hero.avif&quot;</span> <span class="hljs-attr">fetchpriority</span>=<span class="hljs-string">&quot;high&quot;</span> <span class="hljs-attr">width</span>=<span class="hljs-string">&quot;1200&quot;</span> <span class="hljs-attr">height</span>=<span class="hljs-string">&quot;600&quot;</span> <span class="hljs-attr">alt</span>=<span class="hljs-string">&quot;商品主图&quot;</span> /&gt;</span>

<span class="hljs-comment">&lt;!-- 只能在 CSS 或 JS 里引用时，用 preload 让浏览器提前知道 --&gt;</span>
<span class="hljs-tag">&lt;<span class="hljs-name">link</span> <span class="hljs-attr">rel</span>=<span class="hljs-string">&quot;preload&quot;</span> <span class="hljs-attr">as</span>=<span class="hljs-string">&quot;image&quot;</span> <span class="hljs-attr">href</span>=<span class="hljs-string">&quot;/hero.avif&quot;</span> <span class="hljs-attr">fetchpriority</span>=<span class="hljs-string">&quot;high&quot;</span> /&gt;</span>
</code></pre></div>
<p><code>fetchpriority=&quot;high&quot;</code> 只给最可能成为 LCP 的一两张图，web.dev 说加多了这个信号就没意义了。LCP 图片放在另一个域名上，还要多建一次连接，web.dev 建议尽量和 HTML 同源，做不到就加 <code>preconnect</code>，见<a href="/questions/network-dns-prefetch-preconnect/">《dns-prefetch 和 preconnect 分别把连接的哪几步提前了？》</a>。</p>
<h2>第三层：减小资源体积</h2>
<p>资源加载耗时大，就让文件变小、离用户近、少和别的资源抢带宽。图片按显示尺寸提供，用 AVIF、WebP 这类新格式并压缩，见<a href="/questions/html-responsive-images/">《srcset、sizes 和 picture 怎样减少图片浪费？》</a>。如果 LCP 元素是文字，就要看 Web 字体，减小字体文件，<code>font-display</code> 用 <code>auto</code> 和 <code>block</code> 以外的值，让文字在字体下载期间也能显示。</p>
<p>首屏同时下载的东西太多，也会拖慢 LCP 资源。首屏用不到的 JS 拆出去按需加载，见<a href="/questions/engineering-lazy/">《代码分割与懒加载适合哪些场景？》</a>。带哈希的静态文件设长缓存，回访用户的资源加载耗时几乎为 0。</p>
<h2>第四层：去掉渲染阻塞</h2>
<p>元素渲染延迟大，说明资源已经到了却画不出来。web.dev 列出的原因有：<code>&lt;head&gt;</code> 里的样式表或同步脚本还没加载完，整页渲染被挡住；LCP 元素要等 JS 加载完才被插进 DOM；A/B 测试脚本在决定方案前把内容隐藏了；主线程被长任务占着。</p>
<p>对应的改法是：样式表很小时可以直接内联进 HTML，较大时删掉没用的规则、把非首屏样式延后，web.dev 提醒内联的样式没法被缓存；脚本加 <code>defer</code> 或 <code>async</code>，不让它挡住解析，CSS 和脚本怎样阻塞渲染见<a href="/questions/browser-url-to-page/">《从输入 URL 到页面显示，中间发生了什么？》</a>；客户端渲染的首屏改成服务端渲染或静态生成，让 HTML 里直接有内容，见<a href="/questions/render-ssr-ssg/">《CSR、SSR、SSG 和混合渲染如何选择？》</a>；长任务拆小，第三方脚本延后加载，见<a href="/questions/perf-third-party-scripts/">《第三方脚本怎样接入，才能控制性能和安全风险？》</a>。</p>
<h2>改完以后</h2>
<p>每改一项都回到第一步重新量，确认 LCP 真的变了，而不是时间挪到了另一段。上线后看真实用户数据的第 75 百分位有没有下降，再用性能预算防止它慢慢变回去，见<a href="/questions/performance-budget/">《前端性能预算应该怎样制定和落地？》</a>。一次完整的线上排查案例见<a href="/questions/perf-diagnostics-case/">《一个线上页面变慢后应该怎样完成性能诊断闭环？》</a>。</p>
<h2>常见追问</h2>
<p><strong>骨架屏能改善 LCP 吗？</strong></p>
<blockquote>
<p>骨架屏能让 FCP 提前，用户更早看到页面在加载，但 LCP 量的是最大内容什么时候画出来，真正的大图或标题晚到，LCP 照样晚。所以骨架屏改善的是感受，不能代替让主要内容早点到达。</p>
</blockquote>
<p><strong>图片压缩了一半，LCP 为什么没变？</strong></p>
<blockquote>
<p>先看四段拆分。如果大图要等 JS 执行完才显示，下载变快只是让它更早下载完然后干等，省下的时间转到了元素渲染延迟里。这时要先解决渲染阻塞，压缩的效果才会体现出来。</p>
</blockquote>
<p><strong>面试时被问“首屏优化做过什么”，怎么讲才有说服力？</strong></p>
<blockquote>
<p>按“指标 → 定位 → 改法 → 结果”来讲：先说哪个指标、多少分位、是多少；再说用瀑布图或 LCP 拆分发现慢在哪一段；然后讲针对那一段做了什么；最后给出上线后真实用户数据的变化。讲法可以参考<a href="/questions/project-performance-story/">《讲一次你做过的性能优化，应该从哪些方面讲？》</a>。</p>
</blockquote>`};export{e as default};