var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>Electron 应用里有两种权限差别很大的进程。主进程运行 Node.js，能读写文件、执行命令；渲染进程显示网页，应该只有普通网页那点权限。安全的关键，就是不让渲染进程拿到主进程的能力。</p>
<p>页面需要特权操作时，由 preload 脚本用 <code>contextBridge</code> 暴露几个明确的函数，再经 IPC 交给主进程执行。默认的安全设置要保持住：<code>nodeIntegration: false</code>（5.0 起默认）、<code>contextIsolation: true</code>（12.0 起默认）、<code>sandbox: true</code>（20.0 起默认）。</p>
<p>主进程要把渲染进程当成不可信的，校验每条 IPC 消息的发送方（<code>senderFrame</code> 的 origin）和参数。</p>
<p>另外要管住新窗口和外部链接：用 <code>setWindowOpenHandler</code> 拦截新窗口，交给系统浏览器打开之前先校验协议和地址；打包时用 Fuses 关掉 <code>runAsNode</code> 等不需要的能力。</p>
</blockquote>
<h2>为什么要把渲染进程当成不可信的</h2>
<p>渲染进程显示的内容，可能包含第三方脚本、用户写的富文本，或者加载了远程页面。只要出现一处 XSS，攻击者就能使用渲染进程里的所有能力。</p>
<p>在普通浏览器里，XSS 最多偷 Cookie、改页面。可在 Electron 里，如果渲染进程能直接 <code>require(&#x27;child_process&#x27;)</code>，同样一个 XSS 就变成了在用户电脑上执行任意命令。所以渲染进程的能力越小越好。</p>
<h2>preload 只暴露最小能力</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// preload.js</span>
<span class="hljs-keyword">const</span> { contextBridge, ipcRenderer } = <span class="hljs-built_in">require</span>(<span class="hljs-string">&#x27;electron&#x27;</span>);

contextBridge.<span class="hljs-title function_">exposeInMainWorld</span>(<span class="hljs-string">&#x27;api&#x27;</span>, {
  <span class="hljs-attr">saveNote</span>: <span class="hljs-function">(<span class="hljs-params">id, text</span>) =&gt;</span> ipcRenderer.<span class="hljs-title function_">invoke</span>(<span class="hljs-string">&#x27;note:save&#x27;</span>, { id, text }),
});
</code></pre></div>
<p>页面只能调用 <code>window.api.saveNote</code>，别的什么都做不了。如果暴露的是 <code>ipcRenderer</code> 本身，或者一个通用的 <code>invoke(channel, ...args)</code>，页面就能调用任意通道，等于没设防。</p>
<p><code>contextIsolation</code> 让 preload 和页面运行在不同的 JavaScript 上下文里，页面没法篡改 preload 里的对象。</p>
<h2>主进程怎样校验发送方和参数</h2>
<p>preload 限制了页面能调什么，但主进程不能因此就相信收到的消息。下面的 handler 先查发送方，再查参数：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// main.js</span>
<span class="hljs-keyword">const</span> { ipcMain, app } = <span class="hljs-built_in">require</span>(<span class="hljs-string">&#x27;electron&#x27;</span>);
<span class="hljs-keyword">const</span> path = <span class="hljs-built_in">require</span>(<span class="hljs-string">&#x27;node:path&#x27;</span>);
<span class="hljs-keyword">const</span> fs = <span class="hljs-built_in">require</span>(<span class="hljs-string">&#x27;node:fs&#x27;</span>);

<span class="hljs-keyword">const</span> <span class="hljs-variable constant_">ALLOWED_ORIGINS</span> = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Set</span>([<span class="hljs-string">&#x27;app://bundle&#x27;</span>]);

<span class="hljs-keyword">function</span> <span class="hljs-title function_">isTrustedSender</span>(<span class="hljs-params">event</span>) {
  <span class="hljs-keyword">const</span> frame = event.<span class="hljs-property">senderFrame</span>;
  <span class="hljs-keyword">return</span> frame !== <span class="hljs-literal">null</span> &amp;&amp; <span class="hljs-variable constant_">ALLOWED_ORIGINS</span>.<span class="hljs-title function_">has</span>(frame.<span class="hljs-property">origin</span>);
}

ipcMain.<span class="hljs-title function_">handle</span>(<span class="hljs-string">&#x27;note:save&#x27;</span>, <span class="hljs-title function_">async</span> (event, payload) =&gt; {
  <span class="hljs-keyword">if</span> (!<span class="hljs-title function_">isTrustedSender</span>(event)) <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">&#x27;拒绝来自未知页面的请求&#x27;</span>);

  <span class="hljs-keyword">const</span> { id, text } = payload ?? {};
  <span class="hljs-keyword">if</span> (<span class="hljs-keyword">typeof</span> id !== <span class="hljs-string">&#x27;string&#x27;</span> || !<span class="hljs-regexp">/^[a-z0-9-]{1,64}$/</span>.<span class="hljs-title function_">test</span>(id)) <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">&#x27;非法 ID&#x27;</span>);
  <span class="hljs-keyword">if</span> (<span class="hljs-keyword">typeof</span> text !== <span class="hljs-string">&#x27;string&#x27;</span> || text.<span class="hljs-property">length</span> &gt; <span class="hljs-number">100_000</span>) <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">&#x27;非法内容&#x27;</span>);

  <span class="hljs-keyword">const</span> file = path.<span class="hljs-title function_">join</span>(app.<span class="hljs-title function_">getPath</span>(<span class="hljs-string">&#x27;userData&#x27;</span>), <span class="hljs-string">&#x27;notes&#x27;</span>, <span class="hljs-string">\`<span class="hljs-subst">\${id}</span>.md\`</span>);
  <span class="hljs-keyword">await</span> fs.<span class="hljs-property">promises</span>.<span class="hljs-title function_">writeFile</span>(file, text, <span class="hljs-string">&#x27;utf8&#x27;</span>);
});
</code></pre></div>
<p>为什么要查发送方？因为 iframe 和子窗口也能发 IPC，消息不一定来自你自己的页面。官方示例比较的是 origin 而不是 URL，因为 <code>about:blank</code>、<code>blob:</code> 这类地址看不出实际是谁在控制。frame 已经销毁时，<code>senderFrame</code> 是 <code>null</code>，也要拒绝。</p>
<p>ID 用白名单格式校验，是为了防止 <code>../../</code> 这样的路径穿越，把文件写到任意位置。</p>
<p>示例里的 <code>app://bundle</code> 假设应用用自定义协议加载本地页面，实际使用时要和你的加载方式一致。</p>
<h2>新窗口和外部链接怎么处理</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js">win.<span class="hljs-property">webContents</span>.<span class="hljs-title function_">setWindowOpenHandler</span>(<span class="hljs-function">(<span class="hljs-params">{ url }</span>) =&gt;</span> {
  <span class="hljs-keyword">const</span> { protocol, hostname } = <span class="hljs-keyword">new</span> <span class="hljs-title function_">URL</span>(url);
  <span class="hljs-keyword">if</span> (protocol === <span class="hljs-string">&#x27;https:&#x27;</span> &amp;&amp; hostname === <span class="hljs-string">&#x27;docs.example.com&#x27;</span>) {
    <span class="hljs-title function_">setImmediate</span>(<span class="hljs-function">() =&gt;</span> shell.<span class="hljs-title function_">openExternal</span>(url));
  }
  <span class="hljs-keyword">return</span> { <span class="hljs-attr">action</span>: <span class="hljs-string">&#x27;deny&#x27;</span> };
});
</code></pre></div>
<p>所有新窗口一律拒绝，只有明确允许的地址交给系统浏览器打开。为什么要这么严？因为 <code>shell.openExternal</code> 遇到不受信任的地址，比如 <code>file:</code> 或者自定义协议，可能被利用来执行命令。</p>
<p>同样要监听 <code>will-navigate</code>，阻止主窗口被导航到外部页面。</p>
<h2>其他还要注意什么</h2>
<p>尽量不加载远程内容。必须加载时，放在独立的 <code>BrowserWindow</code> 或 <code>WebContentsView</code> 里，不给它 preload 能力。</p>
<p>给本地页面设置 CSP，限制脚本从哪里加载。</p>
<p>打包时用 <code>@electron/fuses</code> 关闭 <code>runAsNode</code>、<code>nodeCliInspect</code> 等能力，防止应用被当成 Node.js 解释器去执行任意脚本。</p>
<p>及时升级 Electron，它内置的 Chromium 会持续修复安全漏洞。</p>
<h2>常见追问</h2>
<p><strong>打开 <code>nodeIntegration</code> 有多危险？</strong></p>
<blockquote>
<p>它会让这个渲染进程不再运行在沙箱里，页面脚本可以直接使用 Node.js API，渲染进程里任何一个 XSS 都能执行系统命令。</p>
</blockquote>
<p><strong>preload 里能用 Node API 吗？</strong></p>
<blockquote>
<p>开启沙箱后，preload 只能使用一部分 Electron 和 Node 模块，文件读写这类操作应该放到主进程。</p>
</blockquote>`};export{e as default};