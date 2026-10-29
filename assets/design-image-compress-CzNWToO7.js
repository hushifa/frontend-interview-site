var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>用户在手机上选了一张 8MB、4000 多像素宽的照片当头像，其实页面上最多显示 400 像素。直接上传既慢又费流量，所以要在浏览器里先压缩成几百 KB 再传。</p>
<p>压缩分三步：先把图片文件解码成位图；再按目标尺寸画到 canvas 上，这一步把像素数降下来；最后用 <code>canvas.toBlob(callback, &#x27;image/jpeg&#x27;, 0.8)</code> 导出，第三个参数是 0 到 1 之间的质量，得到一个新的 Blob 上传。</p>
<p>解码推荐用 <code>createImageBitmap(file)</code>，它直接接受 File，返回 Promise，还能顺便指定缩放后的宽高。它默认按照片里的 EXIF 方向信息把图片摆正，所以竖着拍的照片画出来不会躺倒。</p>
<p>要注意三点：导出格式浏览器不支持时会悄悄退回 PNG，PNG 可能比原图还大，所以导出后要检查类型和大小；压缩后的新图不带原图的 EXIF，拍摄时间、位置都没了，这对隐私是好事，但需要这些信息就要在压缩前读出来；超大图片解码很占内存，最好在 Worker 里处理。</p>
</blockquote>
<h2>压缩主要靠什么变小</h2>
<p>照片文件大，一是像素多，二是编码质量高。降尺寸的效果最明显：宽高各缩到原来的十分之一，像素数就只剩百分之一。再降低 JPEG 或 WebP 的质量参数，文件还能再小一截。</p>
<p>所以通常先定一个最长边，比如 1600 像素，等比缩放，再用 0.7 到 0.85 的质量导出。这些数字要按业务对清晰度的要求来调。</p>
<h2>怎样写压缩函数</h2>
<p>下面这个函数接收用户选的 File，返回压缩后的 Blob：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">compressImage</span>(<span class="hljs-params">file, { maxSize = <span class="hljs-number">1600</span>, type = <span class="hljs-string">&#x27;image/jpeg&#x27;</span>, quality = <span class="hljs-number">0.8</span> } = {}</span>) {
  <span class="hljs-keyword">const</span> bitmap = <span class="hljs-keyword">await</span> <span class="hljs-title function_">createImageBitmap</span>(file); <span class="hljs-comment">// 默认按 EXIF 方向摆正</span>
  <span class="hljs-keyword">const</span> scale = <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">min</span>(<span class="hljs-number">1</span>, maxSize / <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">max</span>(bitmap.<span class="hljs-property">width</span>, bitmap.<span class="hljs-property">height</span>));
  <span class="hljs-keyword">const</span> width = <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">round</span>(bitmap.<span class="hljs-property">width</span> * scale);
  <span class="hljs-keyword">const</span> height = <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">round</span>(bitmap.<span class="hljs-property">height</span> * scale);

  <span class="hljs-keyword">const</span> canvas = <span class="hljs-variable language_">document</span>.<span class="hljs-title function_">createElement</span>(<span class="hljs-string">&#x27;canvas&#x27;</span>);
  canvas.<span class="hljs-property">width</span> = width;
  canvas.<span class="hljs-property">height</span> = height;
  <span class="hljs-keyword">const</span> ctx = canvas.<span class="hljs-title function_">getContext</span>(<span class="hljs-string">&#x27;2d&#x27;</span>);
  <span class="hljs-keyword">if</span> (type === <span class="hljs-string">&#x27;image/jpeg&#x27;</span>) {
    ctx.<span class="hljs-property">fillStyle</span> = <span class="hljs-string">&#x27;#fff&#x27;</span>; <span class="hljs-comment">// JPEG 没有透明通道，先铺白底</span>
    ctx.<span class="hljs-title function_">fillRect</span>(<span class="hljs-number">0</span>, <span class="hljs-number">0</span>, width, height);
  }
  ctx.<span class="hljs-title function_">drawImage</span>(bitmap, <span class="hljs-number">0</span>, <span class="hljs-number">0</span>, width, height);
  bitmap.<span class="hljs-title function_">close</span>(); <span class="hljs-comment">// 尽早释放解码出来的位图</span>

  <span class="hljs-keyword">const</span> blob = <span class="hljs-keyword">await</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Promise</span>(<span class="hljs-function">(<span class="hljs-params">resolve</span>) =&gt;</span> canvas.<span class="hljs-title function_">toBlob</span>(resolve, type, quality));
  <span class="hljs-keyword">if</span> (!blob || blob.<span class="hljs-property">type</span> !== type || blob.<span class="hljs-property">size</span> &gt;= file.<span class="hljs-property">size</span>) <span class="hljs-keyword">return</span> file;
  <span class="hljs-keyword">return</span> blob;
}
</code></pre></div>
<p><code>Math.min(1, …)</code> 保证小图不会被放大。<code>bitmap.close()</code> 是因为 MDN 说明它会释放 ImageBitmap 占用的所有图形资源，一张几千万像素的位图占内存很多，画完就可以丢掉。</p>
<p>为什么 JPEG 要先铺白底？PNG 透明的部分画到 canvas 上是透明像素，导出 JPEG 时没有透明通道。在 headless Chrome 里实测，一块全透明的 canvas 导出 JPEG 后再读像素，得到的是不透明的黑色 <code>0,0,0,255</code>。先填白色就不会出现黑底。</p>
<p>最后一行的判断很重要，下面单独讲。</p>
<h2>为什么导出后要检查类型和大小</h2>
<p><code>toBlob</code> 的回调可能拿到 <code>null</code>，MDN 写明无法生成图片时会传 <code>null</code>。另外，MDN 说明不指定格式或者指定的格式不支持时，会导出 <code>image/png</code>；浏览器必须支持 PNG，很多浏览器还支持 JPEG 和 WebP。在 headless Chrome 里实测，<code>toBlob</code> 传一个不存在的 <code>&#x27;image/xyz&#x27;</code>，回调拿到的 Blob 类型是 <code>image/png</code>。</p>
<p>问题在于 PNG 是无损格式，一张照片导出成 PNG 往往比原来的 JPEG 还大。所以要检查返回的 <code>blob.type</code> 是不是请求的格式，大小是不是真的变小了，不满足就上传原文件。</p>
<p>质量参数也有边界：MDN 说明它只对 JPEG、WebP 这类有损格式有效，没传或者超出 0 到 1 的范围，浏览器用自己的默认质量。</p>
<h2>照片为什么会躺倒，EXIF 方向是什么</h2>
<p>手机竖着拍照时，传感器存下来的像素其实可能是横着的，相机在文件里记一个“方向”标记（EXIF 里的 Orientation），告诉看图软件显示时要转多少度。如果解码时忽略这个标记，竖拍的照片画到 canvas 上就躺倒了。</p>
<p>现在浏览器默认会处理这个标记。MDN 说明 CSS <code>image-orientation</code> 的初始值是 <code>from-image</code>，用 EXIF 信息摆正图片；<code>createImageBitmap</code> 的 <code>imageOrientation</code> 选项默认也是 <code>from-image</code>，按 EXIF 方向摆正。在 headless Chrome 里实测：给一张 40×20 的 JPEG 写入“需要旋转 90 度”的 EXIF 标记，<code>createImageBitmap</code> 得到的位图是 20×40，用 <code>&lt;img&gt;</code> 加载读到的 <code>naturalWidth</code> 和 <code>naturalHeight</code> 也是 20×40，说明两种方式都已经按方向摆正。</p>
<p>所以用这两种方式解码，一般不需要自己再读 EXIF 去旋转。早年的教程里手动解析 EXIF 再旋转 canvas 的代码，放到现在的浏览器里反而会转两次。如果要兼容很旧的浏览器，先实测再决定。</p>
<h2>可以让浏览器在解码时直接缩放吗</h2>
<p><code>createImageBitmap</code> 的选项里有 <code>resizeWidth</code>、<code>resizeHeight</code> 和 <code>resizeQuality</code>。MDN 说明 <code>resizeQuality</code> 可以是 <code>pixelated</code>、<code>low</code>（默认）、<code>medium</code>、<code>high</code>。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> bitmap = <span class="hljs-keyword">await</span> <span class="hljs-title function_">createImageBitmap</span>(file, {
  <span class="hljs-attr">resizeWidth</span>: width,
  <span class="hljs-attr">resizeHeight</span>: height,
  <span class="hljs-attr">resizeQuality</span>: <span class="hljs-string">&#x27;high&#x27;</span>,
});
</code></pre></div>
<p>这样拿到的位图已经是目标尺寸，不用再让 canvas 在 <code>drawImage</code> 时缩放，内存占用也小一些。要先知道原图宽高才能算目标尺寸。也可以只设 <code>resizeWidth</code>：在 headless Chrome 里实测，40×20 的源图只传 <code>resizeWidth: 10</code>，得到的位图是 10×5，高度按比例算出。</p>
<h2>超大图片怎样避免卡住页面</h2>
<p>解码和导出都很耗时。<code>createImageBitmap</code> 返回 Promise，解码不阻塞主线程；但 canvas 绘制和 <code>toBlob</code> 的编码在主线程的 canvas 上做，几千万像素的图片可能卡顿。可以把 File 发给 Worker，在 Worker 里用 <code>createImageBitmap</code> 和 <code>OffscreenCanvas</code> 完成同样的流程，<code>OffscreenCanvas</code> 用 <code>convertToBlob</code> 导出，见<a href="/questions/web-offscreen-canvas/">《OffscreenCanvas 什么时候能减少主线程绘制压力？》</a>。</p>
<h2>常见追问</h2>
<p><strong>压缩后的图片还有原来的拍摄信息吗？</strong></p>
<blockquote>
<p>没有。canvas 导出的是一张全新编码的图片，只有像素，不带原图的 EXIF。拍摄时间、相机型号、GPS 位置都会丢失。上传头像时这正好保护了隐私；如果业务需要这些信息，要在压缩前用 EXIF 解析库读出来，单独提交。</p>
</blockquote>
<p><strong>怎样在上传前预览压缩后的效果？</strong></p>
<blockquote>
<p>用 <code>URL.createObjectURL(blob)</code> 生成一个地址给 <code>&lt;img&gt;</code> 显示，不用等上传完成。预览结束或组件卸载时调用 <code>URL.revokeObjectURL</code> 释放，见<a href="/questions/api-files/">《File、Blob 和 object URL 怎样用于文件预览？》</a>。</p>
</blockquote>
<p><strong>WebP 和 JPEG 选哪个？</strong></p>
<blockquote>
<p>同样的画质，WebP 通常更小，但先确认服务端和使用这些图片的下游都支持 WebP。导出时请求 WebP，再检查 <code>blob.type</code>，不支持就退回 JPEG。</p>
</blockquote>`};export{e as default};