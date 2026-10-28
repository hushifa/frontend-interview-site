var e={answerHtml:`<h2>简答</h2>
<ul>
<li>SVG 用元素描述矢量图形，可以参与 DOM、样式和事件；Canvas 由脚本绘制像素，图形对象要应用自己管理。</li>
<li>图标、流程图和对象数量适中的交互图表适合 SVG。</li>
<li>高频重绘、粒子动画和像素处理适合 Canvas。</li>
<li>Canvas 要同时考虑 CSS 尺寸、内部位图尺寸和内存；两者都不会自动具备完整的无障碍。</li>
</ul>
<p>Canvas 与 SVG 都能画图，但保留图形的方式不同。SVG 把圆、路径和文字等对象表示为文档元素；Canvas 2D 把绘图命令落实到位图，绘完后不会自动为每个圆保留一个可查询的 DOM 节点。</p>
<p>选型应先看图形的对象规模、更新频率、交互和语义需求，而不是简单认为“矢量一定更好”或“Canvas 一定更快”。</p>
<h2>同一个圆，在两种模型里的含义不同</h2>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">svg</span> <span class="hljs-attr">viewBox</span>=<span class="hljs-string">&quot;0 0 200 100&quot;</span> <span class="hljs-attr">role</span>=<span class="hljs-string">&quot;img&quot;</span> <span class="hljs-attr">aria-labelledby</span>=<span class="hljs-string">&quot;chart-title&quot;</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">title</span> <span class="hljs-attr">id</span>=<span class="hljs-string">&quot;chart-title&quot;</span>&gt;</span>蓝色圆形示例<span class="hljs-tag">&lt;/<span class="hljs-name">title</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">circle</span> <span class="hljs-attr">cx</span>=<span class="hljs-string">&quot;50&quot;</span> <span class="hljs-attr">cy</span>=<span class="hljs-string">&quot;50&quot;</span> <span class="hljs-attr">r</span>=<span class="hljs-string">&quot;20&quot;</span> <span class="hljs-attr">fill</span>=<span class="hljs-string">&quot;royalblue&quot;</span> /&gt;</span>
<span class="hljs-tag">&lt;/<span class="hljs-name">svg</span>&gt;</span>
</code></pre></div>
<p>circle 是一个 SVG 元素，可以修改属性、匹配 CSS 和监听事件。浏览器保留其结构，并负责相应的命中与重绘。</p>
<p>Canvas 则是发出绘制命令：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> canvas = <span class="hljs-variable language_">document</span>.<span class="hljs-title function_">querySelector</span>(<span class="hljs-string">&#x27;canvas&#x27;</span>);
<span class="hljs-keyword">const</span> context = canvas.<span class="hljs-title function_">getContext</span>(<span class="hljs-string">&#x27;2d&#x27;</span>);
<span class="hljs-keyword">if</span> (!context) <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">&#x27;无法创建 Canvas 2D 上下文&#x27;</span>);
context.<span class="hljs-property">fillStyle</span> = <span class="hljs-string">&#x27;royalblue&#x27;</span>;
context.<span class="hljs-title function_">beginPath</span>();
context.<span class="hljs-title function_">arc</span>(<span class="hljs-number">50</span>, <span class="hljs-number">50</span>, <span class="hljs-number">20</span>, <span class="hljs-number">0</span>, <span class="hljs-title class_">Math</span>.<span class="hljs-property">PI</span> * <span class="hljs-number">2</span>);
context.<span class="hljs-title function_">fill</span>();
</code></pre></div>
<p>绘制后，页面里仍只有 canvas 这个 DOM 元素，不能 querySelector 找到“刚才的圆”。若要拖动它，应用需要保存圆的坐标和半径，计算命中，再清除并重绘需要更新的区域。</p>
<h2>SVG 适合结构和语义可管理的图形</h2>
<p>图标、流程图和对象数量适中的交互图表，常适合 SVG。viewBox 可以定义内部坐标与缩放关系，修改元素属性也便于与界面状态协作。</p>
<p>但大量元素、复杂滤镜和频繁属性更新也会产生 DOM、样式与渲染成本。把十万个数据点都建成节点，不一定比 Canvas 合适。SVG 中包含位图图片时，放大也不会让那张图片无限清晰。</p>
<h2>Canvas 适合高频重绘和像素处理</h2>
<p>粒子动画、绘图工具或某些高密度可视化可以用 Canvas 管理统一场景，避免为每个图形创建 DOM。图像处理还能访问像素，但读回像素等操作可能昂贵，需要实际测量。</p>
<p>对象状态、图层顺序、碰撞和命中通常由应用或图形库维护。重绘整个画布最简单，却不一定最高效；可根据场景使用分层、局部重绘、缓存或 OffscreenCanvas 等能力。</p>
<p>Canvas 本身也可以使用 WebGL 等上下文，但 Canvas 2D 与 WebGL 的绘制模型不同，不能把所有 canvas 都当成同一种性能实现。</p>
<h2>分辨率与内存必须一起考虑</h2>
<p>Canvas 有 CSS 展示尺寸和内部位图尺寸。只用 CSS 把一个小位图拉大，可能模糊；按设备像素比放大内部尺寸能改善清晰度，却也增加绘制与存储成本。</p>
<p>宽高各扩大两倍，像素数量就变成四倍。多个大画布、频繁离屏缓冲和高分辨率图片可能迅速增加内存占用，不能只追求最高 DPR 而不考虑设备能力。</p>
<p>SVG 的几何内容通常更适合缩放，但字体、滤镜和大量对象仍有成本。没有适用于所有图表的固定对象数量分界，应使用真实数据与目标设备比较。</p>
<h2>图形可见不等于可以访问</h2>
<p>SVG 有元素结构，也仍需要合适标题、名称、焦点与交互设计；不能因为是 DOM 就自动认为无障碍完整。Canvas 中的文字和按钮更不会自动变成辅助技术可操作的控件。</p>
<p>关键数据可提供文字摘要或表格，操作控件可用普通 HTML 实现。复杂编辑器常采用混合方案：Canvas 绘制场景，HTML 提供工具栏、输入框和可访问操作，必要时用 SVG 表达局部矢量内容。</p>
<p>安全上，外部 SVG 不应直接作为可信内联内容插入；Canvas 绘入未经许可的跨源图片后，也可能因污染画布而无法读回或导出。选型时把交互、导出、缩放、安全和可访问性一起纳入，不要只比较一张静态截图。</p>`};export{e as default};