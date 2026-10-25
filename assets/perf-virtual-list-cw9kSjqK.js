var e={answerHtml:`<p>一万条数据不一定很大，但把它们全部变成包含图片、按钮和输入框的 DOM，可能产生大量创建、样式计算、布局和更新成本。虚拟列表保留完整的滚动空间，却只挂载视口附近的一小段行，随滚动替换这段内容。</p>
<p>它优化的是同时参与页面工作的节点数量，不是把一万条数据自动变成只下载几十条。</p>
<h3>固定行高时，可以直接算可见窗口</h3>
<p>设每行高 40 像素，容器高 400 像素，总共一万行。完整占位高度是 400000 像素，但通常只需要渲染十几行。</p>
<p>当 scrollTop 为 800 时，第一条可见行的索引约为 <code>800 / 40 = 20</code>。再根据视口底部计算结束位置，并在上下多渲染几行作为 overscan：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">getWindow</span>(<span class="hljs-params">{ count, rowHeight, scrollTop, viewportHeight, overscan = <span class="hljs-number">2</span> }</span>) {
  <span class="hljs-keyword">if</span> (!<span class="hljs-title class_">Number</span>.<span class="hljs-title function_">isInteger</span>(count) || count &lt; <span class="hljs-number">0</span> || !<span class="hljs-title class_">Number</span>.<span class="hljs-built_in">isFinite</span>(rowHeight) || rowHeight &lt;= <span class="hljs-number">0</span>) {
    <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">RangeError</span>(<span class="hljs-string">&#x27;条目数量或行高无效&#x27;</span>);
  }
  <span class="hljs-keyword">if</span> (!<span class="hljs-title class_">Number</span>.<span class="hljs-built_in">isFinite</span>(scrollTop) || !<span class="hljs-title class_">Number</span>.<span class="hljs-built_in">isFinite</span>(viewportHeight) || viewportHeight &lt; <span class="hljs-number">0</span>) {
    <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">RangeError</span>(<span class="hljs-string">&#x27;滚动位置或视口高度无效&#x27;</span>);
  }
  <span class="hljs-keyword">if</span> (!<span class="hljs-title class_">Number</span>.<span class="hljs-title function_">isInteger</span>(overscan) || overscan &lt; <span class="hljs-number">0</span>) {
    <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">RangeError</span>(<span class="hljs-string">&#x27;预渲染数量无效&#x27;</span>);
  }

  <span class="hljs-keyword">const</span> totalHeight = count * rowHeight;
  <span class="hljs-keyword">const</span> top = <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">min</span>(<span class="hljs-title class_">Math</span>.<span class="hljs-title function_">max</span>(<span class="hljs-number">0</span>, scrollTop), <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">max</span>(<span class="hljs-number">0</span>, totalHeight - viewportHeight));
  <span class="hljs-keyword">const</span> first = <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">floor</span>(top / rowHeight);
  <span class="hljs-keyword">const</span> endVisible = <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">ceil</span>((top + viewportHeight) / rowHeight);
  <span class="hljs-keyword">const</span> start = <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">max</span>(<span class="hljs-number">0</span>, first - overscan);
  <span class="hljs-keyword">const</span> end = <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">min</span>(count, endVisible + overscan);
  <span class="hljs-keyword">return</span> { start, end, <span class="hljs-attr">offset</span>: start * rowHeight, totalHeight };
}

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">getWindow</span>({ <span class="hljs-attr">count</span>: <span class="hljs-number">10000</span>, <span class="hljs-attr">rowHeight</span>: <span class="hljs-number">40</span>, <span class="hljs-attr">scrollTop</span>: <span class="hljs-number">800</span>, <span class="hljs-attr">viewportHeight</span>: <span class="hljs-number">400</span> }));
<span class="hljs-comment">// { start: 18, end: 32, offset: 720, totalHeight: 400000 }</span>
</code></pre></div>
<p>end 是不包含的结束索引，可用于 <code>items.slice(start, end)</code>。外层占位元素保留 totalHeight，窗口内容放在 offset 对应的位置；每行实际占用高度必须与 rowHeight 一致，包括盒模型和间距安排，否则滚动越远误差越大。</p>
<p>示例只计算范围，不是一套包含焦点、滚动事件和 DOM 测量的完整组件。</p>
<h3>overscan 用少量额外工作换滚动余量</h3>
<p>只渲染精确可见范围，用户快速滚动时可能短暂看到空白。上下多渲染一些行，可以在下一次状态更新前提供余量。</p>
<p>但 overscan 太大又会增加 DOM 和渲染工作。复杂行与简单文本行的合适数量可能不同，滚动速度和设备性能也会影响选择。不要为了消除任何极端空白把整个列表都纳入窗口，那会丢掉虚拟化收益。</p>
<h3>数据处理与 DOM 数量是不同瓶颈</h3>
<p>如果每次输入都对一万条数据做复杂过滤，虚拟列表不会自动让这次过滤变快。需要另外优化计算、索引、缓存或服务端查询。</p>
<p>同样，全部数据已下载到数组里，虚拟化不减少那份数据占用。分页或按需请求解决数据获取规模，无限滚动解决继续加载的交互，虚拟化解决已加载条目的 DOM 数量；它们可以组合，但不能互相代替。</p>
<p>content-visibility 可以跳过部分屏幕外渲染工作，但元素通常仍在 DOM 中，与真正卸载窗口外条目的虚拟化也不同。</p>
<h3>行身份必须跟随数据</h3>
<p>滚动、排序或筛选后，相同显示位置可能代表另一个条目。组件 key 应使用稳定的数据 ID，选择状态、编辑草稿等也应按 ID 管理，而不是按当前窗口下标存储。</p>
<p>如果行被卸载后必须保留输入，状态应提升到合适的列表数据层。不能把 DOM 留存当作状态持久化方案，也不能让节点复用把上一行的内容带到下一行。</p>
<p>短列表通常先使用普通渲染；只有真实规模下 DOM 或更新成本成为瓶颈时，再引入虚拟化。收益应通过节点数量、滚动和交互表现验证，同时检查页面查找、打印和键盘访问是否需要补充方案。</p>`};export{e as default};