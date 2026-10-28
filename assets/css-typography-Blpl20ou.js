var e={answerHtml:`<p>同一段标题换一种字体后，可能从一行变成两行，卡片高度改变，下面的按钮整体下移；字体迟到时，用户还会先看到后备字体，再看到文字重新排版。排版问题同时影响可读性、性能和 CLS，不能只靠把 <code>font-size</code> 调小来修复。</p>
<h2>字体家族不是一定能提供所有字形</h2>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-tag">body</span> {
  <span class="hljs-attribute">font-family</span>: system-ui, -apple-system, <span class="hljs-string">&quot;Segoe UI&quot;</span>, sans-serif;
  <span class="hljs-attribute">font-size</span>: <span class="hljs-number">1rem</span>;
  <span class="hljs-attribute">line-height</span>: <span class="hljs-number">1.6</span>;
}
</code></pre></div>
<p>字体栈按顺序寻找可用字体；不同字体覆盖的 Unicode 范围不同，中文、阿拉伯文、Emoji 和数学符号可能来自不同回退字体。回退字体的字宽、基线和行高不一定相同，不能只在一台机器上判断标题永远不会换行。</p>
<p><code>lang</code> 属性帮助浏览器和辅助技术选择语言规则，也可能影响断词、引号和连字符：</p>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">html</span> <span class="hljs-attr">lang</span>=<span class="hljs-string">&quot;zh-CN&quot;</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">p</span> <span class="hljs-attr">lang</span>=<span class="hljs-string">&quot;en&quot;</span>&gt;</span>A long English paragraph can wrap differently.<span class="hljs-tag">&lt;/<span class="hljs-name">p</span>&gt;</span>
<span class="hljs-tag">&lt;/<span class="hljs-name">html</span>&gt;</span>
</code></pre></div>
<p>语言标签不是翻译，也不是权限标记；动态切换语言时，文档和局部内容的语言都要与实际文本一致。</p>
<h2>line-height 要表达阅读节奏</h2>
<p>无单位 <code>line-height: 1.6</code> 会随元素自己的字体大小计算，通常比固定像素更容易适应组件和文字放大。固定高度的标题或按钮如果依赖文字不换行，遇到长翻译、系统字体放大和不同字体度量就可能裁剪内容。</p>
<p>行高过小会让相邻行难以区分，过大又会破坏段落节奏。可读性应按正文、标题、表单和表格分别设计，不能用一套数值覆盖所有文本。<code>vertical-align</code>、内联盒和图标基线也可能影响行框，出现图标上下跳动时要检查实际字体和盒模型，而不是只改 margin。</p>
<h2>Web 字体加载要在性能和稳定性之间取舍</h2>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-keyword">@font-face</span> {
  <span class="hljs-attribute">font-family</span>: <span class="hljs-string">&quot;Study Sans&quot;</span>;
  <span class="hljs-attribute">src</span>: <span class="hljs-built_in">url</span>(<span class="hljs-string">&quot;/fonts/study-sans.woff2&quot;</span>) <span class="hljs-built_in">format</span>(<span class="hljs-string">&quot;woff2&quot;</span>);
  <span class="hljs-attribute">font-style</span>: normal;
  <span class="hljs-attribute">font-weight</span>: <span class="hljs-number">400</span> <span class="hljs-number">700</span>;
  <span class="hljs-attribute">font-display</span>: swap;
}
</code></pre></div>
<p><code>font-display</code> 决定字体不可用期间的显示策略：<code>swap</code> 通常更快显示文字，但字体到达后可能重新排版；<code>block</code> 可能短暂隐藏文字；<code>optional</code> 更偏向让慢网络继续使用后备字体。没有一种策略对所有内容和网络都最好，应结合品牌字体必要性、CLS、LCP 和真实设备测量。</p>
<p>字体文件可以使用 <code>unicode-range</code> 拆分字符集，但分片太多会增加请求和发现成本。预加载字体时要确保 URL、<code>crossorigin</code>、凭据模式和实际 <code>@font-face</code> 请求一致，否则可能重复下载；字体授权、子集化和缓存策略也要与发布流程一致。</p>
<p>不要把大图标字体当成所有图标的默认方案。SVG、图标组件和文本图标各有无障碍与加载边界；图标字体缺失时可能显示错误字符，操作按钮还需要真实的可访问名称。</p>
<h2>换行和断词必须尊重语言与数据类型</h2>
<p>长 URL、邮箱、哈希和代码行可能没有自然空格。<code>overflow-wrap: anywhere</code> 可以防止它撑破容器，但也可能在不理想的位置断开；正文语言则应优先使用自然断词、<code>word-break</code> 和 <code>hyphens</code> 的合适组合。</p>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.article</span> {
  <span class="hljs-attribute">overflow-wrap</span>: break-word;
  <span class="hljs-attribute">hyphens</span>: auto;
}

<span class="hljs-selector-class">.code</span>,
<span class="hljs-selector-class">.url</span> {
  <span class="hljs-attribute">overflow-wrap</span>: anywhere;
  <span class="hljs-attribute">word-break</span>: break-word;
}
</code></pre></div>
<p>CSS 属性的支持与语言规则相关，浏览器不能凭 <code>hyphens: auto</code> 自动理解所有语言。代码和 URL 还要考虑复制、选择和读屏体验，不能为了避免横向滚动把内容切成用户无法重组的片段。</p>
<h2>可变字体提供连续轴，也带来资源和设计成本</h2>
<p>可变字体可以在一个文件中提供重量、宽度或光学大小等轴，减少多个静态字体文件的重复，但文件仍可能很大，且不同字体的轴支持不同。<code>font-weight: 350</code> 只有在字体提供相应轴或浏览器能够合理插值时才有意义。</p>
<p>如果使用 <code>font-variation-settings</code>，要了解它可能绕过更具语义的 <code>font-weight</code>、<code>font-stretch</code> 和 <code>font-style</code>，让组件和辅助技术难以推断设计意图。只为一个标题引入完整可变字体，可能比使用系统字体或合适子集更昂贵。</p>
<h2>字体改变后要检查布局和交互</h2>
<p>字体加载、语言切换和文字放大都可能改变高度。应为图片、卡片和固定操作预留合理空间，避免文字出现后覆盖按钮；读取尺寸或滚动定位时，要等待字体和必要资源就绪，不能在默认字体阶段测一次就永久缓存。</p>
<p>验收应覆盖冷缓存、慢网络、字体失败、系统放大、深色/高对比模式、长翻译、中文英文混排、阿拉伯文 RTL 和打印。性能面板检查字体请求、文本布局和 CLS，读屏器检查名称和语言，最终目标是文字可读、可复制、可操作且不会因为字体到达顺序破坏页面。</p>`};export{e as default};