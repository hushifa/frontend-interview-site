var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>比如导航栏有十几个小图标。早期的做法是把它们拼成一张大图，叫雪碧图（CSS Sprite），每个元素用 <code>background-position</code> 只露出其中一块。后来出现了 icon font，把图标做成字体文件；再后来是 SVG Sprite，把每个图标写成 <code>&lt;symbol&gt;</code>，用 <code>&lt;use&gt;</code> 引用。</p>
<p>雪碧图要解决的是请求数。MDN 的说法是，把多张图合成一张发送更省内存和带宽，HTTP 请求也少了。可是它是位图，放大会糊，改一个图标要重新拼图，坐标也可能全变。icon font 解决了缩放和换色，因为图标就是文字，<code>color</code>、<code>font-size</code> 直接生效，但只能单色，而且 CSS 生成的内容不在无障碍树里，部分读屏软件读不出来。</p>
<p>SVG Sprite 是矢量，可以多色，图形里写 <code>currentColor</code> 就能跟随文字颜色，<code>&lt;symbol&gt;</code> 只定义一次，在多处引用。所以现在新项目多用 SVG Sprite，或者在 React、Vue 里把每个 SVG 做成组件按需打包。</p>
<p>要注意，合并文件的前提变了。MDN 在雪碧图的文档里提醒，用 HTTP/2 时，多个小请求可能反而更省带宽，因为 HTTP/2 能在同一个连接上并行请求。另外 <code>&lt;use&gt;</code> 引用外部文件时，浏览器可能拒绝跨域地址，图标文件要和页面同源。</p>
</blockquote>
<h2>雪碧图解决了什么问题</h2>
<p>在 HTTP/1.x 时代，每个图片都是一次单独的请求，十几个小图标就是十几次往返。雪碧图把它们拼成一张图片，元素只设置同一个背景图，再用 <code>background-position</code> 把背景往左、往上移，露出需要的那一块。</p>
<p>下面按“所有图标横排、每个 20px 宽”的布局，算出每个图标的偏移：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// 雪碧图：所有图标排成一行，每个 20px 宽，按下标算出 background-position。</span>
<span class="hljs-keyword">const</span> icons = [<span class="hljs-string">&#x27;home&#x27;</span>, <span class="hljs-string">&#x27;search&#x27;</span>, <span class="hljs-string">&#x27;cart&#x27;</span>, <span class="hljs-string">&#x27;user&#x27;</span>];
<span class="hljs-keyword">const</span> size = <span class="hljs-number">20</span>;

<span class="hljs-keyword">function</span> <span class="hljs-title function_">spritePosition</span>(<span class="hljs-params">name</span>) {
  <span class="hljs-keyword">const</span> index = icons.<span class="hljs-title function_">indexOf</span>(name);
  <span class="hljs-keyword">return</span> <span class="hljs-string">\`<span class="hljs-subst">\${-index * size}</span>px 0px\`</span>;
}
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">spritePosition</span>(<span class="hljs-string">&#x27;home&#x27;</span>)); <span class="hljs-comment">// 0px 0px</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">spritePosition</span>(<span class="hljs-string">&#x27;cart&#x27;</span>)); <span class="hljs-comment">// -40px 0px</span>

<span class="hljs-comment">// 中间插入一个新图标，后面所有图标的坐标都会变。</span>
icons.<span class="hljs-title function_">splice</span>(<span class="hljs-number">1</span>, <span class="hljs-number">0</span>, <span class="hljs-string">&#x27;bell&#x27;</span>);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">spritePosition</span>(<span class="hljs-string">&#x27;cart&#x27;</span>)); <span class="hljs-comment">// -60px 0px</span>

<span class="hljs-comment">// SVG Sprite：每个图标是一个 symbol，用的地方只写 use 引用。</span>
<span class="hljs-keyword">function</span> <span class="hljs-title function_">svgSprite</span>(<span class="hljs-params">map</span>) {
  <span class="hljs-keyword">return</span> <span class="hljs-title class_">Object</span>.<span class="hljs-title function_">entries</span>(map)
    .<span class="hljs-title function_">map</span>(<span class="hljs-function">(<span class="hljs-params">[id, path]</span>) =&gt;</span> <span class="hljs-string">\`&lt;symbol id=&quot;icon-<span class="hljs-subst">\${id}</span>&quot; viewBox=&quot;0 0 24 24&quot;&gt;&lt;path d=&quot;<span class="hljs-subst">\${path}</span>&quot;/&gt;&lt;/symbol&gt;\`</span>)
    .<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;&#x27;</span>);
}
<span class="hljs-keyword">const</span> sprite = <span class="hljs-title function_">svgSprite</span>({ <span class="hljs-attr">close</span>: <span class="hljs-string">&#x27;M6 6l12 12M18 6L6 18&#x27;</span> });
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(sprite.<span class="hljs-title function_">startsWith</span>(<span class="hljs-string">&#x27;&lt;symbol id=&quot;icon-close&quot;&#x27;</span>)); <span class="hljs-comment">// true</span>
</code></pre></div>
<p>为什么偏移是负数？<code>background-position: -40px 0</code> 是把背景图向左移 40px，第 3 个图标正好落进 20px 宽的元素里。MDN 的例子也是这样写的，<code>#btn1</code> 用 <code>-20px 0px</code>，<code>#btn2</code> 用 <code>-40px 0px</code>。</p>
<p>插入一个 <code>bell</code> 以后，<code>cart</code> 的位置从 <code>-40px</code> 变成了 <code>-60px</code>。这就是雪碧图难维护的地方：拼图的顺序一变，所有引用坐标的 CSS 都要跟着改，所以通常要靠构建工具自动生成图片和 CSS。</p>
<p>雪碧图还有一个缺点是位图。高分屏上要准备 2 倍图，可以用 <code>image-set()</code> 给出几种分辨率让浏览器挑，MDN 说明它会根据设备选择最合适的分辨率。可是每多一种分辨率，就要多拼一张图。</p>
<h2>HTTP/2 下还要不要合并</h2>
<p>MDN 在雪碧图文档里专门加了一句提醒：用 HTTP/2 时，多个小请求实际上可能更省带宽。原因在 HTTP/2 的设计上，MDN 介绍 HTTP 演进时说，HTTP/2 是多路复用的协议，可以在同一个连接上并行发出多个请求，去掉了 HTTP/1.x 的限制，还压缩了请求头。</p>
<p>所以合并文件的收益变小了。可是合并也有代价：改一个图标，整张图的缓存都失效，用户要重新下载全部。拆开以后，每个图标单独缓存，页面也只下载它用到的那几个。具体怎么做还是要用实际页面测，HTTP 各版本的差别见<a href="/questions/http-versions/">《HTTP/1.1、HTTP/2 和 HTTP/3 的主要区别是什么？》</a>。</p>
<h2>icon font 带来了什么，又留下了什么问题</h2>
<p>icon font 把每个图标画成字体里的一个字形，用 <code>@font-face</code> 加载字体，再用类名在伪元素上插入对应的字符。因为它是文字，矢量缩放不糊，<code>color</code> 和 <code>font-size</code> 直接控制颜色和大小，一份字体文件就包含整套图标，所以一度很流行。</p>
<p>它的问题也来自“是文字”这一点。一个字形只能填一种颜色，双色图标得叠两个字形。字体下载完成前或下载失败时，图标显示不出来。无障碍上，MDN 在 <code>content</code> 属性的说明里写到，CSS 生成的内容不在 DOM 里，不会出现在无障碍树中，部分读屏软件和浏览器的组合不会读出它。所以表达重要信息的图标，不能只靠伪元素。</p>
<h2>SVG Sprite 为什么成了主流</h2>
<p>SVG Sprite 是把雪碧图“合并成一个文件”的思路换成了矢量。MDN 介绍 <code>&lt;symbol&gt;</code> 时说，它定义图形模板，本身不渲染，只有被 <code>&lt;use&gt;</code> 引用的实例才会显示。<code>&lt;use&gt;</code> 的效果就像把节点深拷贝到一个不对外暴露的 DOM 里，再放到引用的位置。</p>
<p>所以 <code>&lt;symbol&gt;</code> 只写一次，页面里引用一百次，也只有一份图形定义。图标是矢量，任何分辨率都清晰；一个图标里可以有多种颜色；图形里写 <code>fill=&quot;currentColor&quot;</code>，图标就跟着外层的 <code>color</code> 变色。</p>
<p>和雪碧图相比，它不依赖坐标，按 <code>id</code> 引用，新增图标不会影响其他图标。和 icon font 相比，它是真正的图形，可以给 <code>&lt;svg&gt;</code> 加 <code>aria-hidden</code> 或配合 <code>aria-label</code> 处理无障碍，具体写法见<a href="/questions/html-icon-solutions/">《图标方案怎样选？iconfont、SVG Sprite 和图标组件各有什么优缺点？》</a>。</p>
<p>要注意的是外部文件。<code>&lt;use href=&quot;/icons.svg#icon-close&quot;&gt;</code> 能让图标文件被单独缓存，可是 MDN 说明，浏览器可能对 <code>&lt;use&gt;</code> 应用同源策略，拒绝加载跨域地址，目前也没有办法给 <code>&lt;use&gt;</code> 设置跨域策略。图标文件放在其他域名的 CDN 上，就可能加载不出来。</p>
<h2>现在新项目怎样选</h2>
<p>React、Vue 项目里，常见的是把每个 SVG 编译成组件，打包工具只打进实际用到的图标，图标的增删跟着代码走。图标很多、同一个图标在页面里重复很多次时，SVG Sprite 只定义一次，DOM 更省。</p>
<p>单色图标还可以用 CSS 的 <code>mask-image</code>：把 SVG 当成元素的遮罩层，遮住的部分不显示，露出来的部分就是元素的背景色。MDN 标注 <code>mask-image</code> 从 2023 年 12 月起已经在各主流浏览器中可用。</p>
<h2>常见追问</h2>
<p><strong>雪碧图在高分屏上发虚怎么办？</strong></p>
<blockquote>
<p>可以再准备一张 2 倍尺寸的雪碧图，用 <code>image-set()</code> 让浏览器按设备分辨率选择。更彻底的办法是换成 SVG，矢量图在任何分辨率下都清晰。</p>
</blockquote>
<p><strong>SVG Sprite 内联在 HTML 里，还是放成外部文件？</strong></p>
<blockquote>
<p>内联在页面里不需要额外请求，也没有跨域问题，但每个页面都要带上整份 symbol，HTML 无法单独缓存它。放成外部文件能被浏览器缓存，可是要和页面同源，因为 MDN 说明浏览器可能拒绝 <code>&lt;use&gt;</code> 加载跨域地址。</p>
</blockquote>
<p><strong>icon font 是不是应该全部换掉？</strong></p>
<blockquote>
<p>不一定要一次换完。它的主要问题是单色和无障碍。新增图标可以用 SVG，老图标逐步替换；表达重要信息的图标，先按 MDN 的建议把信息放进文档本身，比如补上可见文字或 <code>aria-label</code>。</p>
</blockquote>`};export{e as default};