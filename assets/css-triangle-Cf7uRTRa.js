var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>下拉菜单旁边的小箭头、气泡提示框的尖角，都是三角形。最经典的画法是利用边框：把元素的宽高都设成 0，再给四条边框分别设宽度和颜色。</p>
<p>原理在于边框在角上是按斜线拼接的。一个元素四条边框都很粗、颜色各不相同时，你能看到每条边框是一个梯形，相邻两条在角上沿对角线相接。宽高缩到 0 以后，中间的内容区没了，每个梯形的短边缩成一个点，四条边框就变成了四个三角形，尖角都朝向中心。</p>
<p>只想要一个朝下的三角形，就只保留上边框的颜色，把左右边框设成透明，下边框不设。三角形的高度由上边框的宽度决定，底边宽度是左右边框宽度之和。</p>
<p>另一种写法是 <code>clip-path: polygon(50% 0, 100% 100%, 0 100%)</code>，给一个正常大小的元素裁剪出三角形。它更直观，元素有真实的宽高，背景可以用渐变或图片。要注意，边框法画出来的是透明边框加有色边框，透明部分仍然占着位置。</p>
</blockquote>
<h2>边框法</h2>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.arrow-down</span> {
  <span class="hljs-attribute">width</span>: <span class="hljs-number">0</span>;
  <span class="hljs-attribute">height</span>: <span class="hljs-number">0</span>;
  <span class="hljs-attribute">border-top</span>: <span class="hljs-number">10px</span> solid <span class="hljs-number">#333</span>;
  <span class="hljs-attribute">border-left</span>: <span class="hljs-number">8px</span> solid transparent;
  <span class="hljs-attribute">border-right</span>: <span class="hljs-number">8px</span> solid transparent;
}
</code></pre></div>
<p>这样得到一个底边 16px、高 10px、尖角朝下的三角形。</p>
<p>为什么不需要写 <code>border-bottom</code>？如果写了透明的下边框，元素在下方还会多占一段透明的高度，箭头和后面的内容之间就多出空白。只写上、左、右三条边，元素的总高度就正好是上边框的 10px，总宽度是左右边框之和 16px。在 Chrome 里测量，这个元素的尺寸确实是 16×10。</p>
<p>为什么左右边框必须是透明的，而不是不写？上边框是梯形，它的两条斜边是靠左右边框“切”出来的。如果没有左右边框，上边框就是一个普通的矩形，画出来是一条 10px 高的横线。</p>
<p>想要别的方向，就换一条有颜色的边框：尖角朝上用 <code>border-bottom</code> 加透明的左右边框，朝左用 <code>border-right</code> 加透明的上下边框。</p>
<h2>clip-path 写法</h2>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.arrow-clip</span> {
  <span class="hljs-attribute">width</span>: <span class="hljs-number">16px</span>;
  <span class="hljs-attribute">height</span>: <span class="hljs-number">10px</span>;
  <span class="hljs-attribute">background</span>: <span class="hljs-built_in">linear-gradient</span>(<span class="hljs-number">#333</span>, <span class="hljs-number">#999</span>);
  <span class="hljs-attribute">clip-path</span>: <span class="hljs-built_in">polygon</span>(<span class="hljs-number">0</span> <span class="hljs-number">0</span>, <span class="hljs-number">100%</span> <span class="hljs-number">0</span>, <span class="hljs-number">50%</span> <span class="hljs-number">100%</span>);
}
</code></pre></div>
<p><code>polygon</code> 里每对数字是一个顶点坐标，百分比相对元素自身的宽高。这里三个点是左上角、右上角和底边中点，连起来就是一个朝下的三角形。元素本身是正常的 16×10 盒子，背景可以用渐变，这是边框法做不到的。</p>
<p><code>clip-path</code> 裁掉的部分看不见，也不响应点击，但元素在布局里仍然占着完整的矩形。</p>
<h2>常见追问</h2>
<p><strong>气泡提示框的尖角怎么做？</strong></p>
<blockquote>
<p>给气泡加一个 <code>::after</code> 伪元素，用边框法画三角形，<code>position: absolute</code> 定位到气泡边缘。需要尖角带边框时，再叠一个稍大一点、颜色是边框色的三角形在下面，露出的一圈就是边框。</p>
</blockquote>
<p><strong>画一个扇形或者圆怎么写？</strong></p>
<blockquote>
<p>圆用 <code>border-radius: 50%</code>。扇形可以用 <code>conic-gradient</code> 画出一块颜色，再配合 <code>border-radius: 50%</code> 裁成圆形，比用边框拼方便得多。</p>
</blockquote>`};export{e as default};