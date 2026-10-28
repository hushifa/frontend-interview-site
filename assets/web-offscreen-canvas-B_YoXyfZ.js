var e={answerHtml:`<h2>简答</h2>
<ul>
<li>页面上的 <code>&lt;canvas&gt;</code> 调用 <code>transferControlToOffscreen()</code>，把得到的 <code>OffscreenCanvas</code> 转移给 Worker，Worker 中绘制的内容会直接显示在页面上。</li>
<li>Worker 中支持 <code>2d</code>、<code>webgl</code>、<code>webgl2</code> 上下文，也可以用 <code>requestAnimationFrame</code>。</li>
<li>适合：大量数据点的图表、地图和游戏渲染、图片滤镜等绘制成本高的工作。</li>
<li>Worker 不能访问 DOM，鼠标等交互事件要在主线程监听再发给 Worker。</li>
<li>也可以用 <code>new OffscreenCanvas(w, h)</code> 在后台生成图片，用 <code>convertToBlob()</code> 导出。</li>
</ul>
<h2>示例</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// main.js</span>
<span class="hljs-keyword">const</span> canvas = <span class="hljs-variable language_">document</span>.<span class="hljs-title function_">querySelector</span>(<span class="hljs-string">&#x27;canvas&#x27;</span>);
<span class="hljs-keyword">const</span> offscreen = canvas.<span class="hljs-title function_">transferControlToOffscreen</span>();
<span class="hljs-keyword">const</span> worker = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Worker</span>(<span class="hljs-keyword">new</span> <span class="hljs-title function_">URL</span>(<span class="hljs-string">&#x27;./chart.worker.js&#x27;</span>, <span class="hljs-keyword">import</span>.<span class="hljs-property">meta</span>.<span class="hljs-property">url</span>), { <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;module&#x27;</span> });

worker.<span class="hljs-title function_">postMessage</span>({ <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;init&#x27;</span>, <span class="hljs-attr">canvas</span>: offscreen, <span class="hljs-attr">dpr</span>: devicePixelRatio }, [offscreen]);

canvas.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;pointermove&#x27;</span>, <span class="hljs-function">(<span class="hljs-params">event</span>) =&gt;</span> {
  worker.<span class="hljs-title function_">postMessage</span>({ <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;pointer&#x27;</span>, <span class="hljs-attr">x</span>: event.<span class="hljs-property">offsetX</span>, <span class="hljs-attr">y</span>: event.<span class="hljs-property">offsetY</span> });
});

<span class="hljs-keyword">new</span> <span class="hljs-title class_">ResizeObserver</span>(<span class="hljs-function">(<span class="hljs-params">[entry]</span>) =&gt;</span> {
  <span class="hljs-keyword">const</span> { width, height } = entry.<span class="hljs-property">contentRect</span>;
  worker.<span class="hljs-title function_">postMessage</span>({ <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;resize&#x27;</span>, width, height });
}).<span class="hljs-title function_">observe</span>(canvas);
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// chart.worker.js</span>
<span class="hljs-keyword">let</span> ctx;
<span class="hljs-keyword">let</span> canvas;
<span class="hljs-keyword">let</span> dpr = <span class="hljs-number">1</span>;

<span class="hljs-variable language_">self</span>.<span class="hljs-property">onmessage</span> = <span class="hljs-function">(<span class="hljs-params">{ data }</span>) =&gt;</span> {
  <span class="hljs-keyword">if</span> (data.<span class="hljs-property">type</span> === <span class="hljs-string">&#x27;init&#x27;</span>) {
    canvas = data.<span class="hljs-property">canvas</span>;
    dpr = data.<span class="hljs-property">dpr</span>;
    ctx = canvas.<span class="hljs-title function_">getContext</span>(<span class="hljs-string">&#x27;2d&#x27;</span>);
  } <span class="hljs-keyword">else</span> <span class="hljs-keyword">if</span> (data.<span class="hljs-property">type</span> === <span class="hljs-string">&#x27;resize&#x27;</span>) {
    canvas.<span class="hljs-property">width</span> = data.<span class="hljs-property">width</span> * dpr;
    canvas.<span class="hljs-property">height</span> = data.<span class="hljs-property">height</span> * dpr;
    ctx.<span class="hljs-title function_">scale</span>(dpr, dpr);
  } <span class="hljs-keyword">else</span> <span class="hljs-keyword">if</span> (data.<span class="hljs-property">type</span> === <span class="hljs-string">&#x27;pointer&#x27;</span>) {
    <span class="hljs-title function_">drawHighlight</span>(ctx, data.<span class="hljs-property">x</span>, data.<span class="hljs-property">y</span>);
  }
};
</code></pre></div>
<ul>
<li>转移之后，主线程不能再对这个 <code>&lt;canvas&gt;</code> 调用 <code>getContext()</code>，也不能直接修改它的 <code>width</code>、<code>height</code>，尺寸要发消息让 Worker 修改。</li>
<li>修改 <code>canvas.width</code> 会重置上下文的变换，所以每次 resize 后重新 <code>scale</code>。</li>
</ul>
<h2>什么时候没有收益</h2>
<ul>
<li>每帧只画几个图形，绘制耗时很短，卡顿来自主线程的其他代码。</li>
<li>绘制依赖大量主线程数据，每帧都要传输，克隆的成本超过绘制本身。</li>
</ul>
<h2>兼容性</h2>
<p>OffscreenCanvas 已在主流浏览器中可用。使用前检测 <code>&#x27;transferControlToOffscreen&#x27; in HTMLCanvasElement.prototype</code>，不支持时在主线程绘制。</p>`};export{e as default};