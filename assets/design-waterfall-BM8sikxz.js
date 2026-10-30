var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>图片社区的首页，卡片宽度一样、高度各不相同，一列列往下排，每张新卡片都放进当前最矮的那一列，这就是瀑布流。它的难点在于要知道每张卡片有多高，才能算出放在哪一列、离顶部多远。</p>
<p>用 JavaScript 实现时，维护一个记录每列当前高度的数组，按顺序给每张卡片找最矮的一列，算出 <code>top</code> 和 <code>left</code> 后绝对定位，再把这一列的高度加上卡片高度。图片还没加载时高度未知，所以最好让接口返回图片的宽高，前端按宽高比算出显示高度，不用等图片下载完再排。</p>
<p>懒加载是让屏幕外的图片先不下载，快滚到时再加载。最简单的是给 <code>img</code> 加 <code>loading=&quot;lazy&quot;</code>，浏览器自己决定什么时候开始请求。要自己控制提前多少距离开始加载，或者要在滚到底部时请求下一页，就用 <code>IntersectionObserver</code>，用 <code>rootMargin</code> 把触发范围往外扩一些。</p>
<p>要注意三点。首屏能看到的图片不要懒加载，否则会拖慢最大内容绘制。每张图片都要预留尺寸，否则加载后撑开高度，页面会跳。列数随屏幕宽度变化时要重新排版，数据很多时还要考虑只渲染可视区域附近的卡片。</p>
</blockquote>
<h2>瀑布流怎样计算位置</h2>
<p>下面的函数接收图片原始宽高，按列宽算出显示高度，每张图放进当前最矮的列。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// 每张图片放进当前最矮的一列，返回每张图的位置</span>
<span class="hljs-keyword">function</span> <span class="hljs-title function_">layout</span>(<span class="hljs-params">items, columnCount, columnWidth, gap</span>) {
  <span class="hljs-keyword">const</span> heights = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Array</span>(columnCount).<span class="hljs-title function_">fill</span>(<span class="hljs-number">0</span>);

  <span class="hljs-keyword">return</span> items.<span class="hljs-title function_">map</span>(<span class="hljs-function">(<span class="hljs-params">item</span>) =&gt;</span> {
    <span class="hljs-comment">// 按图片原始宽高比算出它在这一列里的高度</span>
    <span class="hljs-keyword">const</span> height = <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">round</span>((item.<span class="hljs-property">height</span> / item.<span class="hljs-property">width</span>) * columnWidth);
    <span class="hljs-keyword">const</span> column = heights.<span class="hljs-title function_">indexOf</span>(<span class="hljs-title class_">Math</span>.<span class="hljs-title function_">min</span>(...heights));
    <span class="hljs-keyword">const</span> position = { <span class="hljs-attr">id</span>: item.<span class="hljs-property">id</span>, column, <span class="hljs-attr">top</span>: heights[column] };
    heights[column] += height + gap;
    <span class="hljs-keyword">return</span> position;
  });
}

