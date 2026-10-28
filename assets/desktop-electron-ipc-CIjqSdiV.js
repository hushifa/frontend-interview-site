var e={answerHtml:`<h2>简答</h2>
<ul>
<li>渲染进程需要结果时用 <code>ipcRenderer.invoke</code> 配合主进程的 <code>ipcMain.handle</code>，返回 Promise；只通知不等结果时用 <code>ipcRenderer.send</code> 配合 <code>ipcMain.on</code>。</li>
<li>主进程向渲染进程推送要指定目标窗口，调用 <code>webContents.send</code>，渲染进程用 <code>ipcRenderer.on</code> 接收；这个方向没有对应的 <code>invoke</code>。</li>
<li>渲染进程之间没有直接通道，可以由主进程转发，或由主进程分发一对 <code>MessagePort</code> 让它们直接通信。</li>
<li>preload 通过 <code>contextBridge</code> 只暴露具体的业务函数，不暴露 <code>ipcRenderer</code> 本身；监听回调要包一层，避免把 <code>event</code> 对象传给页面。</li>
<li>IPC 数据使用结构化克隆算法，DOM 对象、<code>BrowserWindow</code> 等由 C++ 支撑的对象不能传递；<code>sendSync</code> 会阻塞渲染进程，官方建议避免使用。</li>
</ul>
<h2>四种通信模式</h2>
<p><strong>1. 渲染进程 → 主进程，单向</strong></p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// preload.js</span>
contextBridge.<span class="hljs-title function_">exposeInMainWorld</span>(<span class="hljs-string">&#x27;api&#x27;</span>, {
  <span class="hljs-attr">setTitle</span>: <span class="hljs-function">(<span class="hljs-params">title</span>) =&gt;</span> ipcRenderer.<span class="hljs-title function_">send</span>(<span class="hljs-string">&#x27;window:set-title&#x27;</span>, title),
});

<span class="hljs-comment">// main.js</span>
ipcMain.<span class="hljs-title function_">on</span>(<span class="hljs-string">&#x27;window:set-title&#x27;</span>, <span class="hljs-function">(<span class="hljs-params">event, title</span>) =&gt;</span> {
  <span class="hljs-title class_">BrowserWindow</span>.<span class="hljs-title function_">fromWebContents</span>(event.<span class="hljs-property">sender</span>)?.<span class="hljs-title function_">setTitle</span>(<span class="hljs-title class_">String</span>(title));
});
</code></pre></div>
<p><strong>2. 渲染进程 → 主进程，双向</strong></p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// preload.js</span>
contextBridge.<span class="hljs-title function_">exposeInMainWorld</span>(<span class="hljs-string">&#x27;api&#x27;</span>, {
  <span class="hljs-attr">openFile</span>: <span class="hljs-function">() =&gt;</span> ipcRenderer.<span class="hljs-title function_">invoke</span>(<span class="hljs-string">&#x27;dialog:open-file&#x27;</span>),
});

<span class="hljs-comment">// main.js</span>
ipcMain.<span class="hljs-title function_">handle</span>(<span class="hljs-string">&#x27;dialog:open-file&#x27;</span>, <span class="hljs-title function_">async</span> () =&gt; {
  <span class="hljs-keyword">const</span> { canceled, filePaths } = <span class="hljs-keyword">await</span> dialog.<span class="hljs-title function_">showOpenDialog</span>({});
  <span class="hljs-keyword">return</span> canceled ? <span class="hljs-literal">null</span> : filePaths[<span class="hljs-number">0</span>];
});
</code></pre></div>
<p><code>invoke</code> 从 Electron 7 开始提供，官方推荐尽量使用它。handler 中抛出的错误会被序列化，渲染进程只能拿到 <code>message</code>，需要错误码时应在返回值里显式约定。</p>
<p>旧写法 <code>send</code> + <code>event.reply</code> 需要另外注册监听器，也没有内置机制把响应和请求对应起来；<code>sendSync</code> 在主进程回复前会阻塞渲染进程。</p>
<p><strong>3. 主进程 → 渲染进程</strong></p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// main.js</span>
win.<span class="hljs-property">webContents</span>.<span class="hljs-title function_">send</span>(<span class="hljs-string">&#x27;menu:zoom&#x27;</span>, <span class="hljs-number">1</span>);

<span class="hljs-comment">// preload.js</span>
contextBridge.<span class="hljs-title function_">exposeInMainWorld</span>(<span class="hljs-string">&#x27;api&#x27;</span>, {
  <span class="hljs-attr">onZoom</span>: <span class="hljs-function">(<span class="hljs-params">callback</span>) =&gt;</span> {
    <span class="hljs-keyword">const</span> <span class="hljs-title function_">listener</span> = (<span class="hljs-params">_event, value</span>) =&gt; <span class="hljs-title function_">callback</span>(value);
    ipcRenderer.<span class="hljs-title function_">on</span>(<span class="hljs-string">&#x27;menu:zoom&#x27;</span>, listener);
    <span class="hljs-keyword">return</span> <span class="hljs-function">() =&gt;</span> ipcRenderer.<span class="hljs-title function_">removeListener</span>(<span class="hljs-string">&#x27;menu:zoom&#x27;</span>, listener);
  },
});
</code></pre></div>
<p>不要写成 <code>ipcRenderer.on(&#x27;menu:zoom&#x27;, callback)</code>：回调的第一个参数是 <code>event</code>，可以通过 <code>event.sender</code> 拿到 <code>ipcRenderer</code>，等于把整个 IPC 能力交给了页面。返回取消函数可以让组件卸载时移除监听，避免重复注册和内存泄漏。</p>
<p><strong>4. 渲染进程 ↔ 渲染进程</strong></p>
<p>主进程用 <code>MessageChannelMain</code> 创建一对端口，通过 <code>webContents.postMessage</code> 分别发给两个窗口，之后两个窗口直接收发消息，不再经过主进程转发。utility 进程也可以用同样的方式和渲染进程直连。</p>
<h2>接口设计建议</h2>
<ul>
<li><strong>按业务命名</strong>：通道名用 <code>领域:动作</code> 的形式（如 <code>note:save</code>），前缀只是为了可读，Electron 不会据此做任何处理。</li>
<li><strong>窄接口</strong>：每个能力一个函数，参数固定，不暴露 <code>invoke(channel, ...args)</code> 这种通用转发。</li>
<li><strong>集中声明</strong>：把通道名、参数和返回值类型放在一个共享的 TypeScript 文件里，主进程、preload 和页面共用，避免拼写不一致。</li>
<li><strong>只传可序列化数据</strong>：IPC 使用结构化克隆，<code>Element</code>、<code>process.env</code>、<code>WebContents</code>、<code>BrowserWindow</code> 等对象无法传递，函数也不能跨进程调用。传大文件时优先传路径或分块处理。</li>
<li><strong>主进程不信任输入</strong>：每个 handler 校验发送方和参数，具体做法见<a href="/questions/mobile-electron-security/">《Electron 应用的主进程、渲染进程和 IPC 有哪些安全边界？》</a>。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li>为什么不直接用 <code>@electron/remote</code>？它让渲染进程同步调用主进程对象，既有性能问题，也扩大了渲染进程的权限，官方性能指南建议避免使用。</li>
<li>多个窗口同时调用同一个 handler 怎么区分？handler 的 <code>event.sender</code> 和 <code>event.senderFrame</code> 标识了调用方，可以据此找到对应窗口或校验来源。进程职责划分见<a href="/questions/desktop-electron-process/">《Electron 的主进程、渲染进程、preload 和 utility 进程分别负责什么？》</a>。</li>
</ul>`};export{e as default};