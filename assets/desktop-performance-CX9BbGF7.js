var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>排查性能问题，第一步永远是先测量。渲染进程用 Chrome DevTools 的 Performance 和 Memory 面板；跨进程的问题用 Chrome Tracing 或 <code>contentTracing</code>；想看每个进程占了多少资源，用 <code>app.getAppMetrics()</code>。</p>
<p>启动慢，常见原因是启动时同步加载了大量模块、做了太多初始化。办法是把 <code>require</code> 推迟到真正用到的地方，用打包工具合并代码；自己定义菜单的话，在 <code>ready</code> 之前调用 <code>Menu.setApplicationMenu(null)</code>。</p>
<p>卡顿要先分清是哪个进程。主进程负责窗口和 IPC，它一卡所有窗口都卡，所以主进程里不做同步 I/O 和长计算，避免 <code>sendSync</code> 和 <code>@electron/remote</code>，重任务交给 utility 进程。单个窗口卡，就按网页性能的方法处理：长任务放 Web Worker，低优先级任务用 <code>requestIdleCallback</code>，减少不必要的 polyfill 和网络请求。</p>
<p>内存高，先按进程定位是谁，再用堆快照找没释放的窗口、监听器和缓存。要注意，隐藏起来的窗口和多余的渲染进程同样占内存。</p>
</blockquote>
<h2>用什么工具测量</h2>
<p>每个渲染进程都能打开 DevTools，Performance 面板看长任务和渲染，Memory 面板拍堆快照。</p>
<p>主进程不在页面里，怎么调试？用 <code>--inspect</code> 启动应用，再在 Chrome 的 <code>chrome://inspect</code> 里连接主进程，就能做 CPU 分析。</p>
<p>启动阶段经常是几个进程互相等待，单看一个进程看不出问题。<code>contentTracing.startRecording</code> 和 <code>stopRecording</code> 可以记录所有进程的追踪数据，适合分析这种情况。追踪文件的格式和查看工具随 Electron 版本变化，以当前版本文档为准。</p>
<p><code>app.getAppMetrics()</code> 返回各进程的 CPU 和内存使用；utility 进程设置了 <code>serviceName</code> 以后，可以在结果里区分出来。</p>
<p>想知道某个模块加载有多贵，官方建议用 <code>node --cpu-prof --heap-prof -e &quot;require(&#x27;模块名&#x27;)&quot;</code> 测量它被加载时的耗时和内存，再在 DevTools 里打开生成的文件。</p>
<h2>启动慢怎么优化</h2>
<p>引入模块要谨慎。官方举过一个例子：一个检测网络连接的模块，因为依赖链的关系，在加载时解析了一个超过十万行的 JSON 文件。所以引入依赖之前，先评估它的体积和加载开销。</p>
<p>只在某个功能里用到的大模块，把 <code>require</code> 挪到函数内部，让资源用到时再分配。</p>
<p>用 Webpack、Vite、Rollup 等把代码合并成少量文件，可以减少大量小文件的 <code>require</code> 和磁盘读取开销。</p>
<p>减少默认工作。自己构建菜单或者使用无边框窗口时，在 <code>app</code> 的 <code>ready</code> 之前调用 <code>Menu.setApplicationMenu(null)</code>，省掉默认菜单的创建。</p>
<p>避免白屏闪烁。窗口用 <code>show: false</code> 创建，在 <code>ready-to-show</code> 事件里再调用 <code>win.show()</code>；页面复杂时也可以立即显示窗口，同时设一个接近页面底色的 <code>backgroundColor</code>。</p>
<p>字体这类很少变化的资源打包进应用，不要启动时从网络加载。</p>
<h2>主进程被阻塞了怎么办</h2>
<p>主进程阻塞的表现是所有窗口同时没反应，拖动和菜单都卡住。原因是所有窗口的事件和 IPC 都要经过主进程，它一忙别的就全停了。</p>
<p>所以文件和子进程操作要用异步 API，例如 <code>fs.promises</code>。不要用同步 IPC（<code>ipcRenderer.sendSync</code>）和 <code>@electron/remote</code>，它们会让渲染进程等着主进程。CPU 密集的任务交给 Worker Threads 或 utility 进程，进程分工见<a href="/questions/desktop-electron-process/">《Electron 的主进程、渲染进程、preload 和 utility 进程分别负责什么？》</a>。</p>
<h2>单个窗口卡顿怎么办</h2>
<p>渲染卡顿的表现是某一个窗口滚动掉帧、输入有延迟。这和普通网页的性能问题差不多：长计算放进 Web Worker，小的低优先级任务用 <code>requestIdleCallback</code>，长列表做虚拟化，避免频繁触发布局。</p>
<p>有一点是 Electron 特有的。Electron 内置的 Chromium 版本是确定的，所以官方建议不要为旧浏览器加 polyfill，转译目标设为当前 Electron 支持的 ECMAScript 版本。</p>
<p>另外，高频的 IPC 调用会在两端都产生序列化开销，可以合并消息或者批量传输。</p>
<p><code>backgroundThrottling</code> 默认开启，窗口进入后台时会限制动画和定时器。关掉它可以让后台窗口继续运行，但会增加功耗，而且会影响同一窗口里的所有 webContents。</p>
<h2>内存高怎么定位</h2>
<p>先用 <code>app.getAppMetrics()</code> 确认是哪个进程占得多：主进程、某个窗口，还是 GPU 进程。</p>
<p>如果是渲染进程，在操作前后各拍一次堆快照，对比一下，找出没被释放的 DOM 节点、闭包和缓存。常见的泄漏来源有三种：主进程里还保存着已经关闭的窗口的引用；<code>ipcRenderer.on</code> 在组件每次挂载时注册，却从来不移除；全局缓存没有上限。</p>
<p>还有一个容易忽略的点。窗口隐藏了但没销毁，它的渲染进程还完整地留着。不常用的窗口，关掉后需要时再重新创建；常用的窗口，再考虑复用。</p>
<h2>常见追问</h2>
<p><strong>为什么 Electron 应用比原生应用占内存多？</strong></p>
<blockquote>
<p>每个窗口都有一个独立的 Chromium 渲染进程，另外还有主进程和 GPU 等辅助进程。如果内存是首要约束，可以评估其他方案，见<a href="/questions/desktop-electron-tauri/">《Electron 和 Tauri 有什么区别？桌面应用怎么选型？》</a>。</p>
</blockquote>
<p><strong>升级 Electron 能提升性能吗？</strong></p>
<blockquote>
<p>新版 Chromium 和 V8 通常会带来性能改进和安全修复，但升级后要回归测试原生模块和已废弃的 API。</p>
</blockquote>`};export{e as default};