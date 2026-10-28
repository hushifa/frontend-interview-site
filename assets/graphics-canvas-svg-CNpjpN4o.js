var e={answerHtml:`<h2>简答</h2>
<ul>
<li>SVG 是保留模式：每个圆、路径都是 DOM 元素，可以改属性、加 CSS、监听事件，浏览器负责重绘和命中。</li>
<li>Canvas 2D 是即时模式：画完只剩像素，要拖动某个图形，应用自己保存坐标、计算命中并重绘。</li>
<li>图标、流程图、几百到几千个元素的交互图表适合 SVG；上万个点、粒子动画、绘图板、像素处理适合 Canvas。</li>
<li>Canvas 要按 <code>devicePixelRatio</code> 设置内部尺寸才清晰，宽高各翻倍像素数就变成四倍，内存随之增加。</li>
<li>两者都不会自动无障碍：SVG 要加标题和角色，Canvas 要另外提供文字或 HTML 替代。</li>
</ul>
<h2>同一个圆</h2>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">svg</span> <span class="hljs-attr">viewBox</span>=<span class="hljs-string">&quot;0 0 200 100&quot;</span> <span class="hljs-attr">role</span>=<span class="hljs-string">&quot;img&quot;</span> <span class="hljs-attr">aria-labelledby</span>=<span class="hljs-string">&quot;t&quot;</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">title</span> <span class="hljs-attr">id</span>=<span class="hljs-string">&quot;t&quot;</span>&gt;</span>蓝色圆形<span class="hljs-tag">&lt;/<span class="hljs-name">title</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">circle</span> <span class="hljs-attr">cx</span>=<span class="hljs-string">&quot;50&quot;</span> <span class="hljs-attr">cy</span>=<span class="hljs-string">&quot;50&quot;</span> <span class="hljs-attr">r</span>=<span class="hljs-string">&quot;20&quot;</span> <span class="hljs-attr">fill</span>=<span class="hljs-string">&quot;royalblue&quot;</span> /&gt;</span>
<span class="hljs-tag">&lt;/<span class="hljs-name">svg</span>&gt;</span>
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> ctx = <span class="hljs-variable language_">document</span>.<span class="hljs-title function_">querySelector</span>(<span class="hljs-string">&#x27;canvas&#x27;</span>).<span class="hljs-title function_">getContext</span>(<span class="hljs-string">&#x27;2d&#x27;</span>);
ctx.<span class="hljs-property">fillStyle</span> = <span class="hljs-string">&#x27;royalblue&#x27;</span>;
ctx.<span class="hljs-title function_">beginPath</span>();
ctx.<span class="hljs-title function_">arc</span>(<span class="hljs-number">50</span>, <span class="hljs-number">50</span>, <span class="hljs-number">20</span>, <span class="hljs-number">0</span>, <span class="hljs-title class_">Math</span>.<span class="hljs-property">PI</span> * <span class="hljs-number">2</span>);
ctx.<span class="hljs-title function_">fill</span>();
<span class="hljs-comment">// 页面里只有一个 canvas 元素，querySelector 找不到这个圆</span>
</code></pre></div>
<h2>对比</h2>
<table><thead><tr><th></th><th>SVG</th><th>Canvas 2D</th></tr></thead><tbody><tr><td>图形对象</td><td>DOM 元素</td><td>应用自己维护</td></tr><tr><td>交互</td><td>直接绑定事件</td><td>自己做命中检测</td></tr><tr><td>缩放</td><td>矢量，任意放大都清晰</td><td>位图，需要按缩放重绘</td></tr><tr><td>大量对象</td><td>DOM 和样式成本高</td><td>只受绘制成本影响</td></tr><tr><td>像素访问</td><td>不支持</td><td><code>getImageData</code></td></tr><tr><td>导出</td><td>序列化 XML</td><td><code>toBlob</code>、<code>toDataURL</code></td></tr></tbody></table>
<p>两者之间没有固定的对象数量分界，用真实数据在目标设备上测试。</p>
<h2>Canvas 清晰度</h2>
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
<h2>混合方案</h2>
<p>复杂编辑器常用 Canvas 绘制画布内容，用 HTML 做工具栏、输入框和属性面板，用 SVG 画选择框和控制点。图表可以用 Canvas 绘制大量数据点，再提供一个 HTML 数据表作为无障碍替代，见<a href="/questions/graphics-chart-accessibility/">《前端图表如何同时满足无障碍和高性能？》</a>。</p>
<h2>安全</h2>
<ul>
<li>用户上传的 SVG 可以包含脚本和外部引用，不要直接内联插入页面，用 <code>&lt;img&gt;</code> 引用或先净化。</li>
<li>Canvas 绘制了没有 CORS 授权的跨源图片后会被&quot;污染&quot;，<code>getImageData</code> 和 <code>toBlob</code> 会抛出 <code>SecurityError</code>。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li><strong>Canvas 卡了怎么办？</strong> 分层（静态背景一层、动态内容一层）、只重绘变化区域、把绘制移到 Worker 里的 OffscreenCanvas。</li>
<li><strong>WebGL 也是画在 canvas 上，它属于哪一边？</strong> 它是 canvas 的另一种上下文，绘制模型和 Canvas 2D 完全不同，适合更大规模的绘制，见<a href="/questions/graphics-webgl/">《什么场景值得用 WebGL？GPU 加速有哪些成本？》</a>。</li>
</ul>`};export{e as default};