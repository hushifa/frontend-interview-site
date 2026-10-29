var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>一个列表有一万行，用户一屏只能看到十几行。虚拟列表的做法是只渲染看得见的这些行，再上下多渲染几行做缓冲，其余的行根本不创建 DOM。</p>
<p>为什么这样能变快？因为创建 DOM、算样式、布局的成本都随行数增长，一万行全渲染就要付一万行的代价，虚拟化以后同时存在的只有几十行。滚动条之所以还正常，是因为外面套了一个和完整列表一样高的占位容器。</p>
<p>行高固定时，计算很简单：第一个可见行是 <code>Math.floor(scrollTop / rowHeight)</code>，总高度是行数乘行高。上下多渲染的几行叫 overscan，能减少快速滚动时的空白，但太多又抵消了收益。</p>
<p>要注意，行的 <code>key</code> 和选中、编辑状态必须跟着数据 ID 走，不能用窗口里的下标。另外页面查找、打印、读屏器都碰不到没挂载的行，短列表没必要虚拟化。</p>
</blockquote>
<h2>怎样算出该渲染哪几行</h2>
<p>下面的函数根据滚动位置算出要渲染的范围：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">getWindow</span>(<span class="hljs-params">{ count, rowHeight, scrollTop, viewportHeight, overscan = <span class="hljs-number">2</span> }</span>) {
  <span class="hljs-keyword">const</span> totalHeight = count * rowHeight;
  <span class="hljs-keyword">const</span> top = <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">min</span>(<span class="hljs-title class_">Math</span>.<span class="hljs-title function_">max</span>(<span class="hljs-number">0</span>, scrollTop), <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">max</span>(<span class="hljs-number">0</span>, totalHeight - viewportHeight));
  <span class="hljs-keyword">const</span> first = <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">floor</span>(top / rowHeight);
  <span class="hljs-keyword">const</span> last = <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">ceil</span>((top + viewportHeight) / rowHeight);
  <span class="hljs-keyword">const</span> start = <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">max</span>(<span class="hljs-number">0</span>, first - overscan);
  <span class="hljs-keyword">const</span> end = <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">min</span>(count, last + overscan);
  <span class="hljs-keyword">return</span> { start, end, <span class="hljs-attr">offset</span>: start * rowHeight, totalHeight };
}

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">getWindow</span>({ <span class="hljs-attr">count</span>: <span class="hljs-number">10000</span>, <span class="hljs-attr">rowHeight</span>: <span class="hljs-number">40</span>, <span class="hljs-attr">scrollTop</span>: <span class="hljs-number">800</span>, <span class="hljs-attr">viewportHeight</span>: <span class="hljs-number">400</span> }));
<span class="hljs-comment">// { start: 18, end: 32, offset: 720, totalHeight: 400000 }</span>
</code></pre></div>
<p>滚动了 800px，行高 40px，所以第一个看得见的是第 20 行；视口 400px，能看到第 20 到 29 行。为什么结果是 18 到 32？因为上下各多渲染了 2 行 overscan。<code>end</code> 不包含在内，实际渲染的是 <code>items.slice(start, end)</code>，也就是第 18 到 31 行。</p>
<p><code>offset</code> 是这批行要往下挪多少，等于 <code>start</code> 乘行高，720px。<code>top</code> 那一行把 <code>scrollTop</code> 限制在合法范围里，防止弹性滚动或者数据变少时算出负数或越界。</p>
<h2>DOM 结构长什么样</h2>
<p>用上面算出的数字，结构是这样的：</p>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">div</span> <span class="hljs-attr">class</span>=<span class="hljs-string">&quot;viewport&quot;</span> <span class="hljs-attr">style</span>=<span class="hljs-string">&quot;height: 400px; overflow: auto&quot;</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">div</span> <span class="hljs-attr">style</span>=<span class="hljs-string">&quot;height: 400000px; position: relative&quot;</span>&gt;</span>
    <span class="hljs-tag">&lt;<span class="hljs-name">div</span> <span class="hljs-attr">style</span>=<span class="hljs-string">&quot;transform: translateY(720px)&quot;</span>&gt;</span>
      <span class="hljs-comment">&lt;!-- 第 18 到 31 行 --&gt;</span>
    <span class="hljs-tag">&lt;/<span class="hljs-name">div</span>&gt;</span>
  <span class="hljs-tag">&lt;/<span class="hljs-name">div</span>&gt;</span>
<span class="hljs-tag">&lt;/<span class="hljs-name">div</span>&gt;</span>
</code></pre></div>
<p>最外层是固定高度、可以滚动的视口。中间那层撑到 400000px，让滚动条的长度和完整列表一样。最里面才是真正渲染的十几行，用 <code>transform</code> 挪到它们本该在的位置。</p>
<p>滚动时只需要更新 <code>start</code> 和 <code>end</code>，而且每帧最多算一次，可以放在 <code>requestAnimationFrame</code> 里处理。</p>
<p>有一点很容易出错：每行的实际高度必须真的等于 <code>rowHeight</code>，边框和外边距也要算进去。差一点点，越往下滚误差越大，最后内容和滚动位置就对不上了。行高不固定的情况见<a href="/questions/performance-virtual-list/">《动态高度的虚拟列表怎样处理测量、滚动锚点和焦点？》</a>。</p>
<h2>为什么 key 不能用下标</h2>
<p>窗口里的第 0 行，滚动之前是数据第 18 行，滚动之后可能是第 25 行。如果用窗口下标当 <code>key</code>，框架会以为还是同一行，只是内容变了，于是把旧行的选中状态、输入框内容留给了新数据。所以 <code>key</code> 和这些状态都要跟着数据 ID。</p>
<h2>它解决不了什么</h2>
<p>虚拟列表只减少渲染的成本。其他环节的问题要用别的办法：</p>
<table><thead><tr><th>问题</th><th>对应方案</th></tr></thead><tbody><tr><td>数据量太大，下载慢、占内存</td><td>分页或按需加载</td></tr><tr><td>每次输入都全量过滤排序很慢</td><td>优化算法、索引、Worker 或服务端查询</td></tr><tr><td>屏幕外内容的渲染成本</td><td><code>content-visibility: auto</code> 也能跳过渲染，但节点仍在 DOM 中</td></tr></tbody></table>
<h2>常见追问</h2>
<p><strong>用现成的库还是自己写？</strong></p>
<blockquote>
<p>生产环境优先用 TanStack Virtual、react-window 这类成熟的库，它们已经处理了测量、滚动到指定项这些细节。</p>
</blockquote>
<p><strong>列表多大才需要虚拟化？</strong></p>
<blockquote>
<p>没有固定数字，以实测为准。DOM 节点多到让滚动掉帧或者交互明显延迟时，再引入。</p>
</blockquote>`};export{e as default};