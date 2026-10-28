var e={answerHtml:`<h2>简答</h2>
<ul>
<li><code>package.json</code> 里写的是版本范围（如 <code>^1.2.0</code>），不同时间安装可能得到不同版本。</li>
<li>lockfile 记录整棵依赖树每个包的确切版本、来源和完整性哈希，提交后所有人和 CI 安装结果一致。</li>
<li><code>npm install</code> 可能根据范围更新锁文件；<code>npm ci</code> 严格按锁文件安装，锁文件和 <code>package.json</code> 不一致时直接报错。</li>
<li><code>npm ci</code> 会先删除已有的 <code>node_modules</code>，适合 CI 和生产构建。</li>
<li>锁文件不固定 Node.js 版本、包管理器版本和平台相关的原生依赖，这些要单独约束。</li>
</ul>
<h2>范围和实际版本</h2>
<div class="not-prose code-block"><div class="code-language">json</div><pre><code class="hljs language-json">{ &quot;dependencies&quot;: { &quot;dayjs&quot;: &quot;^1.11.0&quot; } }
</code></pre></div>
<p><code>^1.11.0</code> 允许 1.x 中任何不低于 1.11.0 的版本。今天安装得到 1.11.10，下个月可能得到 1.11.13。间接依赖的范围更多，变化面更大。没有锁文件时，&quot;本地能跑，CI 失败&quot;往往来自这里。</p>
<p>lockfile（<code>package-lock.json</code>、<code>pnpm-lock.yaml</code>、<code>yarn.lock</code>）把一次解析的结果固定下来，同时记录下载地址和 <code>integrity</code> 哈希，安装时校验包内容没有被替换。</p>
<h2>npm install 和 npm ci</h2>
<table><thead><tr><th></th><th><code>npm install</code></th><th><code>npm ci</code></th></tr></thead><tbody><tr><td>锁文件不存在</td><td>解析并生成</td><td>报错</td></tr><tr><td>锁文件与 package.json 不一致</td><td>按 package.json 重新解析并更新锁文件</td><td>报错退出</td></tr><tr><td>已有 node_modules</td><td>增量更新</td><td>先删除再安装</td></tr><tr><td>会修改 package.json / 锁文件</td><td>可能</td><td>不会</td></tr></tbody></table>
<p>pnpm 对应 <code>pnpm install --frozen-lockfile</code>（CI 环境默认开启），Yarn 对应 <code>yarn install --immutable</code>。</p>
<h2>什么时候更新锁文件</h2>
<ul>
<li>新增、删除、升级依赖时由 <code>npm install &lt;pkg&gt;</code> 或 <code>npm update</code> 更新，并和代码一起提交、评审。</li>
<li>合并冲突时不要手工编辑锁文件，先解决 <code>package.json</code> 冲突，再重新运行安装生成锁文件。</li>
<li>库项目同样应提交锁文件，保证自身开发和测试可复现；发布到 npm 后，使用者不会读取库的 <code>package-lock.json</code>。</li>
</ul>
<h2>锁文件管不到的东西</h2>
<ul>
<li>Node.js 和包管理器版本：用 <code>engines</code>、<code>.nvmrc</code>、<code>packageManager</code> 字段固定。</li>
<li>安装脚本：<code>postinstall</code> 可能下载二进制文件或执行任意代码，结果受网络和系统影响。CI 可以用 <code>--ignore-scripts</code> 配合白名单降低风险。</li>
<li>平台差异：可选依赖和原生模块会按操作系统和 CPU 选择不同的包。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li>为什么 CI 要用 <code>npm ci</code>？它保证构建用的就是评审过的依赖树，并在依赖声明不一致时尽早失败。</li>
<li>锁文件能防止供应链攻击吗？能防止已固定的包被悄悄替换，但无法阻止你主动升级到一个恶意版本，升级时仍要审查。</li>
</ul>`};export{e as default};