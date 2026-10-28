var e={answerHtml:`<h2>简答</h2>
<ul>
<li>浏览器不会把点击分发给 Canvas 里的某个圆，要根据保存的几何信息自己判断。</li>
<li>用 <code>Path2D</code> 定义形状，同一个对象既用于 <code>fill()</code> 也用于 <code>isPointInPath()</code>，绘制和命中不会不一致。</li>
<li><code>isPointInPath(path, x, y)</code> 中的 <code>x</code>、<code>y</code> 是位图坐标，不受当前变换影响；<code>path</code> 则按当前变换参与检测。</li>
<li>图形重叠时按绘制的逆序检测，第一个命中的可交互对象胜出。</li>
<li>对象很多时先用包围盒、网格或四叉树缩小候选，再做精确检测。</li>
</ul>
<h2>基本用法</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> canvas = <span class="hljs-variable language_">document</span>.<span class="hljs-title function_">querySelector</span>(<span class="hljs-string">&#x27;canvas&#x27;</span>);
<span class="hljs-keyword">const</span> ctx = canvas.<span class="hljs-title function_">getContext</span>(<span class="hljs-string">&#x27;2d&#x27;</span>);

<span class="hljs-keyword">const</span> circle = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Path2D</span>();
circle.<span class="hljs-title function_">arc</span>(<span class="hljs-number">50</span>, <span class="hljs-number">50</span>, <span class="hljs-number">20</span>, <span class="hljs-number">0</span>, <span class="hljs-title class_">Math</span>.<span class="hljs-property">PI</span> * <span class="hljs-number">2</span>);
ctx.<span class="hljs-title function_">fill</span>(circle);

ctx.<span class="hljs-title function_">isPointInPath</span>(circle, <span class="hljs-number">50</span>, <span class="hljs-number">50</span>); <span class="hljs-comment">// true</span>
ctx.<span class="hljs-title function_">isPointInPath</span>(circle, <span class="hljs-number">80</span>, <span class="hljs-number">50</span>); <span class="hljs-comment">// false</span>
</code></pre></div>
<p><code>isPointInPath</code> 检查的是路径的填充区域，与像素颜色无关。只描边的线条用 <code>isPointInStroke</code>，结果受 <code>lineWidth</code> 影响；触摸操作可以临时加大线宽来放大命中范围。带孔洞的路径要传入和绘制时相同的填充规则（<code>&#x27;nonzero&#x27;</code> 或 <code>&#x27;evenodd&#x27;</code>）。</p>
<h2>坐标转换</h2>
<p>指针事件给的是 client 坐标，要先换算成位图坐标：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">toBitmap</span>(<span class="hljs-params">canvas, event</span>) {
  <span class="hljs-keyword">const</span> rect = canvas.<span class="hljs-title function_">getBoundingClientRect</span>();
  <span class="hljs-keyword">return</span> {
    <span class="hljs-attr">x</span>: ((event.<span class="hljs-property">clientX</span> - rect.<span class="hljs-property">left</span>) * canvas.<span class="hljs-property">width</span>) / rect.<span class="hljs-property">width</span>,
    <span class="hljs-attr">y</span>: ((event.<span class="hljs-property">clientY</span> - rect.<span class="hljs-property">top</span>) * canvas.<span class="hljs-property">height</span>) / rect.<span class="hljs-property">height</span>,
  };
}
</code></pre></div>
<p>这里假设 canvas 没有边框和内边距，也没有 CSS 旋转。</p>
<p>绘制时如果设置了变换，检测时要用同一个变换：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js">ctx.<span class="hljs-title function_">setTransform</span>(<span class="hljs-number">2</span>, <span class="hljs-number">0</span>, <span class="hljs-number">0</span>, <span class="hljs-number">2</span>, <span class="hljs-number">100</span>, <span class="hljs-number">0</span>);
ctx.<span class="hljs-title function_">isPointInPath</span>(circle, <span class="hljs-number">200</span>, <span class="hljs-number">100</span>); <span class="hljs-comment">// true，圆心 (50,50) 映射到位图 (200,100)</span>
</code></pre></div>
<p>另一种做法是把指针坐标用变换的逆矩阵转回局部坐标，再在单位矩阵下检测，见<a href="/questions/graphics-canvas-transform/">《Canvas 的 transform 怎样影响坐标和绘制？》</a>。两种做法只能选一种，混用会补偿两次。</p>
<h2>重叠与粗筛</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// x、y 和 shape.bounds 都是画布位图坐标；shape.path 是局部坐标，配合 shape.matrix 使用</span>
<span class="hljs-keyword">function</span> <span class="hljs-title function_">hitTest</span>(<span class="hljs-params">ctx, shapes, x, y</span>) {
  <span class="hljs-keyword">const</span> saved = ctx.<span class="hljs-title function_">getTransform</span>();
  <span class="hljs-keyword">try</span> {
    <span class="hljs-keyword">for</span> (<span class="hljs-keyword">let</span> i = shapes.<span class="hljs-property">length</span> - <span class="hljs-number">1</span>; i &gt;= <span class="hljs-number">0</span>; i--) {
      <span class="hljs-keyword">const</span> shape = shapes[i];
      <span class="hljs-keyword">if</span> (!shape.<span class="hljs-property">selectable</span>) <span class="hljs-keyword">continue</span>;
      <span class="hljs-keyword">const</span> { left, top, right, bottom } = shape.<span class="hljs-property">bounds</span>;
      <span class="hljs-keyword">if</span> (x &lt; left || x &gt; right || y &lt; top || y &gt; bottom) <span class="hljs-keyword">continue</span>; <span class="hljs-comment">// 包围盒粗筛</span>
      ctx.<span class="hljs-title function_">setTransform</span>(shape.<span class="hljs-property">matrix</span>);
      <span class="hljs-keyword">if</span> (ctx.<span class="hljs-title function_">isPointInPath</span>(shape.<span class="hljs-property">path</span>, x, y)) <span class="hljs-keyword">return</span> shape;
    }
    <span class="hljs-keyword">return</span> <span class="hljs-literal">null</span>;
  } <span class="hljs-keyword">finally</span> {
    ctx.<span class="hljs-title function_">setTransform</span>(saved); <span class="hljs-comment">// 检测完恢复原矩阵，不影响后续绘制</span>
  }
}
</code></pre></div>
<ul>
<li><code>shapes</code> 按绘制顺序存放，逆序遍历就是从上往下。</li>
<li>锁定、不可选、允许穿透的对象由业务模型标记。</li>
<li>空间索引要在对象移动、缩放、删除时同步更新。</li>
</ul>
<h2>其他方案</h2>
<p>颜色拾取：在离屏画布上用唯一颜色绘制每个对象，读取点击处像素的颜色得到对象 ID。它适合形状复杂、数量巨大的场景，但要关掉抗锯齿，<code>getImageData</code> 有读回开销，而且画布被跨源图片污染后无法读取。</p>
<h2>常见追问</h2>
<ul>
<li><strong>命中检测之外还要做什么？</strong> 拖动要配合 <code>setPointerCapture</code>；重要操作要提供键盘或普通控件入口。</li>
<li><strong>能用 <code>isPointInPath</code> 判断像素是否透明吗？</strong> 不能，它只看几何。需要按透明度判断时用颜色拾取或读取像素。</li>
</ul>`};export{e as default};