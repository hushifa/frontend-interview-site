var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>比如上传头像时，用户选了一张 4000×3000 的照片，页面上缩小显示成 400 像素宽，用户在上面拖出一个正方形框，确认后得到 200×200 的头像。前端裁剪的核心就是 Canvas 的 <code>drawImage</code> 九参数形式：前四个数是原图里要截取的矩形，后四个数是画到画布上的位置和大小。</p>
<p>最容易错的是坐标。裁剪框是在缩小后的预览图上拖的，单位是页面上的 CSS 像素，而 <code>drawImage</code> 的源矩形要用原图的像素。所以要先算比例，原图的 <code>naturalWidth</code> 除以预览图的显示宽度，再把裁剪框的位置和大小都乘上这个比例。</p>
<p>画布本身也有两种尺寸。CSS 宽高决定在页面上显示多大，<code>width</code>、<code>height</code> 属性决定实际有多少像素。在设备像素比为 2 或 3 的手机上，预览画布要把像素尺寸乘以 <code>devicePixelRatio</code>，否则看起来发糊；导出用的画布则直接按目标输出尺寸设置。</p>
<p>还要注意照片方向。手机照片可能带 EXIF 方向标记，现代浏览器默认按它把图片摆正，<code>&lt;img&gt;</code> 的 <code>naturalWidth</code> 也是摆正后的尺寸，所以裁剪坐标按摆正后的图来算就行。画完用 <code>toBlob</code> 导出成 JPEG 或 PNG 上传。</p>
</blockquote>
<h2>drawImage 的九个参数是什么意思</h2>
<p><code>drawImage</code> 有三种写法，MDN 列出的签名是：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-title function_">drawImage</span>(image, dx, dy);
<span class="hljs-title function_">drawImage</span>(image, dx, dy, dWidth, dHeight);
<span class="hljs-title function_">drawImage</span>(image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);
</code></pre></div>
<p>带 <code>s</code> 的是源（source），指原图里要截取的那块矩形：<code>sx</code>、<code>sy</code> 是左上角坐标，<code>sWidth</code>、<code>sHeight</code> 是宽高。带 <code>d</code> 的是目标（destination），指画到画布的哪里、画多大。源矩形和目标矩形大小不一样时，浏览器会自动缩放。</p>
<p>所以裁剪就是选对源矩形，再把目标矩形设成整张输出画布。比如从原图 (1000, 500) 开始截一块 1500×1500 的区域，输出 200×200 的头像：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> canvas = <span class="hljs-variable language_">document</span>.<span class="hljs-title function_">createElement</span>(<span class="hljs-string">&#x27;canvas&#x27;</span>);
canvas.<span class="hljs-property">width</span> = <span class="hljs-number">200</span>;
canvas.<span class="hljs-property">height</span> = <span class="hljs-number">200</span>;
<span class="hljs-keyword">const</span> ctx = canvas.<span class="hljs-title function_">getContext</span>(<span class="hljs-string">&#x27;2d&#x27;</span>);
ctx.<span class="hljs-title function_">drawImage</span>(img, <span class="hljs-number">1000</span>, <span class="hljs-number">500</span>, <span class="hljs-number">1500</span>, <span class="hljs-number">1500</span>, <span class="hljs-number">0</span>, <span class="hljs-number">0</span>, <span class="hljs-number">200</span>, <span class="hljs-number">200</span>);
</code></pre></div>
<p>如果裁剪框拖到了图片外面怎么办？HTML 规范规定，源矩形超出原图时，会被裁到原图范围内，目标矩形按同样的比例缩小，超出的部分什么都不画，也不会报错。所以画布上会留出透明的空白。最好在交互上就限制裁剪框不出界。</p>
<h2>裁剪框的坐标怎样换算</h2>
<p>用户看到的是缩小后的预览图，裁剪框的位置是相对预览图左上角的 CSS 像素。换算只需要一个比例：原图宽度除以显示宽度。下面的函数把预览上的裁剪框换算成源矩形，并把它限制在原图范围内：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">toSourceRect</span>(<span class="hljs-params">box, displayWidth, naturalWidth, naturalHeight</span>) {
  <span class="hljs-keyword">const</span> scale = naturalWidth / displayWidth;
  <span class="hljs-keyword">const</span> sx = <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">round</span>(box.<span class="hljs-property">x</span> * scale);
  <span class="hljs-keyword">const</span> sy = <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">round</span>(box.<span class="hljs-property">y</span> * scale);
  <span class="hljs-keyword">const</span> sw = <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">round</span>(box.<span class="hljs-property">width</span> * scale);
  <span class="hljs-keyword">const</span> sh = <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">round</span>(box.<span class="hljs-property">height</span> * scale);
  <span class="hljs-keyword">const</span> x = <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">min</span>(<span class="hljs-title class_">Math</span>.<span class="hljs-title function_">max</span>(sx, <span class="hljs-number">0</span>), naturalWidth);
  <span class="hljs-keyword">const</span> y = <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">min</span>(<span class="hljs-title class_">Math</span>.<span class="hljs-title function_">max</span>(sy, <span class="hljs-number">0</span>), naturalHeight);
  <span class="hljs-keyword">return</span> {
    <span class="hljs-attr">sx</span>: x,
    <span class="hljs-attr">sy</span>: y,
    <span class="hljs-attr">sw</span>: <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">min</span>(sw, naturalWidth - x),
    <span class="hljs-attr">sh</span>: <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">min</span>(sh, naturalHeight - y),
  };
}

<span class="hljs-keyword">const</span> rect = <span class="hljs-title function_">toSourceRect</span>({ <span class="hljs-attr">x</span>: <span class="hljs-number">100</span>, <span class="hljs-attr">y</span>: <span class="hljs-number">50</span>, <span class="hljs-attr">width</span>: <span class="hljs-number">150</span>, <span class="hljs-attr">height</span>: <span class="hljs-number">150</span> }, <span class="hljs-number">400</span>, <span class="hljs-number">4000</span>, <span class="hljs-number">3000</span>);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">\`<span class="hljs-subst">\${rect.sx}</span>,<span class="hljs-subst">\${rect.sy}</span>,<span class="hljs-subst">\${rect.sw}</span>,<span class="hljs-subst">\${rect.sh}</span>\`</span>); <span class="hljs-comment">// 1000,500,1500,1500</span>

<span class="hljs-keyword">const</span> edge = <span class="hljs-title function_">toSourceRect</span>({ <span class="hljs-attr">x</span>: <span class="hljs-number">300</span>, <span class="hljs-attr">y</span>: <span class="hljs-number">250</span>, <span class="hljs-attr">width</span>: <span class="hljs-number">150</span>, <span class="hljs-attr">height</span>: <span class="hljs-number">150</span> }, <span class="hljs-number">400</span>, <span class="hljs-number">4000</span>, <span class="hljs-number">3000</span>);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">\`<span class="hljs-subst">\${edge.sx}</span>,<span class="hljs-subst">\${edge.sy}</span>,<span class="hljs-subst">\${edge.sw}</span>,<span class="hljs-subst">\${edge.sh}</span>\`</span>); <span class="hljs-comment">// 3000,2500,1000,500</span>

<span class="hljs-keyword">const</span> dpr = <span class="hljs-number">3</span>;
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-number">400</span> * dpr); <span class="hljs-comment">// 1200</span>
</code></pre></div>
<p>第一行就是上面 <code>drawImage</code> 例子用的数字。原图宽 4000、显示宽 400，比例是 10，预览上 (100, 50) 起 150×150 的框，对应原图 (1000, 500) 起 1500×1500 的区域。</p>
<p>第二行的框靠近右下角，乘上比例以后会超出原图：横向从 3000 到 4500，纵向从 2500 到 4000，原图只有 4000×3000。函数把宽度截到 1000、高度截到 500，结果就不是正方形了。实际产品里通常是在用户拖动时就不让框超出图片，这样宽高比不会被破坏。</p>
<p>最后一行是预览画布的像素宽度，下一节讲。</p>
<h2>预览为什么会糊</h2>
<p>如果预览用 canvas 画（比如要显示裁剪框外的半透明遮罩），会遇到画面发糊的问题。canvas 的 CSS 宽高只决定在页面上占多大，<code>width</code>、<code>height</code> 属性才决定它有多少个像素。在设备像素比为 3 的手机上，400 个 CSS 像素宽的区域实际有 1200 个物理像素，画布只有 400 像素宽，就会被拉伸显示。</p>
<p>MDN 的做法是：CSS 尺寸不变，画布的像素尺寸乘以 <code>devicePixelRatio</code>，再用 <code>ctx.scale</code> 把坐标系换回 CSS 像素，这样后面的绘制代码仍然按 400 宽来写：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> dpr = <span class="hljs-variable language_">window</span>.<span class="hljs-property">devicePixelRatio</span>;
preview.<span class="hljs-property">style</span>.<span class="hljs-property">width</span> = <span class="hljs-string">&#x27;400px&#x27;</span>;
preview.<span class="hljs-property">style</span>.<span class="hljs-property">height</span> = <span class="hljs-string">&#x27;300px&#x27;</span>;
preview.<span class="hljs-property">width</span> = <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">floor</span>(<span class="hljs-number">400</span> * dpr);
preview.<span class="hljs-property">height</span> = <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">floor</span>(<span class="hljs-number">300</span> * dpr);
previewCtx.<span class="hljs-title function_">scale</span>(dpr, dpr);
</code></pre></div>
<p>导出用的画布不需要这样处理。它不显示在页面上，像素尺寸直接设成想要的输出大小，比如头像的 200×200。</p>
<h2>照片方向会不会让裁剪错位</h2>
<p>手机竖着拍的照片，像素数据可能是横着存的，再用 EXIF 里的方向标记告诉软件显示时要转多少度。MDN 说明，CSS <code>image-orientation</code> 的初始值是 <code>from-image</code>，按图片里的 EXIF 信息把图片转正。<a href="/questions/design-image-compress/">《图片上传前怎样在浏览器里压缩？》</a>里用 headless Chrome 实测过，带“旋转 90 度”标记的图片，<code>&lt;img&gt;</code> 读到的 <code>naturalWidth</code> 和 <code>naturalHeight</code> 已经是转正后的尺寸，<code>createImageBitmap</code> 默认也会转正。</p>
<p>所以在现代浏览器里，用户看到的预览、<code>naturalWidth</code> 和 <code>drawImage</code> 画出的内容都是同一个方向，裁剪坐标按看到的图来算就不会错位。MDN 的 <code>drawImage</code> 页面提到，一些旧版浏览器的 <code>drawImage</code> 会忽略 EXIF 方向，这在 iOS 上尤其明显，那时需要自己读方向再用 <code>rotate()</code> 转正。现在再手动旋转，反而可能转两次，要兼容旧浏览器时应该先实测。</p>
<h2>怎样导出裁剪结果</h2>
<p>画好以后用 <code>toBlob</code> 导出。它通过回调给出 <code>Blob</code>，不传类型默认是 PNG；JPEG、WebP 可以传第三个参数指定 0 到 1 的质量：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js">canvas.<span class="hljs-title function_">toBlob</span>(
  <span class="hljs-function">(<span class="hljs-params">blob</span>) =&gt;</span> {
    <span class="hljs-keyword">if</span> (!blob) <span class="hljs-keyword">return</span>; <span class="hljs-comment">// 图片因为任何原因生成不了时会得到 null</span>
    <span class="hljs-keyword">const</span> form = <span class="hljs-keyword">new</span> <span class="hljs-title class_">FormData</span>();
    form.<span class="hljs-title function_">append</span>(<span class="hljs-string">&#x27;avatar&#x27;</span>, blob, <span class="hljs-string">&#x27;avatar.jpg&#x27;</span>);
    <span class="hljs-title function_">fetch</span>(<span class="hljs-string">&#x27;/api/avatar&#x27;</span>, { <span class="hljs-attr">method</span>: <span class="hljs-string">&#x27;POST&#x27;</span>, <span class="hljs-attr">body</span>: form });
  },
  <span class="hljs-string">&#x27;image/jpeg&#x27;</span>,
  <span class="hljs-number">0.9</span>,
);
</code></pre></div>
<p>如果原图来自其他源又没有经过 CORS 允许，画进画布以后 <code>toBlob</code> 会抛 <code>SecurityError</code>。用户从本地选择的文件不存在这个问题；裁剪网络图片时，要给图片设置 <code>crossOrigin</code>，并让图片服务器返回 CORS 头，详见<a href="/questions/design-screenshot-poster/">《前端怎样生成截图或分享海报？html2canvas 有哪些限制？》</a>。</p>
<h2>常见追问</h2>
<p><strong>裁剪框想固定 1:1 或者 16:9，怎么处理？</strong></p>
<blockquote>
<p>在拖动裁剪框时就锁定宽高比，比如改变宽度时按比例算出高度，并且限制框不超出预览图。这样换算到原图以后，源矩形的比例和目标画布一致，<code>drawImage</code> 缩放时不会拉伸变形。</p>
</blockquote>
<p><strong>为什么不直接用 CSS 裁剪，比如 <code>object-fit</code> 或 <code>overflow: hidden</code>？</strong></p>
<blockquote>
<p>CSS 只改变显示效果，上传的仍然是原图。要把裁剪结果真正发给服务器，就得把像素画到 canvas 上再导出成新文件。CSS 适合做预览，canvas 负责生成结果。</p>
</blockquote>
<p><strong>用户选的图片特别大，裁剪时页面卡顿怎么办？</strong></p>
<blockquote>
<p>预览不必用原图大小渲染，可以先生成一张缩小的预览图，只在最后导出时才用原图按源矩形裁一次。也可以把解码和绘制放到 Worker 里，用 <code>OffscreenCanvas</code> 完成，见<a href="/questions/web-offscreen-canvas/">《OffscreenCanvas 什么时候能减少主线程绘制压力？》</a>。</p>
</blockquote>`};export{e as default};