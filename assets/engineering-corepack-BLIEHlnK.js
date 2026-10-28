var e={answerHtml:`<h2>简答</h2>
<ul>
<li><code>package.json</code> 的 <code>packageManager</code> 字段声明项目用哪个包管理器的哪个精确版本，例如 <code>pnpm@12.15.0</code>。</li>
<li>Corepack 是一层代理：通过它调用 <code>pnpm</code> 或 <code>yarn</code> 时，它按声明下载并运行对应版本。</li>
<li>只写字段不会生效，必须执行 <code>corepack enable</code> 安装代理命令；npm 的代理默认不安装。</li>
<li>Corepack 随 Node.js 14.19.0 到 24.x 分发，Node.js 25 起不再内置，需要 <code>npm install -g corepack</code>。</li>
<li>它只固定工具版本，依赖树仍由锁文件固定，CI 还需冻结安装。</li>
</ul>
<h2>三层关系</h2>
<div class="not-prose code-block"><div class="code-language">json</div><pre><code class="hljs language-json">{
  &quot;private&quot;: true,
  &quot;packageManager&quot;: &quot;pnpm@12.15.0&quot;
}
</code></pre></div>
<ol>
<li><strong>声明</strong>：<code>packageManager</code> 写在项目里，跟着代码一起评审和提交。</li>
<li><strong>代理</strong>：<code>corepack enable</code> 在 PATH 中放入 <code>pnpm</code>、<code>yarn</code> 代理命令。运行 <code>pnpm install</code> 时实际先进入 Corepack，它读取声明、按需下载这个版本并执行。</li>
<li><strong>执行</strong>：真正解析依赖、写锁文件的仍是 pnpm 本身。</li>
</ol>
<p>如果 PATH 中排在前面的是全局安装的另一个 pnpm，或者 CI 镜像里预装了别的版本，代理就被绕过，声明形同虚设。排查版本不一致时先运行 <code>which pnpm</code> 和 <code>pnpm --version</code>。</p>
<h2>npm 的特殊情况</h2>
<p><code>corepack enable</code> 默认只为 Yarn 和 pnpm 创建代理，npm 代理要显式请求（<code>corepack enable npm</code>）。因为 Node.js 本身已经带了 npm，项目声明 <code>npm@x.y.z</code> 时，直接运行系统 npm 不会被 Corepack 拦截。</p>
<h2>Node.js 版本边界</h2>
<p>Corepack 随 Node.js 14.19.0 起分发，到 25.0.0 之前为止。升级到 Node.js 25 或更换 CI 镜像后，先确认 <code>corepack --version</code> 能运行，否则需要用 npm 全局安装 Corepack，再执行 <code>corepack enable</code>。</p>
<h2>首次下载与离线环境</h2>
<p>声明的版本不在本机缓存时，Corepack 会从网络下载。这一步失败（代理、镜像、证书问题）和依赖安装失败是两回事，日志里要分开看。离线或受限的 CI 可以在准备阶段预先下载并缓存工具，再进入依赖安装。</p>
<p><code>corepack use pnpm@x.y.z</code> 会修改 <code>packageManager</code> 字段并执行安装，它是切换版本的操作，不是查询命令。</p>
<h2>CI 示例</h2>
<div class="not-prose code-block"><div class="code-language">yaml</div><pre><code class="hljs language-yaml">- uses: actions/setup-node@v7
  with:
    node-version: 24
- run: corepack enable
- run: pnpm install --frozen-lockfile
</code></pre></div>
<p><code>--frozen-lockfile</code> 让锁文件与清单不一致时直接失败，防止 CI 悄悄改写依赖。</p>
<h2>它不能固定什么</h2>
<ul>
<li>Node.js 版本：用 <code>engines</code>、<code>.nvmrc</code> 或 CI 配置。</li>
<li>依赖树：靠锁文件和冻结安装。</li>
<li>镜像源、安装脚本、原生模块依赖的系统库：要单独记录和控制。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li>升级 pnpm 怎样做？修改 <code>packageManager</code> 版本，重新安装并审查锁文件变化，作为一次普通的代码变更合入。</li>
<li>不用 Corepack 能固定版本吗？可以在 CI 里用 <code>pnpm/action-setup</code> 等方式安装指定版本，本地则依赖团队约定，一致性更差。</li>
</ul>`};export{e as default};