var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>同一张设计稿要在宽 375 和宽 414 的手机上都显示得合适，第一步是在 <code>&lt;head&gt;</code> 里写 <code>&lt;meta name=&quot;viewport&quot; content=&quot;width=device-width, initial-scale=1&quot;&gt;</code>。不写的话，手机浏览器会假装自己有一个大约 980 像素宽的屏幕来排版，再整体缩小显示，文字会小得看不清。</p>
<p>有了 viewport，再让尺寸跟着屏幕宽度变。常见做法有两种。一种是 rem 方案，根据屏幕宽度设置 <code>html</code> 的 <code>font-size</code>，元素尺寸都用 rem 写，屏幕变宽字号跟着变大，所有尺寸一起放大。另一种是 vw 方案，<code>1vw</code> 就是视口宽度的 1%，直接按设计稿换算，比如 375 宽的设计稿上 75px 就写成 <code>20vw</code>，现在更推荐这种，不需要 JS 计算。很多页面其实不需要整体等比缩放，用 Flex、Grid 加媒体查询做流式布局，大屏多显示内容，体验反而更好。</p>
<p>1px 边框变粗，要从设备像素比说起。<code>window.devicePixelRatio</code> 表示 1 个 CSS 像素对应几个物理像素，常见手机是 2 或 3。CSS 里写 <code>1px</code>，在 DPR 为 2 的屏幕上实际占 2 个物理像素，比设计稿上那根 1 物理像素的线粗了一倍。常用的解决办法是用伪元素画一个 2 倍大小的边框，再用 <code>transform: scale(0.5)</code> 缩回去；支持的浏览器上也可以直接写 <code>0.5px</code>。</p>
<p>要注意，rem 和 vw 方案都会让字号随屏幕等比放大，大屏手机和平板上文字可能过大，可以用 <code>clamp()</code> 给尺寸设上下限。</p>
</blockquote>
<h2>viewport 到底改变了什么</h2>
<p>没有 viewport meta 时，移动浏览器使用一个比屏幕宽得多的布局视口，大约 980 像素，好让为桌面设计的网页不至于挤成一团，然后再缩小到屏幕宽度显示。所以页面看起来像缩略图，用户要手动放大。</p>
<p><code>width=device-width</code> 让布局视口的宽度等于设备的 CSS 像素宽度，比如 iPhone 上是 375 或 390，<code>initial-scale=1</code> 表示初始不缩放。这样你写的 <code>width: 100%</code>、媒体查询里的 <code>max-width: 600px</code>，对应的就是用户实际看到的屏幕宽度。</p>
<p>不要为了禁止缩放写 <code>user-scalable=no</code> 或 <code>maximum-scale=1</code>，视力不好的用户需要放大页面，这会影响无障碍。</p>
<h2>rem 和 vw 怎么换算</h2>
<p>假设设计稿宽 375px，一个按钮宽 75px。</p>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-comment">/* vw 方案：75 / 375 * 100 = 20 */</span>
<span class="hljs-selector-class">.button</span> { <span class="hljs-attribute">width</span>: <span class="hljs-number">20vw</span>; }

