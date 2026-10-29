var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>白屏就是页面打开以后什么都没显示出来。浏览器没有“白屏了”这种原生事件，所以只能在约定的时间点自己判断，属于经验性的检测。</p>
<p>常用两种办法。一种是看根节点，比如 <code>#app</code> 里面是不是空的。另一种是在视口里取一些点，用 <code>document.elementFromPoint(x, y)</code> 看每个点上最上层的是什么元素，如果全是 <code>html</code>、<code>body</code>、<code>#app</code> 这类容器，就说明这些地方什么都没画出来。</p>
<p>只知道白了还不够，还得知道为什么白。所以判定白屏时，要把同一会话里的 JS 错误、资源加载失败和接口异常一起带上。</p>
<p>要注意误报。骨架屏、加载中、后台标签页、慢网络，还有合法的空列表，都可能被当成白屏，需要白名单、隔一会儿再查一次，以及跳过不可见的页面。</p>
</blockquote>
<h2>最简单的办法：看根节点</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">rootIsEmpty</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">const</span> root = <span class="hljs-variable language_">document</span>.<span class="hljs-title function_">getElementById</span>(<span class="hljs-string">&#x27;app&#x27;</span>);
  <span class="hljs-keyword">return</span> !root || root.<span class="hljs-property">childElementCount</span> === <span class="hljs-number">0</span>;
}
</code></pre></div>
<p>SPA 渲染失败时，根节点通常还是空的，所以这是成本最低的信号。</p>
<p>可是它有盲区。如果应用渲染出了一个空壳布局，或者一个全屏的错误遮罩，根节点里就有子元素了，检查会通过，用户看到的却还是一片空白。</p>
<h2>更准的办法：在视口里采样</h2>
<p>下面在视口的横向中线和纵向中线上各取 9 个点，中心点只取一次，一共 17 个点，看每个点上最上层的元素：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> <span class="hljs-variable constant_">CONTAINERS</span> = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Set</span>([<span class="hljs-string">&#x27;HTML&#x27;</span>, <span class="hljs-string">&#x27;BODY&#x27;</span>]);

<span class="hljs-keyword">function</span> <span class="hljs-title function_">isBlankScreen</span>(<span class="hljs-params">rootId = <span class="hljs-string">&#x27;app&#x27;</span></span>) {
  <span class="hljs-keyword">const</span> w = <span class="hljs-variable language_">window</span>.<span class="hljs-property">innerWidth</span>;
  <span class="hljs-keyword">const</span> h = <span class="hljs-variable language_">window</span>.<span class="hljs-property">innerHeight</span>;
  <span class="hljs-keyword">const</span> points = [];
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">let</span> i = <span class="hljs-number">1</span>; i &lt;= <span class="hljs-number">9</span>; i += <span class="hljs-number">1</span>) {
    points.<span class="hljs-title function_">push</span>([(w * i) / <span class="hljs-number">10</span>, h / <span class="hljs-number">2</span>]); <span class="hljs-comment">// 横向中线</span>
    <span class="hljs-keyword">if</span> (i !== <span class="hljs-number">5</span>) points.<span class="hljs-title function_">push</span>([w / <span class="hljs-number">2</span>, (h * i) / <span class="hljs-number">10</span>]); <span class="hljs-comment">// 纵向中线，跳过已采样的中心点</span>
  }
  <span class="hljs-keyword">const</span> emptyCount = points.<span class="hljs-title function_">filter</span>(<span class="hljs-function">(<span class="hljs-params">[x, y]</span>) =&gt;</span> {
    <span class="hljs-keyword">const</span> top = <span class="hljs-variable language_">document</span>.<span class="hljs-title function_">elementFromPoint</span>(x, y);
    <span class="hljs-keyword">return</span> !top || <span class="hljs-variable constant_">CONTAINERS</span>.<span class="hljs-title function_">has</span>(top.<span class="hljs-property">tagName</span>) || top.<span class="hljs-property">id</span> === rootId;
  }).<span class="hljs-property">length</span>;
  <span class="hljs-keyword">return</span> emptyCount === points.<span class="hljs-property">length</span>;
}
</code></pre></div>
<p>这里要求所有采样点都落在容器上才算白屏，阈值也可以按业务放宽，比如 90%。</p>
<p>这个方法也有局限。它只看命中的是什么元素，不看实际画出来的像素。所以一个透明或者纯白背景的大块元素会被当成“有内容”。反过来，设了 <code>pointer-events: none</code> 或 <code>visibility: hidden</code> 的元素不会被命中，采样会穿过它们落到下面一层。</p>
<h2>什么时候检查</h2>
<p>太早检查，页面还没渲染完，就会误报。所以一般在 <code>load</code> 之后再延迟几秒，留出接口和渲染的时间。</p>
<p>第一次判定为空白时，先别急着报，隔一段时间再查一两次，连续都是空白才上报，这样能过滤掉慢网络。</p>
<p><code>document.visibilityState === &#x27;hidden&#x27;</code> 时要跳过，因为后台标签页的渲染可能被浏览器推迟。</p>
<p>除了首次加载，路由切换之后也可以检查。SPA 的白屏经常发生在懒加载的分包加载失败时。</p>
<h2>怎样找到白屏的原因</h2>
<p>白屏上报要带上下文，否则只能知道“白了”。最近的 JS 错误和未处理的 Promise 拒绝最有用，采集方式见<a href="/questions/monitoring-error-capture/">《前端怎样全局捕获 JS 错误、Promise 拒绝和资源加载失败？》</a>。脚本或 CSS 加载失败也要带上，特别是 CDN 上的入口文件和懒加载分包。另外还有关键接口的状态码和耗时，以及页面 URL、发布版本、浏览器版本。</p>
<p>常见的根因有这几种：入口脚本因为 CDN 故障或者缓存了旧 HTML 而 404；首屏渲染抛错，又没有错误边界兜底；浏览器不支持产物里用到的语法。</p>
<h2>误报从哪里来，怎么处理</h2>
<p>骨架屏和 loading 占位是最常见的。可以把骨架屏的选择器加进“仍在加载”的白名单，检查时发现它，就过一会儿再查。</p>
<p>合法的空状态也会误报，比如搜索没结果、购物车是空的，页面本来就几乎是空白。这类页面应该渲染一个明确的空状态元素，让检测知道这是正常的。</p>
<p>全屏的 Canvas、视频或者 iframe 也要注意。采样点命中的就是这些元素本身，它们里面到底画没画东西，检测看不出来，需要按业务另外确认。</p>
<p>还有用户很快就离开了的情况。页面还没渲染完用户就切走了，所以检查前先确认页面仍然可见。</p>
<h2>常见追问</h2>
<p><strong>能用截图比较像素吗？</strong></p>
<blockquote>
<p>可以在合成监控或者测试环境里做。线上在用户端截图成本高，还涉及隐私，一般不用。</p>
</blockquote>
<p><strong>白屏率怎么算？</strong></p>
<blockquote>
<p>用检测到白屏的页面访问数，除以完成了检查的访问数。被跳过的后台访问不算进分母。</p>
</blockquote>
<p><strong>有了错误边界，还需要白屏检测吗？</strong></p>
<blockquote>
<p>需要。资源加载失败、入口脚本根本没执行的时候，错误边界自己都没运行起来，兜不住。</p>
</blockquote>`};export{e as default};