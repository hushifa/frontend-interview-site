var e={answerHtml:`<h2>简答</h2>
<ul>
<li>风险来源：内部包没有作用域（如 <code>acme-utils</code>），或私有仓库代理在找不到包、版本更低时回退到公共仓库，安装器取到了攻击者发布的更高版本。</li>
<li>内部包统一用作用域 <code>@acme/</code>，在 <code>.npmrc</code> 中写 <code>@acme:registry=...</code>，npm 对该作用域只查这个仓库。</li>
<li>在公共 npm 上注册同名组织，防止别人抢注 <code>@acme</code>。</li>
<li>CI 用 <code>npm ci</code> 按锁文件安装，审查锁文件中的 <code>resolved</code> 地址是否都来自允许的仓库。</li>
<li>恶意包常在 <code>preinstall</code>、<code>postinstall</code> 中执行，CI 中限制网络和密钥可以降低危害。</li>
</ul>
<h2>配置</h2>
<div class="not-prose code-block"><div class="code-language">ini</div><pre><code class="hljs language-ini"># 项目 .npmrc
@acme:registry=https://npm.internal.example/
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">ini</div><pre><code class="hljs language-ini"># 用户或 CI 的 .npmrc，令牌按主机绑定，不要提交到仓库
//npm.internal.example/:_authToken=\${NPM_INTERNAL_TOKEN}
</code></pre></div>
<ul>
<li>令牌必须绑定到具体仓库主机，避免发给错误的仓库。</li>
<li>私有仓库代理（如 Verdaccio、Nexus、Artifactory）要配置内部作用域不向上游代理，否则作用域映射也挡不住。</li>
</ul>
<h2>锁文件检查</h2>
<div class="not-prose code-block"><div class="code-language">bash</div><pre><code class="hljs language-bash"># 列出锁文件中所有不是来自允许仓库的包
node -e &quot;
const lock = require(&#x27;./package-lock.json&#x27;);
for (const [path, info] of Object.entries(lock.packages ?? {})) {
  if (info.resolved &amp;&amp; !/^https:\\/\\/(registry\\.npmjs\\.org|npm\\.internal\\.example)\\//.test(info.resolved)) {
    console.log(path, info.resolved);
  }
}&quot;
</code></pre></div>
<p>锁文件固定了版本、来源和 <code>integrity</code> 哈希，但提交新的锁文件时也可能引入错误来源，所以依赖变更要经过审查。</p>
<h2>安装脚本</h2>
<ul>
<li><code>npm ci --ignore-scripts</code> 可以阻止安装脚本执行，但会让需要编译原生模块的依赖失败，要评估后为必要的包单独处理。</li>
<li>拉取外部贡献的流水线不注入发布令牌和云密钥。</li>
<li>构建机只开放到包仓库和必要服务的网络出口，恶意脚本即使执行也难以外传数据。</li>
</ul>
<h2>历史项目迁移</h2>
<p>已有无作用域的内部包时，不要直接改名发布。先在私有仓库中为新作用域名发布相同代码，再逐个项目替换依赖，同时在公共 npm 上占位旧的包名或确认已被保护。</p>
<h2>常见追问</h2>
<ul>
<li><code>npm audit</code> 能发现吗？通常不能。它依据已知漏洞公告，新发布的恶意包没有公告。</li>
<li>和其他供应链攻击有什么关系？依赖混淆是其中一种，更全面的治理见<a href="/questions/security-supply-chain/">《前端依赖供应链风险应该怎样防范？》</a>。</li>
</ul>`};export{e as default};