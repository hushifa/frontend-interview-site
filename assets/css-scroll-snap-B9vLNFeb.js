var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>吸附滚动就是用户滑动一个列表或轮播图，松手后内容不会停在两张卡片中间，而是自动对齐到某一张卡片。以前要监听滚动事件再用 JS 计算位置，现在用 CSS Scroll Snap 几行样式就能做到。</p>
<p>它需要两边配合。滚动容器上写 <code>scroll-snap-type</code>，比如 <code>x mandatory</code>，规定沿哪个方向吸附、吸附得多严格；子元素上写 <code>scroll-snap-align</code>，比如 <code>start</code> 或 <code>center</code>，规定哪个位置对齐到容器。</p>
<p>常用的还有三个属性。容器上的 <code>scroll-padding</code> 给吸顶的头部留出空间，子元素上的 <code>scroll-margin</code> 单独调整某一项的间距，<code>scroll-snap-stop: always</code> 让快速滑动时不能跳过这一项。</p>
<p>要注意，<code>mandatory</code> 会强制停在吸附点上。如果某个子元素比容器还高，它超出的部分就可能永远滚不到，这种情况要用 <code>proximity</code>。</p>
</blockquote>
<h2>一个横向卡片列表</h2>
<p>下面做一个横向滑动的卡片列表，松手后总有一张卡片对齐到左边缘：</p>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.cards</span> {
  <span class="hljs-attribute">display</span>: flex;
  <span class="hljs-attribute">gap</span>: <span class="hljs-number">16px</span>;
  <span class="hljs-attribute">overflow-x</span>: auto;
  <span class="hljs-attribute">scroll-snap-type</span>: x mandatory;
  <span class="hljs-attribute">scroll-padding-inline</span>: <span class="hljs-number">16px</span>;
}

<span class="hljs-selector-class">.cards</span> &gt; <span class="hljs-selector-class">.card</span> {
  <span class="hljs-attribute">flex</span>: <span class="hljs-number">0</span> <span class="hljs-number">0</span> <span class="hljs-number">80%</span>;
  <span class="hljs-attribute">scroll-snap-align</span>: start;
}
</code></pre></div>
<p>容器首先得能滚动，所以要有 <code>overflow-x: auto</code>，内容也要比容器宽。没有溢出，就没有滚动，吸附也无从谈起。</p>
<p><code>scroll-snap-type: x mandatory</code> 里的 <code>x</code> 是方向，也可以写 <code>y</code>、<code>block</code>、<code>inline</code> 或 <code>both</code>。<code>mandatory</code> 表示滚动停下时一定要落在某个吸附点上；换成 <code>proximity</code>，只有停在离吸附点足够近的地方才会吸过去，多近算近由浏览器决定。</p>
<p>子元素的 <code>scroll-snap-align: start</code> 表示卡片的起始边和容器的起始边对齐。轮播图常用 <code>center</code>，让当前卡片居中。这个属性默认是 <code>none</code>，没写的子元素不会成为吸附点。</p>
<p><code>scroll-padding-inline: 16px</code> 把容器的吸附区域往里缩了 16px，所以卡片不会紧贴边缘，左边留出一点空隙。</p>
<h2>页面有吸顶头部时怎样不被挡住</h2>
<p>纵向整屏翻页时经常有一个 <code>position: sticky</code> 的头部。如果直接吸附到 <code>start</code>，每一节的标题都会被头部盖住。这时在容器上加 <code>scroll-padding</code>：</p>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.scroller</span> {
  <span class="hljs-attribute">height</span>: <span class="hljs-number">300px</span>;
  <span class="hljs-attribute">overflow-y</span>: scroll;
  <span class="hljs-attribute">scroll-snap-type</span>: y mandatory;
  <span class="hljs-attribute">scroll-padding-top</span>: <span class="hljs-number">50px</span>;
}

<span class="hljs-selector-class">.scroller</span> <span class="hljs-selector-tag">section</span> {
  <span class="hljs-attribute">min-height</span>: <span class="hljs-number">100%</span>;
  <span class="hljs-attribute">scroll-snap-align</span>: start;
}
</code></pre></div>
<p><code>scroll-padding-top: 50px</code> 让吸附位置整体往下让出 50px，头部占住的那一块就不算在对齐区域里。如果只有个别小节需要额外间距，就在那个子元素上写 <code>scroll-margin</code>，它和容器的 <code>scroll-padding</code> 可以叠加。</p>
<h2>怎样防止快速滑动跳过内容</h2>
<p>用户用力一划，可能一下滑过好几张卡片。如果每一张都必须看到，比如新手引导，可以在子元素上写：</p>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.step</span> {
  <span class="hljs-attribute">scroll-snap-stop</span>: always;
}
</code></pre></div>
<p>默认值是 <code>normal</code>，允许跳过。<code>always</code> 让滚动在这个吸附点必须停一下。代价是用户没办法快速跳到想看的内容，所以普通列表不要随手加。</p>
<h2>mandatory 的坑</h2>
<p>MDN 特别提醒：子元素的内容会溢出容器时，不要用 <code>mandatory</code>。因为浏览器总要把滚动位置拉回吸附点，子元素超出的那部分用户可能滚不过去。</p>
<p>另外，在 <code>mandatory</code> 的容器里，如果某个子元素没有设置 <code>scroll-snap-align</code>，用户也没办法把它滚动到视图里。所以要么每个子元素都设置对齐方式，要么改用 <code>proximity</code>。</p>
<h2>常见追问</h2>
<p><strong>怎样知道当前吸附到了哪一张，用来更新指示点？</strong></p>
<blockquote>
<p>Chrome 129 起提供了 <code>scrollsnapchange</code> 和 <code>scrollsnapchanging</code> 事件，事件对象上的 <code>snapTargetInline</code>、<code>snapTargetBlock</code> 就是吸附到的元素。Firefox 和 Safari 目前还不支持，所以只能当作渐进增强，不支持时可以用 IntersectionObserver 判断哪张卡片在可见区域。</p>
</blockquote>
<p><strong>吸附滚动能和滚动动画一起用吗？</strong></p>
<blockquote>
<p>能。吸附只决定滚动最后停在哪里，滚动过程中的视觉效果可以用滚动驱动动画来做，见<a href="/questions/css-scroll-driven-animation/">《CSS 滚动驱动动画适合什么场景？》</a>。</p>
</blockquote>`};export{e as default};