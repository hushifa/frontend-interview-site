var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>做提示框或下拉菜单时，以前要用 JavaScript 读按钮的位置，再算出浮层的坐标。锚点定位让 CSS 直接完成这件事：按钮用 <code>anchor-name</code> 起个名字，浮层用 <code>position: absolute</code> 或 <code>fixed</code>，再用 <code>position-anchor</code> 指向这个名字。</p>
<p>光关联还不会移动浮层，还要说明放在哪里。简单的用 <code>position-area: top</code> 这类写法，精细的用 <code>anchor()</code> 取锚点的边，或者用 <code>anchor-center</code> 居中对齐。</p>
<p>它最省事的地方是自动换位置。<code>position-try-fallbacks: flip-block</code> 表示上面放不下就翻到下面，不用自己判断溢出。</p>
<p>要注意两点。列表里多个元素用同一个锚点名时，浮层默认绑到源码里最后一个，要用 <code>anchor-scope</code> 把名字限定在每一行里。另外 <code>anchor-name</code> 自 2026 年 1 月才进入 Baseline，较新的部分支持程度不一，旧浏览器要准备回退。</p>
</blockquote>
<h2>先看最基本的写法</h2>
<p>下面给“保存”按钮加一个提示框，提示框放在按钮上方。</p>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">button</span> <span class="hljs-attr">class</span>=<span class="hljs-string">&quot;save&quot;</span>&gt;</span>保存<span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span>
<span class="hljs-tag">&lt;<span class="hljs-name">div</span> <span class="hljs-attr">class</span>=<span class="hljs-string">&quot;tip&quot;</span> <span class="hljs-attr">role</span>=<span class="hljs-string">&quot;tooltip&quot;</span>&gt;</span>保存后会同步到所有设备<span class="hljs-tag">&lt;/<span class="hljs-name">div</span>&gt;</span>
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.save</span> {
  <span class="hljs-attribute">anchor-name</span>: --save;
}

<span class="hljs-selector-class">.tip</span> {
  <span class="hljs-attribute">position</span>: absolute;
  <span class="hljs-attribute">position-anchor</span>: --save;
  <span class="hljs-attribute">position</span>-area: top;
  <span class="hljs-attribute">margin-block-end</span>: <span class="hljs-number">8px</span>;
  <span class="hljs-attribute">position</span>-try-fallbacks: flip-block;
}
</code></pre></div>
<p>按钮叫 <code>--save</code>，提示框通过 <code>position-anchor</code> 认它当锚点。<code>position-area</code> 可以这样理解：把锚点想成一个 3×3 网格正中间的那一格，<code>top</code> 就是放在锚点上方那一整行，所以水平方向会跨满整行。</p>
<p>如果按钮贴着视口顶部，上面放不下怎么办？<code>flip-block</code> 会把浮层沿块方向翻过去，放到按钮下方。这一步以前要靠监听滚动、比较坐标来做。</p>
<h2>需要更精细地控制位置时</h2>
<p><code>position-area</code> 只能选格子。想要“离按钮底边 6px”这种具体距离，就用 <code>anchor()</code>。它返回的是一个长度，所以能放进 <code>calc()</code> 里算：</p>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.tip</span> {
  <span class="hljs-attribute">position</span>: absolute;
  <span class="hljs-attribute">position-anchor</span>: --save;
  <span class="hljs-attribute">top</span>: <span class="hljs-built_in">calc</span>(<span class="hljs-built_in">anchor</span>(bottom) + <span class="hljs-number">6px</span>);
  <span class="hljs-attribute">justify-self</span>: anchor-center;
}
</code></pre></div>
<p><code>anchor(bottom)</code> 取的是锚点底边的位置，加 6px 后就是浮层的顶边。<code>justify-self: anchor-center</code> 让浮层在水平方向和锚点居中对齐。</p>
<h2>列表里每行都有菜单，为什么都指向最后一行</h2>
<p>表格每一行都有一个“更多”按钮，按钮都叫 <code>--row-action</code>。结果所有菜单都跑到最后一个按钮旁边去了。</p>
<p>原因是锚点名默认在整个文档里都能看到。同名的锚点有好几个时，浮层绑定源码顺序里最后一个。</p>
<p>改法是在行元素上加 <code>anchor-scope</code>，让这个名字只在本行里面有效，每行的菜单就只能找到本行的按钮：</p>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.row</span> {
  anchor-scope: --row-action;
}

<span class="hljs-selector-class">.row</span> <span class="hljs-selector-class">.more</span> {
  <span class="hljs-attribute">anchor-name</span>: --row-action;
}

<span class="hljs-selector-class">.row</span> <span class="hljs-selector-class">.menu</span> {
  <span class="hljs-attribute">position</span>: absolute;
  <span class="hljs-attribute">position-anchor</span>: --row-action;
  <span class="hljs-attribute">position</span>-area: bottom span-right;
}
</code></pre></div>
<h2>和 Popover 怎么配合</h2>
<p>用 <code>popovertarget</code> 打开的 popover 会自动有一个隐式锚点，就是触发它的那个按钮。所以这时可以不写 <code>anchor-name</code>。不过 popover 默认是在屏幕中间显示的，要先把默认的居中样式清掉：</p>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-attr">[popover]</span> {
  <span class="hljs-attribute">inset</span>: auto;
  <span class="hljs-attribute">margin</span>: <span class="hljs-number">0</span>;
  <span class="hljs-attribute">position</span>-area: bottom;
}
</code></pre></div>
<p>两者各管一件事。Popover 负责显示在顶层、点外面自动关闭和焦点行为，锚点定位只负责摆在哪里。</p>
<h2>浏览器不支持时怎么办</h2>
<p>不支持锚点定位的浏览器会把浮层当成普通的绝对定位来处理。所以先写一个能用的普通定位，再用 <code>@supports (anchor-name: --a)</code> 加上锚点定位的写法。如果要支持旧浏览器，场景又比较复杂，仍然可以用 Floating UI 这类库来算位置。</p>
<p>还有一个容易踩的坑：锚点必须被渲染出来。锚点是 <code>display: none</code> 时，浮层会退回去，按最近的定位祖先来放。</p>
<h2>常见追问</h2>
<p><strong>锚点滚出视口以后，浮层要不要跟着隐藏？</strong></p>
<blockquote>
<p>可以用 <code>position-visibility: anchors-visible</code>。锚点滚出视口时，浮层就自动隐藏，不会孤零零地悬在那里。</p>
</blockquote>
<p><strong>用了锚点定位，tooltip 的无障碍问题就解决了吗？</strong></p>
<blockquote>
<p>没有。锚点定位只管位置。用 <code>aria-describedby</code> 关联说明文字、支持键盘触发、按 Esc 关闭，这些还要自己单独实现。</p>
</blockquote>`};export{e as default};