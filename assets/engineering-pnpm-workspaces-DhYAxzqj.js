var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>pnpm 管理多包仓库，先在根目录放一个 <code>pnpm-workspace.yaml</code>，用 <code>packages</code> 字段列出哪些目录是工作区包。</p>
<p>包之间用 <code>workspace:</code> 协议声明依赖。这样 pnpm 只会链接本地的包，本地找不到就直接报错，不会去 registry 下载一个同名包。发布或打包时，<code>workspace:*</code>、<code>workspace:^</code> 会被换成真实版本号，使用者拿到的是普通依赖。</p>
<p>运行命令时用 <code>--filter</code> 选择包，还能顺带选上它依赖的包，或者依赖它的下游包。</p>
<p>另外，pnpm 的 <code>node_modules</code> 结构很严格，每个包只能访问自己声明过的依赖，所以能发现“幽灵依赖”，也就是没声明却能用的依赖。</p>
</blockquote>
<h2>基本结构</h2>
<p>先在根目录声明工作区，再让应用用 <code>workspace:</code> 协议依赖组件库。</p>
<div class="not-prose code-block"><div class="code-language">yaml</div><pre><code class="hljs language-yaml"># pnpm-workspace.yaml
packages:
  - &#x27;apps/*&#x27;
  - &#x27;packages/*&#x27;
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">json</div><pre><code class="hljs language-json">// apps/web/package.json
{
  &quot;name&quot;: &quot;web&quot;,
  &quot;dependencies&quot;: {
    &quot;@acme/ui&quot;: &quot;workspace:^&quot;
  }
}
</code></pre></div>
<p>运行 <code>pnpm install</code> 以后，<code>apps/web/node_modules/@acme/ui</code> 是一个指向 <code>packages/ui</code> 的链接。所以改了组件库的源码，应用里马上就能看到。</p>
<h2>发布时 workspace 协议会变成什么</h2>
<p><code>workspace:</code> 只在仓库里有意义，发出去的包里不能留着它。假设 <code>@acme/ui</code> 当前版本是 1.5.0，发布后的替换规则是：<code>workspace:*</code> 变成 <code>1.5.0</code>，<code>workspace:~</code> 变成 <code>~1.5.0</code>，<code>workspace:^</code> 变成 <code>^1.5.0</code>，<code>workspace:^1.5.0</code> 变成 <code>^1.5.0</code>。</p>
<p>要注意，这个替换只在 <code>pnpm pack</code> 或 <code>pnpm publish</code> 时发生。如果用 <code>npm publish</code> 发布，不会转换，使用者会拿到一个装不上的 <code>workspace:</code> 字符串。</p>
<h2>用 filter 选择要运行的包</h2>
<div class="not-prose code-block"><div class="code-language">bash</div><pre><code class="hljs language-bash">pnpm --filter web build          # 只构建 web
pnpm --filter &quot;web...&quot; build     # web 及它依赖的所有本地包
pnpm --filter &quot;...@acme/ui&quot; test # @acme/ui 及所有依赖它的包
pnpm -r build                    # 所有包，按依赖拓扑顺序
</code></pre></div>
<p>三个点写在哪边，意思不一样。写在后面的 <code>web...</code> 是往“上游”选，带上 web 依赖的包；写在前面的 <code>...@acme/ui</code> 是往“下游”选，带上依赖它的包。</p>
<p>所以改了组件库以后，用 <code>...@acme/ui</code> 跑一遍下游测试，就能发现破坏性改动。CI 里还可以结合 <code>--filter &quot;[origin/main]&quot;</code>，只处理相对主分支有改动的包。</p>
<h2>严格隔离是怎样发现问题的</h2>
<p>pnpm 把真实文件放在一个全局的内容寻址存储里，每个包的 <code>node_modules</code> 只放它声明过的依赖的链接。</p>
<p>假如 <code>apps/web</code> 的代码直接 <code>import &#x27;lodash&#x27;</code>，可是 lodash 只是 <code>@acme/ui</code> 的依赖。在 npm 的提升结构下这可能能跑，在 pnpm 下就会报找不到模块。</p>
<p>所以 pnpm 能尽早暴露没声明的依赖，避免发布以后在使用者的环境里才出错。</p>
<h2>CI 里怎样用</h2>
<p>提交 <code>pnpm-lock.yaml</code>，CI 里用 <code>pnpm install --frozen-lockfile</code>，它在 CI 环境下默认开启。再用 <code>packageManager</code> 字段固定 pnpm 的版本。构建和测试按依赖顺序执行，缓存按包的粒度复用。</p>
<h2>常见追问</h2>
<p><strong>pnpm 工作区和 npm workspaces 有什么区别？</strong></p>
<blockquote>
<p>npm 也支持工作区，也能用 <code>--workspace</code> 选择包。但它没有 <code>workspace:</code> 协议和严格隔离，默认会把依赖提升到根目录。Monorepo 的概念和任务编排见<a href="/questions/eng-monorepo/">《Monorepo 与 npm workspaces 能解决什么问题？》</a>。</p>
</blockquote>
<p><strong>多个包的公共依赖版本怎样统一？</strong></p>
<blockquote>
<p>可以用 pnpm 的 catalog 功能，或者在根目录用 <code>overrides</code> 集中管理版本。</p>
</blockquote>`};export{e as default};