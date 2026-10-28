var e={answerHtml:`<p>图片卡片、文章摘要和作品集经常高度不一，但设计又希望像瀑布一样紧凑排列。最早的实现通常是 JavaScript 测量每张卡片，再把它绝对定位到最短列；这能工作，却要处理图片加载、窗口变化、滚动和大量布局读写。</p>
<p>Masonry 的目标是让布局系统根据项目高度自动放入列中，但它不是“把 Grid 改一个属性就永远兼容”的简单升级。规范、浏览器支持、键盘顺序和视觉顺序都需要一起评估。</p>
<h2>先确认内容是否真的适合瀑布流</h2>
<p>瀑布流适合图片卡片、灵感墙和不要求严格行列对齐的内容。数据表、财务数字、步骤列表和需要横向比较的卡片通常不适合，因为视觉上同一行的项目高度和位置不一致会增加比较成本。</p>
<p>内容顺序也很重要。用户通常按 DOM 顺序阅读，而 CSS 可能让视觉顺序先填满第一列再进入下一列；屏幕阅读器、键盘焦点和复制内容仍主要依赖 DOM 顺序。视觉上“最短列优先”不一定对应一个清晰的阅读顺序。</p>
<h2>原生 Masonry 要按支持情况渐进增强</h2>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.gallery</span> {
  <span class="hljs-attribute">display</span>: grid;
  <span class="hljs-attribute">grid-template-columns</span>: <span class="hljs-built_in">repeat</span>(auto-fill, <span class="hljs-built_in">minmax</span>(<span class="hljs-number">14rem</span>, <span class="hljs-number">1</span>fr));
  <span class="hljs-attribute">gap</span>: <span class="hljs-number">1rem</span>;
}

<span class="hljs-keyword">@supports</span> (<span class="hljs-attribute">grid-template-rows</span>: masonry) {
  <span class="hljs-selector-class">.gallery</span> {
    <span class="hljs-attribute">grid-template-rows</span>: masonry;
    align-tracks: start;
  }
}
</code></pre></div>
<p>上面的写法展示的是标准能力探测思路，不代表所有目标浏览器都支持 <code>grid-template-rows: masonry</code> 或 <code>align-tracks</code>。在不支持的环境中，规则会回退到普通 Grid，内容仍应可阅读。不要把实验性语法直接作为唯一布局路径，也不要仅凭开发浏览器支持就宣称生产兼容。</p>
<p>具体语法和实现仍应按当前 MDN、CSSWG 规范和目标浏览器矩阵核对；Masonry 相关提案和实现可能变化，生产项目应锁定测试范围。</p>
<h2>Grid、columns 和 JavaScript 的差异</h2>
<p>普通 Grid 提供稳定的行列关系，适合需要对齐的卡片；它可以通过固定或估算高度实现近似瀑布，但不会自动把下一个项目放入当前最短列。CSS Multi-column 能产生类似流式排列，却可能按列从上到下再横向移动，阅读和响应式顺序不一定符合用户预期。</p>
<p>JavaScript/绝对定位可以精确控制列、虚拟化和排序，但要处理更多生命周期：图片和字体加载完成后重新测量，容器宽度变化时重排，快速滚动时避免布局抖动，删除或插入项目时保持焦点。频繁读取 <code>getBoundingClientRect()</code> 再写 style，可能造成强制同步布局。</p>
<p>如果内容数量很大，虚拟列表还要维护总高度、滚动锚点和键盘目标；如果页面需要浏览器查找、打印和全文复制，虚拟化或纯视觉瀑布流可能不合适。</p>
<h2>图片尺寸和布局稳定性仍要提前处理</h2>
<p>无论使用哪种方案，都应在图片或异步内容出现前预留尺寸：</p>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">img</span>
  <span class="hljs-attr">src</span>=<span class="hljs-string">&quot;/images/card.webp&quot;</span>
  <span class="hljs-attr">width</span>=<span class="hljs-string">&quot;640&quot;</span>
  <span class="hljs-attr">height</span>=<span class="hljs-string">&quot;480&quot;</span>
  <span class="hljs-attr">alt</span>=<span class="hljs-string">&quot;课程封面&quot;</span>
  <span class="hljs-attr">loading</span>=<span class="hljs-string">&quot;lazy&quot;</span>
&gt;</span>
</code></pre></div>
<p>宽高属性或 <code>aspect-ratio</code> 能让浏览器提前知道占位比例，减少图片到达后的布局移动。它不会保证所有卡片高度相同；瀑布流正是利用高度差，但不能让后续内容突然覆盖按钮或焦点。</p>
<p>字体、展开内容、折叠面板和异步广告也可能改变高度。布局系统会重新计算位置，组件应避免在用户正在阅读时无条件把滚动位置拉回。必要时使用稳定占位、显式加载区域或滚动锚点策略。</p>
<h2>可访问性不能只看 DOM 顺序</h2>
<p>卡片应使用合适的标题、链接和按钮，图片提供准确替代文本；不要把整个卡片做成只能鼠标点击的 div。键盘焦点应按逻辑顺序移动，即使视觉布局像瀑布；焦点被移动或卡片动态插入时，用户需要知道当前内容变化。</p>
<p>如果设计要求按列浏览或拖拽重排，应提供明确的键盘操作和状态说明。不要依赖 Masonry 的视觉位置推断 <code>aria-posinset</code> 或阅读顺序；这些语义要根据实际内容模型单独计算。</p>
<h2>性能比较要看完整代价</h2>
<p>原生布局可能减少 JavaScript 测量和主线程工作，但不代表卡片图片、字体和第三方内容变轻。JavaScript 方案可能支持更强的虚拟化和排序，但也可能增加布局读取、事件和内存成本。</p>
<p>测试时观察首次布局、图片到达后的 CLS、快速滚动、容器尺寸改变、低端设备长任务和页面查找行为。用真实数据量和图片尺寸比较，而不是只用十个相同高度的占位块。先确认内容语义、兼容性和顺序，再决定是否值得采用原生实验特性或自定义实现。</p>`};export{e as default};