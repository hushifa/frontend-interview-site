var e={answerHtml:`<h2>简答</h2>
<ul>
<li>Monorepo 是把多个相关项目放在一个仓库里，解决的是跨项目同时修改、统一工具链和代码共享的问题。</li>
<li>工作区（workspaces）负责把本地包互相链接，省去发布后再安装的步骤。</li>
<li>任务编排工具（Turborepo、Nx 等）负责按依赖顺序构建、并行执行和缓存结果，工作区本身不做这些。</li>
<li>代价是仓库变大、CI 需要按改动范围执行，权限和发布流程也要重新设计。</li>
<li>团队规模小、项目之间几乎不共享代码时，多仓库往往更简单。</li>
</ul>
<h2>解决了什么</h2>
<ul>
<li><strong>原子修改</strong>：组件库改了 API，所有使用它的应用在同一个提交里一起改，评审时能看到全部影响。</li>
<li><strong>统一工具</strong>：ESLint、TypeScript、测试配置放在根目录共享，避免各项目版本漂移。</li>
<li><strong>本地联调</strong>：应用直接使用组件库源码，不用 <code>npm link</code> 或反复发布测试版本。</li>
</ul>
<h2>npm workspaces 示例</h2>
<div class="not-prose code-block"><div class="code-language">json</div><pre><code class="hljs language-json">// 根 package.json
{
  &quot;private&quot;: true,
  &quot;workspaces&quot;: [&quot;apps/*&quot;, &quot;packages/*&quot;]
}
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">json</div><pre><code class="hljs language-json">// apps/web/package.json
{
  &quot;dependencies&quot;: { &quot;@acme/ui&quot;: &quot;^1.0.0&quot; }
}
</code></pre></div>
<p><code>npm install</code> 发现 <code>@acme/ui</code> 是本地工作区包且版本满足范围，就把它链接到 <code>node_modules/@acme/ui</code>。</p>
<div class="not-prose code-block"><div class="code-language">bash</div><pre><code class="hljs language-bash">npm run build --workspace=@acme/ui
npm run test --workspaces --if-present
</code></pre></div>
<p><code>--workspaces</code> 依次在每个包运行脚本，不会自动按依赖拓扑排序。包多、依赖链长时需要任务编排工具。</p>
<h2>任务编排</h2>
<p>以 Turborepo 为例，声明 <code>build</code> 依赖上游包的 <code>build</code>，工具会算出执行顺序，并按输入文件哈希缓存输出。改了一个包时，只重新构建它和它的下游，其他包直接命中缓存。</p>
<h2>需要额外注意的地方</h2>
<ul>
<li><strong>依赖声明</strong>：每个包要在自己的 <code>package.json</code> 里声明用到的依赖。npm 默认把依赖提升到根目录，漏写依赖在本地也能运行，发布后才出错。</li>
<li><strong>构建产物</strong>：组件库如果需要先编译，应用开发时引用的是源码还是产物，要在 <code>exports</code> 和构建配置里约定清楚。</li>
<li><strong>发布</strong>：多个包的版本号和变更日志可以用 Changesets 管理，发布前在干净环境里安装打包结果验证。</li>
<li><strong>CI 规模</strong>：按改动范围筛选受影响的包，否则每次提交都全量构建。</li>
</ul>
<h2>逐步采用</h2>
<p>可以先把共享配置和一个组件库放进同一仓库，确认链接、构建顺序和发布流程都顺畅，再迁入更多项目。迁移时保留各项目的 Git 历史（如 <code>git subtree</code>）便于追溯。</p>
<h2>常见追问</h2>
<ul>
<li>选 npm、pnpm 还是 Yarn 的工作区？pnpm 提供 <code>workspace:</code> 协议和严格隔离，适合包较多的仓库，见<a href="/questions/engineering-pnpm-workspaces/">《pnpm workspace 怎样管理多包前端仓库？》</a>。</li>
<li>Monorepo 一定要用 Nx/Turborepo 吗？包少时 <code>--workspaces</code> 加手动排序足够，包多、构建慢时再引入。</li>
</ul>`};export{e as default};