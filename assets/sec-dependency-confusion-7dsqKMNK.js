var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>假设公司内部有个包叫 <code>acme-utils</code>，只发在私有仓库里。攻击者在公共 npm 上也发一个 <code>acme-utils</code>，版本号写得很高。如果私有仓库代理在找不到包或者版本更低时回退到公共仓库，安装器就会把攻击者的包装进来。这就是依赖混淆。</p>
<p>防护的核心是让内部包的名字只能从一个地方来。内部包统一用作用域，比如 <code>@acme/utils</code>，在 <code>.npmrc</code> 里写 <code>@acme:registry=...</code>，npm 对这个作用域只查私有仓库。同时在公共 npm 上把 <code>@acme</code> 这个组织名注册下来，防止别人抢注。</p>
<p>安装环节也要收紧。CI 用 <code>npm ci</code> 按锁文件安装，审查锁文件里的 <code>resolved</code> 地址是不是都来自允许的仓库。</p>
<p>要注意，恶意包通常在 <code>preinstall</code>、<code>postinstall</code> 这类安装脚本里动手，所以 CI 里还要限制网络和密钥，让它就算执行了也拿不走东西。</p>
</blockquote>
<h2>作用域映射怎么配</h2>
<div class="not-prose code-block"><div class="code-language">ini</div><pre><code class="hljs language-ini"># 项目 .npmrc
@acme:registry=https://npm.internal.example/
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">ini</div><pre><code class="hljs language-ini"># 用户或 CI 的 .npmrc，令牌按主机绑定，不要提交到仓库
//npm.internal.example/:_authToken=\${NPM_INTERNAL_TOKEN}
</code></pre></div>
<p>第一段告诉 npm，凡是 <code>@acme/</code> 开头的包都去内部仓库找。第二段把访问令牌绑定到具体的仓库主机，这样令牌不会被发给错误的仓库。</p>
<p>可是光配 <code>.npmrc</code> 还不够。很多公司用 Verdaccio、Nexus、Artifactory 这类私有仓库代理，它们本身也会向公共上游转发请求。如果代理没配置成“内部作用域不向上游代理”，npm 虽然只问了内部仓库，内部仓库却替它去公共 npm 拿了，作用域映射就挡不住。</p>
<h2>锁文件里要查什么</h2>
<p>锁文件记录了每个包的版本、下载地址和 <code>integrity</code> 哈希。下面的脚本列出锁文件中所有不是来自允许仓库的包：</p>
<div class="not-prose code-block"><div class="code-language">bash</div><pre><code class="hljs language-bash"># 列出锁文件中所有不是来自允许仓库的包
node -e &quot;
const lock = require(&#x27;./package-lock.json&#x27;);
for (const [path, info] of Object.entries(lock.packages ?? {})) {
  if (info.resolved &amp;&amp; !/^https:\\/\\/(registry\\.npmjs\\.org|npm\\.internal\\.example)\\//.test(info.resolved)) {
    console.log(path, info.resolved);
  }
}&quot;
</code></pre></div>
<p>有了锁文件为什么还要查？因为锁文件只保证“按它写的装”。如果某次提交引入的新锁文件里本来就记了一个错误的来源，它会忠实地照着装。所以依赖变更要经过审查。</p>
<h2>安装脚本怎么处理</h2>
<p><code>npm ci --ignore-scripts</code> 可以阻止安装脚本执行。可是需要编译原生模块的依赖会因此失败，所以要评估后对必要的包单独处理。</p>
<p>另外两件事是限制脚本执行后的危害。拉取外部贡献的流水线不注入发布令牌和云密钥。构建机只开放到包仓库和必要服务的网络出口，恶意脚本就算跑起来了，也很难把数据传出去。</p>
<h2>老项目怎么迁移</h2>
<p>已经有一批无作用域的内部包时，不要直接改名发布。先在私有仓库里用新的作用域名发布相同的代码，再逐个项目替换依赖。同时在公共 npm 上把旧的包名占住，或者确认它已经被保护起来。</p>
<h2>常见追问</h2>
<p><strong><code>npm audit</code> 能发现依赖混淆吗？</strong></p>
<blockquote>
<p>通常不能。<code>npm audit</code> 依据的是已知漏洞公告，攻击者新发布的恶意包还没有公告。</p>
</blockquote>
<p><strong>它和其他供应链攻击是什么关系？</strong></p>
<blockquote>
<p>依赖混淆是供应链攻击的一种。更全面的治理，比如仿冒包、维护者账号被盗，见<a href="/questions/security-supply-chain/">《前端依赖供应链风险应该怎样防范？》</a>。</p>
</blockquote>`};export{e as default};