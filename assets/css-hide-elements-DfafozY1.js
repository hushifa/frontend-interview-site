var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>三种写法都能让元素看不见，区别在看不见以后还剩下什么。</p>
<p><code>display: none</code> 最彻底，元素不生成盒子，不占位置，后面的内容会顶上来，读屏器也读不到它。<code>visibility: hidden</code> 只是不画出来，位置还空在那里，布局不变；它不能被 Tab 键聚焦，也会从无障碍树中移除，读屏器读不到它；比较特别的是，它的子元素如果写了 <code>visibility: visible</code>，还能单独显示出来。<code>opacity: 0</code> 只是变成完全透明，位置、点击、键盘焦点都还在，用户可能点到一个看不见的按钮。</p>
<p>性能上，<code>display</code> 在显示和隐藏之间切换，会改变布局，要重新排版；<code>visibility</code> 不改变布局，只需要重新绘制；<code>opacity</code> 的变化如果元素在单独的合成层上，只需要重新合成，所以做淡入淡出动画用 <code>opacity</code>。</p>
<p>要注意，只想在视觉上隐藏、但仍要让读屏器读到的内容，比如图标按钮的文字说明，前两种都会让读屏器读不到，第三种又会留下能点到的透明区域。常用一组“视觉隐藏”样式，把元素缩成 1 像素并裁剪掉，让它看不见但留在无障碍树里。</p>
</blockquote>
<h2>实际对比一下</h2>
<p>下面三个元素高度都是 20px，分别用三种方式隐藏：</p>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">div</span> <span class="hljs-attr">style</span>=<span class="hljs-string">&quot;display: none&quot;</span>&gt;</span>A<span class="hljs-tag">&lt;/<span class="hljs-name">div</span>&gt;</span>
<span class="hljs-tag">&lt;<span class="hljs-name">div</span> <span class="hljs-attr">style</span>=<span class="hljs-string">&quot;visibility: hidden&quot;</span>&gt;</span>B <span class="hljs-tag">&lt;<span class="hljs-name">span</span> <span class="hljs-attr">style</span>=<span class="hljs-string">&quot;visibility: visible&quot;</span>&gt;</span>子元素<span class="hljs-tag">&lt;/<span class="hljs-name">span</span>&gt;</span><span class="hljs-tag">&lt;/<span class="hljs-name">div</span>&gt;</span>
<span class="hljs-tag">&lt;<span class="hljs-name">div</span> <span class="hljs-attr">style</span>=<span class="hljs-string">&quot;opacity: 0&quot;</span> <span class="hljs-attr">onclick</span>=<span class="hljs-string">&quot;alert(&#x27;被点到了&#x27;)&quot;</span>&gt;</span>C<span class="hljs-tag">&lt;/<span class="hljs-name">div</span>&gt;</span>
<span class="hljs-tag">&lt;<span class="hljs-name">button</span> <span class="hljs-attr">style</span>=<span class="hljs-string">&quot;visibility: hidden&quot;</span>&gt;</span>按钮 1<span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span>
<span class="hljs-tag">&lt;<span class="hljs-name">button</span> <span class="hljs-attr">style</span>=<span class="hljs-string">&quot;opacity: 0&quot;</span>&gt;</span>按钮 2<span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span>
</code></pre></div>
<p>在 Chrome 里测量：A 的高度是 0，B 和 C 都还是 20px，说明后两者仍然占着位置。B 里面的“子元素”能显示出来，因为 <code>visibility</code> 是继承属性，子元素可以覆盖它；<code>display: none</code> 和 <code>opacity</code> 都做不到，父元素隐藏了，子元素怎么设都看不见。</p>
<p>C 透明了，用脚本点击它照样触发 <code>onclick</code>，真实用户点到那块区域也一样。按钮 1 调用 <code>focus()</code> 后没有获得焦点，按钮 2 却获得了，用户按 Tab 键会停在一个看不见的按钮上，这是无障碍问题。</p>
<h2>只让读屏器能读到</h2>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.visually-hidden</span> {
  <span class="hljs-attribute">clip</span>: <span class="hljs-built_in">rect</span>(<span class="hljs-number">0</span> <span class="hljs-number">0</span> <span class="hljs-number">0</span> <span class="hljs-number">0</span>);
  <span class="hljs-attribute">clip-path</span>: <span class="hljs-built_in">inset</span>(<span class="hljs-number">50%</span>);
  <span class="hljs-attribute">height</span>: <span class="hljs-number">1px</span>;
  <span class="hljs-attribute">overflow</span>: hidden;
  <span class="hljs-attribute">position</span>: absolute;
  <span class="hljs-attribute">white-space</span>: nowrap;
  <span class="hljs-attribute">width</span>: <span class="hljs-number">1px</span>;
}
</code></pre></div>
<p>元素被缩成 1 像素并裁掉，屏幕上看不见，但它仍然在无障碍树里。比如一个只有放大镜图标的搜索按钮，里面放一个带这个类名的“搜索”文字，读屏器就能读出按钮的用途。这段样式来自 The A11Y Project。MDN 在 <code>display</code> 和 <code>visibility</code> 页面也提醒：<code>display: none</code> 和 <code>visibility: hidden</code> 都会把元素及其后代从无障碍树中移除，想隐藏又想让辅助技术读到，应该用这类组合样式。要注意，按钮、链接这类能获得焦点的元素如果用了这个类，聚焦时要让它重新显示出来，否则键盘用户会停在一个看不见的地方。</p>
<h2>常见追问</h2>
<p><strong><code>hidden</code> 属性和 <code>display: none</code> 一样吗？</strong></p>
<blockquote>
<p>效果基本相同。MDN 的说法是浏览器可以用 <code>display: none</code> 来实现 <code>hidden</code> 状态，主流浏览器的默认样式表正是这样做的。因为它只是一条默认样式，如果你给元素写了 <code>display: flex</code> 之类的样式，就会覆盖掉它，<code>hidden</code> 就失效了，可以在全局样式里加 <code>[hidden] { display: none !important; }</code>。</p>
</blockquote>
<p><strong>为什么 <code>display: none</code> 不能做过渡动画？</strong></p>
<blockquote>
<p><code>display</code> 是离散属性，只能在几个值之间跳变，没有中间状态，以前过渡对它不起作用。现在可以配合 <code>transition-behavior: allow-discrete</code> 和 <code>@starting-style</code> 实现，见<a href="/questions/css-starting-style-discrete-transition/">《@starting-style 和离散属性过渡解决了什么问题？》</a>。</p>
</blockquote>
<p><strong><code>opacity</code> 小于 1 为什么会影响 z-index？</strong></p>
<blockquote>
<p><code>opacity</code> 小于 1 时元素会创建新的层叠上下文，它和子元素作为一个整体参与层叠，子元素的 <code>z-index</code> 再大也跳不出去，见<a href="/questions/css-stacking/">《为什么 z-index 设置很大，元素还是被遮挡？》</a>。</p>
</blockquote>`};export{e as default};