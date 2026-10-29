var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>打开一个新闻列表，内容还没加载出来，先看到一排排灰色的长条和方块，位置和真实的标题、图片一模一样，过一会儿灰块被真实内容替换。这些灰块就是骨架屏。</p>
<p>它和转圈的 loading 都是在等数据，区别在于告诉用户的信息不同。loading 只说“在加载”，骨架屏还提前展示了页面长什么样，用户会觉得已经快好了。而且占位块的尺寸和真实内容一致，内容出来时页面不会突然往下挤。</p>
<p>实现上，组件在加载状态下渲染一套结构相同的灰色块，加一个从左到右扫过的渐变动画；数据回来后换成真实内容。也可以在构建时为首屏生成静态骨架，直接写进 HTML，让 JS 还没执行时就能显示。</p>
<p>要注意，骨架屏改善的是等待时的感受，不会让数据更快回来。加载很快的接口直接显示内容就好，否则骨架一闪而过反而晃眼。还要给读屏用户一个“正在加载”的提示，并在用户要求减少动画时关掉闪光效果。</p>
</blockquote>
<h2>骨架屏和 loading 怎么选</h2>
<p>转圈的 loading 适合操作类的等待，比如点击“提交”后等结果，用户关心的是“成功了没有”，不需要知道接下来的页面长什么样。</p>
<p>骨架屏适合内容类的页面，比如列表、详情、卡片流。用户在等的是内容本身，提前看到结构能更快找到要看的位置。</p>
<p>两者的另一个差别在布局稳定性。loading 图标通常很小，内容回来时页面从一个小图标变成一整屏内容，下方元素会被突然推开。MDN 对 CLS 的解释是：它衡量页面元素在非用户操作的情况下发生意外移动的程度，并举例说没写宽高的图片在加载完之前，浏览器不知道它要占多少空间。内容异步回来时把已有元素挤开，也是同一类意外移动。骨架屏的占位尺寸和真实内容一致，替换时位置不变，就不会产生这种偏移。前提是占位尺寸真的和内容一致，如果骨架画得比内容矮，照样会跳。</p>
<h2>组件里怎样写一个骨架屏</h2>
<p>下面是一个卡片的骨架。占位块用和真实卡片相同的外层结构和尺寸：</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">function</span> <span class="hljs-title function_">ArticleCard</span>(<span class="hljs-params">{ article }</span>) {
  <span class="hljs-keyword">if</span> (!article) {
    <span class="hljs-keyword">return</span> (
      <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">div</span> <span class="hljs-attr">className</span>=<span class="hljs-string">&quot;card&quot;</span> <span class="hljs-attr">aria-hidden</span>=<span class="hljs-string">&quot;true&quot;</span>&gt;</span>
        <span class="hljs-tag">&lt;<span class="hljs-name">div</span> <span class="hljs-attr">className</span>=<span class="hljs-string">&quot;skeleton&quot;</span> <span class="hljs-attr">style</span>=<span class="hljs-string">{{</span> <span class="hljs-attr">height:</span> <span class="hljs-attr">160</span> }} /&gt;</span>
        <span class="hljs-tag">&lt;<span class="hljs-name">div</span> <span class="hljs-attr">className</span>=<span class="hljs-string">&quot;skeleton&quot;</span> <span class="hljs-attr">style</span>=<span class="hljs-string">{{</span> <span class="hljs-attr">width:</span> &#x27;<span class="hljs-attr">80</span>%&#x27;, <span class="hljs-attr">height:</span> <span class="hljs-attr">20</span>, <span class="hljs-attr">marginTop:</span> <span class="hljs-attr">12</span> }} /&gt;</span>
        <span class="hljs-tag">&lt;<span class="hljs-name">div</span> <span class="hljs-attr">className</span>=<span class="hljs-string">&quot;skeleton&quot;</span> <span class="hljs-attr">style</span>=<span class="hljs-string">{{</span> <span class="hljs-attr">width:</span> &#x27;<span class="hljs-attr">50</span>%&#x27;, <span class="hljs-attr">height:</span> <span class="hljs-attr">16</span>, <span class="hljs-attr">marginTop:</span> <span class="hljs-attr">8</span> }} /&gt;</span>
      <span class="hljs-tag">&lt;/<span class="hljs-name">div</span>&gt;</span></span>
    );
  }
  <span class="hljs-keyword">return</span> (
    <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">article</span> <span class="hljs-attr">className</span>=<span class="hljs-string">&quot;card&quot;</span>&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">img</span> <span class="hljs-attr">src</span>=<span class="hljs-string">{article.cover}</span> <span class="hljs-attr">alt</span>=<span class="hljs-string">&quot;&quot;</span> <span class="hljs-attr">width</span>=<span class="hljs-string">&quot;320&quot;</span> <span class="hljs-attr">height</span>=<span class="hljs-string">&quot;160&quot;</span> /&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">h3</span>&gt;</span>{article.title}<span class="hljs-tag">&lt;/<span class="hljs-name">h3</span>&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">p</span>&gt;</span>{article.author}<span class="hljs-tag">&lt;/<span class="hljs-name">p</span>&gt;</span>
    <span class="hljs-tag">&lt;/<span class="hljs-name">article</span>&gt;</span></span>
  );
}
</code></pre></div>
<p>为什么骨架上加 <code>aria-hidden</code>？因为一堆空的灰块对读屏用户没有意义，读出来只会是噪音。加载状态要在外层容器上告诉他们，下一节讲。</p>
<p>闪光效果用 CSS 渐变加动画实现：</p>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.skeleton</span> {
  <span class="hljs-attribute">border-radius</span>: <span class="hljs-number">4px</span>;
  <span class="hljs-attribute">background</span>: <span class="hljs-built_in">linear-gradient</span>(<span class="hljs-number">90deg</span>, <span class="hljs-number">#eee</span> <span class="hljs-number">25%</span>, <span class="hljs-number">#f5f5f5</span> <span class="hljs-number">37%</span>, <span class="hljs-number">#eee</span> <span class="hljs-number">63%</span>);
  <span class="hljs-attribute">background-size</span>: <span class="hljs-number">400%</span> <span class="hljs-number">100%</span>;
  <span class="hljs-attribute">animation</span>: shimmer <span class="hljs-number">1.4s</span> ease infinite;
}

<span class="hljs-keyword">@keyframes</span> shimmer {
  <span class="hljs-selector-tag">from</span> { <span class="hljs-attribute">background-position</span>: <span class="hljs-number">100%</span> <span class="hljs-number">50%</span>; }
  <span class="hljs-selector-tag">to</span> { <span class="hljs-attribute">background-position</span>: <span class="hljs-number">0</span> <span class="hljs-number">50%</span>; }
}

<span class="hljs-keyword">@media</span> (<span class="hljs-attribute">prefers-reduced-motion</span>: reduce) {
  <span class="hljs-selector-class">.skeleton</span> { <span class="hljs-attribute">animation</span>: none; }
}
</code></pre></div>
<p>MDN 说明 <code>prefers-reduced-motion</code> 用来检测用户是否开启了减少非必要动画的系统设置。闪光是装饰性动画，用户开了这个设置就停掉，只保留灰块。</p>
<h2>读屏用户怎样知道正在加载</h2>
<p>骨架本身隐藏了，就要在列表容器上表达“正在更新”。MDN 介绍 <code>aria-busy=&quot;true&quot;</code> 表示元素正在被修改，辅助技术可以等修改完成再通知用户，加载完成后设为 <code>false</code>。</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx">&lt;section aria-busy={loading} aria-label=<span class="hljs-string">&quot;文章列表&quot;</span>&gt;
  {loading ? <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">SkeletonList</span> /&gt;</span></span> : <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">ArticleList</span> <span class="hljs-attr">items</span>=<span class="hljs-string">{items}</span> /&gt;</span></span>}
&lt;/section&gt;
</code></pre></div>
<p>如果希望读屏明确念出“正在加载”，可以另外放一个视觉上隐藏的状态文本。这里用 <code>aria-busy</code> 只是告诉辅助技术内容还没准备好。</p>
<h2>骨架屏一闪而过怎么办</h2>
<p>接口如果 100 毫秒就回来，骨架刚出现就被替换，用户看到的是一次闪烁，比直接等 100 毫秒更难受。常见的做法是延迟显示：加载开始后等一小段时间（比如 200 到 300 毫秒，数值按产品体验调整），数据还没回来才显示骨架；一旦显示，至少保持一小段时间再替换，避免刚出现就消失。</p>
<p>React 里如果用 Suspense，骨架屏就是 <code>fallback</code>。并排的 Suspense 会各自显示 fallback，想让几块内容一起出现，就把它们包在同一个 Suspense 里，见<a href="/questions/react-error-suspense/">《Error Boundary 和 Suspense 分别处理什么？》</a>。</p>
<h2>首屏骨架怎样在 JS 执行前就显示</h2>
<p>单页应用的首屏，HTML 里只有一个空的 <code>&lt;div id=&quot;root&quot;&gt;</code>，要等 JS 下载执行完才渲染骨架，这段时间仍然是白屏。可以在构建时把首屏骨架的 HTML 和内联样式直接写进 <code>index.html</code> 的根节点里，浏览器解析 HTML 就能画出来，应用挂载后再替换掉。</p>
<p>这样做能让用户更早看到东西。但要清楚它改善的是首次绘制，真正的主要内容（大图、标题）什么时候到，还是取决于数据和资源加载，见<a href="/questions/perf-first-screen/">《首屏加载慢应该怎样优化？》</a>。</p>
<h2>常见追问</h2>
<p><strong>骨架屏要做得和真实页面一模一样吗？</strong></p>
<blockquote>
<p>不用。只要保持大致布局和每块的尺寸，让替换时不跳动就行。做得过细，维护成本高，页面一改骨架就得跟着改。很多团队只为首屏和几个核心列表做骨架，其他地方用简单的 loading。</p>
</blockquote>
<p><strong>白屏检测会把骨架屏当成正常内容吗？</strong></p>
<blockquote>
<p>会有这个问题。骨架屏让根节点有了内容，但用户还没看到真东西。所以白屏检测通常把骨架屏的选择器列入“仍在加载”的名单，发现骨架就过一会儿再查，见<a href="/questions/monitoring-white-screen/">《怎样检测页面白屏？常见方案有哪些误报？》</a>。</p>
</blockquote>
<p><strong>骨架屏能改善 LCP 吗？</strong></p>
<blockquote>
<p>一般不能。骨架屏让页面更早画出东西，但 LCP 量的是最大的那块内容什么时候画出来，真正的大图或标题晚到，LCP 照样晚。</p>
</blockquote>`};export{e as default};