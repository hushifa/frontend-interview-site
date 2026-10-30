var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>一个 Electron 应用跑起来，其实是好几个进程。主进程每个应用只有一个，运行在 Node.js 环境里，负责应用的生命周期（<code>app</code>）、创建和管理窗口（<code>BrowserWindow</code>），以及菜单、对话框、托盘这些原生能力。</p>
<p>每个窗口里的网页跑在自己的渲染进程里，按 Web 标准运行 HTML、CSS 和 JS，默认不能用 <code>require</code> 和 Node.js API。页面要用系统能力怎么办？靠 preload 脚本。它在页面内容加载前运行在渲染进程里，通过 <code>contextBridge.exposeInMainWorld</code> 把有限的几个 API 暴露给页面；开启沙箱后，它只能 <code>require</code> <code>electron</code> 模块里的一部分 API。</p>
<p>还有 utility 进程，由主进程用 <code>utilityProcess.fork</code> 创建，拥有完整的 Node.js 能力，接口和 <code>child_process.fork</code> 相似，还能通过 <code>MessagePort</code> 和渲染进程直接通信。CPU 密集的任务、不可信的服务、容易崩溃的组件，都适合放在这里。</p>
<p>进程之间通过 IPC 或 <code>MessagePort</code> 通信。要注意的是主进程必须保持空闲，不能在里面做长时间的同步计算。</p>
</blockquote>
<h2>Electron 为什么是多进程</h2>
<p>Electron 继承了 Chromium 的多进程架构。Chromium 把每个页面放进单独的渲染进程，一个页面卡死或崩溃，不会拖垮整个浏览器。Electron 在这个基础上，加了一个运行 Node.js 的主进程来管理整个应用。</p>
<h2>主进程做什么</h2>
<p>应用入口，也就是 <code>package.json</code> 里的 <code>main</code>，在主进程执行，可以使用全部 Node.js API。</p>
<p>主进程用 <code>BrowserWindow</code> 创建窗口，每个窗口在独立的渲染进程里加载页面，主进程通过窗口的 <code>webContents</code> 控制它。窗口销毁时，对应的渲染进程也会结束。退出、Dock 图标这些生命周期行为通过 <code>app</code> 模块控制，原生界面通过 <code>Menu</code>、<code>dialog</code>、<code>Tray</code> 等模块使用。</p>
<p>所有窗口的事件分发和进程间通信都经过主进程。所以它一旦被阻塞，整个应用的所有窗口都会失去响应。</p>
<h2>渲染进程做什么</h2>
<p>渲染进程的代码和普通网页一样：入口是 HTML，用 <code>&lt;script&gt;</code> 加载 JS，用打包工具引入 npm 包。</p>
<p>出于安全考虑，渲染进程默认不再拥有 Node.js 能力。<code>nodeIntegration</code> 默认关闭，沙箱自 Electron 20 起默认开启。</p>
<h2>preload 脚本怎样把能力交给页面</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// main.js</span>
<span class="hljs-keyword">new</span> <span class="hljs-title class_">BrowserWindow</span>({
  <span class="hljs-attr">webPreferences</span>: { <span class="hljs-attr">preload</span>: path.<span class="hljs-title function_">join</span>(__dirname, <span class="hljs-string">&#x27;preload.js&#x27;</span>) },
});

<span class="hljs-comment">// preload.js</span>
<span class="hljs-keyword">const</span> { contextBridge, ipcRenderer } = <span class="hljs-built_in">require</span>(<span class="hljs-string">&#x27;electron&#x27;</span>);
contextBridge.<span class="hljs-title function_">exposeInMainWorld</span>(<span class="hljs-string">&#x27;api&#x27;</span>, {
  <span class="hljs-attr">openFile</span>: <span class="hljs-function">() =&gt;</span> ipcRenderer.<span class="hljs-title function_">invoke</span>(<span class="hljs-string">&#x27;dialog:openFile&#x27;</span>),
});
</code></pre></div>
<p>页面里调用 <code>window.api.openFile()</code>，preload 再通过 IPC 交给主进程。</p>
<p>你可能会问，preload 直接给 <code>window.api</code> 赋值不就行了？不行。<code>contextIsolation</code> 默认开启，preload 和页面处在两个不同的 JS 上下文里，preload 直接改 <code>window</code>，页面是看不到的，必须通过 <code>contextBridge</code> 暴露。</p>
<p>沙箱模式下，preload 只能 <code>require(&#x27;electron&#x27;)</code>，可用的有 <code>contextBridge</code>、<code>crashReporter</code>、<code>ipcRenderer</code>、<code>nativeImage</code>、<code>webFrame</code>、<code>webUtils</code>，不能用 Node.js 内置模块。所以文件读写这类操作，要通过 IPC 交给主进程。</p>
<h2>utility 进程适合做什么</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// main.js，需要在 app 的 ready 事件之后调用</span>
<span class="hljs-keyword">const</span> { utilityProcess } = <span class="hljs-built_in">require</span>(<span class="hljs-string">&#x27;electron&#x27;</span>);

<span class="hljs-keyword">const</span> child = utilityProcess.<span class="hljs-title function_">fork</span>(path.<span class="hljs-title function_">join</span>(__dirname, <span class="hljs-string">&#x27;worker.js&#x27;</span>), [], {
  <span class="hljs-attr">serviceName</span>: <span class="hljs-string">&#x27;Image Worker&#x27;</span>,
});
child.<span class="hljs-title function_">postMessage</span>({ <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;resize&#x27;</span>, file });
child.<span class="hljs-title function_">on</span>(<span class="hljs-string">&#x27;message&#x27;</span>, <span class="hljs-function">(<span class="hljs-params">result</span>) =&gt;</span> { <span class="hljs-comment">/* 处理结果 */</span> });
child.<span class="hljs-title function_">on</span>(<span class="hljs-string">&#x27;exit&#x27;</span>, <span class="hljs-function">(<span class="hljs-params">code</span>) =&gt;</span> { <span class="hljs-comment">/* 崩溃或退出后决定是否重启 */</span> });

<span class="hljs-comment">// worker.js</span>
process.<span class="hljs-property">parentPort</span>.<span class="hljs-title function_">on</span>(<span class="hljs-string">&#x27;message&#x27;</span>, <span class="hljs-function">(<span class="hljs-params">e</span>) =&gt;</span> {
  process.<span class="hljs-property">parentPort</span>.<span class="hljs-title function_">postMessage</span>(<span class="hljs-title function_">doHeavyWork</span>(e.<span class="hljs-property">data</span>));
});
</code></pre></div>
<p>utility 进程基于 Chromium 的 Services API 启动，接口和 <code>child_process.fork</code> 相似。和 <code>child_process.fork</code> 相比，主要区别是它可以通过 <code>MessagePort</code> 和渲染进程直接建立通信通道。</p>
<p><code>serviceName</code> 会出现在 <code>app.getAppMetrics()</code> 和 <code>child-process-gone</code> 事件里，方便监控和定位是哪个进程出了问题。另外，utility 进程只有 stdout 和 stderr 可以配置，stdin 必须是 <code>ignore</code>。</p>
<h2>一个任务该放在哪个进程</h2>
<table><thead><tr><th>任务</th><th>推荐位置</th></tr></thead><tbody><tr><td>界面渲染、交互逻辑</td><td>渲染进程</td></tr><tr><td>页面内的长计算（解析、压缩）</td><td>渲染进程中的 Web Worker</td></tr><tr><td>文件系统、原生对话框、窗口管理</td><td>主进程，经 IPC 调用</td></tr><tr><td>需要 Node.js 的重计算、第三方原生模块、可能崩溃的服务</td><td>utility 进程</td></tr></tbody></table>
<h2>常见追问</h2>
<p><strong>多个窗口怎么共享状态？</strong></p>
<blockquote>
<p>由主进程或 utility 进程持有状态，再通过 IPC 广播；或者用 <code>MessagePort</code> 让窗口之间直接通信，通信方式见<a href="/questions/desktop-electron-ipc/">《Electron 的 IPC 和 contextBridge 怎样设计？》</a>。</p>
</blockquote>
<p><strong>为什么不在 preload 里直接做文件操作？</strong></p>
<blockquote>
<p>沙箱开启后，preload 拿不到 <code>fs</code>。就算关掉沙箱，把文件能力放进渲染进程也会扩大 XSS 的影响，安全细节见<a href="/questions/mobile-electron-security/">《Electron 应用要做哪些安全配置？nodeIntegration、contextIsolation、sandbox 和 CSP 分别防什么？》</a>。</p>
</blockquote>`};export{e as default};