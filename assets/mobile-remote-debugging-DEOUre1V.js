var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>有些问题只在手机上出现，比如某款 iPhone 上按钮点不动。这时要把手机里的页面接到电脑的开发者工具上，像调试桌面网页一样看元素、打断点、看网络请求。</p>
<p>iPhone 和 iPad 用 Mac 上的 Safari：手机在“设置 → App → Safari → 高级”里打开“网页检查器”，Mac 的 Safari 设置里勾选“显示网页开发者功能”，用线连上以后，在“开发”菜单里选中手机上的页面。Android 用 Chrome：手机打开开发者选项里的 USB 调试，电脑 Chrome 打开 <code>chrome://inspect#devices</code>，点页面下面的 inspect。</p>
<p>App 里的 WebView 默认不能这样调试，要原生代码先打开开关。Android 调用 <code>WebView.setWebContentsDebuggingEnabled(true)</code>；iOS 16.4 起要把 <code>WKWebView</code> 的 <code>isInspectable</code> 设成 <code>true</code>。</p>
<p>如果连不上电脑，比如在测试同学的手机上或者某个 App 里，可以在页面里嵌入 vConsole 或 Eruda，它们在页面上画一个控制台面板，能看日志、网络请求和存储。要注意它们只在测试环境开启，不要带到线上。</p>
</blockquote>
<h2>iPhone 上的页面怎样接到 Mac 上调试</h2>
<p>苹果的做法要求两边都打开开关。手机这边，按 Apple 文档在“设置”里进入 App → Safari，滚到“高级”，打开“网页检查器”（Web Inspector）。Mac 这边，Safari 的开发者工具默认是关着的，要在 Safari 设置的“高级”里勾选“显示网页开发者功能”，菜单栏才会出现“开发”菜单。</p>
<p>然后用数据线把手机连到 Mac，第一次连接时手机可能会问是否信任这台电脑。连上以后，“开发”菜单里会出现手机的名字，它的子菜单按 App 列出了可以检查的网页，选中一个就会打开 Web Inspector 窗口。Apple 文档还说明，先用线连过一次以后，可以在设备子菜单里打开“通过网络连接”，之后不插线也能调试。模拟器里的 Web Inspector 始终是开着的，启动的模拟器同样出现在“开发”菜单里。</p>
<h2>Android 上的页面怎样接到 Chrome 上调试</h2>
<p>Chrome 文档给出的步骤是：在 Android 手机上打开“开发者选项”，开启“USB 调试”；电脑上打开 Chrome，进入 <code>chrome://inspect#devices</code>，确认勾选了 Discover USB devices；再用 USB 线把手机直接连到电脑。第一次连接时设备会显示为 Offline，需要在手机上同意调试授权，之后就能看到手机型号。</p>
<p>接着在手机上打开 Chrome，<code>chrome://inspect</code> 里会列出手机上打开的每个标签页，点 Inspect 就会打开一个 DevTools 窗口，在 Elements 面板里移动鼠标，手机上的对应元素会被高亮。Chrome 文档还提醒，打开的 DevTools 版本由手机上的 Chrome 版本决定，手机上的 Chrome 很旧时，界面可能和平常看到的差别很大。</p>
<h2>App 里的 WebView 为什么看不到</h2>
<p>读者常遇到的情况是，手机浏览器里的页面能看到，嵌在自家 App 里的同一个页面却不出现。原因是 WebView 的调试开关由 App 自己控制，前端改不了，需要原生开发配合。</p>
<p>Android 这边，Chrome 文档要求在 App 里调用 <code>WebView</code> 类的静态方法 <code>setWebContentsDebuggingEnabled</code>，这个设置对 App 里所有 WebView 生效，之后它们会出现在 <code>chrome://inspect</code> 里：</p>
<div class="not-prose code-block"><div class="code-language">java</div><pre><code class="hljs language-java">if (Build.VERSION.SDK_INT &gt;= Build.VERSION_CODES.KITKAT) {
    WebView.setWebContentsDebuggingEnabled(true);
}
</code></pre></div>
<p>文档特别提到，这个开关不受清单文件里 <code>debuggable</code> 标记的影响。所以如果只想在调试包里开启，要在运行时自己判断 <code>debuggable</code>，否则线上包也能被调试。</p>
<p>iOS 这边，WebKit 博客说明，从 iOS 16.4 和 macOS 13.3 起，<code>WKWebView</code> 和 <code>JSContext</code> 新增了 <code>isInspectable</code> 属性，默认是 <code>false</code>，App 要逐个设置成 <code>true</code> 才能在 Safari 里检查。用早于这个版本的 SDK 构建的 App 保持旧行为：从 Xcode 以调试方式构建时始终可以检查。</p>
<div class="not-prose code-block"><div class="code-language">swift</div><pre><code class="hljs language-swift">if #available(iOS 16.4, *) {
    webView.isInspectable = true
}
</code></pre></div>
<h2>连不上电脑时怎么办</h2>
<p>有时候手边没有 Mac，或者问题只出现在用户的手机、某个第三方 App 里，就没办法接开发者工具。这时可以把调试面板直接放进页面。vConsole 是腾讯开源的移动端调试面板，官方仓库列出的功能有日志、网络请求（XMLHttpRequest、Fetch、sendBeacon）、元素树、Cookie 与本地存储，以及手动执行 JS 命令；仓库还说明它是微信小程序的官方调试工具。Eruda 的定位是“移动浏览器里的控制台”，同样通过一段脚本引入。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">import</span> <span class="hljs-title class_">VConsole</span> <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;vconsole&#x27;</span>;

<span class="hljs-keyword">const</span> vConsole = <span class="hljs-keyword">new</span> <span class="hljs-title class_">VConsole</span>();
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;Hello world&#x27;</span>);
vConsole.<span class="hljs-title function_">destroy</span>();
</code></pre></div>
<p>上面是 vConsole 官方 README 的用法：创建实例后，<code>console</code> 的输出就会显示在页面上的面板里，调试结束调用 <code>destroy()</code> 移除。Eruda 的用法类似，引入脚本后调用 <code>eruda.init()</code>。</p>
<p>它们和前两种方式的区别在于，面板运行在页面内部，只能看到页面里的 JavaScript 能拿到的信息，不能像 DevTools 那样单步调试、查看完整的性能记录。另外，面板会让用户看到日志和存储内容，所以一般通过环境变量或 URL 参数只在测试环境加载。</p>
<h2>常见追问</h2>
<p><strong><code>chrome://inspect</code> 里看不到 App 里的 WebView，先查什么？</strong></p>
<blockquote>
<p>先确认 App 调用了 <code>WebView.setWebContentsDebuggingEnabled(true)</code>。Chrome 文档的排查建议是：确认开关已经打开，然后在手机上打开包含这个 WebView 的页面，再刷新 <code>chrome://inspect</code>。</p>
</blockquote>
<p><strong>iOS 上 App 内的页面在 Safari 开发菜单里不出现，为什么？</strong></p>
<blockquote>
<p>如果 App 用 iOS 16.4 及以后的 SDK 构建，<code>WKWebView</code> 默认不可检查，需要原生代码把 <code>isInspectable</code> 设成 <code>true</code>。另外还要确认手机上已经打开了网页检查器，并且信任了这台 Mac。</p>
</blockquote>
<p><strong>vConsole 能不能一直留在线上，方便排查用户问题？</strong></p>
<blockquote>
<p>不建议。面板会把日志、Cookie 和本地存储展示出来，任何拿到页面的人都能看到。常见做法是只在测试环境加载，或者用只有内部人员知道的开关动态加载，排查完关闭。</p>
</blockquote>`};export{e as default};