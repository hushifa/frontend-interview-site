var e={answerHtml:`<h2>简答</h2>
<ul>
<li>根目录的 <code>pnpm-workspace.yaml</code> 用 <code>packages</code> 字段列出工作区包所在目录。</li>
<li>包之间用 <code>workspace:</code> 协议声明依赖，pnpm 只会链接本地包，找不到时直接报错，不会去 registry 下载同名包。</li>
<li>发布或打包时，<code>workspace:*</code>、<code>workspace:^</code> 等会被替换成真实版本号，使用者拿到的是普通依赖。</li>
<li><code>--filter</code> 选择要执行命令的包，可以带上它的依赖或依赖它的下游包。</li>
<li>pnpm 的严格 <code>node_modules</code> 结构让包只能访问自己声明的依赖，可以发现&quot;幽灵依赖&quot;。</li>
</ul>
<h2>基本结构</h2>
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
<p>运行 <code>pnpm install</code> 后，<code>apps/web/node_modules/@acme/ui</code> 是指向 <code>packages/ui</code> 的链接，修改组件库源码会直接反映到应用里。</p>
<h2>workspace 协议和发布时的替换</h2>
<p>假设 <code>@acme/ui</code> 当前版本是 1.5.0：</p>
<table><thead><tr><th>声明</th><th>发布后变成</th></tr></thead><tbody><tr><td><code>workspace:*</code></td><td><code>1.5.0</code></td></tr><tr><td><code>workspace:~</code></td><td><code>~1.5.0</code></td></tr><tr><td><code>workspace:^</code></td><td><code>^1.5.0</code></td></tr><tr><td><code>workspace:^1.5.0</code></td><td><code>^1.5.0</code></td></tr></tbody></table>
<p>替换只发生在 <code>pnpm pack</code> / <code>pnpm publish</code> 时，用 <code>npm publish</code> 发布不会转换，使用者会拿到无法安装的 <code>workspace:</code> 字符串。</p>
<h2>用 filter 运行任务</h2>
<div class="not-prose code-block"><div class="code-language">bash</div><pre><code class="hljs language-bash">pnpm --filter web build          # 只构建 web
pnpm --filter &quot;web...&quot; build     # web 及它依赖的所有本地包
pnpm --filter &quot;...@acme/ui&quot; test # @acme/ui 及所有依赖它的包
pnpm -r build                    # 所有包，按依赖拓扑顺序
</code></pre></div>
<p>改了组件库后用 <code>...@acme/ui</code> 跑下游测试，可以发现破坏性改动。CI 里还可以结合 <code>--filter &quot;[origin/main]&quot;</code> 只处理相对主分支有改动的包。</p>
<h2>严格依赖隔离</h2>
<p>pnpm 把真实文件放在全局内容寻址存储中，每个包的 <code>node_modules</code> 只包含它声明的依赖链接。如果 <code>apps/web</code> 代码直接 <code>import &#x27;lodash&#x27;</code>，而 lodash 只是 <code>@acme/ui</code> 的依赖，在 pnpm 下会报找不到模块。这能尽早暴露没有声明的依赖，避免发布后在使用者环境里出错。</p>
<h2>CI 中的用法</h2>
<ul>
<li>提交 <code>pnpm-lock.yaml</code>，CI 使用 <code>pnpm install --frozen-lockfile</code>（CI 环境下默认开启）。</li>
<li>用 <code>packageManager</code> 字段固定 pnpm 版本。</li>
<li>构建和测试按依赖顺序执行，缓存按包粒度复用。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li>和 npm workspaces 有什么区别？npm 也支持工作区和 <code>--workspace</code> 选择，但不提供 <code>workspace:</code> 协议和严格隔离，默认会把依赖提升到根目录。概念和任务编排见《Monorepo 与 npm workspaces 能解决什么问题？》。</li>
<li>公共依赖版本怎样统一？可以用 pnpm 的 catalog 功能或根目录 <code>overrides</code> 集中管理版本。</li>
</ul>`};export{e as default};