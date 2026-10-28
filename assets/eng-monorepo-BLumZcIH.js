var e={answerHtml:`<h2>简答</h2>
<ul>
<li>monorepo 把经常一起修改的应用、组件库和工具放在同一仓库，减少跨仓库发布和联调。</li>
<li>npm workspaces 负责识别工作区里的包并在安装时链接它们，不负责业务边界和发布策略。</li>
<li>根 <code>package.json</code> 声明 workspaces 并设为 <code>private</code>，防止误发布根包。</li>
<li>应用仍要在依赖中声明本地包，不能因为在同一仓库就省略；任务复杂后再引入任务图和缓存。</li>
</ul>
<p>应用、组件库和共享工具如果经常需要一起修改，分别放在多个仓库中可能产生很多版本发布与联调步骤。Monorepo 把这些相关项目放进一个仓库，使跨包修改、评审和统一检查更容易组织。</p>
<p>npm workspaces 则是包管理能力：识别工作区中的包、在安装时链接它们，并帮助在指定包中执行命令。它不是 Monorepo 的同义词，也不是完整的构建缓存或发布系统。</p>
<h2>一个应用依赖本地组件包的例子</h2>
<p>目录可以这样安排：</p>
<div class="not-prose code-block"><div class="code-language">text</div><pre><code class="hljs language-text">package.json
package-lock.json
packages/ui/package.json
packages/ui/index.js
apps/web/package.json
</code></pre></div>
<p>根 package.json 声明工作区，private 防止误把根包作为普通公开包发布：</p>
<div class="not-prose code-block"><div class="code-language">json</div><pre><code class="hljs language-json">{
  &quot;name&quot;: &quot;demo-workspace&quot;,
  &quot;private&quot;: true,
  &quot;workspaces&quot;: [&quot;packages/ui&quot;, &quot;apps/web&quot;]
}
</code></pre></div>
<p>组件包有自己的名称、版本与公开入口：</p>
<div class="not-prose code-block"><div class="code-language">json</div><pre><code class="hljs language-json">{
  &quot;name&quot;: &quot;@demo/ui&quot;,
  &quot;version&quot;: &quot;1.0.0&quot;,
  &quot;type&quot;: &quot;module&quot;,
  &quot;exports&quot;: &quot;./index.js&quot;
}
</code></pre></div>
<p>应用仍应声明依赖，而不是因为处于同一仓库就省略：</p>
<div class="not-prose code-block"><div class="code-language">json</div><pre><code class="hljs language-json">{
  &quot;name&quot;: &quot;@demo/web&quot;,
  &quot;private&quot;: true,
  &quot;type&quot;: &quot;module&quot;,
  &quot;dependencies&quot;: {
    &quot;@demo/ui&quot;: &quot;1.0.0&quot;
  }
}
</code></pre></div>
<p>从根目录安装后，npm 会按工作区规则建立本地链接，应用可以通过包名导入组件包。示例的本地版本与声明一致；不要随意把其他包管理器特有的 workspace: 写法复制过来，而不检查当前 npm 的支持和解析规则。</p>
<h2>链接成功，不代表包已经构建好</h2>
<p>若 ui 的入口指向 dist/index.js，本地链接只会指向这个包，不会自动替它生成 dist。应用构建前仍需要保证依赖产物存在，或明确采用源码直连的开发方案。</p>
<p>源码直连方便联调，但也可能掩盖发布问题：仓库里可以导入的源码，打包后未必在分发文件中。公开库应检查实际归档内容，并从独立消费者视角验证入口、类型声明和资源文件。</p>
<p>共享一个根 node_modules 也可能掩盖未声明依赖。子包不能因为某个工具恰好由根目录或其他包安装，就把它当成自己的可移植依赖。</p>
<h2>多包命令不等于依赖图调度</h2>
<p>在各包定义相应脚本后，可以指定 workspace 执行，也可以对工作区批量执行。例如 <code>npm run test --workspace=@demo/ui</code> 只运行指定包，<code>npm run test --workspaces --if-present</code> 跳过没有相应脚本的工作区。</p>
<p>但 npm 的工作区脚本执行不能被直接理解成自动按业务依赖拓扑构建所有包。文档规定的执行顺序与工作区配置有关，不能假定工具会自行分析“应用必须等组件库构建完”。</p>
<p>简单仓库可以显式安排依赖顺序；任务复杂后，再引入任务图、缓存或受影响分析工具。并行执行、缓存恢复和失败传播都需要清楚的规则，不是加一个 workspaces 字段便全部具备。</p>
<h2>一个仓库不要求只有一种发布方式</h2>
<p>可以统一版本，也可以让各包独立版本；可以只发布应用，也可以把组件库单独发布。Monorepo 决定代码放在哪里，不直接决定包如何对外分发。</p>
<p>独立发布仍要处理版本依赖、变更记录和消费者兼容。统一提交可以让跨包修改在仓库内同时出现，但外部用户升级包的顺序不一定与仓库一致。</p>
<p>如果所有功能都必须同时部署，也不必为了“用了 Monorepo”刻意制造独立发布流程。</p>
<h2>共享配置要有边界</h2>
<p>Lint、TypeScript 和测试基础配置可以集中维护，但每个包的运行环境可能不同：浏览器应用、Node 工具与可发布库不一定使用同一个编译目标或全局变量。</p>
<p>共享组件也应有明确 API，不能让所有包互相导入私有目录。循环依赖、跨包状态修改和大量根级万能工具，仍然会降低可维护性，只是它们现在位于一个仓库里。</p>
<h2>什么时候值得采用</h2>
<p>相关包需要频繁协作、统一评审或共享基础设施时，Monorepo 往往有价值。若项目只有一个应用和少量局部组件，先建立清晰模块边界可能已经足够。</p>
<p>随着规模增长，观察安装时间、任务执行范围、构建缓存命中和跨包影响，再逐步增加工具。目标是减少协作与验证成本，不是让一个简单项目先承担大型仓库的所有编排负担。</p>`};export{e as default};