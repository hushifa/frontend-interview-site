var e={answerHtml:`<h2>简答</h2>
<ul>
<li>变换只影响之后的绘制，已经画好的像素不会移动。要做动画就清空后按新状态重画。</li>
<li>矩阵 <code>(a, b, c, d, e, f)</code> 把点 <code>(x, y)</code> 映射为 <code>(a·x + c·y + e, b·x + d·y + f)</code>。</li>
<li>新变换乘在当前矩阵右侧，所以先 <code>translate(100, 0)</code> 再 <code>scale(2, 2)</code> 时，点 (10, 5) 变成 (120, 10)；顺序反过来变成 (220, 10)。</li>
<li><code>transform()</code> 在当前矩阵上叠加，<code>setTransform()</code> 直接替换，<code>resetTransform()</code> 恢复单位矩阵。每帧调用 <code>scale()</code> 而不重置，缩放会不断累积。</li>
<li>修改 <code>canvas.width</code> 或 <code>height</code> 会清空画布并重置所有状态，之后要重新设置变换。</li>
</ul>
<h2>顺序验证</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> ctx = <span class="hljs-variable language_">document</span>.<span class="hljs-title function_">createElement</span>(<span class="hljs-string">&#x27;canvas&#x27;</span>).<span class="hljs-title function_">getContext</span>(<span class="hljs-string">&#x27;2d&#x27;</span>);
ctx.<span class="hljs-title function_">translate</span>(<span class="hljs-number">100</span>, <span class="hljs-number">0</span>);
ctx.<span class="hljs-title function_">scale</span>(<span class="hljs-number">2</span>, <span class="hljs-number">2</span>);
<span class="hljs-keyword">const</span> p = <span class="hljs-keyword">new</span> <span class="hljs-title class_">DOMPoint</span>(<span class="hljs-number">10</span>, <span class="hljs-number">5</span>).<span class="hljs-title function_">matrixTransform</span>(ctx.<span class="hljs-title function_">getTransform</span>());
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(p.<span class="hljs-property">x</span>, p.<span class="hljs-property">y</span>); <span class="hljs-comment">// 120 10</span>
</code></pre></div>
<p>点先被缩放成 (20, 10)，再平移 100。<code>rotate()</code> 使用弧度，绕当前原点旋转；要绕图形中心旋转，先把原点平移到中心，再按局部坐标绘制：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js">ctx.<span class="hljs-title function_">save</span>();
ctx.<span class="hljs-title function_">translate</span>(cx, cy);
ctx.<span class="hljs-title function_">rotate</span>(<span class="hljs-title class_">Math</span>.<span class="hljs-property">PI</span> / <span class="hljs-number">4</span>);
ctx.<span class="hljs-title function_">fillRect</span>(-<span class="hljs-number">20</span>, -<span class="hljs-number">10</span>, <span class="hljs-number">40</span>, <span class="hljs-number">20</span>); <span class="hljs-comment">// 以中心为原点</span>
ctx.<span class="hljs-title function_">restore</span>();
</code></pre></div>
<h2>save 和 restore</h2>
<p><code>save()</code> 把矩阵、填充和描边样式、线宽、裁剪区域等状态压栈，<code>restore()</code> 弹出。它不是像素撤销，也不会清空当前路径，新图形仍要 <code>beginPath()</code>。</p>
<h2>高 DPI</h2>
<p>CSS 尺寸 300×150、设备像素比为 2 时，把位图设为 600×300，再设置 <code>ctx.setTransform(2, 0, 0, 2, 0, 0)</code>，绘图代码就可以继续使用 CSS 像素坐标。场景的平移和缩放叠加在这个矩阵之上。</p>
<h2>指针坐标转回绘图空间</h2>
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
<ul>
<li>先换算到位图坐标，再乘逆矩阵。DPR 已经包含在矩阵里，不要再除一次。</li>
<li>保存绘制时实际使用的矩阵，不要在 <code>restore()</code> 之后随手读取 <code>getTransform()</code>。</li>
<li>缩放为 0 时矩阵不可逆，结果是非有限数，函数返回 <code>null</code>。</li>
<li>canvas 有边框、内边距或 CSS 旋转时，这个换算不成立，需要额外处理。</li>
</ul>
<h2>清空画布</h2>
<p><code>clearRect()</code> 也受当前变换影响。清空整个位图时：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js">ctx.<span class="hljs-title function_">save</span>();
ctx.<span class="hljs-title function_">resetTransform</span>();
ctx.<span class="hljs-title function_">clearRect</span>(<span class="hljs-number">0</span>, <span class="hljs-number">0</span>, canvas.<span class="hljs-property">width</span>, canvas.<span class="hljs-property">height</span>);
ctx.<span class="hljs-title function_">restore</span>();
</code></pre></div>
<p>裁剪区域仍会限制清除范围，重置矩阵不会取消 <code>clip()</code>。</p>
<h2>常见追问</h2>
<ul>
<li><strong>为什么点击位置总是偏移一倍？</strong> 通常是 DPR 被处理了两次，或者用 CSS 尺寸当成了位图尺寸。</li>
<li><strong>命中检测怎样配合变换？</strong> 见&quot;Canvas 图形命中测试应该怎样实现？&quot;。</li>
</ul>`};export{e as default};