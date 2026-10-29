var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>待办清单里按住一项往上拖，其他项自动让开位置，松手后它就排到了新的位置。这就是拖拽排序。</p>
<p>不管用哪种 API，核心都是同一件事：拖动过程中根据指针位置算出“应该插到第几个”，松手时把数据数组里的元素从旧下标移到新下标，再由数据重新渲染列表。直接去挪 DOM 节点，数据和界面就会对不上。</p>
<p>实现方式有两种。HTML5 拖放 API 给元素加 <code>draggable=&quot;true&quot;</code>，监听 <code>dragstart</code>、<code>dragover</code>、<code>drop</code>，浏览器会画一个半透明的拖动影像；它能接收从桌面拖进来的文件，但影像样式和动画很难控制。Pointer 事件是自己监听 <code>pointerdown</code>、<code>pointermove</code>、<code>pointerup</code>，用 <code>setPointerCapture</code> 保证指针移出元素也能收到事件，跟随效果完全自己画，一套代码同时支持鼠标、触摸和触控笔。列表内排序通常选 Pointer 事件。</p>
<p>还要考虑不能拖动的用户。WCAG 2.2 要求拖动能完成的功能，也要能用单次点击完成，所以每项要有“上移”“下移”按钮或键盘操作。</p>
</blockquote>
<h2>松手以后数据怎么改</h2>
<p>先把和 API 无关的部分写好：把数组里的一项从 <code>from</code> 移到 <code>to</code>。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">move</span>(<span class="hljs-params">list, <span class="hljs-keyword">from</span>, to</span>) {
  <span class="hljs-keyword">const</span> next = list.<span class="hljs-title function_">slice</span>();
  <span class="hljs-keyword">const</span> [item] = next.<span class="hljs-title function_">splice</span>(<span class="hljs-keyword">from</span>, <span class="hljs-number">1</span>);
  next.<span class="hljs-title function_">splice</span>(to, <span class="hljs-number">0</span>, item);
  <span class="hljs-keyword">return</span> next;
}
</code></pre></div>
<p>先删再插，返回新数组，不改原数组，方便在 React 这类框架里触发更新。列表渲染时 <code>key</code> 要用每项的 ID，不能用下标，否则移动后组件状态会错位，见<a href="/questions/react-key/">《列表中的 key 为什么不能随意使用数组下标？》</a>。</p>
<p>拖动过程中怎么算 <code>to</code>？常见做法是取出每一项的位置，看指针的纵坐标落在哪一项的上半部分还是下半部分。落在某项上半部分，就插到它前面；下半部分，就插到它后面。</p>
<h2>用 HTML5 拖放 API 怎么写</h2>
<p>MDN 介绍，拖放 API 基于 DOM 事件，拖动时会触发 <code>dragstart</code>、<code>dragenter</code>、<code>dragover</code>、<code>dragleave</code>、<code>drop</code>、<code>dragend</code> 等事件，其中 <code>drag</code> 和 <code>dragover</code> 会反复触发。容易踩的坑是：大多数元素默认不是放置目标，松手时只会播放一个“飞回去”的动画。MDN 写明，要在 <code>dragover</code> 事件里调用 <code>preventDefault()</code>，元素才能成为放置目标，<code>drop</code> 才会触发。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">let</span> fromIndex = -<span class="hljs-number">1</span>;

list.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;dragstart&#x27;</span>, <span class="hljs-function">(<span class="hljs-params">event</span>) =&gt;</span> {
  <span class="hljs-keyword">const</span> item = event.<span class="hljs-property">target</span>.<span class="hljs-title function_">closest</span>(<span class="hljs-string">&#x27;li&#x27;</span>);
  fromIndex = <span class="hljs-title class_">Number</span>(item.<span class="hljs-property">dataset</span>.<span class="hljs-property">index</span>);
  event.<span class="hljs-property">dataTransfer</span>.<span class="hljs-property">effectAllowed</span> = <span class="hljs-string">&#x27;move&#x27;</span>;
});

