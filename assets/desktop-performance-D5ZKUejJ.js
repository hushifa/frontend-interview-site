var e={answerHtml:`<h2>简答</h2>
<ul>
<li>先测量再优化：渲染进程用 Chrome DevTools 的 Performance 和 Memory 面板，跨进程问题用 Chrome Tracing 或 <code>contentTracing</code>，按进程查看资源用 <code>app.getAppMetrics()</code>。</li>
<li>启动慢常见原因是启动时同步加载大量模块和做初始化。把 <code>require</code> 推迟到真正用到的地方，用打包工具合并代码，自定义菜单时在 <code>ready</code> 前调用 <code>Menu.setApplicationMenu(null)</code>。</li>
<li>主进程负责窗口和 IPC，一旦阻塞所有窗口都会卡住。不在主进程做同步 I/O 和长计算，避免 <code>sendSync</code> 和 <code>@electron/remote</code>，重任务交给 utility 进程。</li>
<li>渲染卡顿按网页性能的方法处理：长任务放 Web Worker，低优先级任务用 <code>requestIdleCallback</code>，减少不必要的 polyfill 和网络请求。</li>
<li>内存问题先按进程定位，再用堆快照找出未释放的窗口、监听器和缓存；隐藏的窗口和多余的渲染进程同样占用内存。</li>
</ul>
<h2>测量工具</h2>
<ul>
<li><strong>DevTools</strong>：每个渲染进程都可以打开 DevTools，Performance 面板看长任务和渲染，Memory 面板拍堆快照。</li>
<li><strong>主进程调试</strong>：用 <code>--inspect</code> 启动后，在 Chrome 的 <code>chrome://inspect</code> 中连接主进程，进行 CPU 分析。</li>
<li><strong>跨进程追踪</strong>：<code>contentTracing.startRecording</code> 和 <code>stopRecording</code> 可以记录所有进程的追踪数据，适合分析启动阶段多个进程之间的等待关系。追踪文件的格式和查看工具随 Electron 版本变化，以当前版本文档为准。</li>
<li><strong>按进程统计</strong>：<code>app.getAppMetrics()</code> 返回各进程的 CPU 和内存使用，utility 进程设置 <code>serviceName</code> 后可以在结果中区分。</li>
<li><strong>模块加载成本</strong>：官方建议用 <code>node --cpu-prof --heap-prof -e &quot;require(&#x27;模块名&#x27;)&quot;</code> 测量一个模块被加载时的耗时和内存，再在 DevTools 中打开生成的文件。</li>
</ul>
<h2>启动慢</h2>
<ol>
<li><strong>谨慎引入模块</strong>：官方举过的例子是，一个检测网络连接的模块因依赖链在加载时解析了一个超过十万行的 JSON 文件。引入依赖前先评估它的体积和加载开销。</li>
<li><strong>推迟加载</strong>：把只在某个功能中用到的大模块的 <code>require</code> 移到函数内部，让资源&quot;用到时再分配&quot;。</li>
<li><strong>打包代码</strong>：用 Webpack、Vite、Rollup 等把代码合并成少量文件，减少大量小文件的 <code>require</code> 和磁盘读取开销。</li>
<li><strong>减少默认工作</strong>：自己构建菜单或使用无边框窗口时，在 <code>app</code> 的 <code>ready</code> 之前调用 <code>Menu.setApplicationMenu(null)</code>，省去默认菜单的创建。</li>
<li><strong>避免白屏闪烁</strong>：窗口用 <code>show: false</code> 创建，在 <code>ready-to-show</code> 事件中再调用 <code>win.show()</code>；页面复杂时也可以立即显示窗口，同时设置接近页面底色的 <code>backgroundColor</code>。</li>
<li><strong>本地化资源</strong>：字体等很少变化的资源打包进应用，不在启动时从网络加载。</li>
</ol>
<h2>主进程阻塞</h2>
<p>表现为所有窗口同时无响应、拖动和菜单卡住。</p>
<ul>
<li>文件和子进程操作使用异步 API，例如 <code>fs.promises</code>。</li>
<li>不使用同步 IPC（<code>ipcRenderer.sendSync</code>）和 <code>@electron/remote</code>，它们会让渲染进程等待主进程。</li>
<li>CPU 密集任务交给 Worker Threads 或 utility 进程，进程分工见<a href="/questions/desktop-electron-process/">《Electron 的主进程、渲染进程、preload 和 utility 进程分别负责什么？》</a>。</li>
</ul>
<h2>渲染卡顿</h2>
<p>表现为单个窗口滚动掉帧、输入延迟。</p>
<ul>
<li>长计算放进 Web Worker，小的低优先级任务用 <code>requestIdleCallback</code>。</li>
<li>Electron 内置的 Chromium 版本是确定的，官方建议不要为旧浏览器加 polyfill，转译目标设为当前 Electron 支持的 ECMAScript 版本。</li>
<li>长列表虚拟化，避免频繁触发布局。</li>
<li>高频 IPC 调用会在两端产生序列化开销，合并消息或批量传输。</li>
</ul>
<p><code>backgroundThrottling</code> 默认开启，窗口进入后台时会限制动画和定时器。关闭它可以让后台窗口继续运行，但会增加功耗，而且会影响同一窗口中的所有 webContents。</p>
<h2>内存高</h2>
<ol>
<li>用 <code>app.getAppMetrics()</code> 确认是哪个进程占用高：主进程、某个窗口，还是 GPU 进程。</li>
<li>对渲染进程拍两次堆快照，对比操作前后，查找未释放的 DOM 节点、闭包和缓存。</li>
<li>常见泄漏来源：
<ul>
<li>主进程中保存了已关闭窗口的引用；</li>
<li><code>ipcRenderer.on</code> 在组件每次挂载时注册却从不移除；</li>
<li>全局缓存没有上限。</li>
</ul>
</li>
<li>隐藏而不销毁的窗口仍保留完整的渲染进程。不常用的窗口关闭后重新创建，常用窗口再考虑复用。</li>
</ol>
<h2>常见追问</h2>
<ul>
<li>为什么 Electron 应用比原生应用占内存多？每个窗口都有独立的 Chromium 渲染进程，另外还有主进程和 GPU 等辅助进程。如果内存是首要约束，可以评估其他方案，见<a href="/questions/desktop-electron-tauri/">《Electron 和 Tauri 有什么区别？桌面应用怎么选型？》</a>。</li>
<li>升级 Electron 能提升性能吗？新版 Chromium 和 V8 通常带来性能改进和安全修复，但需要回归测试原生模块和废弃的 API。</li>
</ul>`};export{e as default};