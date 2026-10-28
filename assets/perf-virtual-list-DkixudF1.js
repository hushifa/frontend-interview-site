var e={answerHtml:`<h2>简答</h2>
<ul>
<li>一万行全部渲染，创建 DOM、样式计算和布局的成本都随行数增长；虚拟化后同时存在的只有几十行。</li>
<li>固定行高时，首个可见行 = <code>Math.floor(scrollTop / rowHeight)</code>，总高度 = 行数 × 行高。</li>
<li>overscan 在可见区上下多渲染几行，减少快速滚动时的空白，太大又会抵消收益。</li>
<li>行的 <code>key</code> 和选中、编辑状态必须跟随数据 ID，不能用窗口内的下标。</li>
<li>页面查找、打印、读屏器访问未挂载的行都会受影响，短列表不必虚拟化。</li>
</ul>
<h2>计算可见窗口</h2>
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
<p><code>end</code> 不包含在内，渲染 <code>items.slice(start, end)</code>。</p>
<h2>结构</h2>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">div</span> <span class="hljs-attr">class</span>=<span class="hljs-string">&quot;viewport&quot;</span> <span class="hljs-attr">style</span>=<span class="hljs-string">&quot;height: 400px; overflow: auto&quot;</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">div</span> <span class="hljs-attr">style</span>=<span class="hljs-string">&quot;height: 400000px; position: relative&quot;</span>&gt;</span>
    <span class="hljs-tag">&lt;<span class="hljs-name">div</span> <span class="hljs-attr">style</span>=<span class="hljs-string">&quot;transform: translateY(720px)&quot;</span>&gt;</span>
      <span class="hljs-comment">&lt;!-- 第 18 到 31 行 --&gt;</span>
    <span class="hljs-tag">&lt;/<span class="hljs-name">div</span>&gt;</span>
  <span class="hljs-tag">&lt;/<span class="hljs-name">div</span>&gt;</span>
<span class="hljs-tag">&lt;/<span class="hljs-name">div</span>&gt;</span>
</code></pre></div>
<p>滚动事件里只更新 <code>start</code>、<code>end</code>，每帧最多计算一次（可以在 <code>requestAnimationFrame</code> 里处理）。行高必须真的等于 <code>rowHeight</code>，包括边框和外边距，否则越往下误差越大。行高不固定的情况见<a href="/questions/performance-virtual-list/">《动态高度的虚拟列表怎样处理测量、滚动锚点和焦点？》</a>。</p>
<h2>它不解决什么</h2>
<table><thead><tr><th>问题</th><th>对应方案</th></tr></thead><tbody><tr><td>数据量太大，下载慢、占内存</td><td>分页或按需加载</td></tr><tr><td>每次输入都全量过滤排序很慢</td><td>优化算法、索引、Worker 或服务端查询</td></tr><tr><td>屏幕外内容的渲染成本</td><td><code>content-visibility: auto</code> 也能跳过渲染，但节点仍在 DOM 中</td></tr></tbody></table>
<h2>常见追问</h2>
<ul>
<li>用现成的库还是自己写？生产环境优先用 TanStack Virtual、react-window 这类成熟库，它们处理了测量、滚动到指定项等细节。</li>
<li>列表多大才需要？没有固定数字，以实测为准：DOM 节点数导致滚动掉帧或交互延迟明显时再引入。</li>
</ul>`};export{e as default};