var e={answerHtml:`<h2>简答</h2>
<ul>
<li>页面要延伸到刘海和圆角区域，需要在 viewport meta 中设置 <code>viewport-fit=cover</code>。</li>
<li>设置后用 <code>env(safe-area-inset-top/right/bottom/left)</code> 获取被遮挡的距离，给内容和固定控件加上对应的内边距。</li>
<li>背景可以铺满整个屏幕，只有文字、按钮等可交互内容需要避开安全区域。</li>
<li>底部固定栏、滚动列表末尾和横屏时的左右两侧最容易被遮挡。</li>
<li>浏览器地址栏伸缩和虚拟键盘不属于安全区域，要用动态视口单位或 VisualViewport 单独处理。</li>
</ul>
<h2>开启全屏布局</h2>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">meta</span> <span class="hljs-attr">name</span>=<span class="hljs-string">&quot;viewport&quot;</span> <span class="hljs-attr">content</span>=<span class="hljs-string">&quot;width=device-width, initial-scale=1, viewport-fit=cover&quot;</span> /&gt;</span>
</code></pre></div>
<p>不设置 <code>viewport-fit=cover</code> 时，浏览器会自动在页面周围留出安全区域，<code>env()</code> 的值为 0；设置后页面占满屏幕，避让工作交给开发者。</p>
<h2>常见写法</h2>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.toolbar</span> {
  <span class="hljs-attribute">position</span>: fixed;
  <span class="hljs-attribute">inset-inline</span>: <span class="hljs-number">0</span>;
  <span class="hljs-attribute">bottom</span>: <span class="hljs-number">0</span>;
  <span class="hljs-attribute">padding-bottom</span>: <span class="hljs-built_in">calc</span>(<span class="hljs-number">12px</span> + <span class="hljs-built_in">env</span>(safe-area-inset-bottom, <span class="hljs-number">0px</span>));
  <span class="hljs-attribute">padding-inline</span>: <span class="hljs-built_in">max</span>(<span class="hljs-number">16px</span>, <span class="hljs-built_in">env</span>(safe-area-inset-left, <span class="hljs-number">0px</span>)) <span class="hljs-built_in">max</span>(<span class="hljs-number">16px</span>, <span class="hljs-built_in">env</span>(safe-area-inset-right, <span class="hljs-number">0px</span>));
  <span class="hljs-attribute">background</span>: <span class="hljs-number">#fff</span>;
}

<span class="hljs-selector-class">.list</span> {
  <span class="hljs-attribute">padding-bottom</span>: <span class="hljs-built_in">calc</span>(<span class="hljs-number">64px</span> + <span class="hljs-built_in">env</span>(safe-area-inset-bottom, <span class="hljs-number">0px</span>));
}

<span class="hljs-selector-class">.header</span> {
  <span class="hljs-attribute">padding-top</span>: <span class="hljs-built_in">env</span>(safe-area-inset-top, <span class="hljs-number">0px</span>);
}
</code></pre></div>
<ul>
<li>底部工具栏的背景铺到屏幕底边，按钮通过内边距避开手势条。</li>
<li>列表末尾留出工具栏高度加安全区域的空间，最后一项不会被挡住。</li>
<li>横屏时刘海在左侧或右侧，用 <code>max()</code> 保证至少有正常的内边距。</li>
<li><code>env()</code> 第二个参数是回退值，不支持的浏览器使用它。</li>
</ul>
<h2>动态工具栏和键盘</h2>
<ul>
<li>移动浏览器的地址栏会随滚动收起和展开，<code>100vh</code> 按工具栏收起时的高度计算，可能被遮挡。用 <code>100dvh</code>（随工具栏变化）或 <code>100svh</code>（按工具栏展开时计算）代替。</li>
<li>虚拟键盘弹出时安全区域不会变化，底部固定栏可能被键盘遮挡，处理方式见<a href="/questions/mobile-virtual-keyboard/">《移动端虚拟键盘出现时怎样避免布局被遮挡？》</a>。</li>
</ul>
<h2>测试</h2>
<ul>
<li>iOS 模拟器选择带刘海和灵动岛的机型，分别测试竖屏和横屏。</li>
<li>Android 设备上开启全面屏手势测试底部区域。</li>
<li>Chrome DevTools 的设备模拟不能准确模拟安全区域，要以真机或模拟器为准。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li><code>constant()</code> 还需要写吗？这是 iOS 11.0 的旧语法，iOS 11.2 起已改为 <code>env()</code>，现在不需要再写。</li>
<li>WebView 中安全区域无效怎么办？需要原生侧允许 WebView 内容延伸到安全区域之外，否则原生已经留了空间，<code>env()</code> 的值为 0。</li>
</ul>`};export{e as default};