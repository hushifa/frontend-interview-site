var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p><code>package.json</code> 里写的通常是版本范围，比如 <code>^1.2.0</code>。今天装和下个月装，拿到的版本可能不一样，这就是“本地能跑、CI 失败”的常见原因。</p>
<p>lockfile 把整棵依赖树里每个包的确切版本、下载地址和完整性哈希都记下来。提交以后，所有人和 CI 装出来的结果就一致了。</p>
<p><code>npm install</code> 可能按范围重新解析并更新锁文件。<code>npm ci</code> 严格按锁文件安装，锁文件和 <code>package.json</code> 对不上就直接报错，而且会先删掉已有的 <code>node_modules</code>，所以适合 CI 和生产构建。</p>
<p>要注意，锁文件不固定 Node.js 版本、包管理器版本和平台相关的原生依赖，这些要单独约束。</p>
</blockquote>
<h2>版本范围和实际版本</h2>
<p>先看一个普通的依赖声明：</p>
<div class="not-prose code-block"><div class="code-language">json</div><pre><code class="hljs language-json">{ &quot;dependencies&quot;: { &quot;dayjs&quot;: &quot;^1.11.0&quot; } }
</code></pre></div>
<p><code>^1.11.0</code> 允许 1.x 里任何不低于 1.11.0 的版本。今天装可能是 1.11.10，下个月可能就是 1.11.13。这还只是直接依赖，间接依赖的范围更多，变化面更大。</p>
<p>所以没有锁文件时，两个人在不同时间安装，拿到的依赖树可能不一样。</p>
<p>lockfile，比如 <code>package-lock.json</code>、<code>pnpm-lock.yaml</code>、<code>yarn.lock</code>，就是把某一次解析的结果固定下来。它还记录了下载地址和 <code>integrity</code> 哈希，安装时会校验包的内容有没有被替换。</p>
<h2>npm install 和 npm ci 有什么不同</h2>
<p>锁文件不存在时，<code>npm install</code> 会解析依赖并生成一个，<code>npm ci</code> 直接报错。</p>
<p>锁文件和 <code>package.json</code> 不一致时，<code>npm install</code> 按 <code>package.json</code> 重新解析并更新锁文件，<code>npm ci</code> 报错退出。</p>
<p>已经有 <code>node_modules</code> 时，<code>npm install</code> 增量更新，<code>npm ci</code> 先删掉再重新装。</p>
<p>所以 <code>npm install</code> 可能会修改 <code>package.json</code> 或锁文件，<code>npm ci</code> 不会。</p>
<p>其他包管理器也有对应的做法：pnpm 是 <code>pnpm install --frozen-lockfile</code>，在 CI 环境里默认开启；Yarn 是 <code>yarn install --immutable</code>。</p>
<h2>什么时候更新锁文件</h2>
<p>新增、删除、升级依赖时，用 <code>npm install &lt;pkg&gt;</code> 或 <code>npm update</code> 更新锁文件，然后和代码一起提交、评审。</p>
<p>遇到合并冲突，不要手工编辑锁文件。先解决 <code>package.json</code> 的冲突，再重新运行安装，让工具生成锁文件。</p>
<p>库项目也应该提交锁文件，保证自己的开发和测试能复现。不过发布到 npm 以后，使用者不会读取库的 <code>package-lock.json</code>。</p>
<h2>锁文件管不到哪些东西</h2>
<p>Node.js 和包管理器的版本，锁文件管不到，要用 <code>engines</code>、<code>.nvmrc</code>、<code>packageManager</code> 字段固定。</p>
<p>安装脚本也管不到。<code>postinstall</code> 可能下载二进制文件，甚至执行任意代码，结果受网络和系统影响。CI 可以用 <code>--ignore-scripts</code> 配合白名单降低风险。</p>
<p>平台差异同样如此。可选依赖和原生模块会按操作系统和 CPU 选择不同的包。</p>
<h2>常见追问</h2>
<p><strong>为什么 CI 要用 <code>npm ci</code>？</strong></p>
<blockquote>
<p>因为它保证构建用的就是评审过的那棵依赖树。依赖声明和锁文件不一致时，它会尽早失败，而不是悄悄装出另一套依赖。</p>
</blockquote>
<p><strong>锁文件能防止供应链攻击吗？</strong></p>
<blockquote>
<p>能防一部分：已经固定的包如果被悄悄替换，哈希校验会失败。但它挡不住你主动升级到一个恶意版本，所以升级时仍然要审查。</p>
</blockquote>`};export{e as default};