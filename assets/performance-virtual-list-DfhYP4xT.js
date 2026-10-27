var e={answerHtml:`<h2>虚拟化真正解决的是什么</h2>
<p>渲染一万行表格时，慢的不只是第一次创建 DOM。每一行都可能有图片、事件监听、布局计算和组件状态，滚动过程中浏览器还要维护这些节点。虚拟列表把数据和 DOM 分开：数据仍然有一万条，但只渲染视口附近的一小段。</p>
<p>为了让滚动条看起来仍然代表完整列表，虚拟列表会保留一个具有总高度的容器，再把当前窗口的行放在对应偏移处。用户看到的是几十个节点，滚动范围仍然像一万行。</p>
<h2>固定高度时可以直接计算窗口</h2>
<p>如果每行高度都固定，滚动位置到索引的计算比较简单：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">getWindow</span>(<span class="hljs-params">{ scrollTop, viewportHeight, rowHeight, total, overscan = <span class="hljs-number">4</span> }</span>) {
  <span class="hljs-keyword">const</span> first = <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">floor</span>(scrollTop / rowHeight);
  <span class="hljs-keyword">const</span> start = <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">max</span>(<span class="hljs-number">0</span>, first - overscan);
  <span class="hljs-keyword">const</span> count = <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">ceil</span>(viewportHeight / rowHeight);
  <span class="hljs-keyword">const</span> end = <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">min</span>(total, first + count + overscan);

  <span class="hljs-keyword">return</span> {
    start,
    end,
    <span class="hljs-attr">offsetTop</span>: start * rowHeight,
    <span class="hljs-attr">totalHeight</span>: total * rowHeight,
  };
}
</code></pre></div>
<p>渲染 <code>[start, end)</code> 的行，并把它们放在 <code>offsetTop</code> 位置。<code>overscan</code> 是视口外的缓冲区：太小会在快速滚动时出现空白，太大则增加渲染工作。它应根据设备性能、行复杂度和滚动速度调整。</p>
<p>真实代码还要节流滚动事件、处理容器尺寸变化，并在数据减少时把 <code>scrollTop</code> 限制在新的最大值内。只减少 DOM 数量，不处理这些边界，仍会出现跳动和错位。</p>
<h2>动态高度会改变后续所有位置</h2>
<p>行里有换行文本、图片或可展开答案时，不能再用 <code>index * rowHeight</code>。虚拟器通常先用估计高度计算位置，行挂载后通过 ResizeObserver 测量真实高度，再更新高度缓存和总高度。</p>
<p>如果第二行从 60px 变成 120px，第三行以及后面所有行的起点都会下移 60px。测量结果应批量处理，避免在一次滚动回调里不断读取和写入布局。图片应提前预留尺寸，字体加载和内容展开则要使对应缓存失效。</p>
<p>高度缓存要使用稳定数据 ID，而不是只按索引保存。排序、筛选和插入数据后，索引对应的对象已经变了，继续使用旧高度会造成错误位置。</p>
<h2>滚动锚点决定用户会不会迷路</h2>
<p>聊天记录向顶部插入历史消息时，用户通常希望原来看到的那条消息仍然保持在原位置。可以记录锚点行的稳定 ID 和它相对视口的距离，前方内容高度发生变化后，只补偿变化量。</p>
<p>但不能每次测量都强行设置 <code>scrollTop</code>。用户正在拖动滚动条、已经主动滚向其他位置或浏览器正在执行自身滚动锚定时，程序无条件修正会与用户争夺控制权。只有在用户仍接近锚点且变化来自内容测量时，才适合自动补偿。</p>
<h2>虚拟化会影响焦点和无障碍</h2>
<p>正在编辑的输入框可能因为离开窗口被卸载，焦点、光标和未保存状态都会丢失。可以把编辑状态提升到列表外，暂时保留活动行，或使用独立编辑面板。键盘移动到未挂载的行时，要先更新活动索引、滚动到目标，等待节点出现后再设置焦点。</p>
<p>列表、表格和网格应使用与交互相符的语义，并提供位置和总量信息。<code>aria-activedescendant</code> 引用的节点必须真实存在。只给容器加几个 ARIA 属性，不能解决节点根本没有挂载的问题。</p>
<h2>什么时候不应该虚拟化</h2>
<p>浏览器页面查找、复制和打印无法可靠访问没有挂载的行。长文阅读、需要全文搜索的文档、打印报表和搜索引擎抓取页面，分页、分段渲染或静态详情页可能更合适。</p>
<p>因此验收不能只看“DOM 从一万行变成几十行”。还要测试快速滚动、动态高度、顶部插入、筛选删除、滚动到指定项、键盘编辑、读屏器和移动端。虚拟化是性能与原生行为之间的取舍，不是所有长页面的默认方案。</p>`};export{e as default};