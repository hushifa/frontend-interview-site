var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>比如活动页要生成一张带头像、昵称和二维码的分享海报，让用户长按保存。常见做法有两种：用 html2canvas 把一段 DOM 转成图片，或者直接用 Canvas 一笔一笔画出来。</p>
<p>html2canvas 并不是真的截屏。它遍历 DOM，读出每个元素的样式，再用 Canvas 重新画一遍，所以结果取决于它支持哪些 CSS。官方文档列出 <code>box-shadow</code>、<code>filter</code>、<code>object-fit</code> 等属性目前不支持，跨域图片默认也读不到。</p>
<p>版式固定的海报，直接用 Canvas 画更可控：背景、头像、文字、二维码的位置都由自己算，画完用 <code>toBlob</code> 导出成图片。为了在高清屏上不糊，画布的像素尺寸要乘以 <code>devicePixelRatio</code>。</p>
<p>最常见的坑是跨域图片。没有经过 CORS 允许的图片画进画布后，画布就被“污染”了，再调用 <code>toBlob</code>、<code>toDataURL</code>、<code>getImageData</code> 都会抛 <code>SecurityError</code>。解决办法是给图片设置 <code>crossOrigin = &quot;anonymous&quot;</code>，同时图片服务器返回 <code>Access-Control-Allow-Origin</code>。</p>
</blockquote>
<h2>html2canvas 是怎样工作的</h2>
<p>html2canvas 的官方文档说得很直白：它遍历所在页面的 DOM，根据读到的属性构建页面的一份“表示”，再画到 canvas 上，并不是去截取屏幕上真实的像素。</p>
<p>所以它能画出来的样子，取决于它实现了哪些 CSS。官方 Features 页面列出了目前不支持的属性，包括 <code>background-blend-mode</code>、<code>border-image</code>、<code>box-decoration-break</code>、<code>box-shadow</code>、<code>filter</code>、<code>font-variant-ligatures</code>、<code>mix-blend-mode</code>、<code>object-fit</code>、<code>repeating-linear-gradient()</code>、<code>writing-mode</code> 和 <code>zoom</code>。设计稿里用了阴影、滤镜，生成的图片就会和页面上看到的不一样。另外它不渲染 Flash、Java Applet 这类插件内容。</p>
<p>它的常用配置也和这些限制有关，下面的默认值来自官方 Configuration 页面：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> canvas = <span class="hljs-keyword">await</span> <span class="hljs-title function_">html2canvas</span>(posterElement, {
  <span class="hljs-attr">useCORS</span>: <span class="hljs-literal">true</span>, <span class="hljs-comment">// 默认 false，尝试用 CORS 加载跨域图片</span>
  <span class="hljs-attr">scale</span>: <span class="hljs-variable language_">window</span>.<span class="hljs-property">devicePixelRatio</span>, <span class="hljs-comment">// 默认值就是设备像素比</span>
  <span class="hljs-attr">backgroundColor</span>: <span class="hljs-string">&#x27;#ffffff&#x27;</span>, <span class="hljs-comment">// 默认白色，传 null 得到透明背景</span>
  <span class="hljs-attr">imageTimeout</span>: <span class="hljs-number">15000</span>, <span class="hljs-comment">// 默认 15 秒，单张图片加载超时</span>
});
</code></pre></div>
<p>跨域图片还有 <code>proxy</code> 选项，可以填一个代理地址来加载跨域图片，留空时跨域图片不会被加载。<code>allowTaint</code> 默认是 <code>false</code>，即使打开，画布被污染以后也导不出图片，所以一般不开。</p>
<h2>直接用 Canvas 画海报</h2>
<p>海报的版式通常是固定的，位置、字号都写在设计稿上，这种情况直接用 Canvas 画更可靠，不受 html2canvas 的 CSS 支持范围影响。</p>
<p>Canvas 画文字有一个麻烦：<code>fillText</code> 不会自动换行，长昵称或者长标题要自己拆行。思路是逐个字符往当前行里加，用 <code>measureText</code> 量宽度，超过最大宽度就另起一行。下面的例子把量宽度的函数换成“每个字 20 像素”，方便直接运行看结果：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">wrapText</span>(<span class="hljs-params">text, maxWidth, measure</span>) {
  <span class="hljs-keyword">const</span> lines = [];
  <span class="hljs-keyword">let</span> line = <span class="hljs-string">&#x27;&#x27;</span>;
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> char <span class="hljs-keyword">of</span> text) {
    <span class="hljs-keyword">if</span> (line &amp;&amp; <span class="hljs-title function_">measure</span>(line + char) &gt; maxWidth) {
      lines.<span class="hljs-title function_">push</span>(line);
      line = char;
    } <span class="hljs-keyword">else</span> {
      line += char;
    }
  }
  <span class="hljs-keyword">if</span> (line) lines.<span class="hljs-title function_">push</span>(line);
  <span class="hljs-keyword">return</span> lines;
}

