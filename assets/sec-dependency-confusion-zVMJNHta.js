var e={answerHtml:`<h2>简答</h2>
<ul>
<li>依赖混淆是安装器从公共仓库取到与内部包同名的恶意包。</li>
<li>私有包使用组织作用域，并在配置中为该作用域明确 registry。</li>
<li>锁文件记录版本和完整性，但要审查 tarball 来源；安装脚本是高风险执行点。</li>
<li>注册作用域、限制发布权限，并在隔离环境验证各流水线的解析结果。</li>
</ul>
<p>公司内部使用 <code>@acme/ui</code>，构建机同时配置了私有 npm 仓库和公共 npm 仓库。某个包名或作用域配置不清时，安装器可能从错误的源获取同名包；攻击者只要发布一个更高版本的公共包，就可能在安装脚本或运行时代码中执行恶意逻辑。这类利用包名解析差异的攻击通常称为依赖混淆。</p>
<h2>包名和包源必须有明确边界</h2>
<p>私有包优先使用组织作用域，例如 <code>@acme/</code>，并在项目和用户配置中明确该作用域的 registry：</p>
<div class="not-prose code-block"><div class="code-language">ini</div><pre><code class="hljs language-ini">registry=https://registry.npmjs.org/
@acme:registry=https://npm.example.test/
</code></pre></div>
<p>示例只表达配置思路，实际地址和认证方式按公司包仓库文档设置。不要把私有令牌写进仓库的 <code>.npmrc</code>，也不要把整个 npm registry 无条件改成私有源而没有确认公共依赖的代理和完整性策略。最重要的是同一个包名在组织内只有一个权威来源，解析规则能被开发机、CI 和发布机一致使用。</p>
<p>作用域映射不是“同时从多个 registry 中选最高版本”：npm 会按配置为包选择 registry。风险可能来自作用域映射缺失、CI 配置覆盖，或私有仓库代理把内部名称回退到公共上游。正确映射且没有错误代理回退时，公共仓库出现更高版本并不自动覆盖内部包。因此排查要同时查看客户端配置和私有代理策略。</p>
<p>认证配置也应按 registry 主机及必要路径限定。按 npm 官方 npmrc 文档，_authToken 等凭据字段需要绑定对应 registry，避免发往错误主机；不应使用不带作用域的全局令牌。示例不加入跨版本不稳定的 always-auth 选项，实际所需配置按固定 npm 版本与仓库官方说明确定。检查配置时不要把令牌值输出到日志。</p>
<h2>锁文件记录版本，不一定证明来源</h2>
<p>锁文件通常记录解析后的版本、完整性哈希和 tarball 地址，但不同包管理器和版本对 registry、锁文件格式及配置的处理不同。审查锁文件时要确认包来源属于允许的域名，<code>resolved</code>、integrity 和依赖树没有被不明修改。不能只看到版本号固定就认为来源可信。</p>
<p>生产构建应使用冻结锁文件的安装模式，避免 CI 根据新的范围重新解析。依赖升级通过受保护分支和代码审查进行，审查包名、来源、维护者变更和安装脚本；不要让任意 Pull Request 在拥有生产密钥的任务中直接执行安装和构建。</p>
<h2>安装脚本是高风险执行点</h2>
<p>npm 包可能包含 <code>preinstall</code>、<code>install</code>、<code>postinstall</code> 等脚本，在安装阶段执行。对不需要原生编译的前端构建，可以评估 <code>ignore-scripts</code>，对确实需要脚本的包建立明确白名单并审查脚本内容。关闭脚本可能破坏合法依赖，不能把它当成唯一防线；应同时限制 CI 网络、文件权限和可访问的密钥。</p>
<p>依赖包运行时代码也可能读取环境变量、源码和构建目录。CI 任务应区分来自外部贡献的校验任务与可信发布任务，不把云密钥、npm 发布令牌或生产配置暴露给未经审查的代码。</p>
<h2>命名空间和发布权限要一起治理</h2>
<p>注册私有作用域并限制发布权限，可以减少公共仓库抢注相似名称的机会。组织内应禁止发布未授权的同名公共包，并监控依赖树是否出现从公共源解析的内部命名空间。包名称、作用域和仓库权限的变更要有审计记录；删除或转移包也可能影响后续安装。</p>
<p>如果历史项目已经使用无作用域私有包，迁移时不要直接把依赖名改成公共包同名。可以先建立明确的内部代理、固定 tarball 来源，再逐步改名和发布新版本，并用安装日志确认所有环境解析到同一来源。</p>
<h2>漏洞扫描不能发现所有依赖混淆</h2>
<p><code>npm audit</code> 和类似工具主要依据已知漏洞公告，恶意包可能没有公开 CVE，也可能在安装脚本、构建工具或开发依赖中执行。依赖治理还需要：</p>
<ul>
<li>允许的 registry 和包作用域清单；</li>
<li>锁文件和 tarball 完整性审查；</li>
<li>新依赖的维护、许可证和安装脚本评估；</li>
<li>构建环境最小权限和网络限制；</li>
<li>依赖异常行为、发布者和版本突变监控。</li>
</ul>
<p>这些控制应按风险分层，不能为了追求零告警而关闭所有自动更新或忽略维护者安全修复。</p>
<h2>测试和验证</h2>
<p>在隔离仓库中模拟同名公共包和私有包，验证开发机、CI、Docker 构建和发布流水线的解析结果。检查生成的锁文件、安装日志和网络请求；测试不能把真实令牌或内部包内容上传到公共 registry。升级包管理器后重新验证，因为默认 registry、锁文件和 workspace 行为可能变化。</p>
<h2>常见误区</h2>
<ul>
<li>只依赖包名相似度判断安全：解析 registry 和作用域才是关键。</li>
<li>只看锁文件版本：来源地址和完整性也要审查。</li>
<li>认为私有 registry 配置只在开发机生效：CI、容器和发布机必须一致。</li>
<li>在所有 CI 任务中提供发布令牌：外部代码可能执行安装脚本并窃取它。</li>
<li>关闭安装脚本后就不再审查依赖：运行时代码和构建工具仍然有风险。</li>
</ul>
<h2>参考资料</h2>
<ul>
<li><a href="https://docs.npmjs.com/using-npm/registry">npm · Configuring a registry</a></li>
<li><a href="https://docs.npmjs.com/cli/v11/using-npm/scripts">npm · package.json scripts</a></li>
<li><a href="https://docs.npmjs.com/cli/v11/configuring-npm/package-lock-json">npm · package-lock.json</a></li>
<li><a href="https://docs.npmjs.com/cli/v11/configuring-npm/npmrc">npm · npmrc 认证作用域与配置</a></li>
<li><a href="https://owasp.org/www-project-software-component-verification-standard/">OWASP · Software Supply Chain Security</a></li>
</ul>`};export{e as default};