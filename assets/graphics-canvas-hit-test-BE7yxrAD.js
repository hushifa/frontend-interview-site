var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>在 Canvas 上画了一个圆，用户点了一下，浏览器只知道点了 canvas 这个元素，不知道点没点中那个圆。判断“点中了哪个图形”就叫命中测试，要靠应用根据自己保存的几何信息来算。</p>
<p>常用做法是用 <code>Path2D</code> 定义形状。同一个对象既拿来 <code>fill()</code> 绘制，也拿来给 <code>isPointInPath()</code> 检测，这样画出来的和判断用的永远是同一份形状。</p>
<p>坐标要特别小心。<code>isPointInPath(path, x, y)</code> 里的 <code>x</code>、<code>y</code> 是位图坐标，不受当前变换影响；<code>path</code> 却会按当前变换参与检测。所以指针坐标要先换算成位图坐标。</p>
<p>图形重叠时，按绘制的反方向从上往下查，第一个命中的可交互对象胜出。对象很多时，先用包围盒、网格或四叉树把候选缩小，再做精确检测。</p>
</blockquote>
<h2>先看最基本的用法</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> canvas = <span class="hljs-variable language_">document</span>.<span class="hljs-title function_">querySelector</span>(<span class="hljs-string">&#x27;canvas&#x27;</span>);
<span class="hljs-keyword">const</span> ctx = canvas.<span class="hljs-title function_">getContext</span>(<span class="hljs-string">&#x27;2d&#x27;</span>);

<span class="hljs-keyword">const</span> circle = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Path2D</span>();
circle.<span class="hljs-title function_">arc</span>(<span class="hljs-number">50</span>, <span class="hljs-number">50</span>, <span class="hljs-number">20</span>, <span class="hljs-number">0</span>, <span class="hljs-title class_">Math</span>.<span class="hljs-property">PI</span> * <span class="hljs-number">2</span>);
ctx.<span class="hljs-title function_">fill</span>(circle);

ctx.<span class="hljs-title function_">isPointInPath</span>(circle, <span class="hljs-number">50</span>, <span class="hljs-number">50</span>); <span class="hljs-comment">// true</span>
ctx.<span class="hljs-title function_">isPointInPath</span>(circle, <span class="hljs-number">80</span>, <span class="hljs-number">50</span>); <span class="hljs-comment">// false</span>
</code></pre></div>
<p>圆心在 (50, 50)，半径 20。点 (50, 50) 在圆里，所以是 <code>true</code>；点 (80, 50) 离圆心 30，超出半径，所以是 <code>false</code>。</p>
<p>要注意，<code>isPointInPath</code> 看的是路径的填充区域，跟像素是什么颜色无关。</p>
<p>只描边的线条，要用 <code>isPointInStroke</code>，它的结果受 <code>lineWidth</code> 影响。线很细时手指很难点中，触摸操作可以临时把线宽调大，放大命中范围。带孔洞的路径，比如圆环，要传入和绘制时相同的填充规则 <code>&#x27;nonzero&#x27;</code> 或 <code>&#x27;evenodd&#x27;</code>，否则孔洞里也可能算命中。</p>
<h2>指针坐标怎样换算</h2>
<p>指针事件给的是 client 坐标，也就是相对浏览器视口的 CSS 像素。可是 canvas 的位图尺寸可能和它在页面上显示的尺寸不一样，所以要先按比例换算成位图坐标：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">toBitmap</span>(<span class="hljs-params">canvas, event</span>) {
  <span class="hljs-keyword">const</span> rect = canvas.<span class="hljs-title function_">getBoundingClientRect</span>();
  <span class="hljs-keyword">return</span> {
    <span class="hljs-attr">x</span>: ((event.<span class="hljs-property">clientX</span> - rect.<span class="hljs-property">left</span>) * canvas.<span class="hljs-property">width</span>) / rect.<span class="hljs-property">width</span>,
    <span class="hljs-attr">y</span>: ((event.<span class="hljs-property">clientY</span> - rect.<span class="hljs-property">top</span>) * canvas.<span class="hljs-property">height</span>) / rect.<span class="hljs-property">height</span>,
  };
}
</code></pre></div>
<p>这里假设 canvas 没有边框和内边距，也没有 CSS 旋转。</p>
<p>绘制时如果设置了变换，检测时也要用同一个变换：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js">ctx.<span class="hljs-title function_">setTransform</span>(<span class="hljs-number">2</span>, <span class="hljs-number">0</span>, <span class="hljs-number">0</span>, <span class="hljs-number">2</span>, <span class="hljs-number">100</span>, <span class="hljs-number">0</span>);
ctx.<span class="hljs-title function_">isPointInPath</span>(circle, <span class="hljs-number">200</span>, <span class="hljs-number">100</span>); <span class="hljs-comment">// true，圆心 (50,50) 映射到位图 (200,100)</span>
</code></pre></div>
<p>这个变换先放大 2 倍，再向右移 100，所以圆心 (50, 50) 落在位图的 (200, 100)。检测时传的点是位图坐标，路径则跟着当前变换走，两边就对上了。</p>
<p>另一种做法是反过来：把指针坐标用变换的逆矩阵转回图形自己的局部坐标，再在单位矩阵下检测，见<a href="/questions/graphics-canvas-transform/">《Canvas 的 transform 怎样影响坐标和绘制？》</a>。两种做法只能选一种，混着用会把变换补偿两次。</p>
<h2>重叠时怎样找到最上面的图形</h2>
<p>下面的函数从最后画的图形开始往前找，先用包围盒快速排除，再精确检测：</p>
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
<p>为什么要倒着遍历？因为 <code>shapes</code> 是按绘制顺序存的，后画的盖在上面，倒着找就是从上往下找。</p>
<p>包围盒就是能框住图形的最小矩形。判断点在不在矩形里只要几次比较，比精确检测便宜得多，所以先用它排除掉大部分图形。</p>
<p>哪些对象锁定了、不可选、允许点击穿透，这些由业务模型自己标记，比如这里的 <code>selectable</code>。如果用了网格、四叉树这类空间索引，对象移动、缩放、删除时要同步更新索引。</p>
<h2>还有别的办法吗</h2>
<p>还有一种叫颜色拾取。在一张看不见的离屏画布上，给每个对象用一种唯一的颜色画一遍，点击时读出那个位置的像素颜色，就知道是哪个对象。</p>
<p>它适合形状复杂、数量巨大的场景。可是要关掉抗锯齿，否则边缘会混出别的颜色；<code>getImageData</code> 有读回像素的开销；画布被跨源图片污染以后，也读不出像素。</p>
<h2>常见追问</h2>
<p><strong>命中检测之外还要做什么？</strong></p>
<blockquote>
<p>拖动要配合 <code>setPointerCapture</code>，保证手指移出图形也不丢事件。重要的操作还要提供键盘或普通控件的入口。</p>
</blockquote>
<p><strong>能用 isPointInPath 判断像素是不是透明吗？</strong></p>
<blockquote>
<p>不能，它只看几何形状。要按透明度判断，得用颜色拾取或者直接读像素。</p>
</blockquote>`};export{e as default};