list.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;dragover&#x27;</span>, <span class="hljs-function">(<span class="hljs-params">event</span>) =&gt;</span> {
  event.<span class="hljs-title function_">preventDefault</span>(); <span class="hljs-comment">// 不取消 dragover，drop 就不会触发</span>
});

list.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;drop&#x27;</span>, <span class="hljs-function">(<span class="hljs-params">event</span>) =&gt;</span> {
  event.<span class="hljs-title function_">preventDefault</span>();
  <span class="hljs-keyword">const</span> target = event.<span class="hljs-property">target</span>.<span class="hljs-title function_">closest</span>(<span class="hljs-string">&#x27;li&#x27;</span>);
  <span class="hljs-keyword">if</span> (!target) <span class="hljs-keyword">return</span>;
  <span class="hljs-title function_">render</span>(<span class="hljs-title function_">move</span>(items, fromIndex, <span class="hljs-title class_">Number</span>(target.<span class="hljs-property">dataset</span>.<span class="hljs-property">index</span>)));
});
</code></pre></div>
<p>列表项要写成 <code>&lt;li draggable=&quot;true&quot;&gt;</code>。MDN 提醒 <code>draggable</code> 是枚举属性，必须写 <code>true</code> 或 <code>false</code>，不能简写成 <code>&lt;li draggable&gt;</code>。</p>
<p>这里没有用 <code>dataTransfer</code> 传数据，而是把下标存在变量里。MDN 说明在页面内拖动元素时，往往不需要定义传输的数据，直接操作被拖的元素就行；而且拖动数据只在 <code>dragstart</code> 和 <code>drop</code> 时可读，在 <code>dragover</code> 里读到的是空字符串。只有拖到页面外，或者从另一个窗口拖进来，才必须用 <code>dataTransfer</code>。</p>
<p>拖放 API 的长处是能和页面外交互：接收从文件管理器拖进来的文件，或者把内容拖到另一个应用。短处是拖动影像由浏览器生成，只能用 <code>setDragImage</code> 换一张图，很难做“其他项平滑让位”这种动画。MDN 对它的描述也是“用鼠标选中可拖动元素”，触屏上的支持情况要在目标设备上实测。</p>
<h2>用 Pointer 事件怎么写</h2>
<p>Pointer 事件把鼠标、触摸、触控笔统一成一套事件，介绍见<a href="/questions/mobile-pointer-events/">《Pointer Events 为什么适合统一鼠标、触摸和触控笔交互？》</a>。拖动时的关键是指针捕获：MDN 介绍，<code>setPointerCapture(pointerId)</code> 会把之后这个指针的事件都发给指定元素，直到调用 <code>releasePointerCapture</code> 或触发 <code>pointerup</code>。这样手指拖出列表项的范围，<code>pointermove</code> 仍然发给它。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js">item.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;pointerdown&#x27;</span>, <span class="hljs-function">(<span class="hljs-params">event</span>) =&gt;</span> {
  item.<span class="hljs-title function_">setPointerCapture</span>(event.<span class="hljs-property">pointerId</span>);
  startY = event.<span class="hljs-property">clientY</span>;
});