<span class="hljs-keyword">const</span> <span class="hljs-title function_">measure</span> = (<span class="hljs-params">value</span>) =&gt; value.<span class="hljs-property">length</span> * <span class="hljs-number">20</span>;
<span class="hljs-keyword">const</span> lines = <span class="hljs-title function_">wrapText</span>(<span class="hljs-string">&#x27;新人专享限时优惠快来扫码&#x27;</span>, <span class="hljs-number">100</span>, measure);

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(lines.<span class="hljs-property">length</span>); <span class="hljs-comment">// 3</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(lines[<span class="hljs-number">0</span>]); <span class="hljs-comment">// 新人专享限</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(lines[<span class="hljs-number">2</span>]); <span class="hljs-comment">// 扫码</span>

<span class="hljs-keyword">const</span> dpr = <span class="hljs-number">2</span>;
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-number">375</span> * dpr); <span class="hljs-comment">// 750</span>
</code></pre></div>
<p>最大宽度 100、每个字 20 像素，一行最多放 5 个字，所以 12 个字被拆成 3 行，最后一行只剩“扫码”。在浏览器里，把 <code>measure</code> 换成 <code>(value) =&gt; ctx.measureText(value).width</code> 就行，每行再用 <code>fillText</code> 按行高往下画。</p>
<p>最后一行的 750 是画布的实际像素宽度。海报在页面上显示 375 像素宽，可是在设备像素比为 2 的屏幕上，一个 CSS 像素对应 2 个物理像素。MDN 的做法是让画布的 <code>width</code>、<code>height</code> 乘以 <code>devicePixelRatio</code>，CSS 尺寸保持不变，再用 <code>ctx.scale(dpr, dpr)</code> 把坐标系换回 CSS 像素，这样后面的绘制代码仍然按 375 宽来写，导出的图片却是清晰的：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> dpr = <span class="hljs-variable language_">window</span>.<span class="hljs-property">devicePixelRatio</span>;
canvas.<span class="hljs-property">style</span>.<span class="hljs-property">width</span> = <span class="hljs-string">&#x27;375px&#x27;</span>;
canvas.<span class="hljs-property">style</span>.<span class="hljs-property">height</span> = <span class="hljs-string">&#x27;667px&#x27;</span>;
canvas.<span class="hljs-property">width</span> = <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">floor</span>(<span class="hljs-number">375</span> * dpr);
canvas.<span class="hljs-property">height</span> = <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">floor</span>(<span class="hljs-number">667</span> * dpr);
ctx.<span class="hljs-title function_">scale</span>(dpr, dpr);
</code></pre></div>
<h2>跨域图片为什么会让导出失败</h2>
<p>头像、商品图往往放在 CDN 上，和页面不同源。MDN 解释，只要往画布里画了从其他源加载、又没有经过 CORS 允许的数据，画布就会变成“被污染”（tainted）的状态。之后调用 <code>getImageData()</code>、<code>toBlob()</code>、<code>toDataURL()</code> 或 <code>captureStream()</code>，都会抛出 <code>SecurityError</code>。</p>
<p>浏览器这样做是为了防止网页借画布读出别的网站的图片内容。HTML 规范里，画布有一个 origin-clean 标记，画入 CORS 跨域的图片后标记变成 false，<code>toBlob</code> 第一步就检查它。</p>
<p>解决要前后端配合。前端在设置 <code>src</code> 之前给图片设置 <code>crossOrigin</code>，让浏览器以 CORS 方式请求；图片服务器在响应里返回 <code>Access-Control-Allow-Origin</code>：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">loadImage</span>(<span class="hljs-params">url</span>) {
  <span class="hljs-keyword">return</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Promise</span>(<span class="hljs-function">(<span class="hljs-params">resolve, reject</span>) =&gt;</span> {
    <span class="hljs-keyword">const</span> img = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Image</span>();
    img.<span class="hljs-property">crossOrigin</span> = <span class="hljs-string">&#x27;anonymous&#x27;</span>; <span class="hljs-comment">// 不带 Cookie 的 CORS 请求</span>
    img.<span class="hljs-property">onload</span> = <span class="hljs-function">() =&gt;</span> <span class="hljs-title function_">resolve</span>(img);
    img.<span class="hljs-property">onerror</span> = reject;
    img.<span class="hljs-property">src</span> = url; <span class="hljs-comment">// 最后设置 src，这一步开始下载</span>
  });
}
</code></pre></div>
<p>服务器不配合时，前端设置了 <code>crossOrigin</code> 也没用，请求会被 CORS 拦下，图片加载失败。这时只能让同源的服务端代理这张图片，这也是 html2canvas 提供 <code>proxy</code> 选项的原因。CORS 的原理见<a href="/questions/http-cors/">《什么是跨域？CORS 为什么需要服务端配合？》</a>。</p>
<h2>怎样导出图片</h2>
<p>画完以后用 <code>toBlob</code> 导出。它不直接返回结果，而是通过回调拿到 <code>Blob</code>；不传类型时默认导出 PNG，第三个参数是 0 到 1 之间的质量，只对 JPEG、WebP 这类有损格式有效：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">canvasToBlob</span>(<span class="hljs-params">canvas, type = <span class="hljs-string">&#x27;image/png&#x27;</span>, quality</span>) {
  <span class="hljs-keyword">return</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Promise</span>(<span class="hljs-function">(<span class="hljs-params">resolve, reject</span>) =&gt;</span> {
    canvas.<span class="hljs-title function_">toBlob</span>(<span class="hljs-function">(<span class="hljs-params">blob</span>) =&gt;</span> {
      <span class="hljs-comment">// 图片因为任何原因生成不了时，回调拿到的是 null</span>
      <span class="hljs-keyword">if</span> (blob) <span class="hljs-title function_">resolve</span>(blob);
      <span class="hljs-keyword">else</span> <span class="hljs-title function_">reject</span>(<span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">&#x27;导出失败&#x27;</span>));
    }, type, quality);
  });
}

