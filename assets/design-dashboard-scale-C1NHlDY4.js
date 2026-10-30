var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>数据大屏一般有一张 1920×1080 的设计稿，可实际要在 4K 电视、带鱼屏、笔记本上展示。最常用的做法是按设计稿的固定像素开发一个 1920×1080 的画布，再用 <code>transform: scale()</code> 把整个画布缩放到窗口大小，里面的字号、图表、间距一起等比变化。</p>
<p>比例怎么取，是留白和拉伸的取舍。用宽和高两个比例里较小的那个等比缩放，画布能完整放进窗口、不变形，但宽高比不一致时左右或上下会留出空白，一般把画布居中。分别按宽、高缩放可以铺满屏幕，但图形和文字会被压扁或拉长。</p>
<p>另一种思路是 rem 或 vw：把尺寸写成相对视口宽度的单位，布局随宽度连续变化，元素按真实尺寸排版。可是它只跟宽度挂钩，屏幕比例和设计稿不一样时，高度方向容易放不下或空出一截，所以大屏用整体缩放更多。</p>
<p>要注意，窗口或容器尺寸变化时要重新计算比例，可以监听 <code>resize</code>，或者用 <code>ResizeObserver</code> 观察容器。用 rem、vw 这类方案时，容器尺寸真的变了，图表还要按新尺寸重绘。另外 transform 不改变元素在布局里占的位置，鼠标坐标和弹层定位要按缩放后的坐标换算。</p>
</blockquote>
<h2>算出缩放比例和居中偏移</h2>
<p>下面的函数根据窗口大小和设计稿尺寸，算出等比缩放的比例，以及让画布居中需要的偏移。它是纯计算，在 Node 里也能运行。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">getScreenScale</span>(<span class="hljs-params">viewportWidth, viewportHeight, designWidth = <span class="hljs-number">1920</span>, designHeight = <span class="hljs-number">1080</span></span>) {
  <span class="hljs-keyword">const</span> scaleX = viewportWidth / designWidth;
  <span class="hljs-keyword">const</span> scaleY = viewportHeight / designHeight;
  <span class="hljs-comment">// 取较小的比例，保证画布完整放进窗口，多出来的一边留白。</span>
  <span class="hljs-keyword">const</span> scale = <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">min</span>(scaleX, scaleY);
  <span class="hljs-keyword">return</span> {
    scale,
    <span class="hljs-attr">offsetX</span>: (viewportWidth - designWidth * scale) / <span class="hljs-number">2</span>,
    <span class="hljs-attr">offsetY</span>: (viewportHeight - designHeight * scale) / <span class="hljs-number">2</span>,
  };
}

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">getScreenScale</span>(<span class="hljs-number">3840</span>, <span class="hljs-number">2160</span>)); <span class="hljs-comment">// { scale: 2, offsetX: 0, offsetY: 0 }</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">getScreenScale</span>(<span class="hljs-number">1920</span>, <span class="hljs-number">1200</span>)); <span class="hljs-comment">// { scale: 1, offsetX: 0, offsetY: 60 }</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">getScreenScale</span>(<span class="hljs-number">2560</span>, <span class="hljs-number">1080</span>)); <span class="hljs-comment">// { scale: 1, offsetX: 320, offsetY: 0 }</span>
</code></pre></div>
<p>4K 屏和设计稿都是 16:9，放大 2 倍正好铺满。1920×1200 是 16:10，更高一些，按宽度算是 1、按高度算是 1.11，取较小的 1，上下各空 60 像素。2560×1080 是带鱼屏，更宽，按高度算是 1，左右各空 320 像素。</p>
<p>为什么取较小的比例？因为取较大的那个，画布的另一边就会超出窗口被裁掉。取较小的，内容完整可见，代价是留白。</p>
<h2>在页面里应用缩放</h2>
<p>画布写成固定尺寸，用 <code>transform-origin: 0 0</code> 让缩放从左上角开始，再用偏移把它挪到中间：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> screen = <span class="hljs-variable language_">document</span>.<span class="hljs-title function_">querySelector</span>(<span class="hljs-string">&#x27;.screen&#x27;</span>); <span class="hljs-comment">// width: 1920px; height: 1080px</span>

<span class="hljs-keyword">function</span> <span class="hljs-title function_">fit</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">const</span> { scale, offsetX, offsetY } = <span class="hljs-title function_">getScreenScale</span>(<span class="hljs-variable language_">window</span>.<span class="hljs-property">innerWidth</span>, <span class="hljs-variable language_">window</span>.<span class="hljs-property">innerHeight</span>);
  screen.<span class="hljs-property">style</span>.<span class="hljs-property">transformOrigin</span> = <span class="hljs-string">&#x27;0 0&#x27;</span>;
  screen.<span class="hljs-property">style</span>.<span class="hljs-property">transform</span> = <span class="hljs-string">\`translate(<span class="hljs-subst">\${offsetX}</span>px, <span class="hljs-subst">\${offsetY}</span>px) scale(<span class="hljs-subst">\${scale}</span>)\`</span>;
}

<span class="hljs-title function_">fit</span>();
<span class="hljs-variable language_">window</span>.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;resize&#x27;</span>, fit);
</code></pre></div>
<p>为什么要改 <code>transform-origin</code>？因为它默认在元素中心，从中心缩放时，画布左上角的位置会跟着变，偏移就不好算。从左上角缩放，缩放后的左上角仍在原处，再平移 <code>offsetX</code>、<code>offsetY</code> 就居中了。</p>
<p>transform 有一个特点要知道。MDN 写明，CSS transform 改变内容的形状和位置，但不打乱正常的文档流，元素在布局里仍然占着原来 1920×1080 的位置。所以外层容器最好设置 <code>overflow: hidden</code>，避免出现滚动条。另外 transform 不为 <code>none</code> 的元素会成为 <code>position: fixed</code> 后代的包含块，画布里的 fixed 弹层会相对画布定位、跟着一起缩放，不再相对视口。</p>
<h2>留白、拉伸，还是让布局自己伸缩</h2>
<p>等比缩放加留白最常见，留白部分可以填成和大屏一致的背景色，看起来不突兀。如果甲方要求必须铺满，可以分别用 <code>scale(scaleX, scaleY)</code> 拉伸，适合以色块、数字为主、对变形不敏感的页面，地图和圆形图表会明显变形。</p>
<p>还有一种折中：画布按较小比例等比缩放，但把画布的宽或高按窗口比例放大，让里面的 Flex 或 Grid 布局自己把多出来的空间分给各个模块。这样不变形也不留白，代价是各模块的位置要按弹性布局重新设计，不能完全照着设计稿。</p>
<p>rem 和 vw 方案的原理见<a href="/questions/mobile-adaptation/">《移动端怎样做屏幕适配？1px 边框为什么看起来变粗了？》</a>。MDN 定义 <code>1vw</code> 是视口宽度的 1%，<code>rem</code> 是根元素的字号，所以把根字号设成和视口宽度成比例，所有 rem 尺寸就会跟着宽度变。它的问题是高度不受控：在 16:10 或者带鱼屏上，按宽度算出的高度和窗口实际高度对不上。</p>
<h2>为什么要用 ResizeObserver</h2>
<p>大屏不一定占满整个窗口，比如嵌在后台系统的一个区域里，侧边栏收起时容器变宽，窗口却没变，<code>resize</code> 事件不会触发。<code>ResizeObserver</code> 观察的是元素自身的尺寸，容器变了就会回调：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> observer = <span class="hljs-keyword">new</span> <span class="hljs-title class_">ResizeObserver</span>(<span class="hljs-function">(<span class="hljs-params">entries</span>) =&gt;</span> {
  <span class="hljs-keyword">const</span> { inlineSize, blockSize } = entries[<span class="hljs-number">0</span>].<span class="hljs-property">contentBoxSize</span>[<span class="hljs-number">0</span>];
  <span class="hljs-title function_">applyScale</span>(<span class="hljs-title function_">getScreenScale</span>(inlineSize, blockSize));
});
observer.<span class="hljs-title function_">observe</span>(container);
</code></pre></div>
<p>要注意观察的是外层容器，修改的是里面画布的 transform。如果在回调里改被观察元素自己的尺寸，又会触发回调，MDN 说浏览器这时会把通知推迟到下一帧，并在 <code>window</code> 上报出 “ResizeObserver loop completed with undelivered notifications” 错误。页面销毁时要调用 <code>disconnect()</code>。</p>
<h2>常见追问</h2>
<p><strong>图表库在缩放的画布里要注意什么？</strong></p>
<blockquote>
<p>图表库按容器的布局尺寸绘制，transform 不改变布局尺寸，所以画布整体缩放时图表不需要知道比例。可是用 rem、vw 或弹性布局时，容器的布局尺寸真的变了，就要在尺寸变化后调用图表实例的 resize 方法，让它按新尺寸重绘。</p>
</blockquote>
<p><strong>缩放后鼠标点击位置为什么和图表里的坐标对不上？</strong></p>
<blockquote>
<p>因为事件给出的是视口坐标，而画布内部还是按 1920×1080 布局的。要先减去画布的偏移，再除以缩放比例，换算回设计稿坐标。</p>
</blockquote>
<p><strong>窗口拖动时频繁 resize，会不会卡？</strong></p>
<blockquote>
<p>整体缩放时每次只改一个 transform，开销很小。用弹性布局、图表要跟着重绘时，重绘才是耗时的部分，可以把它放进防抖里，等用户停止拖动再执行。</p>
</blockquote>`};export{e as default};