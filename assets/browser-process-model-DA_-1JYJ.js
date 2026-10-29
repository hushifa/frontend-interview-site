var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>一个标签页崩了，显示“Aw, Snap”，可其他标签页还能正常用，这就是拆分进程的好处。以 Chrome 为例，浏览器主进程管地址栏、导航和权限；渲染进程运行页面的 HTML、CSS 和 JavaScript；另外还有 GPU 进程、网络服务，以及插件或扩展进程。</p>
<p>拆开以后，一个渲染进程崩溃或卡死，只影响它对应的页面。渲染进程还运行在沙箱里，权限受限，页面里的代码就算被攻破，能做的事也有限。</p>
<p>站点隔离更进一步：不同站点的文档放进不同的渲染进程。在桌面 Chromium 里，跨站的 iframe 通常也跑在独立进程里，叫 OOPIF。这是为了防 Spectre 类攻击，因为同源策略只是 JavaScript 层面的检查，挡不住进程内的侧信道读取。</p>
<p>要注意，进程边界按“站点”划分，也就是协议加 eTLD+1，比同源策略的“源”粗一级。<code>a.example.com</code> 和 <code>b.example.com</code> 是同站点，可能共用一个进程。</p>
</blockquote>
<h2>各进程分别负责什么</h2>
<table><thead><tr><th>进程</th><th>负责</th></tr></thead><tbody><tr><td>浏览器主进程</td><td>地址栏、标签页、导航决策、文件和权限访问</td></tr><tr><td>渲染进程</td><td>解析 HTML、样式计算、布局、执行 JavaScript</td></tr><tr><td>GPU 进程</td><td>图层合成和 GPU 绘制</td></tr><tr><td>网络服务</td><td>发起请求、管理缓存和 Cookie</td></tr></tbody></table>
<p>前端写的代码几乎都跑在渲染进程里。主线程上的长任务卡住的是当前渲染进程，所以地址栏和其他标签页仍然能操作。</p>
<p>进程不是越多越好。内存紧张的设备上，浏览器可能让同站点的几个标签页共用一个渲染进程。</p>
<h2>为什么要按站点隔离</h2>
<p>Spectre 类漏洞让同一个进程里的代码，有机会通过侧信道读到进程里的其他数据。同源策略是 JavaScript 层面的检查，它不让你读，但挡不住这种绕过语言层面的读取。</p>
<p>所以 Chrome 干脆把不同站点放进不同进程，数据根本不在一起。再加上 CORB/ORB，阻止跨站的敏感响应进入渲染进程。</p>
<h2>这对前端有什么影响</h2>
<p>跨站 iframe 通常在另一个进程里，所以父页面和 iframe 之间的 <code>postMessage</code> 要跨进程传。接收消息时，要同时校验 <code>event.origin</code>（来自哪个源）和 <code>event.source</code>（来自哪个窗口），再校验消息结构。</p>
<p>只靠子域区分不能获得进程级的隔离，因为 <code>a.example.com</code> 和 <code>b.example.com</code> 是同站点，可能共用进程。</p>
<p><code>SharedArrayBuffer</code> 这类高精度能力，要求页面处于跨源隔离状态，也就是配置 COOP 和 COEP，见<a href="/questions/browser-cross-origin-isolation/">《crossOriginIsolated 为 true 需要哪些条件？》</a>。</p>
<h2>OOPIF 是怎么拼成一个页面的</h2>
<p>OOPIF 是 out-of-process iframe 的缩写，指在宿主页面之外的渲染进程里运行的子框架。宿主进程负责它在布局里的位置，子框架进程负责它自己的内容，最后由浏览器合成画面。用户看到的仍是一个完整的页面。</p>
<p>容易误解的是 COOP、COEP 和 iframe 的 <code>sandbox</code>，它们都不是进程开关。COOP 影响顶层页面的 opener 关系和浏览上下文分组，COEP 约束能嵌入哪些跨源资源，<code>sandbox</code> 限制 iframe 能做什么。设了这些头，不能推出具体用了哪个进程；反过来，iframe 跑在独立进程里，也不代表 <code>crossOriginIsolated</code> 是 <code>true</code>。</p>
<p>分了进程也不代表性能互不影响。iframe 仍然和主页面抢 CPU、内存和 GPU，诊断时要看成本落在哪个进程。</p>
<h2>排查时怎么用</h2>
<p>Chrome 菜单 → 更多工具 → 任务管理器，能看到每个标签页和 iframe 的进程，以及它们各自的内存和 CPU。</p>
<p>页面出现 “Aw, Snap” 时，通常是对应的渲染进程内存耗尽或者崩溃了，其他标签页不受影响。</p>
<h2>常见追问</h2>
<p><strong>进程拆这么多，会不会很耗内存？</strong></p>
<blockquote>
<p>会。所以浏览器在低内存设备上会合并进程，或者丢弃后台标签页来省内存。</p>
</blockquote>
<p><strong>合成线程和主线程是什么关系？</strong></p>
<blockquote>
<p>两者都在渲染进程里。只改 <code>transform</code> 的动画可以由合成线程完成，所以主线程很忙的时候，这类动画仍然流畅。</p>
</blockquote>`};export{e as default};