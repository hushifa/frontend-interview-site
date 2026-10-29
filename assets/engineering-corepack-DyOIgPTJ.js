var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>团队里有人用 pnpm 9，有人用 pnpm 10，生成的锁文件就可能不一样。<code>package.json</code> 的 <code>packageManager</code> 字段就是用来写死项目用哪个包管理器的哪个精确版本，比如 <code>pnpm@12.15.0</code>。</p>
<p>光写字段不会生效，还要有 Corepack。它是一层代理，你通过它运行 <code>pnpm</code> 或 <code>yarn</code> 时，它会按声明下载并运行对应的版本。必须先执行 <code>corepack enable</code> 把代理命令装上，而 npm 的代理默认不装。</p>
<p>版本上要注意，Corepack 随 Node.js 14.19.0 到 25.0.0 之前的版本分发，Node.js 25 起不再内置，要用 <code>npm install -g corepack</code> 自己装。</p>
<p>它只固定包管理器本身的版本。依赖树还是靠锁文件固定，CI 里还要冻结安装。</p>
</blockquote>
<h2>声明、代理和执行是三层</h2>
<p>先看项目里的声明：</p>
<div class="not-prose code-block"><div class="code-language">json</div><pre><code class="hljs language-json">{
  &quot;private&quot;: true,
  &quot;packageManager&quot;: &quot;pnpm@12.15.0&quot;
}
</code></pre></div>
<p>这是第一层，声明。它写在项目里，跟代码一起评审和提交。</p>
<p>第二层是代理。<code>corepack enable</code> 会在 PATH 里放上 <code>pnpm</code>、<code>yarn</code> 这些代理命令。你运行 <code>pnpm install</code> 时，实际上先进入的是 Corepack，它读取声明，按需下载这个版本，再交给它执行。</p>
<p>第三层是执行。真正解析依赖、写锁文件的，仍然是 pnpm 本身。</p>
<p>分清这三层，就能理解一个常见问题：PATH 里排在前面的如果是全局安装的另一个 pnpm，或者 CI 镜像里预装了别的版本，代理就被绕过了，声明形同虚设。所以排查版本不一致时，先运行 <code>which pnpm</code> 和 <code>pnpm --version</code>，看实际跑的是哪个。</p>
<h2>为什么 npm 是特殊情况</h2>
<p><code>corepack enable</code> 默认只为 Yarn 和 pnpm 创建代理，npm 的代理要显式请求，也就是 <code>corepack enable npm</code>。</p>
<p>因为 Node.js 本身就带了 npm。项目声明了 <code>npm@x.y.z</code>，你直接运行系统里的 npm，Corepack 根本拦不到。</p>
<h2>Node.js 版本的边界</h2>
<p>Corepack 从 Node.js 14.19.0 开始随 Node.js 分发，到 25.0.0 之前为止。</p>
<p>所以升级到 Node.js 25 或者换了 CI 镜像以后，先确认 <code>corepack --version</code> 能运行。不能的话，用 npm 全局安装 Corepack，再执行 <code>corepack enable</code>。</p>
<h2>首次下载和离线环境</h2>
<p>声明的版本不在本机缓存里时，Corepack 会从网络下载。这一步可能因为代理、镜像、证书出问题而失败，它和依赖安装失败是两回事，看日志时要分开。</p>
<p>离线或者网络受限的 CI，可以在准备阶段先下载并缓存好工具，再进入依赖安装。</p>
<p>还有一个容易误用的命令：<code>corepack use pnpm@x.y.z</code> 会修改 <code>packageManager</code> 字段并执行安装。它是切换版本的操作，不是查询命令。</p>
<h2>CI 里怎样配</h2>
<div class="not-prose code-block"><div class="code-language">yaml</div><pre><code class="hljs language-yaml">- uses: actions/setup-node@v7
  with:
    node-version: 24
- run: corepack enable
- run: pnpm install --frozen-lockfile
</code></pre></div>
<p>先启用 Corepack，让 <code>pnpm</code> 走代理。<code>--frozen-lockfile</code> 的作用是锁文件和清单不一致时直接失败，防止 CI 悄悄改写依赖。</p>
<h2>它固定不了什么</h2>
<p>Corepack 不管 Node.js 的版本，那要用 <code>engines</code>、<code>.nvmrc</code> 或 CI 配置。它也不管依赖树，那靠锁文件和冻结安装。镜像源、安装脚本、原生模块依赖的系统库，也要单独记录和控制。</p>
<h2>常见追问</h2>
<p><strong>怎样升级 pnpm？</strong></p>
<blockquote>
<p>改 <code>packageManager</code> 里的版本号，重新安装，然后审查锁文件的变化。整个过程当成一次普通的代码变更合入。</p>
</blockquote>
<p><strong>不用 Corepack 能固定版本吗？</strong></p>
<blockquote>
<p>可以。CI 里可以用 <code>pnpm/action-setup</code> 这类方式安装指定版本。但本地就只能靠团队约定，一致性差一些。</p>
</blockquote>`};export{e as default};