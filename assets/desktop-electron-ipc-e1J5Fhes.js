var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>Electron 的页面跑在渲染进程里，打开文件、改窗口标题这些事要交给主进程做，两个进程之间传消息就叫 IPC。页面要等结果时，用 <code>ipcRenderer.invoke</code> 配合主进程的 <code>ipcMain.handle</code>，拿到一个 Promise；只通知不等结果，用 <code>ipcRenderer.send</code> 配合 <code>ipcMain.on</code>。</p>
<p>反过来，主进程推消息给页面，要指定是哪个窗口，调用它的 <code>webContents.send</code>，页面用 <code>ipcRenderer.on</code> 接收，这个方向没有对应的 <code>invoke</code>。两个渲染进程之间没有直接的通道，可以让主进程转发，或者由主进程分发一对 <code>MessagePort</code>，让它们直接通信。</p>
<p>这些能力不是直接给页面的，而是由 preload 脚本通过 <code>contextBridge</code> 暴露几个具体的业务函数。不要把 <code>ipcRenderer</code> 本身暴露出去；监听回调也要包一层，不能把 <code>event</code> 对象交给页面。</p>
<p>要注意，IPC 数据走结构化克隆，DOM 对象、<code>BrowserWindow</code> 这类由 C++ 支撑的对象传不过去。<code>sendSync</code> 会阻塞渲染进程，官方建议避免使用。</p>
</blockquote>
<h2>页面通知主进程，不需要结果</h2>
<p>改窗口标题只是发个通知，用 <code>send</code> 和 <code>on</code> 就够了：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// preload.js</span>
contextBridge.<span class="hljs-title function_">exposeInMainWorld</span>(<span class="hljs-string">&#x27;api&#x27;</span>, {
  <span class="hljs-attr">setTitle</span>: <span class="hljs-function">(<span class="hljs-params">title</span>) =&gt;</span> ipcRenderer.<span class="hljs-title function_">send</span>(<span class="hljs-string">&#x27;window:set-title&#x27;</span>, title),
});

<span class="hljs-comment">// main.js</span>
ipcMain.<span class="hljs-title function_">on</span>(<span class="hljs-string">&#x27;window:set-title&#x27;</span>, <span class="hljs-function">(<span class="hljs-params">event, title</span>) =&gt;</span> {
  <span class="hljs-title class_">BrowserWindow</span>.<span class="hljs-title function_">fromWebContents</span>(event.<span class="hljs-property">sender</span>)?.<span class="hljs-title function_">setTitle</span>(<span class="hljs-title class_">String</span>(title));
});
</code></pre></div>
<p>主进程通过 <code>event.sender</code> 找到是哪个窗口发来的，再改它的标题。页面调用的是 <code>window.api.setTitle</code>，碰不到 <code>ipcRenderer</code>。</p>
<h2>页面调用主进程，并等待结果</h2>
<p>打开文件对话框要拿回用户选的路径，用 <code>invoke</code> 和 <code>handle</code>：</p>
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
<p><code>invoke</code> 从 Electron 7 开始提供，官方推荐尽量用它。handler 的返回值就是页面拿到的 Promise 结果。handler 里抛出的错误会被序列化，页面只能拿到 <code>message</code>，需要错误码的话，要在返回值里自己约定。</p>
<p>那以前是怎么做的？旧写法是 <code>send</code> 加 <code>event.reply</code>，需要另外注册一个监听器收回复，也没有内置机制把响应和请求对上号。<code>sendSync</code> 更不推荐，主进程回复之前，渲染进程会一直卡着。</p>
<h2>主进程主动推消息给页面</h2>
<p>比如用户点了菜单里的缩放，主进程要通知对应的窗口：</p>
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
<p>为什么不直接写 <code>ipcRenderer.on(&#x27;menu:zoom&#x27;, callback)</code>？因为回调的第一个参数是 <code>event</code>，通过 <code>event.sender</code> 能拿到 <code>ipcRenderer</code>，这等于把整个 IPC 能力交给了页面。包一层只把 <code>value</code> 传过去，就没有这个问题。</p>
<p>返回一个取消函数，是为了组件卸载时能移除监听。不然组件每挂载一次就多注册一个，既重复触发又泄漏内存。</p>
<h2>两个窗口之间怎么直接通信</h2>
<p>主进程用 <code>MessageChannelMain</code> 创建一对端口，通过 <code>webContents.postMessage</code> 分别发给两个窗口。之后两个窗口直接收发消息，不再经过主进程转发。utility 进程也可以用同样的方式和渲染进程直连。</p>
<h2>接口应该怎么设计</h2>
<p>通道名按业务来起，用 <code>领域:动作</code> 的形式，比如 <code>note:save</code>。这个前缀只是为了好读，Electron 不会据此做任何处理。</p>
<p>接口要窄。每个能力一个函数，参数固定，不要暴露 <code>invoke(channel, ...args)</code> 这种通用转发，否则页面可以调用任意通道。</p>
<p>通道名、参数和返回值类型最好集中放在一个共享的 TypeScript 文件里，主进程、preload 和页面共用，避免拼写对不上。</p>
<p>只传可序列化的数据。IPC 使用结构化克隆，<code>Element</code>、<code>process.env</code>、<code>WebContents</code>、<code>BrowserWindow</code> 等对象无法传递，函数也不能跨进程调用。传大文件时，优先传路径或者分块处理。</p>
<p>最后，主进程不能信任收到的任何输入，每个 handler 都要校验发送方和参数，具体做法见<a href="/questions/mobile-electron-security/">《Electron 应用的主进程、渲染进程和 IPC 有哪些安全边界？》</a>。</p>
<h2>常见追问</h2>
<p><strong>为什么不直接用 <code>@electron/remote</code>？</strong></p>
<blockquote>
<p>它让渲染进程同步调用主进程里的对象，既有性能问题，也扩大了渲染进程的权限，官方性能指南建议避免使用。</p>
</blockquote>
<p><strong>多个窗口同时调用同一个 handler，怎么区分？</strong></p>
<blockquote>
<p>handler 收到的 <code>event.sender</code> 和 <code>event.senderFrame</code> 标识了调用方，可以据此找到对应窗口，或者校验来源。进程职责划分见<a href="/questions/desktop-electron-process/">《Electron 的主进程、渲染进程、preload 和 utility 进程分别负责什么？》</a>。</p>
</blockquote>`};export{e as default};