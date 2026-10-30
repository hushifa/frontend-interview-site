var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>行高固定时，第几行在哪个位置直接乘一下就出来了，原理见<a href="/questions/perf-virtual-list/">《定高虚拟列表怎样手写？怎样根据 scrollTop 算出要渲染哪几行？》</a>。可是聊天记录、评论这种列表，每行高度都不一样，而且不渲染出来就不知道多高。</p>
<p>做法是先猜。没测过的行用一个估计高度算位置，行挂载以后用 <code>ResizeObserver</code> 测出真实高度，存进缓存，再重新算后面各行的位置和总高度。缓存要按数据 ID 存，因为排序、筛选、插入以后下标会变，按下标存就错位了。</p>
<p>测量会带来一个问题：前面的行从估计值变成真实高度，后面的内容就会整体移动，用户看到的内容会跳。解决办法是记一个锚点，也就是视口顶部那一行的 ID 和它离视口顶部的距离，测量完以后把 <code>scrollTop</code> 补回去。</p>
<p>还要注意，正在编辑或者获得焦点的行一旦滚出窗口就会被卸载，焦点和输入内容都会丢。所以要把这些状态提到列表外面，或者暂时保留这一行。</p>
</blockquote>
<h2>怎样根据缓存的高度算位置</h2>
<p>思路是维护一个前缀和数组 <code>offsets</code>：<code>offsets[i]</code> 是第 i 行的顶部位置，等于前面所有行高加起来。下面是计算和查找的代码：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> heights = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Map</span>(); <span class="hljs-comment">// String(id) -&gt; 实测高度；dataset 读出的总是字符串，两边统一成字符串</span>
<span class="hljs-keyword">const</span> <span class="hljs-variable constant_">ESTIMATE</span> = <span class="hljs-number">60</span>;

