var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>控制台里经常能看到一行 <code>ResizeObserver loop completed with undelivered notifications</code>。它的意思是：有些尺寸变化的通知，这一帧没来得及送出去。</p>
<p>ResizeObserver 是在布局算完、绘制之前回调的，告诉你元素的内容框、边框框等尺寸。如果回调里又改了尺寸，浏览器会在同一帧里再检查一遍、再通知。但为了不死循环，后面几轮只处理比上一轮更深层的元素。</p>
<p>剩下处理不了的通知，浏览器留到下一帧，同时在 <code>window</code> 上触发这条错误。</p>
<p>这个错误一般不影响功能，但它说明代码里有“尺寸变了 → 回调改尺寸 → 尺寸又变”的循环，应该消除。办法是只在值真的变了时才写、尽量用 CSS 解决，或者把修改推迟到 <code>requestAnimationFrame</code>。</p>
</blockquote>
<h2>正常的用法</h2>
<p>下面根据卡片宽度切换布局，宽度小于 480 就标记成 <code>small</code>。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> observer = <span class="hljs-keyword">new</span> <span class="hljs-title class_">ResizeObserver</span>(<span class="hljs-function">(<span class="hljs-params">entries</span>) =&gt;</span> {
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> entry <span class="hljs-keyword">of</span> entries) {
    <span class="hljs-keyword">const</span> width = entry.<span class="hljs-property">contentBoxSize</span>[<span class="hljs-number">0</span>].<span class="hljs-property">inlineSize</span>;
    entry.<span class="hljs-property">target</span>.<span class="hljs-property">dataset</span>.<span class="hljs-property">size</span> = width &lt; <span class="hljs-number">480</span> ? <span class="hljs-string">&#x27;small&#x27;</span> : <span class="hljs-string">&#x27;large&#x27;</span>;
  }
});
observer.<span class="hljs-title function_">observe</span>(card);
</code></pre></div>
<p>这里回调只改了 <code>data-size</code> 属性，CSS 根据它调整卡片内部元素的排列，卡片自己的尺寸不变。所以回调执行完，被观察的元素没有新的尺寸变化，就不会循环。</p>
<h2>什么写法会产生循环</h2>
<p>下面想让盒子的高度始终是宽度的一半：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">new</span> <span class="hljs-title class_">ResizeObserver</span>(<span class="hljs-function">(<span class="hljs-params">[entry]</span>) =&gt;</span> {
  entry.<span class="hljs-property">target</span>.<span class="hljs-property">style</span>.<span class="hljs-property">height</span> = <span class="hljs-string">\`<span class="hljs-subst">\${entry.contentRect.width / <span class="hljs-number">2</span>}</span>px\`</span>;
}).<span class="hljs-title function_">observe</span>(box);
</code></pre></div>
<p>回调改了高度，元素尺寸又变了，浏览器就要再通知一次。如果宽度也会受高度影响，比如高度变大后出现了滚动条，挤占了宽度，那宽度一变高度又变，就来回循环，浏览器只好放弃一部分通知并报错。</p>
<h2>怎样消除循环</h2>
<p>第一，只在尺寸真的变了时才更新。比较新旧值，一样就不写，避免重复写入触发新一轮通知。</p>
<p>第二，能用 CSS 就别用 JavaScript。上面“高度是宽度一半”用 <code>aspect-ratio: 2 / 1</code> 就能做；按容器宽度调整样式，可以用容器查询 <code>@container</code>。大部分这类需求都不需要 ResizeObserver。</p>
<p>第三，确实要改尺寸，就放进 <code>requestAnimationFrame</code>，推迟到下一帧再改，打断同一帧内的循环。</p>
<h2>和 window 的 resize 事件有什么区别</h2>
<p><code>window</code> 的 <code>resize</code> 只在视口大小变化时触发。可是侧边栏收起、图片加载完撑开内容，单个元素的尺寸变了，视口并没有变，<code>resize</code> 就不会触发。ResizeObserver 能感知这些单个元素的变化。</p>
<h2>常见追问</h2>
<p><strong>测试里老是出现这条错误，能不能直接屏蔽？</strong></p>
<blockquote>
<p>可以在测试的全局错误处理里按这条消息过滤掉。但不要在生产环境里把所有错误都吞掉，否则真正的错误也看不到了。</p>
</blockquote>
<p><strong>这个错误会让页面出问题吗？</strong></p>
<blockquote>
<p>通常不会，没送出去的通知会推迟到下一帧。但它说明存在尺寸循环，可能导致布局抖动，最好找到回调里改尺寸的地方修掉。</p>
</blockquote>`};export{e as default};