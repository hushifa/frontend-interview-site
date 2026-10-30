var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>在普通浏览器里，XSS 最多偷 Cookie、改页面；在 Electron 里，如果渲染进程能直接用 Node.js，同一个 XSS 就能在用户电脑上执行命令。所以安全配置的目标，是让渲染进程即使被攻破，也只有普通网页那点权限。</p>
<p>第一层是 <code>webPreferences</code> 的三个默认值不要改：<code>nodeIntegration: false</code>（5.0 起默认）让页面用不了 Node API；<code>contextIsolation: true</code>（12.0 起默认）让 preload 和页面分开运行，页面改不了 preload 里的对象；<code>sandbox: true</code>（20.0 起默认）用 Chromium 沙箱限制渲染进程。</p>
<p>第二层是限制页面能加载和跳转到哪里：用 CSP 限制脚本来源，用 <code>will-navigate</code> 阻止主窗口跳到外部页面，用 <code>setWindowOpenHandler</code> 拒绝新窗口，只把校验过的地址交给系统浏览器。</p>
<p>还要注意几处容易漏的地方：本地页面用自定义协议代替 <code>file://</code>，给会加载远程内容的 session 设置权限请求处理器，打包时用 Fuses 关掉 <code>runAsNode</code> 这类不需要的能力，并及时升级 Electron。</p>
</blockquote>
<h2>为什么要把渲染进程当成不可信的</h2>
<p>渲染进程显示的内容，可能包含第三方脚本、用户写的富文本，或者加载了远程页面。只要出现一处 XSS，攻击者就能使用渲染进程里的所有能力。所以每项配置都在回答同一个问题：页面被注入脚本以后，它能做什么。</p>
<p>页面确实需要文件读写这类能力时，正确的做法是由 preload 暴露几个具体的函数，经 IPC 交给主进程执行，主进程再校验发送方和参数。接口怎样写、怎样校验，见<a href="/questions/desktop-electron-ipc/">《Electron 的 IPC 和 contextBridge 怎样设计？》</a>。这里只讲窗口和应用层面的配置。</p>
<h2>webPreferences 里的三个开关</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> win = <span class="hljs-keyword">new</span> <span class="hljs-title class_">BrowserWindow</span>({
  <span class="hljs-attr">webPreferences</span>: {
    <span class="hljs-attr">preload</span>: path.<span class="hljs-title function_">join</span>(__dirname, <span class="hljs-string">&#x27;preload.js&#x27;</span>),
    <span class="hljs-comment">// 下面三项都是当前默认值，写出来是为了防止被改掉</span>
    <span class="hljs-attr">nodeIntegration</span>: <span class="hljs-literal">false</span>,
    <span class="hljs-attr">contextIsolation</span>: <span class="hljs-literal">true</span>,
    <span class="hljs-attr">sandbox</span>: <span class="hljs-literal">true</span>,
  },
});
</code></pre></div>
<p><code>nodeIntegration</code> 打开以后，页面脚本能直接 <code>require(&#x27;child_process&#x27;)</code>。官方要求任何加载远程内容的渲染进程都不能打开它。沙箱文档还说明，设置 <code>nodeIntegration: true</code> 会让这个渲染进程不再运行在沙箱里。</p>
<p><code>contextIsolation</code> 让 preload 脚本和 Electron 的内部逻辑跑在独立的 JavaScript 上下文里。为什么关了 Node 集成还要它？因为如果两边共用一个上下文，页面可以改写 <code>JSON.parse</code> 这类全局对象，进而影响 preload 里的代码。官方还提醒，关掉上下文隔离会同时关掉沙箱，不管 <code>sandbox</code> 写的是什么。</p>
<p><code>sandbox</code> 开启后，preload 里的 <code>require</code> 只能加载 <code>electron</code> 模块的一部分，比如 <code>contextBridge</code>、<code>ipcRenderer</code>，Node 内置模块和 <code>Buffer</code> 这类全局对象都用不了。所以文件读写只能放到主进程。</p>
<p><code>webSecurity</code> 默认开启，不要在生产环境关掉。关掉它会去掉同源策略，还会把 <code>allowRunningInsecureContent</code> 一起打开，让 HTTPS 页面加载 HTTP 脚本。</p>
<h2>用 CSP 限制脚本从哪里来</h2>
<p>CSP（内容安全策略）告诉浏览器，页面只能从哪些地方加载脚本和其他资源。即使攻击者注入了一段 <code>&lt;script src=&quot;https://evil.example/x.js&quot;&gt;</code>，浏览器也会拒绝加载。</p>
<p>官方推荐通过 HTTP 响应头下发 CSP，在 Electron 里可以用 <code>session.defaultSession.webRequest.onHeadersReceived</code> 给响应加上这个头。用 <code>file://</code> 加载的页面没有响应头，只能写在页面的 meta 标签里：</p>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">meta</span> <span class="hljs-attr">http-equiv</span>=<span class="hljs-string">&quot;Content-Security-Policy&quot;</span> <span class="hljs-attr">content</span>=<span class="hljs-string">&quot;default-src &#x27;none&#x27;&quot;</span> /&gt;</span>
</code></pre></div>
<p>规则要尽量严格。官方示例是 <code>script-src &#x27;self&#x27; https://apis.example.com</code>，只允许本地和一个明确的接口域名，而不是 <code>*</code>。</p>
<h2>管住导航和新窗口</h2>
<p>主窗口被导航到外部页面以后，一个不受你控制的页面就运行在这个窗口里，还能用上这个窗口的 preload 暴露的接口。官方把导航列为常见的攻击途径。所以要在 <code>web-contents-created</code> 里统一给所有 webContents 加上限制：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js">app.<span class="hljs-title function_">on</span>(<span class="hljs-string">&#x27;web-contents-created&#x27;</span>, <span class="hljs-function">(<span class="hljs-params">_event, contents</span>) =&gt;</span> {
  contents.<span class="hljs-title function_">on</span>(<span class="hljs-string">&#x27;will-navigate&#x27;</span>, <span class="hljs-function">(<span class="hljs-params">event, navigationUrl</span>) =&gt;</span> {
    <span class="hljs-keyword">if</span> (<span class="hljs-keyword">new</span> <span class="hljs-title function_">URL</span>(navigationUrl).<span class="hljs-property">origin</span> !== <span class="hljs-string">&#x27;app://bundle&#x27;</span>) {
      event.<span class="hljs-title function_">preventDefault</span>();
    }
  });

  contents.<span class="hljs-title function_">setWindowOpenHandler</span>(<span class="hljs-function">(<span class="hljs-params">{ url }</span>) =&gt;</span> {
    <span class="hljs-keyword">const</span> { protocol, hostname } = <span class="hljs-keyword">new</span> <span class="hljs-title function_">URL</span>(url);
    <span class="hljs-keyword">if</span> (protocol === <span class="hljs-string">&#x27;https:&#x27;</span> &amp;&amp; hostname === <span class="hljs-string">&#x27;docs.example.com&#x27;</span>) {
      <span class="hljs-title function_">setImmediate</span>(<span class="hljs-function">() =&gt;</span> shell.<span class="hljs-title function_">openExternal</span>(url));
    }
    <span class="hljs-keyword">return</span> { <span class="hljs-attr">action</span>: <span class="hljs-string">&#x27;deny&#x27;</span> };
  });
});
</code></pre></div>
<p>为什么比较 <code>origin</code>，不用 <code>startsWith(&#x27;https://example.com&#x27;)</code>？因为 <code>https://example.com.attacker.com</code> 也以这个字符串开头。官方建议用 URL 解析器拆出 origin 再比较。</p>
<p>新窗口一律拒绝，只有明确允许的地址交给系统浏览器打开。这么严是因为 <code>shell.openExternal</code> 遇到不受信任的地址可能被利用来执行任意命令，官方要求不要把用户能控制的数据传给它。</p>
<p>示例里的 <code>app://bundle</code> 假设应用用自定义协议加载本地页面，实际使用时要和你的加载方式一致。</p>
<h2>其他容易漏的入口</h2>
<p>本地页面尽量不用 <code>file://</code> 加载。官方说明，<code>file://</code> 页面在 Electron 里有额外的权限，能读取电脑上的任意文件，一处 XSS 就可能泄露本地文件。改用 <code>protocol.handle</code> 注册自定义协议，只提供指定的一组文件。</p>
<p>Electron 默认会自动同意页面的权限请求，比如通知、摄像头。加载远程内容的 session 要用 <code>ses.setPermissionRequestHandler()</code> 自己判断，只批准确实需要的权限。</p>
<p>远程资源只通过 HTTPS、WSS 这类加密协议加载。<code>experimentalFeatures</code> 和 <code>enableBlinkFeatures</code> 默认关闭，官方要求不要凭猜测打开。</p>
<p><code>runAsNode</code>、<code>nodeCliInspect</code> 这类 Fuse 允许通过环境变量或命令行参数改变应用行为，别的程序可以借此用你的应用的权限执行命令。打包时用 <code>@electron/fuses</code> 关掉不需要的。</p>
<p>最后，及时升级 Electron。它内置的 Chromium 会持续修复安全漏洞，官方建议每次升一个大版本。</p>
<h2>常见追问</h2>
<p><strong>打开 <code>nodeIntegration</code> 有多危险？</strong></p>
<blockquote>
<p>页面脚本可以直接使用 Node.js API，这个渲染进程也不再运行在沙箱里。渲染进程里任何一个 XSS 都能读写文件、执行系统命令。</p>
</blockquote>
<p><strong>已经关了 <code>nodeIntegration</code>，为什么还要 <code>contextIsolation</code>？</strong></p>
<blockquote>
<p>因为没有上下文隔离时，页面和 preload 共用全局对象。页面可以改写 <code>JSON.parse</code> 这类内置方法，让 preload 里的代码按攻击者的意思执行。关掉上下文隔离还会让沙箱失效。</p>
</blockquote>
<p><strong>preload 里能用 Node API 吗？</strong></p>
<blockquote>
<p>开启沙箱后不能。preload 的 <code>require</code> 只能加载 <code>electron</code> 模块的一部分，Node 内置模块都不可用，文件读写这类操作应该放到主进程。</p>
</blockquote>`};export{e as default};