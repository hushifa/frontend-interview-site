var e={answerHtml:`<h2>简答</h2>
<ul>
<li>固定行高可以直接算出位置（原理见《虚拟列表通过什么方式减少渲染成本？》）；动态高度要维护&quot;每行高度&quot;的缓存和前缀和。</li>
<li>未测量的行用估计高度，挂载后测量真实高度，更新缓存和总高度。</li>
<li>高度缓存按数据 ID 存，排序、筛选、插入后索引会变，按索引存会错位。</li>
<li>前方的行变高或在顶部插入数据时，记录锚点行的 ID 和它离视口顶部的距离，测量完成后补偿 <code>scrollTop</code>，否则内容会跳动。</li>
<li>正在编辑或获得焦点的行离开窗口会被卸载，要把状态提升到列表外，或暂时保留这一行。</li>
</ul>
<h2>测量与定位</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> heights = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Map</span>(); <span class="hljs-comment">// id -&gt; 实测高度</span>
<span class="hljs-keyword">const</span> <span class="hljs-variable constant_">ESTIMATE</span> = <span class="hljs-number">60</span>;

<span class="hljs-keyword">function</span> <span class="hljs-title function_">layout</span>(<span class="hljs-params">items</span>) {
  <span class="hljs-keyword">const</span> offsets = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Array</span>(items.<span class="hljs-property">length</span> + <span class="hljs-number">1</span>);
  offsets[<span class="hljs-number">0</span>] = <span class="hljs-number">0</span>;
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">let</span> i = <span class="hljs-number">0</span>; i &lt; items.<span class="hljs-property">length</span>; i += <span class="hljs-number">1</span>) {
    offsets[i + <span class="hljs-number">1</span>] = offsets[i] + (heights.<span class="hljs-title function_">get</span>(items[i].<span class="hljs-property">id</span>) ?? <span class="hljs-variable constant_">ESTIMATE</span>);
  }
  <span class="hljs-keyword">return</span> offsets; <span class="hljs-comment">// offsets[i] 是第 i 行的顶部，offsets[length] 是总高度</span>
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">findStart</span>(<span class="hljs-params">offsets, scrollTop</span>) {
  <span class="hljs-keyword">let</span> low = <span class="hljs-number">0</span>;
  <span class="hljs-keyword">let</span> high = offsets.<span class="hljs-property">length</span> - <span class="hljs-number">2</span>;
  <span class="hljs-keyword">while</span> (low &lt; high) {
    <span class="hljs-keyword">const</span> mid = (low + high + <span class="hljs-number">1</span>) &gt;&gt; <span class="hljs-number">1</span>;
    <span class="hljs-keyword">if</span> (offsets[mid] &lt;= scrollTop) low = mid;
    <span class="hljs-keyword">else</span> high = mid - <span class="hljs-number">1</span>;
  }
  <span class="hljs-keyword">return</span> low;
}

<span class="hljs-keyword">const</span> observer = <span class="hljs-keyword">new</span> <span class="hljs-title class_">ResizeObserver</span>(<span class="hljs-function">(<span class="hljs-params">entries</span>) =&gt;</span> {
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> entry <span class="hljs-keyword">of</span> entries) {
    <span class="hljs-keyword">const</span> id = entry.<span class="hljs-property">target</span>.<span class="hljs-property">dataset</span>.<span class="hljs-property">id</span>;
    heights.<span class="hljs-title function_">set</span>(id, entry.<span class="hljs-property">borderBoxSize</span>[<span class="hljs-number">0</span>].<span class="hljs-property">blockSize</span>);
  }
  <span class="hljs-title function_">scheduleRelayout</span>(); <span class="hljs-comment">// 在下一帧统一重新计算，避免反复读写布局</span>
});
</code></pre></div>
<p>数据量很大时，每次全量计算前缀和成本较高，可以只从变化的那一行往后更新，或使用树状数组。</p>
<h2>滚动锚点</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">captureAnchor</span>(<span class="hljs-params">viewport, offsets, items</span>) {
  <span class="hljs-keyword">const</span> index = <span class="hljs-title function_">findStart</span>(offsets, viewport.<span class="hljs-property">scrollTop</span>);
  <span class="hljs-keyword">return</span> { <span class="hljs-attr">id</span>: items[index].<span class="hljs-property">id</span>, <span class="hljs-attr">delta</span>: viewport.<span class="hljs-property">scrollTop</span> - offsets[index] };
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">restoreAnchor</span>(<span class="hljs-params">viewport, offsets, items, anchor</span>) {
  <span class="hljs-keyword">const</span> index = items.<span class="hljs-title function_">findIndex</span>(<span class="hljs-function">(<span class="hljs-params">item</span>) =&gt;</span> item.<span class="hljs-property">id</span> === anchor.<span class="hljs-property">id</span>);
  <span class="hljs-keyword">if</span> (index &gt;= <span class="hljs-number">0</span>) viewport.<span class="hljs-property">scrollTop</span> = offsets[index] + anchor.<span class="hljs-property">delta</span>;
}
</code></pre></div>
<ul>
<li>聊天记录向上加载历史消息时，插入前记录锚点，插入并测量后恢复。</li>
<li>浏览器有原生的滚动锚定（CSS <code>overflow-anchor</code>），但虚拟列表通过绝对定位或 <code>transform</code> 摆放行，原生锚定通常不起作用，需要自己补偿，并对容器设置 <code>overflow-anchor: none</code> 避免两者冲突。</li>
<li>用户正在拖动滚动条时不要强行修正位置。</li>
</ul>
<h2>焦点和无障碍</h2>
<ul>
<li>键盘移动到未挂载的行时，先滚动到目标位置，等行渲染后再调用 <code>focus()</code>。</li>
<li>为行设置 <code>aria-setsize</code>、<code>aria-posinset</code>，让读屏器知道总数和当前位置。</li>
<li><code>aria-activedescendant</code> 指向的元素必须真实存在于 DOM 中。</li>
<li>编辑中的草稿保存在按 ID 索引的状态里，行卸载再挂载时恢复。</li>
</ul>
<h2>不适合虚拟化的场景</h2>
<p>浏览器的页面查找（Ctrl+F）、全选复制、打印只能处理已挂载的行。需要这些能力的长文档、报表，用分页、分段渲染或 <code>content-visibility: auto</code> 更合适。</p>
<h2>常见追问</h2>
<ul>
<li>图片加载后行高变化怎么办？给图片设置 <code>width</code>、<code>height</code> 或 <code>aspect-ratio</code> 预留空间，减少测量后的跳动。</li>
<li>估计高度怎么选？用已测量行的平均值动态更新，总高度会更接近真实值，滚动条跳动更小。</li>
</ul>`};export{e as default};