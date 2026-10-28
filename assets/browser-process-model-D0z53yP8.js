var e={answerHtml:`<h2>简答</h2>
<ul>
<li>以 Chrome 为例，主要进程有：浏览器主进程（界面、导航、权限）、渲染进程（运行页面的 HTML、CSS、JavaScript）、GPU 进程、网络服务和插件或扩展进程。</li>
<li>拆分进程后，一个渲染进程崩溃或卡死只影响对应的页面，渲染进程还运行在沙箱里，权限受限。</li>
<li>站点隔离（Site Isolation）让不同站点的文档使用不同渲染进程；在桌面 Chromium 中，跨站 iframe 通常运行在独立进程（OOPIF）。</li>
<li>进程边界按&quot;站点&quot;（协议 + eTLD+1）划分，比同源策略的&quot;源&quot;粗一级。</li>
</ul>
<h2>各进程职责</h2>
<table><thead><tr><th>进程</th><th>负责</th></tr></thead><tbody><tr><td>浏览器主进程</td><td>地址栏、标签页、导航决策、文件和权限访问</td></tr><tr><td>渲染进程</td><td>解析 HTML、样式计算、布局、执行 JavaScript</td></tr><tr><td>GPU 进程</td><td>图层合成和 GPU 绘制</td></tr><tr><td>网络服务</td><td>发起请求、管理缓存和 Cookie</td></tr></tbody></table>
<p>内存紧张的设备上，浏览器可能让同站点的多个标签页共用渲染进程。</p>
<h2>站点隔离</h2>
<p>Spectre 类漏洞让同一进程里的代码有机会通过侧信道读到进程内其他数据。同源策略是 JavaScript 层面的检查，挡不住这类攻击，所以 Chrome 把不同站点放进不同进程，再加上 CORB/ORB 阻止跨站的敏感响应进入渲染进程。</p>
<p>对前端的影响：</p>
<ul>
<li>跨站 iframe 通常运行在另一个进程，父页面和 iframe 之间的 <code>postMessage</code> 要跨进程传递。接收方要同时校验 <code>event.origin</code>（来自哪个源）和 <code>event.source</code>（来自哪个窗口），再校验消息结构。</li>
<li><code>a.example.com</code> 和 <code>b.example.com</code> 是同站点，可能共用进程；只靠子域区分不能获得进程级隔离。</li>
<li><code>SharedArrayBuffer</code> 等高精度能力要求跨源隔离（COOP + COEP），见<a href="/questions/browser-cross-origin-isolation/">《crossOriginIsolated 为 true 需要哪些条件？》</a>。</li>
</ul>
<h2>OOPIF 与隔离头</h2>
<p>OOPIF（out-of-process iframe）是在宿主之外的渲染进程里运行的子框架。宿主进程负责它在布局中的位置，子框架进程负责自身内容，浏览器合成最终画面，用户看到的仍是同一个页面。</p>
<p>COOP、COEP 和 iframe <code>sandbox</code> 都不是进程开关：COOP 影响顶层页面的 opener 关系和浏览上下文分组，COEP 约束嵌入的跨源资源，<code>sandbox</code> 限制 iframe 的能力。设置这些头不能推出具体用了哪个进程，iframe 独立进程也不代表 <code>crossOriginIsolated</code> 为 <code>true</code>。</p>
<p>分进程也不代表互不影响性能：iframe 仍和主页面竞争 CPU、内存和 GPU，诊断时要看成本落在哪个进程。</p>
<h2>排查用途</h2>
<ul>
<li>浏览器任务管理器（Chrome 菜单 → 更多工具 → 任务管理器）能看到每个标签页和 iframe 的进程内存与 CPU。</li>
<li>页面出现 &quot;Aw, Snap&quot; 崩溃时，通常是对应渲染进程内存耗尽或崩溃，其他标签页不受影响。</li>
<li>主线程长任务阻塞的是当前渲染进程，地址栏和其他标签页仍然可以操作。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li>进程多会不会很耗内存：会，所以浏览器在低内存设备上会合并进程或丢弃后台标签页。</li>
<li>合成线程和主线程的关系：两者都在渲染进程里，只改 <code>transform</code> 的动画可以由合成线程完成，主线程繁忙时仍然流畅。</li>
</ul>`};export{e as default};