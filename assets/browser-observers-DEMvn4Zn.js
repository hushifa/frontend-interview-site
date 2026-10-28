var e={answerHtml:`<h2>简答</h2>
<ul>
<li>IntersectionObserver 异步通知元素与根区域的几何交叉，省去持续测量的成本。</li>
<li>root、rootMargin 和 threshold 分别控制参照区域、扩展边距和触发比例。</li>
<li>适合预加载和无限列表触发，但要处理重复触发和过期结果。</li>
<li>几何相交不等于用户真正看到、停留或读懂内容，不能直接当作有效曝光。</li>
</ul>
<h2>它解决的是持续测量的成本</h2>
<p>图片接近视口时提前加载、列表滚到底时请求下一页，都需要知道目标是否接近一个区域。传统做法是在 scroll 事件里遍历元素并同步调用 <code>getBoundingClientRect()</code>，元素多时容易增加布局计算和主线程压力。</p>
<p>IntersectionObserver 让浏览器观察目标与根区域的几何关系，异步把变化记录交给回调。它适合触发预加载、观察无限列表哨兵和做粗粒度可见性统计，但它不会持续报告每个像素，也不会判断用户是否真的阅读。</p>
<h2><code>root</code>、<code>rootMargin</code> 和 <code>threshold</code> 是三种不同控制</h2>
<p><code>root</code> 决定参考区域。默认 <code>null</code> 通常表示视口；内部滚动列表则应指定滚动容器。祖先的裁剪和 CSS 布局仍会影响最终交叉结果。</p>
<p><code>rootMargin</code> 扩大或缩小用于判断的根边界。例如 <code>200px 0px</code> 会在目标还没真正进入屏幕时触发，适合提前下载图片，但不能把它当成曝光数据。</p>
<p><code>threshold</code> 是交叉比例跨越的阈值，可以是一个值或数组。比例是交叉面积相对目标边界矩形面积，不是占整个屏幕的比例。目标比根大很多时，可能永远达不到 1；等待文章完整进入小视口并不合理。</p>
<p>调用 <code>observe()</code> 后通常会先收到当前状态的记录，包括元素在屏幕外的情况。回调必须检查 <code>isIntersecting</code> 和实际比例，不能因为回调执行就认为元素已经可见。边界刚好接触时 <code>isIntersecting</code> 也可能为 true，但交叉面积仍是 0。</p>
<h2>用观察器触发一次预加载</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">observeNearViewport</span>(<span class="hljs-params">elements, onNear</span>) {
  <span class="hljs-keyword">const</span> targets = [...elements];
  <span class="hljs-keyword">if</span> (!(<span class="hljs-string">&#x27;IntersectionObserver&#x27;</span> <span class="hljs-keyword">in</span> globalThis)) {
    targets.<span class="hljs-title function_">forEach</span>(onNear);
    <span class="hljs-keyword">return</span> <span class="hljs-function">() =&gt;</span> {};
  }

  <span class="hljs-keyword">const</span> observer = <span class="hljs-keyword">new</span> <span class="hljs-title class_">IntersectionObserver</span>(<span class="hljs-function">(<span class="hljs-params">entries</span>) =&gt;</span> {
    <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> entry <span class="hljs-keyword">of</span> entries) {
      <span class="hljs-keyword">if</span> (!entry.<span class="hljs-property">isIntersecting</span>) <span class="hljs-keyword">continue</span>;
      observer.<span class="hljs-title function_">unobserve</span>(entry.<span class="hljs-property">target</span>);
      <span class="hljs-title function_">onNear</span>(entry.<span class="hljs-property">target</span>);
    }
  }, { <span class="hljs-attr">rootMargin</span>: <span class="hljs-string">&#x27;200px 0px&#x27;</span>, <span class="hljs-attr">threshold</span>: <span class="hljs-number">0</span> });

  targets.<span class="hljs-title function_">forEach</span>(<span class="hljs-function">(<span class="hljs-params">target</span>) =&gt;</span> observer.<span class="hljs-title function_">observe</span>(target));
  <span class="hljs-keyword">return</span> <span class="hljs-function">() =&gt;</span> observer.<span class="hljs-title function_">disconnect</span>();
}
</code></pre></div>
<p>“一次”来自主动 <code>unobserve()</code>，不是 threshold 自带单次语义。组件卸载时要断开观察器；断开不会取消已经启动的 fetch，也不会撤销已经加上的 class，网络任务仍要有自己的 AbortController。</p>
<p>普通图片优先考虑 <code>&lt;img loading=&quot;lazy&quot;&gt;</code>。只有需要提前距离、内部滚动容器或与业务状态协调时，才值得维护自定义观察器。</p>
<h2>无限列表要处理重复触发和过期结果</h2>
<p>末尾哨兵进入区域可以触发下一页请求，但请求未完成时它可能仍在区域内，不能依赖 observer 自动再次回调。应维护 <code>loading</code>、<code>hasMore</code> 和当前筛选条件，防止重复请求；筛选改变后，旧请求返回的数据不能追加到新列表。</p>
<p>如果追加数据后哨兵仍可见，应该由分页状态决定是否继续加载，并设置请求上限或让用户点击“加载更多”。失败时提供重试和错误状态，不要让列表无限空白等待。</p>
<h2>几何可见不是有效曝光</h2>
<p>一个元素可能被固定层遮挡、透明、处于后台标签页，或者只在屏幕边缘闪过。IntersectionObserver 默认也不知道用户是否真的看到了或理解了内容。若业务定义“面积至少 50%，前台停留 1 秒”，需要组合比例、页面可见性、持续计时和去重：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">qualifies</span>(<span class="hljs-params">entry</span>) {
  <span class="hljs-keyword">return</span> <span class="hljs-variable language_">document</span>.<span class="hljs-property">visibilityState</span> === <span class="hljs-string">&#x27;visible&#x27;</span>
    &amp;&amp; entry.<span class="hljs-property">isIntersecting</span>
    &amp;&amp; entry.<span class="hljs-property">intersectionRatio</span> &gt;= <span class="hljs-number">0.5</span>;
}
</code></pre></div>
<p>进入后启动的计时在离开、切后台或组件销毁时必须取消；恢复页面后按业务规则重新计算。<code>trackVisibility</code> 等能力有额外支持和性能边界，不能当作“用户阅读证明”。</p>
<p>观察器回调仍在主线程执行。不要在其中同步解析大 JSON、批量改 DOM 或制造请求风暴。需要逐帧动画、像素级测量或精确滚动进度时，应使用更合适的机制，而不是把异步交叉通知当作滚动时钟。</p>`};export{e as default};