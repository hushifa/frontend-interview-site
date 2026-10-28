var e={answerHtml:`<h2>简答</h2>
<ul>
<li>选包：核对包名和官方仓库地址，警惕拼写相似的仿冒包；关注维护活跃度和下载量，不引入只为一个小函数的依赖。</li>
<li>锁定：提交锁文件，CI 用 <code>npm ci</code> 严格按锁文件安装，版本变化只能通过审查过的提交进入。</li>
<li>执行与隔离：安装脚本可以在开发机和 CI 上运行任意代码，评估 <code>--ignore-scripts</code>；处理外部贡献的 CI 任务不接触发布令牌和云密钥。</li>
<li>发布：自己的 npm 账号开启双因素认证，用带来源证明的方式从 CI 发布，限制发布权限。</li>
<li><code>npm audit</code> 只覆盖已公开的漏洞，零告警不代表没有风险。</li>
</ul>
<h2>攻击类型</h2>
<table><thead><tr><th>类型</th><th>例子</th><th>主要防护</th></tr></thead><tbody><tr><td>仿冒包</td><td><code>reacct</code>、<code>lodahs</code></td><td>核对包名，安装前检查</td></tr><tr><td>账号被盗或维护者作恶</td><td>热门包的新版本里加了窃取代码</td><td>锁文件、延迟升级、审查变更</td></tr><tr><td>依赖混淆</td><td>公共仓库出现与内部包同名的包</td><td>作用域映射，见《前端项目如何防范依赖混淆攻击？》</td></tr><tr><td>构建插件</td><td>恶意 Vite、Babel 插件改写产物</td><td>只用可信插件，审查构建配置</td></tr><tr><td>CDN 被篡改</td><td>第三方托管的脚本被替换</td><td>自托管或使用 SRI</td></tr></tbody></table>
<h2>实践</h2>
<div class="not-prose code-block"><div class="code-language">bash</div><pre><code class="hljs language-bash"># CI 中按锁文件安装，不执行安装脚本
npm ci --ignore-scripts

# 查看某个包在安装时会执行什么
npm view some-package scripts
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-comment">&lt;!-- 从第三方 CDN 加载时用 SRI 校验内容 --&gt;</span>
<span class="hljs-tag">&lt;<span class="hljs-name">script</span>
  <span class="hljs-attr">src</span>=<span class="hljs-string">&quot;https://cdn.example/lib@1.2.3/lib.min.js&quot;</span>
  <span class="hljs-attr">integrity</span>=<span class="hljs-string">&quot;sha384-...&quot;</span>
  <span class="hljs-attr">crossorigin</span>=<span class="hljs-string">&quot;anonymous&quot;</span>
&gt;</span><span class="hljs-tag">&lt;/<span class="hljs-name">script</span>&gt;</span>
</code></pre></div>
<ul>
<li>依赖升级工具（如 Dependabot、Renovate）的提交要经过审查，可以设置新版本发布若干天后再升级，给社区发现恶意版本留时间。</li>
<li>把 CI 中的 shell 命令和不可信输入（PR 标题、分支名）隔离，不直接拼接进命令。</li>
<li>定期清理不再使用的依赖，依赖越少攻击面越小。</li>
</ul>
<h2>自己发布包时</h2>
<ul>
<li>开启双因素认证，使用细粒度、有过期时间的访问令牌。</li>
<li>从 CI 发布并生成来源证明（<code>npm publish --provenance</code>），让使用者能验证包是从哪个仓库和工作流构建的。</li>
<li>用 <code>files</code> 字段或 <code>.npmignore</code> 控制发布内容，避免把 <code>.env</code> 等文件发布出去。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li>devDependencies 也有风险吗？有。它们在开发机和 CI 上执行，可以读取环境变量，也能修改构建产物。</li>
<li>锁文件能防住一切吗？它只防止&quot;同一版本号的内容被替换&quot;以及意外升级；审查通过的新版本本身有问题，锁文件也会忠实地锁住它。</li>
</ul>`};export{e as default};