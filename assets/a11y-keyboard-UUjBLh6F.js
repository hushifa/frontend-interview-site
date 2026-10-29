var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>最直接的验证方法，就是不用鼠标，只用键盘把页面上所有流程走一遍。要检查的事情，WCAG 里有五条对应的标准。</p>
<p>第一条是 2.1.1 键盘（A 级）：所有功能都能用键盘完成，悬停才出现的菜单、拖拽排序也要有键盘方式。第二条是 2.1.2 无键盘陷阱（A 级）：焦点进了某个组件，还得能用键盘出来。模态对话框限制焦点是允许的，因为能用 Esc 或按钮关掉。</p>
<p>第三条是 2.4.3 焦点顺序（A 级）：Tab 的顺序和阅读顺序一致，不要用正数 <code>tabindex</code> 打乱顺序。第四条是 2.4.7 焦点可见（AA 级）：当前焦点要有明显的指示，不要只写一句 <code>outline: none</code>。</p>
<p>第五条是 WCAG 2.2 新增的 2.4.11 焦点不被遮挡（AA 级）：获得焦点的元素，不能被固定头部、底栏或浮层完全挡住。</p>
</blockquote>
<h2>具体怎么走一遍</h2>
<p>按下面的顺序检查。</p>
<ol>
<li>从地址栏开始按 Tab，确认第一个焦点是“跳到主内容”链接或页面主导航。</li>
<li>依次 Tab 经过所有交互元素，焦点顺序和视觉顺序一致，没有跳到隐藏的元素上。</li>
<li>每个控件用它该用的键操作：按钮用 Enter 和空格，链接用 Enter，复选框用空格，单选组和菜单用方向键。</li>
<li>打开弹窗、下拉菜单，确认焦点进去了，Esc 能关闭，关闭后焦点回到触发的地方。</li>
<li>页面滚动时，被聚焦的元素不会藏在固定头部下面。</li>
<li>提交表单出错时，焦点移到第一个错误或错误汇总上。</li>
</ol>
<h2>焦点样式怎么写</h2>
<p>下面两段 CSS 分别解决“看得见”和“不被挡住”。</p>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-pseudo">:focus-visible</span> {
  <span class="hljs-attribute">outline</span>: <span class="hljs-number">2px</span> solid currentColor;
  <span class="hljs-attribute">outline-offset</span>: <span class="hljs-number">2px</span>;
}

<span class="hljs-selector-tag">html</span> {
  <span class="hljs-attribute">scroll-padding-block-start</span>: <span class="hljs-number">80px</span>;
}
</code></pre></div>
<p>很多人去掉焦点环，是嫌鼠标点按钮时出现一个框不好看。<code>:focus-visible</code> 正好解决这个矛盾：浏览器只在需要时显示它，键盘操作时显示，鼠标点击按钮时一般不显示。</p>
<p><code>scroll-padding-block-start</code> 是给固定头部留位置的。页面滚动到焦点元素时，顶部会预留 80px，元素就不会被头部盖住，满足 2.4.11。这个值按实际头部高度设置。</p>
<h2>复合组件里怎么移动</h2>
<p>单选组、标签页、菜单、树这类组件，里面可能有很多项。如果每一项都占一个 Tab 位置，用户要按很多次 Tab 才能走出去。</p>
<p>所以它们的规则是：Tab 只进入和离开组件一次，组件内部用方向键移动。实现方式叫“漫游 tabindex”，当前项设 <code>tabindex=&quot;0&quot;</code>，其余项设 <code>tabindex=&quot;-1&quot;</code>，按方向键时把这两个值换过来。</p>
<h2>键盘之外还有什么要测</h2>
<p>能用键盘操作只是一部分。WCAG 2.2 还新增了 2.5.7 拖拽动作（AA 级）：用拖拽完成的功能，必须有单指针的替代方式，比如排序列表提供“上移”“下移”按钮。这一条帮的是没法精确拖动的鼠标和触屏用户，和键盘要求是两回事。</p>
<h2>常见追问</h2>
<p><strong><code>tabindex</code> 的几个值怎么用？</strong></p>
<blockquote>
<p><code>0</code> 把元素加进自然的 Tab 顺序；<code>-1</code> 允许用脚本聚焦，但不进 Tab 顺序；大于 0 的值会打乱顺序，不要用。</p>
</blockquote>`};export{e as default};