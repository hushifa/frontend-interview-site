var e={answerHtml:`<h2>简答</h2>
<ul>
<li>主进程每个应用只有一个，运行在 Node.js 环境，负责应用生命周期（<code>app</code>）、创建和管理窗口（<code>BrowserWindow</code>）以及菜单、对话框、托盘等原生能力。</li>
<li>每个 <code>BrowserWindow</code> 和网页嵌入都有自己的渲染进程，按 Web 标准运行 HTML、CSS 和 JS，默认不能直接使用 <code>require</code> 和 Node.js API。</li>
<li>preload 脚本在页面内容加载前运行在渲染进程中，借助 <code>contextBridge.exposeInMainWorld</code> 把有限的 API 暴露给页面；开启沙箱后它只能 <code>require</code> <code>electron</code> 模块中的一部分 API。</li>
<li>utility 进程由主进程通过 <code>utilityProcess.fork</code> 创建，拥有完整 Node.js 能力，适合 CPU 密集任务、不可信服务和容易崩溃的组件，接口和 <code>child_process.fork</code> 相似，还能通过 <code>MessagePort</code> 和渲染进程直接通信。</li>
<li>进程之间通过 IPC 或 <code>MessagePort</code> 通信，主进程要保持空闲，不在主进程里做长时间同步计算。</li>
</ul>
<h2>Electron 为什么是多进程</h2>
<p>Electron 继承了 Chromium 的多进程架构。Chromium 把每个页面放进单独的渲染进程，一个页面卡死或崩溃不会拖垮整个浏览器。Electron 在此基础上增加了一个运行 Node.js 的主进程来管理整个应用。</p>
<h2>主进程</h2>
<ul>
<li>应用入口（<code>package.json</code> 的 <code>main</code>）在主进程执行，可以使用全部 Node.js API。</li>
<li>用 <code>BrowserWindow</code> 创建窗口，每个窗口在独立的渲染进程中加载页面，主进程通过窗口的 <code>webContents</code> 控制它。窗口销毁时对应的渲染进程也会结束。</li>
<li>通过 <code>app</code> 模块控制退出、Dock 图标等生命周期行为，通过 <code>Menu</code>、<code>dialog</code>、<code>Tray</code> 等模块使用原生界面。</li>
</ul>
<p>主进程负责所有窗口的事件分发和进程间通信，它一旦被阻塞，整个应用的窗口都会失去响应。</p>
<h2>渲染进程</h2>
<p>渲染进程的代码和普通网页一样：入口是 HTML，用 <code>&lt;script&gt;</code> 加载 JS，用打包工具引入 npm 包。出于安全原因，渲染进程默认不再拥有 Node.js 能力，<code>nodeIntegration</code> 默认关闭，沙箱自 Electron 20 起默认开启。</p>
<h2>preload 脚本</h2>
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
<ul>
<li><code>contextIsolation</code> 默认开启，preload 和页面处在不同的 JS 上下文，直接给 <code>window</code> 赋值页面看不到，需要通过 <code>contextBridge</code> 暴露。</li>
<li>沙箱模式下 preload 只能 <code>require(&#x27;electron&#x27;)</code>，可用的有 <code>contextBridge</code>、<code>crashReporter</code>、<code>ipcRenderer</code>、<code>nativeImage</code>、<code>webFrame</code>、<code>webUtils</code>，不能用 Node.js 内置模块。文件读写等操作通过 IPC 交给主进程。</li>
</ul>
<h2>utility 进程</h2>
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
<ul>
<li>utility 进程基于 Chromium 的 Services API 启动，接口和 <code>child_process.fork</code> 相似。和 <code>child_process.fork</code> 相比，主要区别是它可以通过 <code>MessagePort</code> 和渲染进程直接建立通信通道。</li>
<li><code>serviceName</code> 会出现在 <code>app.getAppMetrics()</code> 和 <code>child-process-gone</code> 事件中，方便监控和定位。</li>
<li>只有 stdout 和 stderr 可以配置，stdin 必须是 <code>ignore</code>。</li>
</ul>
<h2>怎么选择执行位置</h2>
<table><thead><tr><th>任务</th><th>推荐位置</th></tr></thead><tbody><tr><td>界面渲染、交互逻辑</td><td>渲染进程</td></tr><tr><td>页面内的长计算（解析、压缩）</td><td>渲染进程中的 Web Worker</td></tr><tr><td>文件系统、原生对话框、窗口管理</td><td>主进程，经 IPC 调用</td></tr><tr><td>需要 Node.js 的重计算、第三方原生模块、可能崩溃的服务</td><td>utility 进程</td></tr></tbody></table>
<h2>常见追问</h2>
<ul>
<li>多个窗口怎么共享状态？由主进程或 utility 进程持有状态，再通过 IPC 广播，或者用 <code>MessagePort</code> 让窗口之间直接通信，通信方式见<a href="/questions/desktop-electron-ipc/">《Electron 的 IPC 怎么设计？invoke/handle、send/on 和 contextBridge 如何配合？》</a>。</li>
<li>为什么不在 preload 里直接做文件操作？沙箱开启后 preload 拿不到 <code>fs</code>；即使关闭沙箱，把文件能力放进渲染进程也会扩大 XSS 的影响，安全细节见<a href="/questions/mobile-electron-security/">《Electron 应用的主进程、渲染进程和 IPC 有哪些安全边界？》</a>。</li>
</ul>`};export{e as default};