var e={answerHtml:`<h2>简答</h2>
<ul>
<li>背景可以延伸到屏幕边缘，文字、输入框和按钮要留在安全区域内。</li>
<li>viewport-fit=cover 允许覆盖整个显示区域，但不会自动加 padding。</li>
<li>固定操作栏的间距应是设计间距加上 env(safe-area-inset-*)。</li>
<li>不要通过禁止缩放来掩盖布局问题。</li>
</ul>
<h2>背景可以到边缘，按钮不能到边缘</h2>
<p>手机刘海、圆角和底部手势区域会占用屏幕边缘。背景延伸到这些位置通常是设计需要，但文字、输入框和提交按钮必须留在用户可读、可点击的区域。安全区域适配不是给整个页面加一层固定边距，而是明确哪些层负责背景，哪些层负责内容避让。</p>
<p>如果页面不需要真正的边缘到边缘布局，不必为了“全屏”强行改变 viewport。开启后，开发者要自己承担内容保护责任：</p>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">meta</span> <span class="hljs-attr">name</span>=<span class="hljs-string">&quot;viewport&quot;</span> <span class="hljs-attr">content</span>=<span class="hljs-string">&quot;width=device-width, initial-scale=1, viewport-fit=cover&quot;</span> /&gt;</span>
</code></pre></div>
<p><code>viewport-fit=cover</code> 允许页面覆盖设备显示区域，不会自动给所有元素加 padding，也不能解决普通的响应式溢出。不要通过禁用用户缩放来掩盖布局问题。</p>
<h2>把设计间距和安全边距组合</h2>
<p>固定底部操作栏通常至少需要设计间距，再加上设备安全边距：</p>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.bottom-actions</span> {
  <span class="hljs-attribute">padding</span>: <span class="hljs-number">12px</span> <span class="hljs-number">16px</span>;
  <span class="hljs-attribute">padding-bottom</span>: <span class="hljs-built_in">calc</span>(<span class="hljs-number">12px</span> + <span class="hljs-built_in">env</span>(safe-area-inset-bottom, <span class="hljs-number">0px</span>));
  <span class="hljs-attribute">padding-left</span>: <span class="hljs-built_in">max</span>(<span class="hljs-number">16px</span>, <span class="hljs-built_in">env</span>(safe-area-inset-left, <span class="hljs-number">0px</span>));
  <span class="hljs-attribute">padding-right</span>: <span class="hljs-built_in">max</span>(<span class="hljs-number">16px</span>, <span class="hljs-built_in">env</span>(safe-area-inset-right, <span class="hljs-number">0px</span>));
}
</code></pre></div>
<p>底部用 <code>calc</code> 表示“设计间距之外再避让系统区域”；左右用 <code>max</code> 表示至少保留设计间距。fallback 只在变量不可用时生效，浏览器明确提供 0 时仍然是 0。RTL 只改变内容方向，不应把物理左、右安全区域简单互换。</p>
<p>安全区域变量应由 CSS 直接参与布局，随着横竖屏和显示模式变化而更新。不要把某款手机的 34px 写死在 JavaScript 中。</p>
<h2>固定底栏还要保护滚动内容</h2>
<p>给底栏加 padding 只能保护底栏内部按钮。如果底栏 <code>position: fixed</code> 脱离文档流，正文最后几行仍可能被整块底栏遮住。滚动容器需要额外预留底栏的实际高度和安全边距：</p>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.page-scroll</span> {
  <span class="hljs-attribute">padding-bottom</span>: <span class="hljs-built_in">calc</span>(<span class="hljs-built_in">var</span>(--actions-height) + <span class="hljs-built_in">env</span>(safe-area-inset-bottom, <span class="hljs-number">0px</span>));
}
</code></pre></div>
<p>按钮换行、用户放大文字或横屏后，底栏高度可能变化，不能永远假设一个固定常量。可以用 ResizeObserver 更新 <code>--actions-height</code>。同时明确只有一层负责安全边距，避免父容器和底栏重复相加造成大块空白。</p>
<h2>横屏、PWA 和浏览器工具栏都要测试</h2>
<p>横屏时危险区域可能出现在左右两侧；独立 PWA、全屏模式和普通浏览器的系统 UI 也可能不同。移动浏览器动态工具栏会改变可见空间，<code>100vh</code>、<code>100dvh</code>、<code>100svh</code> 和 <code>100lvh</code> 表达的范围不同，不能只在一个方向用固定高度验证。</p>
<p>键盘是另一套问题。<code>safe-area-inset-bottom</code> 不是通用键盘高度接口。键盘可能缩小视觉视口、调整布局视口或覆盖页面，平台行为也不同。先确定项目使用的视口策略，再决定是否需要滚动到输入框或调整底栏，避免把猜测的键盘高度和安全边距重复相加。</p>
<h2>验收要看用户能否完成任务</h2>
<p>真实设备上检查纵向、横向、浏览器标签页、独立 PWA、系统字体放大、键盘弹出和页面滚动末尾。重点观察最后一项内容、固定按钮、输入框和焦点是否被遮挡，点击区域是否仍然可达。</p>
<p>桌面浏览器的窄窗口只能验证一般响应式布局，不能证明刘海、手势条和移动浏览器工具栏适配正确。安全区域最终要以真实设备和真实操作路径验收。</p>`};export{e as default};