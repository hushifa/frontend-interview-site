var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>页面上有一张几十万个点的图表，每次重绘都要几十毫秒，主线程一忙，滚动和点击就卡。OffscreenCanvas 能把绘制挪到 Worker 里：页面上的 <code>&lt;canvas&gt;</code> 调用 <code>transferControlToOffscreen()</code>，把得到的 <code>OffscreenCanvas</code> 交给 Worker，Worker 画的内容会直接显示在页面上。</p>
<p>Worker 里支持 <code>2d</code>、<code>webgl</code>、<code>webgl2</code> 上下文。专用 Worker 里的 <code>requestAnimationFrame</code> 各浏览器支持不一样，用之前做特性检测，没有就退回 <code>setTimeout</code>。</p>
<p>它适合绘制成本高的工作，比如大量数据点的图表、地图和游戏渲染、图片滤镜。也可以用 <code>new OffscreenCanvas(w, h)</code> 在后台生成图片，再用 <code>convertToBlob()</code> 导出。</p>
<p>要注意 Worker 访问不了 DOM，鼠标事件要在主线程监听再发过去。转移以后主线程也不能再改这个 canvas 的尺寸。如果每帧画的东西很少，或者每帧都要传大量数据，用它反而更慢。</p>
</blockquote>
<h2>把绘制交给 Worker</h2>
<p>主线程这边负责三件事：转移 canvas、转发鼠标事件、通知尺寸变化。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// main.js</span>
<span class="hljs-keyword">const</span> canvas = <span class="hljs-variable language_">document</span>.<span class="hljs-title function_">querySelector</span>(<span class="hljs-string">&#x27;canvas&#x27;</span>);
<span class="hljs-keyword">const</span> offscreen = canvas.<span class="hljs-title function_">transferControlToOffscreen</span>();
<span class="hljs-keyword">const</span> worker = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Worker</span>(<span class="hljs-keyword">new</span> <span class="hljs-title function_">URL</span>(<span class="hljs-string">&#x27;./chart.worker.js&#x27;</span>, <span class="hljs-keyword">import</span>.<span class="hljs-property">meta</span>.<span class="hljs-property">url</span>), { <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;module&#x27;</span> });

<span class="hljs-keyword">const</span> { width, height } = canvas.<span class="hljs-title function_">getBoundingClientRect</span>();
worker.<span class="hljs-title function_">postMessage</span>(
  { <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;init&#x27;</span>, <span class="hljs-attr">canvas</span>: offscreen, <span class="hljs-attr">dpr</span>: devicePixelRatio, width, height },
  [offscreen],
);

canvas.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;pointermove&#x27;</span>, <span class="hljs-function">(<span class="hljs-params">event</span>) =&gt;</span> {
  worker.<span class="hljs-title function_">postMessage</span>({ <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;pointer&#x27;</span>, <span class="hljs-attr">x</span>: event.<span class="hljs-property">offsetX</span>, <span class="hljs-attr">y</span>: event.<span class="hljs-property">offsetY</span> });
});

<span class="hljs-keyword">new</span> <span class="hljs-title class_">ResizeObserver</span>(<span class="hljs-function">(<span class="hljs-params">[entry]</span>) =&gt;</span> {
  <span class="hljs-keyword">const</span> { width, height } = entry.<span class="hljs-property">contentRect</span>;
  worker.<span class="hljs-title function_">postMessage</span>({ <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;resize&#x27;</span>, width, height });
}).<span class="hljs-title function_">observe</span>(canvas);
</code></pre></div>
<p><code>postMessage</code> 的第二个参数 <code>[offscreen]</code> 表示转移，而不是复制。转移以后这个对象就归 Worker 了，主线程不能再用它。</p>
<p>Worker 这边按消息类型处理：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// chart.worker.js</span>
<span class="hljs-keyword">let</span> ctx;
<span class="hljs-keyword">let</span> canvas;
<span class="hljs-keyword">let</span> dpr = <span class="hljs-number">1</span>;

<span class="hljs-variable language_">self</span>.<span class="hljs-property">onmessage</span> = <span class="hljs-function">(<span class="hljs-params">{ data }</span>) =&gt;</span> {
  <span class="hljs-keyword">if</span> (data.<span class="hljs-property">type</span> === <span class="hljs-string">&#x27;init&#x27;</span>) {
    canvas = data.<span class="hljs-property">canvas</span>;
    dpr = data.<span class="hljs-property">dpr</span>;
    ctx = canvas.<span class="hljs-title function_">getContext</span>(<span class="hljs-string">&#x27;2d&#x27;</span>);
    <span class="hljs-comment">// 首次 resize 之前按实际尺寸绘制，而不是默认的 300×150</span>
    canvas.<span class="hljs-property">width</span> = data.<span class="hljs-property">width</span> * dpr;
    canvas.<span class="hljs-property">height</span> = data.<span class="hljs-property">height</span> * dpr;
    ctx.<span class="hljs-title function_">scale</span>(dpr, dpr);
  } <span class="hljs-keyword">else</span> <span class="hljs-keyword">if</span> (data.<span class="hljs-property">type</span> === <span class="hljs-string">&#x27;resize&#x27;</span>) {
    canvas.<span class="hljs-property">width</span> = data.<span class="hljs-property">width</span> * dpr;
    canvas.<span class="hljs-property">height</span> = data.<span class="hljs-property">height</span> * dpr;
    ctx.<span class="hljs-title function_">scale</span>(dpr, dpr);
  } <span class="hljs-keyword">else</span> <span class="hljs-keyword">if</span> (data.<span class="hljs-property">type</span> === <span class="hljs-string">&#x27;pointer&#x27;</span>) {
    <span class="hljs-title function_">drawHighlight</span>(ctx, data.<span class="hljs-property">x</span>, data.<span class="hljs-property">y</span>);
  }
};
</code></pre></div>
<p>为什么尺寸要发消息让 Worker 改？因为转移以后，主线程不能再对这个 <code>&lt;canvas&gt;</code> 调用 <code>getContext()</code>，也不能直接改它的 <code>width</code>、<code>height</code>，只有 Worker 能改。</p>
<p>为什么每次 resize 都要重新 <code>scale</code>？因为修改 <code>canvas.width</code> 会把上下文的变换重置掉，之前的 <code>scale(dpr, dpr)</code> 就没了，不重新设置，高清屏上画出来会模糊。</p>
<h2>什么时候用了也没用</h2>
<p>如果每帧只画几个图形，绘制本身很快，那卡顿其实来自主线程上的其他代码，把绘制挪走也解决不了。</p>
<p>如果绘制依赖大量主线程的数据，每帧都要传过去，克隆数据的成本可能比绘制本身还高，反而更慢。</p>
<h2>兼容性怎么处理</h2>
<p>OffscreenCanvas 已在主流浏览器中可用。用之前检测 <code>&#x27;transferControlToOffscreen&#x27; in HTMLCanvasElement.prototype</code>，不支持就在主线程绘制。</p>
<h2>常见追问</h2>
<p><strong>Worker 里能直接监听鼠标事件吗？</strong></p>
<blockquote>
<p>不能。Worker 访问不了 DOM，也收不到页面上的事件。要在主线程监听，再用 <code>postMessage</code> 把坐标发给 Worker。</p>
</blockquote>
<p><strong>不显示在页面上，只想在后台生成一张图可以吗？</strong></p>
<blockquote>
<p>可以。直接 <code>new OffscreenCanvas(w, h)</code> 创建一个，画完调用 <code>convertToBlob()</code> 导出成图片，不需要页面上有 <code>&lt;canvas&gt;</code>。</p>
</blockquote>`};export{e as default};