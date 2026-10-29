var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>Canvas 有一个“当前变换矩阵”，你调 <code>translate</code>、<code>scale</code>、<code>rotate</code>，改的都是它。之后画的每个点都会先经过这个矩阵，再落到位图上。可是它只影响之后的绘制，已经画好的像素不会动，所以做动画要清空后按新状态重画。</p>
<p>矩阵 <code>(a, b, c, d, e, f)</code> 把点 <code>(x, y)</code> 变成 <code>(a·x + c·y + e, b·x + d·y + f)</code>。新变换是乘在当前矩阵右边的，所以调用顺序会影响结果：先 <code>translate(100, 0)</code> 再 <code>scale(2, 2)</code>，点 (10, 5) 变成 (120, 10)；反过来就是 (220, 10)。</p>
<p>三个方法要分清：<code>transform()</code> 在当前矩阵上叠加，<code>setTransform()</code> 直接替换，<code>resetTransform()</code> 恢复成单位矩阵。每帧都调 <code>scale()</code> 却不重置，缩放就会越叠越大。</p>
<p>还要注意，改 <code>canvas.width</code> 或 <code>height</code> 会清空画布并重置所有状态，之后要重新设变换。</p>
</blockquote>
<h2>调用顺序为什么会影响结果</h2>
<p>下面先平移再缩放，然后看点 (10, 5) 最后落在哪：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> ctx = <span class="hljs-variable language_">document</span>.<span class="hljs-title function_">createElement</span>(<span class="hljs-string">&#x27;canvas&#x27;</span>).<span class="hljs-title function_">getContext</span>(<span class="hljs-string">&#x27;2d&#x27;</span>);
ctx.<span class="hljs-title function_">translate</span>(<span class="hljs-number">100</span>, <span class="hljs-number">0</span>);
ctx.<span class="hljs-title function_">scale</span>(<span class="hljs-number">2</span>, <span class="hljs-number">2</span>);
<span class="hljs-keyword">const</span> p = <span class="hljs-keyword">new</span> <span class="hljs-title class_">DOMPoint</span>(<span class="hljs-number">10</span>, <span class="hljs-number">5</span>).<span class="hljs-title function_">matrixTransform</span>(ctx.<span class="hljs-title function_">getTransform</span>());
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(p.<span class="hljs-property">x</span>, p.<span class="hljs-property">y</span>); <span class="hljs-comment">// 120 10</span>
</code></pre></div>
<p>代码里先写的是 <code>translate</code>，可是点实际上先被缩放成 (20, 10)，再平移 100，变成 (120, 10)。原因就是新变换乘在右边，离点最近，最先作用到点上。</p>
<p>可以换个角度理解：每次变换都是在移动“坐标系”。先把坐标系右移 100，再在新坐标系里放大 2 倍，所以画在 (10, 5) 的点会落到 (120, 10)。</p>
<h2>怎样绕图形中心旋转</h2>
<p><code>rotate()</code> 用的是弧度，而且总是绕当前原点转。如果直接转，图形会绕画布左上角甩出去。所以要先把原点挪到图形中心，再按以中心为原点的坐标来画：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js">ctx.<span class="hljs-title function_">save</span>();
ctx.<span class="hljs-title function_">translate</span>(cx, cy);
ctx.<span class="hljs-title function_">rotate</span>(<span class="hljs-title class_">Math</span>.<span class="hljs-property">PI</span> / <span class="hljs-number">4</span>);
ctx.<span class="hljs-title function_">fillRect</span>(-<span class="hljs-number">20</span>, -<span class="hljs-number">10</span>, <span class="hljs-number">40</span>, <span class="hljs-number">20</span>); <span class="hljs-comment">// 以中心为原点</span>
ctx.<span class="hljs-title function_">restore</span>();
</code></pre></div>
<h2>save 和 restore 保存的是什么</h2>
<p><code>save()</code> 把当前的状态压进一个栈里，包括矩阵、填充和描边样式、线宽、裁剪区域等；<code>restore()</code> 把它弹出来。上面的例子用它把旋转限制在这一个图形上，画完就恢复。</p>
<p>但它不是撤销像素，画上去的东西不会消失。它也不会清空当前路径，所以画新图形还是要先 <code>beginPath()</code>。</p>
<h2>高清屏怎样设置</h2>
<p>CSS 尺寸是 300×150、设备像素比为 2 时，把位图设成 600×300，再调 <code>ctx.setTransform(2, 0, 0, 2, 0, 0)</code>。这样绘图代码可以继续按 CSS 像素写坐标。场景的平移和缩放，再叠加在这个矩阵之上。</p>
<h2>怎样把指针坐标换回绘图空间</h2>
<p>点击时拿到的是屏幕上的坐标，要知道点在了场景里的哪里，就得把变换倒推回去，也就是乘逆矩阵：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// worldToBitmap：绘制场景时使用的完整矩阵，已包含 DPR</span>
<span class="hljs-keyword">function</span> <span class="hljs-title function_">clientToWorld</span>(<span class="hljs-params">canvas, clientX, clientY, worldToBitmap</span>) {
  <span class="hljs-keyword">const</span> rect = canvas.<span class="hljs-title function_">getBoundingClientRect</span>();
  <span class="hljs-keyword">if</span> (rect.<span class="hljs-property">width</span> === <span class="hljs-number">0</span> || rect.<span class="hljs-property">height</span> === <span class="hljs-number">0</span>) <span class="hljs-keyword">return</span> <span class="hljs-literal">null</span>;
  <span class="hljs-keyword">const</span> x = ((clientX - rect.<span class="hljs-property">left</span>) * canvas.<span class="hljs-property">width</span>) / rect.<span class="hljs-property">width</span>;
  <span class="hljs-keyword">const</span> y = ((clientY - rect.<span class="hljs-property">top</span>) * canvas.<span class="hljs-property">height</span>) / rect.<span class="hljs-property">height</span>;
  <span class="hljs-keyword">const</span> p = <span class="hljs-keyword">new</span> <span class="hljs-title class_">DOMPoint</span>(x, y).<span class="hljs-title function_">matrixTransform</span>(worldToBitmap.<span class="hljs-title function_">inverse</span>());
  <span class="hljs-keyword">return</span> <span class="hljs-title class_">Number</span>.<span class="hljs-built_in">isFinite</span>(p.<span class="hljs-property">x</span>) &amp;&amp; <span class="hljs-title class_">Number</span>.<span class="hljs-built_in">isFinite</span>(p.<span class="hljs-property">y</span>) ? { <span class="hljs-attr">x</span>: p.<span class="hljs-property">x</span>, <span class="hljs-attr">y</span>: p.<span class="hljs-property">y</span> } : <span class="hljs-literal">null</span>;
}
</code></pre></div>
<p>先把 client 坐标按比例换算成位图坐标，再乘逆矩阵。DPR 已经包含在矩阵里了，不要再除一次，否则会偏。</p>
<p>矩阵要用绘制时实际用的那个，保存下来传进来。不要在 <code>restore()</code> 之后随手读 <code>getTransform()</code>，那时读到的已经不是画图时的矩阵了。</p>
<p>缩放为 0 时，矩阵没有逆，算出来是非有限数，所以函数返回 <code>null</code>。另外，canvas 有边框、内边距或者 CSS 旋转时，这个换算就不成立了，要额外处理。</p>
<h2>清空画布为什么没清干净</h2>
<p><code>clearRect()</code> 也受当前变换影响。比如矩阵放大了 2 倍，<code>clearRect(0, 0, canvas.width, canvas.height)</code> 清的区域就跑到了画布外面。所以清空整个位图时，要先重置矩阵：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js">ctx.<span class="hljs-title function_">save</span>();
ctx.<span class="hljs-title function_">resetTransform</span>();
ctx.<span class="hljs-title function_">clearRect</span>(<span class="hljs-number">0</span>, <span class="hljs-number">0</span>, canvas.<span class="hljs-property">width</span>, canvas.<span class="hljs-property">height</span>);
ctx.<span class="hljs-title function_">restore</span>();
</code></pre></div>
<p>还有一点：裁剪区域仍然会限制清除的范围，重置矩阵并不会取消 <code>clip()</code>。</p>
<h2>常见追问</h2>
<p><strong>为什么点击位置总是偏移一倍？</strong></p>
<blockquote>
<p>通常是 DPR 被处理了两次，比如矩阵里已经乘过了，换算时又除一次；或者把 CSS 尺寸当成了位图尺寸。</p>
</blockquote>
<p><strong>命中检测怎样配合变换？</strong></p>
<blockquote>
<p>见<a href="/questions/graphics-canvas-hit-test/">《Canvas 图形命中测试应该怎样实现？》</a>。</p>
</blockquote>`};export{e as default};