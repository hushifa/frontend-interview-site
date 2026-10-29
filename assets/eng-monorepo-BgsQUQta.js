var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>Monorepo 就是把多个相关项目放在同一个仓库里，比如一个组件库和用它的几个应用。这样组件库改了 API，所有应用可以在同一个提交里一起改，工具链也能统一。</p>
<p>这里面有三件不同的事。仓库组织是 Monorepo 本身；工作区，也就是 workspaces，负责把本地包互相链接起来，不用发布了再安装；按依赖顺序构建、并行执行、缓存结果，是 Turborepo、Nx 这类任务编排工具做的，工作区本身不做。</p>
<p>代价是仓库变大，CI 要按改动范围执行，权限和发布流程也要重新设计。</p>
<p>所以团队小、项目之间几乎不共享代码时，多仓库往往更简单。</p>
</blockquote>
<h2>Monorepo 解决了什么</h2>
<p>最大的好处是原子修改。组件库改了 API，所有用到它的应用在同一个提交里一起改，评审的人能一次看到全部影响。</p>
<p>其次是工具统一。ESLint、TypeScript、测试配置放在根目录共享，各个项目的工具版本不会越漂越远。</p>
<p>还有本地联调方便。应用直接用组件库的源码，不需要 <code>npm link</code>，也不用反复发布测试版本。</p>
<h2>npm workspaces 怎样用</h2>
<p>先在根目录的 <code>package.json</code> 里声明哪些目录是工作区，再让应用像平常一样依赖组件库。</p>
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
<p>运行 <code>npm install</code> 时，npm 发现 <code>@acme/ui</code> 是本地的工作区包，而且版本满足范围，就把它链接到 <code>node_modules/@acme/ui</code>，不会去 registry 下载。</p>
<p>运行脚本时可以指定某个包，也可以对所有包执行：</p>
<div class="not-prose code-block"><div class="code-language">bash</div><pre><code class="hljs language-bash">npm run build --workspace=@acme/ui
npm run test --workspaces --if-present
</code></pre></div>
<p>要注意，<code>--workspaces</code> 只是依次在每个包里运行脚本，它不会自动按依赖关系排序。包多、依赖链长的时候，就需要任务编排工具。</p>
<h2>任务编排工具做了什么</h2>
<p>以 Turborepo 为例，你声明“一个包的 <code>build</code> 依赖上游包的 <code>build</code>”，工具就能算出执行顺序。它还会按输入文件的哈希缓存输出。</p>
<p>所以改了一个包，只有它和它的下游需要重新构建，其他包直接命中缓存。</p>
<h2>需要额外注意的地方</h2>
<p>第一是依赖声明。每个包要在自己的 <code>package.json</code> 里写清用到的依赖。npm 默认把依赖提升到根目录，所以漏写的依赖在本地也能跑，发布出去才出错。</p>
<p>第二是构建产物。组件库如果要先编译，应用开发时引用的是源码还是编译产物，要在 <code>exports</code> 和构建配置里约定清楚。</p>
<p>第三是发布。多个包的版本号和变更日志可以用 Changesets 管理，发布前在干净的环境里安装打包结果验证一遍。</p>
<p>第四是 CI 规模。要按改动范围筛选受影响的包，否则每次提交都全量构建。</p>
<h2>怎样逐步采用</h2>
<p>不必一次全迁。可以先把共享配置和一个组件库放进同一个仓库，确认链接、构建顺序、发布流程都顺畅，再迁入更多项目。迁移时最好保留各项目的 Git 历史，比如用 <code>git subtree</code>，方便以后追溯。</p>
<h2>常见追问</h2>
<p><strong>选 npm、pnpm 还是 Yarn 的工作区？</strong></p>
<blockquote>
<p>pnpm 提供 <code>workspace:</code> 协议和严格的依赖隔离，适合包比较多的仓库，详见<a href="/questions/engineering-pnpm-workspaces/">《pnpm workspace 怎样管理多包前端仓库？》</a>。</p>
</blockquote>
<p><strong>Monorepo 一定要用 Nx 或 Turborepo 吗？</strong></p>
<blockquote>
<p>不一定。包少的时候，<code>--workspaces</code> 加上手动安排顺序就够了。等包多了、构建变慢了，再引入编排工具。</p>
</blockquote>`};export{e as default};