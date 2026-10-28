var e={answerHtml:`<h2>简答</h2>
<ul>
<li>Electron 随应用打包 Chromium 和 Node.js，后端逻辑写在 JavaScript 里；Tauri 使用操作系统自带的 WebView，后端是编译成原生二进制的 Rust。</li>
<li>Tauri 不附带浏览器引擎，官方称最小应用可以小于 600KB；Electron 官方承认多数应用超过 100MB。</li>
<li>Electron 所有平台使用同一个 Chromium 版本，渲染一致、安全补丁随应用发布；Tauri 在 Windows 用 WebView2（Chromium），在 macOS 和 Linux 用 WebKit，需要处理不同引擎和系统版本的差异。</li>
<li>Tauri 通过 capabilities 文件按窗口授予权限，前端只能调用被允许的命令和插件 API；Electron 的权限边界主要靠 preload、沙箱和开发者自己校验 IPC。</li>
<li>团队以 JS 为主、需要成熟生态和渲染一致性时选 Electron；对包体积和内存敏感、愿意使用 Rust 时选 Tauri。</li>
</ul>
<h2>架构对比</h2>
<table><thead><tr><th></th><th>Electron</th><th>Tauri</th></tr></thead><tbody><tr><td>渲染引擎</td><td>内置 Chromium</td><td>系统 WebView</td></tr><tr><td>后端</td><td>Node.js 主进程</td><td>Rust 核心，插件可用 Swift、Kotlin</td></tr><tr><td>前端调用后端</td><td>IPC（<code>invoke</code>/<code>handle</code> 等）</td><td><code>invoke</code> 调用 Rust 命令，事件做单向通知</td></tr><tr><td>数据传输</td><td>结构化克隆</td><td>类 JSON-RPC 协议，参数和返回值必须能序列化为 JSON</td></tr><tr><td>权限</td><td>preload + contextBridge + 沙箱</td><td>capabilities 按窗口授予权限</td></tr></tbody></table>
<p>Tauri 的窗口由 TAO 创建，WebView 由 WRY 抽象，Rust 核心负责配置、系统 API 和更新。Tauri 2 的目标平台还包括 iOS 和 Android。</p>
<h2>渲染一致性</h2>
<p>Tauri 使用的 WebView：</p>
<ul>
<li>Windows：WebView2，基于 Microsoft Edge（Chromium）。Windows 11 自带，旧系统由安装程序确保存在。</li>
<li>macOS：WKWebView，属于系统组件，不再受支持的 macOS 版本不会收到 WebKit 更新。</li>
<li>Linux：webkitgtk，版本由发行版决定。</li>
</ul>
<p>所以 Tauri 应用要在 Chromium 和 WebKit 两套引擎上测试 CSS、Web API 和性能，最低支持的系统版本决定了能用哪些 Web 特性。</p>
<p>Electron 文档解释了打包 Chromium 的理由：使用系统 WebView 时，可用能力受限于需要支持的最旧系统中的浏览器版本；遇到 WebView 自身的 bug 或安全漏洞，开发者无法自行修复，只能等用户升级系统。打包 Chromium 后，开发者可以随应用更新发布修复。代价是更大的安装包和更多的维护工作。</p>
<h2>体积和资源</h2>
<ul>
<li>Tauri 不附带浏览器引擎，后端编译成原生二进制，包体积小，内存占用通常也更低。</li>
<li>Electron 文档承认，简单页面下系统 WebView 有时更省资源；对于大型应用，他们认为新版 Chromium 的表现更好。如果小体积是硬性要求，Electron 文档也明确表示 Electron 不合适。</li>
</ul>
<p>具体体积和内存数据受功能、依赖和平台影响很大，选型时应用同样功能的原型实测。</p>
<h2>权限模型</h2>
<p>Tauri 的 capability 文件放在 <code>src-tauri/capabilities</code> 目录下，列出允许哪些窗口（按窗口 label 匹配）使用哪些权限，例如 <code>core:window:allow-set-title</code>。核心 API 默认只对打包进应用的本地代码开放，远程页面需要单独配置 <code>remote.urls</code>。官方也说明 capabilities 只能降低前端被攻破后的影响，不能防御恶意 Rust 代码、WebView 0-day 或供应链攻击。</p>
<p>Electron 没有类似的声明式权限清单，开发者需要自己在 preload 中暴露窄接口，并在主进程中校验每个 IPC 调用，见<a href="/questions/mobile-electron-security/">《Electron 应用的主进程、渲染进程和 IPC 有哪些安全边界？》</a>。</p>
<h2>怎么选</h2>
<ul>
<li><strong>选 Electron</strong>：团队只熟悉 JS/TS；需要大量 Node.js 生态或已有 Node 原生模块；要求各平台渲染完全一致；已有成熟的 Electron 发布和更新流程。</li>
<li><strong>选 Tauri</strong>：安装包体积和内存敏感；需要同一套代码覆盖移动端；团队可以维护 Rust 代码；界面主要使用跨引擎兼容良好的 Web 特性。</li>
<li><strong>都不一定合适</strong>：主要是原生应用，只需要嵌入少量网页时，可以直接用系统 WebView。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li>Tauri 能用 npm 包吗？前端部分可以使用任何打包成 HTML、JS、CSS 的框架和库；需要 Node.js 运行时的包不能在 Tauri 后端使用，相应逻辑要改用 Rust 或作为 sidecar 程序。</li>
<li>两者的自动更新有什么区别？Tauri 的 updater 插件强制要求更新包签名且无法关闭；Electron 的方案见<a href="/questions/desktop-electron-release/">《Electron 应用如何打包发布？代码签名、macOS 公证和自动更新要注意什么？》</a>。</li>
</ul>`};export{e as default};