var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>把一个按钮的宽度从 100px 改成 200px，旁边的元素会被挤开，浏览器要重新算这一片元素的位置和大小，这叫重排（reflow），也就是布局；算完以后再把它们重新画成屏幕上的像素，这叫重绘（repaint）。如果只是把按钮文字从黑色改成红色，位置大小都没变，就只需要重绘。</p>
<p>区别在于成本。重排要算几何信息，可能影响父元素、兄弟元素甚至整页，而且算完通常还要重绘；重绘只涉及颜色、阴影这类外观。MDN 把 CSS 属性分成三档：影响几何或位置的（<code>width</code>、<code>left</code>、<code>margin</code>、<code>font-size</code>）会触发样式计算、布局和重绘；不影响几何的（<code>color</code>）只触发样式计算和重绘；单独成层的 <code>transform</code>、<code>opacity</code> 变化交给合成阶段处理，连重绘都不需要。</p>
<p>触发重排的常见原因有：改尺寸和位置相关的样式，增删会占位置的 DOM 节点，没写宽高的图片加载完成后撑开页面。另外，刚改完样式马上读 <code>offsetHeight</code>、<code>getBoundingClientRect()</code> 这类几何信息，会逼浏览器当场重排。</p>
<p>优化思路是少触发、少影响：动画优先用 <code>transform</code> 和 <code>opacity</code>，图片写好宽高，读写几何信息时先集中读再集中写。</p>
</blockquote>
<h2>浏览器画一帧要做哪几步</h2>
<p>浏览器把页面显示出来，大致要经过样式计算、布局、绘制、合成这几步。MDN 的说法是：布局决定每个节点的尺寸和位置；第一次确定叫布局，之后再算叫重排；绘制把布局算出来的每个盒子转成屏幕上的像素，包括文字、颜色、边框、阴影和图片。页面还可能被拆成多个图层，各自绘制后再组合起来，这一步叫合成。</p>
<p>所以重排和重绘不是两个独立的动作，它们是同一条流水线上的两个阶段。改动从哪一步开始，后面的步骤就要跟着做。从布局开始的改动，后面要重绘、再合成；从绘制开始的，只需要重绘和合成；只影响合成的，前面两步都能跳过。</p>
<h2>哪些改动从哪一步开始</h2>
<p>MDN 在讲动画性能时给了一个按属性分档的说明，这是判断成本最直接的依据：</p>
<table><thead><tr><th>改动的属性</th><th>要做的步骤</th><th>MDN 举的例子</th></tr></thead><tbody><tr><td>影响几何或位置</td><td>样式计算 → 布局 → 重绘</td><td><code>left</code>、<code>max-width</code>、<code>border-width</code>、<code>margin-left</code>、<code>font-size</code></td></tr><tr><td>不影响几何、元素不单独成层</td><td>样式计算 → 重绘</td><td><code>color</code></td></tr><tr><td>元素单独成层</td><td>样式计算，然后在合成阶段处理</td><td><code>transform</code>、<code>opacity</code></td></tr></tbody></table>
<p>第三档有个前提，元素要被放到自己的图层里。MDN 提到，<code>&lt;video&gt;</code>、<code>&lt;canvas&gt;</code>，以及设置了 <code>opacity</code>、3D <code>transform</code>、<code>will-change</code> 等属性的元素会被提升成单独的图层。所以“<code>transform</code> 不触发重绘”是以元素单独成层为前提的说法，不能脱离这个条件。</p>
<p>除了改样式，往页面里插入或删除占位置的节点也会改变其他元素的位置，同样要重新布局。MDN 举过一个具体例子：图片没写宽高，图片下载完成后知道了尺寸，就会发生一次重排，还要接着重绘和合成；写了宽高就不需要这次重排。</p>
<h2>什么时候重排会“提前”发生</h2>
<p>浏览器一般不会每改一次样式就重排一次，而是攒到下一次渲染时一起算。可是如果代码刚改完样式，紧接着就读元素的尺寸或位置，浏览器为了给出准确的值，只能当场把布局算一遍。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js">box.<span class="hljs-property">style</span>.<span class="hljs-property">width</span> = <span class="hljs-string">&#x27;200px&#x27;</span>;
<span class="hljs-keyword">const</span> height = box.<span class="hljs-property">offsetHeight</span>; <span class="hljs-comment">// 这里要拿到新宽度下的高度，浏览器只能立刻重排</span>
</code></pre></div>
<p>在循环里一读一写反复这样做，每一轮都要重排一次，就是布局抖动。哪些属性会引起这种同步布局、怎么改成先读后写，见<a href="/questions/browser-reflow/">《什么是强制同步布局？如何避免布局抖动？》</a>。</p>
<h2>怎样减少重排和重绘</h2>
<p>位移、缩放、淡入淡出这类动画，用 <code>transform</code> 和 <code>opacity</code> 代替 <code>left</code>、<code>top</code>、<code>width</code>，这样有机会只在合成阶段完成，具体对比见<a href="/questions/css-animation-performance/">《transition、animation 和 requestAnimationFrame 怎么选？》</a>。</p>
<p>图片、视频、广告位提前写好宽高或 <code>aspect-ratio</code>，避免资源加载后撑开页面引起重排，也能减少布局偏移。</p>
<p>批量修改 DOM 时先集中读取需要的几何信息，再集中写入，不要读写交替。</p>
<p><code>will-change</code> 能提示浏览器提前建图层，但 MDN 明确说它是解决已有性能问题的最后手段，滥用会占用大量内存，反而更慢。</p>
<h2>常见追问</h2>
<p><strong>display: none 和 visibility: hidden 对重排有什么不同？</strong></p>
<blockquote>
<p>MDN 讲渲染树时提到，<code>display: none</code> 的节点不进入渲染树，不占空间，所以在两者之间切换会影响周围元素的布局，需要重排。<code>visibility: hidden</code> 的节点还在渲染树里，照样占位置，只是不显示，在 <code>visible</code> 和 <code>hidden</code> 之间切换不改变几何，通常只需要重绘。</p>
</blockquote>
<p><strong>重绘一定比重排便宜吗？</strong></p>
<blockquote>
<p>按步骤算，只触发重绘的改动少了布局这一步，所以通常更省。但具体耗时跟要重画的范围有关，不能只靠分档下结论，还是要用浏览器开发者工具的 Performance 面板录一下，看布局和绘制各花了多少时间。</p>
</blockquote>
<p><strong>怎么看页面上哪里在重绘？</strong></p>
<blockquote>
<p>Chrome 开发者工具的 Rendering 面板有 Paint flashing（绘制闪烁）选项，Chrome 文档的说明是开启后每次重绘都会把重绘区域闪成绿色。Performance 面板录制后，能看到每一帧里 Layout 和 Paint 的耗时。</p>
</blockquote>`};export{e as default};