<span class="hljs-comment">/* rem 方案：约定 html 字号 = 屏幕宽度 / 10 */</span>
<span class="hljs-selector-tag">html</span> { <span class="hljs-attribute">font-size</span>: <span class="hljs-number">10vw</span>; }
<span class="hljs-selector-class">.button</span> { <span class="hljs-attribute">width</span>: <span class="hljs-number">2rem</span>; } <span class="hljs-comment">/* 375 宽时 html 是 37.5px，2rem 就是 75px */</span>
</code></pre></div>
<p>两种写法在 375 宽的屏幕上都是 75px，在 414 宽的屏幕上都会等比变大。早年 rem 方案用 JS 读屏幕宽度设置 <code>font-size</code>，比如 lib-flexible，因为当时 vw 支持得不好。现在 vw 已经普遍支持，可以直接用 CSS 实现。换算一般交给构建工具，比如 PostCSS 插件把设计稿上的 px 自动转成 vw 或 rem，代码里照着设计稿写 px 就行。</p>
<h2>1px 细线怎么画</h2>
<p>最通用的做法是伪元素加缩放：</p>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.hairline</span> {
  <span class="hljs-attribute">position</span>: relative;
}
<span class="hljs-selector-class">.hairline</span><span class="hljs-selector-pseudo">::after</span> {
  <span class="hljs-attribute">content</span>: <span class="hljs-string">&#x27;&#x27;</span>;
  <span class="hljs-attribute">position</span>: absolute;
  <span class="hljs-attribute">inset</span>: <span class="hljs-number">0</span>;
  <span class="hljs-attribute">width</span>: <span class="hljs-number">200%</span>;
  <span class="hljs-attribute">height</span>: <span class="hljs-number">200%</span>;
  <span class="hljs-attribute">border</span>: <span class="hljs-number">1px</span> solid <span class="hljs-number">#ddd</span>;
  <span class="hljs-attribute">transform</span>: <span class="hljs-built_in">scale</span>(<span class="hljs-number">0.5</span>);
  <span class="hljs-attribute">transform-origin</span>: <span class="hljs-number">0</span> <span class="hljs-number">0</span>;
  <span class="hljs-attribute">pointer-events</span>: none;
}
</code></pre></div>
<p>为什么要先放大到 200%？伪元素宽高是原来的 2 倍，边框 1px，整体缩小一半后，盒子正好和原元素一样大，边框变成 0.5 个 CSS 像素，在 DPR 为 2 的屏幕上就是 1 个物理像素。DPR 为 3 时，可以用媒体查询 <code>(min-resolution: 3dppx)</code> 改成放大 300%、缩小到三分之一。</p>
<p><code>pointer-events: none</code> 是为了不让这个盖在上面的伪元素挡住点击。只需要一条下边框时，更简单的写法是用一个高度 1px 的伪元素，<code>transform: scaleY(0.5)</code>。</p>
<p>直接写 <code>border: 0.5px</code> 最省事，但结果取决于屏幕。在 Chrome 里实测，DPR 为 2 时计算出的边框宽度是 0.5px，DPR 为 1 时会被取整成 1px，因为一个物理像素已经是能画出的最细线了。不同浏览器的取整规则不完全一样，所以用之前要在目标机型上验证。</p>
<h2>常见追问</h2>
<p><strong>图片在高 DPR 屏幕上发虚怎么办？</strong></p>
<blockquote>
<p>一个 CSS 像素对应多个物理像素，只给 1 倍图就会被拉伸。用 <code>srcset</code> 提供 2 倍、3 倍图，让浏览器按 DPR 选择，图标尽量用 SVG。详见<a href="/questions/html-responsive-images/">《srcset、sizes 和 picture 怎样减少图片浪费？》</a>。</p>
</blockquote>
<p><strong>移动端 100vh 为什么会超出屏幕？</strong></p>
<blockquote>
<p>移动浏览器的地址栏会随滚动收起和展开，<code>100vh</code> 通常按地址栏收起时的最大高度算，地址栏显示时页面底部就被遮住了。可以改用 <code>100dvh</code>，它会跟着地址栏变化。各种视口单位的区别见<a href="/questions/css-units-viewport/">《vw、vh、svh、lvh、dvh 有什么区别？移动端整屏高度怎么写？》</a>。</p>
</blockquote>
<p><strong>刘海屏的内容被挡住怎么办？</strong></p>
<blockquote>
<p>在 viewport 里加 <code>viewport-fit=cover</code>，再用 <code>env(safe-area-inset-*)</code> 给内容留出安全区域，见<a href="/questions/mobile-safe-area/">《移动端安全区域怎样避免内容被刘海和底部手势条遮挡？》</a>。</p>
</blockquote>`};export{e as default};