<span class="hljs-keyword">const</span> items = [
  { <span class="hljs-attr">id</span>: <span class="hljs-string">&#x27;a&#x27;</span>, <span class="hljs-attr">width</span>: <span class="hljs-number">300</span>, <span class="hljs-attr">height</span>: <span class="hljs-number">400</span> },
  { <span class="hljs-attr">id</span>: <span class="hljs-string">&#x27;b&#x27;</span>, <span class="hljs-attr">width</span>: <span class="hljs-number">300</span>, <span class="hljs-attr">height</span>: <span class="hljs-number">200</span> },
  { <span class="hljs-attr">id</span>: <span class="hljs-string">&#x27;c&#x27;</span>, <span class="hljs-attr">width</span>: <span class="hljs-number">300</span>, <span class="hljs-attr">height</span>: <span class="hljs-number">300</span> },
  { <span class="hljs-attr">id</span>: <span class="hljs-string">&#x27;d&#x27;</span>, <span class="hljs-attr">width</span>: <span class="hljs-number">300</span>, <span class="hljs-attr">height</span>: <span class="hljs-number">150</span> },
];

<span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> { id, column, top } <span class="hljs-keyword">of</span> <span class="hljs-title function_">layout</span>(items, <span class="hljs-number">2</span>, <span class="hljs-number">150</span>, <span class="hljs-number">10</span>)) {
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">\`<span class="hljs-subst">\${id}</span>: 第 <span class="hljs-subst">\${column}</span> 列, top <span class="hljs-subst">\${top}</span>\`</span>);
}
<span class="hljs-comment">// a: 第 0 列, top 0</span>
<span class="hljs-comment">// b: 第 1 列, top 0</span>
<span class="hljs-comment">// c: 第 1 列, top 110</span>
<span class="hljs-comment">// d: 第 0 列, top 210</span>
</code></pre></div>
<p>列宽 150，图片 <code>a</code> 原始是 300×400，显示高度就是 200。<code>a</code> 放进第 0 列，第 0 列高度变成 210（加上 10 的间距）；<code>b</code> 高 100，放进还是 0 高度的第 1 列，第 1 列变成 110。<code>c</code> 放进较矮的第 1 列，第 1 列变成 270。这时第 0 列是 210，比 270 矮，所以 <code>d</code> 回到第 0 列，<code>top</code> 是 210。</p>
<p><code>left</code> 不用存，就是 <code>column * (columnWidth + gap)</code>。整个容器的高度取所有列里最高的那一列，要设到容器上，否则绝对定位的卡片撑不开父元素。</p>
<p>为什么强调要接口返回宽高？如果不知道高度，只能等图片加载完再测量，图片加载有先有后，排版就会一次次重新计算，卡片在屏幕上跳来跳去。卡片里除了图片还有标题这类文字时，文字高度也要测量，可以先渲染再用 <code>ResizeObserver</code> 监听卡片尺寸变化，变化后重新排它和它之后的卡片。</p>
<h2>列数变化和加载更多</h2>
<p>屏幕变宽时列数从 2 变成 3，所有卡片都要重新算一遍位置。可以用 <code>ResizeObserver</code> 监听容器宽度，算出新的列数和列宽，再整体重排。</p>
<p>加载下一页时不用从头算。只要保存每列当前的高度，新数据接着往下排即可。</p>
<h2>有没有纯 CSS 的写法</h2>
<p>多栏布局 <code>columns: 3</code> 能做出类似的样子，但它是先填满第一列再填第二列，第 2 条数据可能出现在第一列中间，阅读顺序是竖着的，加载更多时已有卡片还会在列之间移动。</p>
<p>原生的瀑布流布局写作 <code>display: grid-lanes</code>，还是实验特性，只能作为增强。几种方案的对比见<a href="/questions/css-masonry/">《CSS Masonry 和传统瀑布流方案应该怎样选择？》</a>。不管用哪种，键盘和读屏都是按 DOM 顺序走的，视觉上相邻的卡片在顺序上不一定相邻。</p>
<h2>图片懒加载怎样做</h2>
<p>最简单的做法是用浏览器原生的懒加载：</p>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">img</span> <span class="hljs-attr">src</span>=<span class="hljs-string">&quot;photo.jpg&quot;</span> <span class="hljs-attr">loading</span>=<span class="hljs-string">&quot;lazy&quot;</span> <span class="hljs-attr">width</span>=<span class="hljs-string">&quot;300&quot;</span> <span class="hljs-attr">height</span>=<span class="hljs-string">&quot;400&quot;</span> <span class="hljs-attr">alt</span>=<span class="hljs-string">&quot;雪山日出&quot;</span> /&gt;</span>
</code></pre></div>
<p>MDN 说明，<code>loading=&quot;lazy&quot;</code> 会把图片推迟到距离视口一段由浏览器决定的距离时再加载。要注意两点。一是宽高一定要写：没加载的图片宽高是 0，可能永远不会和可视区域相交，也就一直不加载；加载后突然撑开还会让页面跳动。二是禁用 JavaScript 时浏览器不会推迟加载，这是防止网站借此追踪用户的滚动位置。</p>
<p>需要自己控制时机，就用 <code>IntersectionObserver</code>：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> observer = <span class="hljs-keyword">new</span> <span class="hljs-title class_">IntersectionObserver</span>(
  <span class="hljs-function">(<span class="hljs-params">entries</span>) =&gt;</span> {
    <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> entry <span class="hljs-keyword">of</span> entries) {
      <span class="hljs-keyword">if</span> (!entry.<span class="hljs-property">isIntersecting</span>) <span class="hljs-keyword">continue</span>;
      <span class="hljs-keyword">const</span> img = entry.<span class="hljs-property">target</span>;
      img.<span class="hljs-property">src</span> = img.<span class="hljs-property">dataset</span>.<span class="hljs-property">src</span>; <span class="hljs-comment">// 真实地址先放在 data-src 上</span>
      observer.<span class="hljs-title function_">unobserve</span>(img);   <span class="hljs-comment">// 加载过的图片不再观察</span>
    }
  },
  { <span class="hljs-attr">rootMargin</span>: <span class="hljs-string">&#x27;300px 0px&#x27;</span> }, <span class="hljs-comment">// 距离视口 300px 时就开始加载</span>
);

<span class="hljs-variable language_">document</span>.<span class="hljs-title function_">querySelectorAll</span>(<span class="hljs-string">&#x27;img[data-src]&#x27;</span>).<span class="hljs-title function_">forEach</span>(<span class="hljs-function">(<span class="hljs-params">img</span>) =&gt;</span> observer.<span class="hljs-title function_">observe</span>(img));
</code></pre></div>
<p><code>rootMargin</code> 把判断范围往外扩，图片还没进屏幕就开始请求，用户滚到时通常已经加载好了。加载过的图片要 <code>unobserve</code>，不然它在可视区域进进出出，回调会反复触发。这种写法在 JavaScript 失败时图片不会显示，所以能用原生懒加载的场景优先用原生的。</p>
<p>列表底部放一个哨兵元素，同样用 <code>IntersectionObserver</code> 观察它，进入视口时请求下一页，这就是瀑布流的无限滚动，见<a href="/questions/design-infinite-scroll/">《无限滚动和虚拟列表怎样选型？怎样触发加载并恢复滚动位置？》</a>。</p>
<h2>首屏的图片为什么不能懒加载</h2>
<p>首屏能看到的图片，懒加载反而会让它更晚开始下载。懒加载的图片要等浏览器判断出它离视口多远才开始请求，比普通图片晚，而首屏最大的那张图往往就是 LCP 元素，延迟它就拖慢了 LCP。所以首屏的图片用默认的 <code>loading=&quot;eager&quot;</code>，懒加载只给屏幕外的图片。更多场景见<a href="/questions/perf-lazy-images/">《懒加载为什么有时反而让首屏和首次交互变慢？》</a>，手写懒加载的完整实现见<a href="/questions/alg-image-lazy-preload/">《怎样手写图片预加载和懒加载？》</a>。</p>
<h2>常见追问</h2>
<p><strong>瀑布流里有上万张图片，页面越来越卡怎么办？</strong></p>
<blockquote>
<p>卡片全部留在 DOM 里，节点越来越多，布局和内存开销都会变大。因为每张卡片的位置都已经算好了，可以只渲染和可视区域重叠的卡片，滚动时根据滚动位置算出要显示哪些，其余的从 DOM 移除，这就是虚拟列表的思路。要注意移除前保存好每张卡片的位置，不要重新测量。</p>
</blockquote>
<p><strong>图片加载失败怎么处理？</strong></p>
<blockquote>
<p>监听 <code>img</code> 的 <code>error</code> 事件，换成占位图或者显示“加载失败，点击重试”。因为位置是按接口返回的宽高算的，加载失败也不会影响整体排版，这又是提前拿到尺寸的一个好处。</p>
</blockquote>`};export{e as default};