<span class="hljs-keyword">const</span> blob = <span class="hljs-keyword">await</span> <span class="hljs-title function_">canvasToBlob</span>(canvas, <span class="hljs-string">&#x27;image/jpeg&#x27;</span>, <span class="hljs-number">0.9</span>);
<span class="hljs-keyword">const</span> url = <span class="hljs-variable constant_">URL</span>.<span class="hljs-title function_">createObjectURL</span>(blob);
</code></pre></div>
<p>为什么要判断 <code>null</code>？MDN 写明，图片因为任何原因无法生成时，回调会收到 <code>null</code>；按 HTML 规范，宽或高为 0 的画布就会得到 <code>null</code>。拿到 <code>Blob</code> 以后可以上传，或者生成 object URL 放进 <code>&lt;img&gt;</code> 里让用户长按保存，用完调用 <code>URL.revokeObjectURL</code> 释放，见<a href="/questions/api-files/">《File、Blob 和 object URL 怎样用于文件预览？》</a>。</p>
<h2>常见追问</h2>
<p><strong>为什么 html2canvas 生成的图片和页面不一样？</strong></p>
<blockquote>
<p>因为它是读样式重新画，不是截屏。它不支持的 CSS，比如 <code>box-shadow</code>、<code>filter</code>、<code>object-fit</code>，在图片里就会丢掉或者变样；跨域图片没配 CORS 也会画不出来。遇到这种情况，要么换成它支持的写法，要么改成直接用 Canvas 绘制。</p>
</blockquote>
<p><strong><code>toDataURL</code> 和 <code>toBlob</code> 选哪个？</strong></p>
<blockquote>
<p>两者都能导出图片，被污染的画布上都会抛 <code>SecurityError</code>。区别是 <code>toDataURL</code> 同步返回一个 data URL 字符串，<code>toBlob</code> 通过回调给出 <code>Blob</code>。要上传或者生成 object URL 时，用 <code>toBlob</code> 拿到的 <code>Blob</code> 可以直接用，不用再从字符串转换。</p>
</blockquote>
<p><strong>图片明明配了 CORS，画布还是被污染了，可能是什么原因？</strong></p>
<blockquote>
<p>先检查 <code>crossOrigin</code> 是不是在设置 <code>src</code> 之前就设置了，再看这张图片的响应里有没有 <code>Access-Control-Allow-Origin</code>。如果前端没设置 <code>crossOrigin</code>，浏览器就不会发 CORS 请求，即使服务器配了响应头，这张图片对画布来说仍然是不可读的跨域数据。</p>
</blockquote>`};export{e as default};