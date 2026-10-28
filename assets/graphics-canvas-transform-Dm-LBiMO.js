var e={answerHtml:`<h2>简答</h2>
<ul>
<li>当前变换矩阵和调用顺序共同决定图形的最终位置。</li>
<li>用 save/restore 把局部变换和样式限制在一段绘制内。</li>
<li>高 DPI 下可以先用 setTransform 按设备像素比缩放，让绘图代码继续使用接近 CSS 像素的坐标。</li>
<li>处理指针时要用完整矩阵的逆变换，把页面坐标换回绘图空间；clearRect 也受当前变换和裁剪区域影响。</li>
</ul>
<p>Canvas 2D 的当前变换矩阵把绘图坐标映射到画布位图坐标。translate、scale、rotate 改变的是后续绘制如何解释坐标，不会把已经画好的像素重新移动或旋转。</p>
<p>例如画完一个矩形再 translate，只会影响下一次绘制；要让原矩形动起来，通常需要清空并按新状态重画。</p>
<h2>矩阵和调用顺序决定最终位置</h2>
<p>二维矩阵的六个参数 a、b、c、d、e、f 将点 <code>(x, y)</code> 映射为：</p>
<div class="not-prose code-block"><div class="code-language">text</div><pre><code class="hljs language-text">x&#x27; = a × x + c × y + e
y&#x27; = b × x + d × y + f
</code></pre></div>
<p>下面使用真实 Canvas 上下文计算一个点的结果：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> context = <span class="hljs-variable language_">document</span>.<span class="hljs-title function_">createElement</span>(<span class="hljs-string">&#x27;canvas&#x27;</span>).<span class="hljs-title function_">getContext</span>(<span class="hljs-string">&#x27;2d&#x27;</span>);
context.<span class="hljs-title function_">translate</span>(<span class="hljs-number">100</span>, <span class="hljs-number">0</span>);
context.<span class="hljs-title function_">scale</span>(<span class="hljs-number">2</span>, <span class="hljs-number">2</span>);
<span class="hljs-keyword">const</span> point = <span class="hljs-keyword">new</span> <span class="hljs-title class_">DOMPoint</span>(<span class="hljs-number">10</span>, <span class="hljs-number">5</span>).<span class="hljs-title function_">matrixTransform</span>(context.<span class="hljs-title function_">getTransform</span>());
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(point.<span class="hljs-property">x</span>, point.<span class="hljs-property">y</span>); <span class="hljs-comment">// 120 10</span>
</code></pre></div>
<p>当前矩阵在右侧合成新变换。这里点先按局部比例放大，再加上平移；如果改为先 scale 后 translate，平移也会被已有缩放影响，结果将是 220、10。</p>
<p>因此“调用了平移和缩放”还不足以描述场景，必须明确顺序和使用的坐标系。rotate 使用弧度，围绕当前坐标原点旋转；若想绕图形中心旋转，通常先把原点移到中心，再绘制局部坐标图形。</p>
<h2>用 save/restore 限制局部状态</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js">context.<span class="hljs-title function_">save</span>();
<span class="hljs-keyword">try</span> {
  context.<span class="hljs-title function_">translate</span>(<span class="hljs-number">100</span>, <span class="hljs-number">80</span>);
  context.<span class="hljs-title function_">rotate</span>(<span class="hljs-title class_">Math</span>.<span class="hljs-property">PI</span> / <span class="hljs-number">4</span>);
  context.<span class="hljs-property">fillStyle</span> = <span class="hljs-string">&#x27;royalblue&#x27;</span>;
  context.<span class="hljs-title function_">fillRect</span>(-<span class="hljs-number">20</span>, -<span class="hljs-number">10</span>, <span class="hljs-number">40</span>, <span class="hljs-number">20</span>);
} <span class="hljs-keyword">finally</span> {
  context.<span class="hljs-title function_">restore</span>();
}
</code></pre></div>
<p>save/restore 保存恢复的不只是矩阵，还包括许多绘制状态，例如样式和裁剪。但它不是像素撤销栈，也不会恢复之前已经画出的内容；当前路径也不是靠 restore 自动清空，需要按绘制需求使用 beginPath 等方式。</p>
<p>transform 在已有矩阵上叠加，setTransform 则设置为指定矩阵，resetTransform 恢复单位矩阵。重复每帧调用 scale 却不重置，会造成缩放不断累积。</p>
<h2>高 DPI 会增加一层坐标转换</h2>
<p>假设 CSS 展示为 300 × 150，而内部位图为 600 × 300。可以用 <code>setTransform(2, 0, 0, 2, 0, 0)</code> 让绘图代码继续使用接近 CSS 像素的坐标，再在此基础上加入相机缩放和平移。</p>
<p>改变 canvas.width 或 canvas.height 会清空位图并重置上下文状态，调整尺寸后要重新设置变换、样式并重绘。不能只在第一次初始化时 scale，以为之后改尺寸仍保留它。</p>
<p>内部尺寸、CSS 尺寸和用户坐标都要明确。否则常出现画面看起来正确，点击命中却偏移一倍的问题。</p>
<h2>把指针位置反变换回绘图空间</h2>
<p>以下函数假设 canvas 没有边框、内边距和 CSS 旋转/倾斜，且 worldToBitmap 是绘制目标时使用的完整矩阵，包含 DPR 和场景变换：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">clientToWorld</span>(<span class="hljs-params">canvas, clientX, clientY, worldToBitmap</span>) {
  <span class="hljs-keyword">const</span> rect = canvas.<span class="hljs-title function_">getBoundingClientRect</span>();
  <span class="hljs-keyword">if</span> (rect.<span class="hljs-property">width</span> === <span class="hljs-number">0</span> || rect.<span class="hljs-property">height</span> === <span class="hljs-number">0</span>) <span class="hljs-keyword">return</span> <span class="hljs-literal">null</span>;
  <span class="hljs-keyword">const</span> x = (clientX - rect.<span class="hljs-property">left</span>) * canvas.<span class="hljs-property">width</span> / rect.<span class="hljs-property">width</span>;
  <span class="hljs-keyword">const</span> y = (clientY - rect.<span class="hljs-property">top</span>) * canvas.<span class="hljs-property">height</span> / rect.<span class="hljs-property">height</span>;
  <span class="hljs-keyword">const</span> inverse = worldToBitmap.<span class="hljs-title function_">inverse</span>();
  <span class="hljs-keyword">const</span> point = <span class="hljs-keyword">new</span> <span class="hljs-title class_">DOMPoint</span>(x, y).<span class="hljs-title function_">matrixTransform</span>(inverse);
  <span class="hljs-keyword">if</span> (!<span class="hljs-title class_">Number</span>.<span class="hljs-built_in">isFinite</span>(point.<span class="hljs-property">x</span>) || !<span class="hljs-title class_">Number</span>.<span class="hljs-built_in">isFinite</span>(point.<span class="hljs-property">y</span>)) <span class="hljs-keyword">return</span> <span class="hljs-literal">null</span>;
  <span class="hljs-keyword">return</span> { <span class="hljs-attr">x</span>: point.<span class="hljs-property">x</span>, <span class="hljs-attr">y</span>: point.<span class="hljs-property">y</span> };
}
</code></pre></div>
<p>先把 client 坐标转换成位图坐标，再用完整矩阵的逆变换回世界坐标。这样 DPR 已在矩阵里处理，不能再手动除一次，否则会重复补偿。</p>
<p>应保存实际绘制该对象或场景时的矩阵。若调用 save/restore 后再随手读取当前矩阵，可能读到的已不是对象当时使用的变换。缩放为零等不可逆情况也不能拿来做正常命中，示例通过非有限结果返回 null。</p>
<p>复杂 CSS 变换不能只用边界矩形宽高比例解决，需要更完整的坐标映射。这个函数不是处理所有 DOM 变换的通用库。</p>
<h2>清空和裁剪也受状态影响</h2>
<p>clearRect 使用当前变换；想清理整个位图时，通常保存状态、重置变换，再按 canvas.width/height 清空，然后恢复。但已有裁剪区域依然会限制清除，重置矩阵不会自动移除 clip。</p>
<p>应让裁剪与局部变换成对保存恢复，绘制循环统一管理坐标状态。绘制、命中和清理共享清晰的坐标约定，比在每处不断加减补偿数值更可靠。</p>`};export{e as default};