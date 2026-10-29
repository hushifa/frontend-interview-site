var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>执行 <code>npm install</code> 时，你装进来的不只是自己选的那几个包，还有它们层层依赖的几百个包。这些代码会在安装、构建和运行时执行，其中任何一个有问题，都能读你的环境变量、改你的构建产物。这就是供应链风险。</p>
<p>防范从选包开始。核对包名和官方仓库地址，警惕 <code>reacct</code> 这种拼写相似的仿冒包；看维护是否活跃，不要为一个小函数引入一个依赖。然后是锁定，提交锁文件，CI 用 <code>npm ci</code> 严格按锁文件安装，版本变化只能通过审查过的提交进来。</p>
<p>执行环节要隔离。安装脚本能在开发机和 CI 上跑任意代码，要评估用 <code>--ignore-scripts</code>；处理外部贡献的 CI 任务不接触发布令牌和云密钥。自己发包时，npm 账号开启双因素认证，从 CI 带来源证明发布，限制发布权限。</p>
<p>要注意，<code>npm audit</code> 只覆盖已经公开的漏洞，零告警不代表没有风险。</p>
</blockquote>
<h2>有哪些攻击方式</h2>
<table><thead><tr><th>类型</th><th>例子</th><th>主要防护</th></tr></thead><tbody><tr><td>仿冒包</td><td><code>reacct</code>、<code>lodahs</code></td><td>核对包名，安装前检查</td></tr><tr><td>账号被盗或维护者作恶</td><td>热门包的新版本里加了窃取代码</td><td>锁文件、延迟升级、审查变更</td></tr><tr><td>依赖混淆</td><td>公共仓库出现与内部包同名的包</td><td>作用域映射，见<a href="/questions/sec-dependency-confusion/">《前端项目如何防范依赖混淆攻击？》</a></td></tr><tr><td>构建插件</td><td>恶意 Vite、Babel 插件改写产物</td><td>只用可信插件，审查构建配置</td></tr><tr><td>CDN 被篡改</td><td>第三方托管的脚本被替换</td><td>自托管或使用 SRI</td></tr></tbody></table>
<p>最难防的是第二种。包是真的，作者也是真的，只是某个新版本被动了手脚。所以单靠“选对包”不够，还要控制新版本什么时候、怎样进来。</p>
<h2>日常怎么做</h2>
<div class="not-prose code-block"><div class="code-language">bash</div><pre><code class="hljs language-bash"># CI 中按锁文件安装，不执行安装脚本
npm ci --ignore-scripts

# 查看某个包在安装时会执行什么
npm view some-package scripts
</code></pre></div>
<p>从第三方 CDN 加载脚本时，用 SRI 校验内容：</p>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-comment">&lt;!-- 从第三方 CDN 加载时用 SRI 校验内容 --&gt;</span>
<span class="hljs-tag">&lt;<span class="hljs-name">script</span>
  <span class="hljs-attr">src</span>=<span class="hljs-string">&quot;https://cdn.example/lib@1.2.3/lib.min.js&quot;</span>
  <span class="hljs-attr">integrity</span>=<span class="hljs-string">&quot;sha384-...&quot;</span>
  <span class="hljs-attr">crossorigin</span>=<span class="hljs-string">&quot;anonymous&quot;</span>
&gt;</span><span class="hljs-tag">&lt;/<span class="hljs-name">script</span>&gt;</span>
</code></pre></div>
<p><code>integrity</code> 里是文件内容的哈希。CDN 上的文件被换掉了，哈希对不上，浏览器就拒绝执行。</p>
<p>升级依赖也要讲究。Dependabot、Renovate 这类工具开的提交要经过审查，还可以设置成新版本发布若干天后再升级。为什么要等？因为不少恶意版本会在发布后不久被社区发现并下架，等一段时间能降低装到它的概率，但不能保证。</p>
<p>还有两件容易忽略的事。CI 里的 shell 命令不要直接拼接 PR 标题、分支名这类不可信输入，否则别人起个特殊的分支名就能注入命令。另外定期清理不用的依赖，依赖越少，攻击面越小。</p>
<h2>自己发布包时</h2>
<p>开启双因素认证，使用细粒度、有过期时间的访问令牌。从 CI 发布并生成来源证明，也就是 <code>npm publish --provenance</code>，使用者就能验证这个包是从哪个仓库、哪个工作流构建出来的。用 <code>files</code> 字段或 <code>.npmignore</code> 控制发布内容，避免把 <code>.env</code> 这类文件一起发出去。</p>
<h2>常见追问</h2>
<p><strong>devDependencies 也有风险吗？</strong></p>
<blockquote>
<p>有。它们不会进生产代码，可是会在开发机和 CI 上执行，能读环境变量，也能修改构建产物。</p>
</blockquote>
<p><strong>有了锁文件就万无一失了吗？</strong></p>
<blockquote>
<p>不是。锁文件只防止“同一个版本号的内容被替换”和意外升级。如果审查通过的新版本本身就有问题，锁文件也会忠实地把它锁住。</p>
</blockquote>`};export{e as default};