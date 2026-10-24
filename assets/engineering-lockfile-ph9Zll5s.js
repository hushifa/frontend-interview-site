var e={answerHtml:`<p>package.json 中的版本范围可能允许多个依赖版本。lockfile 记录实际解析的依赖树和完整性信息，帮助团队与 CI 重现安装结果。</p>
<p><code>npm install</code> 用于日常安装和更新依赖，可能修改 lockfile。<code>npm ci</code> 要求存在匹配的 lockfile，在清理现有 node_modules 后按锁定结果安装；发现清单与锁文件不一致时会失败，而不是静默修改锁文件。</p>
<p>CI 还应统一 Node 版本及相关安装配置。锁文件提高可复现性，但并不自动保证依赖没有漏洞或构建在所有系统上完全一致。</p>`};export{e as default};