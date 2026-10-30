var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>以前在 GitHub Actions 里自动发 npm 包，要先在 npm 上生成一个长期有效的写令牌，存进仓库的 Secrets。这个令牌一旦被打印进日志、被恶意依赖读走，攻击者就能用它随时发布新版本，直到有人发现并吊销。</p>
<p>Trusted Publishing 换了一种思路：在 npm 的包设置里登记“只信任某个组织、某个仓库、某个工作流文件”。发布时，CI 平台用 OIDC 签发一个证明“我是这个工作流”的身份令牌，npm CLI 拿它换一个只对这次发布有效的短期令牌。仓库里不再有长期写令牌，也就没有可以泄露的东西。</p>
<p>provenance 解决的是另一头的问题：让使用者知道这个包是从哪份源码、哪个工作流构建的。通过 Trusted Publishing 从 GitHub Actions 或 GitLab 发布公开仓库里的公开包时，npm 会自动生成来源证明，由 Sigstore 签名并写进公开的透明日志，使用者可以用 <code>npm audit signatures</code> 校验。</p>
<p>要注意，这两者都不保证代码没有恶意。npm 文档说 provenance 只提供一条可验证的、指向源码和构建说明的链接，信不信要使用者自己审查；工作流本身被篡改，发出去的照样是合法签名的包。它还要求 npm CLI 11.5.1+、Node.js 22.14.0+，并且只支持云端托管的 runner。</p>
</blockquote>
<h2>长期令牌为什么危险</h2>
<p>npm 文档列出了传统令牌的几个风险：可能被意外打印进 CI 日志或配置文件；需要手动轮换；泄露后在吊销之前一直有效；权限经常比实际需要的大。</p>
<p>供应链攻击里，偷发包令牌是很直接的手段。拿到令牌就能以维护者的身份发一个带恶意代码的新版本。依赖层面的防范见<a href="/questions/security-supply-chain/">《前端依赖供应链风险应该怎样防范？》</a>。</p>
<h2>Trusted Publishing 是怎样换到令牌的</h2>
<p>先在 npmjs.com 的包设置里找到 Trusted Publisher，选择 CI 平台。以 GitHub Actions 为例，要填组织或用户名、仓库名、工作流文件名（只写文件名，比如 <code>publish.yml</code>，文件必须在 <code>.github/workflows/</code> 下），可以再填一个 GitHub 环境名。</p>
<p>然后在工作流里给出生成 OIDC 令牌的权限，发布命令照常写 <code>npm publish</code>，不用配置 <code>NODE_AUTH_TOKEN</code>：</p>
<div class="not-prose code-block"><div class="code-language">yaml</div><pre><code class="hljs language-yaml">permissions:
  id-token: write
  contents: read

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v6
        with:
          node-version: &#x27;24&#x27;
          registry-url: &#x27;https://registry.npmjs.org&#x27;
          package-manager-cache: false
      - run: npm ci
      - run: npm test
      - run: npm publish
