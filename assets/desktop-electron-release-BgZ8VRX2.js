var e={answerHtml:`<h2>简答</h2>
<ul>
<li>发布流程是：构建前端资源 → 把应用代码和 Electron 二进制打包成各平台应用 → 制作安装包 → 签名（macOS 还要公证）→ 上传到更新源。官方推荐使用 Electron Forge，electron-builder 也是常用方案。</li>
<li>macOS 应用需要用 Apple 开发者证书签名，再提交 Apple 公证；没有签名，内置 <code>autoUpdater</code> 依赖的 Squirrel.Mac 根本无法自动更新。</li>
<li>Windows 签名用于减少 SmartScreen 等安全警告，Electron 文档介绍了 EV 证书（密钥需存放在认证硬件或云签名服务中）和 Azure 的云签名服务两类方案。</li>
<li>自动更新可以用 Electron 内置的 <code>autoUpdater</code>（基于 Squirrel，支持 macOS 和 Windows），也可以用 electron-builder 的 electron-updater（额外支持 Linux 和下载进度）。</li>
<li>更新相关代码只在打包后运行（用 <code>app.isPackaged</code> 判断），出了问题要发布更高的版本号来覆盖，而不是重发同一版本。</li>
</ul>
<h2>打包和制作安装包</h2>
<p>打包工具做两件事：</p>
<ol>
<li><strong>打包</strong>：把应用代码（通常已经用 Vite、Webpack 等打包成少量文件）放进 Electron 的 resources 目录，修改可执行文件名、图标和元数据。代码可以合并成 <code>app.asar</code> 归档，在未使用打包器时能改善 Windows 等平台上的文件读取性能。</li>
<li><strong>制作安装包</strong>：生成 DMG、ZIP、NSIS、MSI、DEB、RPM、AppImage 等格式。</li>
</ol>
<p>Electron Forge 内部集成了 <code>@electron/packager</code>、<code>@electron/osx-sign</code>、<code>@electron/notarize</code>；electron-builder 有自己的一套配置。原生模块要针对目标 Electron 版本重新编译，不同架构（x64、arm64）分别构建或制作通用包。</p>
<h2>macOS：签名和公证</h2>
<p>前提条件：付费的 Apple Developer Program 会员、一台装有 Xcode 的 Mac，以及 Apple 签发的签名证书。</p>
<ul>
<li><strong>签名</strong>证明应用来自谁、未被篡改。签名身份保持一致时，系统才会把新版本识别为同一个应用；否则 <code>safeStorage</code> 和 Cookie 加密可能在每次更新后重新请求钥匙串权限，登录项也可能静默失效。</li>
<li><strong>公证</strong>是把签名后的应用上传给 Apple 做自动化检查，确认没有危害用户的行为。Forge 通过 <code>@electron/notarize</code> 完成，<code>@electron/packager</code> 也提供 <code>osxNotarize</code> 选项。</li>
<li>Mac App Store 版本有单独的签名和沙箱要求，按官方 MAS 指南处理。</li>
</ul>
<h2>Windows：签名</h2>
<ul>
<li>Electron 文档说明，自 2023 年 6 月起，用旧的 OV 证书签名会得到和未签名应用相同的警告，需要 EV 证书。EV 证书的私钥必须存放在认证硬件上，不能直接复制到 CI 机器，所以 CI 中通常使用厂商提供的云签名服务。SmartScreen 的信誉策略由微软调整，以 Electron 和微软当前文档为准。</li>
<li>Azure Artifact Signing（原名 Azure Trusted Signing）是微软的云签名服务，文档称它是 Windows 上成本最低的选项，但只在部分国家和地区提供。</li>
<li>Forge、Packager 等 Electron 官方工具通过 <code>@electron/windows-sign</code> 和统一的 <code>windowsSign</code> 配置完成签名。</li>
</ul>
<h2>自动更新</h2>
<p><strong>内置 autoUpdater + Squirrel</strong></p>
<ul>
<li>支持 macOS（Squirrel.Mac）和 Windows（Squirrel.Windows）。</li>
<li>公开 GitHub 仓库并发布到 GitHub Releases 的应用，可以用官方免费服务 update.electronjs.org，配合 <code>update-electron-app</code> 模块即可接入。</li>
<li>也可以用静态存储（macOS 读 <code>releases.json</code>，Windows 读 <code>RELEASES</code>）或自建 Hazel、Nuts 等更新服务器。</li>
</ul>
<p><strong>electron-updater</strong></p>
<ul>
<li>由 electron-builder 在构建时生成更新元数据，除 macOS、Windows 外还支持 Linux，并提供下载进度事件；支持的安装包格式和分阶段发布配置以 electron.build 当前文档为准。</li>
</ul>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// 主进程：只在打包后的应用中检查更新</span>
<span class="hljs-keyword">const</span> { app } = <span class="hljs-built_in">require</span>(<span class="hljs-string">&#x27;electron&#x27;</span>);
<span class="hljs-keyword">const</span> { autoUpdater } = <span class="hljs-built_in">require</span>(<span class="hljs-string">&#x27;electron-updater&#x27;</span>);

app.<span class="hljs-title function_">whenReady</span>().<span class="hljs-title function_">then</span>(<span class="hljs-function">() =&gt;</span> {
  <span class="hljs-keyword">if</span> (!app.<span class="hljs-property">isPackaged</span>) <span class="hljs-keyword">return</span>;
  autoUpdater.<span class="hljs-title function_">on</span>(<span class="hljs-string">&#x27;error&#x27;</span>, <span class="hljs-function">(<span class="hljs-params">err</span>) =&gt;</span> <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">error</span>(<span class="hljs-string">&#x27;更新失败&#x27;</span>, err));
  autoUpdater.<span class="hljs-title function_">checkForUpdatesAndNotify</span>();
});
</code></pre></div>
<h2>发布中的常见问题</h2>
<ul>
<li>发布出错的版本时，发布一个更高的版本号。重新发布同一版本，已经更新到坏版本的用户不会再收到修复。</li>
<li>更新包和元数据都要走 HTTPS，并保护好签名证书和发布凭据，CI 中使用密钥管理服务而不是把证书提交到仓库。</li>
<li>打包时用 <code>@electron/fuses</code> 关闭不需要的能力，见<a href="/questions/mobile-electron-security/">《Electron 应用的主进程、渲染进程和 IPC 有哪些安全边界？》</a>。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li>不签名能发布吗？可以分发，但 macOS 会阻止或警告用户打开未公证的应用，Windows 会弹出安全警告，并且 macOS 上的自动更新无法工作。</li>
<li>Forge 和 electron-builder 怎么选？Forge 是 Electron 官方推荐、使用官方签名和打包模块；electron-builder 配置集中，自带 electron-updater 和多种发布源。两者都能满足常见需求，按团队现有流程选择。</li>
</ul>`};export{e as default};