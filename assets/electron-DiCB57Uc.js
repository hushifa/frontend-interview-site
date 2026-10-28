var e={notesHtml:`<p>用 Chromium 和 Node.js 构建跨平台桌面应用，主进程访问系统能力，渲染进程负责界面。</p>
<p>安全边界在 IPC、preload 和上下文隔离：保持默认的 contextIsolation 和 sandbox，只通过 contextBridge 暴露最小接口，不要给远程页面开启 Node 集成。安装包较大，自动更新要单独规划。</p>
<p>许可：MIT。</p>`};export{e as default};