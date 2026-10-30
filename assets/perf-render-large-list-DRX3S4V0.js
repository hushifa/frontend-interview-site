var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>接口一次返回十万条记录，直接循环 <code>appendChild</code>，页面会白屏好几秒，期间点什么都没反应。原因是 JavaScript 和渲染共用主线程，计算、创建节点再算布局，是一个很长的任务，浏览器在它结束前没法处理输入，也没法绘制。</p>
<p>所以先分清慢在哪一段。数据本身太多，就分页或滚动加载，只取当前要看的部分；排序、过滤这类计算太慢，就放进 Web Worker，在另一个线程里算完再把结果传回来。</p>
<p>如果确实要把所有节点都放进页面，比如要支持浏览器的页内搜索，就用时间分片：每次只插入一小批，插完一批把控制权交还给浏览器，下一帧再插下一批。用户看到列表一点点长出来，而不是卡住不动。要连续滚动浏览全部数据、又不需要页内搜索时，用虚拟列表，只渲染可视区域的几十条。</p>
<p>要注意，时间分片只是把卡顿拆开，十万个节点最终都在页面上，内存和后续布局成本没少。几种办法常常组合使用，选哪个以 Performance 面板实测为准。</p>
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
<h2>先减少要渲染的数据：分页和滚动加载</h2>
<p>十万条数据里，用户真正会看的往往只有前几屏。所以第一步是问清楚需求，能分页就让服务端分页，每次只返回几十条；需要连续浏览时用滚动加载，接近底部再请求下一批。这样下载量、内存和 DOM 数量一起变小，后面的问题大多不会出现。</p>
<h2>计算慢时放进 Worker</h2>
<p>有时卡的不是插入节点，而是插入前的排序、过滤、分组。这类纯计算可以放进 Web Worker，在另一个线程里算完再用 postMessage 把结果传回主线程，主线程在计算期间仍能响应输入。Worker 不能操作 DOM，所以渲染那一步还是在主线程，要和分片或虚拟列表配合，见<a href="/questions/browser-workers/">《Web Worker 可以解决哪些主线程卡顿？》</a>。</p>
<h2>必须连续浏览全部数据时用虚拟列表</h2>
<p>虚拟列表只渲染可视区域附近的几十行，页面上的节点数和数据总量无关，是数据量大又要连续滚动时最常用的办法。它的代价是没挂载的行，浏览器的页内查找、打印和读屏器都碰不到。行高固定时怎样手写，见<a href="/questions/perf-virtual-list/">《定高虚拟列表怎样手写？怎样根据 scrollTop 算出要渲染哪几行？》</a>；高度不固定时的测量、滚动锚点和焦点，见<a href="/questions/performance-virtual-list/">《动态高度的虚拟列表怎样处理测量、滚动锚点和焦点？》</a>。</p>
<h2>几种办法分别解决哪一段</h2>
<p>渲染十万条数据慢，慢的可能是不同的环节，要先分清楚再选办法：</p>
<table><thead><tr><th>慢在哪里</th><th>办法</th></tr></thead><tbody><tr><td>数据量太大，下载慢、占内存</td><td>分页或滚动加载，只取当前要看的部分</td></tr><tr><td>一次插入太多节点，主线程长时间被占住</td><td>虚拟列表；必须全部插入时用时间分片</td></tr><tr><td>每次输入都全量过滤、排序</td><td>优化算法或索引，计算放进 Worker 或交给服务端</td></tr><tr><td>屏幕外内容的布局和绘制</td><td><code>content-visibility: auto</code>，节点仍在 DOM 中</td></tr></tbody></table>
<h2>常见追问</h2>
<p><strong>表格有大量列，横向也很长怎么办？</strong></p>
<blockquote>
<p>可以做二维虚拟化，行和列都只渲染可视的部分。也可以用 <code>content-visibility: auto</code> 让屏幕外的内容跳过渲染，但节点仍在 DOM 里，见<a href="/questions/css-content-visibility/">《content-visibility: auto 与移除 DOM 有什么区别？》</a>。</p>
</blockquote>
<p><strong>分片插入的同时用户在滚动或输入，会不会冲突？</strong></p>
<blockquote>
<p>每批之间浏览器都会处理输入和绘制，所以交互能及时响应。但列表还在变长，滚动条会跟着变化；如果用户在中途筛选，要先取消还没执行的批次，比如记下 <code>requestAnimationFrame</code> 返回的 ID 并调用 <code>cancelAnimationFrame</code>，再按新数据重新开始。</p>
</blockquote>`};export{e as default};