item.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;pointermove&#x27;</span>, <span class="hljs-function">(<span class="hljs-params">event</span>) =&gt;</span> {
  <span class="hljs-keyword">if</span> (!item.<span class="hljs-title function_">hasPointerCapture</span>(event.<span class="hljs-property">pointerId</span>)) <span class="hljs-keyword">return</span>;
  <span class="hljs-keyword">const</span> dy = event.<span class="hljs-property">clientY</span> - startY;
  item.<span class="hljs-property">style</span>.<span class="hljs-property">transform</span> = <span class="hljs-string">\`translateY(<span class="hljs-subst">\${dy}</span>px)\`</span>; <span class="hljs-comment">// 跟随指针</span>
  <span class="hljs-title function_">updatePlaceholder</span>(event.<span class="hljs-property">clientY</span>); <span class="hljs-comment">// 根据位置算目标下标，让其他项让位</span>
});

item.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;pointerup&#x27;</span>, <span class="hljs-function">() =&gt;</span> {
  item.<span class="hljs-property">style</span>.<span class="hljs-property">transform</span> = <span class="hljs-string">&#x27;&#x27;</span>;
  <span class="hljs-title function_">commitMove</span>(); <span class="hljs-comment">// 调用 move() 更新数据</span>
});

item.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;pointercancel&#x27;</span>, <span class="hljs-function">() =&gt;</span> {
  item.<span class="hljs-property">style</span>.<span class="hljs-property">transform</span> = <span class="hljs-string">&#x27;&#x27;</span>;
  <span class="hljs-title function_">cancelMove</span>(); <span class="hljs-comment">// 恢复原顺序</span>
});
</code></pre></div>
<p>触屏上还要处理滚动冲突。MDN 说明，默认情况下平移和缩放手势由浏览器处理，浏览器开始处理触摸手势时，页面会收到 <code>pointercancel</code>。所以拖动手柄上要写 <code>touch-action: none</code>，告诉浏览器在这里不要滚动页面。只给手柄加，不要给整个列表加，否则用户没法滑动列表。<code>pointercancel</code> 也要处理，比如来电或切换应用打断了拖动，要把列表恢复原状。</p>
<h2>两种方式怎么选</h2>
<p>列表或看板内部的排序，选 Pointer 事件。跟随效果、让位动画、自动滚动都能自己控制，鼠标和触摸一套代码。</p>
<p>需要和页面外交互时，选拖放 API，比如把桌面上的文件拖进上传区，或者把列表项拖到另一个浏览器窗口。这些只有拖放 API 能做到。</p>
<p>成熟的拖拽库通常也是基于 Pointer 或鼠标、触摸事件自己实现排序，再单独提供键盘支持。</p>
<h2>不能拖动的用户怎么办</h2>
<p>WCAG 2.2 的 2.5.7“拖动动作”要求：用拖动完成的功能，也要能用单个指针、不需要拖动的方式完成，除非拖动是必需的。它还特别说明，提供键盘操作并不自动满足这一条，因为键盘方案不一定能用点击完成。</p>
<p>所以每一项至少要有“上移”“下移”按钮，或者“移动到…”菜单。键盘用户可以聚焦到这些按钮操作。移动完成后，焦点要留在被移动的那一项上，并用一个 <code>aria-live</code> 区域念出“已移到第 3 位”，读屏用户才知道发生了什么。</p>
<h2>常见追问</h2>
<p><strong>拖到列表边缘时怎样自动滚动？</strong></p>
<blockquote>
<p>在 <code>pointermove</code> 里判断指针离容器上下边缘的距离，进入边缘区域就用 <code>requestAnimationFrame</code> 持续修改容器的 <code>scrollTop</code>，离开或松手就停。距离越近滚得越快，体验会更自然。</p>
</blockquote>
<p><strong>长列表用了虚拟滚动，拖拽排序要注意什么？</strong></p>
<blockquote>
<p>虚拟列表只渲染可见的几项，不能靠查询 DOM 来算目标下标，要用每项的高度数据算。被拖的那一项滚出可见区域时也不能被卸载，否则指针捕获和拖动状态就丢了。</p>
</blockquote>
<p><strong>松手前想让其他项平滑让位，怎么做？</strong></p>
<blockquote>
<p>拖动过程中只改其他项的 <code>transform</code>，让它们上下移动一个项的高度，不改数据顺序。松手时再一次性更新数据，并清掉这些位移。只改 <code>transform</code> 不触发重新布局，动画更顺。</p>
</blockquote>`};export{e as default};