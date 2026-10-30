var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>设计稿宽 750，一个按钮宽 200。在小程序里直接写 <code>width: 200rpx</code>，在 375px 宽的手机上它就是 100px，正好占屏幕宽度的 26.7%，换到更宽的手机上也按比例放大。</p>
<p>换算规则是：1rpx 等于页面总宽度的 1/750。页面宽 375px 时，1rpx 就是 0.5px。所以设计稿按 750 宽出图时，标注是多少就写多少 rpx，不用自己算。</p>
<p>它和 H5 的 vw、rem 方案本质上是同一件事，都是让尺寸跟着屏幕宽度等比变化。vw 是页面宽度的 1%，按 750 设计稿换算要除以 7.5；rem 方案要先用脚本或 <code>10vw</code> 这类写法设置 <code>html</code> 的字号。rpx 由小程序框架换算，写起来最省事。</p>
<p>要注意，微信官方文档说 rpx 是出于历史原因支持的，它的换算有时会取整，带来精度问题，现在 vw 已经普遍支持，官方优先推荐 vw。另外考虑到 PC、平板这类大屏设备，官方不建议滥用 vw、rpx 这种按屏幕宽度缩放的单位，避不开时要配合媒体查询等响应式布局手段。</p>
</blockquote>
<h2>rpx 怎样换算</h2>
<p>换算只看页面宽度。下面用两个函数把规则写出来，对比 rpx 和 vw：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">rpxToPx</span>(<span class="hljs-params">rpx, pageWidth</span>) {
  <span class="hljs-keyword">return</span> (rpx * pageWidth) / <span class="hljs-number">750</span>;
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">pxToVw</span>(<span class="hljs-params">px, designWidth</span>) {
  <span class="hljs-keyword">return</span> (px / designWidth) * <span class="hljs-number">100</span>;
}

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">rpxToPx</span>(<span class="hljs-number">1</span>, <span class="hljs-number">375</span>)); <span class="hljs-comment">// 0.5</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">rpxToPx</span>(<span class="hljs-number">200</span>, <span class="hljs-number">375</span>)); <span class="hljs-comment">// 100</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">rpxToPx</span>(<span class="hljs-number">200</span>, <span class="hljs-number">414</span>)); <span class="hljs-comment">// 110.4</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">pxToVw</span>(<span class="hljs-number">150</span>, <span class="hljs-number">750</span>)); <span class="hljs-comment">// 20</span>
</code></pre></div>
<p>前两行是官方文档的例子：375px 宽的页面上，1rpx 是 0.5px，200rpx 就是 100px。第三行换成 414px 宽的手机，200rpx 变成 110.4px，比例没变，只是绝对尺寸跟着屏幕变大。</p>
<p>最后一行是 vw 的换算：750 设计稿上的 150，写成 vw 是 <code>20vw</code>。所以同一个元素，用 rpx 写 <code>150rpx</code>，用 vw 写 <code>20vw</code>，在任何宽度的屏幕上结果都一样。</p>
<h2>和 rem、vw 方案有什么区别</h2>
<p>H5 页面的 rem 和 vw 方案见<a href="/questions/mobile-adaptation/">《移动端怎样做屏幕适配？1px 边框为什么看起来变粗了？》</a>。三者解决的是同一个问题：让设计稿上的尺寸在不同宽度的屏幕上等比缩放。</p>
<p>区别主要在“谁来换算”。rem 方案要先把 <code>html</code> 的 <code>font-size</code> 设成屏幕宽度的某个比例，早年靠 JS 计算，现在可以写 <code>10vw</code>，然后所有尺寸用 rem 写。vw 方案不依赖根字号，直接按视口宽度算，但设计稿上的数值要除以 7.5（750 稿）或 3.75（375 稿），通常交给 PostCSS 插件转换。rpx 则由小程序框架换算，设计稿按 750 宽出图时数值不用改。</p>
<p>所以 rpx 最省事，代价是它只在小程序里有效。跨端框架把代码编译到小程序时也会处理这个单位，见<a href="/questions/mini-cross-compile/">《Taro 和 uni-app 如何把代码转换成小程序？编译时和运行时有什么区别？》</a>。</p>
<h2>为什么官方现在更推荐 vw</h2>
<p>微信开放文档的说法是，WXSS 出于历史原因支持 rpx；rpx 的计算规则有时会对转换后的数值取整，从而带来精度问题。现在 CSS 标准的 <code>vw</code> 已经得到广泛支持，所以优先推荐用 vw。</p>
<p>还有一点更重要：不管是 rpx 还是 vw，都会让元素跟着屏幕宽度一起放大。手机上没问题，可是小程序也会运行在平板和 PC 上，屏幕一宽，字号和按钮就会大得离谱。官方文档因此提醒不要滥用这类按屏幕宽度缩放的单位；必须用时，要配合媒体查询等响应式布局手段，给大屏单独处理。</p>
<h2>常见追问</h2>
<p><strong>细线边框适合用 1rpx 吗？</strong></p>
<blockquote>
<p>要小心。1rpx 换算成的 CSS 像素常常是小数，比如 375 宽时是 0.5px，官方又提到换算有时会取整，所以不同机型上的结果不容易保证一致。需要稳定的细线时，可以直接写 <code>1px</code>，或者用<a href="/questions/mobile-adaptation/">《移动端怎样做屏幕适配？1px 边框为什么看起来变粗了？》</a>里讲的缩放方法。</p>
</blockquote>
<p><strong>字号也应该用 rpx 吗？</strong></p>
<blockquote>
<p>不一定。rpx 会让字号随屏幕宽度变化，大屏上文字会很大。正文字号更适合用固定的 px，或者对缩放单位加上限，再配合媒体查询处理宽屏。</p>
</blockquote>
<p><strong>设计稿是 375 宽怎么办？</strong></p>
<blockquote>
<p>rpx 按页面宽度 750 份换算，375 稿上的数值乘以 2 就是 rpx 值。也可以直接改用 vw，375 稿的数值除以 3.75 就是 vw 值。</p>
</blockquote>`};export{e as default};