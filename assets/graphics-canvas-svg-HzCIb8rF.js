var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>SVG 画的每个圆、每条路径都是一个 DOM 元素，可以改属性、加 CSS、绑事件，浏览器会负责重绘和判断点中了谁。这种“图形一直保留着”的方式叫保留模式。</p>
<p>Canvas 2D 正好相反，画完就只剩像素，这叫即时模式。想拖动某个图形，应用得自己记住坐标、自己算点中了没有、自己重画。</p>
<p>所以图标、流程图、几百到几千个元素的交互图表适合 SVG；上万个点、粒子动画、绘图板、像素处理适合 Canvas。</p>
<p>有两点要注意。Canvas 要按 <code>devicePixelRatio</code> 设置内部尺寸才清晰，宽高各翻一倍，像素数就是四倍，内存也跟着涨。另外两者都不会自动无障碍：SVG 要加标题和角色，Canvas 要另外提供文字或 HTML 替代。</p>
</blockquote>
<h2>同一个圆，两种画法</h2>
<p>先用 SVG 画：</p>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">svg</span> <span class="hljs-attr">viewBox</span>=<span class="hljs-string">&quot;0 0 200 100&quot;</span> <span class="hljs-attr">role</span>=<span class="hljs-string">&quot;img&quot;</span> <span class="hljs-attr">aria-labelledby</span>=<span class="hljs-string">&quot;t&quot;</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">title</span> <span class="hljs-attr">id</span>=<span class="hljs-string">&quot;t&quot;</span>&gt;</span>蓝色圆形<span class="hljs-tag">&lt;/<span class="hljs-name">title</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">circle</span> <span class="hljs-attr">cx</span>=<span class="hljs-string">&quot;50&quot;</span> <span class="hljs-attr">cy</span>=<span class="hljs-string">&quot;50&quot;</span> <span class="hljs-attr">r</span>=<span class="hljs-string">&quot;20&quot;</span> <span class="hljs-attr">fill</span>=<span class="hljs-string">&quot;royalblue&quot;</span> /&gt;</span>
<span class="hljs-tag">&lt;/<span class="hljs-name">svg</span>&gt;</span>
</code></pre></div>
<p>再用 Canvas 画：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> ctx = <span class="hljs-variable language_">document</span>.<span class="hljs-title function_">querySelector</span>(<span class="hljs-string">&#x27;canvas&#x27;</span>).<span class="hljs-title function_">getContext</span>(<span class="hljs-string">&#x27;2d&#x27;</span>);
ctx.<span class="hljs-property">fillStyle</span> = <span class="hljs-string">&#x27;royalblue&#x27;</span>;
ctx.<span class="hljs-title function_">beginPath</span>();
ctx.<span class="hljs-title function_">arc</span>(<span class="hljs-number">50</span>, <span class="hljs-number">50</span>, <span class="hljs-number">20</span>, <span class="hljs-number">0</span>, <span class="hljs-title class_">Math</span>.<span class="hljs-property">PI</span> * <span class="hljs-number">2</span>);
ctx.<span class="hljs-title function_">fill</span>();
<span class="hljs-comment">// 页面里只有一个 canvas 元素，querySelector 找不到这个圆</span>
</code></pre></div>
<p>看起来画出来一样。可是 SVG 版里有个真实的 <code>&lt;circle&gt;</code> 元素，你可以给它加 <code>click</code> 监听，或者用 CSS 改它的颜色。Canvas 版画完，页面里只有一个 canvas，那个圆已经变成了像素，没有任何东西可以选中。</p>
<h2>两者具体差在哪里</h2>
<table><thead><tr><th></th><th>SVG</th><th>Canvas 2D</th></tr></thead><tbody><tr><td>图形对象</td><td>DOM 元素</td><td>应用自己维护</td></tr><tr><td>交互</td><td>直接绑定事件</td><td>自己做命中检测</td></tr><tr><td>缩放</td><td>矢量，任意放大都清晰</td><td>位图，需要按缩放重绘</td></tr><tr><td>大量对象</td><td>DOM 和样式成本高</td><td>只受绘制成本影响</td></tr><tr><td>像素访问</td><td>不支持</td><td><code>getImageData</code></td></tr><tr><td>导出</td><td>序列化 XML</td><td><code>toBlob</code>、<code>toDataURL</code></td></tr></tbody></table>
<p>为什么对象多了 SVG 会慢？因为每个图形都是 DOM 元素，浏览器要为它们算样式、维护节点。Canvas 不管画了多少东西，都只有一个元素，成本只在绘制本身。</p>
<p>不过两者之间没有固定的数量分界线，要用真实数据在目标设备上测。</p>
<h2>为什么 Canvas 在高清屏上会模糊</h2>
<p>高清屏上，一个 CSS 像素对应好几个物理像素，这个比例就是 <code>devicePixelRatio</code>。canvas 的位图如果只按 CSS 尺寸设置，就会被拉伸显示，看起来发虚。所以要把位图尺寸乘上这个比例：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">setupCanvas</span>(<span class="hljs-params">canvas, cssWidth, cssHeight</span>) {
  <span class="hljs-keyword">const</span> dpr = <span class="hljs-variable language_">window</span>.<span class="hljs-property">devicePixelRatio</span> || <span class="hljs-number">1</span>;
  canvas.<span class="hljs-property">style</span>.<span class="hljs-property">width</span> = <span class="hljs-string">\`<span class="hljs-subst">\${cssWidth}</span>px\`</span>;
  canvas.<span class="hljs-property">style</span>.<span class="hljs-property">height</span> = <span class="hljs-string">\`<span class="hljs-subst">\${cssHeight}</span>px\`</span>;
  canvas.<span class="hljs-property">width</span> = <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">round</span>(cssWidth * dpr);
  canvas.<span class="hljs-property">height</span> = <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">round</span>(cssHeight * dpr);
  <span class="hljs-keyword">const</span> ctx = canvas.<span class="hljs-title function_">getContext</span>(<span class="hljs-string">&#x27;2d&#x27;</span>);
  ctx.<span class="hljs-title function_">scale</span>(dpr, dpr); <span class="hljs-comment">// 之后按 CSS 像素坐标绘制</span>
  <span class="hljs-keyword">return</span> ctx;
}
</code></pre></div>
<p><code>style</code> 上的宽高决定它在页面上占多大，<code>canvas.width</code>、<code>canvas.height</code> 决定位图有多少像素。最后 <code>scale(dpr, dpr)</code>，之后的绘图代码就还能按 CSS 像素来写。</p>
<h2>能不能混着用</h2>
<p>可以，而且很常见。复杂编辑器常用 Canvas 画画布内容，用 HTML 做工具栏、输入框和属性面板，用 SVG 画选择框和控制点。</p>
<p>图表也可以用 Canvas 画大量数据点，再提供一个 HTML 数据表作为无障碍替代，见<a href="/questions/graphics-chart-accessibility/">《前端图表如何同时满足无障碍和高性能？》</a>。</p>
<h2>安全上要注意什么</h2>
<p>用户上传的 SVG 里可以带脚本和外部引用。所以不要直接把它内联插进页面，用 <code>&lt;img&gt;</code> 引用，或者先净化。</p>
<p>Canvas 画了没有 CORS 授权的跨源图片以后，会被“污染”。之后调用 <code>getImageData</code> 和 <code>toBlob</code> 会抛 <code>SecurityError</code>。</p>
<h2>常见追问</h2>
<p><strong>Canvas 卡了怎么办？</strong></p>
<blockquote>
<p>可以分层，静态背景画一层，动态内容画另一层；只重画变化的区域；或者把绘制移到 Worker 里的 OffscreenCanvas，不占主线程。</p>
</blockquote>
<p><strong>WebGL 也是画在 canvas 上，它算哪一边？</strong></p>
<blockquote>
<p>它是 canvas 的另一种上下文，绘制模型和 Canvas 2D 完全不同，适合更大规模的绘制，见<a href="/questions/graphics-webgl/">《什么场景值得用 WebGL？GPU 加速有哪些成本？》</a>。</p>
</blockquote>`};export{e as default};