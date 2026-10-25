var e={answerHtml:`<p>一张首屏主图和十张推荐卡片图片同时出现时，浏览器不一定知道哪张图片对用户最重要。<code>fetchpriority</code> 允许开发者表达这个信息：“这张图更值得优先下载。”浏览器据此调整请求调度，但具体优先级、调整幅度和是否立即生效仍由实现决定。</p>
<p>所以它能改善某些资源竞争问题，却不能保证某个请求最先开始、最先完成，也不能为它单独创造带宽。</p>
<h2>先看清楚资源究竟卡在哪里</h2>
<p>图片显示出来至少要经历发现地址、满足加载条件、发起请求、下载、解码和渲染。三个看起来相近的配置，处理的是不同阶段：</p>
<table><thead><tr><th>配置</th><th>主要表达什么</th></tr></thead><tbody><tr><td><code>preload</code></td><td>当前页面会需要这个资源，请提前发现并获取</td></tr><tr><td><code>loading=&quot;lazy&quot;</code></td><td>非关键图片可延后到接近可见区域时再加载</td></tr><tr><td><code>fetchpriority=&quot;high&quot;</code></td><td>这个请求值得相对更高的获取优先级</td></tr></tbody></table>
<p>如果图片 URL 要等 JavaScript 下载并运行后才拼出来，单独增加优先级仍得等那段代码执行。若图片设置了懒加载且尚未满足加载条件，<code>high</code> 也不是取消懒加载的开关。如果图片已经下载完，但主线程被长任务占住，继续提高网络优先级也解决不了渲染等待。</p>
<h2>首屏主图通常怎么写</h2>
<p>假设下面这张图片确实是当前页面的主要视觉内容，并且可能成为 LCP 元素：</p>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">img</span>
  <span class="hljs-attr">src</span>=<span class="hljs-string">&quot;/hero-1280.webp&quot;</span>
  <span class="hljs-attr">srcset</span>=<span class="hljs-string">&quot;/hero-640.webp 640w, /hero-1280.webp 1280w&quot;</span>
  <span class="hljs-attr">sizes</span>=<span class="hljs-string">&quot;(max-width: 640px) 100vw, 960px&quot;</span>
  <span class="hljs-attr">width</span>=<span class="hljs-string">&quot;1280&quot;</span>
  <span class="hljs-attr">height</span>=<span class="hljs-string">&quot;720&quot;</span>
  <span class="hljs-attr">fetchpriority</span>=<span class="hljs-string">&quot;high&quot;</span>
  <span class="hljs-attr">alt</span>=<span class="hljs-string">&quot;前端知识分类与学习路线&quot;</span>
/&gt;</span>
</code></pre></div>
<p>这里让图片直接出现在 HTML 中，浏览器能尽早发现；没有设置 <code>loading=&quot;lazy&quot;</code>；通过 <code>srcset</code>、<code>sizes</code> 选择合适大小；通过宽高预留布局空间；最后用 <code>fetchpriority=&quot;high&quot;</code> 提示它的重要性。每项设置解决不同问题，不能只加一个 high 就忽略前面的条件。</p>
<p>如果主图藏在较晚加载的 CSS 背景或动态组件里，且 URL 在构建时就已确定，可以考虑提前 preload，并在预加载声明上设置优先级。响应式候选应与实际使用一致，否则可能预加载一张、最终又下载另一张。</p>
<p>不应把所有首屏附近的图片都标成 high。轮播图尤其要区分当前展示的第一张和暂时不可见的后续图片，后者抢占带宽可能反而拖慢第一张。</p>
<h2>非关键内容可以降级，但 low 不是懒加载</h2>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">img</span>
  <span class="hljs-attr">src</span>=<span class="hljs-string">&quot;/recommendation.webp&quot;</span>
  <span class="hljs-attr">width</span>=<span class="hljs-string">&quot;400&quot;</span>
  <span class="hljs-attr">height</span>=<span class="hljs-string">&quot;240&quot;</span>
  <span class="hljs-attr">loading</span>=<span class="hljs-string">&quot;lazy&quot;</span>
  <span class="hljs-attr">fetchpriority</span>=<span class="hljs-string">&quot;low&quot;</span>
  <span class="hljs-attr">alt</span>=<span class="hljs-string">&quot;延伸阅读封面&quot;</span>
/&gt;</span>
</code></pre></div>
<p>这里的 <code>lazy</code> 让浏览器有机会推迟加载，<code>low</code> 则表达开始获取时较低的相对重要性。只写 low 而不写 lazy，图片仍可能很早就发起请求，只是被安排在较低优先级上。</p>
<p>如果图片在用户即将看到的位置，过度降低它的优先级也可能造成滚动后长时间空白。优化不只是“把所有次要资源都拖到最后”，而是依据实际阅读顺序减少不必要的竞争。</p>
<h2>JavaScript 中使用的是不同拼写</h2>
<p>HTML 属性是全小写 <code>fetchpriority</code>，DOM 属性是 <code>fetchPriority</code>。动态创建图片时，应在设置 <code>src</code> 之前说明优先级：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> cover = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Image</span>();
cover.<span class="hljs-property">fetchPriority</span> = <span class="hljs-string">&#x27;high&#x27;</span>;
cover.<span class="hljs-property">width</span> = <span class="hljs-number">1280</span>;
cover.<span class="hljs-property">height</span> = <span class="hljs-number">720</span>;
cover.<span class="hljs-property">alt</span> = <span class="hljs-string">&#x27;课程封面&#x27;</span>;
cover.<span class="hljs-property">src</span> = <span class="hljs-string">&#x27;/hero-1280.webp&#x27;</span>;
<span class="hljs-variable language_">document</span>.<span class="hljs-property">body</span>.<span class="hljs-title function_">append</span>(cover);
</code></pre></div>
<p><code>&lt;link&gt;</code>、<code>&lt;script&gt;</code> 等相应元素也支持获取优先级提示。脚本的优先级与执行时机仍要分开看：<code>defer</code>、<code>async</code> 和模块语义决定何时执行，fetchpriority 不能把一个阻塞解析的经典脚本自动变成 defer。</p>
<p>Fetch API 的选项叫 <code>priority</code>，例如 <code>fetch(&#x27;/api/recommendations&#x27;, { priority: &#x27;low&#x27; })</code>，不是 <code>fetchpriority</code>。可以在兼容性允许时把它作为增强提示，但它不替代显式并发限制、取消过期请求、超时或业务请求顺序。</p>
<p>常见取值是 <code>high</code>、<code>low</code>、<code>auto</code>，默认由浏览器决定。不要用数字推测自己能指定绝对的网络队列位置。</p>
<h2>验证时看调度，也看最终呈现</h2>
<p>开发者工具可以观察请求优先级、开始时间和瀑布图。验证重点是关键资源是否更早可用、LCP 是否改善，以及样式、字体、接口等是否被挤到后面。</p>
<p>本地缓存命中或网络极快时，改变优先级可能几乎看不出效果；不同浏览器的调度也会不同。应在代表用户的设备、网络和冷暖缓存条件下比较，不能从一次本地刷新推出“加 high 就快一倍”。</p>
<p>如果真正瓶颈是图片过大、服务器响应慢、图片根本发现得晚，或者下载完成后还等着大量 JavaScript，先解决这些原因。优先级提示最有价值的场景，是浏览器已经知道多个请求，而你比浏览器更了解它们对当前页面的重要程度。</p>`};export{e as default};