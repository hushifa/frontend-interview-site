var e={answerHtml:`<h2>简答</h2>
<ul>
<li>2.1.1 键盘（A）：所有功能都能通过键盘完成，悬停菜单、拖拽排序也要有键盘方式。</li>
<li>2.1.2 无键盘陷阱（A）：焦点进入某个组件后能用键盘离开；模态对话框限制焦点是允许的，因为可以用 Esc 或按钮关闭。</li>
<li>2.4.3 焦点顺序（A）：Tab 顺序和阅读顺序一致，不要用正数 <code>tabindex</code> 打乱顺序。</li>
<li>2.4.7 焦点可见（AA）：当前焦点有明显的指示，不要只写 <code>outline: none</code>。</li>
<li>2.4.11 焦点不被遮挡（AA，WCAG 2.2 新增）：获得焦点的元素不能被固定头部、底栏或浮层完全遮住。</li>
</ul>
<h2>检查步骤</h2>
<ol>
<li>从地址栏开始按 Tab，确认第一个焦点是“跳到主内容”链接或页面主导航。</li>
<li>依次 Tab 经过所有交互元素，焦点顺序与视觉顺序一致，没有跳到隐藏元素上。</li>
<li>每个控件用对应的键操作：按钮用 Enter 和空格，链接用 Enter，复选框用空格，单选组和菜单用方向键。</li>
<li>打开弹窗、下拉菜单，确认焦点进入，Esc 能关闭，关闭后焦点回到触发处。</li>
<li>页面滚动时，被聚焦的元素不会藏在固定头部下面。</li>
<li>提交表单出错时，焦点移到第一个错误或错误汇总。</li>
</ol>
<h2>焦点样式</h2>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-pseudo">:focus-visible</span> {
  <span class="hljs-attribute">outline</span>: <span class="hljs-number">2px</span> solid currentColor;
  <span class="hljs-attribute">outline-offset</span>: <span class="hljs-number">2px</span>;
}

<span class="hljs-selector-tag">html</span> {
  <span class="hljs-attribute">scroll-padding-block-start</span>: <span class="hljs-number">80px</span>;
}
</code></pre></div>
<p><code>:focus-visible</code> 只在键盘操作时显示焦点环，鼠标点击按钮时不显示。<code>scroll-padding</code> 让滚动到焦点元素时预留固定头部的高度，满足 2.4.11。</p>
<h2>复合组件</h2>
<p>单选组、标签页、菜单、树这类组件内部用方向键移动，Tab 只进入和离开组件一次。实现方式是“漫游 tabindex”：当前项 <code>tabindex=&quot;0&quot;</code>，其余 <code>tabindex=&quot;-1&quot;</code>，方向键切换时更新。</p>
<h2>不能只用键盘测的</h2>
<p>键盘可操作只是一部分。WCAG 2.2 还新增了针对指针操作的 2.5.7 拖拽动作（AA）：拖拽完成的功能必须有单指针的替代方式，例如排序列表提供“上移”“下移”按钮。这一条帮助的是无法精确拖动的鼠标和触屏用户，和键盘要求是分开的。</p>
<h2>常见追问</h2>
<ul>
<li><code>tabindex</code> 怎样用？<code>0</code> 把元素加入自然 Tab 顺序，<code>-1</code> 允许用脚本聚焦但不进入 Tab 顺序，大于 0 的值会打乱顺序，不要使用。</li>
</ul>`};export{e as default};