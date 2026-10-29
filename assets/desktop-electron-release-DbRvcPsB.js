var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>发布一个 Electron 应用，大致是这几步：先构建前端资源，再把应用代码和 Electron 二进制打包成各平台的应用，然后制作安装包，签名（macOS 还要公证），最后上传到更新源。工具方面，官方推荐 Electron Forge，electron-builder 也很常用。</p>
<p>签名是给应用盖个章，证明它来自谁、没被改过。macOS 上要用 Apple 开发者证书签名，再提交给 Apple 公证；不签名的话，内置 <code>autoUpdater</code> 依赖的 Squirrel.Mac 根本没法自动更新。Windows 上签名是为了减少 SmartScreen 之类的安全警告，Electron 文档介绍了 EV 证书（私钥要放在认证硬件或云签名服务里）和 Azure 云签名服务两类方案。</p>
<p>自动更新有两种选择：Electron 内置的 <code>autoUpdater</code>，基于 Squirrel，支持 macOS 和 Windows；或者 electron-builder 的 electron-updater，额外支持 Linux 和下载进度。</p>
<p>要注意，更新代码只在打包后的应用里运行，用 <code>app.isPackaged</code> 判断。发错了版本，要发一个更高的版本号来覆盖，不能重发同一个版本。</p>
</blockquote>
<h2>打包工具具体做了什么</h2>
<p>打包工具做两件事。</p>
<p>第一件是打包：把应用代码（通常已经用 Vite、Webpack 等打成少量文件）放进 Electron 的 resources 目录，改掉可执行文件名、图标和元数据。代码可以合并成一个 <code>app.asar</code> 归档，在没有使用打包器时，它能改善 Windows 等平台上的文件读取性能。</p>
<p>第二件是制作安装包：生成 DMG、ZIP、NSIS、MSI、DEB、RPM、AppImage 等格式。</p>
<p>Electron Forge 内部集成了 <code>@electron/packager</code>、<code>@electron/osx-sign</code>、<code>@electron/notarize</code>；electron-builder 有自己的一套配置。原生模块要针对目标 Electron 版本重新编译，不同架构（x64、arm64）要分别构建，或者做成通用包。</p>
<h2>macOS 上要做签名和公证</h2>
<p>前提条件有三个：付费的 Apple Developer Program 会员、一台装有 Xcode 的 Mac，以及 Apple 签发的签名证书。</p>
<p>签名证明应用来自谁、没被篡改。还有一个容易忽略的作用：签名身份保持一致，系统才会把新版本认成同一个应用。如果身份变了，<code>safeStorage</code> 和 Cookie 加密可能每次更新后都重新请求钥匙串权限，登录项也可能悄悄失效。</p>
<p>公证是把签好名的应用上传给 Apple 做自动化检查，确认没有危害用户的行为。Forge 通过 <code>@electron/notarize</code> 完成，<code>@electron/packager</code> 也提供 <code>osxNotarize</code> 选项。</p>
<p>Mac App Store 版本有单独的签名和沙箱要求，按官方 MAS 指南处理。</p>
<h2>Windows 上的签名怎么做</h2>
<p>Electron 文档说明，自 2023 年 6 月起，用旧的 OV 证书签名，会得到和没签名一样的警告，需要 EV 证书。EV 证书的私钥必须存放在认证硬件上，不能直接复制到 CI 机器，所以 CI 里通常用厂商提供的云签名服务。SmartScreen 的信誉策略由微软调整，以 Electron 和微软的当前文档为准。</p>
<p>Azure Artifact Signing（原名 Azure Trusted Signing）是微软的云签名服务，文档称它是 Windows 上成本最低的选项，但只在部分国家和地区提供。</p>
<p>Forge、Packager 等 Electron 官方工具通过 <code>@electron/windows-sign</code> 和统一的 <code>windowsSign</code> 配置完成签名。</p>
<h2>自动更新选哪种</h2>
<p>内置的 <code>autoUpdater</code> 基于 Squirrel，支持 macOS（Squirrel.Mac）和 Windows（Squirrel.Windows）。如果应用是公开 GitHub 仓库、发布在 GitHub Releases 上，可以用官方免费服务 update.electronjs.org，配合 <code>update-electron-app</code> 模块就能接入。也可以用静态存储（macOS 读 <code>releases.json</code>，Windows 读 <code>RELEASES</code>），或者自建 Hazel、Nuts 等更新服务器。</p>
<p>electron-updater 由 electron-builder 在构建时生成更新元数据，除了 macOS、Windows 还支持 Linux，并提供下载进度事件。它支持的安装包格式和分阶段发布配置，以 electron.build 的当前文档为准。</p>
<p>下面是 electron-updater 的最简接入，注意开头的 <code>app.isPackaged</code> 判断：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// 主进程：只在打包后的应用中检查更新</span>
<span class="hljs-keyword">const</span> { app } = <span class="hljs-built_in">require</span>(<span class="hljs-string">&#x27;electron&#x27;</span>);
<span class="hljs-keyword">const</span> { autoUpdater } = <span class="hljs-built_in">require</span>(<span class="hljs-string">&#x27;electron-updater&#x27;</span>);

app.<span class="hljs-title function_">whenReady</span>().<span class="hljs-title function_">then</span>(<span class="hljs-function">() =&gt;</span> {
  <span class="hljs-keyword">if</span> (!app.<span class="hljs-property">isPackaged</span>) <span class="hljs-keyword">return</span>;
  autoUpdater.<span class="hljs-title function_">on</span>(<span class="hljs-string">&#x27;error&#x27;</span>, <span class="hljs-function">(<span class="hljs-params">err</span>) =&gt;</span> <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">error</span>(<span class="hljs-string">&#x27;更新失败&#x27;</span>, err));
  autoUpdater.<span class="hljs-title function_">checkForUpdatesAndNotify</span>();
});
</code></pre></div>
<p>开发时直接运行源码，不是打包后的应用，也没有对应的更新元数据，所以用这个判断跳过更新检查。</p>
<h2>发布时容易踩的坑</h2>
<p>发出了一个有问题的版本，怎么办？要发一个更高的版本号。如果重新发布同一个版本号，已经更新到坏版本的用户不会再收到修复。</p>
<p>更新包和元数据都要走 HTTPS。签名证书和发布凭据要保护好，CI 里用密钥管理服务，不要把证书提交到仓库。</p>
<p>打包时用 <code>@electron/fuses</code> 关掉不需要的能力，见<a href="/questions/mobile-electron-security/">《Electron 应用的主进程、渲染进程和 IPC 有哪些安全边界？》</a>。</p>
<h2>常见追问</h2>
<p><strong>不签名能发布吗？</strong></p>
<blockquote>
<p>能分发，但 macOS 会阻止或警告用户打开没公证的应用，Windows 会弹出安全警告，而且 macOS 上的自动更新没法工作。</p>
</blockquote>
<p><strong>Forge 和 electron-builder 怎么选？</strong></p>
<blockquote>
<p>Forge 是 Electron 官方推荐的，用的是官方签名和打包模块；electron-builder 配置集中，自带 electron-updater 和多种发布源。两者都能满足常见需求，按团队现有流程选。</p>
</blockquote>`};export{e as default};