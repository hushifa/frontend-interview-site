var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>现在的手机屏幕有刘海、圆角和底部手势条，这些地方放内容会被挡住。屏幕上不会被挡的那块区域，就叫安全区域。</p>
<p>想让页面铺满整个屏幕，要先在 viewport meta 里加 <code>viewport-fit=cover</code>。加了以后，用 <code>env(safe-area-inset-top)</code> 这类变量拿到每条边被挡住的距离，给内容加上对应的内边距。</p>
<p>原则是背景可以铺满，只有文字、按钮这些要看清、要点到的内容需要避开。最容易出问题的是底部固定栏、列表最后一项，以及横屏时的左右两侧。</p>
<p>要注意，地址栏伸缩和虚拟键盘不算安全区域，得用动态视口单位或 VisualViewport 另外处理。</p>
</blockquote>
<h2>怎样让页面铺满屏幕</h2>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">meta</span> <span class="hljs-attr">name</span>=<span class="hljs-string">&quot;viewport&quot;</span> <span class="hljs-attr">content</span>=<span class="hljs-string">&quot;width=device-width, initial-scale=1, viewport-fit=cover&quot;</span> /&gt;</span>
</code></pre></div>
<p>不写 <code>viewport-fit=cover</code> 时，浏览器会自己在页面四周留出安全区域，这时 <code>env()</code> 的值都是 0。写了以后页面占满屏幕，避让的工作就交给开发者了。</p>
<h2>常见的几种写法</h2>
<p>下面这段 CSS 分别处理底部工具栏、列表末尾和顶部。</p>
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
<p>底部工具栏的背景一直铺到屏幕底边，按钮靠 <code>padding-bottom</code> 躲开手势条，所以看起来不会有一截空白。</p>
<p>列表的问题是最后一项会被固定的工具栏挡住。所以列表底部要留出“工具栏高度 + 安全区域”的空间。</p>
<p>横屏时刘海跑到了左边或右边。左右内边距用 <code>max()</code>，取“正常边距”和“安全区域”里大的那个，这样没刘海的一侧也有正常的边距。</p>
<p><code>env()</code> 的第二个参数是回退值，浏览器不支持这个变量时就用它。</p>
<h2>地址栏和键盘为什么要另外处理</h2>
<p>移动浏览器的地址栏会随着滚动收起和展开。<code>100vh</code> 是按地址栏收起时的高度算的，地址栏展开时，页面底部就可能被挡住。可以改用 <code>100dvh</code>，它会跟着地址栏变；或者 <code>100svh</code>，它按地址栏展开时的高度算。</p>
<p>虚拟键盘弹出时，安全区域不会变，所以底部固定栏可能被键盘盖住。处理方法见<a href="/questions/mobile-virtual-keyboard/">《移动端虚拟键盘出现时怎样避免布局被遮挡？》</a>。</p>
<h2>怎样测试</h2>
<p>iOS 模拟器里选带刘海和灵动岛的机型，竖屏横屏都测一遍。Android 设备上打开全面屏手势，测底部区域。</p>
<p>Chrome DevTools 的设备模拟没法准确模拟安全区域，所以要以真机或模拟器为准。</p>
<h2>常见追问</h2>
<p><strong>constant() 还需要写吗？</strong></p>
<blockquote>
<p>不需要了。<code>constant()</code> 是 iOS 11.0 的旧写法，iOS 11.2 起已经改成 <code>env()</code>。</p>
</blockquote>
<p><strong>WebView 里安全区域不生效怎么办？</strong></p>
<blockquote>
<p>要让原生那边允许 WebView 的内容延伸到安全区域外面。否则原生已经替你留好了空间，<code>env()</code> 拿到的值就是 0。</p>
</blockquote>`};export{e as default};