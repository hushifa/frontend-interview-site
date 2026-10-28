var e={answerHtml:`<h2>简答</h2>
<ul>
<li>语义化版本 <code>MAJOR.MINOR.PATCH</code>：不兼容改动升主版本，向后兼容的新功能升次版本，向后兼容的修复升补丁版本。</li>
<li>这是发布者的承诺，不是工具保证；判断&quot;兼容&quot;靠人，误判和意外破坏很常见。</li>
<li><code>^1.2.3</code> 允许 <code>&lt;2.0.0</code> 的所有更新，<code>~1.2.3</code> 只允许 <code>&lt;1.3.0</code>；<code>0.x</code> 版本下 <code>^0.2.3</code> 只允许 <code>&lt;0.3.0</code>。</li>
<li>预发布版本（如 <code>2.0.0-beta.1</code>）默认不会被普通范围匹配到。</li>
<li>升级仍要靠锁文件固定版本、跑测试、读变更日志，自动化工具只负责提出升级。</li>
</ul>
<h2>版本号的含义</h2>
<table><thead><tr><th>变化</th><th>含义</th><th>示例</th></tr></thead><tbody><tr><td>1.4.2 → 2.0.0</td><td>有不兼容的公开 API 变更</td><td>删除函数、改参数含义</td></tr><tr><td>1.4.2 → 1.5.0</td><td>新增向后兼容的功能</td><td>新增可选参数</td></tr><tr><td>1.4.2 → 1.4.3</td><td>向后兼容的问题修复</td><td>修复计算错误</td></tr></tbody></table>
<p><code>0.y.z</code> 表示初始开发阶段，规范不保证任何稳定性。<code>1.0.0</code> 起才定义了公开 API。</p>
<h2>范围语法</h2>
<table><thead><tr><th>写法</th><th>允许的版本</th></tr></thead><tbody><tr><td><code>1.2.3</code></td><td>只有 1.2.3</td></tr><tr><td><code>^1.2.3</code></td><td>≥1.2.3 且 &lt;2.0.0</td></tr><tr><td><code>~1.2.3</code></td><td>≥1.2.3 且 &lt;1.3.0</td></tr><tr><td><code>^0.2.3</code></td><td>≥0.2.3 且 &lt;0.3.0</td></tr><tr><td><code>^0.0.3</code></td><td>只有 0.0.3</td></tr></tbody></table>
<p><code>1.0.0-rc.1</code> 这类预发布版本排在 <code>1.0.0</code> 之前。<code>^1.0.0</code> 不会匹配 <code>1.1.0-beta.0</code>，除非范围本身就写了同一个主次补丁号的预发布版本。</p>
<p><code>1.0.0+build.5</code> 中 <code>+</code> 后面是构建元数据，比较版本时会被忽略。</p>
<h2>为什么小版本也会出问题</h2>
<ul>
<li>发布者认为的&quot;内部实现&quot;被你依赖了，例如错误信息文本、事件触发顺序、默认样式。</li>
<li>修复 bug 改变了行为，而你的代码恰好依赖那个 bug。</li>
<li>依赖的依赖升级，带来新的 Node.js 版本要求、peer 依赖或打包格式变化。</li>
<li>类型声明更严格，TypeScript 编译失败，即使运行时完全兼容。</li>
</ul>
<h2>怎样安全升级</h2>
<ol>
<li>提交锁文件，平时安装不会自动拿到新版本。</li>
<li>用 Renovate 或 Dependabot 定期提出升级 PR，一次只升一组相关依赖。</li>
<li>在 PR 中阅读变更日志，跑完整的类型检查、测试和构建。</li>
<li>大版本升级按官方迁移指南处理，必要时先在分支中试用。</li>
</ol>
<h2>常见追问</h2>
<ul>
<li>自己发布库时怎样避免误伤？明确公开 API 的范围（<code>exports</code>、文档），对行为变化保守地升主版本，并在变更日志中写清楚。</li>
<li>为什么有的项目所有依赖都写精确版本？为了完全掌控升级时机，代价是需要更频繁地手动升级。</li>
</ul>`};export{e as default};