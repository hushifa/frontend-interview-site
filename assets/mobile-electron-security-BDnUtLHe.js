var e={answerHtml:`<h2>简答</h2>
<ul>
<li>主进程运行 Node.js，能访问文件系统和操作系统；渲染进程显示网页内容，应当只有普通网页的权限。</li>
<li>渲染进程通过 preload 脚本用 <code>contextBridge</code> 暴露少量明确的函数，再由主进程经 IPC 执行特权操作。</li>
<li>保持默认的安全设置：<code>nodeIntegration: false</code>（5.0 起默认）、<code>contextIsolation: true</code>（12.0 起默认）、<code>sandbox: true</code>（20.0 起默认）。</li>
<li>主进程要校验每条 IPC 消息的发送方（<code>senderFrame</code> 的 origin）和参数，不能信任渲染进程传来的任何内容。</li>
<li>用 <code>setWindowOpenHandler</code> 拦截新窗口，外部链接交给系统浏览器打开前要校验协议和地址；用 Fuses 关闭 <code>runAsNode</code> 等打包后不需要的能力。</li>
</ul>
<h2>为什么渲染进程要按&quot;不可信&quot;对待</h2>
<p>渲染进程显示的内容可能包含第三方脚本、用户生成的富文本，或者加载了远程页面。只要出现一处 XSS，攻击者就能执行渲染进程里的任何能力。如果渲染进程能直接调用 <code>require(&#x27;child_process&#x27;)</code>，XSS 就变成了在用户电脑上执行任意命令。</p>
<h2>preload 只暴露最小能力</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// preload.js</span>
<span class="hljs-keyword">const</span> { contextBridge, ipcRenderer } = <span class="hljs-built_in">require</span>(<span class="hljs-string">&#x27;electron&#x27;</span>);

contextBridge.<span class="hljs-title function_">exposeInMainWorld</span>(<span class="hljs-string">&#x27;api&#x27;</span>, {
  <span class="hljs-attr">saveNote</span>: <span class="hljs-function">(<span class="hljs-params">id, text</span>) =&gt;</span> ipcRenderer.<span class="hljs-title function_">invoke</span>(<span class="hljs-string">&#x27;note:save&#x27;</span>, { id, text }),
});
</code></pre></div>
<ul>
<li>暴露具体业务函数，不要暴露 <code>ipcRenderer</code> 本身或通用的 <code>invoke(channel, ...args)</code>，否则页面可以调用任意通道。</li>
<li><code>contextIsolation</code> 让 preload 和页面运行在不同的 JavaScript 上下文，页面无法篡改 preload 中的对象。</li>
</ul>
<h2>主进程校验发送方和参数</h2>
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
<ul>
<li>iframe 和子窗口也能发送 IPC，所以要检查 <code>senderFrame</code>。官方示例比较的是 origin 而不是 URL，因为 <code>about:blank</code>、<code>blob:</code> 等地址看不出实际控制者；frame 已销毁时 <code>senderFrame</code> 为 <code>null</code>。</li>
<li>ID 用白名单格式校验，防止 <code>../../</code> 路径穿越写到任意位置。</li>
<li>示例中的 <code>app://bundle</code> 假设应用用自定义协议加载本地页面，需要和实际加载方式一致。</li>
</ul>
<h2>新窗口和外部链接</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js">win.<span class="hljs-property">webContents</span>.<span class="hljs-title function_">setWindowOpenHandler</span>(<span class="hljs-function">(<span class="hljs-params">{ url }</span>) =&gt;</span> {
  <span class="hljs-keyword">const</span> { protocol, hostname } = <span class="hljs-keyword">new</span> <span class="hljs-title function_">URL</span>(url);
  <span class="hljs-keyword">if</span> (protocol === <span class="hljs-string">&#x27;https:&#x27;</span> &amp;&amp; hostname === <span class="hljs-string">&#x27;docs.example.com&#x27;</span>) {
    <span class="hljs-title function_">setImmediate</span>(<span class="hljs-function">() =&gt;</span> shell.<span class="hljs-title function_">openExternal</span>(url));
  }
  <span class="hljs-keyword">return</span> { <span class="hljs-attr">action</span>: <span class="hljs-string">&#x27;deny&#x27;</span> };
});
</code></pre></div>
<p><code>shell.openExternal</code> 遇到不受信任的地址（如 <code>file:</code> 或自定义协议）可能被用来执行命令，所以只放行明确允许的地址。同样要监听 <code>will-navigate</code>，阻止主窗口被导航到外部页面。</p>
<h2>其他要点</h2>
<ul>
<li>尽量不加载远程内容；必须加载时，用独立的 <code>BrowserWindow</code> 或 <code>WebContentsView</code>，不给它 preload 能力。</li>
<li>为本地页面设置 CSP，限制脚本来源。</li>
<li>使用 <code>@electron/fuses</code> 在打包时关闭 <code>runAsNode</code>、<code>nodeCliInspect</code> 等，防止应用被当作 Node.js 解释器执行任意脚本。</li>
<li>及时升级 Electron，它内置的 Chromium 会持续修复安全漏洞。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li>打开 <code>nodeIntegration</code> 有多危险？它会让该渲染进程不再运行在沙箱中，页面脚本可以直接使用 Node.js API，渲染进程中的任何 XSS 都能执行系统命令。</li>
<li>preload 里能用 Node API 吗？开启沙箱后 preload 只能使用一部分 Electron 和 Node 模块，文件读写等操作应放到主进程。</li>
</ul>`};export{e as default};