</code></pre></div>
<p>文档说关键是 <code>id-token: write</code>，它允许 GitHub Actions 为这次运行生成 OIDC 令牌。npm CLI 会自动检测 OIDC 环境，优先用它认证，检测不到才退回传统令牌。换来的令牌是短期的、经过签名的、只属于这个工作流，文档的说法是无法被提取或重复使用。工作流、job、step 这些概念见<a href="/questions/git-ci/">《GitHub Actions 中 workflow、job、step 和 runner 是什么关系？》</a>。</p>
<p>示例里的 <code>package-manager-cache: false</code> 来自 npm 文档，注释是发布构建中不要用缓存。</p>
<h2>配好以后还要关掉旧的令牌发布</h2>
<p>配置 Trusted Publisher 后，传统的令牌发布并不会自动失效，npm 会同时接受两种方式。所以文档强烈建议再做一步：在包的 Settings → Publishing access 里选择 “Require two-factor authentication and disallow tokens”。这个设置只影响传统令牌，Trusted Publishing 用的是 OIDC，照常工作。</p>
<p>迁移顺序也有讲究：先配好 Trusted Publishing 并实际发布成功一次，再禁用令牌，最后吊销不再需要的自动化令牌。新建的配置必须在 2 天内完成第一次成功发布，否则会过期作废；npm 保存配置时不会校验仓库名、文件名对不对，填错了要到发布时才报错。</p>
<p>文档还建议配合 GitHub 的部署环境加审批，用标签保护规则限制谁能创建发布标签。因为 Trusted Publishing 信任的是“这个工作流”，谁能触发它，谁就能发包。</p>
<h2>provenance 证明了什么</h2>
<p>npm 的来源证明包括两种。provenance attestation 公开给出包的源码链接和构建说明，让开发者在下载前就能验证包是在哪里、怎样构建的；publish attestation 由 npm 注册表在授权用户发布时生成。</p>
<p>签名用的是 Sigstore。它的证书颁发机构验证 CI 的 OIDC 令牌，签发一张包含构建信息的短期签名证书，再把证书记进一个不可篡改的公开透明日志。文档说，这样即使包注册表本身被攻破，也有办法发现篡改。</p>
<p>开启方式有两种。走 Trusted Publishing 时，满足“从 GitHub Actions 或 GitLab CI/CD 发布、源码仓库公开、包是公开包”三个条件，就会自动生成，不用加 <code>--provenance</code>。不用 Trusted Publishing、仍用令牌发布时，可以在 GitHub Actions 或 GitLab CI/CD 的云端 runner 上手动加 <code>npm publish --provenance</code>，需要 npm CLI 9.5.0 以上，同样要 <code>id-token: write</code> 权限。两种方式都要求 <code>package.json</code> 的 <code>repository</code> 和实际发布的公开仓库一致，大小写敏感。</p>
<p>使用者这边，运行 <code>npm audit signatures</code> 会统计项目里有多少包通过了注册表签名校验、有多少包有经过验证的来源证明。</p>
<h2>它防不住什么</h2>
<p>npm 文档明确说，一个包有来源证明，并不保证它没有恶意代码。provenance 只证明“这个包确实是从某仓库某工作流构建的”。如果攻击者往仓库里合进了恶意代码，或者改了工作流，CI 照样会给恶意版本生成合法的证明。</p>
<p>所以它主要防的是“令牌被偷后，攻击者在自己电脑上发一个和源码对不上的版本”。仓库权限、代码审查、分支和标签保护仍然要做。来源证明和构建产物校验的关系，见<a href="/questions/git-artifact-integrity/">《前端发布怎样校验构建产物？文件哈希能证明发布安全吗？》</a>。</p>
<p>另外有几个边界。目前只支持云端托管的 runner（GitHub 托管 runner、GitLab.com 共享 runner、CircleCI cloud），自托管 runner 不支持；CircleCI 能用 Trusted Publishing，但不生成 provenance；私有仓库即使发布公开包，也不生成 provenance。</p>
<h2>常见追问</h2>
<p><strong>用了 Trusted Publishing，CI 安装私有依赖还需要令牌吗？</strong></p>
<blockquote>
<p>需要。Trusted Publishing 只管发布，<code>npm install</code>、<code>npm ci</code> 还是走传统认证。文档建议给安装步骤单独配一个只读的细粒度令牌，发布步骤用 OIDC，这样即使安装用的令牌泄露，也不能拿来发包。</p>
</blockquote>
<p><strong>npm publish 报 ENEEDAUTH，常见原因有哪些？</strong></p>
<blockquote>
<p>文档列的排查顺序是：先确认工作流文件名和 npm 上登记的完全一致，包括 <code>.yml</code> 扩展名，所有字段大小写敏感；再确认用的是云端托管 runner；GitHub Actions 还要检查有没有 <code>id-token: write</code>。如果发布是通过 <code>workflow_call</code> 调用的，校验的是调用方工作流的名字，两层工作流都要给 <code>id-token: write</code>。</p>
</blockquote>
<p><strong>发布工具不直接调用 npm publish 时，怎样开启 provenance？</strong></p>
<blockquote>
<p>文档给了三种办法：环境变量 <code>NPM_CONFIG_PROVENANCE=true</code>、<code>package.json</code> 的 <code>publishConfig.provenance</code> 或 <code>.npmrc</code> 里的 <code>provenance=true</code>，任选一种开启。Monorepo 的发包流程见<a href="/questions/eng-changesets/">《Monorepo 怎样管理版本和发包？Changesets 和 Lerna 有什么区别？》</a>。</p>
</blockquote>`};export{e as default};