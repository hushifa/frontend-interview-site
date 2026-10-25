var e={answerHtml:`<p>pnpm workspace 把多个本地包纳入同一个工作区，统一安装并建立依赖关系。应用可以通过包名使用本仓库组件库，相关包也可以一起运行构建或测试。</p>
<p>它解决包管理与任务选择的一部分问题，不会自动决定业务边界、发布策略或哪些测试足以证明兼容。</p>
<h2>工作区清单和包清单各有作用</h2>
<p>在根目录通过 pnpm-workspace.yaml 选择包目录：</p>
<div class="not-prose code-block"><div class="code-language">yaml</div><pre><code class="hljs language-yaml">packages:
  - &#x27;packages/*&#x27;
  - &#x27;apps/*&#x27;
</code></pre></div>
<p>每个包仍有自己的 package.json，声明名称、版本、入口与依赖。根目录通常负责统一工具声明和工作区锁文件，但不应替子包隐式承担所有运行依赖。</p>
<p>如果应用依赖本地组件包，可以在应用的 dependencies 中明确写：</p>
<div class="not-prose code-block"><div class="code-language">json</div><pre><code class="hljs language-json">{
  &quot;dependencies&quot;: {
    &quot;@demo/ui&quot;: &quot;workspace:^&quot;
  }
}
</code></pre></div>
<p>workspace: 表达“这个依赖必须从本地工作区满足”。如果需要的包或版本不在工作区中，安装应失败，而不是悄悄到 registry 取一个名字相同的远程版本。</p>
<h2>普通版本范围不具有同样的强约束</h2>
<p>使用普通版本范围时，本地链接行为还受 linkWorkspacePackages 等配置和版本匹配影响。某个本地版本不满足范围时，工具可能按规则解析远程版本。</p>
<p>因此，若团队明确要求应用使用本次仓库里的组件包，workspace 协议能把意图写清楚。它不是缩短版本号的装饰，也不意味着可以忽略包的真实版本。</p>
<p>某些开发方案让消费者直接使用源码，另一些要求依赖包先产生 dist。工作区链接不会自动解决两者的构建和类型产物差异，应在项目中统一说明。</p>
<h2>发布时会转换 workspace 依赖</h2>
<p>假设本地 @demo/ui 的版本是 1.5.0，使用 pnpm pack 或相应发布流程时，常见声明会转成普通消费者可以理解的范围：</p>
<table><thead><tr><th>工作区声明</th><th>归档中常见结果</th></tr></thead><tbody><tr><td><code>workspace:*</code></td><td><code>1.5.0</code></td></tr><tr><td><code>workspace:^</code></td><td><code>^1.5.0</code></td></tr><tr><td><code>workspace:~</code></td><td><code>~1.5.0</code></td></tr></tbody></table>
<p>带有明确范围的 workspace 声明按相应规则转换，不应笼统认为所有形式都变成精确版本。</p>
<p>转换发生在打包或发布产物中，不要求把源码清单里的 workspace 协议全部手动改掉。发布前应检查实际归档，并验证依赖包是否也已经可供消费者安装；本地链接成功不代表外部 registry 已有那个版本。</p>
<h2>filter 的省略号方向非常重要</h2>
<p>可以按包选择工作范围：</p>
<div class="not-prose code-block"><div class="code-language">text</div><pre><code class="hljs language-text">pnpm --filter &quot;@demo/web&quot; build
pnpm --filter &quot;@demo/web...&quot; build
pnpm --filter &quot;...@demo/ui&quot; test
</code></pre></div>
<p>第一条只选择 web。第二条选择 web 及其工作区依赖，适合先准备它需要的本地包。第三条选择 ui 及依赖它的下游，用于检查改动可能影响的消费者。</p>
<p>改组件库后只运行它的依赖项，并不能证明使用它的应用没坏；依赖与依赖者是相反的方向。还应注意筛选是否匹配到预期包，不能把空选择导致的“什么都没跑”当成测试成功。</p>
<p>按 Git 变更选择包也有对应语法，但 CI 仍要有正确的比较基准与依赖图。工具不会仅凭文件改动自动理解所有业务上的影响范围。</p>
<h2>选择范围与执行顺序仍是两件事</h2>
<p>递归任务通常可以结合依赖关系排序，相关选项也可能改变并行方式。循环依赖、缺少构建脚本、源码与产物混用，仍可能让应用在依赖未准备好时开始构建。</p>
<p>对于类型声明、生成代码等构建产物，应把需要等待的任务表达出来。更复杂的缓存和受影响分析可以交给相应任务工具，但缓存键也要包含真正影响结果的输入。</p>
<h2>pnpm 的依赖布局能减少什么问题</h2>
<p>pnpm 使用相应存储与链接机制组织依赖，常见配置有助于减少重复存储，并减少无意访问未声明依赖的情况。但实际可见性仍受 node-linker、hoist 与根依赖等配置影响，不能宣称任何配置下都绝不可能出现幽灵依赖。</p>
<p>不要让业务代码依赖 node_modules 的具体内部路径。应通过包公开入口导入，独立包仍需声明自己使用的依赖，并从实际消费者环境验证。</p>
<p>共享存储也不意味着所有包只能使用一个版本。不同版本或 peer 组合仍可能需要不同实例，是否去重还要服从依赖兼容关系。</p>
<h2>CI 要使用同一份明确的输入</h2>
<p>固定 Node 和 pnpm 版本，提交正确的 pnpm-lock.yaml，并在要求不改锁的流程中使用冻结安装。缓存与离线准备可以减少下载，但不应成为跳过依赖一致性检查的理由。</p>
<p>安装脚本、平台原生依赖和工作区构建顺序还需要单独处理。一次 pnpm install 成功，只说明安装阶段完成，不证明所有包已构建、类型可用或对外发布正确。</p>
<p>把包边界、版本关系、任务选择和发布产物分别说明，workspace 才能帮助团队稳定协作，而不是让一个命令背负所有架构保证。</p>`};export{e as default};