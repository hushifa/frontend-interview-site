var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>无限滚动和虚拟列表解决的是两个不同的问题。无限滚动决定什么时候加载更多数据；虚拟列表决定渲染多少 DOM，只画用户看得见的那几条。累计的条目多到 DOM 拖慢滚动时，两者就要一起用。</p>
<p>触发加载，一般在列表末尾放一个空元素当“哨兵”，用 <code>IntersectionObserver</code> 观察它，快滚到它时就加载下一页，<code>rootMargin</code> 可以让它提前触发。这比监听 <code>scroll</code> 事件再自己算位置开销小。加载还要防重入：请求进行中或者已经没有更多数据时不再触发，失败了要给重试入口。</p>
<p>恢复滚动位置有个前提，就是数据得还在。从详情页返回时，先用缓存把已经加载的几页恢复出来，再滚到记录的位置。单页应用往往要把 <code>history.scrollRestoration</code> 设成 <code>&#x27;manual&#x27;</code>，自己控制恢复的时机。</p>
<p>要注意，无限滚动不是万能的。需要页脚、需要按页定位、需要分享具体位置的场景，用分页或“加载更多”按钮更合适。</p>
</blockquote>
<h2>怎样选型</h2>
<table><thead><tr><th>场景</th><th>方案</th></tr></thead><tbody><tr><td>几十到几百条、结构简单</td><td>普通渲染 + 分页或无限滚动</td></tr><tr><td>数据持续追加、条目可能上千</td><td>无限滚动 + 虚拟列表</td></tr><tr><td>需要定位第 N 页、分享链接、访问页脚</td><td>分页或“加载更多”按钮</td></tr></tbody></table>
<p>虚拟列表的原理见<a href="/questions/perf-virtual-list/">《虚拟列表通过什么方式减少渲染成本？》</a>，条目高度不固定时怎样测量、怎样处理滚动锚点，见<a href="/questions/performance-virtual-list/">《动态高度的虚拟列表怎样处理测量、滚动锚点和焦点？》</a>。</p>
<h2>怎样触发加载</h2>
<p>下面这个函数观察哨兵元素，看到它就调用 <code>loadMore</code>：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">observeSentinel</span>(<span class="hljs-params">sentinel, loadMore</span>) {
  <span class="hljs-keyword">let</span> loading = <span class="hljs-literal">false</span>;
  <span class="hljs-keyword">let</span> done = <span class="hljs-literal">false</span>;

  <span class="hljs-keyword">const</span> observer = <span class="hljs-keyword">new</span> <span class="hljs-title class_">IntersectionObserver</span>(
    <span class="hljs-title function_">async</span> ([entry]) =&gt; {
      <span class="hljs-keyword">if</span> (!entry.<span class="hljs-property">isIntersecting</span> || loading || done) <span class="hljs-keyword">return</span>;
      loading = <span class="hljs-literal">true</span>;
      <span class="hljs-keyword">try</span> {
        done = !(<span class="hljs-keyword">await</span> <span class="hljs-title function_">loadMore</span>()); <span class="hljs-comment">// loadMore 返回是否还有下一页</span>
      } <span class="hljs-keyword">finally</span> {
        loading = <span class="hljs-literal">false</span>;
      }
      <span class="hljs-keyword">if</span> (done) observer.<span class="hljs-title function_">disconnect</span>();
    },
    { <span class="hljs-attr">rootMargin</span>: <span class="hljs-string">&#x27;0px 0px 400px 0px&#x27;</span> }, <span class="hljs-comment">// 距底部 400px 时提前加载</span>
  );

  observer.<span class="hljs-title function_">observe</span>(sentinel);
  <span class="hljs-keyword">return</span> <span class="hljs-function">() =&gt;</span> observer.<span class="hljs-title function_">disconnect</span>();
}
</code></pre></div>
<p><code>loading</code> 防止上一页还没回来又发一次请求，<code>done</code> 表示已经没有下一页，这时直接断开观察。<code>rootMargin</code> 的底部设成 400px，相当于把视口往下延长了 400px，哨兵离底部还有 400px 时就开始加载，用户不容易看到空白。</p>
<p>这里有个容易踩的坑。<code>IntersectionObserver</code> 的回调只在元素的交叉状态变化时触发。如果加载的一页数据太少，没能把哨兵推出视口，哨兵就一直处在“可见”状态，状态没变，回调也就不会再触发，列表就卡住不加载了。所以加载完以后，要检查哨兵是否还在可视范围内，必要时接着加载。</p>
<p>如果列表是在某个滚动容器里而不是整个页面滚动，要把 <code>root</code> 设成那个容器。<code>IntersectionObserver</code> 能做什么、不能证明什么，见<a href="/questions/browser-observers/">《IntersectionObserver 适合做什么，能否证明用户看到了内容？》</a>。</p>
<h2>返回列表时怎样恢复滚动位置</h2>
<p>用户从详情页返回，如果列表重新从第一页请求，原来滚到的那条数据根本就不存在，自然没法恢复位置。所以做法是这样的：</p>
<ol>
<li>离开前，把已加载的数据、页码和滚动位置存到状态管理或 <code>sessionStorage</code> 里。如果是虚拟列表，记录第一个可见条目的 ID 和偏移量，比记录像素值更稳定。</li>
<li>返回时，先用缓存渲染出来，再滚到记录的位置，之后按需在后台刷新。</li>
<li><code>history.scrollRestoration</code> 默认是 <code>auto</code>，浏览器可能在异步内容还没渲染出来时就尝试恢复，结果失败。设成 <code>manual</code> 以后，由应用在渲染完成后自己滚动。</li>
</ol>
<p>如果是整页导航，并且命中了 bfcache，也就是浏览器把整个页面原样留在了内存里，那包括滚动位置在内的状态都会完整保留，不用额外处理。</p>
<h2>无障碍和体验要注意什么</h2>
<p>加载中和加载失败都要有看得见的提示。失败时给一个重试按钮，而不是悄悄停下来不加载了。</p>
<p>读屏用户看不到列表变长了，可以用 <code>aria-live</code> 区域播报“已加载 N 条”。</p>
<p>键盘用户要能跳过列表，到达后面的内容。无限滚动会让页脚永远够不着，必要时把页脚的链接放到别的地方。</p>
<h2>常见追问</h2>
<p><strong>为什么不用 <code>scroll</code> 事件？</strong></p>
<blockquote>
<p><code>scroll</code> 触发很频繁，要节流，而且每次都要读取布局信息。<code>IntersectionObserver</code> 由浏览器异步计算交叉状态，开销更小。</p>
</blockquote>
<p><strong>向上加载历史消息时，怎么保持当前看的位置不动？</strong></p>
<blockquote>
<p>插入之前记下 <code>scrollHeight</code>，插入之后把增加的高度加到 <code>scrollTop</code> 上。也可以用 CSS 的滚动锚定。</p>
</blockquote>
<p><strong>新数据插到列表头部，导致后面翻页时出现重复怎么办？</strong></p>
<blockquote>
<p>用游标分页代替页码分页，再按 ID 去重。</p>
</blockquote>`};export{e as default};