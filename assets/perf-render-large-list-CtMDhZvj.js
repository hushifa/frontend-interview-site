var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>接口一次返回十万条记录，直接循环 <code>appendChild</code>，页面会白屏好几秒，期间点什么都没反应。原因是 JavaScript 和渲染共用主线程，创建、插入十万个节点再算布局，是一个很长的任务，浏览器在它结束前没法处理用户输入，也没法绘制。</p>
<p>先想能不能不渲染那么多。用户一屏只能看几十条，最好的办法是分页或者滚动加载。如果产品要求在一个列表里连续滚动浏览全部数据，就用虚拟列表：只渲染可视区域和上下少量缓冲的条目，滚动时根据位置替换内容，页面上始终只有几十个节点。</p>
<p>如果确实要把所有节点都放进页面，比如要支持浏览器的页内搜索，就用时间分片：每次只插入一小批，比如 100 条，插完一批就把控制权交还给浏览器，在下一帧再插下一批。浏览器在批次之间能响应点击、绘制已插入的内容，用户看到列表一点点长出来，而不是卡住不动。</p>
<p>要注意，时间分片只是把卡顿拆开，十万个节点最终都在页面上，内存和后续的布局成本一点没少，滚动、筛选时仍可能慢。数据量大时，虚拟列表才是根本的解决办法。</p>
</blockquote>
<h2>时间分片怎样写</h2>
<p>下面每帧插入一批，插完再安排下一批：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">renderInChunks</span>(<span class="hljs-params">container, items, chunkSize = <span class="hljs-number">100</span></span>) {
  <span class="hljs-keyword">let</span> index = <span class="hljs-number">0</span>;
  <span class="hljs-keyword">function</span> <span class="hljs-title function_">renderChunk</span>(<span class="hljs-params"></span>) {
    <span class="hljs-keyword">const</span> fragment = <span class="hljs-variable language_">document</span>.<span class="hljs-title function_">createDocumentFragment</span>();
    <span class="hljs-keyword">const</span> end = <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">min</span>(index + chunkSize, items.<span class="hljs-property">length</span>);
    <span class="hljs-keyword">for</span> (; index &lt; end; index++) {
      <span class="hljs-keyword">const</span> li = <span class="hljs-variable language_">document</span>.<span class="hljs-title function_">createElement</span>(<span class="hljs-string">&#x27;li&#x27;</span>);
      li.<span class="hljs-property">textContent</span> = items[index];
      fragment.<span class="hljs-title function_">append</span>(li);
    }
    container.<span class="hljs-title function_">append</span>(fragment);
    <span class="hljs-keyword">if</span> (index &lt; items.<span class="hljs-property">length</span>) <span class="hljs-title function_">requestAnimationFrame</span>(renderChunk);
  }
  <span class="hljs-title function_">requestAnimationFrame</span>(renderChunk);
}
</code></pre></div>
<p>为什么用 <code>requestAnimationFrame</code>？它的回调在浏览器下一次绘制前执行，频率一般和屏幕刷新率一致，每帧插入一批，插完浏览器就能绘制并处理输入。用 <code>setTimeout(renderChunk, 0)</code> 也能把任务拆开。</p>
<p>要注意，<code>requestAnimationFrame</code> 在页面切到后台时会暂停，切回来才继续。如果希望后台也接着插入，就改用 <code>setTimeout</code>。</p>
<p><code>DocumentFragment</code> 的作用是先在内存里组装好一批节点，再一次性放进页面。MDN 也提醒，它的性能收益常被高估，有的引擎里甚至比直接循环插入慢；这里减少卡顿的关键是分批，而不是 Fragment 本身。</p>
<p>每批多少条合适？目标是每批在 50 毫秒以内完成，超过就会成为长任务，影响交互响应。可以用 Performance 面板观察，再调整批量大小，长任务的标准见<a href="/questions/perf-longtasks/">《什么是长任务，为什么会影响交互响应？怎样观测和拆分？》</a>。</p>
<h2>虚拟列表为什么是根本办法</h2>
<p>虚拟列表根据滚动位置算出当前该显示第几条到第几条，只渲染这几十条，用一个撑开的容器保持滚动条高度。无论数据是一千条还是十万条，页面上的节点数基本不变，初始渲染和滚动都很快。行高固定时的手写实现见<a href="/questions/perf-virtual-list/">《定高虚拟列表怎样手写？怎样根据 scrollTop 算出要渲染哪几行？》</a>，高度不固定时见<a href="/questions/performance-virtual-list/">《动态高度的虚拟列表怎样处理测量、滚动锚点和焦点？》</a>。</p>
<p>可是虚拟列表也有代价。没挂载的行，浏览器的页内查找（Ctrl+F）、全选复制、打印和读屏器都碰不到，所以长文档、报表这类需要这些能力的页面，不适合虚拟化。列表只有几百行、滚动不卡时也没必要引入，多大才需要没有固定数字，以 Performance 面板实测的掉帧和交互延迟为准。</p>
<h2>几种办法分别解决哪一段</h2>
<p>渲染十万条数据慢，慢的可能是不同的环节，要先分清楚再选办法：</p>
<table><thead><tr><th>慢在哪里</th><th>办法</th></tr></thead><tbody><tr><td>数据量太大，下载慢、占内存</td><td>分页或滚动加载，只取当前要看的部分</td></tr><tr><td>一次插入太多节点，主线程长时间被占住</td><td>虚拟列表；必须全部插入时用时间分片</td></tr><tr><td>每次输入都全量过滤、排序</td><td>优化算法或索引，计算放进 Worker 或交给服务端</td></tr><tr><td>屏幕外内容的布局和绘制</td><td><code>content-visibility: auto</code>，节点仍在 DOM 中</td></tr></tbody></table>
<h2>常见追问</h2>
<p><strong>数据处理本身也很慢怎么办？</strong></p>
<blockquote>
<p>比如十万条数据要先排序、过滤、格式化，这部分计算可以放进 Web Worker，算完把结果传回主线程渲染，主线程就不会被计算卡住，见<a href="/questions/browser-workers/">《Web Worker 可以解决哪些主线程卡顿？》</a>。</p>
</blockquote>
<p><strong>表格有大量列，横向也很长怎么办？</strong></p>
<blockquote>
<p>可以做二维虚拟化，行和列都只渲染可视的部分。也可以用 <code>content-visibility: auto</code> 让屏幕外的内容跳过渲染，但节点仍在 DOM 里，见<a href="/questions/css-content-visibility/">《content-visibility: auto 与移除 DOM 有什么区别？》</a>。</p>
</blockquote>`};export{e as default};