<span class="hljs-keyword">function</span> <span class="hljs-title function_">layout</span>(<span class="hljs-params">items</span>) {
  <span class="hljs-keyword">const</span> offsets = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Array</span>(items.<span class="hljs-property">length</span> + <span class="hljs-number">1</span>);
  offsets[<span class="hljs-number">0</span>] = <span class="hljs-number">0</span>;
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">let</span> i = <span class="hljs-number">0</span>; i &lt; items.<span class="hljs-property">length</span>; i += <span class="hljs-number">1</span>) {
    offsets[i + <span class="hljs-number">1</span>] = offsets[i] + (heights.<span class="hljs-title function_">get</span>(<span class="hljs-title class_">String</span>(items[i].<span class="hljs-property">id</span>)) ?? <span class="hljs-variable constant_">ESTIMATE</span>);
  }
  <span class="hljs-keyword">return</span> offsets; <span class="hljs-comment">// offsets[i] 是第 i 行的顶部，offsets[length] 是总高度</span>
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">findStart</span>(<span class="hljs-params">offsets, scrollTop</span>) {
  <span class="hljs-keyword">if</span> (offsets.<span class="hljs-property">length</span> &lt; <span class="hljs-number">2</span>) <span class="hljs-keyword">return</span> <span class="hljs-number">0</span>; <span class="hljs-comment">// 空列表</span>
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
<p><code>findStart</code> 用二分查找，找最后一个顶部不超过 <code>scrollTop</code> 的行，它就是视口里第一个可见的行。比如四行里第二行实测是 100px、其余按估计的 60px，<code>offsets</code> 就是 <code>[0, 60, 160, 220, 280]</code>，滚动到 150px 时找到的是下标 1。</p>
<p>为什么键要统一成字符串？因为 <code>dataset.id</code> 读出来永远是字符串。如果存的时候用数字 <code>2</code>，取的时候用字符串 <code>&#x27;2&#x27;</code>，<code>Map</code> 会认为这是两个不同的键，缓存就永远查不到。</p>
<p><code>ResizeObserver</code> 的回调里只写缓存，重新计算放到下一帧统一做，这样多行同时测完也只算一次。</p>
<p>数据量很大时，每次全量重算前缀和的成本会比较高，可以只从变化的那一行往后更新，或者用树状数组。</p>
<h2>怎样让内容不跳</h2>
<p>在高度变化或者插入数据之前，先记下锚点；变化完以后，按锚点把滚动位置补回去：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">captureAnchor</span>(<span class="hljs-params">viewport, offsets, items</span>) {
  <span class="hljs-keyword">const</span> index = <span class="hljs-title function_">findStart</span>(offsets, viewport.<span class="hljs-property">scrollTop</span>);
  <span class="hljs-keyword">return</span> { <span class="hljs-attr">id</span>: items[index].<span class="hljs-property">id</span>, <span class="hljs-attr">delta</span>: viewport.<span class="hljs-property">scrollTop</span> - offsets[index] };
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">restoreAnchor</span>(<span class="hljs-params">viewport, offsets, items, anchor</span>) {
  <span class="hljs-keyword">const</span> index = items.<span class="hljs-title function_">findIndex</span>(<span class="hljs-function">(<span class="hljs-params">item</span>) =&gt;</span> item.<span class="hljs-property">id</span> === anchor.<span class="hljs-property">id</span>);
  <span class="hljs-keyword">if</span> (index &gt;= <span class="hljs-number">0</span>) viewport.<span class="hljs-property">scrollTop</span> = offsets[index] + anchor.<span class="hljs-property">delta</span>;
}
</code></pre></div>
<p><code>delta</code> 是视口顶部比锚点行顶部多滚了多少。恢复时用新的 <code>offsets</code> 找到这一行现在的位置，再加上 <code>delta</code>，用户看到的画面就和之前一样。锚点用 ID 而不是下标，是因为在顶部插入数据以后，同一行的下标就变了。</p>
<p>最典型的场景是聊天记录往上加载历史消息：插入前记录锚点，插入并测量完以后恢复。</p>
<p>浏览器其实有原生的滚动锚定，就是 CSS 的 <code>overflow-anchor</code>。可是虚拟列表通常用绝对定位或者 <code>transform</code> 摆放行，原生锚定一般不起作用，所以要自己补偿，并且给容器设 <code>overflow-anchor: none</code>，避免两者打架。</p>
<p>另外，用户正在拖滚动条时不要强行修正位置，否则滚动条会在手底下乱跳。</p>
<h2>焦点和读屏器怎么处理</h2>
<p>键盘移动到一个还没挂载的行时，要先滚动到目标位置，等这一行渲染出来，再调用 <code>focus()</code>。</p>
<p>给每行设置 <code>aria-setsize</code> 和 <code>aria-posinset</code>，读屏器才知道一共有多少行、当前是第几行。如果用了 <code>aria-activedescendant</code>，它指向的元素必须真实存在于 DOM 里。</p>
<p>编辑中的草稿保存在按 ID 索引的状态里，行卸载再挂载回来时恢复。</p>
<h2>什么时候不该虚拟化</h2>
<p>浏览器的页面查找（Ctrl+F）、全选复制、打印，都只能处理已经挂载的行。长文档、报表需要这些能力时，换别的方案，各方案的取舍见<a href="/questions/perf-render-large-list/">《页面要渲染十万条数据，怎样不卡顿？》</a>。</p>
<h2>常见追问</h2>
<p><strong>图片加载完行高又变了，怎么办？</strong></p>
<blockquote>
<p>给图片设置 <code>width</code>、<code>height</code> 或 <code>aspect-ratio</code>，先把位置留好，测量以后跳动就小了。</p>
</blockquote>
<p><strong>估计高度应该怎么选？</strong></p>
<blockquote>
<p>用已经测过的行的平均高度动态更新估计值。这样总高度更接近真实值，滚动条的跳动也更小。</p>
</blockquote>`};export{e as default};