var e={answerHtml:`<h2>简答</h2>
<ul>
<li>Electron 渲染进程拥有系统能力的入口，XSS 可能升级成读文件或执行命令。</li>
<li>主进程管系统能力，渲染进程管 UI，preload 通过受限 API 连接两者。</li>
<li>contextIsolation、关闭 nodeIntegration、sandbox 已是默认值，显式写出防止被改回。</li>
<li>还要拦截新窗口、校验 IPC 的 senderFrame，并用 Fuses 关闭可被利用的能力。</li>
</ul>
<p>Electron 渲染进程看起来像网页，但应用通常还拥有文件系统、进程和系统 API 能力。若把不可信网页直接放进拥有 Node.js 权限的渲染进程，一个 XSS 就可能升级成读取文件或执行命令的问题。</p>
<p>因此要把“显示界面”和“执行高权限操作”分开。主进程管理窗口和系统能力，渲染进程负责 UI，preload 通过受限 API 连接两者。</p>
<h2>默认收紧渲染进程权限</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> win = <span class="hljs-keyword">new</span> <span class="hljs-title class_">BrowserWindow</span>({
  <span class="hljs-attr">webPreferences</span>: {
    <span class="hljs-attr">preload</span>: path.<span class="hljs-title function_">join</span>(__dirname, <span class="hljs-string">&#x27;preload.js&#x27;</span>),
    <span class="hljs-attr">contextIsolation</span>: <span class="hljs-literal">true</span>,
    <span class="hljs-attr">nodeIntegration</span>: <span class="hljs-literal">false</span>,
    <span class="hljs-attr">sandbox</span>: <span class="hljs-literal">true</span>,
  },
});
</code></pre></div>
<p><code>contextIsolation</code> 让 preload 和页面脚本使用不同的 JavaScript 全局环境；<code>nodeIntegration: false</code> 不把 Node 能力直接暴露给网页；sandbox 进一步限制渲染进程。这三项已是默认值：<code>nodeIntegration: false</code> 自 Electron 5、<code>contextIsolation: true</code> 自 12、<code>sandbox: true</code> 自 20 起默认；显式写出是为了防止被改回。注意打开 <code>nodeIntegration</code> 会让该渲染进程的沙箱失效。</p>
<p>官方安全清单还要求：用 <code>setWindowOpenHandler</code> 拒绝意外的新窗口，只把校验过的 URL 交给 <code>shell.openExternal</code>；每个 IPC 处理器校验 <code>event.senderFrame</code>，按 <code>frame.origin</code> 比对白名单而不是看 URL；用 <code>@electron/fuses</code> 关闭 <code>runAsNode</code>、<code>nodeCliInspect</code> 等可被环境变量或命令行参数利用的能力。</p>
<p>不要为了让旧代码运行而打开 <code>nodeIntegration</code>，也不要把完整的 <code>ipcRenderer</code>、<code>remote</code> 或 <code>require</code> 挂到 <code>window</code> 上。页面脚本一旦被注入，就可能调用这些高权限入口。</p>
<h2>preload 只暴露最小、参数化的能力</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// preload.js</span>
<span class="hljs-keyword">const</span> { contextBridge, ipcRenderer } = <span class="hljs-built_in">require</span>(<span class="hljs-string">&#x27;electron&#x27;</span>);

contextBridge.<span class="hljs-title function_">exposeInMainWorld</span>(<span class="hljs-string">&#x27;settings&#x27;</span>, {
  <span class="hljs-attr">chooseFile</span>: <span class="hljs-function">() =&gt;</span> ipcRenderer.<span class="hljs-title function_">invoke</span>(<span class="hljs-string">&#x27;settings:choose-file&#x27;</span>),
  <span class="hljs-attr">saveTheme</span>: <span class="hljs-function">(<span class="hljs-params">theme</span>) =&gt;</span> {
    <span class="hljs-keyword">if</span> (![<span class="hljs-string">&#x27;light&#x27;</span>, <span class="hljs-string">&#x27;dark&#x27;</span>, <span class="hljs-string">&#x27;system&#x27;</span>].<span class="hljs-title function_">includes</span>(theme)) {
      <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">TypeError</span>(<span class="hljs-string">&#x27;主题值无效&#x27;</span>);
    }
    <span class="hljs-keyword">return</span> ipcRenderer.<span class="hljs-title function_">invoke</span>(<span class="hljs-string">&#x27;settings:save-theme&#x27;</span>, theme);
  },
});
</code></pre></div>
<p>这里暴露的是有限的业务函数，不是一个可以传任意频道和任意参数的通用 IPC 代理。主进程仍要验证参数、当前窗口、用户权限和文件路径；渲染进程的校验只能改善错误提示，不能成为安全边界。</p>
<p>主进程处理器也要限制能力：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js">ipcMain.<span class="hljs-title function_">handle</span>(<span class="hljs-string">&#x27;settings:save-theme&#x27;</span>, <span class="hljs-function">(<span class="hljs-params">event, theme</span>) =&gt;</span> {
  <span class="hljs-keyword">if</span> (![<span class="hljs-string">&#x27;light&#x27;</span>, <span class="hljs-string">&#x27;dark&#x27;</span>, <span class="hljs-string">&#x27;system&#x27;</span>].<span class="hljs-title function_">includes</span>(theme)) {
    <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">&#x27;非法主题&#x27;</span>);
  }
  <span class="hljs-keyword">const</span> sender = <span class="hljs-title class_">BrowserWindow</span>.<span class="hljs-title function_">fromWebContents</span>(event.<span class="hljs-property">sender</span>);
  <span class="hljs-keyword">if</span> (!sender) <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">&#x27;未知窗口&#x27;</span>);
  <span class="hljs-keyword">return</span> <span class="hljs-title function_">saveThemeForWindow</span>(sender.<span class="hljs-property">id</span>, theme);
});
</code></pre></div>
<p>IPC 消息是跨边界输入，必须做运行时验证。不要相信频道名称、渲染进程传来的用户 ID 或窗口里隐藏的权限字段；重要操作还要在服务端或主进程的受控配置中确认。</p>
<h2>远程页面和本地页面不能混在同一信任等级</h2>
<p>如果应用加载远程 URL，远程内容可能更新、被劫持或包含第三方脚本。不要让它共享本地页面的高权限 preload；更稳妥的方案是使用独立窗口、严格允许列表、CSP、导航拦截和最小权限。</p>
<p>外部链接应在系统浏览器中打开或经过明确的安全处理，不能允许任意导航到一个仍拥有本地桥接 API 的页面。<code>will-navigate</code>、新窗口和重定向都要处理，不能只检查首次 URL。</p>
<p>Markdown、网页内容和用户输入仍要按不可信内容渲染。Electron 应用不会因为打包成桌面程序就自动免疫 XSS；反而因为权限更大，注入后的影响可能更严重。</p>
<h2>文件、命令和更新都是高风险能力</h2>
<p>主进程若根据渲染进程传来的路径读取文件，必须使用用户选择的句柄、允许目录和规范化检查，避免路径穿越与符号链接问题。调用外部命令时优先使用固定可执行文件和参数数组，不要把输入拼进 shell 字符串。</p>
<p>自动更新要验证下载来源、签名、版本和失败回滚；“有 HTTPS”不等于更新包本身已经可信。更新失败不能让应用陷入无限重试，也不能在未验证的情况下执行下载内容。</p>
<p>日志和崩溃报告要过滤文件路径、令牌和个人数据。桌面应用通常能访问更多本地信息，诊断上报的隐私边界也更大。</p>
<h2>IPC 设计还要考虑生命周期和拒绝服务</h2>
<p>窗口关闭后，渲染进程可能仍有待完成的 IPC；处理器要能识别销毁窗口、取消长任务和释放监听。渲染进程可以快速发送大量消息，因此主进程要限制消息大小、频率和并发，不能让一个窗口占满文件、CPU 或网络资源。</p>
<p>测试要覆盖 XSS 内容、恶意 IPC 参数、导航到外部来源、窗口关闭、文件路径边界、命令失败和更新失败。开发环境中关闭安全选项可能方便调试，但生产配置必须单独验证；Electron 的安全边界来自权限设计和隔离，而不是“它能运行网页”这一事实。</p>`};export{e as default};