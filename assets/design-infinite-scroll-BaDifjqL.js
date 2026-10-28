var e={answerHtml:`<h2>简答</h2>
<ul>
<li>无限滚动决定何时加载数据，虚拟列表决定渲染多少 DOM；累计条目多到 DOM 数量拖慢滚动时，两者结合使用。</li>
<li>触发加载用 <code>IntersectionObserver</code> 观察列表末尾的哨兵元素，通过 <code>rootMargin</code> 提前触发，比监听 <code>scroll</code> 事件并计算位置开销小。</li>
<li>加载要防重入：请求进行中或已无更多数据时不再触发，并处理加载失败后的重试入口。</li>
<li>恢复滚动位置的前提是数据还在：返回列表时先从缓存恢复已加载页，再滚动到记录的位置；SPA 往往需要 <code>history.scrollRestoration = &#x27;manual&#x27;</code> 自行控制时机。</li>
<li>无限滚动不适合需要页脚、按页定位或分享具体位置的场景，此时分页或&quot;加载更多&quot;按钮更合适。</li>
</ul>
<h2>选型</h2>
<table><thead><tr><th>场景</th><th>方案</th></tr></thead><tbody><tr><td>几十到几百条、结构简单</td><td>普通渲染 + 分页或无限滚动</td></tr><tr><td>数据持续追加、条目可能上千</td><td>无限滚动 + 虚拟列表</td></tr><tr><td>需要定位第 N 页、分享链接、访问页脚</td><td>分页或&quot;加载更多&quot;按钮</td></tr></tbody></table>
<p>虚拟列表的原理见<a href="/questions/perf-virtual-list/">《虚拟列表通过什么方式减少渲染成本？》</a>，条目高度不固定时的测量与锚点问题见<a href="/questions/performance-virtual-list/">《动态高度的虚拟列表怎样处理测量、滚动锚点和焦点？》</a>。</p>
<h2>触发加载</h2>
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
<p>回调在元素交叉状态变化时触发。如果加载的一页数据不足以把哨兵推出视口，交叉状态没有变化，回调不会再次触发；需要在加载完成后检查哨兵是否仍在可视范围内，必要时继续加载。列表在滚动容器内时，把 <code>root</code> 设为该容器。</p>
<p><code>IntersectionObserver</code> 的能力边界见<a href="/questions/browser-observers/">《IntersectionObserver 适合做什么，能否证明用户看到了内容？》</a>。</p>
<h2>恢复滚动位置</h2>
<p>用户从详情页返回时，列表若重新从第一页请求，原位置的数据根本不存在，滚动无从恢复。做法：</p>
<ol>
<li>离开前把已加载数据、页码和滚动位置保存在状态管理或 <code>sessionStorage</code>。虚拟列表记录首个可见条目的 ID 和偏移，比记录像素值更稳定。</li>
<li>返回时先用缓存渲染，再滚动到记录位置，之后按需后台刷新。</li>
<li><code>history.scrollRestoration</code> 默认为 <code>auto</code>，浏览器可能在异步内容渲染前尝试恢复而失败；设为 <code>manual</code> 后由应用在渲染完成后自行滚动。</li>
</ol>
<p>整页导航命中 bfcache 时，页面状态包括滚动位置会完整保留，不需要额外处理。</p>
<h2>无障碍与体验</h2>
<ul>
<li>加载中和加载失败要有可见提示，失败时提供重试按钮，而不是静默停止。</li>
<li>用 <code>aria-live</code> 区域播报&quot;已加载 N 条&quot;，读屏用户才能感知内容变化。</li>
<li>键盘用户需要能跳过列表到达后续内容；无限滚动会让页脚永远够不到，必要时把页脚链接移到其他位置。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li>为什么不用 <code>scroll</code> 事件？需要节流且每次都要读取布局信息，<code>IntersectionObserver</code> 由浏览器异步计算交叉状态。</li>
<li>向上加载历史消息怎么保持位置？插入前记录 <code>scrollHeight</code>，插入后把差值加到 <code>scrollTop</code>，或使用 CSS 滚动锚定。</li>
<li>新数据插入到列表头部导致重复怎么办？用游标而不是页码分页，按 ID 去重。</li>
</ul>`};export{e as default};